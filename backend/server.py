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
  "checklist": ["<5-7 next-step action items in plain language>"]
}}

Provide exactly 5 top_fixes, 3 outreach_emails, 3 sales_pitches, 5 copywriting_rewrites (one per section listed).
Each top_fix MUST include realistic, copy-pasteable code snippets. Keep snippets under 15 lines each.
If no leads found, return an empty list for leads.

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
        "status": "processing",
        "created_at": now,
    }
    await db.scans.insert_one(base)

    try:
        if body.mode == "business":
            scraped = scrape_website(body.target)
            prompt = BUSINESS_PROMPT.format(data=json.dumps(scraped, ensure_ascii=False)[:8000])
            result = await llm_json(BUSINESS_SYS, prompt, sid)
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
