"""Backend pytest suite for Rama Bazaar 1.0 — covers auth, visitors, exhibitors, roster, attendance, admin, settings, uploads."""
import os
import io
import csv
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bazaar-demo-env.preview.emergentagent.com").rstrip("/")
# Load frontend env if BASE_URL not in environ
if not os.environ.get("REACT_APP_BACKEND_URL"):
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

ADMIN_EMAIL = "admin@admin.com"
ADMIN_PASSWORD = "Admin@123"

# Use a unique test mobile per run so we don't conflict with prior seeds
TEST_EX_MOBILE = "98" + str(uuid.uuid4().int)[:8]
TEST_EX_PASSWORD = "Exhibit@123"
TEST_VISITOR_MOBILE = "97" + str(uuid.uuid4().int)[:8]


# --- Fixtures ---
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Auth tests ---
class TestAuth:
    def test_admin_login_success(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin"
        assert d["user"]["email"] == ADMIN_EMAIL
        assert isinstance(d["token"], str) and len(d["token"]) > 20

    def test_admin_login_invalid(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_login_missing_creds(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"password": "x"})
        assert r.status_code == 400

    def test_auth_me_admin(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_auth_me_unauthenticated(self, s):
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# --- Settings tests ---
class TestSettings:
    def test_public_settings_no_secrets(self, s):
        r = s.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        d = r.json()
        assert "event_name" in d
        assert "bizchat_token" not in d
        assert "bizchat_vendor_uid" not in d

    def test_admin_settings_get(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers)
        assert r.status_code == 200
        # Admin sees bizchat fields (may be empty strings)
        assert "bizchat_token" in r.json() or "bizchat_vendor_uid" in r.json()

    def test_admin_settings_update(self, s, admin_headers):
        new_name = f"Rama Bazaar TEST {uuid.uuid4().hex[:4]}"
        r = s.put(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
                  json={"event_name": new_name, "venue": "Test Venue"})
        assert r.status_code == 200
        # Verify persistence
        r2 = s.get(f"{BASE_URL}/api/settings")
        assert r2.json()["event_name"] == new_name
        # Reset to default-ish
        s.put(f"{BASE_URL}/api/admin/settings", headers=admin_headers,
              json={"event_name": "Rama Bazaar 1.0"})


# --- Visitor tests ---
class TestVisitors:
    visitor_qr_id = None

    def test_visitor_register(self, s):
        payload = {
            "full_name": "TEST_Visitor One",
            "mobile": TEST_VISITOR_MOBILE,
            "business_name": "TestCo",
            "industry": "Retail",
            "city": "Mumbai",
            "email": "v1@test.com",
        }
        r = s.post(f"{BASE_URL}/api/visitors/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["already_registered"] is False
        assert d["visitor"]["mobile"] == TEST_VISITOR_MOBILE[-10:]
        assert "qr_id" in d["visitor"]
        TestVisitors.visitor_qr_id = d["visitor"]["qr_id"]

    def test_visitor_duplicate(self, s):
        r = s.post(f"{BASE_URL}/api/visitors/register", json={
            "full_name": "TEST_Visitor One Dup", "mobile": TEST_VISITOR_MOBILE
        })
        assert r.status_code == 200
        assert r.json()["already_registered"] is True

    def test_visitor_retrieve(self, s):
        r = s.post(f"{BASE_URL}/api/visitors/retrieve", json={"mobile": TEST_VISITOR_MOBILE})
        assert r.status_code == 200
        assert r.json()["visitor"]["mobile"] == TEST_VISITOR_MOBILE[-10:]

    def test_visitor_retrieve_not_found(self, s):
        r = s.post(f"{BASE_URL}/api/visitors/retrieve", json={"mobile": "0000000000"})
        assert r.status_code == 404

    def test_visitor_qr_png_size(self, s):
        assert TestVisitors.visitor_qr_id is not None
        r = s.get(f"{BASE_URL}/api/visitors/qr/{TestVisitors.visitor_qr_id}.png")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/png")
        size = len(r.content)
        print(f"QR PNG size: {size} bytes")
        assert r.content[:4] == b"\x89PNG"
        # Requirement: > 20KB for WhatsApp shareability
        assert size > 20_000, f"QR PNG too small for WhatsApp: {size} bytes"

    def test_visitor_register_invalid_mobile(self, s):
        r = s.post(f"{BASE_URL}/api/visitors/register", json={"full_name": "x", "mobile": "abc"})
        assert r.status_code == 400


# --- Allowed members tests ---
class TestMembers:
    def test_add_member(self, s, admin_headers):
        r = s.post(f"{BASE_URL}/api/admin/members", headers=admin_headers,
                   json={"mobile": TEST_EX_MOBILE, "note": "TEST member"})
        assert r.status_code == 200
        assert r.json().get("ok") is True or r.json().get("already") is True

    def test_member_requires_admin(self, s):
        r = s.post(f"{BASE_URL}/api/admin/members", json={"mobile": "1234567890"})
        assert r.status_code == 401

    def test_list_members(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/members", headers=admin_headers)
        assert r.status_code == 200
        members = r.json()
        mobiles = [m["mobile"] for m in members]
        assert TEST_EX_MOBILE[-10:] in mobiles

    def test_bulk_upload(self, s, admin_token):
        # CSV with two new mobiles
        m1 = "99" + str(uuid.uuid4().int)[:8]
        m2 = "99" + str(uuid.uuid4().int)[:8]
        csv_content = f"{m1},bulk1\n{m2},bulk2\n"
        files = {"file": ("members.csv", csv_content, "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/members/bulk", files=files,
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        assert d["added"] >= 2


# --- Exhibitor tests ---
class TestExhibitors:
    ex_token = None
    ex_id = None

    def test_check_eligibility_ineligible(self, s):
        r = s.post(f"{BASE_URL}/api/exhibitors/check-eligibility", json={"mobile": "0123456789"})
        assert r.status_code == 403

    def test_check_eligibility_invalid(self, s):
        r = s.post(f"{BASE_URL}/api/exhibitors/check-eligibility", json={"mobile": "abc"})
        assert r.status_code == 400

    def test_check_eligibility_allowed(self, s):
        r = s.post(f"{BASE_URL}/api/exhibitors/check-eligibility", json={"mobile": TEST_EX_MOBILE})
        assert r.status_code == 200, r.text
        assert r.json()["eligible"] is True

    def test_exhibitor_register(self, s):
        payload = {
            "mobile": TEST_EX_MOBILE,
            "password": TEST_EX_PASSWORD,
            "member_name": "TEST_Exhibitor",
            "business_name": "TEST_BizCo",
            "category": "Retail",
            "whatsapp": TEST_EX_MOBILE,
            "email": "ex@test.com",
            "description": "test desc",
            "products_services": "items",
        }
        r = s.post(f"{BASE_URL}/api/exhibitors/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == "exhibitor"
        assert "token" in d
        TestExhibitors.ex_token = d["token"]
        TestExhibitors.ex_id = d["user"]["id"]

    def test_exhibitor_duplicate_registration(self, s):
        r = s.post(f"{BASE_URL}/api/exhibitors/check-eligibility", json={"mobile": TEST_EX_MOBILE})
        assert r.status_code == 409  # already registered

    def test_exhibitor_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"mobile": TEST_EX_MOBILE, "password": TEST_EX_PASSWORD})
        assert r.status_code == 200
        assert r.json()["role"] == "exhibitor"

    def test_exhibitor_login_wrong_password(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"mobile": TEST_EX_MOBILE, "password": "wrong"})
        assert r.status_code == 401

    def test_exhibitor_me_update(self, s):
        assert TestExhibitors.ex_token
        h = {"Authorization": f"Bearer {TestExhibitors.ex_token}", "Content-Type": "application/json"}
        r = s.put(f"{BASE_URL}/api/exhibitors/me", headers=h,
                  json={"description": "UPDATED desc TEST"})
        assert r.status_code == 200
        assert r.json()["description"] == "UPDATED desc TEST"

    def test_admin_approve_exhibitor(self, s, admin_headers):
        assert TestExhibitors.ex_id
        r = s.put(f"{BASE_URL}/api/admin/exhibitors/{TestExhibitors.ex_id}",
                  headers=admin_headers, json={"approved": True, "featured": False, "hidden": False})
        assert r.status_code == 200
        assert r.json()["approved"] is True

    def test_admin_reset_exhibitor_password(self, s, admin_headers):
        assert TestExhibitors.ex_id
        r = s.post(f"{BASE_URL}/api/admin/exhibitors/{TestExhibitors.ex_id}/reset-password",
                   headers=admin_headers, json={"new_password": "NewPass@123"})
        assert r.status_code == 200
        # Verify new password works
        r2 = s.post(f"{BASE_URL}/api/auth/login",
                    json={"mobile": TEST_EX_MOBILE, "password": "NewPass@123"})
        assert r2.status_code == 200


# --- Roster tests ---
class TestRoster:
    def test_roster_returns_approved_only(self, s):
        r = s.get(f"{BASE_URL}/api/roster")
        assert r.status_code == 200
        d = r.json()
        assert "exhibitors" in d
        assert "inline_ads" in d
        for ex in d["exhibitors"]:
            assert ex.get("approved") is True
            assert ex.get("hidden") is not True
            assert "password_hash" not in ex

    def test_roster_categories(self, s):
        r = s.get(f"{BASE_URL}/api/roster/categories")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_roster_sponsors(self, s):
        r = s.get(f"{BASE_URL}/api/roster/sponsors")
        assert r.status_code == 200
        d = r.json()
        assert "popup" in d and "footer" in d and "featured" in d


# --- Sponsor ads CRUD ---
class TestSponsorAds:
    ad_id = None

    def test_create_ad(self, s, admin_headers):
        r = s.post(f"{BASE_URL}/api/admin/sponsor-ads", headers=admin_headers, json={
            "name": "TEST_Ad1", "placement": "inline", "media_type": "image",
            "media_url": "/uploads/test.png", "link": "https://example.com", "active": True, "order": 1
        })
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_Ad1"
        assert "id" in d
        TestSponsorAds.ad_id = d["id"]

    def test_impression(self, s):
        assert TestSponsorAds.ad_id
        r = s.post(f"{BASE_URL}/api/sponsor-ads/{TestSponsorAds.ad_id}/impression")
        assert r.status_code == 200

    def test_click(self, s):
        assert TestSponsorAds.ad_id
        r = s.post(f"{BASE_URL}/api/sponsor-ads/{TestSponsorAds.ad_id}/click")
        assert r.status_code == 200

    def test_update_ad(self, s, admin_headers):
        assert TestSponsorAds.ad_id
        r = s.put(f"{BASE_URL}/api/admin/sponsor-ads/{TestSponsorAds.ad_id}",
                  headers=admin_headers, json={
                      "name": "TEST_Ad1_upd", "placement": "popup", "media_type": "image",
                      "media_url": "/uploads/test.png", "link": "", "active": True, "order": 2
                  })
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Ad1_upd"

    def test_admin_list_ads(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/sponsor-ads", headers=admin_headers)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json()]
        assert TestSponsorAds.ad_id in ids

    def test_delete_ad(self, s, admin_headers):
        assert TestSponsorAds.ad_id
        r = s.delete(f"{BASE_URL}/api/admin/sponsor-ads/{TestSponsorAds.ad_id}",
                     headers=admin_headers)
        assert r.status_code == 200


# --- Attendance ---
class TestAttendance:
    def test_attendance_requires_admin(self, s):
        r = s.post(f"{BASE_URL}/api/attendance/scan", json={"qr_id": "x"})
        assert r.status_code == 401

    def test_attendance_scan(self, s, admin_headers):
        qr = TestVisitors.visitor_qr_id
        assert qr
        r = s.post(f"{BASE_URL}/api/attendance/scan", headers=admin_headers, json={"qr_id": qr})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["visitor"]["attended"] is True
        # Duplicate scan
        r2 = s.post(f"{BASE_URL}/api/attendance/scan", headers=admin_headers, json={"qr_id": qr})
        assert r2.status_code == 200
        assert r2.json()["already"] is True

    def test_attendance_scan_invalid(self, s, admin_headers):
        r = s.post(f"{BASE_URL}/api/attendance/scan", headers=admin_headers,
                   json={"qr_id": "nonexistent_qr_id_xyz"})
        assert r.status_code == 404

    def test_attendance_manual(self, s, admin_headers):
        # create another visitor & mark via manual
        m = "96" + str(uuid.uuid4().int)[:8]
        s.post(f"{BASE_URL}/api/visitors/register", json={"full_name": "TEST_Manual", "mobile": m})
        r = s.post(f"{BASE_URL}/api/attendance/manual", headers=admin_headers, json={"mobile": m})
        assert r.status_code == 200
        assert r.json()["visitor"]["attended"] is True

    def test_attendance_stats(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/attendance/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and "present" in d and "pending" in d


# --- Admin stats & visitor export ---
class TestAdminMisc:
    def test_admin_stats(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_visitors", "present_visitors", "total_exhibitors",
                  "approved_exhibitors", "exhibitor_limit", "remaining_slots"]:
            assert k in d

    def test_export_visitors_csv(self, s, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/visitors/export.csv",
                         headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        text = r.content.decode("utf-8")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        assert rows[0][0] == "Full Name"

    def test_export_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/admin/visitors/export.csv")
        assert r.status_code == 401

    def test_admin_list_visitors(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/visitors", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- File Upload ---
class TestUpload:
    # Minimal valid PNG (1x1)
    _PNG = bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489"
        "0000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
    )

    def test_upload_png_returns_api_uploads_path(self):
        files = {"file": ("test.png", self._PNG, "image/png")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 200
        url = r.json()["url"]
        # New requirement: URL must start with /api/uploads/ (NOT /uploads/)
        assert url.startswith("/api/uploads/"), f"upload url must start with /api/uploads/, got {url}"
        # Verify accessible via /api/uploads/<file>
        full = f"{BASE_URL}{url}"
        r2 = requests.get(full)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_legacy_uploads_path_still_works(self):
        # Upload then test backward compat /uploads/<file> path
        files = {"file": ("test2.png", self._PNG, "image/png")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 200
        new_url = r.json()["url"]
        filename = new_url.rsplit("/", 1)[-1]
        legacy = f"{BASE_URL}/uploads/{filename}"
        r2 = requests.get(legacy)
        assert r2.status_code == 200, f"legacy /uploads/ path broken: {r2.status_code}"
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_upload_unsupported(self):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 400


# --- Social Post / Photo Framing tests (seeded exhibitor 9876543210) ---
SEEDED_EX_MOBILE = "9876543210"
SEEDED_EX_PASSWORD = "Demo@123"


@pytest.fixture(scope="session")
def seeded_ex_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"mobile": SEEDED_EX_MOBILE, "password": SEEDED_EX_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Seeded exhibitor login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def seeded_ex_headers(seeded_ex_token):
    return {"Authorization": f"Bearer {seeded_ex_token}", "Content-Type": "application/json"}


class TestSocialPost:
    def test_seeded_exhibitor_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"mobile": SEEDED_EX_MOBILE, "password": SEEDED_EX_PASSWORD})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == "exhibitor"
        assert isinstance(d["token"], str) and len(d["token"]) > 20

    def test_auth_me_has_photo_framing_fields(self, s, seeded_ex_headers):
        r = s.get(f"{BASE_URL}/api/auth/me", headers=seeded_ex_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "exhibitor"
        u = body["user"]
        # New fields should be present (defaults: 0.5, 0.35, 1.0)
        for k in ("photo_focus_x", "photo_focus_y", "photo_zoom"):
            assert k in u, f"missing field {k} in /auth/me response: {list(u.keys())}"
        # Sanity check ranges
        assert 0.0 <= float(u["photo_focus_x"]) <= 1.0
        assert 0.0 <= float(u["photo_focus_y"]) <= 1.0
        assert 1.0 <= float(u["photo_zoom"]) <= 3.0
        # Profile photo URL should be /api/uploads/...
        if u.get("profile_photo_url"):
            assert u["profile_photo_url"].startswith("/api/uploads/") or u["profile_photo_url"].startswith("/uploads/")

    def test_put_exhibitors_me_persists_framing(self, s, seeded_ex_headers):
        # Set distinct values
        payload = {"photo_focus_x": 0.25, "photo_focus_y": 0.6, "photo_zoom": 1.7}
        r = s.put(f"{BASE_URL}/api/exhibitors/me", headers=seeded_ex_headers, json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert abs(float(body["photo_focus_x"]) - 0.25) < 1e-6
        assert abs(float(body["photo_focus_y"]) - 0.6) < 1e-6
        assert abs(float(body["photo_zoom"]) - 1.7) < 1e-6
        # Verify via /auth/me
        me = s.get(f"{BASE_URL}/api/auth/me", headers=seeded_ex_headers).json()["user"]
        assert abs(float(me["photo_focus_x"]) - 0.25) < 1e-6
        assert abs(float(me["photo_focus_y"]) - 0.6) < 1e-6
        assert abs(float(me["photo_zoom"]) - 1.7) < 1e-6

    def test_social_post_png_3000x3000(self, s, seeded_ex_headers):
        r = s.get(f"{BASE_URL}/api/exhibitors/me/social-post.png", headers=seeded_ex_headers)
        assert r.status_code == 200, r.text
        assert r.headers["content-type"].startswith("image/png")
        size = len(r.content)
        print(f"social-post.png size: {size} bytes")
        assert size > 50_000, f"social-post.png too small: {size} bytes"
        assert r.content[:4] == b"\x89PNG"
        # Validate dimensions
        from PIL import Image
        img = Image.open(io.BytesIO(r.content))
        assert img.size == (3000, 3000), f"expected 3000x3000, got {img.size}"

    def test_framing_changes_produce_different_png(self, s, seeded_ex_headers):
        import hashlib
        # Set framing A
        s.put(f"{BASE_URL}/api/exhibitors/me", headers=seeded_ex_headers,
              json={"photo_focus_x": 0.1, "photo_focus_y": 0.1, "photo_zoom": 1.0})
        a = s.get(f"{BASE_URL}/api/exhibitors/me/social-post.png", headers=seeded_ex_headers).content
        # Set framing B (very different)
        s.put(f"{BASE_URL}/api/exhibitors/me", headers=seeded_ex_headers,
              json={"photo_focus_x": 0.9, "photo_focus_y": 0.9, "photo_zoom": 2.5})
        b = s.get(f"{BASE_URL}/api/exhibitors/me/social-post.png", headers=seeded_ex_headers).content
        ha = hashlib.sha256(a).hexdigest()
        hb = hashlib.sha256(b).hexdigest()
        print(f"hash A: {ha[:16]}  hash B: {hb[:16]}  sizes: {len(a)} vs {len(b)}")
        assert ha != hb, "social-post.png is identical for different framing — framing not applied"

    def test_profile_photo_url_resolvable(self, s, seeded_ex_headers):
        me = s.get(f"{BASE_URL}/api/auth/me", headers=seeded_ex_headers).json()["user"]
        url = me.get("profile_photo_url")
        if not url:
            pytest.skip("no profile_photo_url on seeded exhibitor")
        # Try /api/uploads/ form
        r = s.get(f"{BASE_URL}{url}")
        assert r.status_code == 200, f"profile photo not accessible at {url}: {r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/")


# --- Digital Visiting Card (slug, /c/, vcard, qr, PDF upload, new exhibitor fields) ---
SEEDED_SLUG = "4omid3"
DEMO_EX_MOBILE = "9876543210"
DEMO_EX_PASSWORD = "Demo@123"


@pytest.fixture(scope="session")
def demo_ex_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"mobile": DEMO_EX_MOBILE, "password": DEMO_EX_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Demo exhibitor login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_ex_headers(demo_ex_token):
    return {"Authorization": f"Bearer {demo_ex_token}", "Content-Type": "application/json"}


class TestDigitalCard:
    def test_demo_exhibitor_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"mobile": DEMO_EX_MOBILE, "password": DEMO_EX_PASSWORD})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "exhibitor"

    def test_admin_exhibitors_all_have_slug(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/exhibitors", headers=admin_headers)
        assert r.status_code == 200, r.text
        exs = r.json()
        assert isinstance(exs, list) and len(exs) > 0
        missing = [e.get("id") for e in exs if not e.get("slug")]
        assert not missing, f"Exhibitors missing slug: {missing}"
        # Slugs are unique
        slugs = [e["slug"] for e in exs]
        assert len(slugs) == len(set(slugs)), "Slugs are not unique"
        # Slug format: 6 chars from alphabet abcdefghijkmnopqrstuvwxyz23456789 (avoids 0/1/l)
        import re
        for sl in slugs:
            assert re.match(r"^[a-z2-9]{6}$", sl), f"Bad slug format: {sl}"
            assert "l" not in sl and "0" not in sl and "1" not in sl, f"Slug uses banned chars: {sl}"

    def test_admin_exhibitors_returns_new_fields(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/exhibitors", headers=admin_headers)
        assert r.status_code == 200
        # find seeded one
        seeded = next((e for e in r.json() if e.get("slug") == SEEDED_SLUG), None)
        assert seeded, f"No exhibitor with slug={SEEDED_SLUG}"
        for f in ("catalogue_pdf_url", "catalogue_gallery", "testimonials",
                  "custom_links", "shop_address", "shop_maps_link"):
            assert f in seeded, f"admin exhibitors missing field {f}"

    def test_public_card_payload(self, s):
        r = s.get(f"{BASE_URL}/api/c/{SEEDED_SLUG}")
        assert r.status_code == 200, r.text
        d = r.json()
        # Required public fields
        for f in ("business_name", "member_name", "profile_photo_url",
                  "description", "products_services", "catalogue_pdf_url",
                  "catalogue_gallery", "testimonials", "custom_links",
                  "shop_address", "shop_maps_link", "instagram", "facebook",
                  "linkedin", "website", "slug"):
            assert f in d, f"public card missing field: {f}"
        assert d["slug"] == SEEDED_SLUG
        # sensitive fields must not leak
        assert "password_hash" not in d
        assert "_id" not in d

    def test_public_card_unknown_slug_404(self, s):
        r = s.get(f"{BASE_URL}/api/c/zzzzzz")
        assert r.status_code == 404

    def test_public_card_hidden_exhibitor_404(self, s, admin_headers):
        # find any exhibitor, hide them, expect 404, then unhide
        exs = s.get(f"{BASE_URL}/api/admin/exhibitors", headers=admin_headers).json()
        # pick one that's NOT the demo seeded
        target = next((e for e in exs if e.get("slug") and e.get("slug") != SEEDED_SLUG), None)
        if not target:
            pytest.skip("No alternate exhibitor to test hidden state")
        slug = target["slug"]
        ex_id = target["id"]
        original_hidden = target.get("hidden", False)
        # Hide
        s.put(f"{BASE_URL}/api/admin/exhibitors/{ex_id}", headers=admin_headers,
              json={"hidden": True, "approved": target.get("approved", True),
                    "featured": target.get("featured", False)})
        try:
            r = s.get(f"{BASE_URL}/api/c/{slug}")
            assert r.status_code == 404, f"Hidden exhibitor should 404, got {r.status_code}"
        finally:
            # Restore
            s.put(f"{BASE_URL}/api/admin/exhibitors/{ex_id}", headers=admin_headers,
                  json={"hidden": original_hidden, "approved": target.get("approved", True),
                        "featured": target.get("featured", False)})

    def test_vcard_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/c/{SEEDED_SLUG}/vcard")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/vcard")
        body = r.text
        assert "BEGIN:VCARD" in body
        assert "VERSION:3.0" in body
        assert "FN:" in body
        assert "TEL" in body
        assert "EMAIL" in body
        assert "END:VCARD" in body
        cd = r.headers.get("content-disposition", "")
        assert ".vcf" in cd
        # business name slug in filename
        assert "rapid" in cd.lower() or "express" in cd.lower()

    def test_qr_png(self, s):
        r = s.get(f"{BASE_URL}/api/c/{SEEDED_SLUG}/qr.png")
        assert r.status_code == 200
        assert r.headers["content-type"] == "image/png"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
        assert len(r.content) > 500

    def test_upload_pdf_accepted(self, s):
        # Minimal valid PDF header
        pdf = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
        files = {"file": ("doc.pdf", pdf, "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.endswith(".pdf"), f"Expected .pdf URL, got {url}"
        # And reachable
        r2 = requests.get(f"{BASE_URL}{url}")
        assert r2.status_code == 200

    def test_upload_rejects_doc(self, s):
        files = {"file": ("bad.doc", b"\xd0\xcf\x11\xe0fake", "application/msword")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 400

    def test_upload_rejects_exe(self, s):
        files = {"file": ("bad.exe", b"MZfake", "application/x-msdownload")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 400

    def test_put_exhibitors_me_new_fields(self, s, demo_ex_headers):
        marker = uuid.uuid4().hex[:8]
        payload = {
            "catalogue_pdf_url": f"/api/uploads/test-{marker}.pdf",
            "catalogue_gallery": [
                {"name": f"TEST_Item_{marker}", "description": "desc1", "image_url": "/api/uploads/x.jpg"}
            ],
            "testimonials": [
                {"name": f"TEST_Person_{marker}", "role": "Customer", "text": "Great!"}
            ],
            "custom_links": [
                {"label": f"TEST_Link_{marker}", "url": "https://example.com"}
            ],
            "shop_address": f"TEST shop addr {marker}",
            "shop_maps_link": f"https://maps.example.com/{marker}",
        }
        r = s.put(f"{BASE_URL}/api/exhibitors/me", headers=demo_ex_headers, json=payload)
        assert r.status_code == 200, r.text
        # verify via /auth/me
        me = s.get(f"{BASE_URL}/api/auth/me", headers=demo_ex_headers).json()["user"]
        assert me["catalogue_pdf_url"] == payload["catalogue_pdf_url"]
        assert me["shop_address"] == payload["shop_address"]
        assert me["shop_maps_link"] == payload["shop_maps_link"]
        # Lists – check element values present
        assert any(t["name"] == f"TEST_Person_{marker}" for t in me["testimonials"])
        assert any(l["label"] == f"TEST_Link_{marker}" for l in me["custom_links"])
        assert any(g["name"] == f"TEST_Item_{marker}" for g in me["catalogue_gallery"])
        # And reflected in public card
        pub = s.get(f"{BASE_URL}/api/c/{SEEDED_SLUG}").json()
        assert any(t["name"] == f"TEST_Person_{marker}" for t in pub["testimonials"])
        assert any(l["label"] == f"TEST_Link_{marker}" for l in pub["custom_links"])

    def test_new_registration_assigns_slug(self, s, admin_headers):
        new_mobile = "97" + str(uuid.uuid4().int)[:8]
        # Add to allowed
        s.post(f"{BASE_URL}/api/admin/members", headers=admin_headers,
               json={"mobile": new_mobile, "note": "TEST slug check"})
        r = s.post(f"{BASE_URL}/api/exhibitors/register", json={
            "mobile": new_mobile, "password": "Slug@123",
            "member_name": "TEST_SlugUser", "business_name": "TEST_SlugBiz",
            "category": "Retail", "whatsapp": new_mobile,
        })
        assert r.status_code == 200, r.text
        new_id = r.json()["user"]["id"]
        # check via admin
        exs = s.get(f"{BASE_URL}/api/admin/exhibitors", headers=admin_headers).json()
        new_ex = next((e for e in exs if e["id"] == new_id), None)
        assert new_ex and new_ex.get("slug"), f"new exhibitor missing slug: {new_ex}"
        import re
        assert re.match(r"^[a-z2-9]{6}$", new_ex["slug"])
        # cleanup
        s.delete(f"{BASE_URL}/api/admin/exhibitors/{new_id}", headers=admin_headers)


# --- Cleanup ---
@pytest.fixture(scope="session", autouse=True)
def cleanup(request, s):
    yield
    try:
        # login as admin to clean
        login = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if login.status_code != 200:
            return
        tok = login.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        # Delete the test exhibitor
        if TestExhibitors.ex_id:
            requests.delete(f"{BASE_URL}/api/admin/exhibitors/{TestExhibitors.ex_id}", headers=h)
        # Delete test visitors by mobile (find IDs)
        vs = requests.get(f"{BASE_URL}/api/admin/visitors", headers=h).json()
        for v in vs:
            if v.get("full_name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/visitors/{v['id']}", headers=h)
        # Delete test allowed members
        mems = requests.get(f"{BASE_URL}/api/admin/members", headers=h).json()
        for m in mems:
            if (m.get("note") or "").startswith(("TEST", "bulk")):
                requests.delete(f"{BASE_URL}/api/admin/members/{m['id']}", headers=h)
    except Exception as e:
        print(f"Cleanup error: {e}")
