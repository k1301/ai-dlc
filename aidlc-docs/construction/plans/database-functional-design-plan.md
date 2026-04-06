# Database Unit - Functional Design Plan

## Unit Context

**Unit Name**: Database  
**Unit Type**: Database Schema  
**Purpose**: 데이터 저장 및 스키마 관리

**Responsibilities**:
- 데이터베이스 스키마 정의
- 마이그레이션 관리
- 시드 데이터 제공
- 인덱스 및 제약조건 관리

**Stories Supported**: 10 stories (Story 1, 2, 4, 5, 6, 7, 8, 9, 10, 11)

---

## Functional Design Objectives

Database unit의 functional design은 다음을 정의합니다:
1. **Domain Entities** - 8개 테이블의 상세 스키마
2. **Relationships** - 테이블 간 관계 (FK, constraints)
3. **Business Rules** - 데이터 무결성, 제약조건, 기본값
4. **Data Flows** - 데이터 삽입/조회 패턴
5. **Indexes** - 성능 최적화를 위한 인덱스

---

## Design Questions

다음 질문들에 답변하여 Database functional design 방향을 결정해주세요.

---

### Question 1: Store Model (Multi-tenancy)
현재 설계에서 `stores` 테이블이 있는데, 실제로 **여러 매장**을 지원할 계획인가요?

**Context**: 
- 현재 모든 테이블에 `store_id` FK가 있음
- Requirements에는 단일 매장 언급만 있었음

A) **Single Store Only** - 현재는 단일 매장만 지원, 향후 확장 대비해 store_id 유지 (store_id는 항상 1개 row)
B) **Multi-Store Support** - 실제로 여러 매장을 처음부터 지원 (같은 DB에 여러 매장 데이터)
C) **Remove Store Concept** - store_id를 제거하고 단일 매장으로 단순화
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2: Table Password Storage
테이블 태블릿의 `password` 저장 방식은?

**Context**:
- `tables.password` 컬럼이 있음
- 테이블 로그인에 사용됨

A) **Hashed (bcrypt)** - 관리자 비밀번호처럼 bcrypt 해싱
B) **Plain Text** - 단순 PIN 코드처럼 평문 저장 (예: "1234")
C) **Encrypted** - 암호화 저장 (복호화 가능)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 3: Session Management Strategy
테이블 세션(`sessions` 테이블)의 관리 전략은?

**Context**:
- 세션은 테이블 이용 시작부터 종료까지
- `is_active` 플래그와 `completed_at` 타임스탬프가 있음

A) **Soft Close** - `is_active = false`로 종료 표시, 데이터는 영구 보존
B) **Hard Delete** - 세션 종료 시 orders는 보존하지만 session row는 삭제
C) **Archive Table** - 종료된 세션은 별도 `sessions_archived` 테이블로 이동
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 4: Order Number Generation
`orders.order_number` (예: "ORD-20260406-001") 생성 방식은?

**Context**:
- 주문 번호는 고객에게 표시됨
- 유니크해야 하며 순차적이면 좋음

A) **Database Sequence** - PostgreSQL SEQUENCE 사용, 애플리케이션에서 포맷팅
B) **Application-Generated** - 백엔드에서 생성 (날짜 + counter), DB는 단순 저장
C) **UUID-Based** - UUID 기반 (예: "ORD-abc123...")
D) **Trigger-Generated** - DB Trigger로 자동 생성
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 5: Menu Image URL Storage
`menus.image_url`에 저장되는 URL 형식은?

**Context**:
- Requirements에서 "외부 URL 사용" 명시됨
- 실제 이미지 호스팅은 어디인지 확인 필요

A) **Full External URL** - 완전한 URL (예: "https://example.com/images/pizza.jpg")
B) **S3 Key Only** - S3 bucket key만 저장 (예: "images/pizza.jpg"), base URL은 앱 설정
C) **Relative Path** - 상대 경로만 (예: "/images/pizza.jpg")
D) **CDN URL** - CloudFront 등 CDN URL
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

### Question 6: Order Status Enum
`orders.status` 컬럼의 가능한 값들은?

**Context**:
- Requirements에서 "pending/preparing/completed" 언급
- 추가 상태가 필요한지 확인

A) **3 States Only** - pending, preparing, completed (Requirements 그대로)
B) **Add Cancelled** - pending, preparing, completed, cancelled (주문 취소 지원)
C) **More Granular** - pending, confirmed, preparing, ready, completed, cancelled
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 7: Price Data Type
가격 필드(`menus.price`, `orders.total_amount`, `order_items.unit_price`, `order_items.subtotal`)의 데이터 타입은?

**Context**:
- 금액 계산의 정확성이 중요함
- PostgreSQL의 여러 numeric 타입 선택 가능

A) **INTEGER (cents)** - 정수로 센트 단위 저장 (15000 = 150.00원)
B) **DECIMAL(10, 2)** - 고정 소수점 (15000.00)
C) **NUMERIC** - 가변 정밀도 numeric
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 8: Soft Delete Support
삭제된 데이터(메뉴, 주문 등)를 소프트 삭제할까요?

**Context**:
- 관리자가 실수로 삭제한 데이터 복구 가능
- 또는 완전 삭제 (HARD DELETE)

A) **No Soft Delete** - 모든 삭제는 실제 DELETE (단, 완료된 주문은 보존)
B) **Soft Delete for Menus** - 메뉴만 `deleted_at` 컬럼 추가
C) **Soft Delete for All** - 모든 주요 테이블에 `deleted_at` 추가
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 9: Timestamp Precision
`created_at`, `updated_at` 타임스탬프의 정밀도는?

**Context**:
- 주문 시간 순서가 중요할 수 있음
- PostgreSQL은 microsecond 지원

A) **TIMESTAMP (second precision)** - 초 단위 (2026-04-06 10:30:45)
B) **TIMESTAMPTZ (with timezone)** - 타임존 포함 (권장)
C) **TIMESTAMP (millisecond)** - 밀리초 단위
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 10: Index Strategy
어떤 컬럼들에 인덱스를 생성할까요?

**Context**:
- 주요 쿼리 패턴: 
  - 메뉴 조회 (by store_id, category_id)
  - 주문 조회 (by session_id, table_id, created_at)
  - 세션 조회 (by table_id, is_active)

A) **Primary Keys Only** - 기본적인 PK 인덱스만
B) **Foreign Keys** - PK + 모든 FK 컬럼
C) **Query-Optimized** - PK + FK + 자주 조회되는 컬럼 (store_id, session_id, is_active 등)
D) **Composite Indexes** - 복합 인덱스 포함 (예: (table_id, is_active))
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 11: Category Management
카테고리(`categories` 테이블)는 어떻게 관리될까요?

**Context**:
- 메뉴가 카테고리에 속함
- 카테고리도 CRUD 가능한지 확인

A) **Admin CRUD** - 관리자가 카테고리 추가/수정/삭제 가능 (메뉴처럼)
B) **Seed Data Only** - 초기 seed data로만 제공, 런타임 변경 불가
C) **Hierarchical** - 카테고리가 계층 구조 (부모-자식)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 12: Referential Integrity on Delete
FK 제약조건의 ON DELETE 동작은?

**Context**:
- 예: 테이블이 삭제되면 해당 테이블의 주문들은?
- 예: 메뉴가 삭제되면 해당 메뉴를 포함한 주문 항목은?

A) **RESTRICT** - 참조되는 row가 있으면 삭제 불가 (안전)
B) **CASCADE** - 부모 삭제 시 자식도 함께 삭제
C) **SET NULL** - 부모 삭제 시 FK를 NULL로 설정
D) **Mixed Strategy** - 테이블/상황별로 다르게 (specify in answer)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 13: User Roles
`users.role` 컬럼의 가능한 값들은?

**Context**:
- Requirements에서 "admin/manager" 언급
- 추가 역할이 필요한지 확인

A) **Admin Only** - 단일 역할 "admin"만 (role 컬럼 불필요)
B) **Admin and Manager** - "admin", "manager" 두 역할 (권한 차이 있음)
C) **More Roles** - admin, manager, staff 등 (specify in answer)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 14: Session Token Format
`sessions.session_token`의 형식은?

**Context**:
- 테이블 태블릿의 자동 로그인에 사용됨
- 16시간 세션

A) **JWT** - JWT 토큰 형식 (백엔드에서 생성)
B) **UUID** - UUID v4
C) **Random String** - 랜덤 문자열 (예: "sess_abc123...")
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 15: Order Items Snapshot
`order_items` 테이블의 `menu_name`, `unit_price`는 주문 시점의 스냅샷인가요?

**Context**:
- 메뉴 이름/가격이 나중에 변경될 수 있음
- 과거 주문은 당시의 정보를 보존해야 함

A) **Snapshot (Denormalized)** - 주문 시점의 메뉴명/가격 복사 (권장)
B) **Reference Only** - menu_id만 저장, 조회 시 menus 테이블 JOIN
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Execution Checklist

아래는 답변을 바탕으로 실행할 functional design 체크리스트입니다.

### Phase 1: Domain Entities Definition
- [x] **Step 1.1**: 8개 테이블 스키마 상세 정의
  - [x] stores 테이블
  - [x] tables 테이블
  - [x] categories 테이블
  - [x] menus 테이블
  - [x] orders 테이블
  - [x] order_items 테이블
  - [x] users 테이블
  - [x] sessions 테이블

- [x] **Step 1.2**: 각 테이블의 컬럼 정의
  - [x] 컬럼명, 데이터 타입, NULL 허용 여부
  - [x] 기본값 (DEFAULT)
  - [x] 제약조건 (UNIQUE, CHECK)

### Phase 2: Relationships
- [x] **Step 2.1**: Foreign Key 관계 정의
  - [x] stores ↔ tables, menus, categories, orders, users
  - [x] tables ↔ orders, sessions
  - [x] categories ↔ menus
  - [x] menus ↔ order_items
  - [x] orders ↔ order_items, sessions

- [x] **Step 2.2**: Referential Integrity 정의
  - [x] ON DELETE 동작
  - [x] ON UPDATE 동작

### Phase 3: Business Rules
- [x] **Step 3.1**: 데이터 무결성 규칙
  - [x] 가격은 양수 (CHECK constraint)
  - [x] 주문 상태 제한 (ENUM or CHECK)
  - [x] 이메일 형식 검증 (if applicable)

- [x] **Step 3.2**: 기본값 및 자동 생성
  - [x] created_at, updated_at 자동 설정
  - [x] order_number 생성 규칙
  - [x] session_token 생성 규칙

### Phase 4: Indexes
- [x] **Step 4.1**: 성능 최적화 인덱스
  - [x] Primary Key 인덱스 (자동)
  - [x] Foreign Key 인덱스
  - [x] 자주 조회되는 컬럼 인덱스
  - [x] 복합 인덱스 (if applicable)

### Phase 5: Migrations
- [x] **Step 5.1**: Migration 파일 순서 정의
  - [x] 001_create_stores.js
  - [x] 002_create_tables.js
  - [x] ...
  - [x] 008_create_sessions.js

- [x] **Step 5.2**: Rollback 전략
  - [x] 각 migration의 down() 함수

### Phase 6: Seed Data
- [x] **Step 6.1**: 초기 데이터 정의
  - [x] stores (기본 매장 1개)
  - [x] categories (메인, 음료, 디저트 등)
  - [x] users (기본 관리자 1명)
  - [x] Optional: 샘플 메뉴, 테이블

### Phase 7: Documentation
- [x] **Step 7.1**: Generate `domain-entities.md`
  - [x] 8개 테이블 ERD
  - [x] 각 테이블 스키마 상세
  - [x] 관계 다이어그램

- [x] **Step 7.2**: Generate `business-rules.md`
  - [x] 데이터 무결성 규칙
  - [x] 제약조건
  - [x] 기본값

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q15)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. Functional design 아티팩트 생성 (domain-entities.md, business-rules.md)
5. Present completion message
6. 사용자 승인 대기
