# SmartDesk

SmartDesk is a role-based IT service desk with secure ticket workflows, threaded conversations, attachments, in-app and email notifications, monthly analytics, and branded PDF reporting.

## Included features

- Admin, Manager, Employee, and IT Support Agent access rules
- Ticket creation, editing, assignment, claiming, return-to-review, closure, activity history, and recoverable archiving
- Secure private attachments (10 MB limit and an allow-listed set of file formats)
- In-app notification center with unread state and 30-second badge refresh
- Gmail SMTP notifications for ticket creation, assignment, updates, comments, returns, and closure
- Password recovery with hashed six-digit codes, ten-minute expiry, one-time use, attempt limits, throttling, and token revocation
- One report per calendar month, including KPIs, daily volume, status/category/priority/workload diagrams, key management points, and a complete ticket register
- Browser-generated, professionally branded PDF reports with diagrams and page numbers
- Server-side ticket search, filtering, ordering, and pagination
- Admin-managed categories and priorities; workflow statuses remain system controlled
- Responsive branded login, sidebar, favicon, session-expiry handling, and 404 page

## Project layout

- `smartdesk-laravel/` — Laravel 12 JSON API
- `smartdesk-frontend/` — React 19 and Vite client
- `smartdesk-frontend/public/smartdesk-logo.svg` — primary logo asset

The logo is intentionally shown beside the SmartDesk name on the login page and sidebar, and is also used as the browser favicon. Those are the three primary brand placements for this application.

## Local setup

Requirements: PHP 8.2+, Composer, Node.js 20+, npm, and the PHP SQLite extensions (or configure MySQL in the backend environment file).

```bash
cd smartdesk-laravel
cp .env.example .env
touch database/database.sqlite
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

In a second terminal:

```bash
cd smartdesk-frontend
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`. Before running the seeders, set a unique password of at least 12 characters in `SMARTDESK_ADMIN_PASSWORD`. The seed administrator is `admin@smartdesk.local`. `SMARTDESK_DEMO_PASSWORD` is optional; when blank, demo accounts receive a random, non-recoverable password.

## Gmail configuration

1. Enable two-step verification on the Google account that will send SmartDesk email.
2. Create a Google App Password for Mail.
3. In `smartdesk-laravel/.env`, set `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_FROM_ADDRESS`. Paste the App Password without sharing or committing it.
4. Keep `MAIL_HOST=smtp.gmail.com` and `MAIL_PORT=587`.
5. Clear cached Laravel configuration after a change: `php artisan config:clear`.

The system catches and logs mail transport failures so a Gmail outage does not roll back a valid ticket operation. Password reset responses intentionally do not reveal whether an email belongs to an account.

## Verification

```bash
cd smartdesk-frontend
npm run lint
npm run build

cd ../smartdesk-laravel
php artisan test
```

CI performs these checks on every push and pull request. This repository contains source changes only; no site has been deployed or published.

If files near 10 MB are rejected before Laravel receives them, increase PHP's `upload_max_filesize` and `post_max_size` to values above 10 MB, then restart the PHP server.
