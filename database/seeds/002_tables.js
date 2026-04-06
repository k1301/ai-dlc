/**
 * Seed: tables table
 * Purpose: Insert sample table data with bcrypt password hashes
 */

const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('tables').del();

  // Hash passwords (bcrypt with 10 rounds)
  const table1Pass = await bcrypt.hash('1234', 10); // Table 1 password
  const table2Pass = await bcrypt.hash('1234', 10); // Table 2 password
  const table3Pass = await bcrypt.hash('1234', 10); // Table 3 password
  const table4Pass = await bcrypt.hash('1234', 10); // Table 4 password
  const table5Pass = await bcrypt.hash('1234', 10); // Table 5 password

  // Insert seed entries
  await knex('tables').insert([
    {
      id: 1,
      store_id: 1,
      table_number: 1,
      table_name: '테이블 1',
      password_hash: table1Pass,
      qr_code: 'QR_TABLE_001',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      store_id: 1,
      table_number: 2,
      table_name: '테이블 2',
      password_hash: table2Pass,
      qr_code: 'QR_TABLE_002',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      store_id: 1,
      table_number: 3,
      table_name: '테이블 3',
      password_hash: table3Pass,
      qr_code: 'QR_TABLE_003',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      store_id: 1,
      table_number: 4,
      table_name: '테이블 4',
      password_hash: table4Pass,
      qr_code: 'QR_TABLE_004',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 5,
      store_id: 1,
      table_number: 5,
      table_name: '테이블 5',
      password_hash: table5Pass,
      qr_code: 'QR_TABLE_005',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  // Reset sequence (PostgreSQL)
  await knex.raw("SELECT setval('tables_id_seq', (SELECT MAX(id) FROM tables))");
};
