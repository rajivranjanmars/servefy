# Survey Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

Enterprise-grade survey platform built on Cloudflare's edge infrastructure.

## Overview

A production-ready survey management system featuring real-time analytics, secure file uploads, role-based access control, and enterprise authentication.

### Key Features

- **Survey Builder**: Visual drag-and-drop interface with 18 question types
- **Enterprise Authentication**: Better Auth with email verification, password policies, and admin roles
- **Secure File Storage**: Cloudflare R2 with presigned URLs and content validation
- **Real-time Analytics**: Response tracking with visual charts and export capabilities
- **Role-Based Access**: Admin and user roles with ownership-based permissions
- **Edge Deployment**: Global low-latency performance via Cloudflare Workers

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React 18      │──────▶  Cloudflare      │──────▶   Cloudflare    │
│   Frontend      │      │   Workers        │      │   D1 (SQLite)   │
│   Vite + Hono   │      │   Hono API       │      │   Database      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Cloudflare R2  │
                       │   File Storage   │
                       └──────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui |
| Backend | Cloudflare Workers, Hono Framework |
| Database | Cloudflare D1 (SQLite), Drizzle ORM |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | Better Auth (rate-limited, RBAC) |
| Email | AWS SES |

## Quick Start

```bash
# Clone and install
git clone <repository> && cd survey-platform
pnpm install

# Configure environment
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
cp apps/web/.env.example apps/web/.env
# Edit .dev.vars and .env with your credentials

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

**Development URLs:**
- Frontend: http://localhost:5173
- API: http://localhost:8787

## Documentation

- **[SETUP.md](SETUP.md)** - Complete deployment and configuration guide
- **API Reference** - See `/api/*` routes in `apps/worker/src/routes/`

## Project Structure

```
survey-platform/
├── apps/
│   ├── web/              # React frontend
│   └── worker/           # Cloudflare Worker API
├── packages/
│   ├── database/         # D1 schema & migrations
│   └── types/            # Shared TypeScript types
├── .env.template         # Environment variables template
└── package.json
```

## Security

- Rate limiting: 100 requests/minute per IP
- File upload validation: Type, size (10MB), and path traversal checks
- CSRF protection with trusted origin whitelist
- Secure HTTP-only cookies in production
- Role-based access control (RBAC)
- SQL injection prevention via Drizzle ORM
- Input sanitization with Zod validation

## Deployment

### Production

```bash
cd apps/worker

# Set production secrets
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put AWS_ACCESS_KEY_ID --env production
wrangler secret put AWS_SECRET_ACCESS_KEY --env production
wrangler secret put R2_ACCESS_KEY_ID --env production
wrangler secret put R2_SECRET_ACCESS_KEY --env production

# Deploy worker
wrangler deploy --env production

# Deploy database migrations
cd packages/database
wrangler d1 migrations apply survey-db-prod --remote

# Deploy frontend
cd apps/web
pnpm build
wrangler pages deploy dist
```

See [SETUP.md](SETUP.md) for detailed deployment instructions.

## Environment Variables

### Required Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=<generate-with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000

# AWS SES
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Cloudflare R2
R2_ACCESS_KEY_ID=<your-r2-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Environment
ENVIRONMENT=development

# Frontend
VITE_API_URL=/api
```

## Open Source Safety

- Never commit `apps/worker/.dev.vars` or any `.env` file with real values.
- Commit only template files (`.env.template`, `apps/worker/.dev.vars.example`, `apps/web/.env.example`).
- Set production secrets with `wrangler secret put ...` instead of storing keys in git.

## API Endpoints

### Authentication
- `POST /api/auth/sign-up/email` - Register
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/me` - Current user

### Surveys
- `GET /api/surveys` - List surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey
- `PATCH /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `POST /api/surveys/:id/publish` - Publish
- `GET /s/:slug` - Public survey access

### Files
- `POST /api/files/upload-url/:surveyId` - Get presigned upload URL
- `POST /api/files/upload/:fileId` - Upload file
- `GET /api/files/download/:fileId` - Download file

See route files in `apps/worker/src/routes/` for complete API documentation.

## Development

### Scripts

```bash
pnpm dev              # Start development servers
pnpm build            # Build all packages
pnpm typecheck        # TypeScript check
pnpm db:migrate       # Run database migrations
pnpm db:migrate:prod  # Run production migrations
```

### Database Migrations

```bash
# Generate migration
cd packages/database
pnpm generate

# Apply locally
wrangler d1 migrations apply survey-db --local

# Apply to production
wrangler d1 migrations apply survey-db --remote
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file

## Support

For issues and feature requests, please use GitHub Issues.

---

**Built with Cloudflare Workers, D1, R2, and React**

## Author

Author: [rajivranjanmars](https://rajivranjana.in).

## Dependency maintenance

Use pnpm and the committed `pnpm-lock.yaml` for reproducible workspace installs.
