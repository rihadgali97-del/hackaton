# FixNearMe

FixNearMe tracks neighborhood problems from resident submission through staff resolution. The repository contains a React/Vite/Tailwind client and a Node.js/Express/MySQL API. A super admin creates staff accounts and assigns reports to them.

## Requirements

- Node.js 18 or newer
- MySQL 8.0 or newer

## Run locally

1. Create an empty MySQL database named `fixnearme` (or set `DB_NAME` to an existing database).
2. Copy `.env.example` to `.env` and set the database credentials and a random `JWT_SECRET` of at least 32 characters.
3. Install API dependencies in the repository root with `npm install` and frontend dependencies with `npm --prefix client install`.
4. Create the schema with `npm run migrate`.
5. Create the first super admin in a private terminal:

   ```powershell
   $env:SUPER_ADMIN_NAME = "FixNearMe Admin"
   $env:SUPER_ADMIN_EMAIL = "admin@example.com"
   $env:SUPER_ADMIN_PASSWORD = "a-long-unique-password"
   npm run create:super-admin
   Remove-Item Env:SUPER_ADMIN_NAME, Env:SUPER_ADMIN_EMAIL, Env:SUPER_ADMIN_PASSWORD
   ```

   The bootstrap script refuses to create another super admin after one exists. Never commit the environment values.
6. Run the API with `npm run dev` (port 5000 by default).
7. In a second terminal, run the frontend with `npm run client:dev` and open the Vite URL shown in the terminal (normally `http://localhost:5173`). Set `client/.env` from `client/.env.example` if the API uses a different URL.
8. Create a production frontend bundle with `npm run client:build`.
9. Run backend unit tests with `npm test`.

## Roles

- **Resident:** register, sign in, submit and confirm reports.
- **Staff:** see reports assigned to them and change their assigned report to `in_progress` or `resolved`, with an optional update note.
- **Admin:** review all reports and change report status, priority, and notes.
- **Super admin:** all admin capabilities, create/deactivate staff accounts, and assign or unassign staff on reports.

Registration always creates a resident. The only initial super admin is created through the one-time local bootstrap script. Tokens are signed JWTs; each request reloads the active role from MySQL so deactivated accounts lose access immediately.

## API

All endpoints use `/api`. Protected routes accept `Authorization: Bearer <token>`. JSON errors use `{ "error": { "code", "message", "details?" } }`; successful responses use `{ "data": ... }`.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | API and database health |
| `POST /auth/register` | Public | Create resident account (`name`, `email`, `password`) |
| `POST /auth/login` | Public | Get a signed token |
| `GET /auth/me` | Signed in | Current account |
| `GET /reports` | Public | Search (`search`), filters, `page`, `limit` |
| `GET /reports/:id` | Public | Report details |
| `POST /reports` | Public or signed in | Submit report; anonymous submissions are rate limited |
| `POST /reports/check-duplicates` | Public | Rule-based suggestions; does not merge or alter reports |
| `POST /reports/:id/confirm` | Signed in | Confirm a report once per account |
| `GET /reports/:id/updates` | Public | Chronological status, priority, assignment, and note history |
| `GET /dashboard/stats` | Public | Counts by status/category, urgent/unassigned totals, recent reports |
| `GET /admin/reports` | Admin, super admin | All reports for administration |
| `PATCH /admin/reports/:id` | Admin, super admin | Update status/priority/note; assignment fields are super-admin only |
| `GET /reports/staff/assigned` | Staff | Current staff member's assigned work |
| `PATCH /reports/staff/reports/:id` | Assigned staff | Set `in_progress` or `resolved`, add note |
| `GET /admin/staff` | Super admin | Staff list and workload |
| `POST /admin/staff` | Super admin | Create staff (`name`, `email`, temporary `password`, minimum 12 chars) |
| `PATCH /admin/staff/:id` | Super admin | Activate/deactivate staff (`is_active`) |

Report categories: `road_damage`, `streetlight`, `water_leak`, `drainage`, `waste`, `sidewalk`, `other`. Statuses: `reported`, `under_review`, `in_progress`, `resolved`, `rejected`. Priorities: `low`, `medium`, `high`, `urgent`.

To assign or clear a staff member, a super admin sends `PATCH /api/admin/reports/:id` with `{ "assigned_to": 42 }` or `{ "assigned_to": null }`. Assignment requires an active account whose role is `staff`. Every assignment/status/priority change is recorded in `report_updates` in the same transaction as the report update.

## Query examples

```http
POST /api/reports
Content-Type: application/json

{
  "title": "Broken streetlight near the clinic",
  "description": "The light has been out for three nights and the road is very dark.",
  "category": "streetlight",
  "neighborhood": "Bole",
  "landmark": "Bole clinic entrance"
}
```

```http
PATCH /api/admin/reports/17
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{ "assigned_to": 42, "status": "under_review", "priority": "high", "note": "Assigned to the electrical repairs team." }
```

## Data and implementation notes

- SQL migrations are versioned in `src/db/migrations`; report filters use parameterized SQL and deterministic date/id ordering.
- Duplicate suggestions use category, neighborhood, landmark, text overlap, and distance when coordinates exist. `DUPLICATE_THRESHOLD` controls a 0–100 score; results are suggestions only.
- Reports and assignment/status history persist in MySQL. Each report can be confirmed once per signed-in account using a composite database key.
- Passwords use bcrypt; authentication and report creation/duplicate checks have focused rate limits, and CORS origins are set with comma-separated `FRONTEND_ORIGIN` values.
- Staff initial passwords are created by the super admin. Password change and reset flows are not included in this first version.
- No secrets are included in health responses. Add production TLS, secret rotation, operational backups, and a durable image storage provider before deploying publicly.

## Validation checklist

- `npm test` covers report-field validation, coordinate bounds and normalization, duplicate scoring, scoring reasons, and no mutation of stored reports.
- With MySQL available, verify health, register/login, create a report, query it after restarting the API, search and filter with pagination, view history, confirm twice (the second response should be 409), and verify duplicate checks only suggest.
- Sign in as the bootstrapped super admin, create a staff user, assign a report, sign in as that staff user, and confirm the assignment appears in their queue. Try the same admin endpoints as a resident and verify the API returns 403.
- In the client, submit valid and invalid forms, use duplicate suggestions, search/filter/paginate, inspect report history, reject with and without a reason, and retry after stopping the API. Failed requests should show an error and keep the form values.
- Resize to mobile and desktop widths; verify menus, forms, report cards, tables, keyboard focus, and status feedback remain usable.

MySQL integration checks require a configured local database and are not part of the isolated unit tests.
