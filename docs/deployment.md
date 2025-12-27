# Deployment Guide

This guide provides step-by-step instructions for deploying the authentication system to production on Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Email Service Configuration](#email-service-configuration)
- [Redis Configuration (Rate Limiting)](#redis-configuration-rate-limiting)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment Validation](#post-deployment-validation)
- [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

Before deploying, ensure you have:

- **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
- **GitHub Repository**: Project pushed to GitHub/GitLab/Bitbucket
- **PostgreSQL Database**: Production-ready instance (SSL-enabled)
  - Options: Neon, Supabase, Railway, AWS RDS, DigitalOcean Managed Database
- **Resend Account**: For transactional emails ([resend.com](https://resend.com))
- **Upstash Redis Account**: For rate limiting ([upstash.com](https://upstash.com))
- **Node.js 18+**: For local testing before deployment

---

## Environment Setup

### 1. Create Production Environment File

Create `.env.production` (DO NOT commit this file):

```bash
# Database (PostgreSQL with SSL)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# S3 Storage (Production bucket)
S3_ENDPOINT="https://s3.amazonaws.com" # Or your S3-compatible endpoint
S3_ACCESS_KEY="your_access_key"
S3_SECRET_KEY="your_secret_key"
S3_BUCKET="docdb-uploads-prod"
S3_REGION="us-east-1" # If using AWS S3

# JWT (Generate secure secrets)
JWT_SECRET="generate_with_openssl_rand_base64_32"
JWT_ACCESS_EXPIRATION="30m"
JWT_REFRESH_EXPIRATION="30d"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
SMTP_FROM="noreply@yourdomain.com"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxx"
```

### 2. Generate Secure Secrets

```bash
# Generate JWT_SECRET (32 bytes, base64-encoded)
openssl rand -base64 32

# Generate strong database password (32 characters)
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
```

**Security Notes**:
- Never reuse development secrets in production
- Rotate secrets every 90 days
- Store secrets in Vercel's environment variables (never in code)

---

## Database Setup

### Option 1: Neon (Recommended for Vercel)

1. **Create Database**:
   - Go to [console.neon.tech](https://console.neon.tech)
   - Create new project → Get connection string
   - Enable SSL (automatic with Neon)

2. **Configure Connection String**:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

3. **Run Migrations**:
   ```bash
   # Set DATABASE_URL locally
   export DATABASE_URL="postgresql://..."
   
   # Generate Prisma client
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate deploy
   
   # Optional: Seed production data
   NODE_ENV=production pnpm prisma db seed
   ```

### Option 2: Self-Hosted PostgreSQL with Docker

If using `docker-compose.prod.yml` (from the repository):

1. **Generate SSL Certificates** (see `docker/README.md`):
   ```bash
   # Generate CA certificate
   openssl req -new -x509 -days 365 -nodes -text \
     -out docker/postgres/ssl/ca.crt \
     -keyout docker/postgres/ssl/ca.key \
     -subj "/CN=DocDB CA"
   
   # Generate server certificate
   openssl req -new -nodes -text \
     -out docker/postgres/ssl/server.csr \
     -keyout docker/postgres/ssl/server.key \
     -subj "/CN=localhost"
   
   openssl x509 -req -in docker/postgres/ssl/server.csr \
     -text -days 365 -CA docker/postgres/ssl/ca.crt \
     -CAkey docker/postgres/ssl/ca.key -CAcreateserial \
     -out docker/postgres/ssl/server.crt
   
   # Set permissions
   chmod 600 docker/postgres/ssl/server.key
   ```

2. **Start Production Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run Migrations** (same as above)

---

## Email Service Configuration

### Using Resend (Recommended)

1. **Create Resend Account**: [resend.com/signup](https://resend.com/signup)
2. **Add Domain**: Verify your sending domain (DNS records)
3. **Create API Key**: Copy API key to `RESEND_API_KEY`
4. **Test Email Delivery**:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_xxxxx" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "noreply@yourdomain.com",
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<p>Email delivery test</p>"
     }'
   ```

### Alternative: Custom SMTP

If using a different email provider (SendGrid, Mailgun, etc.), update environment variables:

```bash
SMTP_HOST="smtp.youremailprovider.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="your_smtp_username"
SMTP_PASSWORD="your_smtp_password"
SMTP_FROM="noreply@yourdomain.com"
```

Then update `lib/email.ts` to use nodemailer instead of Resend SDK.

---

## Redis Configuration (Rate Limiting)

### Using Upstash Redis

1. **Create Redis Database**: [console.upstash.com](https://console.upstash.com)
2. **Copy Connection Credentials**:
   - REST URL: `https://xxx.upstash.io`
   - REST Token: `xxxxxxxxxxxxx`
3. **Add to Environment Variables**:
   ```bash
   UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxx"
   ```

**Rate Limiting Configuration** (in code):
- Signup: 5 requests / 15 minutes
- Login: 10 requests / 15 minutes
- Password Reset: 3 requests / 15 minutes
- Token Verification: 10 requests / 15 minutes

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select framework: **Next.js**
4. Configure project settings:
   - Root Directory: `./` (default)
   - Build Command: `pnpm build` (default)
   - Install Command: `pnpm install` (default)

### 2. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

Add all variables from `.env.production`:

| Variable                     | Value                          | Environments          |
|------------------------------|--------------------------------|-----------------------|
| `DATABASE_URL`               | `postgresql://...`             | Production, Preview   |
| `S3_ENDPOINT`                | `https://s3.amazonaws.com`     | Production, Preview   |
| `S3_ACCESS_KEY`              | `your_access_key`              | Production            |
| `S3_SECRET_KEY`              | `your_secret_key`              | Production            |
| `S3_BUCKET`                  | `docdb-uploads-prod`           | Production            |
| `JWT_SECRET`                 | `generate_with_openssl`        | Production            |
| `JWT_ACCESS_EXPIRATION`      | `30m`                          | Production, Preview   |
| `JWT_REFRESH_EXPIRATION`     | `30d`                          | Production, Preview   |
| `RESEND_API_KEY`             | `re_xxxxx`                     | Production            |
| `SMTP_FROM`                  | `noreply@yourdomain.com`       | Production, Preview   |
| `NODE_ENV`                   | `production`                   | Production            |
| `NEXT_PUBLIC_APP_URL`        | `https://yourdomain.com`       | Production, Preview   |
| `UPSTASH_REDIS_REST_URL`     | `https://xxx.upstash.io`       | Production, Preview   |
| `UPSTASH_REDIS_REST_TOKEN`   | `xxxxx`                        | Production            |

**Important**: Sensitive variables (secrets, keys, passwords) should only be added to Production environment, NOT Preview/Development.

### 3. Deploy

```bash
# Option 1: Deploy via Git push
git push origin main
# Vercel will automatically deploy

# Option 2: Deploy via Vercel CLI
npx vercel --prod
```

### 4. Run Database Migrations (Post-Deployment)

After first deployment, run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migration command remotely
vercel env pull .env.production.local
export $(cat .env.production.local | xargs)
pnpm prisma migrate deploy
```

**Alternative**: Add migration to `package.json` build script:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Warning**: This approach can fail if database is unreachable during build. Prefer manual migration after first deployment.

---

## Post-Deployment Validation

### 1. Health Check

```bash
# Test API health
curl https://yourdomain.com/api/auth/health

# Expected response
{"status":"ok","timestamp":"2025-12-23T10:00:00.000Z"}
```

### 2. Test Authentication Flow

1. **Signup**: Create test account at `https://yourdomain.com/signup`
2. **Email Verification**: Check email delivery (Resend dashboard)
3. **Login**: Test login at `https://yourdomain.com/login`
4. **JWT Validation**: Check that cookies are set with `Secure; HttpOnly; SameSite=Lax`
5. **Logout**: Test session termination

### 3. Monitor Logs

```bash
# View Vercel logs
vercel logs --follow

# Check for errors
vercel logs | grep ERROR
```

### 4. Test Rate Limiting

```bash
# Attempt 11 login requests (should trigger rate limit after 10)
for i in {1..11}; do
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Request $i"
done

# Expected: 429 Too Many Requests after 10th request
```

### 5. Verify SSL/TLS

```bash
# Test database SSL connection
psql "$DATABASE_URL" -c "SELECT version();"

# Test HTTPS (should show TLS 1.3)
curl -vI https://yourdomain.com 2>&1 | grep "SSL connection"
```

---

## Rollback Procedures

### Rollback Vercel Deployment

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or via Vercel dashboard
# Deployments → Select previous deployment → Promote to Production
```

### Rollback Database Migration

```bash
# View migration history
pnpm prisma migrate status

# Rollback last migration (WARNING: Data loss possible)
# Prisma does not support automatic rollback
# Manual process:
# 1. Identify migration SQL file in prisma/migrations/
# 2. Write DOWN migration manually
# 3. Execute via psql:
psql "$DATABASE_URL" < migrations/down.sql

# Alternative: Restore from backup
# See docker-compose.prod.yml backup service
docker exec docdb-postgres-backup ls /backups/
docker exec -i docdb-postgres-prod psql -U docdb -d docdb < backup.sql
```

**Best Practice**: Test migrations in staging environment before production.

---

## Production Checklist

Before deploying to production, verify:

- [ ] All environment variables configured in Vercel
- [ ] JWT_SECRET generated with `openssl rand -base64 32`
- [ ] Database SSL enabled (`?sslmode=require`)
- [ ] Resend domain verified (check DNS records)
- [ ] Upstash Redis connection tested
- [ ] S3 bucket created and accessible
- [ ] CORS configured for `NEXT_PUBLIC_APP_URL`
- [ ] Database migrations executed (`prisma migrate deploy`)
- [ ] Health check endpoint responding (`/api/auth/health`)
- [ ] Rate limiting tested (429 responses after threshold)
- [ ] Email delivery tested (signup, password reset)
- [ ] Session cookies have `Secure; HttpOnly; SameSite=Lax` flags
- [ ] Error monitoring configured (Sentry, LogRocket, etc.)
- [ ] Database backups scheduled (see `docker-compose.prod.yml`)
- [ ] Token cleanup job scheduled (see `lib/jobs/cleanup-tokens.ts`)

---

## Maintenance

### Token Cleanup Job

The token cleanup job removes expired tokens from the database. To run manually:

```bash
# Local development
pnpm cleanup:tokens

# Production (via Vercel CLI)
vercel env pull .env.production.local
export $(cat .env.production.local | xargs)
pnpm cleanup:tokens
```

**Automated Scheduling**: Add to cron job or GitHub Actions workflow:

```yaml
# .github/workflows/cleanup-tokens.yml
name: Cleanup Expired Tokens
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm cleanup:tokens
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Database Backups

If using Docker Compose production setup (`docker-compose.prod.yml`):

```bash
# Backups are stored in ./backups/ directory
ls -lh backups/

# Restore from backup
docker exec -i docdb-postgres-prod psql -U docdb -d docdb < backups/docdb_20251223_020000.sql
```

**Retention Policy** (configured in `docker-compose.prod.yml`):
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 6 months

### Monitoring Recommendations

- **Uptime**: Use Vercel Analytics or UptimeRobot
- **Error Tracking**: Sentry (add `@sentry/nextjs` package)
- **Performance**: Vercel Speed Insights (built-in)
- **Database**: Monitor connection pool usage, slow queries
- **Email Delivery**: Check Resend dashboard for bounces/failures

---

## Troubleshooting

### Common Issues

**Issue**: `Error: P1001: Can't reach database server`
- **Solution**: Check `DATABASE_URL` SSL mode (`?sslmode=require`), verify firewall allows Vercel IPs

**Issue**: `429 Too Many Requests` on all requests
- **Solution**: Check Upstash Redis connection, verify `UPSTASH_REDIS_REST_TOKEN` is correct

**Issue**: Email not sending
- **Solution**: Verify Resend domain DNS records (SPF, DKIM, DMARC), check API key permissions

**Issue**: JWT tokens invalid after deployment
- **Solution**: Ensure `JWT_SECRET` is same across all deployments, check cookie domain settings

**Issue**: Database migration fails during build
- **Solution**: Run `prisma migrate deploy` manually after deployment, remove from build script

---

## Support

For issues with:
- **Next.js/Vercel**: [vercel.com/docs/support](https://vercel.com/docs/support)
- **Prisma**: [prisma.io/docs](https://www.prisma.io/docs)
- **Resend**: [resend.com/docs](https://resend.com/docs)
- **Upstash**: [upstash.com/docs](https://upstash.com/docs)

For project-specific issues, refer to [README.md](../README.md) or open a GitHub issue.
