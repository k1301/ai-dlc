/**
 * Migration: Create categories table
 * Purpose: Menu categories (메뉴 카테고리)
 * Features: Soft delete, display order
 */

exports.up = function(knex) {
  return knex.schema.createTable('categories', (table) => {
    // Primary Key
    table.increments('id').primary().comment('카테고리 고유 ID');

    // Foreign Keys
    table.integer('store_id').unsigned().notNullable()
      .references('id').inTable('stores')
      .onDelete('RESTRICT')
      .comment('매장 ID (FK)');

    // Columns
    table.string('category_name', 100).notNullable().comment('카테고리 이름');
    table.integer('display_order').defaultTo(0).comment('표시 순서');

    // Soft Delete
    table.timestamp('deleted_at').nullable().comment('삭제 시간 (soft delete)');

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('store_id', 'idx_categories_store_id'); // FK index
    table.index('display_order', 'idx_categories_display_order'); // Query optimization
    table.index('deleted_at', 'idx_categories_deleted_at'); // Soft delete filter
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};
