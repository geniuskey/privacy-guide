// 개인정보 로그 마스킹. 메시지와 구조화 필드(중첩 객체 포함)를 모두 마스킹한다.
// 정규식 마스킹은 최후 방어선이며, 애초에 개인정보를 로그에 넣지 않는 것이 우선이다.

export type PiiLabel = "TOKEN" | "EMAIL" | "RRN" | "CARD" | "PHONE";
export interface PiiPattern { label: PiiLabel; re: RegExp; mask: (m: string, ...g: string[]) => string }

// 순서 중요: 긴 숫자(주민번호/카드)를 전화번호보다 먼저. 한글 뒤 숫자를 위해 \b 대신 숫자 lookaround 사용.
export const PII_PATTERNS: readonly PiiPattern[] = [
  { label: "TOKEN", re: /\bbearer\s+[A-Za-z0-9\-._~+/]+=*/gi, mask: () => "Bearer [REDACTED]" },
  { label: "TOKEN", re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, mask: () => "[REDACTED_JWT]" },
  {
    label: "EMAIL",
    re: /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g,
    mask: (_m, a, d) => `${a}***@${d}`,
  },
  { label: "RRN", re: /(?<!\d)(\d{6})[-\s]?([1-8])\d{6}(?!\d)/g, mask: (_m, a, b) => `${a}-${b}******` },
  { label: "CARD", re: /(?<!\d)(?:\d{4}[-\s]?){3}(\d{4})(?!\d)/g, mask: (_m, last) => `****-****-****-${last}` },
  {
    label: "PHONE",
    re: /(?<!\d)(01[016789])[-\s.]?\d{3,4}[-\s.]?(\d{4})(?!\d)/g,
    mask: (_m, p, last) => `${p}-****-${last}`,
  },
];

export const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "accesstoken", "refreshtoken", "authorization",
  "cookie", "session", "residentnumber", "rrn", "cardnumber",
]);
export const REDACTED = "[REDACTED]";

const normKey = (k: string) => k.toLowerCase().replace(/[_-]/g, "");

export function maskText(text: string): string {
  return PII_PATTERNS.reduce((t, p) => t.replace(p.re, p.mask as (m: string, ...a: string[]) => string), text);
}

export function maskValue(value: unknown, key?: string): unknown {
  if (key !== undefined && SENSITIVE_KEYS.has(normKey(key))) return REDACTED;
  if (typeof value === "string") return maskText(value);
  if (Array.isArray(value)) return value.map((v) => maskValue(v));
  if (value instanceof Error) return { name: value.name, message: maskText(value.message) };
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskValue(v, k)]));
  }
  return value;
}

export interface LogEntry { level: "debug" | "info" | "warn" | "error"; msg: string; time: string; [k: string]: unknown }
export type Sink = (entry: LogEntry) => void;

/** 모든 출력이 마스킹을 거치도록 sink 앞에 끼우는 구조화 로거. */
export function createLogger(sink: Sink, clock: () => Date = () => new Date()) {
  const log = (level: LogEntry["level"]) => (msg: string, fields: Record<string, unknown> = {}) => {
    const masked = maskValue(fields) as Record<string, unknown>;
    sink({ ...masked, level, msg: maskText(msg), time: clock().toISOString() });
  };
  return { debug: log("debug"), info: log("info"), warn: log("warn"), error: log("error") };
}
