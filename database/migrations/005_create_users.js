/**
 * Migration: Create users table
 * Purpose: Admin and staff users (관리자 및 직원 사용자)
 * Features: Soft delete, bcrypt password hashing, role management
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    // Primary Key
    table.increments('id').primary().comment('사용자 고유 ID');

    // Foreign Keys
    table.integer('store_id').unsigned().notNullable()
      .references('id').inTable('stores')
      .onDelete('RESTRICT')
      .comment('매장 ID (FK)');

    // Columns
    table.string('username', 100).notNullable().unique().comment('사용자 이름 (UNIQUE)');
    table.string('password_hash', 255).notNullable().comment('비밀번호 해시 (bcrypt)');
    table.string('role', 50).notNullable().defaultTo('staff').comment('역할 (admin, staff)');

    // Soft Delete
    table.timestamp('deleted_at').nullable().comment('삭제 시간 (soft delete)');

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('store_id', 'idx_users_store_id'); // FK index
    // UNIQUE index on username is automatically created
    table.index('deleted_at', 'idx_users_deleted_at'); // Soft delete filter
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
