# DocDB - Document Management System

Production-ready authentication system built with Next.js, PostgreSQL, and Prisma. Features complete user account management with email verification, password reset, session management, and security monitoring.

---

## Features

### Authentication & Account Management

- **User Registration**: Username/email/password signup with validation
- **Email Verification**: Mandatory email confirmation with 24-hour token expiration
- **Secure Login**: Email or username login with JWT-based sessions
- **Remember Me**: Optional long-duration sessions (30 days) with refresh tokens
- **Account Security**: 
  - Automatic account lockout after 5 failed login attempts (15-minute cooldown)
  - Password strength validation (min 8 chars, uppercase, lowercase, digit, special char)
  - Rate limiting on all authentication endpoints
- **Password Management**:
  - Secure password reset flow with email verification
  - Password hashing with bcrypt (12 rounds)
  - Password strength requirements enforced
- **Profile Management**:
  - Update username (with uniqueness validation)
  - Change email (with verification for new email)
  - Update password (requires current password confirmation)
- **Security Monitoring**:
  - All authentication events logged (login, logout, failed attempts, lockouts)
  - IP address and user agent tracking
  - Security event retention (90 days)

### Technical Highlights

- **JWT Authentication**: Stateless tokens with refresh token rotation
- **Token Blacklisting**: Revoked tokens tracked in database for security
- **RGAA AA Compliance**: Fully accessible UI components with keyboard navigation, ARIA attributes, and screen reader support
- **Automated Cleanup**: Scheduled jobs for expired token removal
- **Production-Ready**: Docker Compose config with SSL, Redis, automated backups
- **Type Safety**: Full TypeScript coverage with Prisma ORM
- **Comprehensive Testing**: Jest unit tests, integration tests, and E2E validation

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | Server-side rendering, API routes, modern React |
| **UI Components** | Tailwind CSS + Headless UI | Accessible, customizable components |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Database** | PostgreSQL 16 | Relational data with SSL support |
| **ORM** | Prisma | Type-safe database queries |
| **Authentication** | JWT (jose library) | Stateless token-based auth |
| **Password Hashing** | bcrypt | Industry-standard password hashing |
| **Email** | Resend (prod) / MailHog (dev) | Transactional emails |
| **Rate Limiting** | Upstash Redis (prod) | Distributed rate limiting |
| **Storage** | MinIO (dev) / S3 (prod) | Object storage for future file uploads |
| **Validation** | Zod | Runtime type validation |
| **Testing** | Jest + React Testing Library | Unit and integration tests |
| **Code Quality** | Biome | Linting and formatting |
| **Deployment** | Vercel | Serverless hosting |

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm** (or npm/yarn)
- **Docker** (for local database and services)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/doc-db.git
   cd doc-db
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

4. **Start Docker services** (PostgreSQL, MinIO, MailHog):
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

6. **Seed database** (optional, creates test users):
   ```bash
   pnpm prisma:seed
   ```

7. **Start development server**:
   ```bash
   pnpm dev
   ```

8. **Open application**: [http://localhost:3000](http://localhost:3000)

### Test Accounts (After Seeding)

| Email | Password | Status | Notes |
|-------|----------|--------|-------|
| `test@example.com` | `Test1234!` | Verified | Main test account |
| `seed_verified@example.com` | `TestPass123!` | Verified | Has active session |
| `seed_unverified@example.com` | `TestPass123!` | Unverified | Email verification pending |
| `seed_locked@example.com` | `TestPass123!` | Locked | Account locked (15 min) |
| `seed_reset@example.com` | `TestPass123!` | Verified | Has password reset token |

**Email Preview**: View sent emails at [http://localhost:8025](http://localhost:8025) (MailHog)

---

## Environment Variables

### Development (.env)

```bash
# Database
DATABASE_URL="postgresql://docdb:docdb_dev_password@localhost:5432/docdb?sslmode=disable"

# S3 (MinIO for local dev)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="docdb"
S3_SECRET_KEY="docdb_dev_password"
S3_BUCKET="docdb-uploads"

# JWT Secrets
JWT_SECRET="dev_secret_change_in_production"
JWT_ACCESS_EXPIRATION="30m"
JWT_REFRESH_EXPIRATION="30d"

# Email (MailHog for local testing)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_FROM="noreply@localhost"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Security Notes**:
- Never commit `.env` files to version control
- Generate strong secrets with `openssl rand -base64 32`
- See [docs/deployment.md](docs/deployment.md) for production environment variables

---

## Project Structure

```
doc-db/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup, etc.)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── profile/
│   ├── api/                # API routes
│   │   └── auth/           # Authentication endpoints
│   ├── actions/            # Server actions
│   └── layout.tsx          # Root layout
├── lib/                    # Business logic
│   ├── actions/            # Server-side actions (auth operations)
│   ├── auth/               # JWT, password, session utilities
│   ├── repositories/       # Database access layer (Prisma)
│   ├── services/           # Business logic (signup, etc.)
│   ├── validation/         # Zod schemas
│   ├── email/              # Email service
│   ├── rate-limit/         # Rate limiting logic
│   ├── security/           # Security event logging
│   └── jobs/               # Background jobs (token cleanup)
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data script
├── tests/                  # Test suites
│   ├── integration/        # Integration tests
│   ├── e2e/                # End-to-end tests
│   └── a11y/               # Accessibility tests
├── docs/                   # Documentation
│   ├── deployment.md       # Production deployment guide
│   └── performance.md      # Performance analysis
├── docker/                 # Docker configuration
│   ├── postgres/           # PostgreSQL configs (SSL certs)
│   └── README.md           # Docker setup instructions
├── docker-compose.yml      # Development services
├── docker-compose.prod.yml # Production services
└── package.json            # Dependencies and scripts
```

---

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/signup` | POST | Create new user account | 5 req / 15 min |
| `/api/auth/verify-email` | POST | Verify email with token | 10 req / 15 min |
| `/api/auth/resend-verification` | POST | Resend verification email | 3 req / 15 min |
| `/api/auth/login` | POST | Login with email/password | 10 req / 15 min |
| `/api/auth/logout` | POST | Logout and revoke tokens | 20 req / 15 min |
| `/api/auth/refresh` | POST | Refresh access token | 20 req / 15 min |
| `/api/auth/forgot-password` | POST | Request password reset | 3 req / 15 min |
| `/api/auth/reset-password` | POST | Reset password with token | 5 req / 15 min |
| `/api/auth/update-profile` | PUT | Update username/email/password | 10 req / 15 min |
| `/api/auth/verify-email-change` | POST | Verify new email address | 10 req / 15 min |

**Example Request**: See [API Documentation](#api-endpoints) section above for curl examples.

---

## Available Scripts

### Development

```bash
pnpm dev                # Start Next.js dev server (localhost:3000)
pnpm lint               # Run Biome linting
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Biome
pnpm type-check         # Run TypeScript type checking
```

### Testing

```bash
pnpm test               # Run Jest unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
pnpm test:integration   # Run integration tests
pnpm test:e2e           # Run end-to-end tests
pnpm test:a11y          # Run accessibility tests
pnpm test:all           # Run all test suites
```

### Database

```bash
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run database migrations
pnpm prisma:studio      # Open Prisma Studio (GUI)
pnpm prisma:seed        # Seed database with test data
```

### Maintenance

```bash
pnpm cleanup:tokens     # Remove expired tokens (run manually)
```

---

## Database Schema

### Core Entities

```
User
  ├── RefreshToken (1:N)
  ├── RevokedToken (1:N)
  ├── EmailVerificationToken (1:N)
  ├── PasswordResetToken (1:N)
  ├── EmailChangeRequest (1:N)
  └── SecurityEvent (1:N)
```

**Key Tables**:
- **users**: User accounts (email, username, password, profile)
- **refresh_tokens**: Long-duration JWT tokens (30 days)
- **revoked_tokens**: Blacklist for invalidated tokens
- **email_verification_tokens**: Email confirmation tokens (24h expiration)
- **password_reset_tokens**: Password reset tokens (1h expiration)
- **email_change_requests**: Pending email changes (1h expiration)
- **security_events**: Audit log (login attempts, lockouts, etc.)

**Performance**: All tables have proper indexes for efficient queries. See [docs/performance.md](docs/performance.md).

---

## Testing

### Run All Tests

```bash
pnpm test:all
```

### Test Coverage

Current coverage targets:
- **Unit Tests**: > 80% coverage (business logic)
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (signup, login, password reset)
- **Accessibility Tests**: All UI components (RGAA AA compliance)

### Generate Coverage Report

```bash
pnpm test:coverage
```

View coverage report: `coverage/lcov-report/index.html`

---

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel dashboard

4. **Run Database Migrations**:
   ```bash
   vercel env pull .env.production.local
   export $(cat .env.production.local | xargs)
   pnpm prisma migrate deploy
   ```

**Detailed Guide**: See [docs/deployment.md](docs/deployment.md) for complete instructions including SSL setup, email configuration, and rollback procedures.

---

## Security Features

### Password Security

- **bcrypt hashing**: 12 rounds (industry standard)
- **Strength requirements**: Min 8 chars, uppercase, lowercase, digit, special char
- **Password validation**: Real-time feedback on signup/reset forms

### Account Protection

- **Rate limiting**: All endpoints protected (5-20 req / 15 min)
- **Account lockout**: 5 failed attempts → 15 minute lockout
- **Email notifications**: Users notified of security events

### Token Management

- **JWT-based authentication**: Stateless tokens with signature verification
- **Refresh token rotation**: Old tokens revoked on renewal
- **Token blacklisting**: Revoked tokens tracked in database
- **Automated cleanup**: Expired tokens removed daily

### Audit Logging

All authentication events logged with IP and user agent:
- Login success/failure
- Account lockouts
- Password resets
- Email changes

**Retention**: Security events kept for 90 days.

---

## Accessibility (RGAA AA Compliance)

All UI components meet RGAA AA standards:

- **Semantic HTML**: Proper use of `<form>`, `<label>`, `<button>`
- **ARIA attributes**: Complete keyboard navigation support
- **Focus management**: Visible focus indicators, logical tab order
- **Color contrast**: WCAG AA compliant (4.5:1 for text)
- **Screen reader support**: Descriptive labels, status announcements
- **Mobile accessibility**: 44x44px touch targets, responsive design

**Testing**: Run `pnpm test:a11y` to verify compliance.

---

## Troubleshooting

### Common Issues

**Issue**: `Error: P1001: Can't reach database server`  
**Solution**: Ensure Docker containers are running (`docker-compose up -d`)

**Issue**: Email not sending in development  
**Solution**: Check MailHog is running at `http://localhost:8025`

**Issue**: `429 Too Many Requests`  
**Solution**: Rate limit exceeded. Wait 15 minutes or adjust limits in `lib/rate-limit/index.ts`

**Issue**: TypeScript errors after schema changes  
**Solution**: Regenerate Prisma client with `pnpm prisma:generate`

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

- **Documentation**: [docs/](docs/)
- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)
- **Performance Analysis**: [docs/performance.md](docs/performance.md)
- **Feature Specification**: [specs/001-user-auth/spec.md](specs/001-user-auth/spec.md)

For issues or questions, open a GitHub issue.

---

## Acknowledgments

Built with modern web technologies and best practices:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Headless UI](https://headlessui.com/) - Accessible UI components
- [Biome](https://biomejs.dev/) - Fast linter and formatter
- [Jest](https://jestjs.io/) - Testing framework

---

**Version**: 0.1.0  
**Last Updated**: 2025-12-23