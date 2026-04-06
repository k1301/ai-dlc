/**
 * Migration: Create menus table
 * Purpose: Menu items (메뉴 항목)
 * Features: Soft delete, price validation, availability flag, display order
 */

exports.up = function(knex) {
  return knex.schema.createTable('menus', (table) => {
    // Primary Key
    table.increments('id').primary().comment('메뉴 고유 ID');

    // Foreign Keys
    table.integer('category_id').unsigned().notNullable()
      .references('id').inTable('categories')
      .onDelete('RESTRICT')
      .comment('카테고리 ID (FK)');

    // Columns
    table.string('menu_name', 200).notNullable().comment('메뉴 이름');
    table.text('description').comment('메뉴 설명');
    table.decimal('price', 10, 2).notNullable().comment('가격 (DECIMAL 10,2)');
    table.string('image_url', 500).comment('이미지 URL');
    table.boolean('is_available').defaultTo(true).comment('판매 가능 여부');
    table.integer('display_order').defaultTo(0).comment('표시 순서');

    // Soft Delete
    table.timestamp('deleted_at').nullable().comment('삭제 시간 (soft delete)');

    // Timestamps
    table.timestamps(true, true);

    // Constraints
    table.check('??  >= 0', ['price'], 'chk_menus_price_positive'); // Price >= 0

    // Indexes
    table.index('category_id', 'idx_menus_category_id'); // FK index
    table.index('is_available', 'idx_menus_is_available'); // Query optimization
    table.index('display_order', 'idx_menus_display_order'); // Query optimization
    table.index('deleted_at', 'idx_menus_deleted_at'); // Soft delete filter
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('menus');
};
