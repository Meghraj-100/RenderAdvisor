# RenderAdvisor — Production Deployment Guide

This guide covers deploying RenderAdvisor to production environments including Docker containers, VPS, Vercel, Render, and Railway.

---

## 1. Environment Variables Checklist

Ensure these environment variables are set in your production environment:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Optional | Application runtime environment | `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens (min 32 chars) | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Optional | Access token expiration (default: `15m`) | `15m` |
| `REFRESH_TOKEN_SECRET` | **Yes** | Secret for signing refresh tokens (min 32 chars) | `openssl rand -base64 32` |
| `REFRESH_TOKEN_EXPIRES_IN` | Optional | Refresh token lifetime (default: `7d`) | `7d` |
| `RUN_MIGRATIONS` | Optional | Run Drizzle DB migrations on start (Docker only) | `true` |
| `PORT` | Optional | Port to listen on (default: `3000`) | `3000` |

> Generate strong 32+ character secrets using:
> ```bash
> openssl rand -base64 32
> ```

---

## 2. Option A: Docker Deployment (Recommended for VPS / Self-hosted)

RenderAdvisor includes a production multi-stage `Dockerfile` and a `docker-compose.yml` service.

### Quick Start with Docker Compose

1. Clone repository on your server:
   ```bash
   git clone https://github.com/Meghraj-100/RenderAdvisor.git
   cd RenderAdvisor
   ```

2. Configure production environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your production secrets
   ```

3. Start application and PostgreSQL:
   ```bash
   docker compose up -d --build
   ```

4. Check container status:
   ```bash
   docker compose ps
   ```

5. View application logs:
   ```bash
   docker compose logs -f app
   ```

---

## 3. Option B: Vercel + Cloud PostgreSQL (Neon / Supabase)

### Step 1: Set up Cloud Database
Create a PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Copy the pooled connection string (with `?sslmode=require`).

### Step 2: Run Database Migration
Before deploying the web app, run migrations against your remote database from your local machine:
```bash
DATABASE_URL="your-production-database-url" npm run db:migrate
```

### Step 3: Deploy to Vercel
1. Import repository to Vercel.
2. In **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
3. Click **Deploy**.

---

## 4. Option C: Render / Railway Deployment

### Deploying to Render
1. Create a **PostgreSQL** service on Render.
2. Create a **Web Service** connected to your repository:
   - **Environment**: `Docker` (or Node with `npm run build` and `npm start`)
   - **Health Check Path**: `/api/health`
3. In **Environment Variables**, set:
   - `DATABASE_URL` (Use Render's Internal Database URL)
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `RUN_MIGRATIONS=true`

### Deploying to Railway
1. Add a **PostgreSQL** plugin in your Railway project.
2. Connect your RenderAdvisor GitHub repository.
3. Railway will automatically detect the Dockerfile or Node.js project.
4. Set `DATABASE_URL=${{Postgres.DATABASE_URL}}` and your JWT secrets.

---

## 5. Health Check & Monitoring

RenderAdvisor exposes a production health check endpoint:

```
GET /api/health
```

- **HTTP 200 OK**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-02T03:00:00.000Z",
    "database": "connected"
  }
  ```
- **HTTP 503 Service Unavailable** (if DB connection fails):
  ```json
  {
    "status": "unhealthy",
    "timestamp": "2026-10-02T03:00:00.000Z",
    "database": "disconnected",
    "error": "connection timeout"
  }
  ```

---

## 6. Verification Checklist
- [x] Cloud PostgreSQL SSL handling configured
- [x] Standalone Next.js output enabled for minimal Docker images
- [x] Multi-stage Dockerfile with non-root security user (`nextjs`)
- [x] Automatic database migration runner (`docker-entrypoint.sh`)
- [x] Healthcheck endpoint `/api/health` for load balancers
- [x] Automated unit and integration tests passing (`npm test`)
