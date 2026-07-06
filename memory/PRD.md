# GrowthLens AI — PRD (v1, 2026-06-29)

## Original problem statement
Build a complete AI-powered SaaS application called **GrowthLens AI** with two modes:
- **Business Mode** — analyze a company website and surface conversion fixes, lead opportunities, trust gaps, SEO problems, weak CTAs, missing contact paths. Generates a 0-100 score, top-5 fixes, 3 outreach email drafts, 3 sales pitches, a lead list.
- **Creator Mode** — analyze social profile links and surface bio/CTA/layout improvements, content pillars, 10 post ideas, captions/hooks/hashtags, and a 7 or 30-day content calendar.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT auth (bcrypt). Public website scraping via `requests` + `BeautifulSoup` (lxml). LLM analysis via `emergentintegrations` (Gemini 3 Flash preview) using the Emergent Universal LLM Key.
- **Frontend**: React 19 + react-router-dom 7 + Tailwind + Shadcn UI + Sonner toasts. Light/dark theme. Fontshare "Cabinet Grotesk" for display + IBM Plex Sans body.
- **Routes (12 pages)**: `/`, `/login`, `/signup`, `/dashboard`, `/scan/new`, `/scan/:id`, `/leads`, `/creator`, `/planner`, `/reports`, `/settings`, `/billing`.
- **Backend endpoints (`/api`)**: `/auth/register`, `/auth/login`, `/auth/me`, `/scans` (POST/GET/GET-by-id/DELETE), `/content-plan`, `/content-plans`, `/stats`.

## User personas
- **Admin** — full org access
- **Business user** — runs business website scans
- **Creator user** — runs creator profile scans
- **Analyst** — agency/consultant view across multiple scans

## Core requirements (static)
- AI must read & summarize, detect gaps, rank issues, explain "why", produce a checklist
- Use plain English, never overpromise, use only public data
- 0-100 scores, ranked fixes, outreach drafts, content calendars
- Modern clean SaaS UI, mobile responsive, light + dark mode

## Implemented in v1 (2026-06-29)
- JWT auth (register / login / me)
- Business website scraper (titles, headings, CTAs, emails, phones, social links, HTTPS/viewport)
- Gemini 3 Flash analysis → structured JSON results (score, summary, top fixes, trust/CTA/SEO/mobile, leads, outreach emails, sales pitches, checklist)
- Creator profile analysis → score, pillars, post ideas, captions, hooks, bio/CTA/layout improvements, checklist
- Content planner (7 or 30 days) from a creator scan
- Dashboard stats (counts, averages, leads, action items)
- Reports, Leads, Creator Insights, Settings, Billing (stub) pages
- Light/dark theme toggle
- JSON export of any scan + all scans

## Implemented in Phase 1 (2026-07-06)
- **AI Auto Fix with copyable code**: every top_fix now includes code_before, code_after (CSS/HTML), code_tailwind, and code_react — shown as tabs in the Results page with per-tab Copy buttons
- **Multi-score breakdown**: Trust · Conversion · UX · Copywriting · Brand · SEO subscores rendered as bars alongside the overall score
- **"Copy for AI" export**: dropdown on Results page emits ready-to-paste prompts for ChatGPT, Claude, and Cursor
- **AI Copywriting rewrites**: 5 sections (hero_headline, hero_subheadline, primary_cta, value_prop, testimonial_headline) with before/after + why-it-converts explanation, per-section copy button
- **Competitor comparison**: new `POST /api/scans/{id}/compare` endpoint scrapes competitor, calls Gemini for side-by-side subscore matrix, verdict, "where they win / you win / steal this", stored on the scan doc

## Known limitations / next backlog
- **P0**: Stripe billing is stubbed — clicking upgrade shows a toast only
- **P0**: Universal Key budget — if at 0, scans fail with "Budget exceeded"; user must top up at Profile → Universal Key → Add Balance
- **P1**: Re-scan button on a saved scan
- **P1**: Progress-over-time chart on dashboard (recharts is installed)
- **P1**: PDF export (currently JSON only)
- **P2**: Multi-seat org/teams
- **P2**: Webhooks / Zapier
- **P2**: Real-time SSE streaming of AI output (currently synchronous JSON)

## Next tasks
1. Validate end-to-end via testing agent (auth flow + scan creation + content plan)
2. Add re-scan + recharts progress chart
3. Wire Stripe checkout for Pro plan
