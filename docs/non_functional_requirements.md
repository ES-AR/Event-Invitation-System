# Non-Functional Requirements

## 1. Technology Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js with Express.js
- **Database:** MongoDB (with `mongoose` ORM). Supports in-memory fallback for development/demo.
- **Authentication:** JWT (JSON Web Tokens) for Organizer authentication.

## 2. Security
- **Authentication:** Organizers must authenticate using email and password. Passwords shall be hashed using `bcryptjs` before storage.
- **Access Control:** Admin routes shall be protected by JWT middleware (`requireAdmin`). Check-in routes shall be protected by token verification (`requireCheckIn`).
- **Rate Limiting:** Public registration endpoints shall be rate-limited using `express-rate-limit` to prevent abuse and DoS attacks.
- **HTTP Security:** The application shall use `helmet` to set secure HTTP headers.
- **CORS:** Cross-Origin Resource Sharing (CORS) shall be configured to allow requests only from trusted origins (e.g., the frontend application).
- **Data Privacy:** Attendee photos and personal data shall be stored securely and accessible only to authorized administrators.

## 3. Performance & Scalability
- **Database Indexing:** Frequently queried fields (e.g., email, event slug, ticket code) shall be indexed in MongoDB to optimize lookup performance.
- **Pagination:** List endpoints (e.g., list attendees) shall support pagination to handle large datasets efficiently.
- **Asynchronous Operations:** Email sending and file processing shall be handled asynchronously to avoid blocking the main event loop.

## 4. Reliability & Availability
- **Data Integrity:** The system shall enforce unique constraints on email addresses per event to prevent duplicate registrations.
- **Error Handling:** The API shall provide meaningful error messages and HTTP status codes (400, 404, 500) for client-side debugging.
- **Graceful Degradation:** If the primary MongoDB instance is unavailable, the system should ideally handle it gracefully (current implementation falls back to in-memory for dev/demo).

## 5. Usability
- **Responsive Design:** The public registration page shall be responsive and usable on mobile, tablet, and desktop devices.
- **Feedback:** Users shall receive immediate feedback on their actions (e.g., success messages, validation errors).
- **Export Compatibility:** CSV exports shall be formatted to be compatible with Microsoft Excel and other spreadsheet software.
