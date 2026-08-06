import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { encrypt, decrypt } from './encryption';
import { uploadMedia } from './cloudinary.service';
import { llmText, llmJson } from '../llm';
import { BaseSocialProvider, Platform, PostData, ALL_PLATFORMS } from './providers/base.provider';
import { FacebookProvider }  from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { LinkedInProvider }  from './providers/linkedin.provider';
import { TwitterProvider }   from './providers/twitter.provider';
import { PinterestProvider } from './providers/pinterest.provider';
import { TikTokProvider }    from './providers/tiktok.provider';
import { YouTubeProvider }   from './providers/youtube.provider';

// ── Provider registry ────────────────────────────────────────
const PROVIDERS: Record<Platform, BaseSocialProvider> = {
  facebook:  new FacebookProvider(),
  instagram: new InstagramProvider(),
  linkedin:  new LinkedInProvider(),
  twitter:   new TwitterProvider(),
  pinterest: new PinterestProvider(),
  tiktok:    new TikTokProvider(),
  youtube:   new YouTubeProvider(),
};

export function getProvider(platform: Platform): BaseSocialProvider {
  const p = PROVIDERS[platform];
  if (!p) throw new Error(`Unknown platform: ${platform}`);
  return p;
}

// ── Account helpers ──────────────────────────────────────────

export async function getAccounts(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, platform, account_name, account_id, avatar_url, is_connected, expires_at, created_at
     FROM social_accounts WHERE user_id = $1 ORDER BY platform`,
    [userId]
  );
  return rows;
}

export async function getConnectedAccount(userId: string, platform: Platform) {
  const { rows } = await pool.query(
    `SELECT * FROM social_accounts WHERE user_id = $1 AND platform = $2 AND is_connected = true LIMIT 1`,
    [userId, platform]
  );
  return rows[0] || null;
}

export async function saveAccount(userId: string, platform: Platform, tokenData: any) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO social_accounts
       (id, user_id, platform, account_name, account_id, page_id, access_token, refresh_token, expires_at, is_connected, avatar_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10)
     ON CONFLICT (user_id, platform, account_id)
     DO UPDATE SET
       account_name  = EXCLUDED.account_name,
       access_token  = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at    = EXCLUDED.expires_at,
       is_connected  = true,
       avatar_url    = EXCLUDED.avatar_url,
       updated_at    = NOW()`,
    [
      id, userId, platform,
      tokenData.accountName || null,
      tokenData.accountId   || id,
      tokenData.pageId      || null,
      encrypt(tokenData.accessToken),
      tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null,
      tokenData.expiresAt   || null,
      tokenData.avatarUrl   || null,
    ]
  );
}

export async function disconnectAccount(userId: string, platform: Platform) {
  await pool.query(
    `UPDATE social_accounts SET is_connected = false, updated_at = NOW()
     WHERE user_id = $1 AND platform = $2`,
    [userId, platform]
  );
}

// ── OAuth state ──────────────────────────────────────────────

export async function createOAuthState(userId: string, platform: Platform): Promise<string> {
  const state = uuidv4();
  await pool.query(
    `INSERT INTO oauth_states (state, user_id, platform) VALUES ($1, $2, $3)
     ON CONFLICT (state) DO NOTHING`,
    [state, userId, platform]
  );
  // Expire old states
  await pool.query(`DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL '15 minutes'`);
  return state;
}

export async function consumeOAuthState(state: string): Promise<{ userId: string; platform: Platform } | null> {
  const { rows } = await pool.query(
    `DELETE FROM oauth_states WHERE state = $1 RETURNING user_id, platform`,
    [state]
  );
  if (!rows[0]) return null;
  return { userId: rows[0].user_id, platform: rows[0].platform as Platform };
}

// ── Token refresh ────────────────────────────────────────────

async function ensureFreshToken(account: any): Promise<string> {
  const accessToken = decrypt(account.access_token);
  if (!account.expires_at) return accessToken;

  const expiresAt = new Date(account.expires_at);
  const inFiveMin = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt > inFiveMin) return accessToken; // Still valid

  // Token is expired or expiring soon — refresh it
  if (!account.refresh_token) return accessToken;
  try {
    const provider    = getProvider(account.platform);
    const newTokens   = await provider.refreshToken(decrypt(account.refresh_token));
    await pool.query(
      `UPDATE social_accounts
       SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
       WHERE id = $4`,
      [
        encrypt(newTokens.accessToken),
        newTokens.refreshToken ? encrypt(newTokens.refreshToken) : account.refresh_token,
        newTokens.expiresAt || null,
        account.id,
      ]
    );
    return newTokens.accessToken;
  } catch {
    return accessToken; // Use existing token if refresh fails
  }
}

// ── Publishing ────────────────────────────────────────────────

export interface CreatePostInput {
  caption:   string;
  mediaUrls: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
  hashtags:  string[];
  platforms: Platform[];
  link?:     string;
}

export async function publishPost(userId: string, input: CreatePostInput) {
  const postId = uuidv4();

  // 1. Save the post record
  await pool.query(
    `INSERT INTO posts (id, user_id, caption, media_urls, hashtags, link, platforms, status)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,'publishing')`,
    [postId, userId, input.caption, JSON.stringify(input.mediaUrls), input.hashtags, input.link || null, input.platforms]
  );

  const postData: PostData = {
    caption:  input.caption,
    media:    input.mediaUrls,
    hashtags: input.hashtags,
    link:     input.link,
  };

  // 2. Publish to each platform in parallel
  const results = await Promise.allSettled(
    input.platforms.map(async (platform) => {
      const platformResultId = uuidv4();
      try {
        const account = await getConnectedAccount(userId, platform);
        if (!account) throw new Error(`No connected ${platform} account`);

        const accessToken = await ensureFreshToken(account);
        const provider    = getProvider(platform);
        const result      = await provider.publish(accessToken, postData, account.page_id || undefined);

        // Save per-platform result
        await pool.query(
          `INSERT INTO post_platforms (id, post_id, platform, status, platform_post_id, published_at)
           VALUES ($1,$2,$3,$4,$5,NOW())`,
          [platformResultId, postId, platform, result.success ? 'published' : 'failed', result.platformPostId || null]
        );

        // Write history
        await pool.query(
          `INSERT INTO publish_history (id, user_id, post_id, platform, caption, media_url, thumbnail_url, status, published_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
          [
            uuidv4(), userId, postId, platform,
            input.caption.slice(0, 500),
            input.mediaUrls[0]?.url || null,
            input.mediaUrls[0]?.thumbnailUrl || null,
            result.success ? 'published' : 'failed',
          ]
        );

        return { platform, ...result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await pool.query(
          `INSERT INTO post_platforms (id, post_id, platform, status, error_message)
           VALUES ($1,$2,$3,'failed',$4)`,
          [platformResultId, postId, platform, msg]
        );
        await pool.query(
          `INSERT INTO publish_history (id, user_id, post_id, platform, caption, status, error_message)
           VALUES ($1,$2,$3,$4,$5,'failed',$6)`,
          [uuidv4(), userId, postId, platform, input.caption.slice(0, 500), msg]
        );
        return { platform, success: false, errorMessage: msg };
      }
    })
  );

  const platformResults: Record<string, any> = {};
  let allSuccess = true;
  for (const r of results) {
    const val = r.status === 'fulfilled' ? r.value : { platform: 'unknown', success: false, errorMessage: undefined };
    platformResults[val.platform] = { success: val.success, error: (val as any).errorMessage };
    if (!val.success) allSuccess = false;
  }

  const finalStatus = allSuccess ? 'published' : (Object.values(platformResults).some(r => r.success) ? 'partial' : 'failed');
  await pool.query(`UPDATE posts SET status = $1, published_at = NOW() WHERE id = $2`, [finalStatus, postId]);

  return { postId, results: platformResults, status: finalStatus };
}

// ── Scheduling ─────────────────────────────────────────────────

export async function schedulePost(userId: string, input: CreatePostInput, scheduledAt: Date) {
  const postId = uuidv4();
  const jobId  = uuidv4();

  await pool.query(
    `INSERT INTO posts (id, user_id, caption, media_urls, hashtags, link, platforms, status, scheduled_at)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,'scheduled',$8)`,
    [postId, userId, input.caption, JSON.stringify(input.mediaUrls), input.hashtags, input.link || null, input.platforms, scheduledAt]
  );

  await pool.query(
    `INSERT INTO scheduled_jobs (id, user_id, post_id, scheduled_at) VALUES ($1,$2,$3,$4)`,
    [jobId, userId, postId, scheduledAt]
  );

  // Write pending history entries
  for (const platform of input.platforms) {
    await pool.query(
      `INSERT INTO publish_history (id, user_id, post_id, platform, caption, media_url, thumbnail_url, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled',$8)`,
      [uuidv4(), userId, postId, platform, input.caption.slice(0, 500), input.mediaUrls[0]?.url || null, input.mediaUrls[0]?.thumbnailUrl || null, scheduledAt]
    );
  }

  return { jobId, postId, scheduledAt };
}

export async function cancelScheduledJob(userId: string, jobId: string) {
  const { rows } = await pool.query(
    `UPDATE scheduled_jobs SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING post_id`,
    [jobId, userId]
  );
  if (rows[0]) {
    await pool.query(`UPDATE posts SET status = 'cancelled' WHERE id = $1`, [rows[0].post_id]);
  }
}

export async function rescheduleJob(userId: string, jobId: string, newDate: Date) {
  await pool.query(
    `UPDATE scheduled_jobs SET scheduled_at = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND status = 'pending'`,
    [newDate, jobId, userId]
  );
  const { rows } = await pool.query(`SELECT post_id FROM scheduled_jobs WHERE id = $1`, [jobId]);
  if (rows[0]) {
    await pool.query(`UPDATE posts SET scheduled_at = $1 WHERE id = $2`, [newDate, rows[0].post_id]);
  }
}

// ── History & Analytics ─────────────────────────────────────────

export async function getHistory(userId: string, filters: { platform?: string; status?: string; dateRange?: string }) {
  let whereClause = `WHERE ph.user_id = $1`;
  const params: any[] = [userId];

  if (filters.platform) { params.push(filters.platform); whereClause += ` AND ph.platform = $${params.length}`; }
  if (filters.status)   { params.push(filters.status);   whereClause += ` AND ph.status = $${params.length}`; }
  if (filters.dateRange === 'today') {
    whereClause += ` AND ph.created_at >= NOW() - INTERVAL '24 hours'`;
  } else if (filters.dateRange === 'week') {
    whereClause += ` AND ph.created_at >= NOW() - INTERVAL '7 days'`;
  } else if (filters.dateRange === 'month') {
    whereClause += ` AND ph.created_at >= NOW() - INTERVAL '30 days'`;
  }

  const { rows } = await pool.query(
    `SELECT ph.* FROM publish_history ph ${whereClause} ORDER BY ph.created_at DESC LIMIT 100`,
    params
  );
  return rows;
}

export async function getScheduledPosts(userId: string) {
  const { rows } = await pool.query(
    `SELECT sj.id as job_id, sj.scheduled_at, sj.status as job_status, p.*
     FROM scheduled_jobs sj
     JOIN posts p ON p.id = sj.post_id
     WHERE sj.user_id = $1 AND sj.status = 'pending'
     ORDER BY sj.scheduled_at ASC`,
    [userId]
  );
  return rows;
}

export async function getAnalytics(userId: string) {
  const [historyRes, platformRes] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*) as count FROM publish_history WHERE user_id = $1 GROUP BY status`,
      [userId]
    ),
    pool.query(
      `SELECT platform, status, COUNT(*) as count FROM publish_history WHERE user_id = $1 GROUP BY platform, status`,
      [userId]
    ),
  ]);

  const totalPosts     = historyRes.rows.reduce((s, r) => s + parseInt(r.count), 0);
  const publishedPosts = historyRes.rows.find(r => r.status === 'published')?.count || 0;

  const platformBreakdown: Record<string, any> = {};
  for (const row of platformRes.rows) {
    if (!platformBreakdown[row.platform]) {
      platformBreakdown[row.platform] = { posts: 0, published: 0, failed: 0 };
    }
    platformBreakdown[row.platform].posts += parseInt(row.count);
    if (row.status === 'published') platformBreakdown[row.platform].published += parseInt(row.count);
    if (row.status === 'failed')    platformBreakdown[row.platform].failed    += parseInt(row.count);
  }

  return { totalPosts, publishedPosts: parseInt(publishedPosts as string), platformBreakdown };
}

// ── Media Upload ─────────────────────────────────────────────

export async function handleMediaUpload(buffer: Buffer, mimeType: string) {
  return await uploadMedia(buffer, mimeType, 'growthlens/social');
}

// ── AI Features ──────────────────────────────────────────────

const TONE_DESC: Record<string, string> = {
  professional: 'professional, polished, and authoritative',
  startup:      'energetic, bold, and disruptive',
  corporate:    'formal, trustworthy, and brand-safe',
  friendly:     'warm, conversational, and approachable',
  marketing:    'persuasive, action-oriented, with strong CTAs',
};

export async function generateCaption(prompt: string, tone: string, platform: string): Promise<string> {
  const toneDesc = TONE_DESC[tone] || 'engaging';
  const charLimit = { twitter: 280, instagram: 2200, linkedin: 3000, facebook: 63206, pinterest: 500, tiktok: 2200, youtube: 5000 };
  const limit = (charLimit as any)[platform] || 2200;

  const sys = `You are an expert social media copywriter. Write a single ${platform} post caption.`;
  const usr = `Topic/context: ${prompt}\nTone: ${toneDesc}\nMax characters: ${limit}\n\nWrite only the caption text, no quotes, no intro:`;
  return await llmText(sys, usr, `social-caption-${Date.now()}`);
}

export async function generateHashtags(caption: string, platform: string): Promise<string[]> {
  const sys = 'You are a social media hashtag strategist. Return ONLY a JSON array of hashtag strings (no # symbol).';
  const usr = `Platform: ${platform}\nCaption: ${caption}\n\nGenerate 12 relevant hashtags as JSON array:`;
  const result = await llmJson(sys, usr, `social-hashtags-${Date.now()}`);
  if (Array.isArray(result)) return result.slice(0, 15);
  return [];
}

export async function getBestPostingTime(platform: string): Promise<{ time: string; reason: string }> {
  const bestTimes: Record<string, { time: string; reason: string }> = {
    facebook:  { time: 'Wed–Fri, 1–4 PM',   reason: 'Peak engagement window based on global Facebook usage data' },
    instagram: { time: 'Tue–Fri, 9–11 AM',  reason: 'Morning scrolling before work drives highest impression rates' },
    linkedin:  { time: 'Tue–Thu, 8–10 AM',  reason: 'Business hours when professionals check LinkedIn before meetings' },
    twitter:   { time: 'Mon–Fri, 12–3 PM',  reason: 'Lunchtime browsing peak with high retweet activity' },
    pinterest: { time: 'Sat–Sun, 8–11 PM',  reason: 'Weekend evening planning sessions drive most saves' },
    tiktok:    { time: 'Tue, Thu, 7–9 PM',  reason: 'Prime evening entertainment window with highest FYP algorithm activity' },
    youtube:   { time: 'Thu–Sat, 12–4 PM',  reason: 'Pre-weekend uploads index faster and catch weekend viewing' },
  };
  return bestTimes[platform] || { time: '10 AM–12 PM, weekdays', reason: 'General engagement peak across platforms' };
}

export async function rewriteForPlatform(caption: string, platform: string): Promise<string> {
  const sys = `You are a social media expert. Rewrite captions specifically optimized for ${platform}.`;
  const usr = `Original caption: ${caption}\n\nRewrite for ${platform} keeping the core message but adapting tone, length, and style:`;
  return await llmText(sys, usr, `social-rewrite-${Date.now()}`);
}

// ── Scheduler-accessible publish (called by scheduler.ts) ───────

export async function executeScheduledJob(jobId: string) {
  const { rows: jobRows } = await pool.query(
    `UPDATE scheduled_jobs SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [jobId]
  );
  if (!jobRows[0]) return;
  const job = jobRows[0];

  try {
    const { rows: postRows } = await pool.query(`SELECT * FROM posts WHERE id = $1`, [job.post_id]);
    const post = postRows[0];
    if (!post) throw new Error('Post not found');

    await publishPost(job.user_id, {
      caption:   post.caption,
      mediaUrls: post.media_urls || [],
      hashtags:  post.hashtags   || [],
      platforms: post.platforms  || [],
      link:      post.link,
    });

    await pool.query(
      `UPDATE scheduled_jobs SET status = 'done', updated_at = NOW() WHERE id = $1`, [jobId]
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await pool.query(
      `UPDATE scheduled_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`,
      [jobId, msg]
    );
  }
}
