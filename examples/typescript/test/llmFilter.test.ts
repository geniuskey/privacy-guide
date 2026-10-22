import { describe, expect, it } from "vitest";
import { AuditLog } from "../src/auditLog.js";
import {
  BlockedPayloadError, buildPayload, RecordingLLMClient, redactForLlm, SafeLLMGateway,
} from "../src/llmFilter.js";
import { PII_PATTERNS } from "../src/logMasking.js";

const TICKET = {
  id: "t-9", category: "환불", product: "모니터",
  message: "카드 1234 5678 9012 3456, 연락처 01098765432, 메일 kim@corp.kr, 주민 850505-2345678 확인 부탁",
  customerName: "홍길동", customerAddress: "서울시 종로구 1", internalNotes: "환불 남용 의심",
};

describe("외부 LLM 전송 필터링", () => {
  it("허용 목록 외 필드 제거", () => {
    expect(Object.keys(buildPayload(TICKET, ["category", "message"]).payload)).toEqual(["category", "message"]);
  });

  it("라벨 토큰 치환", () => {
    const r = redactForLlm(TICKET.message);
    expect(r.count).toBe(4);
    for (const t of ["[CARD]", "[PHONE]", "[EMAIL]", "[RRN]"]) expect(r.text).toContain(t);
  });

  it("가짜 클라이언트로 전달되는 프롬프트에 개인정보 없음", async () => {
    const fake = new RecordingLLMClient();
    const audit = new AuditLog();
    await new SafeLLMGateway(fake, audit).summarizeTicket("u-support", TICKET);
    const prompt = fake.prompts.at(-1)!;
    for (const s of ["홍길동", "종로구", "환불 남용", "kim@corp.kr", "01098765432", "850505", "3456"])
      expect(prompt).not.toContain(s);
    expect(PII_PATTERNS.some((p) => prompt.search(p.re) >= 0)).toBe(false);
    expect(audit.events({ action: "llm.send" })[0]?.details).toEqual({ fields: ["category", "product", "message"], redactions: 4 });
  });

  it("치환이 실패하면 전송 차단 (fail closed)", async () => {
    const fake = new RecordingLLMClient();
    const audit = new AuditLog();
    const broken = (text: string) => ({ text, count: 0 });
    await expect(new SafeLLMGateway(fake, audit, broken).summarizeTicket("u", TICKET)).rejects.toBeInstanceOf(BlockedPayloadError);
    expect(fake.prompts).toEqual([]);
    expect(audit.events({ action: "llm.send" })[0]?.result).toBe("blocked");
  });
});
