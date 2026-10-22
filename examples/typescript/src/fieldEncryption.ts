// 필드 단위 암호화, 키 순환, 블라인드 인덱스 검색 (node:crypto만 사용).
// - 고시 제7조 대상 컬럼을 AES-256-GCM으로 암호화하고, 암호문에 키 ID를 함께 저장한다.
// - AAD에 "테이블.컬럼:레코드ID"를 묶어 암호문을 다른 행·컬럼에 복사해 붙이지 못하게 한다.
// - 동등 검색은 암호화 키와 다른 키의 HMAC 블라인드 인덱스로 한다.
// - 운영에서는 KMS/HSM이 데이터 키를 관리한다. 알고리즘·순환 주기는 예시이며 조직 암호 정책으로 확정해야 한다.
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const FORMAT = "enc:v1";
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export class DecryptionError extends Error {}

export interface FieldContext { table: string; column: string; recordId: string }

const aad = (c: FieldContext) => Buffer.from(`${c.table}.${c.column}:${c.recordId}`);

/** 키 ID → 256비트 데이터 키. active 키로만 암호화하고, 등록된 모든 키로 복호화한다. */
export class KeyRing {
  private keys = new Map<string, Buffer>();
  active: string | null = null;

  static generate(): Buffer { return randomBytes(32); }

  add(keyId: string, key: Buffer, { activate = true } = {}): void {
    if (key.length !== 32) throw new RangeError("AES-256 키는 32바이트여야 한다");
    if (keyId.includes(":")) throw new RangeError("키 ID에 ':'를 쓸 수 없다");
    this.keys.set(keyId, key);
    if (activate) this.active = keyId;
  }

  /** 재암호화가 끝난 키를 폐기한다. 이후 그 키의 암호문은 복호화할 수 없다. */
  retire(keyId: string): void {
    if (keyId === this.active) throw new RangeError("활성 키는 폐기할 수 없다");
    this.keys.delete(keyId);
  }

  get(keyId: string): Buffer | undefined { return this.keys.get(keyId); }
}

export class FieldCipher {
  constructor(private readonly ring: KeyRing) {}

  encrypt(plaintext: string, ctx: FieldContext): string {
    const kid = this.ring.active;
    if (!kid) throw new Error("활성 키가 없다");
    const nonce = randomBytes(NONCE_BYTES); // GCM은 같은 키에서 nonce를 재사용하면 안 된다
    const c = createCipheriv("aes-256-gcm", this.ring.get(kid)!, nonce).setAAD(aad(ctx));
    const ct = Buffer.concat([c.update(plaintext, "utf8"), c.final(), c.getAuthTag()]);
    return `${FORMAT}:${kid}:${nonce.toString("base64url")}:${ct.toString("base64url")}`;
  }

  decrypt(token: string, ctx: FieldContext): string {
    const { kid, nonce, ct } = parse(token);
    const key = this.ring.get(kid);
    if (!key) throw new DecryptionError(`키 ${kid}가 키링에 없다`);
    if (ct.length < TAG_BYTES) throw new DecryptionError("암호문이 너무 짧다");
    try {
      const d = createDecipheriv("aes-256-gcm", key, nonce).setAAD(aad(ctx));
      d.setAuthTag(ct.subarray(ct.length - TAG_BYTES));
      return Buffer.concat([d.update(ct.subarray(0, ct.length - TAG_BYTES)), d.final()]).toString("utf8");
    } catch {
      throw new DecryptionError("암호문 또는 AAD가 일치하지 않는다");
    }
  }

  keyIdOf(token: string): string { return parse(token).kid; }
  needsRotation(token: string): boolean { return this.keyIdOf(token) !== this.ring.active; }

  /** 옛 키 암호문을 활성 키로 다시 암호화한다. 이미 활성 키면 그대로 둔다(멱등). */
  rotate(token: string, ctx: FieldContext): string {
    return this.needsRotation(token) ? this.encrypt(this.decrypt(token, ctx), ctx) : token;
  }
}

function parse(token: string): { kid: string; nonce: Buffer; ct: Buffer } {
  const parts = token.split(":");
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== FORMAT) throw new DecryptionError("지원하지 않는 암호문 형식");
  return { kid: parts[2]!, nonce: Buffer.from(parts[3]!, "base64url"), ct: Buffer.from(parts[4]!, "base64url") };
}

/** '010-1234-5678', '010 1234 5678'이 같은 인덱스를 갖도록 숫자만 남긴다. */
export const normalizeDigits = (v: string) => v.replace(/\D/g, "");

/**
 * 암호화 컬럼의 동등 검색용 HMAC 인덱스.
 * 값의 범위가 좁은 데이터(전화번호 등)는 인덱스 키가 유출되면 대입 공격으로 역산될 수 있으므로 인덱스 키도 KMS로 관리한다.
 * 컬럼 컨텍스트를 섞고, 앞부분만 잘라 저장한다. 잘린 인덱스의 충돌은 복호화 후 재확인으로 걸러낸다.
 */
export class BlindIndex {
  constructor(private readonly key: Buffer, private readonly column: string, private readonly bits = 64) {
    if (key.length < 32) throw new RangeError("인덱스 키는 32바이트 이상이어야 한다");
  }
  of(value: string): string {
    const mac = createHmac("sha256", this.key).update(`${this.column}\0${value}`).digest();
    return mac.subarray(0, this.bits / 8).toString("base64url");
  }
}

export interface CustomerRow { id: string; name: string; phoneEnc: string; phoneBidx: string }

/** 전화번호를 암호화해 저장하고 블라인드 인덱스로 찾는 저장소. */
export class CustomerRepository {
  static readonly TABLE = "customers";
  readonly rows = new Map<string, CustomerRow>();

  constructor(private readonly cipher: FieldCipher, private readonly phoneIndex: BlindIndex) {}

  private ctx(id: string): FieldContext { return { table: CustomerRepository.TABLE, column: "phone", recordId: id }; }

  add(id: string, name: string, phone: string): CustomerRow {
    const p = normalizeDigits(phone);
    const row = { id, name, phoneEnc: this.cipher.encrypt(p, this.ctx(id)), phoneBidx: this.phoneIndex.of(p) };
    this.rows.set(id, row);
    return row;
  }

  phoneOf(id: string): string {
    const row = this.rows.get(id);
    if (!row) throw new Error("not found");
    return this.cipher.decrypt(row.phoneEnc, this.ctx(id));
  }

  findByPhone(phone: string): CustomerRow[] {
    const p = normalizeDigits(phone);
    const bidx = this.phoneIndex.of(p);
    return [...this.rows.values()]
      .filter((r) => r.phoneBidx === bidx) // 운영: WHERE phone_bidx = ?
      .filter((r) => this.phoneOf(r.id) === p); // 잘린 인덱스의 충돌 제거
  }

  /** 키 순환 배치. 활성 키가 아닌 암호문만 다시 암호화하고 처리한 행 수를 돌려준다. */
  rotateAll(batchSize = 100): number {
    let done = 0;
    for (const row of this.rows.values()) {
      if (done >= batchSize) break;
      if (this.cipher.needsRotation(row.phoneEnc)) {
        row.phoneEnc = this.cipher.rotate(row.phoneEnc, this.ctx(row.id));
        done++;
      }
    }
    return done;
  }
}
