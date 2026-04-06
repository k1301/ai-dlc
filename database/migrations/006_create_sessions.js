/**
 * Migration: Create sessions table
 * Purpose: Table sessions (테이블 세션)
 * Features: Soft close (is_active flag), session token, JWT expiry
 */

exports.up = function(knex) {
  return knex.schema.createTable('sessions', (table) => {
    // Primary Key
    table.increments('id').primary().comment('세션 고유 ID');

    // Foreign Keys
    table.integer('table_id').unsigned().notNullable()
      .references('id').inTable('tables')
      .onDelete('RESTRICT')
      .comment('테이블 ID (FK)');

    // Columns
    table.string('session_token', 500).notNullable().unique().comment('세션 토큰 (JWT)');
    table.boolean('is_active').defaultTo(true).comment('활성 상태 (soft close)');
    table.timestamp('completed_at').nullable().comment('완료 시간 (soft close)');

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('table_id', 'idx_sessions_table_id'); // FK index
    // UNIQUE index on session_token is automatically created
    table.index(['table_id', 'is_active'], 'idx_sessions_table_active'); // Query optimization
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
};
