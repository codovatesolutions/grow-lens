const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migratePhase2 = async () => {
  console.log('Starting Phase 2 database migration...');
  const client = await pool.connect();
  try {
    // Add growth_team and revenue_leak columns to scans table if they don't exist
    console.log('Adding growth_team and revenue_leak columns to scans...');
    await client.query(`
      ALTER TABLE scans 
      ADD COLUMN IF NOT EXISTS growth_team JSONB,
      ADD COLUMN IF NOT EXISTS revenue_leak JSONB;
    `);

    console.log('Phase 2 migration completed successfully!');
  } catch (err) {
    console.error('Phase 2 migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migratePhase2();
