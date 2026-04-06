/**
 * Migration: Create order_items table
 * Purpose: Order line items (주문 항목)
 * Features: Snapshot pattern (denormalized menu_name, unit_price), quantity validation
 */

exports.up = function(knex) {
  return knex.schema.createTable('order_items', (table) => {
    // Primary Key
    table.increments('id').primary().comment('주문 항목 고유 ID');

    // Foreign Keys
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders')
      .onDelete('RESTRICT')
      .comment('주문 ID (FK)');

    table.integer('menu_id').unsigned().notNullable()
      .references('id').inTable('menus')
      .onDelete('RESTRICT')
      .comment('메뉴 ID (FK)');

    // Columns (Snapshot Pattern - Denormalized)
    table.string('menu_name', 200).notNullable().comment('메뉴 이름 (snapshot)');
    table.integer('quantity').notNullable().comment('수량');
    table.decimal('unit_price', 10, 2).notNullable().comment('단가 (snapshot)');
    table.decimal('subtotal', 10, 2).notNullable().comment('소계 (quantity * unit_price)');

    // Timestamps
    table.timestamps(true, true);

    // Constraints
    table.check('?? > 0', ['quantity'], 'chk_order_items_quantity_positive'); // Quantity > 0
    table.check('?? >= 0', ['unit_price'], 'chk_order_items_price_positive'); // Unit price >= 0
    table.check('?? >= 0', ['subtotal'], 'chk_order_items_subtotal_positive'); // Subtotal >= 0

    // Indexes
    table.index('order_id', 'idx_order_items_order_id'); // FK index
    table.index('menu_id', 'idx_order_items_menu_id'); // FK index
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items');
};
