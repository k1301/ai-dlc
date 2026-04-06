# Database Schema Reference

Complete reference for all 8 tables in the Table Order Service database.

**Database**: PostgreSQL 14+  
**Total Tables**: 8  
**Generated**: 2026-04-06

---

## Table of Contents

1. [stores](#1-stores) - 매장 정보
2. [tables](#2-tables) - 테이블 정보
3. [categories](#3-categories) - 메뉴 카테고리
4. [menus](#4-menus) - 메뉴 항목
5. [users](#5-users) - 관리자/직원 사용자
6. [sessions](#6-sessions) - 테이블 세션
7. [orders](#7-orders) - 주문
8. [order_items](#8-order-items) - 주문 항목

---

## 1. stores

**Purpose**: 매장 정보  
**Migration**: `001_create_stores.js`

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 매장 고유 ID |
| `name` | VARCHAR(255) | NOT NULL | - | - | 매장 이름 |
| `store_id` | VARCHAR(50) | NOT NULL | - | UNIQUE | 매장 식별자 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Indexes

- **PRIMARY KEY**: `id`
- **UNIQUE**: `store_id`

### Relationships

- **Referenced by**:
  - `tables.store_id` (1:N)
  - `categories.store_id` (1:N)
  - `users.store_id` (1:N)

### Sample Data (Seed)

```sql
INSERT INTO stores (name, store_id) VALUES ('테스트 매장', 'STORE001');
```

---

## 2. tables

**Purpose**: 테이블 정보 (QR 코드 로그인용)  
**Migration**: `002_create_tables.js`  
**Features**: Soft delete, bcrypt password

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 테이블 고유 ID |
| `store_id` | INTEGER | NOT NULL | - | FK → stores.id | 매장 ID |
| `table_number` | INTEGER | NOT NULL | - | - | 테이블 번호 |
| `table_name` | VARCHAR(100) | NULL | - | - | 테이블 이름 (선택) |
| `password_hash` | VARCHAR(255) | NOT NULL | - | - | 테이블 비밀번호 해시 (bcrypt) |
| `qr_code` | TEXT | NULL | - | - | QR 코드 데이터 |
| `deleted_at` | TIMESTAMPTZ | NULL | - | - | 삭제 시간 (soft delete) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Constraints

- **UNIQUE**: `(store_id, table_number)` - 한 매장 내에서 테이블 번호 중복 불가

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `store_id` (FK)
- **UNIQUE**: `(store_id, table_number)`
- **INDEX**: `deleted_at` (soft delete filter)

### Relationships

- **Foreign Keys**:
  - `store_id` → `stores.id` (ON DELETE RESTRICT)
- **Referenced by**:
  - `sessions.table_id` (1:N)
  - `orders.table_id` (1:N)

### Sample Data (Seed)

```sql
-- 5 tables with password "1234" (bcrypt hashed)
INSERT INTO tables (store_id, table_number, table_name, password_hash, qr_code)
VALUES
  (1, 1, '테이블 1', '$2b$10$...', 'QR_TABLE_001'),
  (1, 2, '테이블 2', '$2b$10$...', 'QR_TABLE_002'),
  (1, 3, '테이블 3', '$2b$10$...', 'QR_TABLE_003'),
  (1, 4, '테이블 4', '$2b$10$...', 'QR_TABLE_004'),
  (1, 5, '테이블 5', '$2b$10$...', 'QR_TABLE_005');
```

---

## 3. categories

**Purpose**: 메뉴 카테고리  
**Migration**: `003_create_categories.js`  
**Features**: Soft delete, display order

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 카테고리 고유 ID |
| `store_id` | INTEGER | NOT NULL | - | FK → stores.id | 매장 ID |
| `category_name` | VARCHAR(100) | NOT NULL | - | - | 카테고리 이름 |
| `display_order` | INTEGER | NOT NULL | 0 | - | 표시 순서 |
| `deleted_at` | TIMESTAMPTZ | NULL | - | - | 삭제 시간 (soft delete) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `store_id` (FK)
- **INDEX**: `display_order` (query optimization)
- **INDEX**: `deleted_at` (soft delete filter)

### Relationships

- **Foreign Keys**:
  - `store_id` → `stores.id` (ON DELETE RESTRICT)
- **Referenced by**:
  - `menus.category_id` (1:N)

### Sample Data (Seed)

```sql
INSERT INTO categories (store_id, category_name, display_order) VALUES
  (1, '메인 요리', 1),
  (1, '사이드 메뉴', 2),
  (1, '음료', 3),
  (1, '주류', 4),
  (1, '디저트', 5);
```

---

## 4. menus

**Purpose**: 메뉴 항목  
**Migration**: `004_create_menus.js`  
**Features**: Soft delete, price validation, availability flag

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 메뉴 고유 ID |
| `category_id` | INTEGER | NOT NULL | - | FK → categories.id | 카테고리 ID |
| `menu_name` | VARCHAR(200) | NOT NULL | - | - | 메뉴 이름 |
| `description` | TEXT | NULL | - | - | 메뉴 설명 |
| `price` | DECIMAL(10,2) | NOT NULL | - | CHECK >= 0 | 가격 |
| `image_url` | VARCHAR(500) | NULL | - | - | 이미지 URL |
| `is_available` | BOOLEAN | NOT NULL | TRUE | - | 판매 가능 여부 |
| `display_order` | INTEGER | NOT NULL | 0 | - | 표시 순서 |
| `deleted_at` | TIMESTAMPTZ | NULL | - | - | 삭제 시간 (soft delete) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Constraints

- **CHECK**: `price >= 0`

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `category_id` (FK)
- **INDEX**: `is_available` (query optimization)
- **INDEX**: `display_order` (query optimization)
- **INDEX**: `deleted_at` (soft delete filter)

### Relationships

- **Foreign Keys**:
  - `category_id` → `categories.id` (ON DELETE RESTRICT)
- **Referenced by**:
  - `order_items.menu_id` (1:N)

### Sample Data (Seed)

```sql
-- 15 menu items (3 per category)
INSERT INTO menus (category_id, menu_name, description, price) VALUES
  -- Category 1: 메인 요리
  (1, '김치찌개', '돼지고기와 김치로 만든 얼큰한 찌개', 9000.00),
  (1, '된장찌개', '구수한 된장으로 만든 찌개', 8000.00),
  (1, '불고기', '달콤한 양념에 재운 소고기 볶음', 15000.00),
  -- ... (12 more)
```

---

## 5. users

**Purpose**: 관리자 및 직원 사용자  
**Migration**: `005_create_users.js`  
**Features**: Soft delete, bcrypt password, role management

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 사용자 고유 ID |
| `store_id` | INTEGER | NOT NULL | - | FK → stores.id | 매장 ID |
| `username` | VARCHAR(100) | NOT NULL | - | UNIQUE | 사용자 이름 |
| `password_hash` | VARCHAR(255) | NOT NULL | - | - | 비밀번호 해시 (bcrypt) |
| `role` | VARCHAR(50) | NOT NULL | 'staff' | - | 역할 (admin, staff) |
| `deleted_at` | TIMESTAMPTZ | NULL | - | - | 삭제 시간 (soft delete) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `store_id` (FK)
- **UNIQUE**: `username`
- **INDEX**: `deleted_at` (soft delete filter)

### Relationships

- **Foreign Keys**:
  - `store_id` → `stores.id` (ON DELETE RESTRICT)

### Sample Data (Seed)

```sql
-- 2 users: admin and staff
INSERT INTO users (store_id, username, password_hash, role) VALUES
  (1, 'admin', '$2b$10$...', 'admin'),    -- password: admin1234
  (1, 'staff1', '$2b$10$...', 'staff');   -- password: staff1234
```

---

## 6. sessions

**Purpose**: 테이블 세션 (고객이 앉아 있는 동안 유지)  
**Migration**: `006_create_sessions.js`  
**Features**: Soft close (is_active flag), JWT token

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 세션 고유 ID |
| `table_id` | INTEGER | NOT NULL | - | FK → tables.id | 테이블 ID |
| `session_token` | VARCHAR(500) | NOT NULL | - | UNIQUE | 세션 토큰 (JWT) |
| `is_active` | BOOLEAN | NOT NULL | TRUE | - | 활성 상태 (soft close) |
| `completed_at` | TIMESTAMPTZ | NULL | - | - | 완료 시간 (soft close) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `table_id` (FK)
- **UNIQUE**: `session_token`
- **INDEX**: `(table_id, is_active)` (composite index for query optimization)

### Relationships

- **Foreign Keys**:
  - `table_id` → `tables.id` (ON DELETE RESTRICT)
- **Referenced by**:
  - `orders.session_id` (1:N)

### Sample Data (Seed)

```sql
-- No seed data (sessions are created at runtime)
```

---

## 7. orders

**Purpose**: 주문  
**Migration**: `007_create_orders.js`  
**Features**: Application-generated order number, status validation

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 주문 고유 ID |
| `order_number` | VARCHAR(50) | NOT NULL | - | UNIQUE | 주문 번호 (ORD-YYYYMMDD-XXX) |
| `table_id` | INTEGER | NOT NULL | - | FK → tables.id | 테이블 ID |
| `session_id` | INTEGER | NOT NULL | - | FK → sessions.id | 세션 ID |
| `status` | VARCHAR(50) | NOT NULL | 'pending' | CHECK IN (...) | 주문 상태 |
| `total_amount` | DECIMAL(10,2) | NOT NULL | - | CHECK >= 0 | 총 금액 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Constraints

- **CHECK**: `status IN ('pending', 'preparing', 'completed', 'cancelled')`
- **CHECK**: `total_amount >= 0`

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `table_id` (FK)
- **INDEX**: `session_id` (FK)
- **UNIQUE**: `order_number`
- **INDEX**: `status` (query optimization)

### Relationships

- **Foreign Keys**:
  - `table_id` → `tables.id` (ON DELETE RESTRICT)
  - `session_id` → `sessions.id` (ON DELETE RESTRICT)
- **Referenced by**:
  - `order_items.order_id` (1:N)

### Sample Data (Seed)

```sql
-- No seed data (orders are created at runtime)
```

### Order Number Format

Application-generated format: `ORD-YYYYMMDD-XXX`

Examples:
- `ORD-20260406-001`
- `ORD-20260406-002`
- `ORD-20260407-001`

---

## 8. order_items

**Purpose**: 주문 항목 (각 주문의 메뉴 상세)  
**Migration**: `008_create_order_items.js`  
**Features**: Snapshot pattern (denormalized menu_name, unit_price)

### Columns

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | SERIAL | NOT NULL | - | PRIMARY KEY | 주문 항목 고유 ID |
| `order_id` | INTEGER | NOT NULL | - | FK → orders.id | 주문 ID |
| `menu_id` | INTEGER | NOT NULL | - | FK → menus.id | 메뉴 ID |
| `menu_name` | VARCHAR(200) | NOT NULL | - | - | 메뉴 이름 (snapshot) |
| `quantity` | INTEGER | NOT NULL | - | CHECK > 0 | 수량 |
| `unit_price` | DECIMAL(10,2) | NOT NULL | - | CHECK >= 0 | 단가 (snapshot) |
| `subtotal` | DECIMAL(10,2) | NOT NULL | - | CHECK >= 0 | 소계 (quantity × unit_price) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | 수정 시간 |

### Constraints

- **CHECK**: `quantity > 0`
- **CHECK**: `unit_price >= 0`
- **CHECK**: `subtotal >= 0`

### Indexes

- **PRIMARY KEY**: `id`
- **INDEX**: `order_id` (FK)
- **INDEX**: `menu_id` (FK)

### Relationships

- **Foreign Keys**:
  - `order_id` → `orders.id` (ON DELETE RESTRICT)
  - `menu_id` → `menus.id` (ON DELETE RESTRICT)

### Sample Data (Seed)

```sql
-- No seed data (order items are created at runtime)
```

### Snapshot Pattern

`menu_name` and `unit_price` are **denormalized** (copied from `menus` table at order time).

**Rationale**:
- Menu prices may change over time
- Order records must preserve the price at the time of order
- Prevents historical order data from reflecting current prices

**Example**:
```sql
-- At order time, menu price is 9000
INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price, subtotal)
VALUES (1, 1, '김치찌개', 2, 9000.00, 18000.00);

-- Later, menu price changes to 10000
UPDATE menus SET price = 10000.00 WHERE id = 1;

-- Historical order_items still shows 9000 (correct behavior)
SELECT * FROM order_items WHERE id = 1;
-- menu_name: '김치찌개', unit_price: 9000.00 (preserved)
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   stores    │
│             │
│ * id (PK)   │
│   name      │
│   store_id  │
└──────┬──────┘
       │
       │ 1:N
       │
   ┌───┴──────────────┬────────────────┬───────────────┐
   │                  │                │               │
   ▼                  ▼                ▼               ▼
┌────────┐      ┌───────────┐   ┌──────────┐   ┌─────────┐
│ tables │      │categories │   │  users   │   │(others) │
│        │      │           │   │          │   └─────────┘
│* id(PK)│      │ * id (PK) │   │* id (PK) │
│  number│      │   name    │   │ username │
│password│      │   order   │   │ password │
│qr_code │      └─────┬─────┘   │  role    │
│deleted │            │         │ deleted  │
└───┬────┘            │         └──────────┘
    │                 │ 1:N
    │ 1:N             ▼
    │          ┌─────────────┐
    │          │    menus    │
    │          │             │
    │          │ * id (PK)   │
    │          │   name      │
    │          │   price     │
    │          │   available │
    │          │   deleted   │
    │          └──────┬──────┘
    │                 │
    ▼                 │
┌──────────┐          │
│ sessions │          │
│          │          │
│* id (PK) │          │
│  token   │          │
│is_active │          │
└────┬─────┘          │
     │                │
     │ 1:N            │
     ▼                │
┌────────────┐        │
│   orders   │        │
│            │        │
│ * id (PK)  │        │
│   number   │        │
│   status   │        │
│   total    │        │
└──────┬─────┘        │
       │              │
       │ 1:N          │ 1:N
       ▼              │
┌─────────────┐       │
│ order_items │◄──────┘
│             │
│ * id (PK)   │
│   menu_name │ (snapshot)
│   quantity  │
│   unit_price│ (snapshot)
│   subtotal  │
└─────────────┘
```

**Legend**:
- `*` = Primary Key
- `→` = Foreign Key relationship
- `(snapshot)` = Denormalized data

---

## Foreign Key Summary

| Child Table | Column | Parent Table | Parent Column | ON DELETE |
|-------------|--------|--------------|---------------|-----------|
| **tables** | store_id | stores | id | RESTRICT |
| **categories** | store_id | stores | id | RESTRICT |
| **menus** | category_id | categories | id | RESTRICT |
| **users** | store_id | stores | id | RESTRICT |
| **sessions** | table_id | tables | id | RESTRICT |
| **orders** | table_id | tables | id | RESTRICT |
| **orders** | session_id | sessions | id | RESTRICT |
| **order_items** | order_id | orders | id | RESTRICT |
| **order_items** | menu_id | menus | id | RESTRICT |

**Note**: All foreign keys use `ON DELETE RESTRICT` to prevent accidental data loss.

---

## Special Patterns Summary

### 1. Soft Delete Pattern

**Tables**: tables, categories, menus, users

**Implementation**:
```sql
-- Add column
deleted_at TIMESTAMPTZ NULL

-- Soft delete (mark as deleted)
UPDATE menus SET deleted_at = NOW() WHERE id = 1;

-- Query only non-deleted records
SELECT * FROM menus WHERE deleted_at IS NULL;

-- Restore
UPDATE menus SET deleted_at = NULL WHERE id = 1;
```

### 2. Soft Close Pattern

**Tables**: sessions

**Implementation**:
```sql
-- Add columns
is_active BOOLEAN DEFAULT TRUE
completed_at TIMESTAMPTZ NULL

-- Soft close (mark as inactive)
UPDATE sessions SET is_active = FALSE, completed_at = NOW() WHERE id = 1;

-- Query only active sessions
SELECT * FROM sessions WHERE is_active = TRUE;
```

### 3. Snapshot Pattern

**Tables**: order_items

**Implementation**:
```sql
-- Denormalize menu data at order time
INSERT INTO order_items (order_id, menu_id, menu_name, unit_price, ...)
SELECT order_id, menu_id, menu_name, price, ...
FROM menus WHERE id = ?;

-- Historical data is preserved even if menu changes
```

---

## Data Types Reference

| PostgreSQL Type | Size | Range/Format | Usage |
|-----------------|------|--------------|-------|
| **SERIAL** | 4 bytes | 1 to 2,147,483,647 | Auto-incrementing primary keys |
| **INTEGER** | 4 bytes | -2,147,483,648 to 2,147,483,647 | Foreign keys, counters |
| **VARCHAR(n)** | Variable | Up to n characters | Text fields with length limit |
| **TEXT** | Variable | Unlimited | Long text fields (descriptions) |
| **DECIMAL(10,2)** | Variable | Up to 10 digits, 2 decimal places | Prices (e.g., 12345678.90) |
| **BOOLEAN** | 1 byte | TRUE, FALSE, NULL | Flags (is_available, is_active) |
| **TIMESTAMPTZ** | 8 bytes | Timestamp with time zone | Timestamps (always UTC) |

---

## Querying Examples

### Basic Queries

```sql
-- Get all available menus in a category
SELECT * FROM menus
WHERE category_id = 1
  AND deleted_at IS NULL
  AND is_available = TRUE
ORDER BY display_order;

-- Get all orders for a session
SELECT o.*, COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.session_id = 123
GROUP BY o.id;

-- Get active session for a table
SELECT * FROM sessions
WHERE table_id = 5
  AND is_active = TRUE
ORDER BY created_at DESC
LIMIT 1;
```

### Complex Queries

```sql
-- Get order with items and menu details
SELECT
  o.order_number,
  o.status,
  o.total_amount,
  oi.menu_name,
  oi.quantity,
  oi.unit_price,
  oi.subtotal
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 456;

-- Get menu by category with category name
SELECT
  c.category_name,
  m.menu_name,
  m.price,
  m.is_available
FROM menus m
INNER JOIN categories c ON m.category_id = c.id
WHERE m.deleted_at IS NULL
  AND c.deleted_at IS NULL
ORDER BY c.display_order, m.display_order;

-- Get total sales by menu
SELECT
  m.menu_name,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.subtotal) as total_sales
FROM order_items oi
INNER JOIN menus m ON oi.menu_id = m.id
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY m.id, m.menu_name
ORDER BY total_sales DESC;
```

---

## References

- **Functional Design**: `aidlc-docs/construction/database/functional-design/domain-entities.md`
- **Business Rules**: `aidlc-docs/construction/database/functional-design/business-rules.md`
- **Code Summary**: `aidlc-docs/construction/database/code/code-summary.md`
- **Database README**: `/home/ec2-user/environment/aidlc-table-order/database/README.md`
