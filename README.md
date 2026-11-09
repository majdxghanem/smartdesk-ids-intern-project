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

## Gmail configuration and password-recovery email testing

SmartDesk sends password-reset codes through Laravel's mailer. **The UI and backend cannot deliver mail unless the backend machine is configured with valid SMTP credentials.** These values belong in the local `smartdesk-laravel/.env` file, which is excluded from Git; never commit an App Password.

1. Enable 2-Step Verification on the Gmail account used as the SmartDesk sender. If supported by your account, create a dedicated Google App Password from [Google App Passwords](https://myaccount.google.com/apppasswords). Gmail SMTP does **not** accept your normal Gmail password here.
2. In `smartdesk-laravel/.env`, configure:

   ```dotenv
   MAIL_MAILER=smtp
   MAIL_SCHEME=null
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your_sender@gmail.com
   MAIL_PASSWORD=your_16_character_app_password
   MAIL_FROM_ADDRESS=your_sender@gmail.com
   MAIL_FROM_NAME="SmartDesk"
   ```

   Set `MAIL_USERNAME` and `MAIL_FROM_ADDRESS` to the Gmail address sending mail. Replace `MAIL_PASSWORD` with the real App Password, removing display spaces. If that password contains dotenv-special characters, quote the value appropriately.
3. From the Laravel directory, refresh the configuration and run the non-sensitive SMTP test:

   ```bash
   php artisan optimize:clear
   php artisan smartdesk:mail-check an_address_you_control@example.com
   ```

4. Confirm that the test reaches your inbox (check spam/junk). SMTP acceptance alone is not proof of inbox delivery. Then test **Forgot password** with an active SmartDesk user whose registered email you can access.
5. If the test fails, inspect the console output and `smartdesk-laravel/storage/logs/laravel.log`. Common problems: missing or revoked App Password, incorrect Gmail sender address, blocked outgoing port 587, or stale Laravel configuration. Don't share the App Password or application logs containing secrets.

In local development, a failed password-reset email request now reports a configuration/delivery error rather than silently advancing to the code-entry screen. For production, the endpoint retains its generic response so callers cannot use password recovery to identify registered accounts. Failed sends do not invalidate an older usable reset code. Ticket-notification delivery failures remain logged separately to avoid rolling back valid ticket operations.

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
