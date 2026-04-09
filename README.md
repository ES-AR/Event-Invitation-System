# Event Invitation System (Quota-Controlled)

A MERN-based, quota-controlled event invitation and attendance platform with main/overflow allocation, admin approvals, attendee photo capture, automated approval emails, CSV export, and basic security controls (rate limits, duplicate prevention).

## Features
- Main + overflow slot control with automatic classification.
- Admin approval and removal with bulk selection actions.
- Event expiry toggle (datetime) and manual close/open controls.
- Automated approval emails send event specifics the moment a guest is approved.
- Approval emails now include a Google Maps link plus a personalized PDF invite pass with the attendee's photo.
- Registration requires a photo upload so staff can visually verify attendees.
- Export approved attendees to CSV (Excel friendly).
- Security: rate limiting on registration plus duplicate email prevention.

## Documentation
For detailed system architecture and design documentation, please refer to the `docs/` directory:
- [User Requirements](docs/user_requirements.md)
- [Non-Functional Requirements](docs/non_functional_requirements.md)
- [Use Case Diagram](docs/use_case_diagram.md)
- [Use Case Descriptions](docs/use_case_descriptions.md)
- [Behavioral Diagrams](docs/behavioral_diagrams.md)
- [Structural Diagrams](docs/structural_diagrams.md)
- [Database Design](docs/database_design.md)

## Running Locally
1) **Backend**
```bash
cd server
cp .env.example .env   # update MONGO_URI, FRONTEND_URL, DEFAULT_EVENT_SLUG, ADMIN_JWT_SECRET
npm install
npm run dev            # or npm start
```

2) **Frontend**
```bash
cd client
cp .env.example .env   # ensure VITE_API_BASE_URL + VITE_DEFAULT_EVENT_SLUG are set
npm install
npm run dev            # starts Vite on 5173
```
Set `VITE_API_URL` in `client/.env` if your API is not on `http://localhost:4000/api`.

## Key API Routes
- `GET /api/event` – event details, quotas, stats, open/closed.
- `POST /api/event` – update quotas, overflow, close/open, or expiry datetime.
- `POST /api/register` – public registration with automatic main/overflow classification.
- `GET /api/registrations` – list registrations (optionally filter by status). **Organizer token required**.
- `POST /api/registrations/:id/approve` – approve an attendee and trigger event details email. **Organizer token required**.
- `POST /api/registrations/bulk/approve` – approve multiple attendees and send emails. **Organizer token required**.
- `POST /api/registrations/bulk/delete` – remove multiple selected attendees. **Organizer token required**.
- `DELETE /api/registrations/:id` – soft delete. **Organizer token required**.
- `GET /api/export?status=approved` – CSV export (Excel friendly). **Organizer token required**.

## Security Controls
- Rate limits on public registration endpoints.
- Duplicate prevention via unique email constraint.
- Photo upload stored on disk and linked to each registration.
- Organizer-only access enforced on management routes via JWT bearer tokens.

## Notes
- Default Mongo database: `event_invitation` (configure via `.env`). If MongoDB is unavailable, the API automatically falls back to an ephemeral in-memory instance for demos.
- Default frontend URL used in invite links: `http://localhost:5173`.
- Each organizer has a private account secured with JWT tokens. Configure `ALLOWED_ORIGINS` to whitelist frontends in production.
- Uploads are stored under `server/uploads` (git-ignored).
- Approval emails are delivered through Gmail via Nodemailer; set `GMAIL_USER`, `GMAIL_PASS` (App Password), and `EMAIL_FROM` in `server/.env`.
