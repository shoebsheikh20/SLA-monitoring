# SLA Pulse — System Performance SLA Monitoring Tool

A full-stack, enterprise-grade SLA monitoring dashboard built with React, TypeScript, Node.js, Express, and Prisma ORM.

## Features

- 🔐 Secure admin authentication (JWT + bcrypt)
- 📊 Real-time performance metrics (latency, page load, uptime, error rate)
- 🚨 Automated incident & alert management
- 📈 Interactive Recharts visualizations
- 🛡️ SLA threshold monitoring with breach detection
- 📋 CSV report export
- 🌐 10 monitored services with realistic simulated data
- 🎨 Dark glassmorphism UI with iris/pink accents

## Requirements

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- No external database required for local development (uses SQLite)

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd sla-monitoring-tool
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example server/.env
```

Edit `server/.env` if needed (defaults work out of the box for local dev).

### 3. Database Setup

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Start Development Servers

```bash
# From the root directory — starts both frontend and backend
npm run dev
```

Or start them individually:

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

### 5. Open the App

Visit: **http://localhost:5173**

### Default Admin Credentials

```
Email:    admin@slapulse.io
Password: Admin@123
```

---

## Project Structure

```
sla-monitoring-tool/
├── client/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI, chart, layout components
│   │   ├── pages/             # Route-level pages
│   │   ├── layouts/           # Auth + Dashboard shell layouts
│   │   ├── hooks/             # useAuth, usePolling, useToast
│   │   ├── services/          # Axios API service layer
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx
│   └── package.json
│
├── server/                    # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/       # Route handler logic
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── services/          # Monitoring simulator
│   │   └── utils/             # JWT, validators
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Demo data seeder
│   └── package.json
│
├── .env.example               # Environment variable template
├── package.json               # Root workspace config
└── README.md
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Dashboard KPIs |
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service |
| GET | `/api/services/:id` | Service detail |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |
| GET | `/api/metrics` | Time-series metrics |
| GET | `/api/sla` | SLA status |
| PUT | `/api/sla/:serviceId` | Update SLA config |
| GET | `/api/incidents` | List incidents |
| POST | `/api/incidents` | Create incident |
| PUT | `/api/incidents/:id` | Update incident |
| GET | `/api/alerts` | List alerts |
| PUT | `/api/alerts/:id/read` | Mark alert read |
| GET | `/api/reports` | Report summary |
| GET | `/api/reports/export` | Export CSV |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3001` | Backend port |
| `DATABASE_URL` | `file:./dev.db` | SQLite (local) or PostgreSQL |
| `JWT_SECRET` | — | **Required in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `SIMULATOR_INTERVAL_MS` | `30000` | Metric generation interval |
| `DATA_RETENTION_DAYS` | `30` | Auto-delete old metrics |

## Production Build

```bash
npm run build
```

## Database Management

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio (GUI)
npm run db:studio

# Re-seed demo data
npm run seed
```

## Deployment

### PostgreSQL (Production)

1. Set `DATABASE_URL` to your PostgreSQL connection string in `.env`
2. Update `server/prisma/schema.prisma` provider from `sqlite` to `postgresql`
3. Run `npx prisma migrate deploy`
4. Set a strong `JWT_SECRET`
5. Build: `npm run build`
6. Start: `npm run start`

### Environment Variables for Production

- Set `NODE_ENV=production`
- Set a strong random `JWT_SECRET` (min 32 chars)
- Set `CLIENT_URL` to your frontend domain
