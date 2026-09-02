# BcnCor — Backend API

Node.js + Express + PostgreSQL REST API for the BcnCor marketing workflow automation tool.

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

| Variable        | Description                              |
|-----------------|------------------------------------------|
| `PORT`          | Port the server listens on (default 3001)|
| `DATABASE_URL`  | PostgreSQL connection string             |
| `JWT_SECRET`    | Secret key for signing JWT tokens        |
| `JWT_EXPIRES_IN`| Token expiry (e.g. `7d`, `24h`)          |
| `NODE_ENV`      | `development` or `production`            |

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE bcncor;"
```

### 4. Run migrations

```bash
psql $DATABASE_URL -f database/migrations/001_create_users.sql
psql $DATABASE_URL -f database/migrations/002_create_campaigns.sql
psql $DATABASE_URL -f database/migrations/003_create_workflows.sql
```

Or apply the full schema at once:

```bash
psql $DATABASE_URL -f database/schema.sql
```

### 5. Seed development data (optional)

```bash
psql $DATABASE_URL -f database/seeds/dev_users.sql
```

### 6. Start the server

```bash
npm run dev    # development (nodemon, auto-restart)
npm start      # production
```

Server runs on `http://localhost:3001`.

---

## API Routes

| Method | Path                  | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | /api/auth/login       | Login, returns JWT       | No   |
| POST   | /api/auth/logout      | Logout                   | Yes  |
| GET    | /api/auth/me          | Get current user         | Yes  |
| GET    | /api/users            | List all users           | Yes  |
| POST   | /api/users            | Create user              | Yes  |
| GET    | /api/users/:id        | Get user by ID           | Yes  |
| PUT    | /api/users/:id        | Update user              | Yes  |
| DELETE | /api/users/:id        | Delete user              | Yes  |
| GET    | /api/campaigns        | List campaigns           | Yes  |
| POST   | /api/campaigns        | Create campaign          | Yes  |
| GET    | /api/campaigns/:id    | Get campaign by ID       | Yes  |
| PUT    | /api/campaigns/:id    | Update campaign          | Yes  |
| DELETE | /api/campaigns/:id    | Delete campaign          | Yes  |
| GET    | /api/workflows        | List workflows           | Yes  |
| POST   | /api/workflows        | Create workflow          | Yes  |
| GET    | /api/workflows/:id    | Get workflow by ID       | Yes  |
| PUT    | /api/workflows/:id    | Update workflow          | Yes  |
| DELETE | /api/workflows/:id    | Delete workflow          | Yes  |

---

## Project Structure

```
src/
├── server.js          Entry point
├── app.js             Express setup, middleware, routes
├── config/
│   ├── db.js          PostgreSQL connection pool
│   └── env.js         Environment variable loader
├── routes/            Route definitions
├── controllers/       Request handlers
├── middleware/        Auth, error handling, validation
├── models/            Raw SQL query functions
└── services/          Auth (JWT/bcrypt) and email utilities
database/
├── schema.sql         Full schema
├── migrations/        Incremental SQL migrations
└── seeds/             Development seed data
```
