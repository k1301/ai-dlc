/**
 * Database Seed Script
 * Purpose: Run Knex seeds to populate initial data
 * Usage: node scripts/seed.js
 */

const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

async function runSeeds() {
  console.log(`Running seeds in ${environment} environment...`);

  const db = knex(config);

  try {
    const [log] = await db.seed.run();

    if (log.length === 0) {
      console.log('✓ No seed files to run');
    } else {
      console.log(`✓ Ran ${log.length} seed files:`);
      log.forEach(seed => {
        console.log(`  - ${seed}`);
      });
      console.log('✓ Seeds completed successfully');
    }

    process.exit(0);

  } catch (error) {
    console.error('✗ Seed failed:', error.message);
    console.error(error);
    process.exit(1);

  } finally {
    await db.destroy();
  }
}

runSeeds();
