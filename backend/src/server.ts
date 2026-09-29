import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

import { pool, initDb } from './db';
import { runMigrations } from './migrations';
import { startQueueWorker, scrapeWebsite } from './queue';
import { validateUrlForSSRF } from './security';
import { llmJson, llmText, checkLlmHealth } from './llm';
import { enforceQuota, incrementUsage, getUserPlan, PLAN_LIMITS } from './quotas';
import { getUserSubscription, requirePlan, handleBillingWebhook, createCheckoutSession } from './billing';
import { NETWORKS, createXPKCEState, consumeOAuthState, getTikTokProfile, createLinkedInPost } from './social';
import {
  EFFECTIVE_JWT_SECRET,
  requireAuth,
  requireRole,
  AuthenticatedRequest,
  registerUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from './auth';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// Apply Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Handled per route / frontend if needed
}));

// Trusted CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:3000', 'https://growthlens.ai'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
}));

// Stripe Webhook Raw Body Route (MUST be mounted before express.json parser for signature verification)
app.post('/billing/webhook', express.raw({ type: 'application/json' }), handleBillingWebhook);
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleBillingWebhook);

// Payload Limiters
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Structured Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  res.on('finish', () => {
    const duration = Date.now() - start;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id || 'anonymous';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - IP: ${ip} - User: ${userId}`);
  });
  next();
});

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15,
  message: { detail: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { detail: 'Too many scan creation requests from this IP. Please slow down.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { detail: 'API rate limit exceeded. Please wait a few minutes.' },
});

// Apply General API Limiter
app.use(apiLimiter);

// ============ PROMPTS ============
const COMPARE_SYS = `You are a competitive-analysis growth strategist. Compare two websites and output strictly valid JSON only.`;

const COMPARE_PROMPT = `Compare these two websites and respond with ONLY a JSON object:

{
  "winner": "mine|competitor|tie",
  "verdict": "<2-3 sentence plain-English verdict on who wins and why>",
  "subscores": {
    "trust":       {"mine": <0-100>, "competitor": <0-100>},
    "conversion":  {"mine": <0-100>, "competitor": <0-100>},
    "ux":          {"mine": <0-100>, "competitor": <0-100>},
    "copywriting": {"mine": <0-100>, "competitor": <0-100>},
    "brand":       {"mine": <0-100>, "competitor": <0-100>},
    "seo":         {"mine": <0-100>, "competitor": <0-100>}
  },
  "overall": {"mine": <0-100>, "competitor": <0-100>},
  "where_they_win": ["<3-5 bullets: what competitor does better>"],
  "where_you_win":  ["<3-5 bullets: what you do better>"],
  "steal_this":     ["<3-5 concrete tactics to copy from the competitor>"]
}

MINE (already-scored site):
{mine}

COMPETITOR (raw scraped data):
{comp}`;

const CEO_SYS = `You are the CEO AI — the head of GrowthLens's AI Growth Team.
Synthesize input from 13 specialist experts into a sharp executive decision. Do NOT rehash every expert. Be decisive. Output strictly valid JSON only.`;

const CEO_PROMPT = `Below is the site context, followed by the 13 expert opinions.
Synthesize an executive decision as JSON:

{
  "verdict": "<2-3 sentence executive verdict on the site's biggest lever>",
  "biggest_opportunity": "<one sentence — the single fix with the highest ROI>",
  "biggest_risk": "<one sentence — the biggest risk if they change nothing>",
  "top_3_moves": [
    {"title":"<short>", "why":"<1 sentence>", "owner":"<which expert leads this>", "expected_revenue_lift_pct": <0-40>}
  ],
  "consensus_score": <0-100 how aligned the 13 experts are>,
  "board_confidence": <0-100 overall confidence in the plan>,
  "estimated_total_monthly_lift_pct": <0-40>
}

SITE CONTEXT:
{ctx}

EXPERT OPINIONS:
{experts}`;

const REVENUE_LEAK_SYS = `You are the Revenue Leak Analyst. Given a scan and expert opinions,
estimate the plausible monthly revenue leakage from current issues.
These are ESTIMATES with methodology assumptions. Never claim absolute certainty. Output strictly valid JSON only.`;

const REVENUE_LEAK_PROMPT = `Estimate monthly revenue leakage for this business. Output JSON:

{
  "assumed_monthly_visitors": <int, e.g. 3000>,
  "assumed_current_conversion_pct": <float, e.g. 1.2>,
  "assumed_avg_order_value_usd": <float, e.g. 60>,
  "current_monthly_revenue_usd": <int>,
  "monthly_revenue_lost_usd": <int>,
  "lead_loss_pct": <float 0-100>,
  "bounce_increase_pct": <float 0-100>,
  "trust_loss_pct": <float 0-100>,
  "confidence_score": <0-100>,
  "potential_revenue_after_fix_usd": <int>,
  "monthly_lift_usd": <int>,
  "breakdown": [
    {"issue":"<short>", "monthly_loss_usd": <int>, "why":"<1 sentence>"}
  ],
  "methodology": "<2-3 sentence plain-English explanation of assumptions>"
}

CONTEXT:
{ctx}
EXPERT SUMMARY:
{expert_summary}`;

const ASSISTANT_SYS = `You are the GrowthLens AI Assistant — a helpful growth consultant.
You have access to the user's recent scan summaries. Answer concisely (2-4 short paragraphs max, plain English).
Never invent scan data — only reference what you're given.`;

const CONTENT_PLAN_SYS = `You are a content calendar planner for creators. Output strictly valid JSON only.`;

const CONTENT_PLAN_PROMPT = `Create a {days}-day content plan based on this creator analysis. JSON schema:

{
  "days": [
    {"day": 1, "date_label": "Day 1", "platform":"<instagram|x|linkedin|youtube|tiktok>","format":"<reel|post|short|tweet>","title":"<title>","hook":"<hook>","caption":"<short caption>","cta":"<call to action>","best_time":"<e.g., 7-9pm>"}
  ]
}

Generate exactly {days} entries (one per day). Vary platforms and formats.

CREATOR CONTEXT:
{ctx}`;

// ============ GROWTH TEAM AGENTS ============
const GROWTH_TEAM_AGENTS = [
  { key: 'ux_expert', name: 'UX Expert', specialty: 'Usability & Page Flow', system: 'You are a Senior UX Expert. Focus on usability and friction points.' },
  { key: 'seo_expert', name: 'SEO Expert', specialty: 'Rankings & Technical SEO', system: 'You are a Senior SEO Expert. Focus on SEO structure and schema.' },
  { key: 'brand_expert', name: 'Brand Expert', specialty: 'Brand Perception & Identity', system: 'You are a Senior Brand Strategist. Focus on brand clarity and tone.' },
  { key: 'copywriter', name: 'Copywriter', specialty: 'Messaging & Headlines', system: 'You are a Senior Copywriter. Focus on value propositions and headlines.' },
  { key: 'sales_expert', name: 'Sales Expert', specialty: 'Conversion & Funnel Design', system: 'You are a Senior Sales Consultant. Focus on conversion friction.' },
  { key: 'marketing_expert', name: 'Marketing Expert', specialty: 'Positioning & Messaging', system: 'You are a Senior Marketing Strategist. Focus on market positioning.' },
  { key: 'customer_psychologist', name: 'Customer Psychologist', specialty: 'Buyer Biases & Trust', system: 'You are a Consumer Psychologist. Focus on emotional triggers.' },
  { key: 'pricing_expert', name: 'Pricing Expert', specialty: 'Price Anchoring', system: 'You are a Pricing Strategist. Focus on price anchoring and value.' },
  { key: 'accessibility_expert', name: 'Accessibility Expert', specialty: 'WCAG 2.2 Standards', system: 'You are an Accessibility Expert. Focus on WCAG signals.' },
  { key: 'analytics_expert', name: 'Analytics Expert', specialty: 'Event Measurement Gaps', system: 'You are an Analytics Consultant. Focus on tracking gaps.' },
  { key: 'performance_engineer', name: 'Performance Engineer', specialty: 'Core Web Vitals', system: 'You are a Web Performance Engineer. Focus on speed signals.' },
  { key: 'growth_hacker', name: 'Growth Hacker', specialty: 'Viral & Referral Loops', system: 'You are a Growth Hacker. Focus on activation and viral hooks.' },
  { key: 'competitor_analyst', name: 'Competitor Analyst', specialty: 'Differentiation Gaps', system: 'You are a Competitive Analyst. Focus on market positioning gaps.' },
];

const EXPERT_JSON_SCHEMA = `{
  "opinion": "<2-3 sentence blunt professional opinion>",
  "confidence": <0-100>,
  "impact": "high|medium|low",
  "priority": <1-5>,
  "recommendation": "<one specific next step>",
  "estimated_revenue_gain_pct": <0-30>,
  "risk_if_ignored": "<one short sentence>"
}`;

// ============ API ROUTER ============
const api = express.Router();

// System Health Endpoints
api.get('/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    const llmStatus = await checkLlmHealth();
    return res.json({
      status: llmStatus.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbCheck.rows.length > 0 ? 'connected' : 'disconnected',
      llm_providers: llmStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', detail: err.message });
  }
});

api.get('/health/llm', async (req: Request, res: Response) => {
  const llmStatus = await checkLlmHealth();
  return res.json(llmStatus);
});

// Auth Routes
api.post('/auth/register', authLimiter, registerUser);

api.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = jwt.sign({ sub: user.id }, EFFECTIVE_JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified || false,
        created_at: user.created_at.toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

api.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json(req.user);
});

api.post('/auth/change-password', requireAuth, changePassword);
api.post('/auth/forgot-password', authLimiter, forgotPassword);
api.post('/auth/reset-password', authLimiter, resetPassword);
api.post('/auth/verify-email', verifyEmail);

// User Profile Settings Endpoint
api.patch('/auth/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ detail: 'Name is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, created_at',
      [name.trim(), req.user!.id]
    );
    const updated = result.rows[0];
    return res.json({
      ...updated,
      created_at: updated.created_at.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Durable Scan Creation Route (Job Queue Enqueue)
api.post('/scans', scanLimiter, requireAuth, enforceQuota('scan'), async (req: AuthenticatedRequest, res: Response) => {
  const { mode, target, notes, industry } = req.body;

  if (!mode || !target) {
    return res.status(400).json({ detail: 'Mode and target URL are required' });
  }

  // SSRF Validation for Business Scans
  if (mode === 'business') {
    const ssrf = await validateUrlForSSRF(target);
    if (!ssrf.valid) {
      return res.status(400).json({ detail: `SSRF Validation Error: ${ssrf.reason}` });
    }
  }

  const sid = uuidv4();
  const jid = uuidv4();
  const now = new Date();

  try {
    // 1. Create Scan Record
    await pool.query(
      'INSERT INTO scans (id, user_id, mode, target, notes, industry, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [sid, req.user!.id, mode, target, notes || '', industry || 'auto', 'pending', now]
    );

    // 2. Enqueue Job in scan_jobs Table
    await pool.query(
      `INSERT INTO scan_jobs (id, scan_id, user_id, mode, target, notes, industry, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
      [jid, sid, req.user!.id, mode, target, notes || '', industry || 'auto', now]
    );

    // Increment user usage metrics
    await incrementUsage(req.user!.id, mode === 'creator' ? 'creator_scans_count' : 'scans_count', 5000);

    return res.status(201).json({
      id: sid,
      job_id: jid,
      user_id: req.user!.id,
      mode,
      target,
      notes: notes || '',
      industry: industry || 'auto',
      status: 'pending',
      score: 0,
      created_at: now.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// List Scans
api.get('/scans', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user!.id]
    );
    const scans = result.rows.map(s => ({
      ...s,
      created_at: s.created_at.toISOString(),
    }));
    return res.json(scans);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Get Single Scan
api.get('/scans/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found or access denied' });
    }
    const scan = result.rows[0];
    return res.json({
      ...scan,
      created_at: scan.created_at.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Delete Scan
api.delete('/scans/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ detail: 'Scan not found or access denied' });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Run AI Growth Team
api.post('/scans/:id/growth-team', requireAuth, enforceQuota('growth_team'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scanRes = await pool.query('SELECT * FROM scans WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    if (scanRes.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found or access denied' });
    }
    const scan = scanRes.rows[0];
    if (scan.mode !== 'business') {
      return res.status(400).json({ detail: 'AI Growth Team panel is only available for business website scans' });
    }
    if (scan.status !== 'complete') {
      return res.status(400).json({ detail: 'Scan must finish processing before executing the AI Growth Team panel' });
    }

    const ctx = JSON.stringify(scan.result || {}).substring(0, 3000);
    console.log(`Growth Team: executing parallel 13-agent panel for scan ${scan.id}`);

    // Execute specialists in parallel with timeout
    const experts = await Promise.all(
      GROWTH_TEAM_AGENTS.map(async (agent) => {
        const sys = `${agent.system}\n\nRespond with ONLY a JSON object matching:\n${EXPERT_JSON_SCHEMA}`;
        const uText = `SCAN CONTEXT:\n${ctx}\n\nProvide your JSON response now.`;
        try {
          const parsed = await llmJson(sys, uText, `${scan.id}_${agent.key}`);
          return {
            agent_key: agent.key,
            agent_name: agent.name,
            specialty: agent.specialty,
            ...parsed,
          };
        } catch (err: any) {
          return {
            agent_key: agent.key,
            agent_name: agent.name,
            specialty: agent.specialty,
            opinion: `(Agent panel unavailable: ${err.message})`,
            confidence: 0,
            impact: 'low',
            priority: 5,
            recommendation: 'Retry later',
            estimated_revenue_gain_pct: 0,
            risk_if_ignored: '',
          };
        }
      })
    );

    const expertSummary = JSON.stringify(
      experts.map(e => ({
        agent: e.agent_name,
        opinion: e.opinion,
        impact: e.impact,
        priority: e.priority,
        recommendation: e.recommendation,
      }))
    ).substring(0, 6000);

    const ceoResult = await llmJson(
      CEO_SYS,
      CEO_PROMPT.replace('{ctx}', ctx.substring(0, 2000)).replace('{experts}', expertSummary),
      `${scan.id}_ceo`
    );

    const r = scan.result || {};
    const revenueLeak = await llmJson(
      REVENUE_LEAK_SYS,
      REVENUE_LEAK_PROMPT.replace('{ctx}', ctx.substring(0, 2000))
        .replace('{expert_summary}', expertSummary.substring(0, 3000)),
      `${scan.id}_revleak`
    );

    const growthTeamDoc = {
      experts,
      executive_summary: ceoResult,
      generated_at: new Date().toISOString(),
      agent_count: experts.length,
    };

    await pool.query(
      'UPDATE scans SET growth_team = $1, revenue_leak = $2 WHERE id = $3',
      [JSON.stringify(growthTeamDoc), JSON.stringify(revenueLeak), scan.id]
    );

    await incrementUsage(req.user!.id, 'growth_team_calls', 25000);

    return res.json({
      growth_team: growthTeamDoc,
      revenue_leak: revenueLeak,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Compare Competitor Website
api.post('/scans/:id/compare', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { competitor_url } = req.body;
  if (!competitor_url) {
    return res.status(400).json({ detail: 'Competitor URL is required' });
  }

  const ssrf = await validateUrlForSSRF(competitor_url);
  if (!ssrf.valid) {
    return res.status(400).json({ detail: `SSRF Validation Error for Competitor URL: ${ssrf.reason}` });
  }

  try {
    const scanResult = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (scanResult.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    const scan = scanResult.rows[0];

    const compScraped = await scrapeWebsite(competitor_url);
    const r = scan.result || {};
    const mineCtx = {
      url: scan.target,
      score: scan.score,
      subscores: r.subscores,
      summary: r.summary,
      strengths: r.strengths,
    };

    const prompt = COMPARE_PROMPT
      .replace('{mine}', JSON.stringify(mineCtx).substring(0, 4000))
      .replace('{comp}', JSON.stringify({
        url: compScraped.url,
        title: compScraped.title,
        meta_description: compScraped.meta_description,
        h1: compScraped.h1,
        h2: compScraped.h2,
        body_text_sample: compScraped.body_text_sample.substring(0, 2500),
      }).substring(0, 4500));

    const result = await llmJson(COMPARE_SYS, prompt, `${req.params.id}_cmp`);
    result.competitor_url = compScraped.url;

    await pool.query('UPDATE scans SET comparison = $1 WHERE id = $2', [JSON.stringify(result), req.params.id]);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Assistant Chat Endpoint (With FIXED ${message} variable replacement bug)
api.post('/assistant/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { message, history, session_id } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ detail: 'Message string is required' });
  }

  try {
    const scansRes = await pool.query(
      'SELECT id, mode, target, score, result FROM scans WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 5',
      [req.user!.id, 'complete']
    );

    const contextLines = scansRes.rows.map(s => {
      const summary = s.result?.summary || '';
      return `- ${s.mode.toUpperCase()} · ${s.target.substring(0, 80)} · score=${s.score}/100 · summary: ${summary.substring(0, 180)}`;
    });

    const ctxBlock = contextLines.length ? contextLines.join('\n') : '(no completed scans yet)';
    let historyText = '';
    const sliceHistory = (history || []).slice(-6);
    for (const msg of sliceHistory) {
      const rolePrefix = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      historyText += `\n${rolePrefix}: ${msg.text}`;
    }

    const sid = session_id || `assistant_${req.user!.id}`;
    const systemMessage = `${ASSISTANT_SYS}\n\nUser's name: ${req.user!.name}. Recent scans:\n${ctxBlock}`;
    
    // BUG FIX: Substitute the actual `message` variable instead of raw string '{message}'!
    const userText = `CONVERSATION SO FAR:${historyText}\n\nUSER: ${message.trim()}\nASSISTANT:`;

    const text = await llmText(systemMessage, userText, sid);
    return res.json({ reply: text.trim(), session_id: sid });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Content Plan Route
api.post('/content-plan', requireAuth, enforceQuota('creator'), async (req: AuthenticatedRequest, res: Response) => {
  const { scan_id, days } = req.body;
  const numDays = parseInt(days) || 7;

  try {
    const scanResult = await pool.query('SELECT * FROM scans WHERE id = $1 AND user_id = $2', [scan_id, req.user!.id]);
    if (scanResult.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }

    const scan = scanResult.rows[0];
    const ctx = JSON.stringify(scan.result || {}).substring(0, 6000);
    const prompt = CONTENT_PLAN_PROMPT
      .replace(/\{days\}/g, String(numDays))
      .replace('{ctx}', ctx);

    const plan = await llmJson(CONTENT_PLAN_SYS, prompt, `${scan_id}_plan`);
    const pid = uuidv4();
    const now = new Date();

    await pool.query(
      'INSERT INTO content_plans (id, scan_id, user_id, days, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [pid, scan_id, req.user!.id, numDays, plan, now]
    );

    return res.json({
      id: pid,
      scan_id,
      user_id: req.user!.id,
      days: numDays,
      plan,
      created_at: now.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Stats API
api.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scansRes = await pool.query('SELECT * FROM scans WHERE user_id = $1', [req.user!.id]);
    const scans = scansRes.rows;
    const biz = scans.filter(s => s.mode === 'business' && s.status === 'complete');
    const cre = scans.filter(s => s.mode === 'creator' && s.status === 'complete');

    const avg_biz = biz.length ? Math.round((biz.reduce((sum, s) => sum + s.score, 0) / biz.length) * 10) / 10 : 0;
    const avg_cre = cre.length ? Math.round((cre.reduce((sum, s) => sum + s.score, 0) / cre.length) * 10) / 10 : 0;

    return res.json({
      total_scans: scans.length,
      business_scans: biz.length,
      creator_scans: cre.length,
      avg_business_score: avg_biz,
      avg_creator_score: avg_cre,
      total_leads: biz.reduce((sum, s) => sum + ((s.result?.leads || []).length), 0),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Dashboard Aggregator Endpoint
api.get('/dashboard', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scansRes = await pool.query(
      'SELECT id, mode, score, status, target, comparison, result, created_at FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    const scans = scansRes.rows;
    const complete = scans.filter(s => s.status === 'complete');
    const biz = complete.filter(s => s.mode === 'business');

    const avg_score = complete.length ? Math.round((complete.reduce((sum, s) => sum + s.score, 0) / complete.length) * 10) / 10 : 0;
    const plan = await getUserPlan(req.user!.id);
    const sub = await getUserSubscription(req.user!.id);

    return res.json({
      user: { name: req.user!.name, email: req.user!.email, role: req.user!.role },
      subscription: { plan_id: plan, status: sub.status, limits: PLAN_LIMITS[plan] },
      totals: {
        total_scans: scans.length,
        complete_scans: complete.length,
        business_scans: biz.length,
        leads: biz.reduce((sum, s) => sum + ((s.result?.leads || []).length), 0),
      },
      growth_score: avg_score,
      recent_scans: scans.slice(0, 10).map(s => ({
        ...s,
        created_at: s.created_at.toISOString(),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Billing Routes
api.get('/billing/subscription', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await getUserSubscription(req.user!.id);
    const planId = sub.plan_id || 'free';
    const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
    const usage = await pool.query('SELECT * FROM usage_records WHERE user_id = $1 AND usage_date = CURRENT_DATE', [req.user!.id]);
    return res.json({
      subscription: sub,
      plan_id: planId,
      limits,
      usage: usage.rows[0] || { scans_count: 0, growth_team_calls: 0, creator_scans_count: 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

api.post('/billing/create-checkout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { plan_id } = req.body;
  try {
    const session = await createCheckoutSession(req.user!.id, req.user!.email, plan_id || 'pro');
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

api.post('/billing/webhook', async (req: Request, res: Response) => {
  return handleBillingWebhook(req, res);
});

// Social Certified Networks Routes
api.get('/social/networks', (req: Request, res: Response) => {
  return res.json(NETWORKS);
});

api.post('/social/x/auth-url', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pkce = await createXPKCEState(req.user!.id);
    return res.json(pkce);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

api.post('/social/x/callback', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { state } = req.body;
  if (!state) {
    return res.status(400).json({ detail: 'State parameter is required' });
  }

  const check = await consumeOAuthState(state, 'x');
  if (!check.valid) {
    return res.status(400).json({ detail: check.error });
  }

  return res.json({ ok: true, message: 'X OAuth 2.0 PKCE authentication successfully verified.' });
});

api.get('/social/tiktok/profile', requireAuth, async (req: Request, res: Response) => {
  const handle = String(req.query.handle || '');
  if (!handle) {
    return res.status(400).json({ detail: 'Handle query parameter is required' });
  }
  const profile = await getTikTokProfile(handle);
  return res.json(profile);
});

api.post('/social/linkedin/post', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { text, title } = req.body;
  try {
    const postPayload = await createLinkedInPost(req.user!.id, text, title);
    return res.json({ ok: true, payload: postPayload });
  } catch (err: any) {
    return res.status(400).json({ detail: err.message });
  }
});

// Public Shareable Scan Routes
api.get('/public/scans/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, mode, target, score, status, result, created_at FROM scans WHERE id = $1 AND status = $2',
      [req.params.id, 'complete']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Public scan result not found' });
    }
    const scan = result.rows[0];
    const r = scan.result || {};
    return res.json({
      id: scan.id,
      target: scan.target,
      mode: scan.mode,
      score: scan.score,
      created_at: scan.created_at.toISOString(),
      summary: r.summary,
      subscores: r.subscores,
      strengths: r.strengths || [],
      top_fixes: (r.top_fixes || []).map((f: any) => ({ title: f.title, why: f.why, priority: f.priority })),
      disclaimer: 'This public report is an AI growth audit produced by GrowthLens AI.',
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

api.get('/public/scans/:id/badge.svg', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT score FROM scans WHERE id = $1 AND status = $2',
      [req.params.id, 'complete']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    const score = result.rows[0].score || 0;
    const color = score >= 75 ? '#047857' : score >= 50 ? '#eab308' : '#dc2626';
    const label = 'GrowthLens Score';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="56" viewBox="0 0 220 56">
  <rect width="220" height="56" rx="8" fill="#0a0a0a"/>
  <rect x="0" y="0" width="150" height="56" rx="8" fill="#111"/>
  <text x="18" y="22" font-family="ui-sans-serif,system-ui" font-size="10" fill="#a1a1aa" letter-spacing="2">GROWTHLENS</text>
  <text x="18" y="42" font-family="ui-sans-serif,system-ui" font-size="14" font-weight="600" fill="#f8fafc">${label}</text>
  <rect x="150" y="0" width="70" height="56" fill="${color}" rx="8"/>
  <rect x="150" y="0" width="10" height="56" fill="${color}"/>
  <text x="185" y="36" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="24" font-weight="800" fill="#ffffff">${score}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(svg);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Attach Router
app.use(api);

// Startup & Initialization
(async () => {
  try {
    await initDb();
    await runMigrations();
    startQueueWorker(2500);

    app.listen(PORT, () => {
      console.log(`GrowthLens Production Express Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

export default app;
