# Chomnuoy System

Monorepo for the Chomnuoy platform:

- `backend`: Laravel 12 REST API
- `frontend`: React JS + Vite client app

## Requirements

- Node.js 18+ and npm
- PHP 8.2+
- Composer 2+
- MySQL 8+

## Tech Stack

- Backend: Laravel `12.x`
- Frontend: React `18` + Vite `5`
- Database: MySQL 8

## Project Structure

```text
Chomnuoy-System/
├── backend/   # Laravel API
└── frontend/  # React app
```

## 1) Backend Setup (Laravel)

```bash
cd backend
composer install
```

Create environment file and app key:

```bash
copy .env.example .env
php artisan key:generate
```

Configure database in `backend/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

Run migrations:

```bash
php artisan migrate
```

Start backend server:

```bash
php artisan serve
```

Default URL: `http://127.0.0.1:8000`

## 2) Frontend Setup (React)

```bash
cd frontend
npm install
```

Create frontend env file (optional but recommended):

```bash
copy .env.example .env
```

`frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start frontend dev server:

```bash
npm run dev
```

## API Integration

- Frontend calls backend health endpoint: `GET /api/health`
- Example response:

```json
{
  "status": "ok",
  "service": "chomnuoy-backend"
}
```

The frontend hero section displays connection status (`loading`, `success`, `error`) based on this endpoint.

## Useful Commands

- Backend tests:

```bash
cd backend
php artisan test
```

- Frontend production build:

```bash
cd frontend
npm run build
```

## Notes

Dependency folders are ignored in root `.gitignore`:

- `frontend/node_modules`
- `backend/vendor`
- `backend/node_modules`

This keeps the repository lightweight and source-only.
