# Chomnuoy System

This repository contains:
- `frontend` (ReactJS + Vite)
- `backend` (Laravel 10 REST API + MySQL)

## Requirements
- Node.js 18+ and npm
- PHP 8.1+ (tested with PHP 8.2)
- Composer 2+
- MySQL 8+

## 1) Install Frontend Libraries

```bash
cd frontend
npm install
```

Run frontend:

```bash
npm run dev
```

## 2) Install Backend Libraries

```bash
cd backend
composer install
npm install
```

## 3) Configure Backend Environment

```bash
cd backend
copy .env.example .env
php artisan key:generate
```

Set MySQL credentials in `backend/.env`:
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

Run migrations:

```bash
php artisan migrate
```

Run backend:

```bash
php artisan serve
```

## Notes for GitHub Push

Dependency folders are ignored in root `.gitignore`:
- `frontend/node_modules`
- `backend/vendor`
- `backend/node_modules`

So you can push source code without large library files.
