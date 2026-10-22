// 보존기간 만료 데이터 삭제와 법정 보존 데이터 분리보관.
// - 보존기간은 처리 목적 종료 시점(retentionStart)부터 계산. null 이면 아직 이용 중.
// - 법정 보존 대상은 운영 저장소 → 분리보관 저장소로 이동, 목적 외 열람 차단.
// - 규칙 없는 유형은 지우지 않고 "미분류"로 보고. 보존기간·근거는 예시이며 법무 검토가 필요하다.
import type { AuditLog } from "./auditLog.js";
import { type Clock, PermissionDeniedError, systemClock } from "./domain.js";

export interface RetentionRule {
  recordType: string;
  years?: number;
  months?: number;
  days?: number;
  basis: string;
  legalHold?: boolean;
}

export const DEFAULT_RULES: readonly RetentionRule[] = [
  { recordType: "contract_record", years: 5, legalHold: true, basis: "전자상거래법 시행령 제6조: 계약·청약철회 기록 5년" },
  { recordType: "payment_record", years: 5, legalHold: true, basis: "전자상거래법 시행령 제6조: 대금결제·재화공급 기록 5년" },
  { recordType: "consumer_complaint", years: 3, legalHold: true, basis: "전자상거래법 시행령 제6조: 소비자 불만·분쟁처리 기록 3년" },
  { recordType: "login_log", months: 3, legalHold: true, basis: "통신비밀보호법 시행령 제41조: 로그기록자료 3개월" },
  { recordType: "support_chat", years: 1, basis: "내부 방침(예시): 상담 품질 관리 1년" },
  { recordType: "marketing_profile", basis: "동의 철회·탈퇴 시 지체 없이 파기" },
];

/** UTC 기준 기간 더하기. 말일 보정(2/29 + 1년 → 2/28). */
export function addPeriod(start: Date, { years = 0, months = 0, days = 0 }: Partial<RetentionRule>): Date {
  const total = start.getUTCMonth() + months + years * 12;
  const y = start.getUTCFullYear() + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const d = new Date(start);
  d.setUTCFullYear(y, m, Math.min(start.getUTCDate(), lastDay));
  return new Date(d.getTime() + days * 86_400_000);
}

export interface StoredRecord {
  id: string;
  recordType: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  retentionStart: Date | null;
}

export class RetentionPolicy {
  private rules: Map<string, RetentionRule>;
  constructor(rules: readonly RetentionRule[] = DEFAULT_RULES) {
    this.rules = new Map(rules.map((r) => [r.recordType, r]));
  }
  ruleFor(type: string): RetentionRule | undefined { return this.rules.get(type); }
  expiresAt(rec: StoredRecord): Date | null {
    const rule = this.ruleFor(rec.recordType);
    return rule && rec.retentionStart ? addPeriod(rec.retentionStart, rule) : null;
  }
}

export class RecordStore {
  protected records = new Map<string, StoredRecord>();
  add(r: StoredRecord): void { this.records.set(r.id, r); }
  delete(id: string): void { this.records.delete(id); }
  has(id: string): boolean { return this.records.has(id); }
  all(): StoredRecord[] { return [...this.records.values()]; }
  forUser(userId: string): StoredRecord[] { return this.all().filter((r) => r.userId === userId); }
}

/** 분리보관 저장소. 운영에서는 별도 DB/스키마·별도 권한·암호화로 분리한다. */
export class SeparatedStore extends RecordStore {
  static readonly ALLOWED_PURPOSES = new Set(["dispute", "legal_request", "tax_audit"]);

  read(id: string, opts: { purpose: string; actorId: string; audit: AuditLog }): StoredRecord {
    if (!SeparatedStore.ALLOWED_PURPOSES.has(opts.purpose)) {
      opts.audit.record({ actorId: opts.actorId, action: "separated.read", resource: `record:${id}`,
        result: "denied", reason: opts.purpose });
      throw new PermissionDeniedError("분리보관 데이터는 법정 목적 외 열람 불가");
    }
    const rec = this.records.get(id);
    if (!rec) throw new Error("not found");
    opts.audit.record({ actorId: opts.actorId, action: "separated.read", subjectId: rec.userId,
      resource: `record:${id}`, reason: opts.purpose });
    return rec;
  }
}

export interface SeparationReport { deleted: string[]; separated: string[]; unclassified: string[] }

export class RetentionService {
  constructor(
    readonly active: RecordStore,
    readonly separated: SeparatedStore,
    readonly policy: RetentionPolicy,
    readonly audit: AuditLog,
    private readonly clock: Clock = systemClock,
  ) {}

  /** 탈퇴 등 목적 종료: 법정 보존 대상은 분리보관, 나머지는 즉시 파기. */
  endPurposeForUser(userId: string, actorId = "system"): SeparationReport {
    const now = this.clock();
    const report: SeparationReport = { deleted: [], separated: [], unclassified: [] };
    for (const rec of this.active.forUser(userId)) {
      const rule = this.policy.ruleFor(rec.recordType);
      if (!rule) { report.unclassified.push(rec.id); continue; }
      this.active.delete(rec.id);
      if (rule.legalHold) {
        this.separated.add({ ...rec, retentionStart: rec.retentionStart ?? now });
        report.separated.push(rec.id);
      } else {
        report.deleted.push(rec.id);
      }
    }
    this.audit.record({ actorId, action: "retention.end_purpose", subjectId: userId, details: {
      deleted: report.deleted.length, separated: report.separated.length, unclassified: report.unclassified.length,
    } });
    return report;
  }
}

/** 주기 실행 파기 배치(멱등). 백업·캐시·검색 인덱스 파기는 별도로 관리해야 한다. */
export function runPurge(svc: RetentionService, clock: Clock = systemClock): { purged: string[]; unclassified: string[] } {
  const now = clock().getTime();
  const purged: string[] = [];
  const unclassified: string[] = [];
  for (const store of [svc.active, svc.separated]) {
    for (const rec of store.all()) {
      const rule = svc.policy.ruleFor(rec.recordType);
      if (!rule) { unclassified.push(rec.id); continue; }
      const exp = svc.policy.expiresAt(rec);
      if (exp && exp.getTime() <= now) {
        store.delete(rec.id);
        purged.push(rec.id);
        svc.audit.record({ actorId: "retention-job", action: "retention.purge", subjectId: rec.userId,
          resource: `record:${rec.id}`, details: { recordType: rec.recordType, basis: rule.basis } });
      }
    }
  }
  return { purged, unclassified };
}
