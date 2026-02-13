# Setup & Deployment Guide

Complete guide for deploying the Survey Platform to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Cloudflare Setup](#cloudflare-setup)
4. [AWS SES Configuration](#aws-ses-configuration)
5. [Production Deployment](#production-deployment)
6. [Operations & Monitoring](#operations--monitoring)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

```bash
# Node.js 18+ (use nvm for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# pnpm
npm install -g pnpm

# Wrangler CLI
npm install -g wrangler
```

### Required Accounts

- **Cloudflare Account** (Free tier works): https://dash.cloudflare.com/sign-up
- **AWS Account** (for SES): https://aws.amazon.com/

### Resource Requirements

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Cloudflare Workers | API hosting | 100k requests/day |
| Cloudflare D1 | Database | 5M rows |
| Cloudflare R2 | File storage | 10GB |
| AWS SES | Email service | 62k emails/month |

## Local Development

### 1. Clone and Install

```bash
git clone <repository-url>
cd survey-platform
pnpm install
```

### 2. Configure Environment

#### Worker Environment (`apps/worker/.dev.vars`)

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

Edit `.dev.vars`:

```bash
# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:5173

# AWS SES
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Environment
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend Environment (`apps/web/.env`)

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `.env`:

```env
VITE_API_URL=/api
```

### 3. Start Development

```bash
# Start all services
pnpm dev

# Or individually:
# Terminal 1 - Worker
cd apps/worker && wrangler dev

# Terminal 2 - Frontend
cd apps/web && pnpm dev
```

**URLs:**
- Frontend: http://localhost:5173
- API: http://localhost:8787
- API Health: http://localhost:8787/health

## Cloudflare Setup

### 1. Authentication

```bash
# Login to Cloudflare
wrangler login

# Verify login
wrangler whoami
```

### 2. Create D1 Database

```bash
# Create database
wrangler d1 create survey-db

# Expected output:
# ✅ Successfully created DB 'survey-db'
# [[d1_databases]]
# binding = "DB"
# database_name = "survey-db"
# database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Copy the database_id** for configuration.

### 3. Create R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create survey-files

# Apply CORS configuration
wrangler r2 bucket cors set survey-files --file apps/worker/r2-cors.json
```

### 4. Get R2 API Credentials

1. Go to Cloudflare Dashboard → R2 → Manage API Tokens
2. Create API Token with **Admin Read & Write** permissions
3. Copy:
   - Access Key ID
   - Secret Access Key
   - Account ID (for endpoint URL)

### 5. Update Configuration

#### `apps/worker/wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "survey-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat_v2"],

  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "survey-db",
      "database_id": "YOUR_DATABASE_ID_HERE",
      "migrations_dir": "../../packages/database/src/migrations"
    }
  ],

  "r2_buckets": [
    {
      "binding": "STORAGE",
      "bucket_name": "survey-files",
      "preview_bucket_name": "survey-files-preview"
    }
  ],

  "vars": {
    "ENVIRONMENT": "development"
  },

  "env": {
    "staging": {
      "name": "survey-api-staging",
      "vars": { "ENVIRONMENT": "staging" }
    },
    "production": {
      "name": "survey-api-production",
      "vars": { "ENVIRONMENT": "production" }
    }
  }
}
```

Replace `YOUR_DATABASE_ID_HERE` with your actual database ID.

### 6. Run Database Migrations

```bash
# Local
pnpm db:migrate

# Verify tables
wrangler d1 execute survey-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## AWS SES Configuration

### 1. Create AWS Access Keys

1. Sign in to AWS Console
2. Go to IAM → Users → [Your User] → Security credentials
3. Click "Create access key"
4. Select "Application running outside AWS"
5. **Save both keys immediately** (secret key shown only once)

### 2. Verify Email or Domain

**Option A: Email Verification (Testing)**

1. AWS Console → SES → Verified identities
2. Click "Create identity" → Email address
3. Enter your email and verify via link

**Option B: Domain Verification (Production)**

1. AWS Console → SES → Verified identities
2. Click "Create identity" → Domain
3. Add DNS TXT records as instructed
4. Wait for verification (up to 72 hours)

### 3. Request Production Access

By default, SES is in sandbox mode (can only send to verified addresses).

To send to any email:

1. SES Console → Account dashboard
2. Production access → Request production access
3. Fill use case form and submit
4. Wait for approval (usually 24 hours)

## Production Deployment

### Pre-Deployment Checklist

- [ ] Generate new production secrets (don't reuse dev secrets)
- [ ] Create production D1 database
- [ ] Create production R2 bucket
- [ ] Verify AWS SES production access
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring

### 1. Create Production Resources

```bash
# Production D1 database
wrangler d1 create survey-db-prod

# Production R2 bucket
wrangler r2 bucket create survey-files-prod
wrangler r2 bucket cors set survey-files-prod --file apps/worker/r2-cors.json
```

### 2. Update Production Configuration

Edit `apps/worker/wrangler.jsonc`:

```jsonc
{
  "env": {
    "production": {
      "name": "survey-api-production",
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "survey-db-prod",
          "database_id": "YOUR_PROD_DATABASE_ID"
        }
      ],
      "r2_buckets": [
        {
          "binding": "STORAGE",
          "bucket_name": "survey-files-prod"
        }
      ],
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

### 3. Set Production Secrets

```bash
cd apps/worker

# Generate new production secret
openssl rand -base64 32

# Set secrets (values entered interactively)
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put AWS_ACCESS_KEY_ID --env production
wrangler secret put AWS_SECRET_ACCESS_KEY --env production
wrangler secret put R2_ACCESS_KEY_ID --env production
wrangler secret put R2_SECRET_ACCESS_KEY --env production
```

### 4. Deploy Database

```bash
cd packages/database

# Deploy migrations
wrangler d1 migrations apply survey-db-prod --remote
```

### 5. Deploy Worker

```bash
cd apps/worker

# Deploy
wrangler deploy --env production

# Get deployment URL
# Output: https://survey-api-production.your-account.workers.dev
```

### 6. Deploy Frontend

```bash
cd apps/web

# Create production env
echo "VITE_API_URL=https://survey-api-production.your-account.workers.dev" > .env.production

# Build
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Or deploy to other hosts (Vercel, Netlify, etc.)
```

### 7. Configure Custom Domain

1. Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Settings → Triggers → Add Custom Domain
4. Enter: `api.yourdomain.com`
5. Update frontend API URL to match

## Operations & Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail --env production

# Filter errors
wrangler tail --env production --status error
```

### Database Operations

```bash
# Execute SQL query
wrangler d1 execute survey-db-prod --remote --command="SELECT COUNT(*) FROM users"

# Export database
wrangler d1 export survey-db-prod --remote --output backup.sql

# List migrations
wrangler d1 migrations list survey-db-prod --remote
```

### Rollback Deployment

```bash
# Rollback to previous version
wrangler rollback --env production

# View versions
wrangler versions list
```

### Security Checklist

- [ ] Rotate secrets every 90 days
- [ ] Enable D1 automatic backups
- [ ] Review R2 bucket permissions (should be private)
- [ ] Monitor AWS SES sending limits
- [ ] Check application logs for errors
- [ ] Verify CORS configuration

## Troubleshooting

### Database Connection Errors

**Problem**: "Database binding not found"

**Solution**:
```bash
# Verify database exists
wrangler d1 list

# Check database ID in wrangler.jsonc
# Must match exactly
```

### CORS Errors

**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Check `BETTER_AUTH_URL` environment variable matches your domain
2. Verify domain in `apps/worker/src/index.ts` CORS config
3. Clear browser cache and cookies

### File Upload Failures

**Problem**: "R2 upload failed"

**Solution**:
```bash
# Verify bucket exists
wrangler r2 bucket list

# Check CORS is applied
wrangler r2 bucket cors get survey-files

# Verify R2 credentials are set
wrangler secret list --env production
```

### Authentication Issues

**Problem**: Session not persisting

**Solution**:
1. Check `BETTER_AUTH_SECRET` is at least 32 characters
2. Verify `ENVIRONMENT=production` is set
3. Ensure HTTPS is used (cookies require secure context)
4. Check browser dev tools → Application → Cookies

### Email Not Sending

**Problem**: AWS SES emails not delivered

**Solution**:
1. Verify AWS credentials in secrets
2. Check SES console for verified identities
3. If in sandbox mode, verify recipient email first
4. Check SES sending statistics for bounces/complaints

## Environment Variables Reference

### Worker Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Encryption key (min 32 chars) | Generate with openssl |
| `BETTER_AUTH_URL` | Frontend URL | https://surveys.example.com |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | AKIA... |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | wJalrX... |
| `AWS_REGION` | AWS region | us-east-1 |
| `SES_FROM_EMAIL` | Sender email | noreply@example.com |
| `R2_ACCESS_KEY_ID` | R2 API token ID | abc123... |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | xyz789... |
| `R2_ENDPOINT` | R2 S3 endpoint | https://...r2.cloudflarestorage.com |
| `ENVIRONMENT` | Environment name | production |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Worker API URL | https://api.example.com |

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Better Auth Docs**: https://better-auth.com/docs
- **AWS SES Docs**: https://docs.aws.amazon.com/ses/
- **Issues**: Create GitHub issue with logs and environment details

---

**Last Updated**: 2026-02-13
