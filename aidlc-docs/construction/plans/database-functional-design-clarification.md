# Database Functional Design - Clarification Questions

답변을 분석한 결과 명확화가 필요한 부분들이 발견되었습니다.

---

## Clarification 1: Q2 Encrypted Password - Implementation Details

**원래 질문**: Table Password Storage  
**답변**: C - Encrypted (암호화 저장, 복호화 가능)

**발견된 불명확성**:
- 암호화 알고리즘이 무엇인지 명시되지 않음
- 암호화 키 관리 방법이 불명확
- 실제로 복호화가 필요한 시나리오가 있는지 불명확

**문제점**:
테이블 로그인 시 사용자가 입력한 비밀번호와 저장된 비밀번호를 비교해야 하는데:
- **복호화 방식**: 저장된 암호화된 값을 복호화해서 평문으로 비교
- **해싱 방식** (bcrypt): 입력값을 해싱해서 해시값끼리 비교 (복호화 불가능)

암호화를 선택했는데, 실제로 로그인 검증은 어떻게 할 계획인가요?

### Clarification Question 1
테이블 비밀번호 검증 방식을 명확히 해주세요.

A) **AES-256 암호화** - 암호화 저장, 로그인 시 복호화해서 평문 비교 (암호화 키는 환경 변수/AWS KMS)
B) **bcrypt 해싱으로 변경** - 원래 Q2의 Option A, 복호화 불가능하지만 더 안전 (추천)
C) **평문 저장으로 변경** - 원래 Q2의 Option B, 단순 PIN 코드라면 평문도 고려 가능
D) Other (please describe after [Answer]: tag below)

**추천**: B (bcrypt) - 테이블 비밀번호도 사용자 비밀번호처럼 취급하는 것이 보안상 안전

[Answer]: B

---

## Clarification 2: Q3 Archive Table - Schema and Migration Details

**원래 질문**: Session Management Strategy  
**답변**: C - Archive Table (sessions_archived 테이블로 이동)

**발견된 불명확성**:
- `sessions_archived` 테이블의 스키마가 정의되지 않음
- 세션 이동 시점이 불명확
- `orders.session_id` FK가 archived 테이블을 참조할 수 있는지 불명확

**문제점**:
- `orders` 테이블이 `sessions.id`를 FK로 참조하는데, 세션이 archived 테이블로 이동하면 FK 제약조건 위반
- 두 테이블 모두 참조 가능하게 하려면 복잡한 구조 필요

### Clarification Question 2
Archive 전략을 명확히 해주세요.

A) **Soft Close로 변경** - Q3의 Option A, `is_active = false`로 종료 표시, 데이터는 같은 테이블에 보존 (단순하고 FK 문제 없음, 추천)
B) **Archive with FK adjustment** - `sessions_archived` 테이블 생성, `orders.session_id`는 NULL 허용으로 변경 (archived 세션의 주문은 session_id = NULL)
C) **Archive with unified view** - `sessions_archived` 테이블 생성, `sessions_view` (UNION 뷰)로 통합 조회
D) Other (please describe after [Answer]: tag below)

**추천**: A (Soft Close) - 가장 단순하고 FK 제약조건 유지 가능

[Answer]: A

---

## Clarification 3: Q4 UUID Order Number - Format Details

**원래 질문**: Order Number Generation  
**답변**: C - UUID-Based

**발견된 불명확성**:
- Context에서 "ORD-20260406-001" 형식 예시가 있었는데 UUID를 선택
- UUID 기반의 정확한 형식이 명시되지 않음
- 순차성(순서)이 필요한지 불명확

**문제점**:
- 순수 UUID (예: "550e8400-e29b-41d4-a716-446655440000")는 날짜나 순서 정보가 없어 사용자 친화적이지 않음
- "ORD-abc123" 형태는 UUID 일부만 사용하는데 충돌 가능성 있음

### Clarification Question 3
Order Number 형식을 명확히 해주세요.

A) **순수 UUID v4** - "550e8400-e29b-41d4-a716-446655440000" (36자, 충돌 없음, 하지만 가독성 낮음)
B) **Short UUID** - "ORD-abc123def" (UUID 일부만 사용, 예: 처음 8자, 가독성 좋지만 충돌 가능성)
C) **Date + UUID Short** - "ORD-20260406-abc123" (날짜 + UUID 일부, 추천)
D) **Application-Generated로 변경** - Q4의 Option B, 백엔드에서 날짜 + counter 생성 (예: "ORD-20260406-001", 순차적, 추천)
E) Other (please describe after [Answer]: tag below)

**추천**: D (Application-Generated) - "ORD-20260406-001" 형태가 고객에게 가장 친화적이고 순서 파악 가능

[Answer]: D

---

## Clarification 4: Q8 Soft Delete - Scope Details

**원래 질문**: Soft Delete Support  
**답변**: C - Soft Delete for All (모든 주요 테이블에 deleted_at 추가)

**발견된 불명확성**:
- "모든 주요 테이블"이 정확히 어떤 테이블들인지 명시되지 않음
- Q3에서 `sessions`는 archive 전략을 선택했는데, soft delete도 적용?
- 완료된 주문(orders)도 soft delete 대상?

**문제점**:
- Soft delete 범위가 불명확하면 일관성 없는 설계
- 일부 테이블은 soft delete, 일부는 hard delete면 혼란

### Clarification Question 4
Soft Delete 적용 테이블을 명확히 해주세요.

A) **Limited Scope** - `menus`, `categories`, `users` 테이블만 (관리자가 실수로 삭제할 수 있는 데이터, 추천)
B) **Extended Scope** - `menus`, `categories`, `users`, `tables` 테이블 (테이블 설정 실수 복구 가능)
C) **All Except Orders/Sessions** - 모든 테이블 except `orders`, `order_items`, `sessions` (주문/세션은 영구 보존)
D) **Truly All** - 8개 테이블 모두 (`orders`, `sessions` 포함)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Limited Scope) - 실수로 삭제 가능한 마스터 데이터만 soft delete

추가로, Soft delete 적용 시:
- 모든 SELECT 쿼리에 `WHERE deleted_at IS NULL` 필터를 추가해야 합니까?
- 아니면 deleted 데이터도 조회 가능하게 할까요?

F) **Filter by default** - 모든 쿼리에서 기본적으로 deleted_at IS NULL 필터 (권장)
G) **Explicit filter** - 필요시에만 명시적으로 필터링

[Answer (scope)]: F
[Answer (filter)]: G

---

## Summary

총 4개의 Clarification Questions:
1. **CQ1**: 테이블 비밀번호 검증 방식 (암호화 vs 해싱)
2. **CQ2**: Archive 전략 상세 (Soft Close로 변경 권장)
3. **CQ3**: Order Number 형식 (Application-Generated 권장)
4. **CQ4**: Soft Delete 적용 범위 및 필터링 방식

**다음 단계:**
1. CQ1, CQ2, CQ3, CQ4에 답변해주세요
2. 모든 답변 완료 후 "완료" 또는 "done"이라고 알려주세요
3. 명확화 완료 후 Database functional design 아티팩트 생성
