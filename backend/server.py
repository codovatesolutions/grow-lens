"""GrowthLens AI - Backend (FastAPI + Mongo + Gemini)."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import re
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests
import urllib.parse
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24 * 7

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="GrowthLens AI")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("growthlens")


# ============ MODELS ============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["business", "creator", "admin", "analyst"] = "business"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str


class ScanCreate(BaseModel):
    mode: Literal["business", "creator"]
    target: str  # URL or profile link
    notes: Optional[str] = None
    industry: Optional[str] = None  # auto | restaurant | saas | ecommerce | portfolio | agency | hospital | school | realestate | other


class ContentPlanReq(BaseModel):
    scan_id: str
    days: Literal[7, 30] = 7


class CompareReq(BaseModel):
    competitor_url: str


# ============ AUTH HELPERS ============
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ============ AUTH ROUTES ============
@api.post("/auth/register")
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": body.email.lower(),
        "name": body.name,
        "role": body.role,
        "password_hash": hash_pw(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = make_token(uid)
    return {"token": token, "user": {k: v for k, v in doc.items() if k not in ("password_hash", "_id")}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_pw(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user


# ============ SCRAPER ============
def scrape_website(url: str) -> dict:
    """Fetch a website and extract key SEO/CTA/trust signals."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        r = requests.get(url, timeout=12, headers={
            "User-Agent": "Mozilla/5.0 (compatible; GrowthLensBot/1.0)"
        }, allow_redirects=True)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(400, f"Could not fetch site: {e}")

    soup = BeautifulSoup(r.text, "lxml")
    title = (soup.title.string or "").strip() if soup.title else ""
    meta_desc = ""
    md = soup.find("meta", attrs={"name": "description"})
    if md and md.get("content"):
        meta_desc = md["content"].strip()
    og_title = ""
    ogt = soup.find("meta", attrs={"property": "og:title"})
    if ogt and ogt.get("content"):
        og_title = ogt["content"]

    h1s = [h.get_text(" ", strip=True) for h in soup.find_all("h1")][:5]
    h2s = [h.get_text(" ", strip=True) for h in soup.find_all("h2")][:10]
    buttons = [b.get_text(" ", strip=True) for b in soup.find_all(["button", "a"])
               if b.get_text(strip=True) and len(b.get_text(strip=True)) < 50][:30]

    # Body text sample
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    body_text = re.sub(r"\s+", " ", soup.get_text(" ")).strip()[:4000]

    # Contact info
    emails = list(set(re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", r.text)))[:10]
    phones = list(set(re.findall(r"\+?\d[\d\s().-]{7,}\d", r.text)))[:10]

    # Links
    domain = urlparse(url).netloc
    internal_links = []
    social_links = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full = urljoin(url, href)
        host = urlparse(full).netloc
        if "facebook.com" in host: social_links["facebook"] = full
        elif "instagram.com" in host: social_links["instagram"] = full
        elif "linkedin.com" in host: social_links["linkedin"] = full
        elif "twitter.com" in host or "x.com" in host: social_links["twitter"] = full
        elif "youtube.com" in host: social_links["youtube"] = full
        elif domain in host:
            internal_links.append(full)
    internal_links = list(set(internal_links))[:25]

    has_https = url.startswith("https://")
    viewport = bool(soup.find("meta", attrs={"name": "viewport"}))

    return {
        "url": url,
        "title": title,
        "meta_description": meta_desc,
        "og_title": og_title,
        "h1": h1s,
        "h2": h2s,
        "buttons_or_links": buttons,
        "emails_found": emails,
        "phones_found": phones,
        "internal_links": internal_links,
        "social_links": social_links,
        "has_https": has_https,
        "has_viewport": viewport,
        "body_text_sample": body_text,
    }


# ============ AI HELPERS ============
async def llm_json(system: str, user_text: str, session_id: str) -> dict:
    """Call Gemini and return parsed JSON."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", "gemini-3-flash-preview")
    msg = UserMessage(text=user_text)
    text = await chat.send_message(msg)
    raw = text if isinstance(text, str) else str(text)
    # Strip code fences
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    # Extract first {...}
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        raise HTTPException(500, f"LLM returned non-JSON: {raw[:300]}")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"LLM JSON parse error: {e}")


BUSINESS_SYS = """You are GrowthLens AI, a senior conversion-rate optimization analyst.
You analyze a public business website and output strictly valid JSON. Use plain English,
specific to the site content provided. Never invent facts not present in the data."""

BUSINESS_PROMPT = """Analyze this website data and respond with ONLY a JSON object in this exact schema:

{{
  "score": <0-100 integer overall>,
  "subscores": {{
    "trust": <0-100>,
    "conversion": <0-100>,
    "ux": <0-100>,
    "copywriting": <0-100>,
    "brand": <0-100>,
    "seo": <0-100>
  }},
  "summary": "<2-3 sentence plain-English summary of what this business does and how the site performs>",
  "strengths": ["<3 short bullets>"],
  "top_fixes": [
    {{
      "title":"<short fix>",
      "why":"<why this hurts conversions, plain English>",
      "action":"<exact next step>",
      "priority":"high|medium|low",
      "code_language":"css|html|jsx",
      "code_before":"<current problematic code snippet, short>",
      "code_after":"<improved code snippet, plain CSS or HTML>",
      "code_tailwind":"<same fix written as Tailwind classes on a small React JSX snippet>",
      "code_react":"<same fix written as a tiny React component using shadcn-style classes>"
    }}
  ],
  "trust_gaps": ["<bullets>"],
  "cta_issues": ["<bullets>"],
  "seo_issues": ["<bullets>"],
  "mobile_issues": ["<bullets>"],
  "copywriting_rewrites": [
    {{"section":"hero_headline|hero_subheadline|primary_cta|value_prop|testimonial_headline","before":"<current copy or 'none found'>","after":"<sharper rewrite>","why":"<why the new one converts better>"}}
  ],
  "leads": [
    {{"name":"<person or company>","role":"<title>","email":"<if found>","phone":"<if found>","source":"<where on site>","notes":"<context>"}}
  ],
  "outreach_emails": [
    {{"subject":"<subject>","body":"<3-paragraph email body referencing the site's specific weakness>","angle":"<the hook used>"}}
  ],
  "sales_pitches": [
    {{"angle":"<short>","pitch":"<2-3 sentences>"}}
  ],
  "industry_detected": "<one word: restaurant|saas|ecommerce|portfolio|agency|hospital|school|realestate|blog|other>",
  "industry_insights": ["<4-6 industry-specific recommendations tuned to industry_detected or the provided industry hint>"],
  "screenshot_annotations": [
    {{"label":"<short label, 2-4 words>","color":"red|yellow|green","x_pct":<0-100 approximate horizontal position on desktop screenshot>,"y_pct":<0-100 approximate vertical position>,"note":"<one-sentence explanation>"}}
  ],
  "checklist": ["<5-7 next-step action items in plain language>"]
}}

Provide exactly 5 top_fixes, 3 outreach_emails, 3 sales_pitches, 5 copywriting_rewrites (one per section listed), 4-6 industry_insights, and 4-6 screenshot_annotations (mix red for critical / yellow for warning / green for strengths, roughly positioned across the fold).
Each top_fix MUST include realistic, copy-pasteable code snippets. Keep snippets under 15 lines each.
If no leads found, return an empty list for leads.

INDUSTRY HINT (may be 'auto' or empty): {industry}

WEBSITE DATA:
{data}
"""


CREATOR_SYS = """You are GrowthLens AI, a creator-economy growth strategist.
You analyze public social profile links and output strictly valid JSON. Use plain
English and concrete examples. Do not claim private platform access; reason from the URLs
and any provided notes."""

CREATOR_PROMPT = """Analyze these creator profile link(s) and respond with ONLY a JSON object:

{{
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
    {{"title":"<idea>","format":"<reel|carousel|short|tweet|post>","hook":"<opening line>","why":"<why it works>"}}
  ],
  "captions": [
    {{"caption":"<full caption>","hashtags":["<5-8 tags>"]}}
  ],
  "hooks": ["<5 short hooks>"],
  "checklist": ["<5-7 next steps>"]
}}

Provide exactly 10 post_ideas, 5 captions.

PROFILE LINK(S): {data}
NOTES: {notes}
"""


CONTENT_PLAN_SYS = """You are a content calendar planner for creators. Output strictly valid JSON only."""

COMPARE_SYS = """You are a competitive-analysis growth strategist. Compare two websites and output strictly valid JSON only."""

COMPARE_PROMPT = """Compare these two websites and respond with ONLY a JSON object:

{{
  "winner": "mine|competitor|tie",
  "verdict": "<2-3 sentence plain-English verdict on who wins and why>",
  "subscores": {{
    "trust":       {{"mine": <0-100>, "competitor": <0-100>}},
    "conversion":  {{"mine": <0-100>, "competitor": <0-100>}},
    "ux":          {{"mine": <0-100>, "competitor": <0-100>}},
    "copywriting": {{"mine": <0-100>, "competitor": <0-100>}},
    "brand":       {{"mine": <0-100>, "competitor": <0-100>}},
    "seo":         {{"mine": <0-100>, "competitor": <0-100>}}
  }},
  "overall": {{"mine": <0-100>, "competitor": <0-100>}},
  "where_they_win": ["<3-5 bullets: what competitor does better>"],
  "where_you_win":  ["<3-5 bullets: what you do better>"],
  "steal_this":     ["<3-5 concrete tactics to copy from the competitor>"]
}}

MINE (already-scored site):
{mine}

COMPETITOR (raw scraped data):
{comp}
"""

CONTENT_PLAN_PROMPT = """Create a {days}-day content plan based on this creator analysis. JSON schema:

{{
  "days": [
    {{"day": 1, "date_label": "Day 1", "platform":"<instagram|x|linkedin|youtube|tiktok>","format":"<reel|post|short|tweet>","title":"<title>","hook":"<hook>","caption":"<short caption>","cta":"<call to action>","best_time":"<e.g., 7-9pm>"}}
  ]
}}

Generate exactly {days} entries (one per day). Vary platforms and formats.

CREATOR CONTEXT:
{ctx}
"""


# ============ SCAN ROUTES ============
@api.post("/scans")
async def create_scan(body: ScanCreate, user=Depends(current_user)):
    sid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    base = {
        "id": sid,
        "user_id": user["id"],
        "mode": body.mode,
        "target": body.target,
        "notes": body.notes or "",
        "industry": body.industry or "auto",
        "status": "processing",
        "created_at": now,
    }
    await db.scans.insert_one(base)

    try:
        if body.mode == "business":
            scraped = scrape_website(body.target)
            prompt = BUSINESS_PROMPT.format(
                data=json.dumps(scraped, ensure_ascii=False)[:8000],
                industry=body.industry or "auto",
            )
            result = await llm_json(BUSINESS_SYS, prompt, sid)
            # Free WordPress mshots for screenshots — no browser install needed
            enc = urllib.parse.quote(scraped["url"], safe="")
            result["screenshots"] = {
                "desktop": f"https://s0.wp.com/mshots/v1/{enc}?w=1200&h=900",
                "mobile":  f"https://s0.wp.com/mshots/v1/{enc}?w=400&h=800",
            }
            result["scraped"] = {
                "title": scraped["title"],
                "meta_description": scraped["meta_description"],
                "social_links": scraped["social_links"],
                "emails_found": scraped["emails_found"],
                "phones_found": scraped["phones_found"],
                "has_https": scraped["has_https"],
                "has_viewport": scraped["has_viewport"],
            }
        else:
            prompt = CREATOR_PROMPT.format(data=body.target, notes=body.notes or "n/a")
            result = await llm_json(CREATOR_SYS, prompt, sid)

        await db.scans.update_one(
            {"id": sid},
            {"$set": {"status": "complete", "result": result, "score": result.get("score", 0)}},
        )
    except HTTPException as he:
        await db.scans.update_one({"id": sid}, {"$set": {"status": "failed", "error": he.detail}})
        raise
    except Exception as e:
        log.exception("scan failed")
        await db.scans.update_one({"id": sid}, {"$set": {"status": "failed", "error": str(e)}})
        raise HTTPException(500, f"Scan failed: {e}")

    doc = await db.scans.find_one({"id": sid}, {"_id": 0})
    return doc


@api.get("/scans")
async def list_scans(user=Depends(current_user)):
    cursor = db.scans.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(100)
    return await cursor.to_list(100)


@api.get("/scans/{scan_id}")
async def get_scan(scan_id: str, user=Depends(current_user)):
    doc = await db.scans.find_one({"id": scan_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Scan not found")
    return doc


@api.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, user=Depends(current_user)):
    res = await db.scans.delete_one({"id": scan_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Scan not found")
    return {"ok": True}


@api.post("/content-plan")
async def content_plan(body: ContentPlanReq, user=Depends(current_user)):
    scan = await db.scans.find_one({"id": body.scan_id, "user_id": user["id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan["mode"] != "creator":
        raise HTTPException(400, "Content plans require a creator scan")
    ctx = json.dumps(scan.get("result", {}), ensure_ascii=False)[:6000]
    prompt = CONTENT_PLAN_PROMPT.format(days=body.days, ctx=ctx)
    plan = await llm_json(CONTENT_PLAN_SYS, prompt, body.scan_id + "_plan")
    pid = str(uuid.uuid4())
    doc = {
        "id": pid,
        "scan_id": body.scan_id,
        "user_id": user["id"],
        "days": body.days,
        "plan": plan,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.content_plans.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/content-plans")
async def list_plans(user=Depends(current_user)):
    cur = db.content_plans.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50)
    return await cur.to_list(50)


# ============ STATS ============
from fastapi.responses import Response


@api.get("/public/scans/{scan_id}")
async def public_scan(scan_id: str):
    doc = await db.scans.find_one({"id": scan_id, "status": "complete"}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Scan not found")
    r = doc.get("result") or {}
    # Strip private-ish fields (leads, outreach emails) for the public view
    return {
        "id": doc["id"],
        "target": doc["target"],
        "mode": doc["mode"],
        "score": doc.get("score", 0),
        "created_at": doc["created_at"],
        "summary": r.get("summary"),
        "subscores": r.get("subscores"),
        "strengths": r.get("strengths", []),
        "top_fixes_titles": [f.get("title") for f in (r.get("top_fixes") or [])],
        "screenshots": r.get("screenshots"),
    }


@api.get("/public/scans/{scan_id}/badge.svg")
async def public_badge(scan_id: str):
    doc = await db.scans.find_one({"id": scan_id, "status": "complete"}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Scan not found")
    score = int(doc.get("score", 0) or 0)
    color = "#047857" if score >= 75 else "#eab308" if score >= 50 else "#dc2626"
    label = "GrowthLens Score"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="220" height="56" viewBox="0 0 220 56">
  <rect width="220" height="56" rx="8" fill="#0a0a0a"/>
  <rect x="0" y="0" width="150" height="56" rx="8" fill="#111"/>
  <text x="18" y="22" font-family="ui-sans-serif,system-ui" font-size="10" fill="#a1a1aa" letter-spacing="2">GROWTHLENS</text>
  <text x="18" y="42" font-family="ui-sans-serif,system-ui" font-size="14" font-weight="600" fill="#f8fafc">{label}</text>
  <rect x="150" y="0" width="70" height="56" fill="{color}" rx="8"/>
  <rect x="150" y="0" width="10" height="56" fill="{color}"/>
  <text x="185" y="36" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="24" font-weight="800" fill="#ffffff">{score}</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=300"})


@api.post("/scans/{scan_id}/compare")
async def compare_competitor(scan_id: str, body: CompareReq, user=Depends(current_user)):
    scan = await db.scans.find_one({"id": scan_id, "user_id": user["id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan["mode"] != "business":
        raise HTTPException(400, "Competitor compare is only for business scans")
    comp_scraped = scrape_website(body.competitor_url)
    mine_ctx = {
        "url": scan["target"],
        "score": scan.get("score"),
        "subscores": (scan.get("result") or {}).get("subscores"),
        "summary": (scan.get("result") or {}).get("summary"),
        "strengths": (scan.get("result") or {}).get("strengths"),
        "top_fixes": [f.get("title") for f in ((scan.get("result") or {}).get("top_fixes") or [])],
    }
    prompt = COMPARE_PROMPT.format(
        mine=json.dumps(mine_ctx, ensure_ascii=False)[:4000],
        comp=json.dumps({
            "url": comp_scraped["url"],
            "title": comp_scraped["title"],
            "meta_description": comp_scraped["meta_description"],
            "h1": comp_scraped["h1"],
            "h2": comp_scraped["h2"],
            "buttons_or_links": comp_scraped["buttons_or_links"][:20],
            "has_https": comp_scraped["has_https"],
            "has_viewport": comp_scraped["has_viewport"],
            "body_text_sample": comp_scraped["body_text_sample"][:2500],
        }, ensure_ascii=False)[:4500],
    )
    result = await llm_json(COMPARE_SYS, prompt, scan_id + "_cmp")
    result["competitor_url"] = comp_scraped["url"]
    await db.scans.update_one({"id": scan_id}, {"$set": {"comparison": result}})
    return result


@api.get("/stats")
async def stats(user=Depends(current_user)):
    scans = await db.scans.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    biz = [s for s in scans if s.get("mode") == "business" and s.get("status") == "complete"]
    cre = [s for s in scans if s.get("mode") == "creator" and s.get("status") == "complete"]
    avg_biz = round(sum(s.get("score", 0) for s in biz) / len(biz), 1) if biz else 0
    avg_cre = round(sum(s.get("score", 0) for s in cre) / len(cre), 1) if cre else 0
    total_leads = sum(len((s.get("result") or {}).get("leads", []) or []) for s in biz)
    total_action_items = sum(len((s.get("result") or {}).get("checklist", []) or []) for s in scans if s.get("status") == "complete")
    return {
        "total_scans": len(scans),
        "business_scans": len(biz),
        "creator_scans": len(cre),
        "avg_business_score": avg_biz,
        "avg_creator_score": avg_cre,
        "total_leads": total_leads,
        "total_action_items": total_action_items,
    }


@api.get("/")
async def root():
    return {"service": "GrowthLens AI", "ok": True}


# ============================================================================
# PHASE 1 — HOME DASHBOARD (11 widgets) + TASKS + AI ASSISTANT
# ============================================================================


class TaskPatch(BaseModel):
    done: Optional[bool] = None


class AssistantMsg(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class AssistantChatIn(BaseModel):
    message: str
    history: List[AssistantMsg] = []
    session_id: Optional[str] = None


async def _ensure_tasks_for_user(user_id: str):
    """Auto-generate tasks from completed scan checklists (idempotent)."""
    existing = await db.tasks.find({"user_id": user_id}, {"scan_id": 1, "checklist_index": 1, "_id": 0}).to_list(2000)
    existing_keys = {(t.get("scan_id"), t.get("checklist_index")) for t in existing}
    scans_cursor = db.scans.find({"user_id": user_id, "status": "complete"}, {"_id": 0}).sort("created_at", -1).limit(40)
    scans = await scans_cursor.to_list(40)
    to_insert = []
    for s in scans:
        checklist = ((s.get("result") or {}).get("checklist")) or []
        for idx, item in enumerate(checklist[:7]):
            key = (s["id"], idx)
            if key in existing_keys:
                continue
            to_insert.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "scan_id": s["id"],
                "scan_target": s.get("target"),
                "scan_mode": s.get("mode"),
                "checklist_index": idx,
                "title": item if isinstance(item, str) else str(item),
                "done": False,
                "created_at": s.get("created_at") or datetime.now(timezone.utc).isoformat(),
            })
    if to_insert:
        await db.tasks.insert_many(to_insert)


def _score_color(score: int) -> str:
    if score >= 75:
        return "#16a34a"
    if score >= 50:
        return "#eab308"
    return "#dc2626"


@api.get("/tasks")
async def list_tasks(user=Depends(current_user)):
    await _ensure_tasks_for_user(user["id"])
    tasks = await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).sort([("done", 1), ("created_at", -1)]).limit(50).to_list(50)
    return tasks


@api.patch("/tasks/{task_id}")
async def patch_task(task_id: str, body: TaskPatch, user=Depends(current_user)):
    update = {}
    if body.done is not None:
        update["done"] = body.done
        update["done_at"] = datetime.now(timezone.utc).isoformat() if body.done else None
    if not update:
        raise HTTPException(400, "Nothing to update")
    res = await db.tasks.update_one({"id": task_id, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Task not found")
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    # log activity
    if body.done:
        await db.activity.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": "task_done",
            "title": f"Completed task: {doc['title'][:80]}",
            "meta": {"task_id": task_id, "scan_id": doc.get("scan_id")},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return doc


@api.get("/dashboard")
async def dashboard(user=Depends(current_user)):
    """Aggregated data for the 11 home-dashboard widgets."""
    await _ensure_tasks_for_user(user["id"])
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    two_weeks_ago = (now - timedelta(days=14)).isoformat()

    scans = await db.scans.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    complete = [s for s in scans if s.get("status") == "complete"]
    biz = [s for s in complete if s.get("mode") == "business"]
    cre = [s for s in complete if s.get("mode") == "creator"]

    # Growth score = avg score across all complete scans
    avg_score = round(sum(s.get("score", 0) for s in complete) / len(complete), 1) if complete else 0
    # Revenue score (0-100) — economic-impact index; final module 6 replaces w/ real $
    revenue_score = round(sum(min(s.get("score", 0), 100) * 1.0 for s in biz) / max(len(biz), 1), 1) if biz else 0

    # Weekly deltas
    this_week = [s for s in complete if s.get("created_at", "") >= week_ago]
    last_week = [s for s in complete if two_weeks_ago <= s.get("created_at", "") < week_ago]
    this_week_avg = round(sum(s.get("score", 0) for s in this_week) / len(this_week), 1) if this_week else 0
    last_week_avg = round(sum(s.get("score", 0) for s in last_week) / len(last_week), 1) if last_week else 0
    weekly_delta = round(this_week_avg - last_week_avg, 1)

    # Growth trend (last 20 scans, chronological)
    trend = []
    for s in sorted(complete, key=lambda x: x.get("created_at", ""))[-20:]:
        trend.append({
            "date": (s.get("created_at") or "")[:10],
            "score": s.get("score", 0),
            "mode": s.get("mode"),
            "target": (s.get("target") or "")[:40],
        })

    # Recent scans (last 6)
    recent = [{
        "id": s["id"],
        "target": s.get("target"),
        "mode": s.get("mode"),
        "score": s.get("score", 0),
        "status": s.get("status"),
        "created_at": s.get("created_at"),
    } for s in scans[:6]]

    # Open tasks (top 5)
    tasks_cur = await db.tasks.find({"user_id": user["id"], "done": False}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    tasks_total = await db.tasks.count_documents({"user_id": user["id"]})
    tasks_done = await db.tasks.count_documents({"user_id": user["id"], "done": True})

    # Team activity (last 8 events) — for solo user this is their own activity
    # Ensure recent scan_created events exist
    existing_activity_scan_ids = {a.get("meta", {}).get("scan_id") for a in await db.activity.find({"user_id": user["id"], "type": "scan_created"}).to_list(500)}
    to_insert = []
    for s in complete[:20]:
        if s["id"] not in existing_activity_scan_ids:
            to_insert.append({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "type": "scan_created",
                "title": f"Scanned {s.get('target', '')[:60]}",
                "meta": {"scan_id": s["id"], "score": s.get("score", 0), "mode": s.get("mode")},
                "created_at": s.get("created_at"),
            })
    if to_insert:
        await db.activity.insert_many(to_insert)
    activity = await db.activity.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(8).to_list(8)

    # Competitor alerts (from scans with comparison)
    alerts = []
    for s in complete:
        cmp = s.get("comparison")
        if not cmp:
            continue
        my = ((cmp.get("overall") or {}).get("mine")) or 0
        th = ((cmp.get("overall") or {}).get("competitor")) or 0
        if th > my:
            alerts.append({
                "scan_id": s["id"],
                "target": s.get("target"),
                "competitor_url": cmp.get("competitor_url"),
                "diff": th - my,
                "my_score": my,
                "their_score": th,
                "verdict": cmp.get("verdict", ""),
            })
    alerts.sort(key=lambda x: -x["diff"])
    alerts = alerts[:4]

    # AI recommendations — top 5 fixes by priority across latest scans
    priority_weight = {"high": 3, "medium": 2, "low": 1}
    recs = []
    for s in complete[:10]:
        fixes = ((s.get("result") or {}).get("top_fixes")) or []
        for f in fixes:
            recs.append({
                "title": f.get("title"),
                "why": f.get("why"),
                "priority": f.get("priority", "medium"),
                "scan_id": s["id"],
                "scan_target": s.get("target"),
                "_w": priority_weight.get((f.get("priority") or "medium").lower(), 2),
            })
    recs.sort(key=lambda x: (-x["_w"]))
    recs = [{k: v for k, v in r.items() if not k.startswith("_")} for r in recs[:5]]

    # Weekly improvements
    weekly = {
        "this_week_scans": len(this_week),
        "last_week_scans": len(last_week),
        "this_week_avg_score": this_week_avg,
        "last_week_avg_score": last_week_avg,
        "delta": weekly_delta,
    }

    return {
        "user": {"name": user.get("name"), "email": user.get("email")},
        "totals": {
            "total_scans": len(scans),
            "complete_scans": len(complete),
            "business_scans": len(biz),
            "creator_scans": len(cre),
            "leads": sum(len((s.get("result") or {}).get("leads", []) or []) for s in biz),
        },
        "growth_score": avg_score,
        "revenue_score": revenue_score,
        "open_tasks": tasks_cur,
        "tasks_summary": {"total": tasks_total, "done": tasks_done, "open": tasks_total - tasks_done},
        "activity": activity,
        "competitor_alerts": alerts,
        "weekly": weekly,
        "recent_scans": recent,
        "growth_trend": trend,
        "ai_recommendations": recs,
    }


ASSISTANT_SYS = """You are the GrowthLens AI Assistant — a helpful growth consultant.
You have access to the user's recent scan summaries. Answer their questions concisely
(2-4 short paragraphs max, use plain English, no jargon). If they ask about a specific
scan you don't have context on, ask them to share the URL or scan ID. Never invent scan
data — only reference what you're given. When giving recommendations, be specific and
actionable (name exact CTA text, exact section, exact next step)."""


@api.post("/assistant/chat")
async def assistant_chat(body: AssistantChatIn, user=Depends(current_user)):
    # Pull last 5 complete scans as context
    scans = await db.scans.find(
        {"user_id": user["id"], "status": "complete"}, {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    context_lines = []
    for s in scans:
        r = s.get("result") or {}
        context_lines.append(
            f"- {s.get('mode', '?').upper()} · {s.get('target', '')[:80]} · score={s.get('score', 0)}/100 · summary: {(r.get('summary') or '')[:180]}"
        )
    ctx_block = "\n".join(context_lines) if context_lines else "(no scans yet — advise them to run their first scan at /scan/new)"
    history_text = ""
    for m in (body.history or [])[-6:]:
        role_prefix = "USER" if m.role == "user" else "ASSISTANT"
        history_text += f"\n{role_prefix}: {m.text}"

    session_id = body.session_id or f"assistant_{user['id']}"
    system_message = (
        ASSISTANT_SYS
        + f"\n\nUser's name: {user.get('name')}. Recent scans:\n{ctx_block}"
    )
    user_text = f"CONVERSATION SO FAR:{history_text}\n\nUSER: {body.message}\nASSISTANT:"

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message,
        ).with_model("gemini", "gemini-3-flash-preview")
        resp = await chat.send_message(UserMessage(text=user_text))
        text = resp if isinstance(resp, str) else str(resp)
    except Exception as e:
        log.exception("assistant chat failed")
        raise HTTPException(500, f"Assistant error: {e}")

    return {"reply": text.strip(), "session_id": session_id}


# ============================================================================
# PHASE 2 — AI GROWTH TEAM (13 experts + CEO) + REVENUE LEAK ENGINE
# ============================================================================

GROWTH_TEAM_AGENTS = [
    {
        "key": "ux_expert",
        "name": "UX Expert",
        "specialty": "User experience, information architecture, page flow, mobile UX",
        "system": "You are a Senior UX Expert. Focus ONLY on usability, information hierarchy, mobile/responsive fit, friction points, and page flow. Ignore SEO/copywriting/branding — other experts handle those. Be blunt and specific.",
    },
    {
        "key": "seo_expert",
        "name": "SEO Expert",
        "specialty": "Rankings, on-page SEO, schema, meta, headings, keyword targeting",
        "system": "You are a Senior SEO Expert. Focus ONLY on rankings — meta tags, H1/H2 structure, internal linking, schema markup, keyword targeting, content depth, and technical SEO signals visible from the scraped data.",
    },
    {
        "key": "brand_expert",
        "name": "Brand Expert",
        "specialty": "Brand perception, positioning, visual identity, trust signals",
        "system": "You are a Senior Brand Strategist. Focus ONLY on brand perception, positioning clarity, visual identity consistency, tone-of-voice, and how the brand shows up on the page.",
    },
    {
        "key": "copywriter",
        "name": "Copywriter",
        "specialty": "Messaging, hero copy, CTAs, value proposition wording",
        "system": "You are a Senior Direct-Response Copywriter. Focus ONLY on the words — hero headline, subheadline, CTA text, value prop, feature descriptions. Suggest sharper rewrites.",
    },
    {
        "key": "sales_expert",
        "name": "Sales Expert",
        "specialty": "Conversion, objection handling, purchase intent, funnel design",
        "system": "You are a Senior B2B/B2C Sales Consultant. Focus ONLY on conversion — objection handling, purchase-intent signals, trust proofs at decision moments, and funnel design.",
    },
    {
        "key": "marketing_expert",
        "name": "Marketing Expert",
        "specialty": "Positioning, messaging-market fit, campaigns, top-of-funnel",
        "system": "You are a Senior Marketing Strategist. Focus ONLY on positioning-market fit, campaign angles, top-of-funnel messaging, and category framing.",
    },
    {
        "key": "customer_psychologist",
        "name": "Customer Psychologist",
        "specialty": "Buyer behavior, emotional triggers, cognitive biases, trust building",
        "system": "You are a Consumer Psychologist. Focus ONLY on buyer behavior, emotional triggers (fear, aspiration, social proof), cognitive biases at play, and where the site loses trust.",
    },
    {
        "key": "pricing_expert",
        "name": "Pricing Expert",
        "specialty": "Pricing anchoring, tier structure, value framing",
        "system": "You are a Pricing Strategist. Focus ONLY on pricing anchoring, tier structure, price framing, and value communication. If no pricing visible, comment on the risk of not showing prices.",
    },
    {
        "key": "accessibility_expert",
        "name": "Accessibility Expert",
        "specialty": "WCAG, keyboard nav, color contrast, screen reader semantics",
        "system": "You are an Accessibility Expert (WCAG 2.2). Focus ONLY on a11y — color contrast, keyboard navigation, semantic HTML, alt text, ARIA, focus states.",
    },
    {
        "key": "analytics_expert",
        "name": "Analytics Expert",
        "specialty": "Tracking, event instrumentation, KPI visibility",
        "system": "You are an Analytics Consultant. Focus ONLY on measurement — event tracking gaps, KPI visibility, funnel instrumentation, and what data they're likely missing.",
    },
    {
        "key": "performance_engineer",
        "name": "Performance Engineer",
        "specialty": "Page speed, Core Web Vitals, asset optimization",
        "system": "You are a Web Performance Engineer. Focus ONLY on speed — Core Web Vitals, image optimization, JS bloat, render-blocking resources visible from HTML.",
    },
    {
        "key": "growth_hacker",
        "name": "Growth Hacker",
        "specialty": "Viral loops, referral, product-led growth, activation",
        "system": "You are a Growth Hacker. Focus ONLY on growth loops — referral mechanics, viral hooks, activation moments, and product-led growth signals.",
    },
    {
        "key": "competitor_analyst",
        "name": "Competitor Analyst",
        "specialty": "Category positioning, differentiation, market gaps",
        "system": "You are a Competitive Intelligence Analyst. Focus ONLY on how this business is likely positioned vs competitors — differentiation gaps, category conventions being violated or missed.",
    },
]


EXPERT_JSON_SCHEMA = """{
  "opinion": "<2-3 sentence blunt professional opinion from YOUR specialty ONLY>",
  "confidence": <0-100 how confident you are in your read>,
  "impact": "high|medium|low",
  "priority": <1-5 where 1 is do-this-first>,
  "recommendation": "<one specific, actionable next step in your specialty>",
  "estimated_revenue_gain_pct": <0-30 estimated % monthly revenue lift if this fix ships>,
  "risk_if_ignored": "<one short sentence>"
}"""


def _build_scan_context_for_agents(scan: dict) -> str:
    """Compact context payload sent to every agent (< 3000 chars)."""
    r = scan.get("result") or {}
    scraped = r.get("scraped") or {}
    ctx = {
        "url": scan.get("target"),
        "industry_detected": r.get("industry_detected"),
        "overall_score": scan.get("score"),
        "subscores": r.get("subscores"),
        "summary": r.get("summary"),
        "strengths": r.get("strengths"),
        "top_fixes_titles": [f.get("title") for f in (r.get("top_fixes") or [])],
        "trust_gaps": r.get("trust_gaps"),
        "cta_issues": r.get("cta_issues"),
        "seo_issues": r.get("seo_issues"),
        "mobile_issues": r.get("mobile_issues"),
        "title": scraped.get("title"),
        "meta_description": scraped.get("meta_description"),
        "has_https": scraped.get("has_https"),
        "has_viewport": scraped.get("has_viewport"),
        "social_links": scraped.get("social_links"),
        "emails_found": scraped.get("emails_found"),
        "phones_found": scraped.get("phones_found"),
    }
    return json.dumps(ctx, ensure_ascii=False)[:3000]


async def _run_single_agent(agent: dict, ctx: str, scan_id: str) -> dict:
    """Run one specialist agent — returns dict with agent_key/name + LLM JSON."""
    system = (
        agent["system"]
        + "\n\nRespond with ONLY a JSON object matching this exact schema:\n"
        + EXPERT_JSON_SCHEMA
        + "\n\nNever invent scan data — only reason from what's given."
    )
    user_text = f"SCAN CONTEXT:\n{ctx}\n\nProvide your JSON response now."
    session_id = f"{scan_id}_{agent['key']}"
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system,
        ).with_model("gemini", "gemini-3-flash-preview")
        resp = await chat.send_message(UserMessage(text=user_text))
        raw = resp if isinstance(resp, str) else str(resp)
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
        m = re.search(r"\{[\s\S]*\}", raw)
        parsed = json.loads(m.group(0)) if m else {}
    except Exception as e:
        log.exception(f"agent {agent['key']} failed")
        parsed = {
            "opinion": f"(Agent unavailable: {e})",
            "confidence": 0,
            "impact": "low",
            "priority": 5,
            "recommendation": "Retry later",
            "estimated_revenue_gain_pct": 0,
            "risk_if_ignored": "",
        }
    return {
        "agent_key": agent["key"],
        "agent_name": agent["name"],
        "specialty": agent["specialty"],
        **parsed,
    }


CEO_SYS = """You are the CEO AI — the head of GrowthLens's AI Growth Team.
You have received opinions from 13 specialist experts (UX, SEO, Brand, Copywriter,
Sales, Marketing, Consumer Psychology, Pricing, Accessibility, Analytics, Performance,
Growth Hacker, Competitor Analyst). Your job is to synthesize their input into a
sharp executive decision. Do NOT rehash every expert — surface only what matters.
Be decisive. Output strictly valid JSON only."""


CEO_PROMPT = """Below is the site context, followed by the 13 expert opinions.
Synthesize an executive decision as JSON:

{{
  "verdict": "<2-3 sentence executive verdict on the site's biggest lever>",
  "biggest_opportunity": "<one sentence — the single fix with the highest ROI>",
  "biggest_risk": "<one sentence — the biggest risk if they change nothing>",
  "top_3_moves": [
    {{"title":"<short>", "why":"<1 sentence>", "owner":"<which expert leads this>", "expected_revenue_lift_pct": <0-40>}}
  ],
  "consensus_score": <0-100 how aligned the 13 experts are>,
  "board_confidence": <0-100 overall confidence in the plan>,
  "estimated_total_monthly_lift_pct": <0-40>
}}

Provide exactly 3 top_3_moves.

SITE CONTEXT:
{ctx}

EXPERT OPINIONS (13 experts):
{experts}
"""


REVENUE_LEAK_SYS = """You are the Revenue Leak Analyst. Given a scan and expert opinions,
estimate the plausible monthly revenue leakage from the current site issues.
Be honest: these are ESTIMATES with methodology assumptions. Never claim certainty.
Output strictly valid JSON only."""


REVENUE_LEAK_PROMPT = """Estimate monthly revenue leakage for this business. Reason about
typical traffic + conversion assumptions for the detected industry, then apply the site's
current issues. Output JSON:

{{
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
    {{"issue":"<short>", "monthly_loss_usd": <int>, "why":"<1 sentence>"}}
  ],
  "methodology": "<2-3 sentence plain-English explanation of assumptions>"
}}

Provide 3-5 breakdown items. Assumed numbers should be plausible for the industry
({industry}) and site scale hints in the context. Never output negative numbers.

CONTEXT:
{ctx}

EXPERT SUMMARY:
{expert_summary}
"""


@api.post("/scans/{scan_id}/growth-team")
async def run_growth_team(scan_id: str, user=Depends(current_user)):
    """Runs 13 parallel expert agents + CEO synthesis + revenue leak analysis."""
    scan = await db.scans.find_one({"id": scan_id, "user_id": user["id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan.get("mode") != "business":
        raise HTTPException(400, "AI Growth Team is only available for business scans")
    if scan.get("status") != "complete":
        raise HTTPException(400, "Scan must be complete before running the AI Growth Team")

    ctx = _build_scan_context_for_agents(scan)

    # Run all 13 specialist agents in parallel
    log.info(f"Growth Team: running {len(GROWTH_TEAM_AGENTS)} agents in parallel for scan {scan_id}")
    experts = await asyncio.gather(
        *[_run_single_agent(a, ctx, scan_id) for a in GROWTH_TEAM_AGENTS]
    )

    # CEO synthesizes
    expert_summary = json.dumps(
        [{"agent": e["agent_name"], "opinion": e.get("opinion"), "impact": e.get("impact"),
          "priority": e.get("priority"), "recommendation": e.get("recommendation"),
          "gain_pct": e.get("estimated_revenue_gain_pct", 0)} for e in experts],
        ensure_ascii=False,
    )[:6000]

    ceo_result = await llm_json(
        CEO_SYS,
        CEO_PROMPT.format(ctx=ctx[:2000], experts=expert_summary),
        f"{scan_id}_ceo",
    )

    # Revenue Leak Engine
    r = scan.get("result") or {}
    industry = r.get("industry_detected") or scan.get("industry") or "other"
    revenue_leak = await llm_json(
        REVENUE_LEAK_SYS,
        REVENUE_LEAK_PROMPT.format(
            ctx=ctx[:2000],
            expert_summary=expert_summary[:3000],
            industry=industry,
        ),
        f"{scan_id}_revleak",
    )

    growth_team_doc = {
        "experts": experts,
        "executive_summary": ceo_result,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "agent_count": len(experts),
    }

    await db.scans.update_one(
        {"id": scan_id},
        {"$set": {"growth_team": growth_team_doc, "revenue_leak": revenue_leak}},
    )

    return {"growth_team": growth_team_doc, "revenue_leak": revenue_leak}


@api.get("/scans/{scan_id}/growth-team")
async def get_growth_team(scan_id: str, user=Depends(current_user)):
    scan = await db.scans.find_one({"id": scan_id, "user_id": user["id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(404, "Scan not found")
    return {
        "growth_team": scan.get("growth_team"),
        "revenue_leak": scan.get("revenue_leak"),
    }


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
