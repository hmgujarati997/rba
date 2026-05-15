from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import csv
import uuid
import json
import base64
import logging
import secrets
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
import qrcode
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# ---------- Setup ----------
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MIN = 60 * 24 * 7  # 7 days for ease of mobile PWA use

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Rama Bazaar 1.0 API")
api = APIRouter(prefix="/api")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

logger = logging.getLogger("rama")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_token(sub: str, role: str, extra: Optional[dict] = None) -> str:
    payload = {
        "sub": sub,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MIN),
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])

def normalize_mobile(m: str) -> str:
    return "".join(ch for ch in (m or "") if ch.isdigit())[-10:]

async def get_current(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(auth[7:])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

async def require_exhibitor(user: dict = Depends(get_current)) -> dict:
    if user.get("role") != "exhibitor":
        raise HTTPException(status_code=403, detail="Exhibitor only")
    return user

# ---------- Models ----------
class LoginIn(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    password: str

class VisitorIn(BaseModel):
    full_name: str
    mobile: str
    business_name: Optional[str] = ""
    industry: Optional[str] = ""
    city: Optional[str] = ""
    referred_by: Optional[str] = ""
    email: Optional[str] = ""

class VisitorOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    mobile: str
    business_name: str = ""
    industry: str = ""
    city: str = ""
    referred_by: str = ""
    email: str = ""
    qr_id: str
    attended: bool = False
    attended_at: Optional[str] = None
    created_at: str

class MemberNumberIn(BaseModel):
    mobile: str
    note: Optional[str] = ""

class ExhibitorRegisterIn(BaseModel):
    mobile: str
    password: str
    member_name: str
    business_name: str
    category: str
    whatsapp: Optional[str] = ""
    email: Optional[str] = ""
    description: Optional[str] = ""
    products_services: Optional[str] = ""
    instagram: Optional[str] = ""
    facebook: Optional[str] = ""
    website: Optional[str] = ""
    address: Optional[str] = ""
    maps_link: Optional[str] = ""
    logo_url: Optional[str] = ""
    banner_url: Optional[str] = ""
    profile_photo_url: Optional[str] = ""

class ExhibitorUpdateIn(BaseModel):
    member_name: Optional[str] = None
    business_name: Optional[str] = None
    category: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    products_services: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    maps_link: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    profile_photo_url: Optional[str] = None

class PasswordResetIn(BaseModel):
    new_password: str

class SponsorAdIn(BaseModel):
    name: str
    placement: Literal["popup", "inline", "footer", "featured"] = "inline"
    media_type: Literal["image", "video"] = "image"
    media_url: str
    link: Optional[str] = ""
    active: bool = True
    order: int = 0

class EventSettingsIn(BaseModel):
    event_name: Optional[str] = None
    venue: Optional[str] = None
    venue_address: Optional[str] = None
    maps_link: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    visitor_registration_open: Optional[bool] = None
    exhibitor_registration_open: Optional[bool] = None
    exhibitor_limit: Optional[int] = None
    whatsapp_template_visitor: Optional[str] = None
    whatsapp_template_exhibitor: Optional[str] = None
    bizchat_vendor_uid: Optional[str] = None
    bizchat_token: Optional[str] = None
    bizchat_template_visitor: Optional[str] = None
    bizchat_template_exhibitor: Optional[str] = None
    bizchat_template_language: Optional[str] = None
    bizchat_from_phone_id: Optional[str] = None

# ---------- Sanitize helpers ----------
EXHIBITOR_PUBLIC_FIELDS = {
    "id", "mobile", "member_name", "business_name", "category", "whatsapp", "email",
    "description", "products_services", "instagram", "facebook", "website",
    "address", "maps_link", "logo_url", "banner_url", "profile_photo_url",
    "approved", "featured", "hidden", "created_at"
}

def public_exhibitor(doc: dict) -> dict:
    return {k: doc.get(k) for k in EXHIBITOR_PUBLIC_FIELDS if k in doc}

def admin_exhibitor(doc: dict) -> dict:
    d = dict(doc)
    d.pop("_id", None)
    d.pop("password_hash", None)
    return d

# ---------- Auth Endpoints ----------
@api.post("/auth/login")
async def login(data: LoginIn):
    # Admin login via email
    if data.email:
        admin = await db.admins.find_one({"email": data.email.lower()}, {"_id": 0})
        if not admin or not verify_password(data.password, admin["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(admin["id"], "admin", {"email": admin["email"]})
        return {"token": token, "role": "admin", "user": {"id": admin["id"], "email": admin["email"], "name": admin.get("name", "Admin")}}
    # Exhibitor login via mobile
    if data.mobile:
        mobile = normalize_mobile(data.mobile)
        ex = await db.exhibitors.find_one({"mobile": mobile}, {"_id": 0})
        if not ex or not ex.get("password_hash") or not verify_password(data.password, ex["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid mobile or password")
        token = create_token(ex["id"], "exhibitor", {"mobile": ex["mobile"]})
        return {"token": token, "role": "exhibitor", "user": public_exhibitor(ex)}
    raise HTTPException(status_code=400, detail="Provide email or mobile")

@api.get("/auth/me")
async def me(user: dict = Depends(get_current)):
    if user["role"] == "admin":
        a = await db.admins.find_one({"id": user["sub"]}, {"_id": 0, "password_hash": 0})
        return {"role": "admin", "user": a}
    ex = await db.exhibitors.find_one({"id": user["sub"]}, {"_id": 0, "password_hash": 0})
    if not ex:
        raise HTTPException(status_code=401, detail="Not found")
    return {"role": "exhibitor", "user": public_exhibitor(ex)}

# ---------- File Upload ----------
@api.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "webp", "gif", "mp4", "webm"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    file_id = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / file_id
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 8MB)")
    with open(path, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{file_id}", "filename": file_id}

# ---------- Public Settings ----------
async def get_settings() -> dict:
    s = await db.settings.find_one({"id": "main"}, {"_id": 0})
    if not s:
        s = {
            "id": "main",
            "event_name": "Rama Bazaar 1.0",
            "venue": "TBA",
            "venue_address": "",
            "maps_link": "",
            "start_date": "",
            "end_date": "",
            "visitor_registration_open": True,
            "exhibitor_registration_open": True,
            "exhibitor_limit": int(os.environ.get("EXHIBITOR_REGISTRATION_LIMIT", "100")),
            "whatsapp_template_visitor": "Hello {name}, your Rama Bazaar 1.0 registration is confirmed. Your QR is attached. — Team Rama",
            "whatsapp_template_exhibitor": "Welcome {name}, your Rama Bazaar 1.0 exhibitor account is created. Login at the portal.",
            "bizchat_vendor_uid": os.environ.get("BIZCHAT_VENDOR_UID", ""),
            "bizchat_token": os.environ.get("BIZCHAT_TOKEN", ""),
            "bizchat_template_visitor": "",
            "bizchat_template_exhibitor": "",
            "bizchat_template_language": "en",
            "bizchat_from_phone_id": "",
            "updated_at": now_iso(),
        }
        await db.settings.insert_one(dict(s))
    return s

@api.get("/settings")
async def public_settings():
    s = await get_settings()
    # Don't leak secrets publicly
    safe = {k: v for k, v in s.items() if k not in {"bizchat_token", "bizchat_vendor_uid", "bizchat_from_phone_id"}}
    return safe

@api.get("/admin/settings")
async def admin_get_settings(_: dict = Depends(require_admin)):
    return await get_settings()

@api.put("/admin/settings")
async def admin_update_settings(data: EventSettingsIn, _: dict = Depends(require_admin)):
    upd = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    upd["updated_at"] = now_iso()
    await db.settings.update_one({"id": "main"}, {"$set": upd}, upsert=True)
    return await get_settings()

# ---------- Visitors ----------
@api.post("/visitors/register")
async def visitor_register(data: VisitorIn):
    s = await get_settings()
    if not s.get("visitor_registration_open", True):
        raise HTTPException(status_code=403, detail="Visitor registration is closed")
    mobile = normalize_mobile(data.mobile)
    if len(mobile) != 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    existing = await db.visitors.find_one({"mobile": mobile}, {"_id": 0})
    if existing:
        return {"already_registered": True, "visitor": existing}
    qr_id = uuid.uuid4().hex
    doc = {
        "id": uuid.uuid4().hex,
        "full_name": data.full_name.strip(),
        "mobile": mobile,
        "business_name": (data.business_name or "").strip(),
        "industry": (data.industry or "").strip(),
        "city": (data.city or "").strip(),
        "referred_by": (data.referred_by or "").strip(),
        "email": (data.email or "").strip(),
        "qr_id": qr_id,
        "attended": False,
        "attended_at": None,
        "created_at": now_iso(),
    }
    await db.visitors.insert_one(dict(doc))
    return {"already_registered": False, "visitor": doc}

@api.post("/visitors/retrieve")
async def visitor_retrieve(payload: dict):
    mobile = normalize_mobile(payload.get("mobile", ""))
    v = await db.visitors.find_one({"mobile": mobile}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="No registration found for this mobile number")
    return {"visitor": v}

@api.get("/visitors/qr/{qr_id}.png")
async def visitor_qr_image(qr_id: str):
    v = await db.visitors.find_one({"qr_id": qr_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="QR not found")
    payload = json.dumps({"qr": qr_id, "name": v["full_name"], "mobile": v["mobile"]})
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=40, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#1f1f27", back_color="#ffffff").convert("RGB")

    # Compose branded poster: 1080x1620 (3:4.5) — looks great in WhatsApp preview
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1080, 1620
    bg = Image.new("RGB", (W, H), "#f8f7f4")
    draw = ImageDraw.Draw(bg)
    # Gold frame
    draw.rectangle([(40, 40), (W - 40, H - 40)], outline="#b2873d", width=3)
    draw.rectangle([(56, 56), (W - 56, H - 56)], outline="#d8bc84", width=1)

    # Fonts (fall back to default if not available)
    def _font(size: int, bold: bool = False):
        candidates = [
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
        for p in candidates:
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    pass
        return ImageFont.load_default()

    eyebrow_f = _font(28, False)
    title_f = _font(96, True)
    sub_f = _font(40, True)
    body_f = _font(34, False)
    small_f = _font(26, False)

    def _text_center(text: str, y: int, font, fill="#1f1f27"):
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((W - w) / 2, y), text, font=font, fill=fill)

    _text_center("AN EXCLUSIVE LVB RAMA EVENT", 130, eyebrow_f, fill="#b2873d")
    _text_center("RAMA", 200, title_f, fill="#1f1f27")
    # Divider
    draw.line([(W / 2 - 240, 350), (W / 2 - 70, 350)], fill="#b2873d", width=2)
    draw.line([(W / 2 + 70, 350), (W / 2 + 240, 350)], fill="#b2873d", width=2)
    _text_center("BAZAAR 1.0", 330, sub_f, fill="#b2873d")
    _text_center("CONNECT  •  SHOWCASE  •  GROW", 400, small_f, fill="#1f1f27")

    # QR
    qr_size = 760
    qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    qr_x = (W - qr_size) // 2
    qr_y = 520
    # subtle frame around QR
    draw.rectangle([(qr_x - 20, qr_y - 20), (qr_x + qr_size + 20, qr_y + qr_size + 20)], outline="#d8bc84", width=2)
    bg.paste(qr_img, (qr_x, qr_y))

    # Visitor info
    name = v.get("full_name", "")
    _text_center(name.upper()[:32], qr_y + qr_size + 70, sub_f, fill="#1f1f27")
    _text_center(f"+91 {v.get('mobile','')}", qr_y + qr_size + 130, body_f, fill="#3b3b46")
    _text_center("VISITOR PASS  ·  SCAN AT VENUE", qr_y + qr_size + 200, eyebrow_f, fill="#b2873d")

    buf = io.BytesIO()
    bg.save(buf, format="PNG", optimize=False, compress_level=3)
    buf.seek(0)
    headers = {"Content-Disposition": f'inline; filename="rama-bazaar-{qr_id}.png"', "Cache-Control": "public, max-age=86400"}
    return StreamingResponse(buf, media_type="image/png", headers=headers)

# ---------- Attendance ----------
@api.post("/attendance/scan")
async def attendance_scan(payload: dict, _: dict = Depends(require_admin)):
    qr_id = payload.get("qr_id", "").strip()
    # Allow JSON QR payloads too
    if qr_id.startswith("{"):
        try:
            qr_id = json.loads(qr_id).get("qr", "")
        except Exception:
            pass
    v = await db.visitors.find_one({"qr_id": qr_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    if v.get("attended"):
        return {"already": True, "visitor": v}
    await db.visitors.update_one({"qr_id": qr_id}, {"$set": {"attended": True, "attended_at": now_iso()}})
    v["attended"] = True
    v["attended_at"] = now_iso()
    return {"already": False, "visitor": v}

@api.post("/attendance/manual")
async def attendance_manual(payload: dict, _: dict = Depends(require_admin)):
    mobile = normalize_mobile(payload.get("mobile", ""))
    v = await db.visitors.find_one({"mobile": mobile}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Visitor not found")
    if v.get("attended"):
        return {"already": True, "visitor": v}
    await db.visitors.update_one({"mobile": mobile}, {"$set": {"attended": True, "attended_at": now_iso()}})
    v["attended"] = True
    v["attended_at"] = now_iso()
    return {"already": False, "visitor": v}

@api.get("/attendance/stats")
async def attendance_stats(_: dict = Depends(require_admin)):
    total = await db.visitors.count_documents({})
    present = await db.visitors.count_documents({"attended": True})
    return {"total": total, "present": present, "pending": total - present}

# ---------- Allowed Member Numbers ----------
@api.post("/admin/members")
async def add_member(data: MemberNumberIn, _: dict = Depends(require_admin)):
    mobile = normalize_mobile(data.mobile)
    if len(mobile) != 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    existing = await db.allowed_members.find_one({"mobile": mobile})
    if existing:
        return {"already": True}
    await db.allowed_members.insert_one({"id": uuid.uuid4().hex, "mobile": mobile, "note": data.note or "", "created_at": now_iso()})
    return {"ok": True}

@api.post("/admin/members/bulk")
async def add_members_bulk(file: UploadFile = File(...), _: dict = Depends(require_admin)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    reader = csv.reader(io.StringIO(content))
    count = 0
    skipped = 0
    for row in reader:
        if not row:
            continue
        mobile = normalize_mobile(row[0])
        if len(mobile) != 10:
            skipped += 1
            continue
        existing = await db.allowed_members.find_one({"mobile": mobile})
        if existing:
            skipped += 1
            continue
        note = row[1] if len(row) > 1 else ""
        await db.allowed_members.insert_one({"id": uuid.uuid4().hex, "mobile": mobile, "note": note, "created_at": now_iso()})
        count += 1
    return {"added": count, "skipped": skipped}

@api.get("/admin/members")
async def list_members(_: dict = Depends(require_admin)):
    items = await db.allowed_members.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items

@api.delete("/admin/members/{member_id}")
async def delete_member(member_id: str, _: dict = Depends(require_admin)):
    await db.allowed_members.delete_one({"id": member_id})
    return {"ok": True}

@api.post("/exhibitors/check-eligibility")
async def check_eligibility(payload: dict):
    mobile = normalize_mobile(payload.get("mobile", ""))
    if len(mobile) != 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    s = await get_settings()
    count = await db.exhibitors.count_documents({})
    allowed = await db.allowed_members.find_one({"mobile": mobile})
    already = await db.exhibitors.find_one({"mobile": mobile})
    if already:
        raise HTTPException(status_code=409, detail="This mobile is already registered as an exhibitor")
    if not allowed:
        raise HTTPException(status_code=403, detail="This number is not eligible for Rama Bazaar exhibitor registration.")
    if not s.get("exhibitor_registration_open", True):
        raise HTTPException(status_code=403, detail="Exhibitor registration is closed")
    limit = int(s.get("exhibitor_limit", 100))
    if count >= limit:
        raise HTTPException(status_code=403, detail="Exhibitor registration limit reached")
    return {"eligible": True, "slots_remaining": max(0, limit - count)}

@api.post("/exhibitors/register")
async def exhibitor_register(data: ExhibitorRegisterIn):
    mobile = normalize_mobile(data.mobile)
    s = await get_settings()
    count = await db.exhibitors.count_documents({})
    allowed = await db.allowed_members.find_one({"mobile": mobile})
    if not allowed:
        raise HTTPException(status_code=403, detail="This number is not eligible for Rama Bazaar exhibitor registration.")
    if not s.get("exhibitor_registration_open", True):
        raise HTTPException(status_code=403, detail="Exhibitor registration is closed")
    limit = int(s.get("exhibitor_limit", 100))
    if count >= limit:
        raise HTTPException(status_code=403, detail="Exhibitor registration limit reached")
    if await db.exhibitors.find_one({"mobile": mobile}):
        raise HTTPException(status_code=409, detail="This mobile is already registered")
    doc = data.model_dump()
    doc["mobile"] = mobile
    doc["whatsapp"] = normalize_mobile(doc.get("whatsapp", "")) or mobile
    doc["id"] = uuid.uuid4().hex
    doc["password_hash"] = hash_password(data.password)
    doc.pop("password", None)
    doc["approved"] = False
    doc["featured"] = False
    doc["hidden"] = False
    doc["created_at"] = now_iso()
    await db.exhibitors.insert_one(dict(doc))
    token = create_token(doc["id"], "exhibitor", {"mobile": mobile})
    return {"token": token, "role": "exhibitor", "user": public_exhibitor(doc)}

@api.put("/exhibitors/me")
async def update_self(data: ExhibitorUpdateIn, user: dict = Depends(require_exhibitor)):
    upd = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not upd:
        raise HTTPException(status_code=400, detail="Nothing to update")
    if "whatsapp" in upd:
        upd["whatsapp"] = normalize_mobile(upd["whatsapp"])
    upd["updated_at"] = now_iso()
    await db.exhibitors.update_one({"id": user["sub"]}, {"$set": upd})
    ex = await db.exhibitors.find_one({"id": user["sub"]}, {"_id": 0})
    return public_exhibitor(ex)

@api.post("/exhibitors/me/password")
async def change_password(payload: dict, user: dict = Depends(require_exhibitor)):
    new_pw = payload.get("new_password", "")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    await db.exhibitors.update_one({"id": user["sub"]}, {"$set": {"password_hash": hash_password(new_pw)}})
    return {"ok": True}

# ---------- Public Roster ----------
@api.get("/roster")
async def roster(category: Optional[str] = None, q: Optional[str] = None):
    filt = {"approved": True, "hidden": {"$ne": True}}
    if category and category != "all":
        filt["category"] = category
    if q:
        filt["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"member_name": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    exhibitors = await db.exhibitors.find(filt, {"_id": 0, "password_hash": 0}).sort([("featured", -1), ("created_at", 1)]).to_list(1000)
    exhibitors = [public_exhibitor(e) for e in exhibitors]
    ads = await db.sponsor_ads.find({"placement": "inline", "active": True}, {"_id": 0}).sort("order", 1).to_list(50)
    return {"exhibitors": exhibitors, "inline_ads": ads}

@api.get("/roster/categories")
async def roster_categories():
    cats = await db.exhibitors.distinct("category", {"approved": True, "hidden": {"$ne": True}})
    return sorted([c for c in cats if c])

@api.get("/roster/sponsors")
async def public_sponsors():
    popup = await db.sponsor_ads.find({"placement": "popup", "active": True}, {"_id": 0}).sort("order", 1).to_list(10)
    footer = await db.sponsor_ads.find({"placement": "footer", "active": True}, {"_id": 0}).sort("order", 1).to_list(10)
    featured = await db.sponsor_ads.find({"placement": "featured", "active": True}, {"_id": 0}).sort("order", 1).to_list(10)
    return {"popup": popup, "footer": footer, "featured": featured}

@api.post("/sponsor-ads/{ad_id}/impression")
async def sponsor_impression(ad_id: str):
    await db.sponsor_ads.update_one({"id": ad_id}, {"$inc": {"impressions": 1}})
    return {"ok": True}

@api.post("/sponsor-ads/{ad_id}/click")
async def sponsor_click(ad_id: str):
    await db.sponsor_ads.update_one({"id": ad_id}, {"$inc": {"clicks": 1}})
    return {"ok": True}

# ---------- Admin: Exhibitors ----------
@api.get("/admin/exhibitors")
async def admin_list_exhibitors(_: dict = Depends(require_admin)):
    items = await db.exhibitors.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)
    return items

@api.put("/admin/exhibitors/{ex_id}")
async def admin_update_exhibitor(ex_id: str, payload: dict, _: dict = Depends(require_admin)):
    payload.pop("id", None)
    payload.pop("password_hash", None)
    payload["updated_at"] = now_iso()
    await db.exhibitors.update_one({"id": ex_id}, {"$set": payload})
    ex = await db.exhibitors.find_one({"id": ex_id}, {"_id": 0, "password_hash": 0})
    return ex

@api.delete("/admin/exhibitors/{ex_id}")
async def admin_delete_exhibitor(ex_id: str, _: dict = Depends(require_admin)):
    await db.exhibitors.delete_one({"id": ex_id})
    return {"ok": True}

@api.post("/admin/exhibitors/{ex_id}/reset-password")
async def admin_reset_pw(ex_id: str, data: PasswordResetIn, _: dict = Depends(require_admin)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    await db.exhibitors.update_one({"id": ex_id}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"ok": True}

# ---------- Admin: Visitors ----------
@api.get("/admin/visitors")
async def admin_list_visitors(_: dict = Depends(require_admin)):
    items = await db.visitors.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return items

@api.get("/admin/visitors/export.csv")
async def admin_export_visitors(_: dict = Depends(require_admin)):
    items = await db.visitors.find({}, {"_id": 0}).sort("created_at", -1).to_list(50000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Full Name", "Mobile", "Business", "Industry", "City", "Referred By", "Email", "Attended", "Attended At", "Created At"])
    for v in items:
        writer.writerow([v.get("full_name"), v.get("mobile"), v.get("business_name"), v.get("industry"), v.get("city"), v.get("referred_by"), v.get("email"), v.get("attended"), v.get("attended_at"), v.get("created_at")])
    return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8")), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="visitors.csv"'})

@api.delete("/admin/visitors/{vid}")
async def admin_delete_visitor(vid: str, _: dict = Depends(require_admin)):
    await db.visitors.delete_one({"id": vid})
    return {"ok": True}

# ---------- Admin: Sponsor Ads ----------
@api.get("/admin/sponsor-ads")
async def admin_list_ads(_: dict = Depends(require_admin)):
    items = await db.sponsor_ads.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items

@api.post("/admin/sponsor-ads")
async def admin_create_ad(data: SponsorAdIn, _: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["impressions"] = 0
    doc["clicks"] = 0
    doc["created_at"] = now_iso()
    await db.sponsor_ads.insert_one(dict(doc))
    return doc

@api.put("/admin/sponsor-ads/{ad_id}")
async def admin_update_ad(ad_id: str, data: SponsorAdIn, _: dict = Depends(require_admin)):
    upd = data.model_dump()
    upd["updated_at"] = now_iso()
    await db.sponsor_ads.update_one({"id": ad_id}, {"$set": upd})
    ad = await db.sponsor_ads.find_one({"id": ad_id}, {"_id": 0})
    return ad

@api.delete("/admin/sponsor-ads/{ad_id}")
async def admin_delete_ad(ad_id: str, _: dict = Depends(require_admin)):
    await db.sponsor_ads.delete_one({"id": ad_id})
    return {"ok": True}

# ---------- Admin: Stats ----------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_visitors = await db.visitors.count_documents({})
    present = await db.visitors.count_documents({"attended": True})
    total_ex = await db.exhibitors.count_documents({})
    approved_ex = await db.exhibitors.count_documents({"approved": True})
    s = await get_settings()
    limit = int(s.get("exhibitor_limit", 100))
    ads = await db.sponsor_ads.find({}, {"_id": 0}).to_list(200)
    total_imp = sum(a.get("impressions", 0) for a in ads)
    total_clicks = sum(a.get("clicks", 0) for a in ads)
    return {
        "total_visitors": total_visitors,
        "present_visitors": present,
        "pending_visitors": total_visitors - present,
        "total_exhibitors": total_ex,
        "approved_exhibitors": approved_ex,
        "exhibitor_limit": limit,
        "remaining_slots": max(0, limit - total_ex),
        "sponsor_impressions": total_imp,
        "sponsor_clicks": total_clicks,
    }

# ---------- WhatsApp (BizChat — Meta-approved templates) ----------
def _bizchat_config(s: dict):
    vendor = s.get("bizchat_vendor_uid") or os.environ.get("BIZCHAT_VENDOR_UID")
    token = s.get("bizchat_token") or os.environ.get("BIZCHAT_TOKEN")
    base = os.environ.get("BIZCHAT_API_BASE", "https://bizchatapi.in/api")
    return base, vendor, token

async def send_bizchat_template(to_mobile: str, template_name: str, header_image: Optional[str], fields: List[str], name: str = ""):
    """Send a Meta-approved template message via BizChat.

    fields are body variables in order ({{1}}, {{2}} ...). If the template has a media
    header (image), pass it via header_image.
    """
    s = await get_settings()
    base, vendor, token = _bizchat_config(s)
    if not vendor or not token or not template_name:
        logger.info("BizChat template send skipped (missing vendor / token / template)")
        return {"skipped": True, "reason": "bizchat-not-configured-or-template-missing"}
    lang = s.get("bizchat_template_language") or "en"
    from_id = s.get("bizchat_from_phone_id") or ""
    url = f"{base}/{vendor}/contact/send-template-message?token={token}"
    payload = {
        "phone_number": to_mobile,
        "template_name": template_name,
        "template_language": lang,
    }
    if from_id:
        payload["from_phone_number_id"] = from_id
    if header_image:
        payload["header_image"] = header_image
        payload["header_field_1"] = name or ""
    for i, val in enumerate(fields or [], start=1):
        payload[f"field_{i}"] = val
    if name:
        first, _, last = name.partition(" ")
        payload["contact"] = {
            "first_name": first or name,
            "last_name": last,
            "country": "india",
            "language_code": lang,
        }
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(url, json=payload)
            return {"status": r.status_code, "body": r.text[:500], "payload_sent": payload}
    except Exception as e:
        logger.warning(f"BizChat send error: {e}")
        return {"error": str(e)}

@api.get("/admin/bizchat/templates")
async def bizchat_templates(_: dict = Depends(require_admin)):
    s = await get_settings()
    base, vendor, token = _bizchat_config(s)
    if not vendor or not token:
        raise HTTPException(status_code=400, detail="BizChat is not configured. Add vendor UID and token in Settings.")
    url = f"{base}/{vendor}/contact/template-list?token={token}"
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(url)
            try:
                data = r.json()
            except Exception:
                data = {"raw": r.text}
            return {"status": r.status_code, "data": data}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"BizChat error: {e}")

@api.post("/admin/bizchat/test-send")
async def bizchat_test_send(payload: dict, _: dict = Depends(require_admin)):
    """Quick template test from admin. Payload: { mobile, template?, name? }"""
    mobile = normalize_mobile(payload.get("mobile", ""))
    if len(mobile) != 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    s = await get_settings()
    template = payload.get("template") or s.get("bizchat_template_visitor") or ""
    name = payload.get("name", "Friend")
    to = "91" + mobile
    res = await send_bizchat_template(to, template, header_image=None, fields=[name], name=name)
    return {"sent": True, "result": res}

@api.post("/visitors/send-whatsapp/{qr_id}")
async def send_whatsapp(qr_id: str, request: Request):
    v = await db.visitors.find_one({"qr_id": qr_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Visitor not found")
    s = await get_settings()
    template = s.get("bizchat_template_visitor", "")
    if not template:
        return {"sent": False, "result": {"skipped": True, "reason": "visitor template not set in Admin → Settings → BizChat"}}
    base_url = str(request.base_url).rstrip("/")
    qr_url = f"{base_url}/api/visitors/qr/{qr_id}.png"
    to = ("91" + v["mobile"]) if len(v["mobile"]) == 10 else v["mobile"]
    result = await send_bizchat_template(
        to_mobile=to,
        template_name=template,
        header_image=qr_url,           # template's header IMAGE variable receives the branded QR poster
        fields=[v.get("full_name", "")],  # {{1}} in body = name (override in your approved template as needed)
        name=v.get("full_name", ""),
    )
    return {"sent": True, "result": result}

# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.exhibitors.create_index("mobile", unique=True)
    await db.visitors.create_index("mobile", unique=True)
    await db.visitors.create_index("qr_id", unique=True)
    await db.allowed_members.create_index("mobile", unique=True)
    await db.sponsor_ads.create_index("placement")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@admin.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.admins.find_one({"email": admin_email})
    if not existing:
        await db.admins.insert_one({
            "id": uuid.uuid4().hex,
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.admins.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info(f"Updated admin password: {admin_email}")
    await get_settings()  # ensure default settings exist

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---------- Mount ----------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
