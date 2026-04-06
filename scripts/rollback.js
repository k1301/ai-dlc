/**
 * Database Rollback Script
 * Purpose: Rollback the last batch of Knex migrations
 * Usage: node scripts/rollback.js
 */

const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

async function rollbackMigrations() {
  console.log(`Rolling back migrations in ${environment} environment...`);

  const db = knex(config);

  try {
    const [batchNo, log] = await db.migrate.rollback();

    if (log.length === 0) {
      console.log('✓ Already at the base migration');
    } else {
      console.log(`✓ Batch ${batchNo} rolled back: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`  - ${migration}`);
      });
      console.log('✓ Rollback completed successfully');
    }

    process.exit(0);

  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
    console.error(error);
    process.exit(1);

  } finally {
    await db.destroy();
  }
}

rollbackMigrations();
