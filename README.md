# ParkingMS

A parking spot management system that fairly assigns parking spots to building residents through a raffle-based rotation every three months.

## How It Works

1. **Residents register** with their unit, building, and vehicle info
2. **Admin creates a raffle round** with start and end dates
3. **Residents join** the active raffle
4. **Admin executes the draw** — spots are randomly assigned using a Fisher-Yates shuffle
5. **Spot-level blackout** prevents a resident from getting the same spot they had in the last 3 rounds
6. **Nightly cron job** automatically expires assignments past their end date

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (Pages Router), React 18, Tailwind CSS |
| Authentication | Auth0 SPA SDK + JWT access tokens (verified via `jose`) |
| Backend | Next.js API Routes with middleware (`withToken`, `withAuth`, `withAdmin`) |
| Database | MongoDB (Mongoose ODM) |
| Caching | Redis (TTL-based, with rate limiting) |
| Deployment | Vercel + GitHub Actions (cron) |

## Project Structure

```
src/
  components/
    admin/          # RaffleManager, StatsGrid
    layout/         # Navbar
    resident/       # EligibilityBanner, SpotCard, HistoryTable
    ui/             # Alert, Badge, StatCard
  hooks/            # useApi, useMe, useAdminStats
  lib/              # auth, db, raffle engine, redis, rateLimit, sanitize
  models/           # Resident, ParkingSpot, RaffleRound, ParkingHistory
  pages/
    admin/          # Overview, Spots management
    api/
      admin/        # Stats, expire-spots (cron)
      history/      # Resident & building history
      raffle/       # Create, register, execute
      residents/    # Registration, profile, CRUD
      spots/        # List & create spots
  types/            # Shared TypeScript interfaces
```

## API Endpoints

### Residents
- `GET /api/residents` — List residents (admin only)
- `POST /api/residents` — Register new resident (JWT only)
- `GET /api/residents/me` — Current resident profile, spot & raffle status
- `PATCH /api/residents/:id` — Update resident (admin only)

### Spots
- `GET /api/spots?building=A` — List spots for a building
- `POST /api/spots` — Create a parking spot (admin only)

### Raffle
- `GET /api/raffle?building=A` — Get active raffle for a building
- `POST /api/raffle` — Create a new raffle round (admin only)
- `POST /api/raffle/register` — Join the active raffle
- `POST /api/raffle/execute` — Run the draw (admin only, atomic transaction)

### Admin
- `GET /api/admin/stats?building=A` — Dashboard statistics
- `POST /api/admin/expire-spots` — Expire old assignments (cron job)

## Getting Started

### Prerequisites

- Node.js >= 20
- MongoDB (Atlas or local)
- Redis
- Auth0 account with SPA application + custom API

### Setup

```bash
# Clone the repo
git clone https://github.com/Ricardo-Legorreta/parking-ms.git
cd parking-ms

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env.local

# Start Redis (via Docker)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run the dev server
npm run dev
```

### Environment Variables

See [.env.example](.env.example) for all required variables. Key ones:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `AUTH0_DOMAIN` | Auth0 tenant domain (server-side JWT verification) |
| `AUTH0_AUDIENCE` | Auth0 API identifier |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 domain (client-side) |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 SPA application client ID |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | Auth0 API audience (client-side) |
| `CRON_SECRET` | Secret for authenticating the expire-spots cron job |

### Auth0 Configuration

1. Create an **SPA Application** in Auth0
2. Create a **Custom API** with identifier matching `AUTH0_AUDIENCE`
3. Authorize the SPA app to access the API (API > Application Access)
4. Create a **Login Action** to add custom claims:
   ```js
   exports.onExecutePostLogin = async (event, api) => {
     const ns = 'https://parking-ms/';
     api.accessToken.setCustomClaim(ns + 'email', event.user.email);
     api.accessToken.setCustomClaim(ns + 'name', event.user.name);
   };
   ```
5. Add `http://localhost:3000` to Allowed Callback URLs, Logout URLs, and Web Origins

### Creating an Admin User

Admin users are created directly in MongoDB:

```js
db.residents.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run seed` | Seed database with sample data |

## License

MIT
