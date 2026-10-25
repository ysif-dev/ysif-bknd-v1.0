# Youth Spark India Foundation — Backend API Engine & Database Services

Production API Server, Database Services, RBAC Authorization Engine, and Media Infrastructure for **YOUTH SPARK INDIA FOUNDATION**.

---

## 1. Backend Architecture

`youth-spark-backend` is an independent backend server built on **Next.js 14 App Router API Routes**, **Prisma ORM**, and **PostgreSQL (Neon Cloud)**. It provides:

- **RESTful API Routes**: Grouped by domain under `app/api/`:
  - `/api/pages/[slug]` (with `/draft`, `/publish`, `/revisions`, and `restore` endpoints for the 5 designated pages).
  - `/api/users` & `/api/roles` (Granular RBAC with 7 system roles and per-admin Email OTP toggle).
  - `/api/media` (Cloudinary upload signatures, asset metadata persistence, search).
  - `/api/documents` (Direct device file uploads for PDF/DOC reports with Cloudinary & disk fallback).
  - `/api/programmes`, `/api/stories`, `/api/events`, `/api/gallery`, `/api/testimonials`.
  - `/api/homepage` & `/api/navigation` (Dynamic reordering and content configuration).
  - `/api/enquiries` (Super Admin deletion with mandatory audit logging).
  - `/api/health` (Database connectivity and latency telemetry).
- **Security & Authorization**:
  - HMAC-SHA256 signed session cookie verification.
  - Cryptographic 6-digit Email OTP 2FA with SHA-256 storage and 5-minute expiry.
  - Action-level permissions checking on every sensitive mutation.
  - Immutable audit logging for sensitive actions (user creation, OTP policy changes, document publishing, enquiry deletion).
- **Database Engine**:
  - Neon Cloud Serverless PostgreSQL 18.6 on AWS us-east-2.
  - PgBouncer connection pooling (`-pooler` endpoint) for high concurrency.
  - Prisma client with non-destructive, additive migrations.

---

## 2. Framework & Dependencies

- **Framework**: Next.js `14.2.24` (API Server)
- **Database ORM**: Prisma Client `5.22.0` & Prisma CLI `5.22.0`
- **Authentication**: `bcryptjs 2.4.3` (Work factor 10), Node.js `crypto` (HMAC, SHA-256)
- **Validation**: `zod 3.23.8`
- **Testing**: Node.js Native Test Runner (`node:test`)

---

## 3. Installation & Local Development

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create local environment configuration
cp .env.example .env

# 4. Generate Prisma Client
npm run db:generate

# 5. Start local backend server (runs on port 3001)
npm run dev

# 6. Verify health status
# GET http://localhost:3001/api/health
```

---

## 4. Database Commands & Migration Workflow

> [!CAUTION]
> Never execute `prisma migrate reset` in production or development. The database contains verified production records.

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes non-destructively to Neon
npm run db:push

# Deploy versioned migrations
npm run db:migrate

# Seed baseline roles, permissions, testimonials, and static policy pages
npm run db:seed

# Inspect database records
node scripts/inspect-records.mjs
```

---

## 5. Environment Variables Reference

Configure `backend/.env` using `backend/.env.example`:

| Variable | Description | Sensitivity |
|---|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection URI | **CRITICAL** |
| `DIRECT_URL` | Neon direct PostgreSQL connection URI (for migrations) | **CRITICAL** |
| `SESSION_SECRET` | 64-character random hex string for HMAC cookie signing | **CRITICAL** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Public |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | **HIGH** |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | **CRITICAL** |
| `RESEND_API_KEY` | Resend API key for sending 2FA OTP emails | **HIGH** |
| `OTP_FROM_EMAIL` | Verified sender email (e.g. `security@youthsparkindia.org`) | Public |
| `NEXT_PUBLIC_APP_URL` | Allowed frontend origin for CORS | Public |
| `NODE_ENV` | `development` / `production` | Public |

---

## 6. Testing

Run backend automated unit and integration tests:

```bash
npm test
```

Tests cover:
- Password hashing & verification
- Session HMAC tamper resistance
- Per-admin OTP challenge generation, SHA-256 hashing, and 5-minute expiry
- 5-page scope restriction on the visual editor API
- Draft vs published content isolation
- Optimistic concurrency conflict detection
- Super Admin enquiry deletion authorization
- Cloudinary SHA-1 upload signature generation


Copyright and Proprietary Notice

Copyright © 2026 Youth Spark India Foundation (YSIF). All rights reserved.
This repository contains proprietary source code and project materials. No permission is granted to copy, reproduce, modify, distribute, publish, or use this code without prior written authorization from the copyright holder.
Unauthorized use or redistribution is prohibited to the extent permitted by applicable law.