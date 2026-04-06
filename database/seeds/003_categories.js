/**
 * Seed: categories table
 * Purpose: Insert sample menu category data
 */

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('categories').del();

  // Insert seed entries
  await knex('categories').insert([
    {
      id: 1,
      store_id: 1,
      category_name: '메인 요리',
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      store_id: 1,
      category_name: '사이드 메뉴',
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      store_id: 1,
      category_name: '음료',
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      store_id: 1,
      category_name: '주류',
      display_order: 4,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 5,
      store_id: 1,
      category_name: '디저트',
      display_order: 5,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  // Reset sequence (PostgreSQL)
  await knex.raw("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
};
