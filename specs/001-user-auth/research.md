# Research: Authentification utilisateur

**Date**: 2025-12-23  
**Feature**: 001-user-auth  
**Purpose**: Resolve all technical decisions before design phase

---

## Decision 1: Next.js 14 App Router Authentication Patterns

### Context
Need to determine the optimal architecture for authentication in Next.js 14 App Router, including component types, route protection strategy, and session management.

### Options Evaluated
1. **Server Components with Server Actions**
2. **Client Components with API Routes**
3. **Hybrid approach (Client forms + Server Actions)**
4. **Middleware-based protection**

### Decision
**Hybrid approach**: Client Components for forms (real-time validation, UX) + Server Actions for mutations + middleware.ts for route protection + HTTP-only cookies for JWT storage.

### Rationale
- **Client Components for forms**: Enable real-time password strength validation (FR-003), immediate feedback for RGAA compliance (FR-005)
- **Server Actions**: Secure mutation handling, no API route boilerplate, type-safe
- **middleware.ts**: Centralized auth check before route rendering, optimal performance
- **HTTP-only cookies**: Prevents XSS attacks on JWT tokens, secure by default

**Architecture**:
```typescript
// middleware.ts - Route protection
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')
  // Verify JWT, check blacklist
  if (!token && isProtectedRoute) redirect('/login')
}

// app/(auth)/login/page.tsx - Client Component
'use client'
export default function LoginPage() {
  // Form with real-time validation
  async function handleSubmit() {
    await loginAction(formData) // Server Action
  }
}

// lib/actions/auth.ts - Server Action
'use server'
export async function loginAction(data: LoginInput) {
  // Verify credentials, generate JWT
  cookies().set('session', jwt, { httpOnly: true, secure: true })
}
```

### Alternatives Considered
- **Pure Server Components**: Rejected - no real-time validation, poor UX for password strength
- **Pure Client + API Routes**: Rejected - more boilerplate, less type-safe, unnecessary API layer
- **Session in localStorage**: Rejected - vulnerable to XSS, fails security requirements

### References
- Next.js App Router Auth: https://nextjs.org/docs/app/building-your-application/authentication
- Next.js Cookies API: https://nextjs.org/docs/app/api-reference/functions/cookies
- OWASP JWT Storage: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

---

## Decision 2: Prisma Schema Design for Authentication

### Context
Need to design complete Prisma schema for 8 entities with optimal indexing, relationships, and Prisma-specific features.

### Options Evaluated
1. **Normalized schema with separate token tables**
2. **Denormalized schema with JSON fields for tokens**
3. **Hybrid with separate tables for long-lived tokens only**

### Decision
**Normalized schema** with separate tables for each token type, unique indexes on lookups, composite indexes for common queries.

### Rationale
- **Type safety**: Prisma generates types for each entity, catching errors at compile time
- **Query optimization**: Separate tables allow targeted indexes and cleanup queries
- **Clarity**: Each entity has clear purpose, easier to reason about
- **Prisma strengths**: Leverages Prisma's relation handling, cascade deletes, and type generation

**Key Prisma features to use**:
```prisma
model User {
  id                    String   @id @default(uuid())
  username              String   @unique
  usernameNormalized    String   @unique // case-insensitive lookup
  email                 String   @unique
  emailNormalized       String   @unique // case-insensitive lookup
  emailVerified         Boolean  @default(false)
  passwordHash          String
  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastLoginAt           DateTime?
  
  // Relations
  refreshTokens         RefreshToken[]
  securityEvents        SecurityEvent[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens   PasswordResetToken[]
  emailChangeRequests   EmailChangeRequest[]
  
  @@index([usernameNormalized])
  @@index([emailNormalized])
  @@index([lockedUntil])
}

model RefreshToken {
  id              String   @id @default(uuid())
  jti             String   @unique // JWT ID for blacklist lookup
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash       String   // bcrypt hash of refresh token
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  revokedAt       DateTime?
  userAgent       String?
  ipAddress       String?
  
  @@index([userId])
  @@index([expiresAt]) // for cleanup
  @@index([jti, revokedAt]) // blacklist lookup
}
```

**Indexing strategy**:
- Unique indexes: username, email (case-insensitive via normalized fields)
- Composite indexes: `[jti, revokedAt]` for blacklist checks
- Cleanup indexes: `[expiresAt]` for token expiration cleanup
- Foreign key indexes: automatic via Prisma relations

### Alternatives Considered
- **JSON fields for tokens**: Rejected - loses type safety, can't index efficiently, harder to query
- **Single Token table with type discriminator**: Rejected - different expiration/cleanup logic per type, less clear schema

### References
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prisma Indexing: https://www.prisma.io/docs/concepts/components/prisma-schema/indexes
- Prisma Relations: https://www.prisma.io/docs/concepts/components/prisma-schema/relations

---

## Decision 3: JWT Implementation with jose Library

### Context
Need to choose JWT library, signing algorithm, and refresh token strategy for session management with stateless JWT + blacklist.

### Options Evaluated
1. **jose library (modern, standards-compliant)**
2. **jsonwebtoken library (older, widely used)**
3. **HS256 (symmetric) vs RS256 (asymmetric) signing**
4. **Refresh token rotation strategies**

### Decision
**jose** library with **HS256** signing for both access and refresh tokens. **Sliding session** with refresh token rotation on use.

### Rationale
- **jose over jsonwebtoken**: 
  - Modern, actively maintained, better TypeScript support
  - Standards-compliant (RFC 7519, RFC 7515)
  - Smaller bundle size, tree-shakeable
  - Async-first API (better for Edge Runtime)
  
- **HS256 over RS256**:
  - Simpler key management (single secret vs public/private keypair)
  - Sufficient for monolithic Next.js app (no microservices needing public key verification)
  - Faster signing/verification
  - FR-031 doesn't require asymmetric crypto
  
- **Refresh token rotation**:
  - Each refresh generates NEW refresh token + access token
  - Old refresh token invalidated immediately
  - Detects token theft (if old token reused, revoke all user tokens)

**Implementation**:
```typescript
import { SignJWT, jwtVerify } from 'jose'

// Access token (30 min)
const accessToken = await new SignJWT({
  sub: userId,
  type: 'access'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('30m')
  .setJti(crypto.randomUUID()) // for blacklist
  .sign(secret)

// Refresh token (30 days)
const refreshToken = await new SignJWT({
  sub: userId,
  type: 'refresh',
  deviceId: generateDeviceId(userAgent)
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('30d')
  .setJti(crypto.randomUUID())
  .sign(secret)

// Verification with blacklist check
const { payload } = await jwtVerify(token, secret)
const isRevoked = await prisma.revokedToken.findUnique({
  where: { jti: payload.jti }
})
if (isRevoked) throw new Error('Token revoked')
```

### Alternatives Considered
- **jsonwebtoken**: Rejected - older, larger bundle, less TypeScript-friendly
- **RS256**: Rejected - unnecessary complexity for monolithic app, slower
- **Opaque tokens**: Rejected - requires DB lookup on every request, negates JWT stateless benefits
- **No refresh token rotation**: Rejected - less secure, doesn't detect token theft

### References
- jose library: https://github.com/panva/jose
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OAuth 2.0 Token Rotation: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics

---

## Decision 4: Rate Limiting Strategy

### Context
Need rate limiting for signup (FR-021: 3/hour per IP), email resend (FR-038: 3/hour per account), and login attempts (FR-007: 5 consecutive failures).

### Options Evaluated
1. **upstash/ratelimit (Redis-backed)**
2. **Custom in-memory (development)**
3. **Database-backed (PostgreSQL)**
4. **Hybrid (in-memory dev, Redis prod)**

### Decision
**Hybrid approach**: In-memory Map for development, **upstash/ratelimit with Vercel KV** for production.

### Rationale
- **Development simplicity**: In-memory Map sufficient for local Docker environment, no extra services
- **Production scalability**: upstash/ratelimit with Vercel KV for distributed rate limiting across Edge Functions
- **Consistency**: Same API/interface in both environments, easy to swap
- **Vercel alignment**: Native integration with Vercel deployment (FR requirement: Vercel for production)

**Implementation**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isDev = process.env.NODE_ENV === 'development'

// Development: in-memory
const devLimiter = new Map<string, { count: number; resetAt: number }>()

// Production: Vercel KV
const ratelimit = isDev ? null : new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
})

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<{ success: boolean; remaining: number }> {
  if (isDev) {
    // Simple in-memory logic
    const now = Date.now()
    const record = devLimiter.get(key)
    // ... sliding window implementation
  } else {
    const { success, remaining } = await ratelimit.limit(key)
    return { success, remaining }
  }
}

// Usage
const { success } = await checkRateLimit(`signup:${ip}`, 3, 3600)
if (!success) throw new Error('Rate limit exceeded')
```

**Rate limit rules**:
- Signup: `signup:{ip}` → 3 requests per hour
- Email resend: `email-resend:{userId}` → 3 requests per hour  
- Login failures: Stored in User model (failedLoginAttempts + lockedUntil)

### Alternatives Considered
- **Pure PostgreSQL**: Rejected - slower, DB overhead for high-frequency checks
- **Redis in Docker for dev**: Rejected - adds complexity, not needed for single-dev environment
- **No rate limiting in dev**: Rejected - different behavior prod vs dev, harder to test

### References
- upstash/ratelimit: https://github.com/upstash/ratelimit
- Vercel KV: https://vercel.com/docs/storage/vercel-kv
- Rate Limiting Algorithms: https://en.wikipedia.org/wiki/Rate_limiting

---

## Decision 5: Email Service for Local Development

### Context
Need email delivery for verification (FR-034), password reset (FR-010), notifications (FR-008, FR-020). Must work in local Docker environment and production.

### Options Evaluated
1. **nodemailer + MailHog (local SMTP catcher)**
2. **nodemailer + real SMTP (SendGrid, AWS SES)**
3. **react-email for templates**
4. **Resend (modern email API)**

### Decision
**nodemailer** with **MailHog** for development, **Resend** for production. **react-email** for type-safe templates.

### Rationale
- **MailHog for dev**: 
  - Zero-config SMTP server in Docker Compose
  - Web UI to view sent emails (localhost:8025)
  - Perfect for testing without real email delivery
  
- **Resend for production**:
  - Modern, developer-friendly API
  - Excellent deliverability
  - Free tier sufficient for MVP
  - Simple integration with Next.js
  
- **react-email for templates**:
  - Type-safe React components for emails
  - Preview system for development
  - Responsive by default
  - Aligns with React/Next.js stack

**Implementation**:
```typescript
// lib/email/client.ts
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

const isDev = process.env.NODE_ENV === 'development'

const transporter = isDev
  ? nodemailer.createTransport({
      host: 'localhost',
      port: 1025, // MailHog SMTP
      secure: false,
    })
  : null

const resend = isDev ? null : new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  if (isDev) {
    await transporter.sendMail({ from: 'noreply@localhost', to, subject, html })
  } else {
    await resend.emails.send({ from: 'noreply@docdb.app', to, subject, html })
  }
}

// lib/email/templates/verification.tsx (react-email)
import { Html, Button } from '@react-email/components'

export function VerificationEmail({ name, url }: Props) {
  return (
    <Html>
      <h1>Verify your email, {name}</h1>
      <Button href={url}>Verify Email</Button>
    </Html>
  )
}
```

**Docker Compose config**:
```yaml
services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
```

### Alternatives Considered
- **SendGrid/AWS SES**: Rejected - more complex setup, MailHog better for dev
- **Handlebars templates**: Rejected - less type-safe, not React-native
- **No email in dev**: Rejected - can't test flows, different behavior

### References
- MailHog: https://github.com/mailhog/MailHog
- Resend: https://resend.com/docs
- react-email: https://react.email/docs

---

## Decision 6: Docker Compose Setup

### Context
Need local development environment with PostgreSQL (database) and MinIO (S3-compatible storage emulator).

### Options Evaluated
1. **Official PostgreSQL + MinIO images**
2. **Custom Docker images with initialization**
3. **Docker volumes vs bind mounts**
4. **Networking strategies**

### Decision
Official **postgres:16-alpine** + **minio/minio:latest** images with Docker volumes for data persistence and **named network** for service communication.

### Rationale
- **Official images**: Well-maintained, secure, documented
- **Alpine variants**: Smaller image size, faster startup
- **Docker volumes**: Better performance than bind mounts, persist data correctly
- **Named network**: Explicit service discovery, clearer than default network

**docker-compose.yml**:
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: docdb-postgres
    environment:
      POSTGRES_USER: docdb
      POSTGRES_PASSWORD: docdb_dev_password
      POSTGRES_DB: docdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - docdb-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: docdb-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: docdb
      MINIO_ROOT_PASSWORD: docdb_dev_password
    ports:
      - "9000:9000" # API
      - "9001:9001" # Console
    volumes:
      - minio_data:/data
    networks:
      - docdb-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    container_name: docdb-mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - docdb-network

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local

networks:
  docdb-network:
    driver: bridge
```

**.env.local** (Next.js):
```env
DATABASE_URL="postgresql://docdb:docdb_dev_password@localhost:5432/docdb"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="docdb"
S3_SECRET_KEY="docdb_dev_password"
S3_BUCKET="docdb-uploads"
JWT_SECRET="dev_secret_change_in_production"
RESEND_API_KEY=""
NODE_ENV="development"
```

**Makefile** (convenience):
```makefile
.PHONY: dev up down logs migrate

up:
	docker-compose up -d
	@echo "Services started:"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  MinIO: http://localhost:9000 (console: http://localhost:9001)"
	@echo "  MailHog: http://localhost:8025"

down:
	docker-compose down

logs:
	docker-compose logs -f

migrate:
	pnpm prisma migrate dev

dev: up migrate
	pnpm dev
```

### Alternatives Considered
- **Local PostgreSQL/MinIO installation**: Rejected - inconsistent across dev machines, harder onboarding
- **Bind mounts**: Rejected - slower on macOS, permission issues
- **docker-compose v2 syntax**: Rejected - v3.9 more widely compatible

### References
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- MinIO Docker: https://hub.docker.com/r/minio/minio
- Docker Compose Networks: https://docs.docker.com/compose/networking/

---

## Decision 7: Password Hashing Configuration

### Context
Need secure password hashing (FR-023: bcrypt, scrypt, or Argon2) with optimal security/performance balance.

### Options Evaluated
1. **bcrypt (rounds 10-12)**
2. **Argon2 (time/memory cost parameters)**
3. **scrypt (deprecated for passwords)**

### Decision
**bcrypt** with **12 rounds** (cost factor).

### Rationale
- **bcrypt advantages**:
  - Industry standard, battle-tested since 1999
  - Native Node.js module (`bcrypt`), excellent performance
  - Automatic salt generation
  - Simple API, hard to misuse
  - Sufficient for 2025 threat model
  
- **12 rounds**:
  - ~200-300ms per hash (acceptable for auth operations)
  - Resistant to GPU/ASIC attacks with current hardware
  - OWASP recommendation for 2024+
  - SC-003: < 2s auth response time (hashing is ~15% of total)

**Implementation**:
```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

// Hashing (signup, password change)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verification (login)
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

**Security considerations**:
- 12 rounds provides ~200-300ms computation time
- Increases to 13 rounds in 2-3 years as hardware improves
- Protects against rainbow tables (automatic salting)
- Resistant to timing attacks (constant-time comparison)

### Alternatives Considered
- **Argon2**: Rejected - more complex setup, bcrypt sufficient for our scale/threat model
- **10 rounds**: Rejected - too fast, OWASP now recommends 12+
- **14 rounds**: Rejected - too slow (~1s), impacts UX (SC-001: 3min total signup time)
- **scrypt**: Rejected - deprecated for password hashing, use Argon2 or bcrypt instead

### References
- OWASP Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- bcrypt work factor: https://security.stackexchange.com/questions/17207/recommended-of-rounds-for-bcrypt
- Node.js bcrypt: https://github.com/kelektiv/node.bcrypt.js

---

## Decision 8: RGAA Accessibility Patterns for Auth Forms

### Context
All auth interfaces MUST be RGAA AA compliant (FR-005, SC-007: 100% automated test score). Need concrete patterns for forms, errors, state changes.

### Options Evaluated
1. **Headless UI with custom ARIA**
2. **Shadcn/ui components (built on Radix)**
3. **Custom implementation**
4. **React Hook Form + Zod**

### Decision
**Headless UI** (per constitution) + **React Hook Form** + **Zod** validation + **ARIA live regions** for announcements.

### Rationale
- **Headless UI**: Constitutional requirement, accessible by default, focus management built-in
- **React Hook Form**: Integrates with Zod, excellent error handling, accessible by default
- **Zod**: Type-safe validation matching FR requirements, clear error messages
- **ARIA live regions**: Real-time validation feedback for screen readers

**Core accessibility patterns**:

1. **Form fields**:
```tsx
// Signup form with real-time validation
<form onSubmit={handleSubmit(onSubmit)}>
  <label htmlFor="email" className="block text-sm font-medium">
    Email
  </label>
  <input
    id="email"
    type="email"
    aria-describedby={errors.email ? "email-error" : undefined}
    aria-invalid={!!errors.email}
    {...register("email")}
    className="mt-1 block w-full"
  />
  {errors.email && (
    <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
      {errors.email.message}
    </p>
  )}
</form>
```

2. **Password strength indicator** (FR-003 real-time validation):
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  <PasswordStrength value={password} />
  <ul aria-label="Password requirements">
    <li aria-label={hasMinLength ? "8 characters minimum: met" : "8 characters minimum: not met"}>
      {hasMinLength ? "✓" : "○"} 8 characters minimum
    </li>
    {/* ... more criteria */}
  </ul>
</div>
```

3. **Error messages** (FR-005):
```tsx
// Global error (login failed)
<div role="alert" aria-live="assertive" className="error-banner">
  <span className="sr-only">Error:</span>
  Invalid credentials. Please try again.
</div>
```

4. **Loading states**:
```tsx
<button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
  {isSubmitting ? (
    <>
      <span className="sr-only">Logging in...</span>
      <Spinner aria-hidden="true" />
    </>
  ) : (
    "Log In"
  )}
</button>
```

5. **Email verification banner** (account not verified):
```tsx
<div role="alert" className="banner-warning">
  <h2 id="verification-heading">Email Verification Required</h2>
  <p id="verification-description">
    Check your inbox for a verification link.
  </p>
  <button
    aria-describedby="verification-description"
    onClick={resendEmail}
  >
    Resend Email
  </button>
</div>
```

**Testing strategy** (SC-007):
- Automated: axe-core in Jest tests, Lighthouse CI
- Manual: Screen reader testing (NVDA/JAWS/VoiceOver)
- Keyboard navigation: Tab order, Enter/Space activation, Escape cancellation

**RGAA 4.1 criteria coverage**:
- 1.3: Info and Relationships (semantic HTML, labels, ARIA)
- 2.1: Keyboard Accessible (no mouse-only interactions)
- 2.4: Navigable (focus visible, logical tab order)
- 3.2: Predictable (consistent navigation, no context changes)
- 3.3: Input Assistance (labels, errors, suggestions)
- 4.1: Compatible (valid HTML, ARIA, name/role/value)

### Alternatives Considered
- **Pure custom forms**: Rejected - high risk of accessibility bugs, more work
- **Material UI**: Rejected - not in constitution (Headless UI required)
- **No ARIA**: Rejected - fails RGAA requirements, screen reader users excluded

### References
- RGAA 4.1: https://accessibilite.numerique.gouv.fr/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- React Hook Form Accessibility: https://react-hook-form.com/advanced-usage#Accessibility
- Headless UI: https://headlessui.com/

---

## Decision 9: PostgreSQL Connection Security (SSL/TLS)

### Context
Need to determine SSL/TLS configuration for PostgreSQL connections in development (Docker Compose) and production (Vercel + managed PostgreSQL).

### Options Evaluated
1. **No SSL (insecure)**
2. **SSL optional (sslmode=prefer)**
3. **SSL required for production only (sslmode=require)**
4. **SSL required everywhere with certificate validation**

### Decision
**Environment-specific configuration**:
- **Development (Docker Compose)**: No SSL (`sslmode=disable`) - local connections only
- **Production (Vercel)**: SSL required (`sslmode=require`) - managed database with TLS

### Rationale
**Development**:
- Connections are localhost-only within Docker network
- No exposure to external networks
- Simplified setup, faster development
- SSL overhead unnecessary for local dev

**Production**:
- Database hosted on external service (Vercel Postgres, Supabase, etc.)
- Connections over public internet MUST be encrypted
- Managed providers enforce SSL by default
- Prevents credential theft and man-in-the-middle attacks

**Implementation**:
```env
# .env.local (Development)
DATABASE_URL="postgresql://docdb:docdb_dev_password@localhost:5432/docdb?sslmode=disable"

# .env.production (Production - Vercel)
DATABASE_URL="postgresql://user:password@db.region.provider.com:5432/dbname?sslmode=require"
```

**Prisma Configuration**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Prisma automatically respects sslmode in connection string
}
```

**Vercel Postgres automatic SSL**:
- Vercel Postgres enforces SSL by default
- Connection string includes `?sslmode=require` automatically
- No additional configuration needed

### Security Considerations
- ✅ **FR-043** (Secure password storage): SSL prevents credentials exposure in transit
- ✅ **FR-044** (HTTPS enforced): Complements application-level HTTPS
- ✅ Defense in depth: Application (HTTPS) + Database (SSL) both encrypted

**Certificate validation** (`sslmode=verify-full`):
- Not required for managed providers (Vercel Postgres, Supabase)
- Provider handles certificate management
- Connection string specifies required SSL, provider enforces valid certificates

### Alternatives Considered
- **Always SSL (dev + prod)**: Rejected - unnecessary overhead for local Docker, complicates dev setup
- **sslmode=prefer**: Rejected - production should enforce SSL, not make it optional
- **Self-signed certificates in dev**: Rejected - complexity without security benefit for localhost

### References
- PostgreSQL SSL Support: https://www.postgresql.org/docs/current/libpq-ssl.html
- Prisma Database Connection: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- Vercel Postgres Security: https://vercel.com/docs/storage/vercel-postgres/security
- OWASP Database Security: https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html

---

## Summary of Decisions

| # | Topic | Decision | Key Rationale |
|---|-------|----------|---------------|
| 1 | Next.js Auth Patterns | Hybrid: Client forms + Server Actions + middleware.ts + HTTP-only cookies | Real-time UX, secure, type-safe, optimal performance |
| 2 | Prisma Schema | Normalized schema, separate token tables, strategic indexes | Type safety, query optimization, Prisma strengths |
| 3 | JWT Implementation | jose library, HS256, refresh token rotation | Modern, standards-compliant, sufficient security |
| 4 | Rate Limiting | In-memory (dev), upstash/ratelimit + Vercel KV (prod) | Simple dev setup, scalable production |
| 5 | Email Service | MailHog (dev), Resend (prod), react-email templates | Zero-config dev, modern prod API, type-safe templates |
| 6 | Docker Compose | postgres:16-alpine + minio/minio + mailhog, named network | Official images, data persistence, clear networking |
| 7 | Password Hashing | bcrypt with 12 rounds | Industry standard, optimal security/performance (200-300ms) |
| 8 | RGAA Accessibility | Headless UI + React Hook Form + Zod + ARIA live regions | Constitutional compliance, comprehensive a11y coverage |
| 9 | PostgreSQL SSL/TLS | Dev: no SSL (localhost), Prod: SSL required (managed DB) | Secure production connections, simplified dev setup |

---

## Completion Checklist

- ✅ All 9 research tasks completed
- ✅ All decisions documented with rationale
- ✅ All alternatives considered and rejected
- ✅ References provided for each decision
- ✅ No NEEDS CLARIFICATION remaining
- ✅ Ready for Phase 1 (Design)

**Next Phase**: Create data-model.md, contracts/, and quickstart.md based on these research decisions.
