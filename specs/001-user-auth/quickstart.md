# Quickstart Guide: Doc-DB Authentication Feature

**Feature**: 001-user-auth  
**Last Updated**: 2025-12-23  
**Time to Complete**: ~10 minutes

This guide walks you through setting up the Doc-DB authentication feature in your local development environment.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18.x or higher ([download](https://nodejs.org/))
- **pnpm** 8.x or higher (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/downloads))

**Verify installations**:
```bash
node --version  # Should be v18.x or higher
pnpm --version  # Should be 8.x or higher
docker --version
docker-compose --version
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url> doc-db
cd doc-db
```

### 2. Checkout Feature Branch

```bash
git checkout 001-user-auth
```

### 3. Install Dependencies

```bash
pnpm install
```

This will install all Node.js dependencies including:
- Next.js 14+
- Prisma ORM
- jose (JWT)
- bcrypt
- nodemailer
- zod
- Headless UI
- Tailwind CSS

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database
DATABASE_URL="postgresql://docdb:docdb_dev_password@localhost:5432/docdb?sslmode=disable"

# S3 (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="docdb"
S3_SECRET_KEY="docdb_dev_password"
S3_BUCKET="docdb-uploads"

# JWT
JWT_SECRET="dev_secret_change_in_production"
JWT_ACCESS_EXPIRATION="30m"
JWT_REFRESH_EXPIRATION="30d"

# Email (Development: MailHog)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_FROM="noreply@localhost"

# Email (Production: Resend)
RESEND_API_KEY=""

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important Notes**:
- `JWT_SECRET`: Keep secure. Use a strong random string in production.
- `DATABASE_URL`: Includes `?sslmode=disable` for local development (localhost only).
  - **Production**: Use `?sslmode=require` for managed databases (Vercel Postgres, Supabase, etc.)
  - SSL is enforced in production to encrypt database connections over the internet.

### 5. Start Docker Services

Start PostgreSQL, MinIO, and MailHog:

```bash
docker-compose up -d
```

**Verify services are running**:
```bash
docker-compose ps
```

You should see:
- `docdb-postgres` (port 5432)
- `docdb-minio` (ports 9000, 9001)
- `docdb-mailhog` (ports 1025, 8025)

**Wait for services to be healthy** (~30 seconds):
```bash
docker-compose logs -f postgres
# Wait for "database system is ready to accept connections"
# Press Ctrl+C to exit logs
```

### 6. Run Database Migrations

Initialize Prisma and create database schema:

```bash
pnpm prisma migrate dev --name init
```

This will:
- Create all 8 tables (users, refresh_tokens, revoked_tokens, etc.)
- Generate Prisma Client with TypeScript types
- Apply indexes and constraints

**Verify database**:
```bash
pnpm prisma studio
```

Opens Prisma Studio at `http://localhost:5555` to browse database.

### 7. (Optional) Seed Test Data

Create a test user:

```bash
pnpm prisma db seed
```

**Test user credentials**:
- Username: `testuser`
- Email: `test@example.com`
- Password: `Test1234!`
- Email verified: `true`

---

## Running the Application

### Start Development Server

```bash
pnpm dev
```

The app will be available at **http://localhost:3000**

**What happens on startup**:
1. Next.js compiles pages and API routes
2. Prisma connects to PostgreSQL
3. Middleware configures auth protection
4. Development server ready in ~5 seconds

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:3000 | Next.js application |
| **Signup** | http://localhost:3000/signup | Create new account |
| **Login** | http://localhost:3000/login | Sign in |
| **PostgreSQL** | localhost:5432 | Database (use Prisma Studio or pgAdmin) |
| **MinIO Console** | http://localhost:9001 | S3 storage UI (login: docdb/docdb_dev_password) |
| **MailHog UI** | http://localhost:8025 | View sent emails |
| **Prisma Studio** | http://localhost:5555 | Database browser (run `pnpm prisma studio`) |

---

## Testing Auth Flows

### 1. Signup Flow

**Test with cURL**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected response** (201 Created):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Account created. Please check your email to verify your account."
}
```

**Check MailHog** (http://localhost:8025):
- Open the verification email
- Copy the verification token from the link

**Verify email**:
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-from-email>"
  }'
```

### 2. Login Flow

**Login with username/email and password**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "john_doe",
    "password": "SecurePass123!",
    "rememberMe": true
  }'
```

**Expected response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "emailVerified": true,
    "createdAt": "2025-12-23T10:00:00Z"
  }
}
```

**Access protected endpoint**:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 3. Password Reset Flow

**Request password reset**:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Check MailHog** for reset email, then:
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-from-email>",
    "newPassword": "NewSecurePass123!"
  }'
```

### 4. UI Testing

**Manual testing checklist**:

1. **Signup Form** (http://localhost:3000/signup)
   - [ ] Real-time password strength indicator works
   - [ ] Validation errors display clearly (RGAA compliant)
   - [ ] Duplicate username suggests alternatives
   - [ ] Email verification banner appears after signup

2. **Login Form** (http://localhost:3000/login)
   - [ ] "Remember Me" checkbox functional
   - [ ] Invalid credentials show generic error
   - [ ] Account lockout after 5 failures
   - [ ] Email not verified redirects to verification page

3. **Email Verification** (http://localhost:3000/verify-email)
   - [ ] Valid token verifies and logs in
   - [ ] Expired token shows error with resend option
   - [ ] Resend verification works (check MailHog)

4. **Password Reset** (http://localhost:3000/forgot-password)
   - [ ] Reset email sent (check MailHog)
   - [ ] Reset form validates new password
   - [ ] Successful reset allows login

5. **Account Settings** (http://localhost:3000/settings)
   - [ ] Change username (check uniqueness)
   - [ ] Change email (verify via email)
   - [ ] Change password (logs out other sessions)

---

## Running Tests

### Unit Tests

Test individual functions (JWT, password hashing, validation):

```bash
pnpm test
```

**Run specific test file**:
```bash
pnpm test lib/auth/jwt.test.ts
```

**Watch mode** (re-run on file changes):
```bash
pnpm test --watch
```

### Integration Tests

Test API endpoints with database:

```bash
pnpm test:integration
```

**Test coverage**:
```bash
pnpm test:coverage
```

Target: **100% coverage** of business logic (per constitution requirement).

### E2E Tests

Test complete user flows with browser automation:

```bash
pnpm test:e2e
```

Uses **MCP Chrome DevTools** for testing (per constitution requirement).

**Run specific E2E test**:
```bash
pnpm test:e2e tests/e2e/auth-flows.spec.ts
```

### Accessibility Tests

Validate RGAA compliance:

```bash
pnpm test:a11y
```

Uses **axe-core** to check for accessibility violations.

**Target**: 100% RGAA AA compliance (per FR-005, SC-007).

### Linting

```bash
pnpm lint
```

Uses **Biome** for linting (per constitution requirement).

**Auto-fix issues**:
```bash
pnpm lint:fix
```

---

## Troubleshooting

### Docker Services Not Starting

**Symptom**: `docker-compose up` fails or services unhealthy

**Solution**:
```bash
# Stop all services
docker-compose down

# Remove volumes (CAUTION: deletes data)
docker-compose down -v

# Restart
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Prisma Connection Issues

**Symptom**: `Error: Can't reach database server`

**Checklist**:
1. PostgreSQL container running: `docker-compose ps postgres`
2. DATABASE_URL correct in `.env.local`
3. Wait 30 seconds after `docker-compose up` (PostgreSQL startup time)

**Test connection**:
```bash
pnpm prisma db pull
```

### Email Not Sending (MailHog)

**Symptom**: No emails in MailHog UI

**Checklist**:
1. MailHog container running: `docker-compose ps mailhog`
2. SMTP settings correct in `.env.local` (host: localhost, port: 1025)
3. Check MailHog logs: `docker-compose logs mailhog`

**Manual test**:
```bash
pnpm test:email
```

### Port Conflicts

**Symptom**: `Error: Port already in use`

**Solution**:

| Port | Service | Alternative |
|------|---------|-------------|
| 3000 | Next.js | `PORT=3001 pnpm dev` |
| 5432 | PostgreSQL | Edit docker-compose.yml: `"5433:5432"` |
| 9000 | MinIO API | Edit docker-compose.yml |
| 8025 | MailHog UI | Edit docker-compose.yml |

**Find process using port**:
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Prisma Client Out of Sync

**Symptom**: Type errors after schema changes

**Solution**:
```bash
pnpm prisma generate
```

### JWT Secret Not Configured

**Symptom**: `Error: JWT_SECRET is not defined`

**Solution**: Add `JWT_SECRET` to `.env.local` with a secure random string:
```bash
# Generate secure secret (macOS/Linux)
openssl rand -base64 32

# Generate secure secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Development Workflow

### Making Changes

1. **Edit code** in `app/`, `lib/`, or `components/`
2. **Hot reload** automatic (Next.js Fast Refresh)
3. **Run tests**: `pnpm test` (unit) or `pnpm test:integration`
4. **Check types**: `pnpm type-check`
5. **Lint**: `pnpm lint`

### Database Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name describe_change

# 3. Generate Prisma Client
pnpm prisma generate

# 4. Restart dev server
pnpm dev
```

### Adding New API Route

1. Create `app/api/your-route/route.ts`
2. Implement handler with Server Action or route handler
3. Add to OpenAPI spec in `specs/001-user-auth/contracts/`
4. Write tests in `tests/integration/api/your-route.test.ts`
5. Run tests: `pnpm test:integration`

### Debugging

**Enable verbose logging**:
```env
# .env.local
DEBUG="prisma:*"
LOG_LEVEL="debug"
```

**VS Code debugger**:
Press F5 or use Run > Start Debugging (`.vscode/launch.json` pre-configured)

**Database queries**:
```bash
# Enable Prisma query logging
DATABASE_URL="postgresql://...?query_logging=true"
```

---

## Next Steps

✅ **Development environment ready!**

### Implement Feature Tasks

See [`specs/001-user-auth/plan.md`](./plan.md) for complete implementation plan.

**To generate implementation tasks**:
```bash
/speckit.tasks
```

This creates `specs/001-user-auth/tasks.md` with:
- Phase 2A: Infrastructure Setup (Docker, Prisma, env)
- Phase 2B: Core Auth Logic (JWT, bcrypt, validation)
- Phase 2C: API Routes (9 endpoints)
- Phase 2D: UI Components (forms, RGAA compliant)
- Phase 2E: Testing (Jest, integration, E2E)
- Phase 2F: Documentation & Deployment

### Useful Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Production server

# Database
pnpm prisma studio          # Database GUI
pnpm prisma migrate dev     # Create migration
pnpm prisma db seed         # Seed data
pnpm prisma db push         # Sync schema (dev only)

# Testing
pnpm test                   # Unit tests
pnpm test:integration       # Integration tests
pnpm test:e2e               # E2E tests
pnpm test:a11y              # Accessibility tests
pnpm test:coverage          # Coverage report

# Code Quality
pnpm lint                   # Run linter
pnpm lint:fix               # Auto-fix issues
pnpm type-check             # TypeScript checks
pnpm format                 # Format code

# Docker
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
docker-compose restart      # Restart services
```

---

## Production Deployment

### Environment Variables (Production)

When deploying to Vercel, configure these environment variables:

```env
# Database (Vercel Postgres or managed PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
# ⚠️ CRITICAL: Must include ?sslmode=require for production
# Vercel Postgres automatically provides this in connection string

# S3 (Production - AWS S3, Cloudflare R2, etc.)
S3_ENDPOINT="https://s3.region.amazonaws.com"
S3_ACCESS_KEY="<aws_access_key>"
S3_SECRET_KEY="<aws_secret_key>"
S3_BUCKET="docdb-uploads-prod"

# JWT (Use strong random secrets)
JWT_SECRET="<generate_with_openssl_rand_base64_32>"
JWT_ACCESS_EXPIRATION="30m"
JWT_REFRESH_EXPIRATION="30d"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
SMTP_FROM="noreply@yourdomain.com"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Rate Limiting (Vercel KV)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxx"
```

### SSL/TLS Configuration

**Development vs Production**:

| Environment | SSL Mode | Rationale |
|-------------|----------|-----------|
| **Development** | `sslmode=disable` | Localhost connections only, no external exposure |
| **Production** | `sslmode=require` | Encrypts database connections over internet |

**Vercel Postgres**:
- Automatically enforces SSL/TLS
- Connection string includes `?sslmode=require`
- Certificates managed by Vercel

**Other Managed Providers** (Supabase, Railway, Neon):
- All enforce SSL by default
- Include `?sslmode=require` in DATABASE_URL
- Provider handles certificate management

**Security Notes**:
- ✅ SSL prevents credential theft in transit
- ✅ SSL prevents man-in-the-middle attacks
- ✅ Combined with HTTPS, provides end-to-end encryption
- ⚠️ Never use `sslmode=disable` in production

### Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] JWT_SECRET is strong random string (32+ bytes)
- [ ] Resend API key is valid
- [ ] S3 bucket configured with CORS
- [ ] Run `pnpm prisma migrate deploy` after first deploy
- [ ] Verify HTTPS enforced (Vercel automatic)
- [ ] Test authentication flows in production
- [ ] Run accessibility tests (`pnpm test:a11y`)

---

## Additional Resources

### Documentation

- **Feature Spec**: [`specs/001-user-auth/spec.md`](./spec.md)
- **Implementation Plan**: [`specs/001-user-auth/plan.md`](./plan.md)
- **Research Decisions**: [`specs/001-user-auth/research.md`](./research.md) (see Decision 9 for SSL details)
- **Data Model**: [`specs/001-user-auth/data-model.md`](./data-model.md)
- **API Contracts**: [`specs/001-user-auth/contracts/auth-api.openapi.yml`](./contracts/auth-api.openapi.yml)

### External Docs

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Prisma SSL**: https://www.prisma.io/docs/concepts/database-connectors/postgresql#configuring-an-ssl-connection
- **jose (JWT)**: https://github.com/panva/jose
- **Headless UI**: https://headlessui.com
- **RGAA**: https://accessibilite.numerique.gouv.fr/
- **Vercel Postgres Security**: https://vercel.com/docs/storage/vercel-postgres/security

### Getting Help

- **Issues**: Open issue in GitHub repository
- **Team**: Contact team via Slack/Discord
- **AI Assistant**: Ask GitHub Copilot for code suggestions

---

**Happy coding! 🚀**
