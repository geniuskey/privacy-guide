// 외부 LLM 전송 데이터 필터링.
// 1) 허용 목록 필드만 선택 2) 텍스트 내 개인정보를 라벨 토큰으로 치환 3) 최종 프롬프트 재검사 후
// 남아 있으면 전송 차단(fail closed) 4) 전송 사실(필드·치환 건수)만 감사로그에 기록(프롬프트 원문 X).
// 정규식은 이름·주소를 못 잡으므로 해당 필드는 허용 목록에서 제외한다. 국외이전·위탁 고지 등은 별도 검토.
import type { AuditLog } from "./auditLog.js";
import { PII_PATTERNS, type PiiLabel } from "./logMasking.js";

export interface LLMClient { complete(prompt: string): Promise<string> }

export class BlockedPayloadError extends Error {}

/** 오프라인 가짜 클라이언트: 전송 대신 프롬프트를 기록한다. */
export class RecordingLLMClient implements LLMClient {
  readonly prompts: string[] = [];
  async complete(prompt: string): Promise<string> {
    this.prompts.push(prompt);
    return `[요약] ${prompt.length}자 분량의 문의를 요약했습니다.`;
  }
}

export const TICKET_SUMMARY_FIELDS = ["category", "product", "message"] as const;

const LABELS: Record<PiiLabel, string> = {
  TOKEN: "[TOKEN]", EMAIL: "[EMAIL]", RRN: "[RRN]", CARD: "[CARD]", PHONE: "[PHONE]",
};

export function redactForLlm(text: string): { text: string; count: number } {
  let count = 0;
  for (const p of PII_PATTERNS) {
    text = text.replace(p.re, () => { count += 1; return LABELS[p.label]; });
  }
  return { text, count };
}

export const containsPii = (text: string): boolean => PII_PATTERNS.some((p) => text.search(p.re) >= 0);

export function buildPayload(
  source: Record<string, unknown>, allowed: readonly string[], redact: typeof redactForLlm = redactForLlm,
): { payload: Record<string, string>; redactions: number } {
  const payload: Record<string, string> = {};
  let redactions = 0;
  for (const k of allowed) {
    const v = source[k];
    if (v === undefined || v === null) continue;
    const r = redact(String(v));
    payload[k] = r.text;
    redactions += r.count;
  }
  return { payload, redactions };
}

export class SafeLLMGateway {
  constructor(
    private readonly client: LLMClient,
    private readonly audit: AuditLog,
    private readonly redact: typeof redactForLlm = redactForLlm,
  ) {}

  async summarizeTicket(actorId: string, ticket: Record<string, unknown> & { id: string }): Promise<string> {
    const { payload, redactions } = buildPayload(ticket, TICKET_SUMMARY_FIELDS, this.redact);
    const prompt = ["다음 고객 문의를 한 문장으로 요약하세요.", ...Object.entries(payload).map(([k, v]) => `${k}: ${v}`)].join("\n");
    if (containsPii(prompt)) {
      this.audit.record({ actorId, action: "llm.send", resource: `ticket:${ticket.id}`, result: "blocked" });
      throw new BlockedPayloadError("PII detected after redaction");
    }
    this.audit.record({ actorId, action: "llm.send", resource: `ticket:${ticket.id}`,
      details: { fields: Object.keys(payload), redactions } });
    return this.client.complete(prompt);
  }
}
