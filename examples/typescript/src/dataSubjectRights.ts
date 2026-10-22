// 정보주체 권리: 내보내기(열람·전송)와 삭제 요청.
// - 본인만 요청 가능(대리인은 위임 확인 절차 별도). 내보내기는 응답 DTO 를 재사용해 내부 필드 배제.
// - 삭제: 운영 데이터 파기, 법정 보존 대상은 최소 항목만 분리보관, 계정 파기 후 세션 전부 폐기.
import { randomBytes } from "node:crypto";
import type { AuditLog } from "./auditLog.js";
import {
  type Clock, NotFoundError, type OrderRepository, PermissionDeniedError, systemClock, type UserStore,
} from "./domain.js";
import { toMyProfile, toOrderOut } from "./minimalResponse.js";
import type { Principal } from "./rbac.js";
import type { RetentionService } from "./retention.js";

export interface DeletionReport {
  userId: string;
  deletedRecords: number;
  retained: { recordType: string; basis: string }[];
  unclassifiedRecords: number;
  sessionsRevoked: number;
}

export class DataSubjectRightsService {
  constructor(
    private readonly users: UserStore,
    private readonly orders: OrderRepository,
    private readonly retention: RetentionService,
    private readonly audit: AuditLog,
    private readonly clock: Clock = systemClock,
    private readonly onAccountDeleted?: (userId: string) => number,
  ) {}

  private ensureSelf(actor: Principal, userId: string): void {
    if (actor.userId !== userId) throw new PermissionDeniedError("본인 데이터만 요청할 수 있습니다");
  }

  export(actor: Principal, userId: string): string {
    this.ensureSelf(actor, userId);
    const user = this.users.get(userId);
    if (!user) throw new NotFoundError(userId);
    const data = {
      profile: toMyProfile(user),
      orders: this.orders.listByOwner(userId).map(toOrderOut),
      records: this.retention.active.forUser(userId).map((r) => ({
        id: r.id, type: r.recordType, createdAt: r.createdAt.toISOString(), data: r.data,
      })),
      exportedAt: this.clock().toISOString(),
    };
    this.audit.record({ actorId: actor.userId, action: "dsr.export", subjectId: userId });
    return JSON.stringify(data, null, 2); // 기계 판독 가능한 형식(JSON)
  }

  delete(actor: Principal, userId: string, reason = "정보주체 삭제 요청"): DeletionReport {
    this.ensureSelf(actor, userId);
    if (!this.users.get(userId)) throw new NotFoundError(userId);
    const now = this.clock();

    // 1) 주문 → 계약 기록(최소 항목, 배송지 제외)으로 전환
    for (const o of this.orders.removeByOwner(userId)) {
      this.retention.active.add({
        id: `contract-${o.id}-${randomBytes(4).toString("hex")}`, recordType: "contract_record", userId,
        data: { orderId: o.id, item: o.item, amount: o.amount, orderedAt: o.createdAt.toISOString() },
        createdAt: now, retentionStart: null,
      });
    }
    // 2) 운영 기록 정리
    const sep = this.retention.endPurposeForUser(userId, actor.userId);
    const retained = this.retention.separated.forUser(userId)
      .filter((r) => sep.separated.includes(r.id))
      .map((r) => ({ recordType: r.recordType, basis: this.retention.policy.ruleFor(r.recordType)?.basis ?? "" }));
    // 3) 계정 파기 + 세션 폐기
    this.users.remove(userId);
    const sessionsRevoked = this.onAccountDeleted?.(userId) ?? 0;

    const report: DeletionReport = {
      userId, deletedRecords: sep.deleted.length, retained, unclassifiedRecords: sep.unclassified.length, sessionsRevoked,
    };
    this.audit.record({ actorId: actor.userId, action: "dsr.delete", subjectId: userId, reason, details: {
      deletedRecords: report.deletedRecords, retained: retained.length, unclassified: report.unclassifiedRecords,
    } });
    return report;
  }
}
