// 개발·테스트 환경용 데이터: 운영 덤프 변환과 픽스처 검사.
// - 모든 컬럼에 규칙(drop·null·pseudonym·fake·keep)을 명시하게 하고, 규칙 없는 컬럼이 있으면 멈춘다(fail closed).
// - 가명 대체는 키 있는 HMAC으로 결정적으로 만들어 같은 컬럼 안의 관계를 유지한다. 키는 개발 환경에 두지 않는다.
// - 픽스처·시드 파일에 실제처럼 보이는 주민등록번호·카드번호·휴대전화번호·이메일이 없는지 CI에서 검사한다.
// 가명처리된 운영 데이터도 개인정보다. 개발·테스트 목적이 법 제28조의2에 해당하는지는 review-required. 기본값은 합성 데이터.
import { createHmac } from "node:crypto";

export type Rule = "drop" | "null" | "pseudonym" | "fake" | "keep";
export interface ColumnPolicy { rule: Rule; fake?: (token: string) => unknown }
export type Policies = Record<string, Record<string, ColumnPolicy>>;
type Row = Record<string, unknown>;

export class UnclassifiedColumnError extends Error {}

export const fakeEmail = (t: string) => `user-${t.slice(0, 12)}@example.invalid`;
export const fakePhone = (t: string) => `010-0000-${String(parseInt(t.slice(0, 8), 16) % 10000).padStart(4, "0")}`;
export const fakeName = (t: string) => `테스트${String(parseInt(t.slice(0, 6), 16) % 100000).padStart(5, "0")}`;

export class DumpTransformer {
  constructor(private readonly policies: Policies, private readonly key: Buffer) {
    if (key.length < 32) throw new RangeError("가명 키는 32바이트 이상이어야 한다");
  }

  /** 운영 스키마의 모든 컬럼에 정책이 있는지 확인한다. 덤프 전에 CI에서 실행한다. */
  checkSchema(schema: Record<string, string[]>): void {
    const missing = Object.entries(schema)
      .flatMap(([t, cols]) => cols.filter((c) => !this.policies[t]?.[c]).map((c) => `${t}.${c}`))
      .sort();
    if (missing.length) throw new UnclassifiedColumnError(`정책이 없는 컬럼: ${missing.join(", ")}`);
  }

  transform(table: string, rows: Row[]): Row[] {
    const policy = this.policies[table];
    if (!policy) throw new UnclassifiedColumnError(`정책이 없는 테이블: ${table}`);
    return rows.map((row) => {
      const unknown = Object.keys(row).filter((c) => !policy[c]).sort();
      if (unknown.length) throw new UnclassifiedColumnError(`정책이 없는 컬럼: ${unknown.map((c) => `${table}.${c}`).join(", ")}`);
      const out: Row = {};
      for (const [col, value] of Object.entries(row)) {
        const p = policy[col]!;
        if (p.rule === "drop") continue;
        if (value == null || p.rule === "keep") out[col] = value;
        else if (p.rule === "null") out[col] = null;
        else {
          const tok = createHmac("sha256", this.key).update(`${table}.${col}\0${String(value)}`).digest("hex");
          out[col] = p.rule === "fake" && p.fake ? p.fake(tok) : `p_${tok.slice(0, 16)}`;
        }
      }
      return out;
    });
  }
}

const PATTERNS: Record<string, RegExp> = {
  주민등록번호: /(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-?[1-8]\d{6}(?!\d)/g,
  휴대전화번호: /(?<!\d)01[016789]-?(?!0000)\d{3,4}-?\d{4}(?!\d)/g,
  카드번호: /(?<!\d)(?:\d{4}[- ]?){3}\d{4}(?!\d)/g,
  이메일: /[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net|invalid)\b)(?![A-Za-z0-9-]+\.invalid\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
};

const luhnOk = (digits: string) =>
  [...digits].reverse().reduce((sum, ch, i) => {
    const d = Number(ch) * (i % 2 ? 2 : 1);
    return sum + (d > 9 ? d - 9 : d);
  }, 0) % 10 === 0;

export interface Finding { line: number; kind: string; excerpt: string }

/** 실제처럼 보이는 값을 찾는다. 리포트에는 원문 앞 4자만 남긴다. */
export function scanFixture(text: string): Finding[] {
  const findings: Finding[] = [];
  text.split("\n").forEach((line, i) => {
    for (const [kind, pat] of Object.entries(PATTERNS)) {
      for (const m of line.matchAll(pat)) {
        if (kind === "카드번호" && !luhnOk(m[0].replace(/\D/g, ""))) continue;
        findings.push({ line: i + 1, kind, excerpt: `${m[0].slice(0, 4)}…` });
      }
    }
  });
  return findings;
}
