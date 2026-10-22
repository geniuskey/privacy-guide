---
title: 개인정보 암호화 — 무엇을, 어디서, 어떻게 암호화하나
description: 안전성 확보조치 기준 제7조의 암호화 대상(인증정보, 고유식별정보, 신용카드·계좌번호, 생체인식정보)과 저장·전송 구간 요구사항을 필드 레벨 암호화, KMS, 키 순환 설계로 옮깁니다.
category: storage-retention
status: review-required
lastVerified: 2026-10-23
tags: [암호화, 안전조치, 고유식별정보, 비밀번호, 키관리, 주민등록번호]
related: [sensitive-data/unique-identifiers, auth-access/authentication-session, storage-retention/access-logs, app-security/owasp-asvs-mapping]
sources: [pipa, pipa-decree, safety-notice, owasp-asvs-5, pipc-safety-guide]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 개인정보가 유출등이 되지 아니하도록 대통령령으로 정하는 바에 따라 기술적·관리적·물리적 안전조치를 해야 한다
    status: verified
  - source: pipa
    article: 제24조제3항, 제24조의2제2항
    kind: law
    summary: 고유식별정보는 암호화 등 안전성 확보 조치를, 주민등록번호는 암호화 조치를 통해 안전하게 보관해야 한다
    status: verified
  - source: pipa-decree
    article: 제30조제1항제4호
    kind: decree
    summary: 비밀번호 일방향 암호화 등 인증정보 암호화 저장, 고시로 정하는 정보의 암호화 저장, 정보통신망 송수신 시 암호화 또는 이에 상응하는 조치
    status: verified
  - source: pipa-decree
    article: 제21조의2
    kind: decree
    summary: 주민등록번호를 전자적인 방법으로 보관하는 개인정보처리자는 암호화 적용 대상(적용 시기 2017.1.1. 또는 2018.1.1.로 이미 경과)
    status: verified
  - source: safety-notice
    article: 제7조
    kind: notice
    summary: 인증정보 저장·송수신 암호화(비밀번호는 일방향), 이용자의 주민등록번호·여권번호·운전면허번호·외국인등록번호·신용카드번호·계좌번호·생체인식정보 저장 시 암호화, 인터넷망 구간 송수신 암호화, 취급자 PC·모바일·보조저장매체 저장 시 암호화, 일정 규모 이상 처리자의 암호 키 관리 절차
    status: verified
  - source: owasp-asvs-5
    article: V11 Cryptography, V12 Secure Communication, V14 Data Protection
    kind: standard
    summary: 알고리즘·키 관리, 전송 구간 TLS, 저장 데이터 보호에 관한 검증 요구사항(장 단위 인용, 세부 번호는 원문 확인 필요)
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 안전한 암호 알고리즘의 예시와 키 관리 절차 해설(원문 대조 전)
    status: review-required
---

## 한 문장 결론

비밀번호는 **복호화할 수 없는 일방향 암호화**, 주민등록번호·여권번호·운전면허번호·외국인등록번호·신용카드번호·계좌번호·생체인식정보는 **저장 시 암호화**, 인터넷 구간 송수신은 **전송 구간 암호화**가 고시 제7조의 기본값입니다. 디스크 전체 암호화만으로 이 요구를 모두 충족했다고 보기는 어려우므로 필드 레벨 암호화와 키 관리 절차를 함께 설계하는 편이 안전합니다.

## 적용 조건과 예외

「개인정보의 안전성 확보조치 기준」(고시 제2026-9호) 제7조는 대상 정보와 구간에 따라 요구가 다릅니다.

| 항 | 대상 | 구간 | 요구 |
| --- | --- | --- | --- |
| ① | 비밀번호, 생체인식정보 등 **인증정보** | 저장, 정보통신망 송·수신 | 안전한 암호 알고리즘으로 암호화. **비밀번호 저장은 일방향 암호화** |
| ② | **이용자**의 주민등록번호, 여권번호, 운전면허번호, 외국인등록번호, 신용카드번호, 계좌번호, 생체인식정보 | 저장 | 안전한 암호 알고리즘으로 암호화 |
| ③ | **이용자가 아닌 정보주체**의 고유식별정보 | 인터넷망·DMZ 저장, 내부망 저장 | 암호화. 단, 내부망에 주민등록번호 **외의** 고유식별정보를 저장할 때는 영향평가 결과(공공기관) 또는 위험도 분석 결과로 적용 여부·범위를 정할 수 있음 |
| ④ | 개인정보 전반 | 인터넷망 구간 송·수신 | 안전한 암호 알고리즘으로 암호화 |
| ⑤ | 이용자의 개인정보, 이용자가 아닌 정보주체의 고유식별정보·생체인식정보 | 개인정보취급자의 컴퓨터, 모바일 기기, 보조저장매체 저장 | 암호화 후 저장 |
| ⑥ | 10만명 이상 처리 대기업·중견기업·공공기관, 100만명 이상 처리 중소기업·단체 | 키 관리 | 암호 키 생성·이용·보관·배포·파기 절차 수립·시행 |

경계와 주의:

- **"이용자"의 범위**: 고시 제2조제2호는 이용자를 「정보통신망법」상 정보통신서비스 제공자가 제공하는 서비스를 이용하는 자로 정의합니다. 일반 웹 서비스 회원은 보통 이용자에 해당하고, 사내 직원 데이터는 "이용자가 아닌 정보주체"(③항)로 따로 검토할 가능성이 큽니다. 서비스가 어느 쪽인지는 법무 검토 대상입니다(`review-required`).
- **주민등록번호**는 법 제24조의2제2항에 따라 별도로 암호화 보관 의무가 있고, 시행령 제21조의2의 적용 시기(100만명 미만 2017.1.1., 100만명 이상 2018.1.1.)는 이미 지났습니다. 내부망이라는 이유로 예외를 둘 수 없습니다(고시 제7조제3항제2호 단서도 주민등록번호를 제외).
- **"안전한 암호 알고리즘"**의 구체적 목록은 고시 본문에 없습니다. 안내서·KISA 자료의 권고 알고리즘 목록은 원문 대조 전이므로 `review-required`입니다.
- 이메일, 전화번호, 주소 등은 고시 제7조제2항의 저장 시 암호화 열거 대상은 아니지만, 고시 제3조는 보유 수·유형·영향을 고려해 스스로 필요한 조치를 적용하라고 합니다. 암호화 여부는 위험 분석으로 결정합니다.

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 개인정보가 유출등이 되지 아니하도록 "대통령령으로 정하는 바에 따라 안전성 확보에 필요한 기술적ㆍ관리적 및 물리적 조치"를 하여야 합니다.
- 제24조제3항(고유식별정보), 제24조의2제2항(주민등록번호): 주민등록번호는 "암호화 조치를 통하여 안전하게 보관"해야 합니다.
- 시행령 제30조제1항제4호: 가목 "비밀번호의 일방향 암호화 저장 등 인증정보의 암호화 저장", 나목 "주민등록번호 등 보호위원회가 정하여 고시하는 정보의 암호화 저장", 다목 정보통신망 송·수신 시 암호화 "또는 이에 상응하는 조치".
- 시행령 제21조의2: 주민등록번호를 전자적인 방법으로 보관하는 개인정보처리자가 암호화 적용 대상.
- 고시 제7조제1항 단서: "비밀번호를 저장하는 경우에는 복호화되지 아니하도록 일방향 암호화하여 저장하여야 한다."

(법률 제21445호, 시행령 대통령령 제36671호, 고시 제2026-9호 기준. 2026-10-23 국가법령정보센터 원문과 대조.)

## 개발자용 실무 해설

1. **해시와 암호화를 구분합니다.** 비밀번호는 검증만 하면 되므로 일방향(해시)으로 저장합니다. 고시가 말하는 "일방향 암호화"를 구현할 때는 솔트와 작업 비용이 있는 비밀번호 전용 함수(Argon2id, scrypt, bcrypt, PBKDF2)를 씁니다. SHA-256 한 번은 빠른 해시라 무차별 대입에 약합니다(OWASP ASVS V11 권고, 세부 항목 번호는 `review-required`).
2. **주민등록번호, 계좌번호 등은 복호화가 필요하므로 대칭키 암호화**(AES-GCM 등 인증 암호)를 씁니다. 검색이 필요하면 원문 대신 **키가 있는 해시(HMAC) 인덱스 컬럼**을 따로 둡니다. 일반 해시로 인덱스를 만들면 주민등록번호처럼 경우의 수가 작은 값은 쉽게 역산됩니다.
3. **디스크/DB 투명 암호화(TDE)는 보조 수단입니다.** DB 계정이 탈취되면 평문이 그대로 조회됩니다. 고시 제7조제2항 대상은 애플리케이션 레벨(필드) 암호화를 기본으로 두고 TDE를 더하는 구성이 설명하기 쉽습니다. TDE만으로 충분한지는 안내서 해석에 달려 있어 `review-required`로 둡니다.
4. **키는 데이터와 분리합니다.** 봉투 암호화(envelope encryption): KMS의 마스터 키(KEK)로 데이터 키(DEK)를 감싸고, DB에는 암호문과 `key_id`만 저장합니다. 고시 제7조제6항 대상 규모라면 키 생성·이용·보관·배포·파기 절차를 문서로 갖춰야 하고, 그렇지 않더라도 같은 구조를 쓰는 편이 안전합니다.
5. **키 순환은 재암호화 배치와 짝입니다.** 새 키 버전으로 쓰기를 전환하고, 기존 데이터는 배치로 다시 암호화한 뒤 이전 키를 폐기합니다. 백업에 남은 이전 키 암호문을 고려해 키 폐기 시점을 백업 보존 기간과 맞춥니다.
6. **전송 구간**: 외부 구간은 TLS 1.2 이상(ASVS V12 권고)을 기본으로 두고, 내부 서비스 간 통신도 개인정보가 흐르면 mTLS를 검토합니다. 고시 제7조제4항은 "인터넷망 구간"을 명시하고 있습니다.
7. **다운로드 파일·로컬 저장**: 관리자 화면에서 받은 엑셀 파일이 취급자 PC에 저장되면 제7조제5항 대상입니다. 파일 암호화(비밀번호 설정 등)나 다운로드 자체를 줄이는 설계를 함께 봅니다. → [공개 데이터와 다운로드](/data-sharing/public-data-and-downloads/)

## 권장 설계

```text
users
├─ id
├─ password_hash        ← Argon2id (일방향, 고시 제7조①)
├─ rrn_ciphertext       ← AES-256-GCM, DEK로 암호화 (법 제24조의2②, 고시 제7조②)
├─ rrn_key_id           ← 어떤 DEK 버전으로 암호화했는지
├─ rrn_hmac             ← 중복 가입 확인용 HMAC-SHA256 (별도 키)
└─ email                ← 위험 분석 결과에 따라 암호화 여부 결정 (고시 제3조)

KMS
├─ KEK (KMS 밖으로 나오지 않음, 접근은 서비스 계정만)
└─ DEK v1, v2 ...  (KEK로 감싼 형태로만 저장)
```

- 암호화·복호화 호출은 한 모듈로 모으고, 복호화는 필요한 화면/API에서만 명시적으로 호출합니다.
- 복호화 이벤트를 접속기록에 남깁니다. → [접속기록 보관·점검](/storage-retention/access-logs/)
- 키 관리 절차 문서(생성, 접근권한, 순환 주기, 폐기)를 내부 관리계획(고시 제4조제1항제7호)에 연결합니다.

## 위험한 설계

- 비밀번호를 AES로 암호화해 저장(복호화 가능) 또는 솔트 없는 MD5/SHA-1 저장
- 주민등록번호를 SHA-256 해시만으로 "암호화했다"고 보고 검색 키로 사용
- 암호화 키를 소스 코드, `.env` 파일, 같은 DB 테이블에 저장
- TDE만 켜고 애플리케이션 계정이 평문을 `SELECT *`로 받는 구조
- 키 순환 후 이전 키를 즉시 삭제해 백업 복구가 불가능해지거나, 반대로 이전 키를 영구 보관
- 관리자 엑셀 다운로드 파일을 암호화 없이 메일로 전달

## Python/TypeScript 구현 예제

```python
# 비밀번호: 일방향(Argon2id) / 고유식별정보: AES-GCM 봉투 암호화 + HMAC 검색 인덱스
import hmac, hashlib, os
from argon2 import PasswordHasher
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ph = PasswordHasher()  # 기본 파라미터는 라이브러리 권장값. 운영 전 비용 파라미터 점검

def hash_password(raw: str) -> str:
    return ph.hash(raw)

def verify_password(stored: str, raw: str) -> bool:
    try:
        return ph.verify(stored, raw)
    except Exception:
        return False

class FieldCipher:
    def __init__(self, kms, index_key: bytes):
        self.kms = kms            # get_data_key(key_id) -> bytes, current_key_id() -> str
        self.index_key = index_key

    def encrypt(self, plaintext: str, aad: bytes) -> tuple[str, bytes]:
        key_id = self.kms.current_key_id()
        nonce = os.urandom(12)
        ct = AESGCM(self.kms.get_data_key(key_id)).encrypt(nonce, plaintext.encode(), aad)
        return key_id, nonce + ct

    def decrypt(self, key_id: str, blob: bytes, aad: bytes) -> str:
        nonce, ct = blob[:12], blob[12:]
        return AESGCM(self.kms.get_data_key(key_id)).decrypt(nonce, ct, aad).decode()

    def search_index(self, plaintext: str) -> str:
        return hmac.new(self.index_key, plaintext.encode(), hashlib.sha256).hexdigest()

# aad에 user_id를 넣으면 다른 행의 암호문을 복사해 넣는 공격을 막을 수 있다
```

```ts
// Node.js: 키 순환 배치 — 이전 key_id로 암호화된 행을 새 키로 재암호화
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type Row = { id: string; keyId: string; blob: Buffer };

function decrypt(key: Buffer, blob: Buffer, aad: Buffer): Buffer {
  const iv = blob.subarray(0, 12), tag = blob.subarray(blob.length - 16);
  const d = createDecipheriv('aes-256-gcm', key, iv).setAAD(aad);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(blob.subarray(12, blob.length - 16)), d.final()]);
}

function encrypt(key: Buffer, plain: Buffer, aad: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv).setAAD(aad);
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, ct, c.getAuthTag()]);
}

export function rotate(row: Row, keys: Map<string, Buffer>, newKeyId: string): Row {
  const aad = Buffer.from(row.id);
  const plain = decrypt(keys.get(row.keyId)!, row.blob, aad);
  return { id: row.id, keyId: newKeyId, blob: encrypt(keys.get(newKeyId)!, plain, aad) };
}
```

필드 단위 AES-256-GCM 암호화(AAD로 행·컬럼 바인딩), 키 ID를 포함한 암호문 형식과 배치 재암호화, HMAC 블라인드 인덱스 검색의 실행 예제와 테스트는 `examples/python-fastapi/src/kr_privacy_examples/field_encryption.py`, `examples/typescript/src/fieldEncryption.ts`에 있습니다. → [구현 예제](/tools/examples/)

## 개발 체크리스트

- [ ] 비밀번호는 솔트와 작업 비용이 있는 일방향 함수로 저장하고, 복호화 경로가 없다
- [ ] 주민등록번호·여권번호·운전면허번호·외국인등록번호·신용카드번호·계좌번호·생체인식정보 컬럼이 저장 시 암호화되어 있다
- [ ] 암호화 필드 검색은 평문 해시가 아니라 별도 키의 HMAC 인덱스로 한다
- [ ] 암호화 키가 코드·설정 파일·같은 DB에 없고 KMS/HSM 또는 비밀 관리 시스템에 있다
- [ ] 키 순환 절차(재암호화 배치, 이전 키 폐기 시점)가 문서화되어 있다
- [ ] 외부 구간은 TLS를 강제하고(HTTP 차단, HSTS), 내부 구간도 개인정보 흐름을 기준으로 검토했다
- [ ] 관리자 다운로드 파일과 취급자 PC 저장 파일의 암호화 방안이 있다
- [ ] 고시 제7조제6항 규모 기준(10만명/100만명)에 해당하는지 확인하고 키 관리 절차를 내부 관리계획에 반영했다
- [ ] 서비스 사용자가 고시상 "이용자"인지, "이용자가 아닌 정보주체"인지 법무 확인을 받았다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 안전한 암호 알고리즘 목록과 TDE 인정 여부 등 안내서 해석은 원문 대조 전이라 `review-required`입니다.
