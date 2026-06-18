# Rama Bazaar 1.0 — PRD

## Original Problem Statement
Build a premium mobile-first PWA for "Rama Bazaar 1.0", an exclusive business exhibition and networking event by LVB Rama. Luxury minimal corporate aesthetic (warm off-white #f8f7f4, charcoal #1f1f27, gold #b2873d). Mobile-first, installable, fast, sticky bottom nav, premium animations.

## Brand & Design System
- Palette: `#f8f7f4` bg, `#1f1f27` ink, `#b2873d` gold, `#c39a52` gold2, `#d8bc84` border, `rgba(178,135,61,0.18)` divider
- Typography: Cormorant Garamond (serif display) + Inter (sans body), high letter-spacing eyebrows
- Components: shadcn UI + custom `card-luxe`, `btn-gold`, `btn-outline-gold`, `input-luxe`, `eyebrow`, `divider-thin`
- PWA: installable, offline app-shell via `/sw.js`, manifest.json with maskable icons

## Architecture
- Backend: FastAPI + Motor (MongoDB) + bcrypt + PyJWT + qrcode + Pillow + httpx (BizChat WhatsApp)
- Frontend: React 19, Tailwind, React Router, Sonner toasts, lucide-react, html5-qrcode for scanning
- Auth: JWT Bearer in localStorage (rama_token), roles: admin / exhibitor
- Storage: `/app/backend/uploads/` served at `/uploads/...`

## Implementation Status (Feb 2026)
✅ Public landing (hero, about, why, featured, sponsors, venue, FAQ, contact, footer)
✅ Title-sponsor popup (configurable via admin)
✅ Visitor registration + branded QR poster (~100KB PNG for WhatsApp shareability) + retrieve-by-mobile
✅ QR download/share + Web Share API for files
✅ Exhibitor allowed-member gating (manual add + CSV bulk upload) + first-come limit
✅ Exhibitor registration → JWT → dashboard (edit profile, upload logo/banner/photo, save, preview card)
✅ Digital roster with smart sponsor-ad interleave formula `interval = floor(total/(ads+1))`, never back-to-back
✅ Sponsor ads: popup / inline / footer / featured placements, image + video, impression + click tracking
✅ Attendance: QR scan (html5-qrcode) + manual entry; live stats dashboard (admin-only)
✅ Admin panel: stats, visitors (search + CSV export), exhibitors (approve/feature/hide/reset-pw/delete), allowed-members, sponsor-ads CRUD, event settings, attendance
✅ BizChat WhatsApp integration scaffolded: `/api/visitors/send-whatsapp/{qr_id}` (uses settings.bizchat_vendor_uid + token)
✅ Service worker + manifest + meta tags + OpenGraph
✅ Backend pytest suite: 66/68 tests passing (2 pre-existing known issues unrelated to current work)
✅ Social Post Generator (Pillow): luxury Playfair Display + Cinzel fonts, photo composited into curved silhouette, exhibitor-controlled framing (drag focus + zoom slider), download/share via WhatsApp — see `GET /api/exhibitors/me/social-post.png`
✅ Uploads served via `/api/uploads/*` (routes through Kubernetes ingress; legacy `/uploads/*` mount kept for in-container PIL access)
✅ Branded downloadable Visitor Pass PNG (1080×1900): hero Rama Bazaar lockup + visitor name in italic Playfair + LVB chapter pill + perforation + QR sub-card + date/venue rows + Tech Partner footer (Feb 2026 redesign)
✅ "Title Sponsor" → "Powered by" label change applied across landing, popup, visitor pass, visitor success and admin dropdown (Feb 2026)
✅ Removed "Why Visit" section from landing per request (Feb 2026)
✅ Public Digital Visiting Card per exhibitor at `/c/{6-char-slug}` (Feb 2026):
   - Backend: `GET /api/c/{slug}` (public payload), `GET /api/c/{slug}/vcard` (RFC vCard download), `GET /api/c/{slug}/qr.png` (printable QR for NFC/print)
   - Slug auto-generated on register; backfilled on startup for existing exhibitors; unique index
   - Hybrid premium design: full-bleed hero/banner overlay + circular avatar + serif name lockup + white luxury card body
   - Card includes: Save-to-Contacts vCard, Call/WhatsApp/Email/Map quick actions, About, Offerings, Products & Services gallery carousel, Catalogue PDF download, Testimonials carousel, Find-us with maps link, Social pills, Custom-link list
   - Exhibitor Dashboard `DigitalCardManager`: public link + QR preview + copy/download, PDF upload (max 20 MB), gallery image CRUD, testimonials CRUD, custom-links CRUD
   - `/upload` extended to accept PDF (image/* up to 8 MB, PDF up to 20 MB)
   - Public payload returns stable schema with safe defaults for unmigrated exhibitor docs

## Test Credentials
- Admin: `admin@admin.com` / `Admin@123`
- Demo Exhibitor: mobile `9876543210` / password `Demo@123` (slug `4omid3` → `/c/4omid3`)

✅ Exhibitor Print Badge ZIP (3.5"×5" PNG, 300 DPI) — redesigned for premium aesthetic with 5-zone layout: sponsor strip, hero Rama Bazaar lockup, exhibitor crest, name/role/business/phone block, footer endorsement (Feb 2026)
✅ Admin Bundle Export ZIP (logos/photos/Excel with digital-card links) via `openpyxl`
✅ Gate-keeper login (`/gate/login`) for door staff, restricted access
✅ Camera scanner upgraded (dynamic scan box, 12fps, image-upload fallback)

## Prioritized Backlog
### P1 (next)
- Refactor `server.py` (now ~1900 lines) into routers: auth, exhibitors, digital_card, visitors, sponsors, admin, social_post, image_renderer
- Admin can paste BizChat `vendor_uid` + `token` in Settings tab → real WhatsApp QR delivery on visitor registration
- Branded PWA icons (192/512) generated from logo

### P2 (later)
- Embed visitor's circular photo on the downloadable Visitor Pass (personalized keepsake)
- Cache `/api/c/{slug}/qr.png` for high-traffic NFC links
- Refresh-token flow (currently 7-day access token)
- Server-side image compression on upload (Pillow resize to max 1600px, WebP output)
- Rate-limit /sponsor-ads/{id}/impression to prevent counter spam (IP-based dedupe in Mongo)

## Key Files
- `/app/backend/server.py` — all routes
- `/app/backend/.env` — JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, BIZCHAT_*
- `/app/backend/tests/test_rama_bazaar.py` — pytest suite (48 tests)
- `/app/frontend/src/App.js` — router
- `/app/frontend/src/pages/Roster.jsx` — interleave logic
- `/app/frontend/src/components/ExhibitorCard.jsx` — luxury roster card
- `/app/frontend/public/manifest.json`, `/app/frontend/public/sw.js` — PWA
- `/app/memory/test_credentials.md`
