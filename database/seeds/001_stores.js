/**
 * Seed: stores table
 * Purpose: Insert sample store data
 */

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('stores').del();

  // Insert seed entries
  await knex('stores').insert([
    {
      id: 1,
      name: '테스트 매장',
      store_id: 'STORE001',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  // Reset sequence (PostgreSQL)
  await knex.raw("SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores))");
};
