# Event Invitation System (Quota-Controlled)

A MERN-based, quota-controlled event invitation and attendance platform with main/overflow allocation, admin approvals, personalized check-in links, photo verification, CSV export, and basic security controls (rate limits, CAPTCHA, duplicate prevention).

## Features
- Main + overflow slot control with automatic classification.
- Admin approval and removal with bulk selection actions.
- Event expiry toggle (datetime) and manual close/open controls.
- Personalized check-in links per approved guest (copyable).
- Check-in page requires invitation code, email match, and photo upload.
- Export approved attendees to CSV (Excel friendly).
- Security: simple math CAPTCHA, rate limiting on registration/check-in, duplicate email prevention.
- Responsive UI (white primary, black/gray secondary, light red for destructive actions).

## Tech Stack
- Frontend: React (Vite + TailwindCSS), React Router, Axios.
- Backend: Node.js, Express, MongoDB (via Mongoose with automatic in-memory fallback), Multer for photo capture, json2csv for export.

## Running Locally
1) **Backend**
```bash
cd server
cp .env.example .env   # update MONGO_URI, ADMIN_KEY, FRONTEND_URL
npm install
npm run dev            # or npm start
```

2) **Frontend**
```bash
cd client
cp .env.example .env   # ensure VITE_API_BASE_URL + VITE_ADMIN_KEY match backend
npm install
npm run dev            # starts Vite on 5173
```
Set `VITE_API_URL` in `client/.env` if your API is not on `http://localhost:4000/api`.

## Key API Routes
- `GET /api/event` – event details, quotas, stats, open/closed.
- `POST /api/event` – update quotas, overflow, close/open, or expiry datetime.
- `GET /api/captcha` – math challenge token + question (public).
- `POST /api/register` – public registration with captcha; auto main/overflow classification.
- `GET /api/registrations` – list registrations (optionally filter by status). **Admin key required**.
- `POST /api/registrations/:id/approve` – approve and generate check-in code. **Admin key required**.
- `POST /api/registrations/bulk` – approve/remove multiple selected attendees. **Admin key required**.
- `DELETE /api/registrations/:id` – soft delete. **Admin key required**.
- `GET /api/registrations/:id/checkin-link` – returns personalized check-in URL. **Admin key required**.
- `POST /api/checkin` – submit code + email + photo to verify attendance.
- `GET /api/export?status=approved` – CSV export (Excel friendly). **Admin key required**.

## Security Controls
- Rate limits on registration and check-in endpoints.
- CAPTCHA required for public registration.
- Duplicate prevention via unique email constraint.
- Photo upload stored on disk and linked to check-in.
- Admin-only access enforced on management routes and protected access to uploaded photos via `x-admin-key`.

## Notes
- Default Mongo database: `event_invitation` (configure via `.env`). If MongoDB is unavailable, the API automatically falls back to an ephemeral in-memory instance for demos.
- Default frontend URL for check-in links: `http://localhost:5173`.
- Set `ADMIN_KEY` (server) and `VITE_ADMIN_KEY` (client) to the same value for admin/dashboard access. Configure `ALLOWED_ORIGINS` to whitelist frontends in production.
- Uploads are stored under `server/uploads` (git-ignored).
