# Database Code Generation Summary

## Overview

Database unit의 코드 생성이 완료되었습니다. 총 20개 파일이 생성되었습니다.

**Generated**: 2026-04-06  
**Technology Stack**: PostgreSQL 14, Knex.js, bcrypt  
**Total Files**: 20 (18 application files + 2 documentation files)

---

## Generated Files

### 1. Configuration (1 file)

#### knexfile.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/knexfile.js`
- **Purpose**: Knex.js configuration for development and production environments
- **Features**:
  - Development: Local PostgreSQL connection
  - Production: AWS RDS connection with SSL
  - Connection pooling (dev: 2-10, prod: 2-20)
  - Migration and seed directory configuration

---

### 2. Migration Files (8 files)

Migration files create database schema in sequential order.

#### 001_create_stores.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/001_create_stores.js`
- **Table**: stores
- **Columns**: id (PK), name, store_id (UNIQUE), created_at, updated_at
- **Features**: Basic store information

#### 002_create_tables.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/002_create_tables.js`
- **Table**: tables
- **Columns**: id (PK), store_id (FK), table_number, table_name, password_hash, qr_code, deleted_at, created_at, updated_at
- **Features**: Soft delete, bcrypt password, UNIQUE constraint (store_id + table_number)

#### 003_create_categories.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/003_create_categories.js`
- **Table**: categories
- **Columns**: id (PK), store_id (FK), category_name, display_order, deleted_at, created_at, updated_at
- **Features**: Soft delete, display order

#### 004_create_menus.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/004_create_menus.js`
- **Table**: menus
- **Columns**: id (PK), category_id (FK), menu_name, description, price, image_url, is_available, display_order, deleted_at, created_at, updated_at
- **Features**: Soft delete, price validation (CHECK >= 0), availability flag

#### 005_create_users.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/005_create_users.js`
- **Table**: users
- **Columns**: id (PK), store_id (FK), username (UNIQUE), password_hash, role, deleted_at, created_at, updated_at
- **Features**: Soft delete, bcrypt password, role management

#### 006_create_sessions.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/006_create_sessions.js`
- **Table**: sessions
- **Columns**: id (PK), table_id (FK), session_token (UNIQUE), is_active, completed_at, created_at, updated_at
- **Features**: Soft close pattern (is_active flag), JWT token storage

#### 007_create_orders.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/007_create_orders.js`
- **Table**: orders
- **Columns**: id (PK), order_number (UNIQUE), table_id (FK), session_id (FK), status, total_amount, created_at, updated_at
- **Features**: Application-generated order number, status validation (CHECK), total amount validation (CHECK >= 0)

#### 008_create_order_items.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/migrations/008_create_order_items.js`
- **Table**: order_items
- **Columns**: id (PK), order_id (FK), menu_id (FK), menu_name, quantity, unit_price, subtotal, created_at, updated_at
- **Features**: Snapshot pattern (denormalized menu_name, unit_price), quantity/price validation (CHECK)

---

### 3. Seed Files (5 files)

Seed files populate initial data for development and testing.

#### 001_stores.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/seeds/001_stores.js`
- **Data**: 1 store
  - Name: "테스트 매장"
  - Store ID: "STORE001"

#### 002_tables.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/seeds/002_tables.js`
- **Data**: 5 tables (테이블 1-5)
  - Password: "1234" (bcrypt hashed)
  - QR codes: QR_TABLE_001 to QR_TABLE_005

#### 003_categories.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/seeds/003_categories.js`
- **Data**: 5 categories
  1. 메인 요리
  2. 사이드 메뉴
  3. 음료
  4. 주류
  5. 디저트

#### 004_menus.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/seeds/004_menus.js`
- **Data**: 15 menu items (3 per category)
  - Category 1: 김치찌개, 된장찌개, 불고기
  - Category 2: 계란말이, 김치전, 감자튀김
  - Category 3: 콜라, 사이다, 오렌지 주스
  - Category 4: 소주, 맥주, 막걸리
  - Category 5: 아이스크림, 과일, 케이크
  - Prices range: 2,000원 - 15,000원

#### 005_users.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/seeds/005_users.js`
- **Data**: 2 users
  - Admin: username "admin", password "admin1234" (bcrypt hashed)
  - Staff: username "staff1", password "staff1234" (bcrypt hashed)

---

### 4. Database Scripts (3 files)

Scripts for database management operations.

#### scripts/migrate.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/scripts/migrate.js`
- **Purpose**: Run Knex migrations (`knex migrate:latest`)
- **Usage**: `npm run db:migrate` or `node scripts/migrate.js`
- **Features**: Error handling, logging, exit codes

#### scripts/rollback.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/scripts/rollback.js`
- **Purpose**: Rollback last migration batch (`knex migrate:rollback`)
- **Usage**: `npm run db:rollback` or `node scripts/rollback.js`
- **Features**: Error handling, logging, exit codes

#### scripts/seed.js
- **Path**: `/home/ec2-user/environment/aidlc-table-order/scripts/seed.js`
- **Purpose**: Run Knex seeds (`knex seed:run`)
- **Usage**: `npm run db:seed` or `node scripts/seed.js`
- **Features**: Error handling, logging, exit codes

---

### 5. Package Configuration (1 file)

#### package.json
- **Path**: `/home/ec2-user/environment/aidlc-table-order/package.json`
- **Purpose**: Node.js package configuration
- **Scripts**:
  - `db:migrate`: Run migrations
  - `db:rollback`: Rollback migrations
  - `db:seed`: Run seeds
  - `db:reset`: Rollback + Migrate + Seed
- **Dependencies**:
  - `knex`: ^3.0.1 (SQL query builder, migration tool)
  - `pg`: ^8.11.3 (PostgreSQL driver)
  - `bcrypt`: ^5.1.1 (Password hashing)

---

### 6. Documentation (2 files)

#### database/README.md
- **Path**: `/home/ec2-user/environment/aidlc-table-order/database/README.md`
- **Purpose**: Database usage guide
- **Content**:
  - Setup instructions
  - Migration/seed commands
  - Database schema overview
  - Seed data credentials
  - Troubleshooting guide
  - Development workflow
  - Production deployment instructions

#### aidlc-docs/construction/database/code/code-summary.md
- **Path**: `/home/ec2-user/environment/aidlc-table-order/aidlc-docs/construction/database/code/code-summary.md`
- **Purpose**: Code generation summary (this file)

---

## Migration Execution Order

Due to foreign key dependencies, migrations must execute in order:

```
001_create_stores
  ↓ (FK: store_id)
002_create_tables
003_create_categories
005_create_users
  ↓ (FK: table_id)
006_create_sessions
  ↓ (FK: category_id)
004_create_menus
  ↓ (FK: table_id, session_id)
007_create_orders
  ↓ (FK: order_id, menu_id)
008_create_order_items
```

**Critical**: Do NOT change migration file names or execution order.

---

## Database Features Summary

| Feature | Tables | Implementation |
|---------|--------|----------------|
| **Soft Delete** | tables, categories, menus, users | `deleted_at` column (TIMESTAMP) |
| **Soft Close** | sessions | `is_active` flag + `completed_at` |
| **Password Hashing** | tables, users | bcrypt (10 rounds) |
| **Snapshot Pattern** | order_items | Denormalized menu_name, unit_price |
| **Application-Generated IDs** | orders | order_number: "ORD-YYYYMMDD-XXX" |
| **Price Validation** | menus, order_items, orders | CHECK constraints (>= 0) |
| **Status Validation** | orders | CHECK IN ('pending', 'preparing', 'completed', 'cancelled') |
| **Unique Constraints** | tables | (store_id, table_number) |
| **Indexes** | All tables | PK, FK, query-optimized columns |

---

## Usage Instructions

### Install Dependencies
```bash
npm install
```

### Configure Database Connection
```bash
# Development (local PostgreSQL)
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=table_order_dev

# Production (AWS RDS)
export DB_HOST=table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com
export DB_USER=table_order_app
export DB_PASSWORD=<from-secrets-manager>
export DB_NAME=table_order_db
```

### Run Migrations and Seeds
```bash
# Create schema
npm run db:migrate

# Populate data
npm run db:seed

# Or reset everything
npm run db:reset
```

### Verify
```bash
# Connect to database
psql "postgresql://postgres:postgres@localhost:5432/table_order_dev"

# Check tables
\dt

# Check stores
SELECT * FROM stores;

# Check sample data
SELECT COUNT(*) FROM menus;  -- Should return 15
```

---

## Integration with Backend

Database migrations and seeds will be executed by Backend unit during initialization.

**Backend Integration Points**:
1. **Knex Instance**: Backend will import `knexfile.js` configuration
2. **Models**: Backend will create models for each table
3. **Repositories**: Backend repositories will use Knex for database queries
4. **Initialization**: Backend startup script will run migrations

**Example Backend Usage**:
```javascript
// backend/database/knex.js
const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

module.exports = db;
```

---

## Next Steps

1. **✅ Database Unit Complete**: Schema and seeds ready
2. **⏳ Backend Unit**: Will use this database schema
   - Create models (8 models for 8 tables)
   - Create repositories (database access layer)
   - Create services (business logic)
   - Create controllers (API endpoints)
3. **⏳ Build & Test**: Execute migrations and seeds, verify schema

---

## References

- **Functional Design**: `aidlc-docs/construction/database/functional-design/`
  - `domain-entities.md`: Complete table definitions
  - `business-rules.md`: Data integrity rules, constraints
- **Schema Reference**: `aidlc-docs/construction/database/code/schema-reference.md`
- **NFR Requirements**: `aidlc-docs/construction/database/nfr-requirements/`
- **Infrastructure Design**: `aidlc-docs/construction/database/infrastructure-design/`
- **Code Generation Plan**: `aidlc-docs/construction/plans/database-code-generation-plan.md`
