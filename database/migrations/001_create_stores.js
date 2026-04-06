/**
 * Migration: Create stores table
 * Purpose: Store information (매장 정보)
 */

exports.up = function(knex) {
  return knex.schema.createTable('stores', (table) => {
    // Primary Key
    table.increments('id').primary().comment('매장 고유 ID');

    // Columns
    table.string('name', 255).notNullable().comment('매장 이름');
    table.string('store_id', 50).notNullable().unique().comment('매장 식별자');

    // Timestamps
    table.timestamps(true, true); // created_at, updated_at with default NOW()

    // Indexes
    // PK index is automatically created
    // UNIQUE index on store_id is automatically created
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('stores');
};
