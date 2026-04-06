/**
 * Migration: Create orders table
 * Purpose: Customer orders (주문)
 * Features: Application-generated order number, status validation, total amount
 */

exports.up = function(knex) {
  return knex.schema.createTable('orders', (table) => {
    // Primary Key
    table.increments('id').primary().comment('주문 고유 ID');

    // Foreign Keys
    table.integer('table_id').unsigned().notNullable()
      .references('id').inTable('tables')
      .onDelete('RESTRICT')
      .comment('테이블 ID (FK)');

    table.integer('session_id').unsigned().notNullable()
      .references('id').inTable('sessions')
      .onDelete('RESTRICT')
      .comment('세션 ID (FK)');

    // Columns
    table.string('order_number', 50).notNullable().unique()
      .comment('주문 번호 (application-generated: ORD-YYYYMMDD-XXX)');
    table.string('status', 50).notNullable().defaultTo('pending')
      .comment('주문 상태 (pending, preparing, completed, cancelled)');
    table.decimal('total_amount', 10, 2).notNullable().comment('총 금액');

    // Timestamps
    table.timestamps(true, true);

    // Constraints
    table.check("?? IN ('pending', 'preparing', 'completed', 'cancelled')",
      ['status'], 'chk_orders_status_valid'); // Status validation
    table.check('?? >= 0', ['total_amount'], 'chk_orders_total_positive'); // Total >= 0

    // Indexes
    table.index('table_id', 'idx_orders_table_id'); // FK index
    table.index('session_id', 'idx_orders_session_id'); // FK index
    // UNIQUE index on order_number is automatically created
    table.index('status', 'idx_orders_status'); // Query optimization
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
