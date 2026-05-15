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
✅ Backend pytest suite: 48/48 tests passing

## Test Credentials
- Admin: `admin@admin.com` / `Admin@123`
- Exhibitor: created by registration after admin adds an allowed mobile

## Prioritized Backlog
### P1 (next)
- Admin can paste BizChat `vendor_uid` + `token` in Settings tab → real WhatsApp QR delivery on visitor registration
- Branded PWA icons (192/512) generated from logo
- Add member-mobile clarifying message during exhibitor verify (slots-remaining live counter)

### P2 (later)
- Refresh-token flow (currently 7-day access token)
- Server-side image compression on upload (Pillow resize to max 1600px, WebP output)
- Rate-limit /sponsor-ads/{id}/impression to prevent counter spam (IP-based dedupe in Mongo)
- Split server.py into routers (auth/visitors/exhibitors/admin/sponsors) — currently ~750 lines
- Refresh-token cookie + secure flag for prod

## Key Files
- `/app/backend/server.py` — all routes
- `/app/backend/.env` — JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, BIZCHAT_*
- `/app/backend/tests/test_rama_bazaar.py` — pytest suite (48 tests)
- `/app/frontend/src/App.js` — router
- `/app/frontend/src/pages/Roster.jsx` — interleave logic
- `/app/frontend/src/components/ExhibitorCard.jsx` — luxury roster card
- `/app/frontend/public/manifest.json`, `/app/frontend/public/sw.js` — PWA
- `/app/memory/test_credentials.md`
