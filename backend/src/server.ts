import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';

import { pool, initDb } from './db';
import { llmJson, llmText } from './llm';

dotenv.config({ path: path.join(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
}));

// ============ PROMPTS & SCHEMAS ============
const BUSINESS_SYS = `You are GrowthLens AI, a senior conversion-rate optimization analyst.
You analyze a public business website and output strictly valid JSON. Use plain English,
specific to the site content provided. Never invent facts not present in the data.

SCORING CRITIQUE RULES:
1. Be highly critical, objective, and realistic. Do NOT output generic, boilerplate, or safe scores like 85 or 90. Most websites have notable flaws and should score between 45 and 75. A score above 80 should be extremely rare and reserved for virtually perfect sites.
2. Evaluate each subscore dynamically:
   - Trust: Base this on SSL/HTTPS presence, contact info (emails/phones found), and clear value propositions.
   - Conversion: Base this on presence and quality of buttons/CTAs, clear headlines, and distinct copy.
   - UX: Base this on viewport existence, cleanliness of structure, and clear headers (h1/h2).
   - Copywriting: Base this on clarity and persuasive power of the titles, h1, h2, and body sample text.
   - Brand: Base this on consistency of the messaging, brand personality, and description.
   - SEO: Base this on title tag length and descriptiveness, meta description existence, and h1/h2 count/quality.
3. The overall "score" MUST be the exact mathematical average of the six subscores (rounded to the nearest integer) to maintain strict logical consistency.`;

const BUSINESS_PROMPT = `Analyze this website data and respond with ONLY a JSON object in this exact schema:

{
  "score": <0-100 integer overall>,
  "subscores": {
    "trust": <0-100>,
    "conversion": <0-100>,
    "ux": <0-100>,
    "copywriting": <0-100>,
    "brand": <0-100>,
    "seo": <0-100>
  },
  "summary": "<2-3 sentence plain-English summary of what this business does and how the site performs>",
  "strengths": ["<3 short bullets>"],
  "top_fixes": [
    {
      "title":"<short fix>",
      "why":"<why this hurts conversions, plain English>",
      "action":"<exact next step>",
      "priority":"high|medium|low",
      "code_language":"css|html|jsx",
      "code_before":"<current problematic code snippet, short>",
      "code_after":"<improved code snippet, plain CSS or HTML>",
      "code_tailwind":"<same fix written as Tailwind classes on a small React JSX snippet>",
      "code_react":"<same fix written as a tiny React component using shadcn-style classes>"
    }
  ],
  "trust_gaps": ["<bullets>"],
  "cta_issues": ["<bullets>"],
  "seo_issues": ["<bullets>"],
  "mobile_issues": ["<bullets>"],
  "copywriting_rewrites": [
    {"section":"hero_headline|hero_subheadline|primary_cta|value_prop|testimonial_headline","before":"<current copy or 'none found'>","after":"<sharper rewrite>","why":"<why the new one converts better>"}
  ],
  "leads": [
    {"name":"<person or company>","role":"<title>","email":"<if found>","phone":"<if found>","source":"<where on site>","notes":"<context>"}
  ],
  "outreach_emails": [
    {"subject":"<subject>","body":"<3-paragraph email body referencing the site's specific weakness>","angle":"<the hook used>"}
  ],
  "sales_pitches": [
    {"angle":"<short>","pitch":"<2-3 sentences>"}
  ],
  "industry_detected": "<one word: restaurant|saas|ecommerce|portfolio|agency|hospital|school|realestate|blog|other>",
  "industry_insights": ["<4-6 industry-specific recommendations tuned to industry_detected or the provided industry hint>"],
  "screenshot_annotations": [
    {"label":"<short label, 2-4 words>","color":"red|yellow|green","x_pct":<0-100 approximate horizontal position on desktop screenshot>,"y_pct":<0-100 approximate vertical position>,"note":"<one-sentence explanation>"}
  ],
  "checklist": ["<5-7 next-step action items in plain language>"]
}

Provide exactly 5 top_fixes, 3 outreach_emails, 3 sales_pitches, 5 copywriting_rewrites (one per section listed), 4-6 industry_insights, and 4-6 screenshot_annotations (mix red for critical / yellow for warning / green for strengths, roughly positioned across the fold).
Each top_fix MUST include realistic, copy-pasteable code snippets. Keep snippets under 15 lines each.
If no leads found, return an empty list for leads.

SECURITY, PRIVACY & SEO INSTRUCTIONS:
- You must carefully analyze the 'security' object in the WEBSITE DATA (which contains SSL, HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy status, privacy/terms links, and plain-text email count).
- Under 'trust_gaps', explicitly focus on security and privacy gaps: list any missing security headers, missing SSL/HTTPS, lack of Privacy Policy/Terms links, and security vulnerabilities like plain-text email exposure.
- Under 'top_fixes', prioritize Trust fixes that provide clear instructions and configuration code/tags to resolve these security and privacy vulnerabilities.

INDUSTRY HINT (may be 'auto' or empty): {industry}

WEBSITE DATA:
{data}`;

const CREATOR_SYS = `You are GrowthLens AI, a creator-economy growth strategist.
You analyze public social profile links and output strictly valid JSON. Use plain
English and concrete examples. Do not claim private platform access; reason from the URLs
and any provided notes.

SCORING CRITIQUE RULES:
1. Be highly critical and objective. Avoid safe boilerplate scores (like 80 or 85). Profile scores should vary dynamically based on target link and notes, generally ranging between 40 and 75 for average profiles.
2. Evaluate the overall "score" by critically assessing niche clarity, strength of branding, audience signals, and CTA positioning.`;

const CREATOR_PROMPT = `Analyze these creator profile link(s) and respond with ONLY a JSON object:

{
  "score": <0-100>,
  "summary": "<who this creator appears to be and current positioning>",
  "niche_clarity": "<plain-English read on niche clarity>",
  "content_pillars": ["<3-5 pillars>"],
  "audience_signals": ["<bullets>"],
  "strengths": ["<bullets>"],
  "weaknesses": ["<bullets>"],
  "bio_improvements": ["<bullets>"],
  "cta_improvements": ["<bullets>"],
  "profile_layout_improvements": ["<bullets>"],
  "post_ideas": [
    {"title":"<idea>","format":"<reel|carousel|short|tweet|post>","hook":"<opening line>","why":"<why it works>"}
  ],
  "captions": [
    {"caption":"<full caption>","hashtags":["<5-8 tags>"]}
  ],
  "hooks": ["<5 short hooks>"],
  "checklist": ["<5-7 next steps>"]
}

Provide exactly 10 post_ideas, 5 captions.

PROFILE LINK(S): {data}
NOTES: {notes}`;

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

const COMPARE_SYS = `You are a competitive-analysis growth strategist. Compare two websites and output strictly valid JSON only.

SCORING CRITIQUE RULES:
1. Be highly critical, objective, and realistic. Do NOT output generic, boilerplate, or identical scores (like 85) for both sites. Most websites have notable flaws and should score between 45 and 75.
2. Calculate the overall "overall" score for both 'mine' and 'competitor' as the exact mathematical average of their respective subscores.`;

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
You have received opinions from 13 specialist experts (UX, SEO, Brand, Copywriter,
Sales, Marketing, Consumer Psychology, Pricing, Accessibility, Analytics, Performance,
Growth Hacker, Competitor Analyst). Your job is to synthesize their input into a
sharp executive decision. Do NOT rehash every expert — surface only what matters.
Be decisive. Output strictly valid JSON only.`;

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

Provide exactly 3 top_3_moves.

SITE CONTEXT:
{ctx}

EXPERT OPINIONS (13 experts):
{experts}`;

const REVENUE_LEAK_SYS = `You are the Revenue Leak Analyst. Given a scan and expert opinions,
estimate the plausible monthly revenue leakage from the current site issues.
Be honest: these are ESTIMATES with methodology assumptions. Never claim certainty.
Output strictly valid JSON only.`;

const REVENUE_LEAK_PROMPT = `Estimate monthly revenue leakage for this business. Reason about
typical traffic + conversion assumptions for the detected industry, then apply the site's
current issues. Output JSON:

{
  "assumed_monthly_visitors": <int, e.g. 3000>,
  "assumed_current_conversion_pct": <float, e.g. 1.2>,
  "assumed_avg_order_value_usd": <float, e.g. 60>,
  "current_monthly_revenue_usd": <int>,
  "monthly_revenue_lost_usd": <int, from friction/trust/CTA issues>,
  "lead_loss_pct": <float 0-100>,
  "bounce_increase_pct": <float 0-100>,
  "trust_loss_pct": <float 0-100>,
  "confidence_score": <0-100>,
  "potential_revenue_after_fix_usd": <int, monthly revenue if top 3 fixes ship>,
  "monthly_lift_usd": <int>,
  "breakdown": [
    {"issue":"<short>", "monthly_loss_usd": <int>, "why":"<1 sentence>"}
  ],
  "methodology": "<2-3 sentence plain-English explanation of assumptions>"
}

Provide 3-5 breakdown items. Assumed numbers should be plausible for the industry
({industry}) and site scale hints in the context. Never output negative numbers.

CONTEXT:
{ctx}

EXPERT SUMMARY:
{expert_summary}`;

// ============ SCRAPER HELPER ============
async function scrapeWebsite(targetUrl: string) {
  let url = targetUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrowthLensBot/1.0)',
      },
    });
    const html = response.data;
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim();
    const meta_description = $('meta[name="description"]').attr('content')?.trim() || '';
    const og_title = $('meta[property="og:title"]').attr('content')?.trim() || '';
    
    const h1: string[] = [];
    $('h1').slice(0, 5).each((_, el) => {
      h1.push($(el).text().replace(/\s+/g, ' ').trim());
    });
    
    const h2: string[] = [];
    $('h2').slice(0, 10).each((_, el) => {
      h2.push($(el).text().replace(/\s+/g, ' ').trim());
    });
    
    const buttons_or_links: string[] = [];
    $('button, a').each((_, el) => {
      const txt = $(el).text().trim();
      if (txt && txt.length < 50 && buttons_or_links.length < 30) {
        buttons_or_links.push(txt.replace(/\s+/g, ' '));
      }
    });
    
    const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
    const emails_found = Array.from(new Set(html.match(emailRegex) || [])).slice(0, 10);
    
    const phoneRegex = /\+?\d[\d\s().-]{7,}\d/g;
    const phones_found = Array.from(new Set(html.match(phoneRegex) || [])).slice(0, 10);
    
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace('www.', '');
    const internal_links: string[] = [];
    const social_links: Record<string, string> = {};
    
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        const absolute = new URL(href, url).href;
        const host = new URL(absolute).hostname;
        
        if (host.includes('facebook.com')) social_links.facebook = absolute;
        else if (host.includes('instagram.com')) social_links.instagram = absolute;
        else if (host.includes('linkedin.com')) social_links.linkedin = absolute;
        else if (host.includes('twitter.com') || host.includes('x.com')) social_links.twitter = absolute;
        else if (host.includes('youtube.com')) social_links.youtube = absolute;
        else if (host.includes(domain) && internal_links.length < 25) {
          internal_links.push(absolute);
        }
      } catch (err) {
        // Ignore invalid URL resolution
      }
    });
    
    $('script, style, noscript').remove();
    const bodyTextClean = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 4000);
    
    const headers = response.headers || {};
    const has_privacy_policy = internal_links.some(l => l.toLowerCase().includes('privacy') || l.toLowerCase().includes('policy')) ||
      buttons_or_links.some(l => l.toLowerCase().includes('privacy') || l.toLowerCase().includes('policy'));
    const has_terms = internal_links.some(l => l.toLowerCase().includes('terms') || l.toLowerCase().includes('tos') || l.toLowerCase().includes('condition')) ||
      buttons_or_links.some(l => l.toLowerCase().includes('terms') || l.toLowerCase().includes('tos') || l.toLowerCase().includes('condition'));

    const security = {
      has_https: url.startsWith('https://'),
      has_csp: !!(headers['content-security-policy'] || headers['csp']),
      has_hsts: !!headers['strict-transport-security'],
      has_xfo: !!headers['x-frame-options'],
      has_xcto: !!headers['x-content-type-options'],
      has_referrer_policy: !!headers['referrer-policy'],
      has_privacy_policy,
      has_terms,
      exposed_emails_count: emails_found.length,
    };

    return {
      url,
      title,
      meta_description,
      og_title,
      h1,
      h2,
      buttons_or_links,
      emails_found,
      phones_found,
      internal_links: Array.from(new Set(internal_links)),
      social_links,
      has_https: url.startsWith('https://'),
      has_viewport: $('meta[name="viewport"]').length > 0,
      body_text_sample: bodyTextClean,
      security,
    };
  } catch (err: any) {
    throw new Error(`Could not fetch site: ${err.message}`);
  }
}

// ============ AUTH MIDDLEWARE ============
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };
}

async function currentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'User not found' });
    }
    const user = result.rows[0];
    req.user = {
      ...user,
      created_at: user.created_at.toISOString(),
    };
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

// ============ API ROUTES ============
const api = express.Router();

// Register
api.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const id = uuidv4();
    const now = new Date();

    await pool.query(
      'INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, email.toLowerCase(), name, role || 'business', hash, now]
    );

    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: { id, email: email.toLowerCase(), name, role: role || 'business', created_at: now.toISOString() },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Login
api.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at.toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Current User Details
api.get('/auth/me', currentUser as any, (req: AuthenticatedRequest, res: Response) => {
  return res.json(req.user);
});

// Create Scan
api.post('/scans', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  const { mode, target, notes, industry } = req.body;
  const sid = uuidv4();
  const now = new Date();

  try {
    await pool.query(
      'INSERT INTO scans (id, user_id, mode, target, notes, industry, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [sid, req.user!.id, mode, target, notes || '', industry || 'auto', 'processing', now]
    );

    // Run async analysis
    (async () => {
      try {
        let result: any = {};
        if (mode === 'business') {
          const scraped = await scrapeWebsite(target);
          const prompt = BUSINESS_PROMPT
            .replace('{data}', JSON.stringify(scraped).substring(0, 8000))
            .replace('{industry}', industry || 'auto');
          
          result = await llmJson(BUSINESS_SYS, prompt, sid);
          const enc = encodeURIComponent(scraped.url);
          
          result.screenshots = {
            desktop: `https://s0.wp.com/mshots/v1/${enc}?w=1200&h=900`,
            mobile: `https://s0.wp.com/mshots/v1/${enc}?w=400&h=800`,
          };
          result.scraped = {
            title: scraped.title,
            meta_description: scraped.meta_description,
            social_links: scraped.social_links,
            emails_found: scraped.emails_found,
            phones_found: scraped.phones_found,
            has_https: scraped.has_https,
            has_viewport: scraped.has_viewport,
          };
        } else {
          const prompt = CREATOR_PROMPT
            .replace('{data}', target)
            .replace('{notes}', notes || 'n/a');
          
          result = await llmJson(CREATOR_SYS, prompt, sid);
          
          // Generate screenshots for creator profile page
          let cleanTarget = target.trim();
          if (!cleanTarget.startsWith('http://') && !cleanTarget.startsWith('https://')) {
            cleanTarget = 'https://' + cleanTarget;
          }
          const enc = encodeURIComponent(cleanTarget);
          result.screenshots = {
            desktop: `https://s0.wp.com/mshots/v1/${enc}?w=1200&h=900`,
            mobile: `https://s0.wp.com/mshots/v1/${enc}?w=400&h=800`,
          };
        }

        await pool.query(
          'UPDATE scans SET status = $1, result = $2, score = $3 WHERE id = $4',
          ['complete', JSON.stringify(result), result.score || 0, sid]
        );
      } catch (err: any) {
        console.error('Scan processing failed:', err);
        await pool.query(
          'UPDATE scans SET status = $1, error = $2 WHERE id = $3',
          ['failed', err.message || 'Unknown error', sid]
        );
      }
    })();

    return res.json({
      id: sid,
      user_id: req.user!.id,
      mode,
      target,
      notes: notes || '',
      industry: industry || 'auto',
      status: 'processing',
      score: 0,
      created_at: now.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// List Scans
api.get('/scans', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
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
api.get('/scans/:id', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
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
api.delete('/scans/:id', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Content Plan
api.post('/content-plan', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  const { scan_id, days } = req.body;
  try {
    const scanResult = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [scan_id, req.user!.id]
    );
    if (scanResult.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    
    const scan = scanResult.rows[0];
    if (scan.mode !== 'creator') {
      return res.status(400).json({ detail: 'Content plans require a creator scan' });
    }

    const ctx = JSON.stringify(scan.result || {}).substring(0, 6000);
    const prompt = CONTENT_PLAN_PROMPT
      .replace('{days}', days)
      .replace('{days}', days)
      .replace('{ctx}', ctx);
      
    const plan = await llmJson(CONTENT_PLAN_SYS, prompt, `${scan_id}_plan`);
    const pid = uuidv4();
    const now = new Date();

    await pool.query(
      'INSERT INTO content_plans (id, scan_id, user_id, days, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [pid, scan_id, req.user!.id, days, plan, now]
    );

    return res.json({
      id: pid,
      scan_id,
      user_id: req.user!.id,
      days,
      plan,
      created_at: now.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// List Content Plans
api.get('/content-plans', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM content_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    const plans = result.rows.map(p => ({
      ...p,
      created_at: p.created_at.toISOString(),
    }));
    return res.json(plans);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Stats API
api.get('/stats', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scansRes = await pool.query('SELECT * FROM scans WHERE user_id = $1', [req.user!.id]);
    const scans = scansRes.rows;
    
    const biz = scans.filter(s => s.mode === 'business' && s.status === 'complete');
    const cre = scans.filter(s => s.mode === 'creator' && s.status === 'complete');
    
    const avg_biz = biz.length ? Math.round((biz.reduce((sum, s) => sum + s.score, 0) / biz.length) * 10) / 10 : 0;
    const avg_cre = cre.length ? Math.round((cre.reduce((sum, s) => sum + s.score, 0) / cre.length) * 10) / 10 : 0;
    
    const total_leads = biz.reduce((sum, s) => sum + ((s.result?.leads || []).length), 0);
    const total_action_items = scans.filter(s => s.status === 'complete').reduce((sum, s) => sum + ((s.result?.checklist || []).length), 0);

    return res.json({
      total_scans: scans.length,
      business_scans: biz.length,
      creator_scans: cre.length,
      avg_business_score: avg_biz,
      avg_creator_score: avg_cre,
      total_leads,
      total_action_items,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Public Scan Endpoint
api.get('/public/scans/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND status = $2',
      [req.params.id, 'complete']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
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
      top_fixes_titles: (r.top_fixes || []).map((f: any) => f.title),
      screenshots: r.screenshots,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Public Badge SVG
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

// Compare Competitor
api.post('/scans/:id/compare', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  const { competitor_url } = req.body;
  try {
    const scanResult = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (scanResult.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    const scan = scanResult.rows[0];
    if (scan.mode !== 'business') {
      return res.status(400).json({ detail: 'Competitor compare is only for business scans' });
    }

    const compScraped = await scrapeWebsite(competitor_url);
    const r = scan.result || {};
    const mineCtx = {
      url: scan.target,
      score: scan.score,
      subscores: r.subscores,
      summary: r.summary,
      strengths: r.strengths,
      top_fixes: (r.top_fixes || []).map((f: any) => f.title),
    };

    const prompt = COMPARE_PROMPT
      .replace('{mine}', JSON.stringify(mineCtx).substring(0, 4000))
      .replace('{comp}', JSON.stringify({
        url: compScraped.url,
        title: compScraped.title,
        meta_description: compScraped.meta_description,
        h1: compScraped.h1,
        h2: compScraped.h2,
        buttons_or_links: compScraped.buttons_or_links.slice(0, 20),
        has_https: compScraped.has_https,
        has_viewport: compScraped.has_viewport,
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

// Tasks Idempotent Generator
async function ensureTasksForUser(userId: string) {
  const client = await pool.connect();
  try {
    const existingRes = await client.query('SELECT scan_id, checklist_index FROM tasks WHERE user_id = $1', [userId]);
    const existingKeys = new Set(existingRes.rows.map(r => `${r.scan_id}_${r.checklist_index}`));
    
    const scansRes = await client.query(
      'SELECT id, target, mode, result, created_at FROM scans WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 40',
      [userId, 'complete']
    );
    
    for (const scan of scansRes.rows) {
      const checklist = scan.result?.checklist || [];
      for (let idx = 0; idx < Math.min(checklist.length, 7); idx++) {
        const key = `${scan.id}_${idx}`;
        if (existingKeys.has(key)) continue;

        const tid = uuidv4();
        await client.query(
          'INSERT INTO tasks (id, user_id, scan_id, scan_target, scan_mode, checklist_index, title, done, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            tid,
            userId,
            scan.id,
            scan.target,
            scan.mode,
            idx,
            String(checklist[idx]),
            false,
            scan.created_at,
          ]
        );
      }
    }
  } finally {
    client.release();
  }
}

// List Tasks
api.get('/tasks', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureTasksForUser(req.user!.id);
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY done ASC, created_at DESC LIMIT 50',
      [req.user!.id]
    );
    const tasks = result.rows.map(t => ({
      ...t,
      created_at: t.created_at.toISOString(),
      done_at: t.done_at ? t.done_at.toISOString() : null,
    }));
    return res.json(tasks);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Update Task
api.patch('/tasks/:id', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  const { done } = req.body;
  if (done === undefined) {
    return res.status(400).json({ detail: 'Nothing to update' });
  }

  try {
    const doneAt = done ? new Date() : null;
    const taskRes = await pool.query(
      'UPDATE tasks SET done = $1, done_at = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [done, doneAt, req.params.id, req.user!.id]
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ detail: 'Task not found' });
    }
    const task = taskRes.rows[0];

    if (done) {
      const aid = uuidv4();
      await pool.query(
        'INSERT INTO activity (id, user_id, type, title, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          aid,
          req.user!.id,
          'task_done',
          `Completed task: ${task.title.substring(0, 80)}`,
          JSON.stringify({ task_id: task.id, scan_id: task.scan_id }),
        ]
      );
    }

    return res.json({
      ...task,
      created_at: task.created_at.toISOString(),
      done_at: task.done_at ? task.done_at.toISOString() : null,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Home Dashboard Widget Aggregator
api.get('/dashboard', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureTasksForUser(req.user!.id);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const scansRes = await pool.query(
      'SELECT id, mode, score, status, target, comparison, result, created_at FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    const scans = scansRes.rows;
    const complete = scans.filter(s => s.status === 'complete');
    const biz = complete.filter(s => s.mode === 'business');
    const cre = complete.filter(s => s.mode === 'creator');

    const avg_score = complete.length ? Math.round((complete.reduce((sum, s) => sum + s.score, 0) / complete.length) * 10) / 10 : 0;
    const revenue_score = biz.length ? Math.round((biz.reduce((sum, s) => sum + Math.min(s.score, 100), 0) / biz.length) * 10) / 10 : 0;

    const thisWeek = complete.filter(s => new Date(s.created_at) >= weekAgo);
    const lastWeek = complete.filter(s => new Date(s.created_at) >= twoWeeksAgo && new Date(s.created_at) < weekAgo);
    const thisWeekAvg = thisWeek.length ? thisWeek.reduce((sum, s) => sum + s.score, 0) / thisWeek.length : 0;
    const lastWeekAvg = lastWeek.length ? lastWeek.reduce((sum, s) => sum + s.score, 0) / lastWeek.length : 0;
    const weekly_delta = Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10;

    const trend = [...complete].reverse().slice(-20).map(s => ({
      date: s.created_at.toISOString().substring(0, 10),
      score: s.score,
      mode: s.mode,
      target: (s.target || '').substring(0, 40),
    }));

    const recent = scans.slice(0, 6).map(s => ({
      id: s.id,
      target: s.target,
      mode: s.mode,
      score: s.score,
      status: s.status,
      created_at: s.created_at.toISOString(),
    }));

    const tasksCurRes = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 AND done = false ORDER BY created_at DESC LIMIT 5',
      [req.user!.id]
    );
    const tasks_cur = tasksCurRes.rows.map(t => ({
      ...t,
      created_at: t.created_at.toISOString(),
      done_at: t.done_at ? t.done_at.toISOString() : null,
    }));

    const totalsTasks = await pool.query('SELECT COUNT(*)::int as total, COUNT(CASE WHEN done = true THEN 1 END)::int as done FROM tasks WHERE user_id = $1', [req.user!.id]);
    const tasks_total = totalsTasks.rows[0].total || 0;
    const tasks_done = totalsTasks.rows[0].done || 0;

    const actRes = await pool.query('SELECT (meta->>\'scan_id\') as scan_id FROM activity WHERE user_id = $1 AND type = $2', [req.user!.id, 'scan_created']);
    const existingActivityScanIds = new Set(actRes.rows.map(r => r.scan_id));

    for (const s of complete.slice(0, 20)) {
      if (!existingActivityScanIds.has(s.id)) {
        const aid = uuidv4();
        await pool.query(
          'INSERT INTO activity (id, user_id, type, title, meta, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            aid,
            req.user!.id,
            'scan_created',
            `Scanned ${s.target.substring(0, 60)}`,
            JSON.stringify({ scan_id: s.id, score: s.score, mode: s.mode }),
            s.created_at,
          ]
        );
      }
    }

    const activityRes = await pool.query(
      'SELECT * FROM activity WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8',
      [req.user!.id]
    );
    const activity = activityRes.rows.map(a => ({
      ...a,
      created_at: a.created_at.toISOString(),
    }));

    const alerts: any[] = [];
    for (const s of complete) {
      const cmp = s.comparison;
      if (!cmp) continue;
      const my = cmp.overall?.mine || 0;
      const th = cmp.overall?.competitor || 0;
      if (th > my) {
        alerts.push({
          scan_id: s.id,
          target: s.target,
          competitor_url: cmp.competitor_url,
          diff: th - my,
          my_score: my,
          their_score: th,
          verdict: cmp.verdict || '',
        });
      }
    }
    alerts.sort((a, b) => b.diff - a.diff);

    const recs: any[] = [];
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    for (const s of complete.slice(0, 10)) {
      const fixes = s.result?.top_fixes || [];
      for (const f of fixes) {
        recs.push({
          title: f.title,
          why: f.why,
          priority: f.priority || 'medium',
          scan_id: s.id,
          scan_target: s.target,
          _w: priorityWeight[(f.priority || 'medium').toLowerCase()] || 2,
        });
      }
    }
    recs.sort((a, b) => b._w - a._w);
    const cleanRecs = recs.slice(0, 5).map(r => {
      const { _w, ...clean } = r;
      return clean;
    });

    return res.json({
      user: { name: req.user!.name, email: req.user!.email },
      totals: {
        total_scans: scans.length,
        complete_scans: complete.length,
        business_scans: biz.length,
        creator_scans: cre.length,
        leads: biz.reduce((sum, s) => sum + ((s.result?.leads || []).length), 0),
      },
      growth_score: avg_score,
      revenue_score: revenue_score,
      open_tasks: tasks_cur,
      tasks_summary: { total: tasks_total, done: tasks_done, open: tasks_total - tasks_done },
      activity,
      competitor_alerts: alerts.slice(0, 4),
      weekly: {
        this_week_scans: thisWeek.length,
        last_week_scans: lastWeek.length,
        this_week_avg_score: thisWeekAvg,
        last_week_avg_score: lastWeekAvg,
        delta: weekly_delta,
      },
      recent_scans: recent,
      growth_trend: trend,
      ai_recommendations: cleanRecs,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

const ASSISTANT_SYS = `You are the GrowthLens AI Assistant — a helpful growth consultant.
You have access to the user's recent scan summaries. Answer their questions concisely
(2-4 short paragraphs max, use plain English, no jargon). If they ask about a specific
scan you don't have context on, ask them to share the URL or scan ID. Never invent scan
data — only reference what you're given. When giving recommendations, be specific and
actionable (name exact CTA text, exact section, exact next step).`;

// Assistant Chat
api.post('/assistant/chat', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  const { message, history, session_id } = req.body;
  try {
    const scansRes = await pool.query(
      'SELECT id, mode, target, score, result FROM scans WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 5',
      [req.user!.id, 'complete']
    );
    
    const contextLines = scansRes.rows.map(s => {
      const summary = s.result?.summary || '';
      return `- ${s.mode.toUpperCase()} · ${s.target.substring(0, 80)} · score=${s.score}/100 · summary: ${summary.substring(0, 180)}`;
    });
    
    const ctxBlock = contextLines.length ? contextLines.join('\n') : '(no scans yet — advise them to run their first scan at /scan/new)';
    let historyText = '';
    const sliceHistory = (history || []).slice(-6);
    for (const msg of sliceHistory) {
      const rolePrefix = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      historyText += `\n${rolePrefix}: ${msg.text}`;
    }

    const sid = session_id || `assistant_${req.user!.id}`;
    const systemMessage = `${ASSISTANT_SYS}\n\nUser's name: ${req.user!.name}. Recent scans:\n${ctxBlock}`;
    const userText = `CONVERSATION SO FAR:${historyText}\n\nUSER: {message}\nASSISTANT:`;

    const text = await llmText(systemMessage, userText, sid);
    return res.json({ reply: text.trim(), session_id: sid });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// ============ GROWTH TEAM RUNNER ============
const GROWTH_TEAM_AGENTS = [
  {
    key: 'ux_expert',
    name: 'UX Expert',
    specialty: 'User experience, information architecture, page flow, mobile UX',
    system: 'You are a Senior UX Expert. Focus ONLY on usability, information hierarchy, mobile/responsive fit, friction points, and page flow. Ignore SEO/copywriting/branding — other experts handle those. Be blunt and specific.',
  },
  {
    key: 'seo_expert',
    name: 'SEO Expert',
    specialty: 'Rankings, on-page SEO, schema, meta, headings, keyword targeting',
    system: 'You are a Senior SEO Expert. Focus ONLY on rankings — meta tags, H1/H2 structure, internal linking, schema markup, keyword targeting, content depth, and technical SEO signals visible from the scraped data.',
  },
  {
    key: 'brand_expert',
    name: 'Brand Expert',
    specialty: 'Brand perception, positioning, visual identity, trust signals',
    system: 'You are a Senior Brand Strategist. Focus ONLY on brand perception, positioning clarity, visual identity consistency, tone-of-voice, and how the brand shows up on the page.',
  },
  {
    key: 'copywriter',
    name: 'Copywriter',
    specialty: 'Messaging, hero copy, CTAs, value proposition wording',
    system: 'You are a Senior Direct-Response Copywriter. Focus ONLY on the words — hero headline, subheadline, CTA text, value prop, feature descriptions. Suggest sharper rewrites.',
  },
  {
    key: 'sales_expert',
    name: 'Sales Expert',
    specialty: 'Conversion, objection handling, purchase intent, funnel design',
    system: 'You are a Senior B2B/B2C Sales Consultant. Focus ONLY on conversion — objection handling, purchase-intent signals, trust proofs at decision moments, and funnel design.',
  },
  {
    key: 'marketing_expert',
    name: 'Marketing Expert',
    specialty: 'Positioning, messaging-market fit, campaigns, top-of-funnel',
    system: 'You are a Senior Marketing Strategist. Focus ONLY on positioning-market fit, campaign angles, top-of-funnel messaging, and category framing.',
  },
  {
    key: 'customer_psychologist',
    name: 'Customer Psychologist',
    specialty: 'Buyer behavior, emotional triggers, cognitive biases, trust building',
    system: 'You are a Consumer Psychologist. Focus ONLY on buyer behavior, emotional triggers (fear, aspiration, social proof), cognitive biases at play, and where the site loses trust.',
  },
  {
    key: 'pricing_expert',
    name: 'Pricing Expert',
    specialty: 'Pricing anchoring, tier structure, value framing',
    system: 'You are a Pricing Strategist. Focus ONLY on pricing anchoring, tier structure, price framing, and value communication. If no pricing visible, comment on the risk of not showing prices.',
  },
  {
    key: 'accessibility_expert',
    name: 'Accessibility Expert',
    specialty: 'WCAG, keyboard nav, color contrast, screen reader semantics',
    system: 'You are an Accessibility Expert (WCAG 2.2). Focus ONLY on a11y — color contrast, keyboard navigation, semantic HTML, alt text, ARIA, focus states.',
  },
  {
    key: 'analytics_expert',
    name: 'Analytics Expert',
    specialty: 'Tracking, event instrumentation, KPI visibility',
    system: 'You are an Analytics Consultant. Focus ONLY on measurement — event tracking gaps, KPI visibility, funnel instrumentation, and what data they\'re likely missing.',
  },
  {
    key: 'performance_engineer',
    name: 'Performance Engineer',
    specialty: 'Page speed, Core Web Vitals, asset optimization',
    system: 'You are a Web Performance Engineer. Focus ONLY on speed — Core Web Vitals, image optimization, JS bloat, render-blocking resources visible from HTML.',
  },
  {
    key: 'growth_hacker',
    name: 'Growth Hacker',
    specialty: 'Viral loops, referral, product-led growth, activation',
    system: 'You are a Growth Hacker. Focus ONLY on growth loops — referral mechanics, viral hooks, activation moments, and product-led growth signals.',
  },
  {
    key: 'competitor_analyst',
    name: 'Competitor Analyst',
    specialty: 'Category positioning, differentiation, market gaps',
    system: 'You are a Competitive Intelligence Analyst. Focus ONLY on how this business is likely positioned vs competitors — differentiation gaps, category conventions being violated or missed.',
  },
];

const EXPERT_JSON_SCHEMA = `{
  "opinion": "<2-3 sentence blunt professional opinion from YOUR specialty ONLY>",
  "confidence": <0-100 how confident you are in your read>,
  "impact": "high|medium|low",
  "priority": <1-5 where 1 is do-this-first>,
  "recommendation": "<one specific, actionable next step in your specialty>",
  "estimated_revenue_gain_pct": <0-30 estimated % monthly revenue lift if this fix ships>,
  "risk_if_ignored": "<one short sentence>"
}`;

function buildScanContextForAgents(scan: any): string {
  const r = scan.result || {};
  const scraped = r.scraped || {};
  const ctx = {
    url: scan.target,
    industry_detected: r.industry_detected,
    overall_score: scan.score,
    subscores: r.subscores,
    summary: r.summary,
    strengths: r.strengths,
    top_fixes_titles: (r.top_fixes || []).map((f: any) => f.title),
    trust_gaps: r.trust_gaps,
    cta_issues: r.cta_issues,
    seo_issues: r.seo_issues,
    mobile_issues: r.mobile_issues,
    title: scraped.title,
    meta_description: scraped.meta_description,
    has_https: scraped.has_https,
    has_viewport: scraped.has_viewport,
    social_links: scraped.social_links,
    emails_found: scraped.emails_found,
    phones_found: scraped.phones_found,
  };
  return JSON.stringify(ctx).substring(0, 3000);
}

async function runSingleAgent(agent: any, ctx: string, scanId: string): Promise<any> {
  const system = `${agent.system}\n\nRespond with ONLY a JSON object matching this exact schema:\n${EXPERT_JSON_SCHEMA}\n\nNever invent scan data — only reason from what's given.`;
  const userText = `SCAN CONTEXT:\n${ctx}\n\nProvide your JSON response now.`;
  const sid = `${scanId}_${agent.key}`;

  try {
    const parsed = await llmJson(system, userText, sid);
    return {
      agent_key: agent.key,
      agent_name: agent.name,
      specialty: agent.specialty,
      ...parsed,
    };
  } catch (err: any) {
    console.error(`Agent ${agent.key} failed:`, err);
    return {
      agent_key: agent.key,
      agent_name: agent.name,
      specialty: agent.specialty,
      opinion: `(Agent unavailable: ${err.message})`,
      confidence: 0,
      impact: 'low',
      priority: 5,
      recommendation: 'Retry later',
      estimated_revenue_gain_pct: 0,
      risk_if_ignored: '',
    };
  }
}

// Run Growth Team
api.post('/scans/:id/growth-team', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scanRes = await pool.query('SELECT * FROM scans WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    if (scanRes.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    const scan = scanRes.rows[0];
    if (scan.mode !== 'business') {
      return res.status(400).json({ detail: 'AI Growth Team is only available for business scans' });
    }
    if (scan.status !== 'complete') {
      return res.status(400).json({ detail: 'Scan must be complete before running the AI Growth Team' });
    }

    const ctx = buildScanContextForAgents(scan);
    console.log(`Growth Team: running parallel expert agents for scan ${scan.id}`);
    
    // Execute all 13 specialists in parallel
    const experts = await Promise.all(
      GROWTH_TEAM_AGENTS.map(agent => runSingleAgent(agent, ctx, scan.id))
    );

    // CEO Synthesis
    const expertSummary = JSON.stringify(
      experts.map(e => ({
        agent: e.agent_name,
        opinion: e.opinion,
        impact: e.impact,
        priority: e.priority,
        recommendation: e.recommendation,
        gain_pct: e.estimated_revenue_gain_pct || 0,
      }))
    ).substring(0, 6000);

    const ceoResult = await llmJson(
      CEO_SYS,
      CEO_PROMPT.replace('{ctx}', ctx.substring(0, 2000)).replace('{experts}', expertSummary),
      `${scan.id}_ceo`
    );

    // Revenue Leak Analysis
    const r = scan.result || {};
    const industry = r.industry_detected || scan.industry || 'other';
    const revenueLeak = await llmJson(
      REVENUE_LEAK_SYS,
      REVENUE_LEAK_PROMPT.replace('{ctx}', ctx.substring(0, 2000))
        .replace('{expert_summary}', expertSummary.substring(0, 3000))
        .replace('{industry}', industry),
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

    return res.json({
      growth_team: growthTeamDoc,
      revenue_leak: revenueLeak,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Get Growth Team Results
api.get('/scans/:id/growth-team', currentUser as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scanRes = await pool.query('SELECT growth_team, revenue_leak FROM scans WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    if (scanRes.rows.length === 0) {
      return res.status(404).json({ detail: 'Scan not found' });
    }
    const scan = scanRes.rows[0];
    return res.json({
      growth_team: scan.growth_team,
      revenue_leak: scan.revenue_leak,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.use(api);

// Startup Initialization
(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`GrowthLens Express Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
