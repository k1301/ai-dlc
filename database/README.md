# Table Order Service - Database

PostgreSQL database schema and management for Table Order Service.

## Overview

This directory contains database migrations, seeds, and related configuration for the Table Order Service.

**Database**: PostgreSQL 14+  
**Migration Tool**: Knex.js  
**Tables**: 8 tables (stores, tables, categories, menus, sessions, orders, order_items, users)

## Directory Structure

```
database/
├── migrations/          # Database schema migrations (001-008)
│   ├── 001_create_stores.js
│   ├── 002_create_tables.js
│   ├── 003_create_categories.js
│   ├── 004_create_menus.js
│   ├── 005_create_users.js
│   ├── 006_create_sessions.js
│   ├── 007_create_orders.js
│   └── 008_create_order_items.js
├── seeds/               # Initial data seeds (001-005)
│   ├── 001_stores.js
│   ├── 002_tables.js
│   ├── 003_categories.js
│   ├── 004_menus.js
│   └── 005_users.js
└── README.md           # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

Dependencies:
- `knex`: SQL query builder and migration tool
- `pg`: PostgreSQL driver
- `bcrypt`: Password hashing

### 2. Configure Database Connection

Set environment variables for database connection:

**Development** (local PostgreSQL):
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=table_order_dev
```

**Production** (AWS RDS):
```bash
export DB_HOST=table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com
export DB_PORT=5432
export DB_USER=table_order_app
export DB_PASSWORD=<from-secrets-manager>
export DB_NAME=table_order_db
```

### 3. Run Migrations

Create database schema:

```bash
npm run db:migrate
```

This will execute all migration files in order (001 → 008) and create 8 tables.

### 4. Run Seeds

Populate initial data:

```bash
npm run db:seed
```

This will insert sample data:
- 1 store (테스트 매장)
- 5 tables (테이블 1-5)
- 5 categories (메인 요리, 사이드 메뉴, 음료, 주류, 디저트)
- 15 menu items (3 per category)
- 2 users (admin, staff1)

### 5. Reset Database (Optional)

To rollback, re-migrate, and re-seed:

```bash
npm run db:reset
```

**Warning**: This will delete all data!

## Database Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Migrate** | `npm run db:migrate` | Run pending migrations |
| **Rollback** | `npm run db:rollback` | Rollback last migration batch |
| **Seed** | `npm run db:seed` | Run seed files |
| **Reset** | `npm run db:reset` | Rollback + Migrate + Seed |

Or use Node directly:
```bash
node scripts/migrate.js
node scripts/rollback.js
node scripts/seed.js
```

## Database Schema

### Tables Overview

| Table | Purpose | Rows (Seed) | Features |
|-------|---------|-------------|----------|
| **stores** | 매장 정보 | 1 | - |
| **tables** | 테이블 정보 | 5 | Soft delete, bcrypt password |
| **categories** | 메뉴 카테고리 | 5 | Soft delete, display order |
| **menus** | 메뉴 항목 | 15 | Soft delete, price validation |
| **users** | 관리자/직원 | 2 | Soft delete, bcrypt password |
| **sessions** | 테이블 세션 | 0 | Soft close (is_active flag) |
| **orders** | 주문 | 0 | Application-generated order number |
| **order_items** | 주문 항목 | 0 | Snapshot pattern (denormalized) |

### Seed Data Credentials

**Table Passwords** (for QR code login):
- All tables (1-5): `1234`

**User Credentials**:
- Admin: username `admin`, password `admin1234`
- Staff: username `staff1`, password `staff1234`

**Note**: Passwords are hashed using bcrypt (10 rounds).

## Migration Order

Migrations must run in order due to foreign key dependencies:

```
001_create_stores
  ↓
002_create_tables (FK: store_id → stores)
  ↓
003_create_categories (FK: store_id → stores)
  ↓
004_create_menus (FK: category_id → categories)
005_create_users (FK: store_id → stores)
006_create_sessions (FK: table_id → tables)
  ↓
007_create_orders (FK: table_id → tables, session_id → sessions)
  ↓
008_create_order_items (FK: order_id → orders, menu_id → menus)
```

## Rollback

Rollback will undo the last migration batch (all 8 migrations if run together):

```bash
npm run db:rollback
```

To rollback all migrations to base:
```bash
npm run db:rollback
# Repeat until "Already at the base migration"
```

## Troubleshooting

### Connection Errors

**Error**: `Connection refused`
- Check if PostgreSQL is running
- Verify DB_HOST and DB_PORT

**Error**: `Authentication failed`
- Verify DB_USER and DB_PASSWORD
- Check PostgreSQL user permissions

### Migration Errors

**Error**: `Relation already exists`
- Tables already created, no migration needed
- OR run `npm run db:rollback` first

**Error**: `Foreign key constraint violation`
- Check migration order (001 → 008)
- Ensure parent tables exist before child tables

### Seed Errors

**Error**: `Insert error - duplicate key value`
- Seeds already run, data exists
- Run `npm run db:reset` to clear and re-seed

## Development Workflow

1. **Make schema changes**: Create new migration file
   ```bash
   npx knex migrate:make migration_name
   ```

2. **Test migration**: Run and verify
   ```bash
   npm run db:migrate
   ```

3. **Test rollback**: Ensure reversibility
   ```bash
   npm run db:rollback
   npm run db:migrate
   ```

4. **Update seeds**: If needed, modify seed files

5. **Commit**: Version control all migration and seed files

## Production Deployment

1. **Backup**: Create RDS snapshot before migration
   ```bash
   aws rds create-db-snapshot --db-instance-identifier table-order-db --db-snapshot-identifier pre-migration-$(date +%Y%m%d)
   ```

2. **Run migrations**: Apply schema changes
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

3. **Verify**: Check tables and data

4. **Rollback if needed**:
   ```bash
   NODE_ENV=production npm run db:rollback
   ```

## References

- **Functional Design**: `aidlc-docs/construction/database/functional-design/`
- **NFR Requirements**: `aidlc-docs/construction/database/nfr-requirements/`
- **Infrastructure Design**: `aidlc-docs/construction/database/infrastructure-design/`
- **Knex.js Documentation**: https://knexjs.org/
