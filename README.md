# 🌿 GreenThumb — Gardening Store

Full-stack web app: **Node.js + Express** backend, **React + Vite** frontend,
**PostgreSQL** database (the schema you already created).

---

## Project Structure

```
greenthumb/
├── backend/          Express API server
└── frontend/         React + Vite app
```

---

## Setup

### 1. Database
Make sure PostgreSQL is running and you've already executed `gardening_store.sql`.

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Create your .env file from the example
copy .env.example .env        # Windows
# cp .env.example .env        # Mac / Linux

# Edit .env and set your real DB password + a JWT secret:
#   DB_PASSWORD=your_postgres_password
#   JWT_SECRET=any_long_random_string_here

# Start the dev server (auto-restarts on file changes)
npm run dev
# → Running at http://localhost:3001
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → Running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login, get JWT |
| GET | /api/auth/me | ✓ | Current user profile |
| GET | /api/products | — | List products (filters: category, tag, search, sort) |
| GET | /api/products/categories | — | Category tree |
| GET | /api/products/:slug | — | Product detail + variants + reviews |
| GET | /api/users/addresses | ✓ | List saved addresses |
| POST | /api/users/addresses | ✓ | Add address |
| PUT | /api/users/addresses/:id | ✓ | Update address |
| DELETE | /api/users/addresses/:id | ✓ | Delete address |
| POST | /api/orders | ✓ | Place order (checkout) |
| GET | /api/orders | ✓ | Order history |
| GET | /api/orders/:id | ✓ | Order detail |
| GET | /api/health | — | Server health check |

✓ = requires `Authorization: Bearer <token>` header

---

## How Authentication Works

1. User registers or logs in → backend returns a **JWT token**
2. Frontend stores the token in `localStorage`
3. Every subsequent request includes `Authorization: Bearer <token>`
4. The `requireAuth` middleware on the backend verifies the token
5. Token expires after 7 days (configurable via `JWT_EXPIRES_IN` in `.env`)

---

## How the Cart Works

The cart is stored **entirely on the frontend** in `localStorage`.
No database calls are made until the user places an order.
At checkout, the backend re-validates all prices and stock levels
from the database — the frontend prices are never trusted for the final total.

---

## Demo Accounts

After running the SQL seed file, update the password hashes so you can log in.
The easiest way is to register a new account via the site's registration page.

Or update directly in pgAdmin:
```sql
-- Set password to 'password123' for the demo customer
UPDATE users
SET password_hash = '$2b$12$...'   -- generate with bcrypt
WHERE email = 'carlos@email.pt';
```

To generate a hash in Node.js:
```js
import bcrypt from 'bcryptjs';
console.log(await bcrypt.hash('password123', 12));
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite 5 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 14+ |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| DB Client | node-postgres (pg) |
