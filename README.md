# ELMA Core

ELMA Core is a trilingual, RTL-aware tutoring-centre management ERP. It gives centre staff one place to manage students, classes, attendance, invoicing, payments, and teacher payroll.

## Highlights

- Student, teacher, subject, and class management
- Multi-class student enrollment and searchable, paginated operational tables
- Weekly timetable and session attendance
- Monthly invoice generation, partial payments, discounts, refunds, receipts, and cash-basis payroll
- Dashboard KPIs, revenue trends, unpaid-invoice alerts, centre settings, and database export
- English, French, and Arabic interfaces with RTL support and light/dark themes

## Architecture

The repository is intentionally split into a Laravel API and a React SPA.

| Area | Technology |
| --- | --- |
| API | Laravel 13, PHP 8.3, Sanctum, SQLite, DomPDF |
| Client | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Client data | TanStack Query, Zustand, React Hook Form, Zod |
| Quality | PHPUnit, Laravel Pint, Oxlint, GitHub Actions |

Financial amounts are represented as integer centimes in the application API and database. This avoids floating-point rounding errors in invoicing, payments, refunds, and payroll.

## Local development

### API

```bash
cd backend
cp .env.example .env
composer install
touch database/database.sqlite
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

The seeded development account is `test@example.com` with password `password`. Change it before any non-local use.

### Client

```bash
cd frontend
npm ci
npm run dev
```

Set `VITE_BACKEND_URL` when the API is not available at `http://localhost:8000`.

## Verification

```bash
cd backend
php artisan test
php vendor/bin/pint --test

cd ../frontend
npm run lint
npm run build
```

## Product roadmap

The completed core supports day-to-day academic and financial operations. The next product slice is dedicated classroom/session management with teacher and room conflict detection, followed by role-based access control, reporting, and end-to-end browser tests.

## Security notes

This is a single-centre application. Treat seeded credentials and SQLite backups as local-development only. Production deployment should use environment-specific secrets, role-based authorization, managed backups, HTTPS, and a server database appropriate to the expected workload.
