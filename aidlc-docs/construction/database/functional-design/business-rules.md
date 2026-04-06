# Database Business Rules

## Overview

이 문서는 데이터베이스 레벨에서 적용되는 비즈니스 규칙, 제약조건, 데이터 무결성 규칙을 정의합니다.

---

## 1. Data Integrity Rules

### 1.1 Referential Integrity

**Rule**: 모든 Foreign Key 제약조건은 `ON DELETE RESTRICT` 사용

**Rationale**:
- 참조되는 데이터가 있으면 삭제 불가 (안전)
- 데이터 무결성 보장
- 애플리케이션 레벨에서 명시적 처리 필요

**FK Constraints**:

| Child Table | FK Column | Parent Table | ON DELETE | Notes |
|-------------|-----------|--------------|-----------|-------|
| tables | store_id | stores(id) | RESTRICT | 매장 삭제 시 테이블이 있으면 실패 |
| categories | store_id | stores(id) | RESTRICT | 매장 삭제 시 카테고리가 있으면 실패 |
| menus | store_id | stores(id) | RESTRICT | 매장 삭제 시 메뉴가 있으면 실패 |
| menus | category_id | categories(id) | RESTRICT | 카테고리 삭제 시 해당 메뉴가 있으면 실패 |
| orders | store_id | stores(id) | RESTRICT | 매장 삭제 시 주문이 있으면 실패 |
| orders | table_id | tables(id) | RESTRICT | 테이블 삭제 시 주문이 있으면 실패 |
| orders | session_id | sessions(id) | RESTRICT | 세션 삭제 시 주문이 있으면 실패 |
| order_items | order_id | orders(id) | RESTRICT | 주문 삭제 시 주문 항목이 있으면 실패 |
| order_items | menu_id | menus(id) | RESTRICT | 메뉴 삭제 시 해당 메뉴를 포함한 주문 항목이 있으면 실패 |
| sessions | table_id | tables(id) | RESTRICT | 테이블 삭제 시 세션이 있으면 실패 |
| users | store_id | stores(id) | RESTRICT | 매장 삭제 시 사용자가 있으면 실패 |

---

### 1.2 Uniqueness Constraints

**Rule**: 비즈니스적으로 유니크해야 하는 값들에 UNIQUE 제약조건 적용

**Unique Constraints**:

| Table | Columns | Constraint Name | Rationale |
|-------|---------|----------------|-----------|
| stores | store_id | idx_stores_store_id | 매장 식별자는 전역적으로 유니크 |
| tables | (store_id, table_number) | UNIQUE | 같은 매장 내 테이블 번호는 유니크 |
| sessions | session_token | UNIQUE | 세션 토큰은 전역적으로 유니크 |
| orders | order_number | idx_orders_order_number | 주문 번호는 전역적으로 유니크 |
| users | (store_id, username) | idx_users_store_id_username | 같은 매장 내 사용자명은 유니크 |

---

### 1.3 Check Constraints

**Rule**: 데이터 유효성을 데이터베이스 레벨에서 검증

**Check Constraints**:

| Table | Column | Constraint | Validation Rule |
|-------|--------|-----------|----------------|
| menus | price | CHECK (price >= 0) | 가격은 0 이상 |
| orders | total_amount | CHECK (total_amount >= 0) | 총 금액은 0 이상 |
| orders | status | CHECK (status IN (...)) | 허용된 상태값만 가능 |
| order_items | quantity | CHECK (quantity > 0) | 수량은 1 이상 |
| order_items | unit_price | CHECK (unit_price >= 0) | 단가는 0 이상 |
| order_items | subtotal | CHECK (subtotal >= 0) | 소계는 0 이상 |
| users | role | CHECK (role IN ('admin', 'manager')) | 허용된 역할만 가능 |

---

## 2. Default Values

### 2.1 Timestamp Defaults

**Rule**: 모든 `created_at`, `updated_at` 컬럼은 자동으로 타임스탬프 설정

**Defaults**:

| Column | Default Value | Notes |
|--------|--------------|-------|
| created_at | NOW() | 레코드 생성 시 자동 설정 |
| updated_at | NOW() | 레코드 생성 시 자동 설정, 수정 시 트리거로 업데이트 |

**Trigger**: `updated_at` 자동 업데이트 트리거

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 2.2 Boolean Defaults

**Rule**: Boolean 컬럼은 명확한 기본값 제공

**Defaults**:

| Table | Column | Default Value | Notes |
|-------|--------|--------------|-------|
| menus | is_available | true | 신규 메뉴는 기본적으로 주문 가능 |
| sessions | is_active | true | 신규 세션은 활성 상태 |

---

### 2.3 Numeric Defaults

**Rule**: 순서 관련 컬럼은 0으로 기본값 설정

**Defaults**:

| Table | Column | Default Value | Notes |
|-------|--------|--------------|-------|
| categories | display_order | 0 | 표시 순서 기본값 |
| menus | display_order | 0 | 표시 순서 기본값 |

---

## 3. Order Number Generation

### 3.1 Order Number Format

**Rule**: 주문 번호는 애플리케이션에서 "ORD-YYYYMMDD-XXX" 형식으로 생성

**Format**: `ORD-{DATE}-{COUNTER}`
- `ORD`: 고정 접두사
- `{DATE}`: YYYYMMDD 형식 (예: 20260406)
- `{COUNTER}`: 일별 순차 카운터 (001, 002, ..., 999)

**Example**: `ORD-20260406-001`, `ORD-20260406-002`, ...

**Implementation** (Backend):
```javascript
// Pseudo-code
async function generateOrderNumber() {
  const today = format(new Date(), 'yyyyMMdd'); // "20260406"
  const prefix = `ORD-${today}-`;
  
  // Get today's max counter from database
  const lastOrder = await db('orders')
    .where('order_number', 'like', `${prefix}%`)
    .orderBy('order_number', 'desc')
    .first();
  
  let counter = 1;
  if (lastOrder) {
    const lastCounter = parseInt(lastOrder.order_number.split('-')[2]);
    counter = lastCounter + 1;
  }
  
  return `${prefix}${counter.toString().padStart(3, '0')}`;
}
```

**Concurrency Handling**:
- Transaction isolation level: READ COMMITTED
- Retry on duplicate key error (unlikely)
- Alternative: Use PostgreSQL sequence with date prefix

---

### 3.2 Session Token Generation

**Rule**: 세션 토큰은 JWT 형식, 백엔드에서 생성

**Format**: JWT with payload
```json
{
  "tableId": 1,
  "sessionId": 123,
  "storeId": 1,
  "iat": 1609459200,
  "exp": 1609516800
}
```

**Expiry**: 16 hours (57600 seconds)

**Implementation** (Backend):
```javascript
// Pseudo-code
const jwt = require('jsonwebtoken');

function generateSessionToken(tableId, sessionId, storeId) {
  return jwt.sign(
    { tableId, sessionId, storeId },
    process.env.JWT_SECRET,
    { expiresIn: '16h' }
  );
}
```

---

## 4. Password Hashing

### 4.1 User Password (users.password_hash)

**Rule**: bcrypt 알고리즘으로 해싱, 복호화 불가능

**Algorithm**: bcrypt
**Rounds**: 10 (보안과 성능의 균형)

**Implementation** (Backend):
```javascript
const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
}

async function verifyPassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}
```

---

### 4.2 Table Password (tables.password_hash)

**Rule**: bcrypt 알고리즘으로 해싱 (사용자 비밀번호와 동일)

**Rationale**: 테이블 비밀번호도 사용자 비밀번호처럼 보안 처리

**Implementation**: 4.1과 동일

---

## 5. Soft Delete Rules

### 5.1 Soft Delete Scope

**Rule**: 다음 3개 테이블만 Soft Delete 지원

**Soft Delete Tables**:
- `tables` - 테이블 설정 실수 복구 가능
- `categories` - 카테고리 실수 삭제 복구 가능
- `menus` - 메뉴 실수 삭제 복구 가능
- `users` - 사용자 실수 삭제 복구 가능

**Non-Soft Delete Tables** (영구 보존):
- `stores` - 매장 삭제 불가
- `sessions` - 세션 영구 보존 (Soft Close 전략)
- `orders` - 주문 영구 보존
- `order_items` - 주문 항목 영구 보존

---

### 5.2 Soft Delete Implementation

**Column**: `deleted_at TIMESTAMPTZ`
- NULL = active (삭제되지 않음)
- NOT NULL = deleted (삭제 시각)

**Deletion**:
```sql
-- Soft delete
UPDATE menus SET deleted_at = NOW() WHERE id = 123;

-- Restore
UPDATE menus SET deleted_at = NULL WHERE id = 123;
```

---

### 5.3 Soft Delete Query Filtering

**Rule**: **Explicit Filter** 전략 - 필요시에만 명시적으로 필터링

**Rationale**:
- 유연성 제공 (deleted 데이터도 조회 가능)
- 관리자는 삭제된 데이터를 볼 수 있어야 함
- 복구 기능 구현 용이

**Query Examples**:

**Active records only** (일반적인 조회):
```sql
SELECT * FROM menus WHERE deleted_at IS NULL;
```

**All records** (관리자 화면):
```sql
SELECT * FROM menus; -- deleted_at 필터 없음
```

**Deleted records only** (복구 화면):
```sql
SELECT * FROM menus WHERE deleted_at IS NOT NULL;
```

**Application Layer** (Backend):
```javascript
// Repository pattern
class MenuRepository {
  async findActive() {
    return db('menus').whereNull('deleted_at');
  }
  
  async findAll() {
    return db('menus'); // 모든 레코드 (삭제된 것 포함)
  }
  
  async findDeleted() {
    return db('menus').whereNotNull('deleted_at');
  }
  
  async softDelete(id) {
    return db('menus').where({ id }).update({ deleted_at: db.fn.now() });
  }
  
  async restore(id) {
    return db('menus').where({ id }).update({ deleted_at: null });
  }
}
```

---

## 6. Session Management Rules

### 6.1 Soft Close Strategy

**Rule**: 세션 종료 시 `is_active = false` + `completed_at = NOW()` 설정

**Rationale**:
- Archive Table 대신 Soft Close 사용
- FK 제약조건 유지 가능
- 과거 세션 데이터 영구 보존

**Session Lifecycle**:

1. **Create Session**:
```sql
INSERT INTO sessions (table_id, session_token, is_active) 
VALUES (1, 'jwt_token', true);
```

2. **Complete Session**:
```sql
UPDATE sessions 
SET is_active = false, completed_at = NOW() 
WHERE id = 123;
```

3. **Query Active Session**:
```sql
SELECT * FROM sessions 
WHERE table_id = 1 AND is_active = true;
```

4. **Query Completed Sessions**:
```sql
SELECT * FROM sessions 
WHERE table_id = 1 AND is_active = false;
```

---

### 6.2 One Active Session Per Table

**Rule**: 하나의 테이블에 동시에 활성 세션은 1개만 가능

**Implementation**: 애플리케이션 로직으로 보장

**Business Logic** (Backend):
```javascript
async function startNewSession(tableId) {
  // 1. Check for existing active session
  const activeSession = await db('sessions')
    .where({ table_id: tableId, is_active: true })
    .first();
  
  // 2. If exists, complete it first
  if (activeSession) {
    await db('sessions')
      .where({ id: activeSession.id })
      .update({ is_active: false, completed_at: db.fn.now() });
  }
  
  // 3. Create new session
  const sessionToken = generateSessionToken(tableId, ...);
  const [session] = await db('sessions')
    .insert({ table_id: tableId, session_token: sessionToken })
    .returning('*');
  
  return session;
}
```

---

## 7. Order Items Snapshot Rules

### 7.1 Denormalization Strategy

**Rule**: 주문 항목에 메뉴 이름과 가격을 스냅샷으로 저장

**Rationale**:
- 메뉴 정보가 나중에 변경되어도 과거 주문 내역은 당시 값 유지
- 주문 조회 시 JOIN 불필요 (성능 최적화)
- 히스토리 정확성 보장

**Snapshot Fields**:
- `menu_name`: 주문 시점의 메뉴 이름
- `unit_price`: 주문 시점의 메뉴 가격

**Implementation** (Backend):
```javascript
async function createOrder(sessionId, items) {
  // 1. Fetch menu details
  const menuIds = items.map(item => item.menuId);
  const menus = await db('menus').whereIn('id', menuIds);
  
  // 2. Create order
  const [order] = await db('orders')
    .insert({ session_id: sessionId, ... })
    .returning('*');
  
  // 3. Create order items with snapshot
  const orderItems = items.map(item => {
    const menu = menus.find(m => m.id === item.menuId);
    return {
      order_id: order.id,
      menu_id: menu.id,
      menu_name: menu.name,        // SNAPSHOT
      quantity: item.quantity,
      unit_price: menu.price,       // SNAPSHOT
      subtotal: item.quantity * menu.price
    };
  });
  
  await db('order_items').insert(orderItems);
  
  return order;
}
```

---

## 8. Validation Rules Summary

| Rule Category | Enforcement Level | Implementation |
|--------------|-------------------|----------------|
| FK Constraints | Database | ON DELETE RESTRICT |
| Uniqueness | Database | UNIQUE constraints |
| Check Constraints | Database | CHECK constraints |
| Password Hashing | Application | bcrypt (10 rounds) |
| Order Number | Application | Date + Counter |
| Session Token | Application | JWT (16 hours) |
| Soft Delete | Application | Explicit filtering |
| Snapshot | Application | Denormalized fields |
| Timestamps | Database + Trigger | DEFAULT NOW() + Trigger |

---

## 9. Data Type Standards

### 9.1 Price Fields

**Type**: `DECIMAL(10, 2)`
**Precision**: 10 digits total, 2 decimal places
**Range**: 0.00 ~ 99,999,999.99
**Example**: 15000.00 (₩15,000)

**Rationale**:
- 고정 소수점으로 정확한 금액 계산
- INTEGER (cents) 대신 DECIMAL 사용으로 가독성 향상
- 충분한 범위 (1억원 미만)

---

### 9.2 Timestamp Fields

**Type**: `TIMESTAMPTZ` (Timestamp with Timezone)
**Timezone**: UTC로 저장, 애플리케이션에서 로컬 시간으로 변환

**Rationale**:
- 타임존 정보 포함으로 글로벌 확장 대비
- 일광 절약 시간(DST) 처리 자동화
- PostgreSQL 권장 타입

**Example**:
```sql
-- Stored in database (UTC)
2026-04-06 10:30:45+00

-- Displayed in application (KST)
2026-04-06 19:30:45+09
```

---

### 9.3 VARCHAR Length Standards

| Field Type | Length | Rationale |
|------------|--------|-----------|
| Names (name, username) | 100-255 | 충분한 길이, 한글 고려 |
| IDs (store_id, order_number) | 50 | 고정 형식용 |
| URLs (image_url) | TEXT | URL 길이 제한 없음 |
| Tokens (session_token) | TEXT | JWT 길이 제한 없음 |
| Descriptions | TEXT | 긴 텍스트 |
| Hashes (password_hash) | 255 | bcrypt hash 길이 |

---

## 10. Index Strategy

### 10.1 Primary Key Indexes

**Rule**: 모든 테이블은 `SERIAL PRIMARY KEY` 사용 (자동 인덱스)

---

### 10.2 Foreign Key Indexes

**Rule**: 모든 FK 컬럼에 인덱스 생성 (조인 성능 최적화)

**Indexes**:
- `idx_tables_store_id`
- `idx_categories_store_id`
- `idx_menus_store_id`, `idx_menus_category_id`
- `idx_orders_store_id`, `idx_orders_table_id`, `idx_orders_session_id`
- `idx_order_items_order_id`, `idx_order_items_menu_id`
- `idx_sessions_table_id`
- `idx_users_store_id`

---

### 10.3 Query-Optimized Indexes

**Rule**: 자주 조회되는 컬럼에 인덱스 생성

**Indexes**:
- `idx_menus_display_order` - 메뉴 정렬
- `idx_menus_is_available` - 품절 필터링
- `idx_orders_status` - 주문 상태 필터링
- `idx_orders_created_at` (DESC) - 최신 주문 조회
- `idx_sessions_is_active` - 활성 세션 조회
- `idx_categories_display_order` - 카테고리 정렬

---

### 10.4 Soft Delete Indexes

**Rule**: soft delete 지원 테이블의 `deleted_at` 컬럼에 인덱스

**Rationale**: `WHERE deleted_at IS NULL` 쿼리 최적화

**Indexes**:
- `idx_tables_deleted_at`
- `idx_categories_deleted_at`
- `idx_menus_deleted_at`
- `idx_users_deleted_at`

---

### 10.5 Composite Indexes

**Rule**: 복수 컬럼으로 자주 조회하는 경우 복합 인덱스

**Indexes**:
- `idx_sessions_table_id_is_active` (table_id, is_active) - 테이블의 활성 세션 조회

---

## Summary

**Total Business Rules**: 10 categories
- Data Integrity (FK, Unique, Check)
- Default Values (Timestamps, Boolean, Numeric)
- Order Number Generation (Application)
- Password Hashing (bcrypt)
- Soft Delete (Limited scope, Explicit filter)
- Session Management (Soft Close)
- Order Snapshot (Denormalization)
- Validation Summary
- Data Type Standards
- Index Strategy

**Enforcement**:
- **Database Level**: FK, Unique, Check constraints, Triggers
- **Application Level**: Password hashing, Order numbers, Session tokens, Soft delete filtering, Snapshots
