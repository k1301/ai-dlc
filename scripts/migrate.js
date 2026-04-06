/**
 * Database Migration Script
 * Purpose: Run Knex migrations to create database schema
 * Usage: node scripts/migrate.js
 */

const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

async function runMigrations() {
  console.log(`Running migrations in ${environment} environment...`);

  const db = knex(config);

  try {
    const [batchNo, log] = await db.migrate.latest();

    if (log.length === 0) {
      console.log('✓ Database is already up to date');
    } else {
      console.log(`✓ Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`  - ${migration}`);
      });
      console.log('✓ Migrations completed successfully');
    }

    process.exit(0);

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);

  } finally {
    await db.destroy();
  }
}

runMigrations();
