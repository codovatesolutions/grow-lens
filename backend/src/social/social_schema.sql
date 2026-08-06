-- ============================================================
-- Social Media Publisher — Database Schema
-- Run: node backend/src/social/migrate_social.js
-- ============================================================

-- Social Accounts: stores connected OAuth accounts (tokens are AES-256 encrypted)
CREATE TABLE IF NOT EXISTS social_accounts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  platform      TEXT NOT NULL,
  account_name  TEXT,
  account_id    TEXT,
  page_id       TEXT,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  is_connected  BOOLEAN DEFAULT TRUE,
  scope         TEXT,
  avatar_url    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- Posts: core content record
CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  caption      TEXT DEFAULT '',
  media_urls   JSONB DEFAULT '[]',
  hashtags     TEXT[] DEFAULT '{}',
  link         TEXT,
  platforms    TEXT[] DEFAULT '{}',
  status       TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Post Platforms: per-platform publish result
CREATE TABLE IF NOT EXISTS post_platforms (
  id               TEXT PRIMARY KEY,
  post_id          TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  status           TEXT DEFAULT 'pending',
  platform_post_id TEXT,
  error_message    TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Publish History: fast-read audit trail
CREATE TABLE IF NOT EXISTS publish_history (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  post_id       TEXT,
  platform      TEXT,
  caption       TEXT,
  media_url     TEXT,
  thumbnail_url TEXT,
  status        TEXT,
  error_message TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Jobs: delayed publish queue (PostgreSQL-backed)
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  post_id      TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT DEFAULT 'pending',
  attempts     INTEGER DEFAULT 0,
  last_error   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth States: short-lived CSRF protection tokens
CREATE TABLE IF NOT EXISTS oauth_states (
  state      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  platform   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Analytics: cached engagement metrics
CREATE TABLE IF NOT EXISTS social_analytics (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  post_platform_id TEXT REFERENCES post_platforms(id) ON DELETE CASCADE,
  platform         TEXT,
  metric_name      TEXT,
  metric_value     BIGINT DEFAULT 0,
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user     ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user               ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status             ON posts(status);
CREATE INDEX IF NOT EXISTS idx_post_platforms_post      ON post_platforms(post_id);
CREATE INDEX IF NOT EXISTS idx_publish_history_user     ON publish_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_history_platform ON publish_history(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_due       ON scheduled_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_created     ON oauth_states(created_at);
