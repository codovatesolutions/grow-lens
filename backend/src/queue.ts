import { pool } from './db';
import { validateUrlForSSRF, auditSecurityHeaders } from './security';
import { llmJson } from './llm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const WORKER_ID = `worker_${process.pid}_${uuidv4().substring(0, 8)}`;

const BUSINESS_SYS = `You are GrowthLens AI, a senior conversion-rate optimization analyst.
You analyze a public business website and output strictly valid JSON. Use plain English,
specific to the site content provided. Never invent facts not present in the data.`;

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
    {"label":"<short label, 2-4 words>","color":"red|yellow|green","x_pct":<0-100 horizontal position>,"y_pct":<0-100 vertical position>,"note":"<one-sentence explanation>"}
  ],
  "checklist": ["<5-7 next-step action items in plain language>"]
}

Provide exactly 5 top_fixes, 3 outreach_emails, 3 sales_pitches, 5 copywriting_rewrites, 4-6 industry_insights, and 4-6 screenshot_annotations.
INDUSTRY HINT: {industry}
WEBSITE DATA:
{data}`;

const CREATOR_SYS = `You are GrowthLens AI, a creator-economy growth strategist.
You analyze public social profile links and output strictly valid JSON. Use plain
English and concrete examples. Reason from the profile URLs and any provided notes.`;

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

PROFILE LINK(S): {data}
NOTES: {notes}`;

// Scraper function with SSRF checks & Security Header Inspection
export async function scrapeWebsite(targetUrl: string) {
  const ssrfCheck = await validateUrlForSSRF(targetUrl);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    throw new Error(`Security Exception (SSRF Blocked): ${ssrfCheck.reason}`);
  }

  const url = ssrfCheck.url;

  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrowthLensBot/1.0; +https://growthlens.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 3,
    });

    const headersAudit = auditSecurityHeaders(response.headers);
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
      security_headers: headersAudit,
    };
  } catch (err: any) {
    throw new Error(`Could not fetch site (${url}): ${err.message}`);
  }
}

// Queue Processing Loop
let isProcessing = false;

async function processNextJob() {
  if (isProcessing) return;
  isProcessing = true;

  const client = await pool.connect();
  try {
    // Claim a job atomically
    const claimRes = await client.query(
      `UPDATE scan_jobs 
       SET status = 'processing', locked_at = NOW(), locked_by = $1, attempts = attempts + 1, started_at = NOW()
       WHERE id = (
         SELECT id FROM scan_jobs 
         WHERE status = 'pending' 
            OR (status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes')
         ORDER BY created_at ASC 
         LIMIT 1 
         FOR UPDATE SKIP LOCKED
       ) 
       RETURNING *`,
      [WORKER_ID]
    );

    if (claimRes.rows.length === 0) {
      isProcessing = false;
      return;
    }

    const job = claimRes.rows[0];
    console.log(`[Queue Worker ${WORKER_ID}] Claimed scan job ${job.id} for target ${job.target} (Attempt ${job.attempts}/${job.max_attempts})`);

    // Update scan record status to processing
    await client.query('UPDATE scans SET status = $1 WHERE id = $2', ['processing', job.scan_id]);

    try {
      let result: any = {};
      if (job.mode === 'business') {
        const scraped = await scrapeWebsite(job.target);
        const prompt = BUSINESS_PROMPT
          .replace('{data}', JSON.stringify(scraped).substring(0, 8000))
          .replace('{industry}', job.industry || 'auto');

        result = await llmJson(BUSINESS_SYS, prompt, job.scan_id);
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
          security_headers: scraped.security_headers,
        };
      } else {
        const prompt = CREATOR_PROMPT
          .replace('{data}', job.target)
          .replace('{notes}', job.notes || 'n/a');

        result = await llmJson(CREATOR_SYS, prompt, job.scan_id);
      }

      // Mark Complete in DB
      await client.query(
        'UPDATE scans SET status = $1, result = $2, score = $3, updated_at = NOW() WHERE id = $4',
        ['complete', JSON.stringify(result), result.score || 0, job.scan_id]
      );

      await client.query(
        'UPDATE scan_jobs SET status = $1, completed_at = NOW() WHERE id = $2',
        ['complete', job.id]
      );

      console.log(`[Queue Worker ${WORKER_ID}] Scan job ${job.id} completed successfully with score ${result.score || 0}`);
    } catch (err: any) {
      console.error(`[Queue Worker ${WORKER_ID}] Job ${job.id} failed on attempt ${job.attempts}:`, err.message);

      if (job.attempts < job.max_attempts) {
        // Reset to pending for retry
        await client.query(
          'UPDATE scan_jobs SET status = $1, last_error = $2, locked_at = NULL, locked_by = NULL WHERE id = $3',
          ['pending', err.message || 'Error occurred during scan execution', job.id]
        );
      } else {
        // Max attempts reached - mark as failed
        await client.query(
          'UPDATE scan_jobs SET status = $1, last_error = $2, completed_at = NOW() WHERE id = $3',
          ['failed', err.message || 'Max retries exceeded', job.id]
        );

        await client.query(
          'UPDATE scans SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
          ['failed', err.message || 'Scan failed after maximum retries', job.scan_id]
        );
      }
    }
  } catch (err: any) {
    console.error(`[Queue Worker ${WORKER_ID}] Unexpected queue processor error:`, err);
  } finally {
    client.release();
    isProcessing = false;
  }
}

// Start queue polling background worker
export function startQueueWorker(intervalMs: number = 2500) {
  console.log(`Starting scan queue worker [ID: ${WORKER_ID}] with interval ${intervalMs}ms...`);
  setInterval(processNextJob, intervalMs);
}
