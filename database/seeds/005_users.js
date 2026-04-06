/**
 * Seed: users table
 * Purpose: Insert sample admin and staff user data with bcrypt password hashes
 */

const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('users').del();

  // Hash passwords (bcrypt with 10 rounds)
  const adminPass = await bcrypt.hash('admin1234', 10); // Admin password
  const staffPass = await bcrypt.hash('staff1234', 10); // Staff password

  // Insert seed entries
  await knex('users').insert([
    {
      id: 1,
      store_id: 1,
      username: 'admin',
      password_hash: adminPass,
      role: 'admin',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      store_id: 1,
      username: 'staff1',
      password_hash: staffPass,
      role: 'staff',
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  // Reset sequence (PostgreSQL)
  await knex.raw("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
};
