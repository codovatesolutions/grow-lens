const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrate = async () => {
  console.log('Starting Phase 1 database migration with corrected schemas...');
  const client = await pool.connect();
  try {
    // Drop existing tables to start clean and prevent conflicts
    console.log('Dropping existing tables to align schemas...');
    await client.query(`
      DROP TABLE IF EXISTS content_plans CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS activities CASCADE;
      DROP TABLE IF EXISTS activity CASCADE;
      DROP TABLE IF EXISTS scans CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // 1. Create Users Table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'business',
        password_hash VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Scans Table
    console.log('Creating scans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mode VARCHAR(50) NOT NULL,
        target VARCHAR(255) NOT NULL,
        notes TEXT,
        industry VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        score INTEGER,
        result JSONB,
        growth_team JSONB,
        revenue_leak JSONB,
        comparison JSONB,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Tasks Table
    console.log('Creating tasks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
        scan_target VARCHAR(255) NOT NULL,
        scan_mode VARCHAR(50) NOT NULL,
        checklist_index INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        done_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create Activity Table (singular)
    console.log('Creating activity table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        meta JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create Content Plans Table
    console.log('Creating content_plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        days INTEGER NOT NULL,
        plan JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create Digital Twins Table
    console.log('Creating digital_twins table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        brand_voice TEXT,
        target_audience TEXT,
        products_json JSONB,
        pricing_model TEXT,
        competitors_json JSONB,
        memory_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Create Copilot Briefs Table
    console.log('Creating copilot_briefs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS copilot_briefs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        brief_text TEXT NOT NULL,
        alerts_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Create Growth Missions Table
    console.log('Creating growth_missions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS growth_missions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        reward_score INTEGER DEFAULT 10,
        impact_usd INTEGER DEFAULT 500,
        category VARCHAR(50) DEFAULT 'CRO',
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Schema migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
