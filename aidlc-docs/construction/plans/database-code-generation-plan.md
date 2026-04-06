# Database Unit - Code Generation Plan

## Unit Context

**Unit Name**: Database  
**Unit Type**: Database Schema  
**Purpose**: 데이터 저장 및 스키마 관리  
**Technology Stack**: PostgreSQL 14, Knex.js migrations

**Database Schema Summary**:
- **8 Tables**: stores, tables, categories, menus, sessions, orders, order_items, users
- **Relationships**: FK constraints with ON DELETE RESTRICT
- **Features**: Soft delete (4 tables), snapshot pattern (order_items), bcrypt hashing (users, tables)
- **Indexes**: Query-optimized (PK, FK, frequently queried columns)

**Stories Implemented by This Unit**: None directly (Database is infrastructure support for all backend stories)

**Dependencies**:
- No dependencies on other units
- Required by: Backend unit (for database access)

---

## Code Generation Objectives

Database unit의 Code Generation은 다음을 생성합니다:
1. **Knex Configuration** - Development 및 Production 환경 설정
2. **Migration Files** - 8개 테이블 스키마 생성 (순차적 실행)
3. **Seed Files** - 초기 데이터 (stores, tables, categories, menus, users)
4. **Database Scripts** - Migration, rollback, seed 실행 스크립트
5. **Documentation** - 사용 가이드 및 스키마 문서

---

## Code Generation Steps

### Phase 1: Project Structure Setup

- [x] **Step 1**: Create database directory structure
  - Create `/home/ec2-user/environment/aidlc-table-order/database/` directory
  - Create `/home/ec2-user/environment/aidlc-table-order/database/migrations/` directory
  - Create `/home/ec2-user/environment/aidlc-table-order/database/seeds/` directory
  - Create `/home/ec2-user/environment/aidlc-table-order/scripts/` directory

### Phase 2: Configuration Files

- [x] **Step 2**: Generate Knex configuration file
  - Path: `/home/ec2-user/environment/aidlc-table-order/knexfile.js`
  - Content: Development and production configurations
  - Database connection settings (host, port, user, password from environment variables)
  - Migration and seed directories configuration
  - Connection pool settings (min: 2, max: 20)

### Phase 3: Migration Files (Sequential Order)

- [x] **Step 3**: Generate migration for `stores` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/001_create_stores.js`
  - Columns: id (PK), name, store_id (UNIQUE), created_at, updated_at
  - Indexes: PK on id, UNIQUE on store_id
  - Rollback support (down function)

- [x] **Step 4**: Generate migration for `tables` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/002_create_tables.js`
  - Columns: id (PK), store_id (FK), table_number, table_name, password_hash, qr_code, deleted_at, created_at, updated_at
  - FK: store_id → stores.id (ON DELETE RESTRICT)
  - Indexes: PK, FK, UNIQUE (store_id + table_number), deleted_at
  - Soft delete: deleted_at column

- [x] **Step 5**: Generate migration for `categories` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/003_create_categories.js`
  - Columns: id (PK), store_id (FK), category_name, display_order, deleted_at, created_at, updated_at
  - FK: store_id → stores.id (ON DELETE RESTRICT)
  - Indexes: PK, FK, display_order, deleted_at

- [x] **Step 6**: Generate migration for `menus` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/004_create_menus.js`
  - Columns: id (PK), category_id (FK), menu_name, description, price, image_url, is_available, display_order, deleted_at, created_at, updated_at
  - FK: category_id → categories.id (ON DELETE RESTRICT)
  - Indexes: PK, FK, is_available, display_order, deleted_at
  - Constraints: CHECK (price >= 0)

- [x] **Step 7**: Generate migration for `users` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/005_create_users.js`
  - Columns: id (PK), store_id (FK), username (UNIQUE), password_hash, role, deleted_at, created_at, updated_at
  - FK: store_id → stores.id (ON DELETE RESTRICT)
  - Indexes: PK, FK, UNIQUE (username), deleted_at

- [x] **Step 8**: Generate migration for `sessions` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/006_create_sessions.js`
  - Columns: id (PK), table_id (FK), session_token (UNIQUE), is_active, completed_at, created_at, updated_at
  - FK: table_id → tables.id (ON DELETE RESTRICT)
  - Indexes: PK, FK, UNIQUE (session_token), composite (table_id + is_active)

- [x] **Step 9**: Generate migration for `orders` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/007_create_orders.js`
  - Columns: id (PK), order_number (UNIQUE), table_id (FK), session_id (FK), status, total_amount, created_at, updated_at
  - FK: table_id → tables.id, session_id → sessions.id (ON DELETE RESTRICT)
  - Indexes: PK, FKs, UNIQUE (order_number), status
  - Constraints: CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')), CHECK (total_amount >= 0)

- [x] **Step 10**: Generate migration for `order_items` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/migrations/008_create_order_items.js`
  - Columns: id (PK), order_id (FK), menu_id (FK), menu_name, quantity, unit_price, subtotal, created_at, updated_at
  - FK: order_id → orders.id, menu_id → menus.id (ON DELETE RESTRICT)
  - Indexes: PK, FKs
  - Constraints: CHECK (quantity > 0), CHECK (unit_price >= 0), CHECK (subtotal >= 0)
  - Snapshot: menu_name, unit_price denormalized

### Phase 4: Seed Files

- [x] **Step 11**: Generate seed file for `stores` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/seeds/001_stores.js`
  - Data: 1 sample store ("테스트 매장", store_id: "STORE001")

- [x] **Step 12**: Generate seed file for `tables` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/seeds/002_tables.js`
  - Data: 5 sample tables (table numbers 1-5, bcrypt password hashes, QR codes)

- [x] **Step 13**: Generate seed file for `categories` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/seeds/003_categories.js`
  - Data: 5 sample categories (메인 요리, 사이드 메뉴, 음료, 주류, 디저트)

- [x] **Step 14**: Generate seed file for `menus` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/seeds/004_menus.js`
  - Data: 15 sample menu items (3 per category, with prices, descriptions)

- [x] **Step 15**: Generate seed file for `users` table
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/seeds/005_users.js`
  - Data: 2 sample users (admin, staff with bcrypt password hashes)

### Phase 5: Database Scripts

- [x] **Step 16**: Generate migration execution script
  - Path: `/home/ec2-user/environment/aidlc-table-order/scripts/migrate.js`
  - Function: Run `knex migrate:latest`
  - Error handling, logging, exit codes

- [x] **Step 17**: Generate rollback execution script
  - Path: `/home/ec2-user/environment/aidlc-table-order/scripts/rollback.js`
  - Function: Run `knex migrate:rollback`
  - Error handling, logging, exit codes

- [x] **Step 18**: Generate seed execution script
  - Path: `/home/ec2-user/environment/aidlc-table-order/scripts/seed.js`
  - Function: Run `knex seed:run`
  - Error handling, logging, exit codes

### Phase 6: Package Configuration

- [x] **Step 19**: Generate or update package.json scripts
  - Path: `/home/ec2-user/environment/aidlc-table-order/package.json`
  - Scripts: 
    - `db:migrate` → `node scripts/migrate.js`
    - `db:rollback` → `node scripts/rollback.js`
    - `db:seed` → `node scripts/seed.js`
    - `db:reset` → `npm run db:rollback && npm run db:migrate && npm run db:seed`
  - Dependencies: knex, pg (PostgreSQL driver), bcrypt

### Phase 7: Documentation

- [x] **Step 20**: Generate database usage guide
  - Path: `/home/ec2-user/environment/aidlc-table-order/database/README.md`
  - Content: Setup instructions, migration commands, seed data description, connection configuration

- [x] **Step 21**: Generate code summary documentation
  - Path: `/home/ec2-user/environment/aidlc-table-order/aidlc-docs/construction/database/code/code-summary.md`
  - Content: Generated files list, migration order, seed data description, usage instructions

- [x] **Step 22**: Generate schema reference documentation
  - Path: `/home/ec2-user/environment/aidlc-table-order/aidlc-docs/construction/database/code/schema-reference.md`
  - Content: All 8 tables with columns, types, constraints, indexes, relationships

---

## File Generation Summary

### Application Code (Workspace Root)

**Configuration**:
- `knexfile.js` (1 file)

**Migrations** (8 files):
1. `database/migrations/001_create_stores.js`
2. `database/migrations/002_create_tables.js`
3. `database/migrations/003_create_categories.js`
4. `database/migrations/004_create_menus.js`
5. `database/migrations/005_create_users.js`
6. `database/migrations/006_create_sessions.js`
7. `database/migrations/007_create_orders.js`
8. `database/migrations/008_create_order_items.js`

**Seeds** (5 files):
1. `database/seeds/001_stores.js`
2. `database/seeds/002_tables.js`
3. `database/seeds/003_categories.js`
4. `database/seeds/004_menus.js`
5. `database/seeds/005_users.js`

**Scripts** (3 files):
1. `scripts/migrate.js`
2. `scripts/rollback.js`
3. `scripts/seed.js`

**Package Configuration**:
- `package.json` (update scripts section)

**Database Documentation**:
- `database/README.md` (1 file)

**Total Application Files**: 18 files (1 config + 8 migrations + 5 seeds + 3 scripts + 1 package.json update)

### Documentation (aidlc-docs/)

**Code Documentation** (2 files):
1. `aidlc-docs/construction/database/code/code-summary.md`
2. `aidlc-docs/construction/database/code/schema-reference.md`

**Total Documentation Files**: 2 files

**Grand Total**: 20 files

---

## Execution Sequence

1. **Phase 1**: Create directory structure (Step 1)
2. **Phase 2**: Generate Knex configuration (Step 2)
3. **Phase 3**: Generate migrations in order (Steps 3-10)
4. **Phase 4**: Generate seeds in order (Steps 11-15)
5. **Phase 5**: Generate database scripts (Steps 16-18)
6. **Phase 6**: Update package.json (Step 19)
7. **Phase 7**: Generate documentation (Steps 20-22)

**Critical Rule**: Migrations must be generated in sequential order (001 → 008) to maintain FK dependencies.

---

## Dependencies and Interfaces

**External Dependencies**:
- Knex.js (SQL query builder and migration tool)
- pg (PostgreSQL driver)
- bcrypt (password hashing)

**Exposes to Backend**:
- Database schema (8 tables)
- Connection configuration (via knexfile.js)
- Migration and seed scripts

**No Story Traceability**: Database is infrastructure support, not directly mapped to user stories.

---

## Success Criteria

- [ ] All 22 steps completed and marked [x]
- [ ] 8 migration files generated in correct order
- [ ] 5 seed files generated with sample data
- [ ] 3 database scripts generated (migrate, rollback, seed)
- [ ] Knex configuration file generated
- [ ] Package.json updated with database scripts
- [ ] Documentation generated (README, code-summary, schema-reference)
- [ ] All files placed in correct locations (workspace root, not aidlc-docs/)
- [ ] Code ready for Build & Test phase (migration execution, seed data insertion)

---

## Next Steps After Approval

1. ⛔ **WAIT**: User must approve this plan
2. Execute steps 1-22 sequentially
3. Mark each step [x] immediately after completion
4. Present completion message
5. Wait for user approval to proceed to Build & Test or next unit
