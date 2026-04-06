/**
 * Migration: Create tables table
 * Purpose: Table information for restaurant (테이블 정보)
 * Features: Soft delete, bcrypt password hashing, QR code
 */

exports.up = function(knex) {
  return knex.schema.createTable('tables', (table) => {
    // Primary Key
    table.increments('id').primary().comment('테이블 고유 ID');

    // Foreign Keys
    table.integer('store_id').unsigned().notNullable()
      .references('id').inTable('stores')
      .onDelete('RESTRICT')
      .comment('매장 ID (FK)');

    // Columns
    table.integer('table_number').notNullable().comment('테이블 번호');
    table.string('table_name', 100).comment('테이블 이름 (선택)');
    table.string('password_hash', 255).notNullable().comment('테이블 비밀번호 해시 (bcrypt)');
    table.text('qr_code').comment('QR 코드 데이터');

    // Soft Delete
    table.timestamp('deleted_at').nullable().comment('삭제 시간 (soft delete)');

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    // PK index is automatically created
    table.index('store_id', 'idx_tables_store_id'); // FK index
    table.unique(['store_id', 'table_number'], 'uq_tables_store_table'); // Unique constraint
    table.index('deleted_at', 'idx_tables_deleted_at'); // Soft delete filter
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tables');
};
