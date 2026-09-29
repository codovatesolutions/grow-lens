import { pool } from './db';

interface Migration {
  version: string;
  description: string;
  up: (client: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '001_init_schema',
    description: 'Create core tables: users, scans, tasks, activity, content_plans',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'business',
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          meta JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS content_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          days INTEGER NOT NULL,
          plan JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: '002_auth_verification_tokens',
    description: 'Add email verification and password reset fields to users table',
    up: async (client) => {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP WITH TIME ZONE;
      `);
    },
  },
  {
    version: '003_durable_job_queue',
    description: 'Create scan_jobs table for persistent background scan queue processing',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS scan_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          scan_id UUID UNIQUE REFERENCES scans(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'pending',
          mode VARCHAR(50) NOT NULL,
          target VARCHAR(255) NOT NULL,
          notes TEXT,
          industry VARCHAR(100),
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 3,
          locked_at TIMESTAMP WITH TIME ZONE,
          locked_by VARCHAR(255),
          last_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_scan_jobs_status_created ON scan_jobs (status, created_at);
      `);
    },
  },
  {
    version: '004_usage_and_subscriptions',
    description: 'Create usage_records and subscriptions tables for quotas and billing',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS usage_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
          scans_count INTEGER DEFAULT 0,
          llm_tokens_est INTEGER DEFAULT 0,
          growth_team_calls INTEGER DEFAULT 0,
          creator_scans_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, usage_date)
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          plan_id VARCHAR(50) NOT NULL DEFAULT 'free',
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          stripe_customer_id VARCHAR(255),
          stripe_subscription_id VARCHAR(255),
          current_period_end TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: '005_oauth_states',
    description: 'Create oauth_states table for durable PKCE state storage',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS oauth_states (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          state VARCHAR(255) UNIQUE NOT NULL,
          code_verifier VARCHAR(255),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states (state);
      `);
    },
  },
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRes = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRes.rows.map(r => r.version));

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        console.log(`Applying migration ${migration.version}: ${migration.description}`);
        await client.query('BEGIN');
        try {
          await migration.up(client);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
          await client.query('COMMIT');
          console.log(`Successfully applied ${migration.version}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Failed to apply migration ${migration.version}:`, err);
          throw err;
        }
      }
    }
    console.log('All migrations up to date.');
  } finally {
    client.release();
  }
}
