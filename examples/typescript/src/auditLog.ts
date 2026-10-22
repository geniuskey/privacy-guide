// 감사로그: 누가/언제/무엇을/누구의 정보에/어떤 행위를/왜. append-only + 해시 체인으로 변조 탐지.
// 체인만으로는 저장소 쓰기 권한자가 전체를 재계산할 수 있으므로, 운영에서는 HMAC 키를 KMS 에 두거나
// 최신 해시를 외부(WORM 스토리지 등)에 주기적으로 고정한다. 로그 자체에 개인정보 원문은 넣지 않는다.
import { createHash, createHmac } from "node:crypto";
import { type Clock, systemClock } from "./domain.js";
import { maskText, maskValue } from "./logMasking.js";

export const GENESIS_HASH = "0".repeat(64);

export interface AuditInput {
  actorId: string;
  action: string;
  subjectId?: string;
  resource?: string;
  reason?: string;
  result?: "success" | "denied" | "blocked";
  details?: Record<string, unknown>;
}

export interface AuditEvent {
  readonly seq: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly action: string;
  readonly subjectId: string | null;
  readonly resource: string | null;
  readonly reason: string | null;
  readonly result: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly prevHash: string;
  readonly hash: string;
}

/** 키 정렬된 JSON (해시 입력이 필드 순서에 의존하지 않게) */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object") {
    const entries = Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${canonicalJson(x)}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export class AuditLog {
  // 테스트에서 변조를 시뮬레이션하기 위해 protected 로 둔다. 외부 API 에는 수정/삭제가 없다.
  protected readonly entries: AuditEvent[] = [];

  constructor(private readonly clock: Clock = systemClock, private readonly hmacKey?: Buffer) {}

  private digest(e: Omit<AuditEvent, "hash">): string {
    const data = canonicalJson(e);
    return this.hmacKey
      ? createHmac("sha256", this.hmacKey).update(data).digest("hex")
      : createHash("sha256").update(data).digest("hex");
  }

  record(input: AuditInput): AuditEvent {
    const base: Omit<AuditEvent, "hash"> = {
      seq: this.entries.length,
      timestamp: this.clock().toISOString(),
      actorId: input.actorId,
      action: input.action,
      subjectId: input.subjectId ?? null,
      resource: input.resource ?? null,
      reason: input.reason ? maskText(input.reason) : null,
      result: input.result ?? "success",
      details: maskValue(input.details ?? {}) as Record<string, unknown>,
      prevHash: this.entries.at(-1)?.hash ?? GENESIS_HASH,
    };
    const event = Object.freeze({ ...base, hash: this.digest(base) });
    this.entries.push(event);
    return event;
  }

  events(filter: { subjectId?: string; action?: string } = {}): readonly AuditEvent[] {
    return this.entries.filter(
      (e) => (!filter.subjectId || e.subjectId === filter.subjectId) && (!filter.action || e.action === filter.action),
    );
  }

  verify(): { ok: boolean; brokenAt: number | null } {
    let prev = GENESIS_HASH;
    for (const [i, e] of this.entries.entries()) {
      const { hash, ...rest } = e;
      if (e.seq !== i || e.prevHash !== prev || hash !== this.digest(rest)) return { ok: false, brokenAt: i };
      prev = hash;
    }
    return { ok: true, brokenAt: null };
  }
}
