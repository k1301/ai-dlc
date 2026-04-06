# Database Domain Entities

## Overview

테이블오더 서비스의 데이터베이스 스키마는 **8개의 주요 엔티티**로 구성됩니다.

**Database**: PostgreSQL 14+  
**Schema Design Approach**: Normalized (3NF) with strategic denormalization for order snapshots

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   stores    │
│  (1 row)    │
└──────┬──────┘
       │
       │ 1:N (store_id FK)
       │
   ┌───┴────────────────────────────┬─────────────┬──────────────┬──────────────┐
   │                                │             │              │              │
   ▼                                ▼             ▼              ▼              ▼
┌──────────┐                  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  tables  │                  │categories│  │  menus   │  │  orders  │  │  users   │
└────┬─────┘                  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘
     │                             │             │             │
     │ 1:N (table_id FK)           │ 1:N         │ 1:N         │ 1:N
     │                             │             │             │
     ▼                             └─────┬───────┘             │
┌──────────┐                            │                     │
│ sessions │                            │ (category_id FK)    │ (order_id FK)
└────┬─────┘                            │                     │
     │                                  │                     ▼
     │ 1:N (session_id FK)              │               ┌──────────────┐
     │                                  │               │ order_items  │
     │                                  │               │ (menu_id FK) │
     └──────────────────────────────────┼───────────────┴──────────────┘
                                        │
                                        └─────────────────────────────┘
```

---

## Table 1: stores

**Purpose**: 매장 정보 저장 (Single store 지원, 향후 multi-tenancy 확장 대비)

**Schema**:

```sql
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  store_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_stores_store_id ON stores(store_id);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 내부 ID |
| name | VARCHAR(255) | NOT NULL | 매장 이름 (예: "Pizza House 강남점") |
| store_id | VARCHAR(50) | NOT NULL, UNIQUE | 매장 식별자 (예: "store-001") |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |

**Business Rules**:
- 현재는 1개 매장만 지원 (stores 테이블에 1 row만 존재)
- 향후 multi-tenancy 확장 대비해 store_id FK 구조 유지
- store_id는 애플리케이션 레벨에서 생성

**Sample Data**:
```sql
INSERT INTO stores (name, store_id) VALUES ('Default Store', 'store-001');
```

---

## Table 2: tables

**Purpose**: 테이블 정보 및 테이블 태블릿 인증 정보 저장

**Schema**:

```sql
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  table_number INTEGER NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(store_id, table_number)
);

-- Indexes
CREATE INDEX idx_tables_store_id ON tables(store_id);
CREATE INDEX idx_tables_deleted_at ON tables(deleted_at);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 테이블 ID |
| store_id | INTEGER | NOT NULL, FK → stores(id), ON DELETE RESTRICT | 매장 ID |
| table_number | INTEGER | NOT NULL | 테이블 번호 (예: 1, 2, 3...) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시된 테이블 비밀번호 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete 타임스탬프 (NULL = active) |

**Business Rules**:
- (store_id, table_number) 조합은 유니크
- password는 bcrypt로 해시되어 저장 (복호화 불가능)
- 테이블 로그인 시 bcrypt.compare()로 검증
- Soft delete 지원: deleted_at이 NULL이 아니면 삭제된 것으로 간주

**Sample Data**:
```sql
-- password: "1234" → bcrypt hash
INSERT INTO tables (store_id, table_number, password_hash) 
VALUES (1, 1, '$2b$10$...');
```

---

## Table 3: categories

**Purpose**: 메뉴 카테고리 저장

**Schema**:

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 카테고리 ID |
| store_id | INTEGER | NOT NULL, FK → stores(id), ON DELETE RESTRICT | 매장 ID |
| name | VARCHAR(100) | NOT NULL | 카테고리 이름 (예: "메인 요리", "음료", "디저트") |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 (오름차순) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete 타임스탬프 |

**Business Rules**:
- 관리자가 CRUD 가능 (Admin CRUD)
- display_order로 정렬하여 프론트엔드 표시
- Soft delete 지원
- 카테고리 삭제 시 해당 카테고리의 메뉴가 있으면 RESTRICT (FK constraint)

**Sample Data**:
```sql
INSERT INTO categories (store_id, name, display_order) VALUES
(1, '메인 요리', 1),
(1, '음료', 2),
(1, '디저트', 3);
```

---

## Table 4: menus

**Purpose**: 메뉴 정보 저장

**Schema**:

```sql
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_menus_store_id ON menus(store_id);
CREATE INDEX idx_menus_category_id ON menus(category_id);
CREATE INDEX idx_menus_display_order ON menus(display_order);
CREATE INDEX idx_menus_is_available ON menus(is_available);
CREATE INDEX idx_menus_deleted_at ON menus(deleted_at);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 메뉴 ID |
| store_id | INTEGER | NOT NULL, FK → stores(id), ON DELETE RESTRICT | 매장 ID |
| category_id | INTEGER | NOT NULL, FK → categories(id), ON DELETE RESTRICT | 카테고리 ID |
| name | VARCHAR(255) | NOT NULL | 메뉴 이름 (예: "Margherita Pizza") |
| description | TEXT | NULL | 메뉴 설명 |
| price | DECIMAL(10, 2) | NOT NULL, CHECK (price >= 0) | 가격 (소수점 2자리, 예: 15000.00) |
| image_url | TEXT | NULL | CloudFront CDN URL (예: "https://d123.cloudfront.net/menu/pizza.jpg") |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 카테고리 내 표시 순서 |
| is_available | BOOLEAN | NOT NULL, DEFAULT true | 품절 여부 (true = 주문 가능) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete 타임스탬프 |

**Business Rules**:
- 가격은 0 이상 (CHECK constraint)
- Soft delete 지원
- 메뉴 삭제 시 해당 메뉴를 포함한 주문 항목이 있으면 RESTRICT
- image_url은 CloudFront CDN URL (완전한 URL 저장)
- is_available = false이면 고객 화면에서 "품절" 표시

**Sample Data**:
```sql
INSERT INTO menus (store_id, category_id, name, description, price, image_url, display_order) VALUES
(1, 1, 'Margherita Pizza', 'Classic tomato and mozzarella', 15000.00, 'https://d123.cloudfront.net/menu/pizza.jpg', 1);
```

---

## Table 5: sessions

**Purpose**: 테이블 세션 정보 저장 (테이블 이용 시작부터 종료까지)

**Schema**:

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_table_id ON sessions(table_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_table_id_is_active ON sessions(table_id, is_active);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 세션 ID |
| table_id | INTEGER | NOT NULL, FK → tables(id), ON DELETE RESTRICT | 테이블 ID |
| session_token | TEXT | NOT NULL, UNIQUE | JWT 토큰 (16시간 유효) |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 세션 시작 시각 |
| completed_at | TIMESTAMPTZ | NULL | 세션 종료 시각 (NULL = 진행 중) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성 여부 (false = 종료됨) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |

**Business Rules**:
- **Soft Close 전략**: 세션 종료 시 `is_active = false` + `completed_at = NOW()` 설정
- 데이터는 영구 보존 (삭제하지 않음, archive 하지 않음)
- session_token은 JWT 형식, 백엔드에서 생성
- 하나의 테이블에 동시에 활성 세션은 1개만 가능 (애플리케이션 로직으로 보장)
- Soft delete 미지원 (세션은 영구 보존)

**Sample Data**:
```sql
INSERT INTO sessions (table_id, session_token) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

---

## Table 6: orders

**Purpose**: 주문 정보 저장

**Schema**:

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 주문 ID |
| store_id | INTEGER | NOT NULL, FK → stores(id), ON DELETE RESTRICT | 매장 ID |
| table_id | INTEGER | NOT NULL, FK → tables(id), ON DELETE RESTRICT | 테이블 ID |
| session_id | INTEGER | NOT NULL, FK → sessions(id), ON DELETE RESTRICT | 세션 ID |
| order_number | VARCHAR(50) | NOT NULL, UNIQUE | 주문 번호 (예: "ORD-20260406-001") |
| total_amount | DECIMAL(10, 2) | NOT NULL, CHECK (total_amount >= 0) | 총 주문 금액 |
| status | VARCHAR(20) | NOT NULL, CHECK | 주문 상태 (pending, preparing, completed, cancelled) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 주문 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 주문 수정 시각 |

**Business Rules**:
- order_number는 **Application-Generated**: 백엔드에서 "ORD-YYYYMMDD-XXX" 형식 생성 (XXX는 일별 순차 카운터)
- total_amount는 order_items의 subtotal 합계 (애플리케이션에서 계산)
- status 전환: `pending` → `preparing` → `completed` (또는 `cancelled`)
- Soft delete 미지원 (주문은 영구 보존)
- 주문 삭제 시 RESTRICT (order_items가 있으면 삭제 불가)

**Sample Data**:
```sql
INSERT INTO orders (store_id, table_id, session_id, order_number, total_amount, status) VALUES
(1, 1, 1, 'ORD-20260406-001', 45000.00, 'pending');
```

---

## Table 7: order_items

**Purpose**: 주문 항목 저장 (메뉴별 수량)

**Schema**:

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  menu_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_id ON order_items(menu_id);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 주문 항목 ID |
| order_id | INTEGER | NOT NULL, FK → orders(id), ON DELETE RESTRICT | 주문 ID |
| menu_id | INTEGER | NOT NULL, FK → menus(id), ON DELETE RESTRICT | 메뉴 ID |
| menu_name | VARCHAR(255) | NOT NULL | 주문 시점 메뉴 이름 (스냅샷) |
| quantity | INTEGER | NOT NULL, CHECK (quantity > 0) | 수량 |
| unit_price | DECIMAL(10, 2) | NOT NULL, CHECK (unit_price >= 0) | 주문 시점 단가 (스냅샷) |
| subtotal | DECIMAL(10, 2) | NOT NULL, CHECK (subtotal >= 0) | 소계 (quantity × unit_price) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |

**Business Rules**:
- **Snapshot (Denormalized)**: menu_name과 unit_price는 주문 시점의 값을 복사 저장
- 메뉴 이름/가격이 나중에 변경되어도 과거 주문 내역은 당시 값 유지
- subtotal은 애플리케이션에서 계산 후 저장 (quantity × unit_price)
- quantity는 1 이상
- Soft delete 미지원
- updated_at 없음 (주문 항목은 생성 후 변경 불가)

**Sample Data**:
```sql
INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price, subtotal) VALUES
(1, 1, 'Margherita Pizza', 2, 15000.00, 30000.00);
```

---

## Table 8: users

**Purpose**: 관리자 사용자 정보 저장

**Schema**:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(store_id, username)
);

-- Indexes
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE UNIQUE INDEX idx_users_store_id_username ON users(store_id, username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 사용자 ID |
| store_id | INTEGER | NOT NULL, FK → stores(id), ON DELETE RESTRICT | 매장 ID |
| username | VARCHAR(100) | NOT NULL | 사용자명 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시된 비밀번호 |
| role | VARCHAR(20) | NOT NULL, CHECK | 역할 (admin, manager) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete 타임스탬프 |

**Business Rules**:
- (store_id, username) 조합은 유니크
- password는 bcrypt로 해시되어 저장
- role: "admin" (모든 권한), "manager" (제한된 권한, 향후 정의)
- Soft delete 지원
- 로그인 시 JWT 토큰 발급 (16시간 유효)

**Sample Data**:
```sql
-- password: "admin123" → bcrypt hash
INSERT INTO users (store_id, username, password_hash, role) VALUES
(1, 'admin', '$2b$10$...', 'admin');
```

---

## Summary

**Total Tables**: 8

| Table | Primary Purpose | Soft Delete | Relationships |
|-------|----------------|-------------|---------------|
| stores | 매장 정보 | No | Parent of all |
| tables | 테이블 정보 | Yes | → sessions |
| categories | 카테고리 | Yes | → menus |
| menus | 메뉴 정보 | Yes | → order_items |
| sessions | 테이블 세션 | No (Soft Close) | → orders |
| orders | 주문 정보 | No | → order_items |
| order_items | 주문 항목 | No | (leaf node) |
| users | 관리자 사용자 | Yes | (independent) |

**Soft Delete Strategy**:
- **Supported**: tables, categories, menus, users (deleted_at 컬럼)
- **Not Supported**: stores, sessions, orders, order_items (영구 보존)

**Referential Integrity**: All FK constraints use `ON DELETE RESTRICT` (안전)

---

## Next Steps

1. **Migration Files**: Knex.js migration 파일 생성 (001~008)
2. **Seed Data**: 초기 데이터 스크립트 생성
3. **Indexes**: 성능 최적화 인덱스 추가
