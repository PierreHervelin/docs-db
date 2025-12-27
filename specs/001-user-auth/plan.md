
# Implementation Plan: Authentification utilisateur

## Core Principles

### User-Centric Document Access
The system MUST provide a clear, accessible interface for users to search, view, and archive documents. All features MUST be designed for simplicity and clarity.

### Accessibility (RGAA Compliance)
All user-facing features MUST comply with RGAA accessibility standards. Accessibility is non-negotiable and must be validated for every release.

### Test-Driven Development & Quality Gates
All business logic MUST be covered by Jest tests. Every feature MUST be tested with MCP Chrome DevTools. Linting MUST pass with Biome before merge. No code is considered done until these gates are met.

### Modern Web Stack Discipline
The stack is Next.js (Vercel), S3, PostgreSQL, Tailwind CSS, Headless UI. All code MUST use these technologies unless a justified exception is approved in writing.

### Independent, Incremental Delivery
Each user story/feature MUST be independently testable and deliver value on its own. Features are delivered incrementally, with each increment validated before proceeding.

### Language and Style Discipline
All code MUST be written in English. All specifications (spec.md, user stories, requirements) MUST be written in French. No emoji are permitted in any code, documentation, or specifications.

**Branch**: `001-user-auth` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-auth/spec.md`
**Additional Input**: "en prenant en compte que pour l'instant on reste sur du local, je veux un docker-compose avec une base de donnée postgre et un émulateur de s3. J'ai oublié de préciser mais je veux utiliser prisma comme orm"

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Système d'authentification complet avec création de compte (username/email/password), connexion, vérification d'email obligatoire, réinitialisation de mot de passe, gestion de sessions JWT avec refresh tokens (option "Se souvenir de moi"), et protection contre les attaques (rate limiting, verrouillage après 5 échecs). Architecture extensible pour OAuth2 futur. Développement local avec Docker Compose (PostgreSQL + émulateur S3), Prisma ORM, Next.js frontend.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)  
**Primary Dependencies**: Next.js, Prisma ORM, jose (JWT), bcrypt, nodemailer, zod (validation), Tailwind CSS, Headless UI  
**Storage**: PostgreSQL (via Docker Compose, SSL disabled for localhost), MinIO (S3-compatible emulator via Docker Compose)  
**Testing**: Jest (unit/integration), React Testing Library, MCP Chrome DevTools (E2E validation)  
**Target Platform**: Web application (development: localhost with Docker Compose, production: Vercel with SSL-enabled PostgreSQL)
**Project Type**: Web application (Next.js fullstack with App Router)  
**Performance Goals**: < 2s response time for auth operations, support 1000 concurrent users, < 60s email delivery (99%)  
**Constraints**: RGAA AA compliance mandatory, JWT stateless with blacklist for revocation, 30min session / 30 days refresh token, local dev environment with Docker, SSL required for production database connections  
**Scale/Scope**: MVP authentication system, ~15 API routes, 8 UI pages/components, 8 database entities, extensible for OAuth2


## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Phase 0)

- ✅ Next.js (App Router) pour frontend et API routes
- ✅ Tailwind CSS + Headless UI pour UI
- ✅ PostgreSQL + Prisma ORM pour base de données
- ✅ S3 (émulateur MinIO en dev) pour stockage futur
- ✅ Vercel pour déploiement (production)
- ✅ Jest pour tests business logic
- ✅ MCP Chrome DevTools pour validation E2E
- ✅ Biome pour linting
- ✅ RGAA compliance (sera validée dans chaque composant UI)
- ✅ Features independently testable (5 user stories prioritized)

**Status**: ✅ PASSED

### Post-Phase 1 Re-evaluation (After Design)

*Date: 2025-12-23*

**Design Artifacts Reviewed**:
- research.md: 8 technical decisions documented
- data-model.md: 8 entities with Prisma schema
- contracts/auth-api.openapi.yml: 9 API endpoints
- quickstart.md: Developer onboarding guide

**Constitution Compliance Verification**:

✅ **Core Principle I (User-Centric Document Access)**: Authentication provides foundation for secure document access. All UI flows prioritize simplicity (minimal fields, clear error messages, progressive disclosure).

✅ **Core Principle II (Accessibility/RGAA)**: All endpoints return RGAA-compliant error messages. Design includes ARIA live regions, keyboard navigation, screen reader compatibility. Accessibility tests required (test:a11y).

✅ **Core Principle III (TDD & Quality Gates)**: Plan includes comprehensive test strategy (Jest unit/integration, MCP Chrome DevTools E2E, 100% business logic coverage, accessibility validation with axe-core).

✅ **Core Principle IV (Modern Web Stack Discipline)**: Next.js App Router ✅, Tailwind CSS ✅, Headless UI ✅, PostgreSQL with Prisma ORM ✅, S3/MinIO ✅, Vercel (prod) ✅. All stack requirements met.

✅ **Core Principle V (Independent, Incremental Delivery)**: 5 user stories prioritized (P1-P3). Each can be tested independently. MVP includes signup/login (P1), then password reset (P2), then profile update (P3).

✅ **Core Principle VI (Language and Style Discipline)**: All code in English ✅ (schema, contracts, comments). All spec/requirements in French ✅. No emojis in artifacts ✅.

**Stack & Requirements**:
- ✅ Frontend: Next.js + Tailwind CSS + Headless UI
- ✅ Backend/Deployment: Vercel
- ✅ Storage: S3 (MinIO emulator for dev)
- ✅ Database: PostgreSQL with Prisma ORM
- ✅ Testing: Jest + MCP Chrome DevTools
- ✅ Linting: Biome
- ✅ Accessibility: RGAA mandatory (validated in E2E tests)

**New Technologies Added** (via research.md):
- Prisma ORM - Now part of constitution (v2.1.0, 2025-12-23)
- PostgreSQL SSL/TLS - Environment-specific: disabled for dev (localhost), required for production (Decision 9)
- jose (JWT library) - Justified: Modern, standards-compliant, recommended for Next.js
- bcrypt (password hashing) - Justified: Industry standard, secure
- nodemailer (email) - Justified: Constitution allows email service, flexible for dev/prod
- zod (validation) - Justified: Type-safe validation, complements Prisma/TypeScript
- Docker Compose (dev environment) - Justified: User requirement for local dev
- react-email (email templates) - Justified: Type-safe HTML emails, React-based

**Security Measures**:
- ✅ SSL/TLS for production database connections (`sslmode=require`)
- ✅ HTTP-only cookies for JWT storage (XSS prevention)
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (account lockout, IP-based throttling)
- ✅ HTTPS enforced (Vercel automatic)

**Deviations from Constitution**: None.

**Final Status**: ✅ **PASSED** - All constitutional principles upheld. Prisma ORM officially added to constitution v2.1.0. Security hardened with SSL/TLS for production. Design phase complete. Ready for Phase 2 (implementation tasks).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js App Router structure (web application)
app/
├── (auth)/                      # Auth route group
│   ├── login/
│   │   └── page.tsx            # Login page (P1)
│   ├── signup/
│   │   └── page.tsx            # Signup page (P1)
│   ├── verify-email/
│   │   └── page.tsx            # Email verification (P1)
│   ├── forgot-password/
│   │   └── page.tsx            # Password reset request (P2)
│   ├── reset-password/
│   │   └── page.tsx            # Password reset form (P2)
│   └── settings/
│       └── page.tsx            # Account settings (P3)
├── api/
│   └── auth/
│       ├── signup/
│       │   └── route.ts        # POST /api/auth/signup
│       ├── login/
│       │   └── route.ts        # POST /api/auth/login
│       ├── logout/
│       │   └── route.ts        # POST /api/auth/logout
│       ├── verify-email/
│       │   └── route.ts        # POST /api/auth/verify-email
│       ├── resend-verification/
│       │   └── route.ts        # POST /api/auth/resend-verification
│       ├── forgot-password/
│       │   └── route.ts        # POST /api/auth/forgot-password
│       ├── reset-password/
│       │   └── route.ts        # POST /api/auth/reset-password
│       ├── refresh/
│       │   └── route.ts        # POST /api/auth/refresh
│       └── update-profile/
│           └── route.ts        # PUT /api/auth/update-profile
├── components/
│   └── auth/
│       ├── SignupForm.tsx      # Signup form with validation
│       ├── LoginForm.tsx       # Login form with Remember Me
│       ├── PasswordStrength.tsx # Password strength indicator
│       ├── EmailVerificationBanner.tsx
│       └── AccountSettings.tsx # Profile update form
└── middleware.ts               # Auth middleware for protected routes

lib/
├── auth/
│   ├── jwt.ts                  # JWT generation/validation
│   ├── password.ts             # bcrypt hash/verify
│   ├── tokens.ts               # Token generation (reset, verify)
│   └── validation.ts           # Zod schemas for auth inputs
├── email/
│   ├── client.ts               # Nodemailer setup
│   └── templates/
│       ├── verification.ts     # Email verification template
│       ├── password-reset.ts   # Password reset template
│       ├── account-locked.ts   # Account locked notification
│       └── password-changed.ts # Password changed notification
├── db/
│   └── prisma.ts               # Prisma client singleton
└── utils/
    ├── rate-limit.ts           # Rate limiting utility
    └── logger.ts               # Security event logger

prisma/
├── schema.prisma               # Database schema (8 entities)
├── migrations/                 # Prisma migrations
└── seed.ts                     # Optional seed data

tests/
├── unit/
│   ├── auth/
│   │   ├── jwt.test.ts
│   │   ├── password.test.ts
│   │   └── validation.test.ts
│   └── email/
│       └── templates.test.ts
├── integration/
│   └── api/
│       ├── signup.test.ts
│       ├── login.test.ts
│       ├── verify-email.test.ts
│       ├── forgot-password.test.ts
│       ├── reset-password.test.ts
│       └── refresh.test.ts
└── e2e/
    └── auth-flows.spec.ts      # MCP Chrome DevTools validation

docker/
├── docker-compose.yml          # PostgreSQL + MinIO
├── postgres/
│   └── init.sql               # Initial DB setup (optional)
└── minio/
    └── config.json            # MinIO configuration

.env.local                      # Local environment variables
.env.example                    # Example environment config
```

**Structure Decision**: Next.js App Router avec route groups pour l'authentification. API Routes colocalisées sous `/app/api/auth/`. Prisma pour l'ORM avec migrations. Docker Compose pour services locaux (PostgreSQL + MinIO). Structure alignée avec les best practices Next.js 14+.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | All stack requirements met per constitution v2.1.0 | N/A |

**Note**: Prisma ORM was previously an exception but is now officially part of the constitution as of version 2.1.0 (2025-12-23).


---

## Phase 0: Outline & Research

### Objectives
- Resolve all technical unknowns from Technical Context
- Research best practices for each technology choice
- Document decisions with rationale

### Research Tasks

**Generated from Technical Context analysis**:

1. **Next.js 14 App Router authentication patterns**
   - Research: Server Components vs Client Components for auth forms
   - Research: middleware.ts best practices for route protection
   - Research: Cookie-based JWT storage with httpOnly flags
   - Decision target: Architecture pattern for session management

2. **Prisma schema design for authentication**
   - Research: Best practices for user models with Prisma
   - Research: Prisma indexing strategies for username/email lookups
   - Research: Handling token tables (blacklist, refresh, verification) with Prisma
   - Decision target: Complete Prisma schema structure

3. **JWT implementation with jose library**
   - Research: jose vs jsonwebtoken library comparison
   - Research: JWT signing algorithms (HS256 vs RS256)
   - Research: Refresh token rotation strategies
   - Decision target: JWT configuration and token pair architecture

4. **Rate limiting in Next.js**
   - Research: In-memory vs database-backed rate limiting
   - Research: upstash/ratelimit vs custom implementation
   - Research: Rate limiting per IP vs per user
   - Decision target: Rate limiting strategy for local dev and production

5. **Email service for local development**
   - Research: nodemailer with local SMTP vs MailHog/MailCatcher
   - Research: Email template libraries (react-email vs handlebars)
   - Decision target: Email architecture for dev and production

6. **Docker Compose setup**
   - Research: PostgreSQL Docker image configuration
   - Research: MinIO setup for S3-compatible local storage
   - Research: Networking between Next.js and Docker services
   - Decision target: docker-compose.yml structure

7. **Password hashing with bcrypt**
   - Research: bcrypt rounds configuration (security vs performance)
   - Research: bcrypt vs Argon2 for Next.js
   - Decision target: Password hashing algorithm and configuration

8. **RGAA accessibility for auth forms**
   - Research: ARIA labels for form validation errors
   - Research: Screen reader announcements for auth state changes
   - Research: Keyboard navigation for auth flows
   - Decision target: Accessibility patterns for all auth components

### Output

→ **File**: `specs/001-user-auth/research.md`

Structure:
```markdown
# Research: Authentification utilisateur

## Decision 1: [Topic]
- **Context**: [What we need to decide]
- **Options Evaluated**: [What we looked at]
- **Decision**: [What we chose]
- **Rationale**: [Why we chose it]
- **Alternatives Considered**: [What else we evaluated and why rejected]
- **References**: [Links to docs, articles, benchmarks]

[Repeat for each research task...]
```

**Completion Criteria**:
- All NEEDS CLARIFICATION from Technical Context resolved
- All research tasks have documented decisions
- All decisions have clear rationale with alternatives considered
- research.md created and committed


---

## Phase 1: Design & Contracts

**Prerequisites**: research.md complete, all decisions made

### Objectives
- Define complete data model based on Key Entities from spec
- Generate API contracts for all endpoints
- Create quickstart guide for local development
- Update agent context with new technologies

### Tasks

#### 1. Data Model Design

**Extract entities from spec.md Key Entities section** → `data-model.md`

**Entities to model**:
1. User (Utilisateur)
2. Session (JWT metadata only - no DB table needed)
3. RevokedToken (Blacklist)
4. RefreshToken
5. EmailVerificationToken
6. PasswordResetToken
7. SecurityEvent
8. EmailChangeRequest

**For each entity, define**:
- Entity name and purpose
- All attributes with types
- Validation rules from spec (FR-001 to FR-048)
- Relationships to other entities
- Indexes for performance
- State transitions (where applicable)

**Example format**:
```markdown
### Entity: User

**Purpose**: Represents a person with an account in the system

**Attributes**:
- id: UUID (primary key, auto-generated)
- username: String (unique, 3-30 chars, alphanumeric + dash + underscore)
- email: String (unique, RFC 5322 compliant, case-insensitive for lookup)
- emailVerified: Boolean (default: false)
- passwordHash: String (bcrypt hash)
- failedLoginAttempts: Integer (default: 0)
- lockedUntil: DateTime? (null if not locked)
- createdAt: DateTime (auto)
- updatedAt: DateTime (auto)
- lastLoginAt: DateTime?

**Validation Rules**:
- FR-025: username 3-30 chars, alphanumeric + - + _
- FR-002: email RFC 5322 compliant
- FR-003: password min 8 chars, uppercase, lowercase, digit, special char
- FR-024: username case-insensitive for login, case-preserved for display

**Relationships**:
- User 1:N RefreshToken
- User 1:N SecurityEvent
- User 1:N EmailVerificationToken
- User 1:N PasswordResetToken
- User 1:N EmailChangeRequest

**Indexes**:
- username (unique, case-insensitive)
- email (unique, case-insensitive)
- lockedUntil (for cleanup queries)

**State Transitions**:
- New → EmailUnverified (on signup)
- EmailUnverified → Active (on email verification)
- Active → Locked (after 5 failed login attempts)
- Locked → Active (after 15 minutes)
- Active → Active (on successful login, reset failedLoginAttempts)
```

**Output**: `specs/001-user-auth/data-model.md`

#### 2. API Contracts Generation

**Generate OpenAPI/REST contracts** from functional requirements → `/contracts/`

**Endpoints to define** (from FR and user stories):

1. `POST /api/auth/signup`
   - Input: { username, email, password }
   - Output: { userId, message } or error
   - Errors: 400 (validation), 409 (duplicate), 500 (email send failed)

2. `POST /api/auth/login`
   - Input: { login (email or username), password, rememberMe }
   - Output: { accessToken, refreshToken?, user } or error
   - Errors: 401 (invalid credentials), 423 (account locked), 403 (email not verified)

3. `POST /api/auth/logout`
   - Input: { refreshToken? }
   - Output: { success: true }
   - Auth: Required (Bearer token)

4. `POST /api/auth/verify-email`
   - Input: { token }
   - Output: { accessToken, user }
   - Errors: 400 (invalid/expired token)

5. `POST /api/auth/resend-verification`
   - Input: { email }
   - Output: { message }
   - Errors: 429 (rate limit), 500 (email send failed)

6. `POST /api/auth/forgot-password`
   - Input: { email }
   - Output: { message } (same for existing/non-existing email)
   - Errors: 429 (rate limit), 500 (email send failed)

7. `POST /api/auth/reset-password`
   - Input: { token, newPassword }
   - Output: { message }
   - Errors: 400 (invalid/expired token, weak password)

8. `POST /api/auth/refresh`
   - Input: { refreshToken }
   - Output: { accessToken }
   - Errors: 401 (invalid/expired/revoked token)

9. `PUT /api/auth/update-profile`
   - Input: { username?, email?, currentPassword?, newPassword? }
   - Output: { user, message }
   - Auth: Required
   - Errors: 400 (validation), 401 (wrong password), 409 (duplicate username/email)

**Format**: OpenAPI 3.0 YAML or JSON

**Output**: `specs/001-user-auth/contracts/auth-api.openapi.yml`

#### 3. Quickstart Guide

**Create developer onboarding document** → `quickstart.md`

**Sections**:
1. Prerequisites (Node.js 18+, Docker, pnpm)
2. Initial Setup
   - Clone repo
   - Copy .env.example to .env.local
   - Start Docker services: `docker-compose up -d`
   - Install dependencies: `pnpm install`
   - Run Prisma migrations: `pnpm prisma migrate dev`
3. Running the App
   - Dev server: `pnpm dev`
   - Access: http://localhost:3000
4. Running Tests
   - Unit tests: `pnpm test`
   - Integration tests: `pnpm test:integration`
   - E2E tests: `pnpm test:e2e`
5. Key URLs
   - App: http://localhost:3000
   - PostgreSQL: localhost:5432
   - MinIO: http://localhost:9000
   - Prisma Studio: `pnpm prisma studio`
6. Testing Auth Flows
   - Signup flow walkthrough
   - Login flow walkthrough
   - Password reset flow walkthrough
7. Troubleshooting
   - Docker services not starting
   - Prisma connection issues
   - Email delivery in dev

**Output**: `specs/001-user-auth/quickstart.md`

#### 4. Agent Context Update

**Run agent context update script**:

```bash
.specify/scripts/bash/update-agent-context.sh copilot
```

**Technologies to add**:
- Prisma ORM (PostgreSQL client)
- jose (JWT library)
- bcrypt (password hashing)
- nodemailer (email sending)
- zod (validation)
- Docker Compose (local services)

**Script will**:
- Detect Copilot as current agent
- Update `.github/copilot-instructions.md`
- Add new technologies between markers
- Preserve manual additions

### Re-Evaluation: Constitution Check Post-Design

**After data model and contracts are designed, verify**:

- ✅ All API routes use Next.js App Router conventions
- ✅ All database operations use Prisma (not raw SQL)
- ✅ All UI components will use Tailwind CSS + Headless UI
- ✅ No additional frameworks introduced beyond research decisions
- ✅ RGAA patterns documented for all auth forms
- ✅ Jest test structure defined for all business logic
- ✅ All features independently testable (each endpoint can be tested in isolation)

**If violations found**: Update Complexity Tracking table with justification

### Output Files

- `specs/001-user-auth/data-model.md` (complete entity definitions)
- `specs/001-user-auth/contracts/auth-api.openapi.yml` (9 endpoints documented)
- `specs/001-user-auth/quickstart.md` (developer onboarding)
- `.github/copilot-instructions.md` (updated with new tech stack)

**Completion Criteria**:
- All 8 entities fully defined with attributes, relationships, indexes
- All 9 API endpoints documented with OpenAPI spec
- Quickstart guide complete and validated (can be followed by new developer)
- Agent context updated and committed
- Constitution Check re-evaluated and passed


---

## Phase 2: Implementation Planning

**Prerequisites**: Phase 1 complete (data-model.md, contracts/, quickstart.md created)

### Stop Point

⚠️ **This phase is NOT executed by `/speckit.plan`**

The `/speckit.plan` command stops after Phase 1 design artifacts are generated.

### Next Steps

**To continue implementation planning**, run:

```bash
/speckit.tasks
```

This will generate `tasks.md` with:
- Prioritized task breakdown
- Dependencies between tasks
- Effort estimates
- Testing requirements for each task
- Acceptance criteria mapped to FR and user stories

### Expected Output (from `/speckit.tasks`)

`specs/001-user-auth/tasks.md` will contain:
- Phase 2A: Infrastructure Setup (Docker, Prisma, env config)
- Phase 2B: Core Auth Logic (JWT, password hashing, validation)
- Phase 2C: API Routes (9 endpoints)
- Phase 2D: UI Components (auth forms, RGAA compliant)
- Phase 2E: Testing (Jest unit, integration, E2E with MCP)
- Phase 2F: Documentation & Deployment


---

## Summary & Next Actions

### ✅ Completed by `/speckit.plan`

1. **Setup**: Feature branch `001-user-auth` created, plan.md initialized
2. **Context Loading**: spec.md and constitution.md analyzed
3. **Technical Context**: Filled with Next.js, Prisma, JWT, Docker Compose details
4. **Constitution Check**: Passed with 1 justified exception (Prisma ORM)
5. **Project Structure**: Complete directory tree defined for Next.js App Router
6. **Phase 0 Planned**: 8 research tasks identified (to be executed)
7. **Phase 1 Planned**: Data model, contracts, quickstart guide tasks defined (to be executed)

### 🚧 To Execute Next

**Phase 0: Research** (Execute now or delegate to subagent):
```
For each research task in Phase 0:
  1. Research the topic using context7, documentation, and best practices
  2. Document decision with rationale in research.md
  3. Consider alternatives and explain why chosen approach is best
```

**Phase 1: Design** (After Phase 0 complete):
```
1. Create data-model.md with all 8 entities fully defined
2. Generate contracts/auth-api.openapi.yml with all 9 endpoints
3. Write quickstart.md for developer onboarding
4. Run update-agent-context.sh to add new technologies
5. Re-evaluate Constitution Check
```

**Phase 2: Tasks** (After Phase 1 complete):
```
Run: /speckit.tasks
This generates implementation task breakdown in tasks.md
```

### Branch & Files

**Current Branch**: `001-user-auth`

**Files Created/Modified**:
- ✅ `specs/001-user-auth/plan.md` (this file)
- ⏳ `specs/001-user-auth/research.md` (Phase 0 output)
- ⏳ `specs/001-user-auth/data-model.md` (Phase 1 output)
- ⏳ `specs/001-user-auth/contracts/auth-api.openapi.yml` (Phase 1 output)
- ⏳ `specs/001-user-auth/quickstart.md` (Phase 1 output)
- ⏳ `.github/copilot-instructions.md` (Phase 1 update)
- ⏳ `specs/001-user-auth/tasks.md` (Phase 2 via `/speckit.tasks`)

### Recommendation

**Execute Phase 0 research** now to resolve all technical decisions before proceeding to design phase.

**Command to proceed**:
```
Continue with Phase 0 research tasks. For each research task, create detailed findings in research.md.
```
