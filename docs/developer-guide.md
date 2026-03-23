# Developer Guide — ParkingMS

This guide is intended for new developers joining the team. It covers the full system from local setup to production deployment, and provides a detailed walkthrough of every layer in the codebase so you can start contributing quickly and confidently.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Local Development Setup](#4-local-development-setup)
5. [Project Structure](#5-project-structure)
6. [Architecture Overview](#6-architecture-overview)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Database Layer](#8-database-layer)
9. [Caching & Rate Limiting](#9-caching--rate-limiting)
10. [API Reference](#10-api-reference)
11. [Frontend Pages & Components](#11-frontend-pages--components)
12. [Custom Hooks](#12-custom-hooks)
13. [The Raffle Engine](#13-the-raffle-engine)
14. [Input Sanitization & Validation](#14-input-sanitization--validation)
15. [CI/CD & Deployment](#15-cicd--deployment)
16. [Environment Variables](#16-environment-variables)
17. [Available Scripts](#17-available-scripts)
18. [Common Tasks](#18-common-tasks)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Project Overview

ParkingMS is a parking management system for residential buildings. It solves the problem of fairly allocating a limited number of parking spots among a larger group of residents through a **raffle-based system**. An administrator creates raffle rounds, residents register to participate, and the system randomly assigns spots using a fairness algorithm that prevents the same person from receiving the same spot in consecutive rounds.

The system supports **multiple buildings**, each operating independently with its own spots, residents, and raffle rounds.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (Pages Router) | Full-stack React framework with API Routes |
| Language | TypeScript | Type safety across frontend and backend |
| Frontend | React 18 + Tailwind CSS | Component-based UI with utility-first styling |
| Database | MongoDB (Mongoose ODM) | Document storage via MongoDB Atlas |
| Caching | Redis | Cache-aside pattern + rate limiting |
| Authentication | Auth0 (SPA SDK + JWT) | User authentication and token management |
| Deployment | Vercel | Serverless hosting with auto-deploy |
| CI/CD | GitHub Actions | Linting, type checking, testing, deployment |
| Version Control | Git + GitHub | Source control and collaboration |

---

## 3. Prerequisites

Before setting up the project, ensure you have:

- **Node.js 20.x** — The project uses an `.nvmrc` file. If you use nvm, run `nvm use` in the project root.
- **Docker** — Required for running MongoDB and Redis locally via Docker Compose.
- **Git** — For version control.
- **Auth0 account** — You will need access to the team's Auth0 tenant (or create your own for local development).
- **A code editor** — VS Code is recommended with the ESLint, Tailwind CSS IntelliSense, and Prettier extensions.

---

## 4. Local Development Setup

### Step 1: Clone and install

```bash
git clone https://github.com/Ricardo-Legorreta/parking-ms.git
cd parking-ms
nvm use          # Switches to Node 20 via .nvmrc
npm ci           # Clean install from lockfile
```

### Step 2: Start infrastructure

The project includes a `docker-compose.yml` that runs MongoDB 7 and Redis 7 locally:

```bash
docker compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

### Step 3: Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure:

```env
MONGODB_URI=mongodb://localhost:27017/parking
REDIS_URL=redis://localhost:6379

AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://parking-api.yourdomain.com

NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://parking-api.yourdomain.com

CRON_SECRET=any-random-string-for-local-dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ask the tech lead for the Auth0 credentials if you don't have them.

### Step 4: Run the dev server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Step 5: Verify everything works

1. Open `http://localhost:3000` — you should see the landing page with a login button.
2. Log in through Auth0 — you'll be redirected to the registration page on your first login.
3. Register with your building and unit info.
4. You should now see the resident dashboard.

---

## 5. Project Structure

```
parking-ms/
├── .github/workflows/          # CI/CD and cron job definitions
│   ├── ci.yml                  # Lint, type-check, test, build on push/PR
│   ├── pr-checks.yml           # Auto-labeling and PR title validation
│   ├── cron-expire-spots.yml   # Nightly job to expire old spot assignments
│   ├── deploy-staging.yml      # Auto-deploy to Vercel on push to develop
│   ├── deploy-production.yml   # Auto-deploy to Vercel on push to main
│   └── security.yml            # Security scanning
│
├── src/
│   ├── components/             # Reusable React components
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── RaffleManager.tsx   # Create and execute raffle rounds
│   │   │   └── StatsGrid.tsx       # Dashboard statistics cards
│   │   ├── layout/
│   │   │   └── Navbar.tsx          # Navigation bar with role-based links
│   │   ├── resident/           # Resident-facing components
│   │   │   ├── EligibilityBanner.tsx  # Raffle registration CTA
│   │   │   ├── HistoryTable.tsx       # Past assignments table
│   │   │   └── SpotCard.tsx           # Current spot display
│   │   └── ui/                 # Generic UI primitives
│   │       ├── Alert.tsx           # Success/error/warning/info alerts
│   │       ├── Badge.tsx           # Colored status badges
│   │       └── StatCard.tsx        # Metric card with icon
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useApi.ts           # Authenticated HTTP client
│   │   ├── useMe.ts            # Current user profile + spot + raffle status
│   │   └── useAdminStats.ts    # Admin dashboard statistics with refetch
│   │
│   ├── lib/                    # Backend utilities and core logic
│   │   ├── auth.ts             # JWT verification + middleware chain
│   │   ├── db.ts               # MongoDB connection (singleton + pooling)
│   │   ├── raffle.ts           # Fisher-Yates raffle algorithm
│   │   ├── rateLimit.ts        # Redis-backed IP rate limiter
│   │   ├── redis.ts            # Redis client, caching helpers, TTL config
│   │   └── sanitize.ts         # DOMPurify + regex input validation
│   │
│   ├── models/                 # Mongoose schemas and models
│   │   ├── Resident.ts         # User profiles
│   │   ├── ParkingSpot.ts      # Spots with current assignment
│   │   ├── RaffleRound.ts      # Raffle rounds with participants and results
│   │   └── ParkingHistory.ts   # Historical record of all assignments
│   │
│   ├── pages/                  # Next.js pages (file-based routing)
│   │   ├── _app.tsx            # App wrapper with Auth0Provider + layout
│   │   ├── index.tsx           # Landing page (login CTA)
│   │   ├── register.tsx        # New resident registration form
│   │   ├── dashboard.tsx       # Resident dashboard
│   │   ├── history.tsx         # Personal assignment history
│   │   ├── logout.tsx          # Logout handler
│   │   ├── admin/
│   │   │   ├── index.tsx       # Admin overview + raffle management
│   │   │   └── spots.tsx       # Spot creation and inventory
│   │   └── api/                # Backend API routes
│   │       ├── residents/      # Resident CRUD
│   │       ├── spots/          # Spot management
│   │       ├── raffle/         # Raffle lifecycle
│   │       ├── history/        # History queries
│   │       └── admin/          # Admin-only operations
│   │
│   ├── styles/
│   │   └── globals.css         # Tailwind directives + base styles
│   │
│   └── types/
│       └── index.ts            # Shared TypeScript interfaces and types
│
├── docker-compose.yml          # Local MongoDB + Redis
├── .env.example                # Environment variable template
├── .nvmrc                      # Node.js version (20)
├── next.config.js              # Security headers, CSP, strict mode
├── tailwind.config.js          # Custom theme (Inter font, border-radius)
├── eslint.config.mjs           # ESLint 9 flat config with TypeScript + React
├── tsconfig.json               # TypeScript compiler options (strict, ES2020)
└── package.json                # Dependencies and scripts
```

---

## 6. Architecture Overview

The project follows a **layered monolithic architecture**. The frontend and backend live in a single Next.js project, with clear boundaries between layers:

```
┌─────────────────────────────────────┐
│          Client Layer               │
│   React Pages + Components + Hooks  │
│         (Tailwind CSS)              │
├─────────────────────────────────────┤
│          API Layer                  │
│     Next.js API Routes (REST)       │
├─────────────────────────────────────┤
│        Middleware Layer              │
│  withToken → withAuth → withAdmin   │
│         Rate Limiter                │
├─────────────────────────────────────┤
│      Business Logic Layer           │
│  Raffle Engine, Input Sanitizer     │
├─────────────────────────────────────┤
│          Data Layer                 │
│   MongoDB (Mongoose) + Redis Cache  │
└─────────────────────────────────────┘
```

### Request lifecycle

1. The user interacts with a React page.
2. A custom hook (e.g., `useApi`) sends an authenticated HTTP request with a Bearer token.
3. The API route handler is wrapped in middleware that verifies the JWT, looks up the resident in MongoDB, and checks the role.
4. The handler checks Redis for a cached response. On a miss, it queries MongoDB, caches the result, and returns it.
5. Write operations invalidate the relevant cache keys after persisting to MongoDB.

---

## 7. Authentication & Authorization

### How it works

The system uses **Auth0's SPA SDK** on the frontend and **JWT verification** on the backend. There is no server-side session — every request is stateless and authenticated via the `Authorization: Bearer <token>` header.

### Token flow

1. User clicks "Log In" on the landing page.
2. Auth0's SDK redirects to the Auth0 Universal Login page.
3. After successful authentication, Auth0 returns an **access token** (JWT) to the browser.
4. The `useApi` hook attaches this token to every API request.
5. The backend verifies the token's RS256 signature against Auth0's JWKS endpoint, checks the audience and issuer, and extracts custom claims.

### Custom claims

An Auth0 **Login Action** injects the user's email and name into the access token as namespaced claims:

- `https://parking-ms/email`
- `https://parking-ms/name`

This allows lightweight endpoints (like registration) to identify the user without a database lookup.

### Middleware chain

The project uses three composable middleware functions, each building on the previous one:

| Middleware | What it does | Returns on failure | Used by |
|---|---|---|---|
| `withToken` | Verifies JWT, extracts auth0Id/email/name | 401 Unauthorized | Registration |
| `withAuth` | Runs `withToken` + looks up resident in DB + checks `isActive` | 403 Forbidden | Spots, raffle, history |
| `withAdmin` | Runs `withAuth` + checks `role === 'admin'` | 403 Forbidden | Stats, execute raffle, manage spots |

These are located in `src/lib/auth.ts`. To protect an API route, wrap the handler:

```typescript
// Example: admin-only endpoint
export default withAdmin(async (req, res) => {
  // req.user.role is guaranteed to be 'admin' here
  // req.user.residentId and req.user.auth0Id are available
});
```

### Roles

There are two roles:

- **resident** (default) — Can view their dashboard, join raffles, and view their history.
- **admin** — Can do everything a resident can, plus manage spots, create raffle rounds, execute draws, and view cross-building statistics.

Roles are stored in the `Resident` document in MongoDB. To promote a user to admin, update their record directly in the database:

```javascript
db.residents.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } });
```

---

## 8. Database Layer

### Connection management

The MongoDB connection is managed as a **global singleton** in `src/lib/db.ts`. The connection promise is cached at the module level to prevent multiple serverless function invocations from creating redundant connections.

Configuration:
- **Connection pool**: 10 concurrent connections (`maxPoolSize: 10`)
- **Server selection timeout**: 5 seconds
- **Socket timeout**: 45 seconds

### Collections and models

The project uses 4 Mongoose models, all defined in `src/models/`:

#### Resident

Represents a registered user in the system.

| Field | Type | Notes |
|---|---|---|
| `auth0Id` | String | Unique, links to Auth0 account |
| `name` | String | Max 100 characters |
| `email` | String | Unique, stored lowercase |
| `unit` | String | Apartment/unit number |
| `building` | String | Building identifier |
| `vehicle` | Object (optional) | `{ plate, model, color }` — optional for admin users |
| `totalWins` | Number | Lifetime raffle wins counter |
| `role` | Enum | `'resident'` or `'admin'` |
| `isActive` | Boolean | Soft-delete flag |
| `registeredAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last modification timestamp |

**Indexes**: `{ building, isActive }`, `{ building, unit }` (unique)

#### ParkingSpot

Represents a physical parking spot that can be assigned to a resident.

| Field | Type | Notes |
|---|---|---|
| `spotNumber` | String | Identifier within the building |
| `building` | String | Building identifier |
| `floor` | Number | Floor level |
| `type` | Enum | `'standard'`, `'accessible'`, or `'ev'` |
| `isActive` | Boolean | Whether the spot is available for raffles |
| `currentAssignment` | Object or null | `{ residentId, assignedAt, expiresAt }` |

**Indexes**: `{ building, isActive }`, `{ building, spotNumber }` (unique), `{ currentAssignment.residentId }`, `{ currentAssignment.expiresAt }`

#### RaffleRound

Represents one raffle cycle for a building.

| Field | Type | Notes |
|---|---|---|
| `roundNumber` | Number | Auto-incremented per building |
| `building` | String | Building identifier |
| `startDate` | Date | Registration opens |
| `endDate` | Date | Registration closes / spots expire |
| `status` | Enum | `'active'` → `'completed'` |
| `participants` | Array | `[{ residentId, registeredAt }]` |
| `results` | Array | `[{ residentId, spotId, assignedAt }]` — populated after execution |
| `executedAt` | Date | When the draw was run |
| `executedBy` | ObjectId | Admin who ran the draw |

**Indexes**: `{ building, roundNumber }` (unique), `{ building, status }`, `{ startDate, endDate }`

#### ParkingHistory

Immutable record of every spot assignment, used for auditing and the blackout algorithm.

| Field | Type | Notes |
|---|---|---|
| `residentId` | ObjectId | Resident who received the spot |
| `spotId` | ObjectId | The assigned spot |
| `roundNumber` | Number | Which raffle round |
| `building` | String | Building identifier |
| `assignedAt` | Date | When assigned |
| `expiresAt` | Date | When the assignment expires |
| `status` | Enum | `'active'`, `'expired'`, or `'released'` |

**Indexes**: `{ residentId, roundNumber: -1 }`, `{ building, roundNumber: -1 }`, `{ status, expiresAt }`, `{ residentId, status }`

### Query patterns used throughout the codebase

- **`.lean()`** — Used on all read-only queries. Returns plain JavaScript objects instead of Mongoose documents, skipping change tracking and reducing memory usage.
- **`.select()`** — Excludes unnecessary fields (e.g., `-__v`) to minimize data transfer.
- **`.skip()` / `.limit()`** — Pagination with a maximum page size of 100 records.
- **`.populate()`** — Joins related documents (e.g., populating resident names on history records) with field projection.

---

## 9. Caching & Rate Limiting

### Redis caching

All read-heavy endpoints implement a **cache-aside** pattern using Redis. The flow is:

1. Check Redis for a cached value by key.
2. If found (cache hit), return it immediately.
3. If not found (cache miss), query MongoDB, store the result in Redis with a TTL, and return it.

Cache keys are scoped by building and entity to avoid cross-building interference:

| Key pattern | TTL | Description |
|---|---|---|
| `spots:{building}` | 60s | All active spots for a building |
| `spot:{id}` | 60s | Individual spot details |
| `resident:{id}` | 120s | Individual resident profile |
| `residents:{building}` | 120s | Resident list for a building |
| `raffle:current:{building}` | 30s | Active raffle round |
| `raffle:history:{building}:{page}` | 30s | Paginated raffle history |
| `history:{residentId}` | 300s | Personal parking history |
| `admin:stats:{building}` | 30s | Admin dashboard statistics |

**Cache invalidation** happens explicitly on write operations. For example, after executing a raffle, the handler deletes spot caches for the building and invalidates all history caches using pattern-based deletion (`cacheInvalidatePattern('history:*')`).

All caching functions are in `src/lib/redis.ts`.

### Rate limiting

A Redis-backed rate limiter protects API endpoints from abuse. It uses a sliding-window counter keyed by `rl:{endpoint}:{clientIP}`.

| Endpoint type | Limit | Window |
|---|---|---|
| General (residents, spots) | 30 requests | 60 seconds |
| Sensitive (raffle registration) | 5 requests | 60 seconds |

When exceeded, the API returns HTTP 429 with `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. The rate limiter is defined in `src/lib/rateLimit.ts` and **fails open** — if Redis is unavailable, requests are allowed through rather than blocked.

---

## 10. API Reference

All API routes are in `src/pages/api/`. Below is the complete list.

### Residents

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/residents` | Admin | List residents with pagination, building filter, and search |
| `POST` | `/api/residents` | Token | Register a new resident (self-registration) |
| `GET` | `/api/residents/me` | Auth | Get current user's profile, spot, raffle status, and eligibility |
| `GET` | `/api/residents/:id` | Auth | Get a resident by ID (self or admin) |
| `PATCH` | `/api/residents/:id` | Auth | Update vehicle information (self or admin) |
| `DELETE` | `/api/residents/:id` | Admin | Soft-delete a resident (sets `isActive: false`) |

### Spots

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/spots` | Auth | List active spots for a building (residents auto-scoped to their building) |
| `POST` | `/api/spots` | Admin | Create a new parking spot |

### Raffle

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/raffle` | Auth | Get the active raffle for a building |
| `POST` | `/api/raffle` | Admin | Create a new raffle round |
| `POST` | `/api/raffle/register` | Auth | Register the current user for the active raffle |
| `POST` | `/api/raffle/execute` | Admin | Execute the draw and assign spots |

### History

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/history` | Auth | Get the current user's assignment history |
| `GET` | `/api/history/building` | Admin | Get paginated history for a building |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Dashboard statistics (residents, spots, rounds, top winners) |
| `POST` | `/api/admin/expire-spots` | CRON_SECRET | Expire old assignments (called by GitHub Actions cron) |

---

## 11. Frontend Pages & Components

### Pages

| Route | File | Description |
|---|---|---|
| `/` | `pages/index.tsx` | Landing page with login button. Redirects authenticated users to dashboard. |
| `/register` | `pages/register.tsx` | Registration form for new residents. Collects name, unit, building, and vehicle details. Validates all fields before submission. |
| `/dashboard` | `pages/dashboard.tsx` | Resident home page showing current spot assignment, profile info, vehicle details, and raffle eligibility. Admin users see the same layout without the spot section. |
| `/history` | `pages/history.tsx` | Table of all past spot assignments with round number, spot details, dates, and status badges. |
| `/admin` | `pages/admin/index.tsx` | Admin overview with statistics grid, active raffle management (create/execute), and top winners list. Data is filterable by building. |
| `/admin/spots` | `pages/admin/spots.tsx` | Spot inventory management. Create new spots and view all spots for a building with type and status indicators. |
| `/logout` | `pages/logout.tsx` | Handles the Auth0 logout flow and redirects to the landing page. |

### Auth guards on pages

Every protected page follows the same pattern: check authentication via `useAuth0`, check role via `useMe`, and redirect if unauthorized:

```typescript
const { isAuthenticated, isLoading: authLoading } = useAuth0();
const { data: me, loading: meLoading } = useMe();
const router = useRouter();

useEffect(() => {
  if (!authLoading && !isAuthenticated) router.push('/');
  if (!meLoading && me && me.resident.role !== 'admin') router.push('/dashboard');
}, [authLoading, isAuthenticated, meLoading, me]);
```

### Component library

Components are organized by domain:

**Admin components** (`src/components/admin/`):
- **StatsGrid** — Renders four `StatCard` components showing residents count, spot occupancy, completed rounds, and active raffle status.
- **RaffleManager** — Full raffle lifecycle UI: date picker to create rounds, execute button with confirmation, and status display. Calls `onRefresh` after mutations to update the parent.

**Resident components** (`src/components/resident/`):
- **SpotCard** — Displays the assigned spot (number, floor, type, expiry) or a "No spot assigned" state.
- **EligibilityBanner** — Contextual CTA: shows "Join Raffle" if a raffle is open, "Already registered" if the user joined, or "No active raffle" otherwise.
- **HistoryTable** — Sortable table of past assignments with colored status badges.

**UI primitives** (`src/components/ui/`):
- **Alert** — Dismissible notification with `success`, `error`, `warning`, and `info` variants.
- **Badge** — Inline colored label with variants: `success`, `warning`, `danger`, `info`, `neutral`.
- **StatCard** — Metric display card with label, value, optional subtitle, icon, and color accent.

---

## 12. Custom Hooks

All hooks are in `src/hooks/` and handle authenticated data fetching.

### useApi

The foundational hook that all other hooks use. It retrieves an Auth0 access token and provides typed HTTP methods:

```typescript
const api = useApi();
const response = await api.get<SpotList>('/spots?building=A');
const response = await api.post<Raffle>('/raffle', { building: 'A', startDate, endDate });
const response = await api.patch<Resident>('/residents/123', { vehicle: { plate: 'ABC123' } });
const response = await api.del<void>('/residents/123');
```

Each method automatically attaches the `Authorization: Bearer <token>` header and throws on HTTP errors.

### useMe

Fetches the current user's complete context in a single call to `/api/residents/me`:

```typescript
const { data, loading, error, refetch } = useMe();

// data shape:
{
  resident: IResident;            // Full profile
  currentSpot: IParkingSpot | null;  // Currently assigned spot
  raffle: IRaffleRound | null;       // Active raffle for user's building
  eligibility: {
    isRegisteredInRaffle: boolean;   // Whether user has joined the active raffle
  };
}
```

### useAdminStats

Fetches admin dashboard statistics for a specific building, with a `refetch` function for manual refresh after mutations:

```typescript
const { stats, loading, error, refetch } = useAdminStats('Building A');

// stats shape:
{
  residents: { total: number };
  spots: { total: number; occupied: number; available: number };
  rounds: { total: number };
  activeRaffle: { _id, roundNumber, status, participants, startDate, endDate } | null;
  topWinners: { _id, name, unit, totalWins }[];
}
```

---

## 13. The Raffle Engine

The raffle algorithm is the core business logic of the system, located in `src/lib/raffle.ts`. It is a **pure function** — it takes input data and returns assignments without side effects, making it easy to test.

### Algorithm: Fisher-Yates shuffle with spot-level blackout

1. **Shuffle participants** using the Fisher-Yates algorithm (unbiased random permutation).
2. **Iterate** through the shuffled list. For each participant:
   - Get the list of spots they held in the **last 3 rounds** (the blackout list).
   - Find the first available spot that is **not** in their blackout list.
   - If a non-blocked spot is found, assign it and mark it as taken.
   - If all remaining spots are in the blackout list, the participant goes unassigned.
3. **Return** the list of assignments and the list of unassigned participants.

### Why spot-level blackout?

The blackout mechanism prevents a resident from being assigned the **same physical spot** in consecutive rounds. This encourages fairness and rotation. The constant `SPOT_BLACKOUT_ROUNDS = 3` means a resident cannot receive a spot they held in any of the previous 3 rounds.

Note: a resident **can** win in consecutive rounds — they just won't get the same spot.

### Atomicity

When the admin executes a draw, the `POST /api/raffle/execute` handler wraps all database writes in a **MongoDB transaction** (`mongoose.startSession()` + `startTransaction()` + `commitTransaction()`). This ensures that either all updates succeed (spot assignments, history records, resident win counters, raffle status) or none of them do. If any step fails, the transaction is aborted and the database remains unchanged.

---

## 14. Input Sanitization & Validation

All user input is sanitized before processing. The sanitization layer is in `src/lib/sanitize.ts`.

| Function | Purpose |
|---|---|
| `sanitizeString(value)` | Trims whitespace and strips HTML/script tags via DOMPurify |
| `sanitizeObject(obj)` | Recursively sanitizes all string values in an object |
| `isValidPlate(plate)` | Validates license plate format: `/^[A-Z0-9-]{4,10}$/i` |
| `isValidObjectId(id)` | Validates MongoDB ObjectId format: `/^[a-f\d]{24}$/i` |

Sanitization is applied to request bodies in all POST and PATCH handlers before any database operation. This prevents XSS payloads from being stored in the database and protects against NoSQL injection through malformed ObjectIds.

---

## 15. CI/CD & Deployment

### GitHub Actions workflows

| Workflow | File | Trigger | What it does |
|---|---|---|---|
| CI | `ci.yml` | Push/PR to `main` or `develop` | Runs lint, type-check, tests, and build |
| PR Checks | `pr-checks.yml` | PR opened/updated | Auto-labels by size, validates PR title format |
| Expire Spots | `cron-expire-spots.yml` | Daily at 02:00 UTC | Calls `POST /api/admin/expire-spots` with CRON_SECRET |
| Deploy Staging | `deploy-staging.yml` | Push to `develop` | Builds and deploys to Vercel (preview) |
| Deploy Production | `deploy-production.yml` | Push to `main` | Builds, deploys to Vercel (production), creates GitHub release |
| Security | `security.yml` | Configured in file | Security vulnerability scanning |

### Branching strategy

- **`develop`** — Active development branch. Pushes trigger staging deployment.
- **`main`** — Production branch. Pushes trigger production deployment and auto-create a GitHub release with an incremented version tag.

### Deployment flow

```
Developer pushes to develop
        ↓
GitHub Actions CI runs (lint + type-check + test + build)
        ↓
deploy-staging.yml deploys to Vercel (staging)
        ↓
Developer creates PR: develop → main
        ↓
PR is reviewed and merged
        ↓
deploy-production.yml deploys to Vercel (production)
        ↓
GitHub Release auto-created (v{run_number})
```

### Required GitHub secrets

For the workflows to run, these secrets must be configured in the GitHub repository settings:

| Secret | Used by |
|---|---|
| `VERCEL_TOKEN` | Staging + Production deploy |
| `VERCEL_ORG_ID` | Staging + Production deploy |
| `VERCEL_PROJECT_ID` | Staging + Production deploy |
| `STAGING_AUTH0_DOMAIN` | Staging build |
| `STAGING_AUTH0_CLIENT_ID` | Staging build |
| `STAGING_AUTH0_AUDIENCE` | Staging build |
| `PROD_AUTH0_DOMAIN` | Production build |
| `PROD_AUTH0_CLIENT_ID` | Production build |
| `PROD_AUTH0_AUDIENCE` | Production build |
| `APP_BASE_URL` | Cron job (expire spots) |
| `CRON_SECRET` | Cron job (expire spots) |

---

## 16. Environment Variables

### Server-side (API routes only)

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/parking` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` or `rediss://...` for TLS |
| `AUTH0_DOMAIN` | Auth0 tenant domain (JWT verification) | `your-tenant.us.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API identifier (JWT audience check) | `https://parking-api.yourdomain.com` |
| `CRON_SECRET` | Shared secret for the expire-spots cron job | 32-byte hex string |

### Client-side (browser-accessible)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 domain for the SPA SDK | `your-tenant.us.auth0.com` |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 SPA application client ID | `abc123def456` |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | Auth0 API audience for token requests | `https://parking-api.yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

Variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side bundle at build time. **Never** put secrets in `NEXT_PUBLIC_` variables.

---

## 17. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reloading |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build locally |
| `npm run lint` | Run ESLint across all files in `src/` |
| `npm run type-check` | Run the TypeScript compiler without emitting (type validation only) |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run seed` | Run the database seed script |

---

## 18. Common Tasks

### Adding a new API endpoint

1. Create a file in `src/pages/api/` following the existing naming convention.
2. Choose the appropriate middleware: `withToken`, `withAuth`, or `withAdmin`.
3. Add rate limiting if the endpoint accepts user input.
4. Sanitize all input with `sanitizeString` or `sanitizeObject`.
5. Use `.lean()` on read queries and add Redis caching if the data is read-heavy.
6. Invalidate relevant cache keys on write operations.

```typescript
import { withAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export default withAuth(async (req, res) => {
  const limited = await rateLimit({ windowSeconds: 60, maxRequests: 30 })(req, res);
  if (limited) return;

  // Your logic here
});
```

### Adding a new page

1. Create a file in `src/pages/`.
2. Add the Auth0 + role guard pattern (see section 11).
3. Use `useMe` for resident context or `useAdminStats` for admin pages.
4. Add the route to the `navLinks` or `adminLinks` array in `Navbar.tsx` (remove `disabled: true` if it was a placeholder).

### Adding a new model

1. Create a new file in `src/models/`.
2. Define the schema with proper types, defaults, and indexes.
3. Add the corresponding TypeScript interface in `src/types/index.ts`.
4. Add compound indexes for your most common query patterns.

### Creating an admin user

Connect to MongoDB and run:

```javascript
db.residents.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
);
```

The user must have already registered through the application before being promoted.

---

## 19. Troubleshooting

### "Cannot connect to MongoDB Atlas"

Your IP is not in the Atlas Network Access allowlist. Go to MongoDB Atlas → Network Access → Add your IP (or `0.0.0.0/0` for serverless environments like Vercel).

### Auth0 login redirects to a blank page

Check that `NEXT_PUBLIC_AUTH0_DOMAIN` and `NEXT_PUBLIC_AUTH0_CLIENT_ID` are set correctly in `.env.local`. Also verify that `http://localhost:3000` is listed as an Allowed Callback URL and Allowed Logout URL in your Auth0 application settings.

### Redis connection refused locally

Make sure Docker is running and the containers are up:

```bash
docker compose ps
docker compose up -d
```

### "Rate limit exceeded" during development

The rate limiter uses your IP. If you're hitting limits during testing, temporarily increase the limits in the endpoint or flush your Redis rate limit keys:

```bash
docker compose exec redis redis-cli KEYS "rl:*" | xargs docker compose exec redis redis-cli DEL
```

### ESLint not recognizing TypeScript

The project uses ESLint 9 with the flat config format (`eslint.config.mjs`). Make sure your editor's ESLint extension supports flat config (VS Code ESLint extension v3+).

### Build fails with peer dependency errors

Ensure you're on Node.js 20 (`node -v`). If using nvm, run `nvm use` in the project root. Then delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```
