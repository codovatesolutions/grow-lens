import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { pool } from '../db';
import {
  getAccounts, createOAuthState, consumeOAuthState, saveAccount,
  disconnectAccount, publishPost, schedulePost, cancelScheduledJob,
  rescheduleJob, getHistory, getAnalytics, handleMediaUpload,
  generateCaption, generateHashtags, getBestPostingTime, rewriteForPlatform,
  getProvider, getScheduledPosts,
} from './social.service';
import { Platform, ALL_PLATFORMS } from './providers/base.provider';
import { ApifyService } from './apify.service';

const apifyService = new ApifyService();

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100 MB

// ── Auth middleware ───────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function requireAuth(req: Request & { user?: any }, res: Response, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET) as any;
    const userId = decoded.id || decoded.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });
    req.user = { id: userId, ...decoded };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Run social DB migration on first import
(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'social_schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('[Social] DB schema ready');
  } catch (err) {
    console.error('[Social] Schema migration error:', err);
  }
})();

// ── Accounts ──────────────────────────────────────────────────

/** GET /api/social/accounts */
router.get('/accounts', requireAuth, async (req: any, res) => {
  try {
    const accounts = await getAccounts(req.user.id);
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/social/oauth-url/:platform */
router.get('/oauth-url/:platform', requireAuth, async (req: any, res) => {
  try {
    const platform = req.params.platform as Platform;
    if (!ALL_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Unknown platform' });

    const state      = await createOAuthState(req.user.id, platform);
    const provider   = getProvider(platform);
    const authUrl    = provider.getOAuthUrl(state);

    res.json({ authUrl, state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/social/callback/:platform  — called by OAuth redirect */
router.get('/callback/:platform', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;
  const platform = req.params.platform as Platform;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (error) {
    return res.redirect(`${FRONTEND}/social?error=${encodeURIComponent(error)}`);
  }

  try {
    const stateData = await consumeOAuthState(state);
    if (!stateData) return res.redirect(`${FRONTEND}/social?error=invalid_state`);

    const provider    = getProvider(platform);
    const backendBase = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
    const redirectUri = `${backendBase}/api/social/callback/${platform}`;
    const tokenData   = await provider.exchangeCode(code, redirectUri, state);

    await saveAccount(stateData.userId, platform, tokenData);

    const accountName = encodeURIComponent(tokenData.accountName || platform);
    res.redirect(`${FRONTEND}/social?connected=${platform}&name=${accountName}`);
  } catch (err: any) {
    console.error(`[OAuth callback ${platform}]`, err.message);
    const FRONTEND2 = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${FRONTEND2}/social?error=${encodeURIComponent(err.message)}`);
  }
});

/** POST /api/social/connect-demo/:platform */
router.post('/connect-demo/:platform', requireAuth, async (req: any, res) => {
  try {
    const platform = req.params.platform as Platform;
    if (!ALL_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Unknown platform' });

    const demoProfiles: Record<Platform, { name: string; avatar: string }> = {
      facebook:  { name: 'LensGrowth Official Page', avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&auto=format&fit=crop&q=80' },
      instagram: { name: '@lensgrowth_official',    avatar: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=150&auto=format&fit=crop&q=80' },
      linkedin:  { name: 'LensGrowth Technologies',  avatar: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=150&auto=format&fit=crop&q=80' },
      twitter:   { name: '@LensGrowthAI',          avatar: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=150&auto=format&fit=crop&q=80' },
      pinterest: { name: 'LensGrowth Design',       avatar: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=150&auto=format&fit=crop&q=80' },
      tiktok:    { name: '@lensgrowth_tok',         avatar: 'https://images.unsplash.com/photo-1611605698323-b1e992d3777f?w=150&auto=format&fit=crop&q=80' },
      youtube:   { name: 'LensGrowth Channel',       avatar: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=150&auto=format&fit=crop&q=80' },
    };

    const profile = demoProfiles[platform];
    const tokenData = {
      accessToken: `demo_access_token_${platform}_${Date.now()}`,
      accountName: profile.name,
      accountId:   `demo_${platform}_id`,
      avatarUrl:   profile.avatar,
      expiresAt:   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    await saveAccount(req.user.id, platform, tokenData);
    res.json({ success: true, accountName: profile.name, platform });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/connect-all-demo */
router.post('/connect-all-demo', requireAuth, async (req: any, res) => {
  try {
    const demoProfiles: Record<Platform, { name: string; avatar: string }> = {
      facebook:  { name: 'LensGrowth Official Page', avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&auto=format&fit=crop&q=80' },
      instagram: { name: '@lensgrowth_official',    avatar: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=150&auto=format&fit=crop&q=80' },
      linkedin:  { name: 'LensGrowth Technologies',  avatar: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=150&auto=format&fit=crop&q=80' },
      twitter:   { name: '@LensGrowthAI',          avatar: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=150&auto=format&fit=crop&q=80' },
      pinterest: { name: 'LensGrowth Design',       avatar: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=150&auto=format&fit=crop&q=80' },
      tiktok:    { name: '@lensgrowth_tok',         avatar: 'https://images.unsplash.com/photo-1611605698323-b1e992d3777f?w=150&auto=format&fit=crop&q=80' },
      youtube:   { name: 'LensGrowth Channel',       avatar: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=150&auto=format&fit=crop&q=80' },
    };

    for (const platform of ALL_PLATFORMS) {
      const profile = demoProfiles[platform];
      await saveAccount(req.user.id, platform, {
        accessToken: `demo_token_${platform}`,
        accountName: profile.name,
        accountId:   `demo_${platform}_id`,
        avatarUrl:   profile.avatar,
        expiresAt:   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    res.json({ success: true, message: 'All demo accounts connected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/social/disconnect/:platform */
router.delete('/disconnect/:platform', requireAuth, async (req: any, res) => {
  try {
    const platform = req.params.platform as Platform;
    await disconnectAccount(req.user.id, platform);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Publishing ────────────────────────────────────────────────

/** POST /api/social/publish */
router.post('/publish', requireAuth, async (req: any, res) => {
  try {
    const { caption, mediaUrls = [], hashtags = [], platforms, link } = req.body;
    if (!platforms?.length) return res.status(400).json({ error: 'Select at least one platform' });

    const result = await publishPost(req.user.id, { caption, mediaUrls, hashtags, platforms, link });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/schedule */
router.post('/schedule', requireAuth, async (req: any, res) => {
  try {
    const { caption, mediaUrls = [], hashtags = [], platforms, link, scheduledAt } = req.body;
    if (!platforms?.length)  return res.status(400).json({ error: 'Select at least one platform' });
    if (!scheduledAt)        return res.status(400).json({ error: 'scheduledAt is required' });
    const date = new Date(scheduledAt);
    if (date <= new Date()) return res.status(400).json({ error: 'Scheduled time must be in the future' });

    const result = await schedulePost(req.user.id, { caption, mediaUrls, hashtags, platforms, link }, date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/social/schedule/:jobId */
router.patch('/schedule/:jobId', requireAuth, async (req: any, res) => {
  try {
    const { scheduledAt } = req.body;
    await rescheduleJob(req.user.id, req.params.jobId, new Date(scheduledAt));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/social/schedule/:jobId */
router.delete('/schedule/:jobId', requireAuth, async (req: any, res) => {
  try {
    await cancelScheduledJob(req.user.id, req.params.jobId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── History & Calendar ─────────────────────────────────────────

/** GET /api/social/history */
router.get('/history', requireAuth, async (req: any, res) => {
  try {
    const { platform, status, dateRange } = req.query;
    const history = await getHistory(req.user.id, { platform, status, dateRange });
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/social/scheduled */
router.get('/scheduled', requireAuth, async (req: any, res) => {
  try {
    const scheduled = await getScheduledPosts(req.user.id);
    res.json(scheduled);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/social/analytics */
router.get('/analytics', requireAuth, async (req: any, res) => {
  try {
    const analytics = await getAnalytics(req.user.id);
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Media Upload ─────────────────────────────────────────────

/** POST /api/social/media/upload */
router.post('/media/upload', requireAuth, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { buffer, mimetype, size } = req.file;
    const MAX_IMAGE = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
    const isVideo   = mimetype.startsWith('video/');

    if (!isVideo && size > MAX_IMAGE) return res.status(400).json({ error: 'Image must be under 10 MB' });
    if (isVideo  && size > MAX_VIDEO) return res.status(400).json({ error: 'Video must be under 100 MB' });

    const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/mov','video/avi','video/webm'];
    if (!ALLOWED.includes(mimetype)) return res.status(400).json({ error: `Unsupported file type: ${mimetype}` });

    const result = await handleMediaUpload(buffer, mimetype);
    res.json({
      url:          result.secureUrl,
      type:         isVideo ? 'video' : 'image',
      thumbnailUrl: result.thumbnailUrl || null,
      publicId:     result.publicId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── AI Features ──────────────────────────────────────────────

/** POST /api/social/ai/caption */
router.post('/ai/caption', requireAuth, async (req: any, res) => {
  try {
    const { prompt, tone = 'professional', platform = 'instagram' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const caption = await generateCaption(prompt, tone, platform);
    res.json({ caption });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/ai/hashtags */
router.post('/ai/hashtags', requireAuth, async (req: any, res) => {
  try {
    const { caption, platform = 'instagram' } = req.body;
    if (!caption) return res.status(400).json({ error: 'caption is required' });
    const hashtags = await generateHashtags(caption, platform);
    res.json({ hashtags });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/social/ai/best-time/:platform */
router.get('/ai/best-time/:platform', requireAuth, async (req, res) => {
  try {
    const result = await getBestPostingTime(req.params.platform);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/ai/rewrite */
router.post('/ai/rewrite', requireAuth, async (req: any, res) => {
  try {
    const { caption, platform } = req.body;
    if (!caption || !platform) return res.status(400).json({ error: 'caption and platform required' });
    const rewritten = await rewriteForPlatform(caption, platform);
    res.json({ caption: rewritten });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/apify/scrape */
router.post('/apify/scrape', requireAuth, async (req: any, res) => {
  try {
    const { platform = 'instagram', handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'handle or URL is required' });
    const data = await apifyService.scrapeProfile(platform, handle);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/social/apify/competitor-analysis */
router.post('/apify/competitor-analysis', requireAuth, async (req: any, res) => {
  try {
    const { platform = 'instagram', handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'handle or URL is required' });
    const analysis = await apifyService.analyzeCompetitor(platform, handle);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
