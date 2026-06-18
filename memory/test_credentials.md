# Rama Bazaar 1.0 — Test Credentials

## Admin
- Email: `admin@admin.com`
- Password: `Admin@123`
- Role: `admin`
- Login endpoint: `POST /api/auth/login` with `{ "email": "admin@admin.com", "password": "Admin@123" }`

## Exhibitor (seeded eligible test member numbers)
After admin adds a test allowed number, register at `POST /api/exhibitors/register`:
- Sample allowed test mobile: `9876543210`
- Sample exhibitor password: `Demo@123`
- Login endpoint: `POST /api/auth/login` with `{ "mobile": "9876543210", "password": "Demo@123" }`
- Test exhibitor public card slug: `4omid3` → `/c/4omid3`

## Gate Scanner (door staff — scanner-only access, no admin powers)
- Login URL: `/gate/login`
- Gate code (seeded in admin settings): `GATE-2026`
- Login endpoint: `POST /api/gate/login` with `{ "code": "GATE-2026" }` → returns 30-day JWT with role `gate`
- Allowed endpoints: `POST /api/attendance/scan`, `POST /api/attendance/manual`, `GET /api/attendance/stats` (everything else returns 403)
- Admin can change the code anytime in Admin → Settings → Gate Scanner Access

## Public endpoints (no auth)
- `GET /api/settings`
- `POST /api/visitors/register`
- `POST /api/visitors/retrieve`
- `GET /api/roster`
- `GET /api/roster/categories`
- `GET /api/roster/sponsors`
- `GET /api/c/{slug}` (digital visiting card payload)
- `GET /api/c/{slug}/vcard` (vCard download)
- `GET /api/c/{slug}/qr.png` (QR for printing)

## Admin endpoints (Bearer admin token)
- `GET /api/admin/stats`
- `GET /api/admin/visitors`
- `GET /api/admin/exhibitors`
- `POST /api/admin/members` / `POST /api/admin/members/bulk`
- `POST/PUT/DELETE /api/admin/sponsor-ads`
- `PUT /api/admin/settings`
- `POST /api/attendance/scan` / `POST /api/attendance/manual`

## Token usage
All authenticated requests use header: `Authorization: Bearer <token>`
