# Backend Production Deployment & Operations Guide

**Application**: `youth-spark-backend`  
**Platform**: Vercel / Render / AWS ECS / Node.js Server  
**Database**: Managed Neon Cloud PostgreSQL 18.6 (AWS us-east-2)  

---

## 1. Hosting Provider & Project Root Configuration

### Option A: Independent Vercel Project (Recommended)
1. Push the contents of `backend/` to a dedicated GitHub repository (e.g. `youth-spark-backend`).
2. In the [Vercel Dashboard](https://vercel.com), select **Add New Project** and import the repository.
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (if standalone repo) or `backend/` (if monorepo)
   - **Build Command**: `npx prisma generate && next build`
   - **Install Command**: `npm install`
   - **Output Directory**: `.next`

---

## 2. Production Environment Variables Checklist

Configure all environment variables in your hosting provider's dashboard:

| Variable | Target Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:[PASSWORD]@ep-silent-base-b464bgxg-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require` | Pooled connection via PgBouncer |
| `DIRECT_URL` | `postgresql://neondb_owner:[PASSWORD]@ep-silent-base-b464bgxg.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require` | Direct connection for migrations |
| `SESSION_SECRET` | *(64-character random hex string)* | Signs and verifies session HMAC tokens |
| `CLOUDINARY_CLOUD_NAME` | `youth-spark-foundation` | Cloudinary cloud account |
| `CLOUDINARY_API_KEY` | *(API key)* | Upload authentication |
| `CLOUDINARY_API_SECRET` | *(API secret)* | Server-side upload signing |
| `RESEND_API_KEY` | `re_...` | Dispatches 2FA Email OTP codes |
| `OTP_FROM_EMAIL` | `security@youthsparkindia.org` | Verified email sender |
| `NEXT_PUBLIC_APP_URL` | `https://youthsparkindia.org` | Allowed origin for CORS |
| `NODE_ENV` | `production` | Enables production optimizations |

---

## 3. Safe Database Migration Commands

> [!CAUTION]
> Under no circumstances should `prisma migrate reset` or table drops be executed.

```bash
# 1. Generate client from current schema
npx prisma generate

# 2. Deploy schema safely to live Neon without dropping data
npx prisma db push

# 3. Seed baseline roles, permissions, testimonials, and static policy pages
node scripts/seed-advanced.mjs
node scripts/seed-extensions.mjs
```

---

## 4. Custom Domain & CORS Setup

1. In Vercel, assign custom domain `api.youthsparkindia.org`.
2. Configure DNS:
   - `CNAME` Record: `api` -> `cname.vercel-dns.com`
3. In `backend/app/api/...`:
   - CORS headers return `Access-Control-Allow-Origin: https://youthsparkindia.org`.
   - Credentials are supported with `Access-Control-Allow-Credentials: true`.

---

## 5. Health Check & Production Smoke Tests

1. **System Health Endpoint**:
   ```bash
   curl -I https://api.youthsparkindia.org/api/health
   # Must return HTTP 200 with JSON database latency telemetry
   ```
2. **Authentication Endpoint**:
   - Verify `/api/users` requires valid session.
   - Verify `/api/pages/about` returns page content and blocks.
   - Verify unauthorized attempts return 401 or 403.
3. **Database Connection Verification**:
   - Query response time should typically be under 800ms via the pooled connection.

---

## 6. Logs, Troubleshooting & Rollback Procedures

### Cold Starts & Connection Timeout
If you encounter `P1001: Can't reach database server`:
- Ensure `DATABASE_URL` contains `-pooler` in the host name.
- Append `?connect_timeout=15&pool_timeout=15` to connection string in Vercel.

### Instant Rollback
In Vercel:
1. Navigate to **Deployments**.
2. Select previous known good deployment.
3. Click **Promote to Production**. Traffic switches instantly.
