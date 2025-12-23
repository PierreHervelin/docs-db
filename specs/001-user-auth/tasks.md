# Tasks: Authentification utilisateur

## Core Principles

### User-Centric Document Access
The system MUST provide a clear, accessible interface for users to search, view, and archive documents. All features MUST be designed for simplicity and clarity.

### Accessibility (RGAA Compliance)
All user-facing features MUST comply with RGAA accessibility standards. Accessibility is non-negotiable and must be validated for every release.

### Test-Driven Development & Quality Gates
All business logic MUST be covered by Jest tests. Every feature MUST be tested with MCP Chrome DevTools. Linting MUST pass with Biome before merge. No code is considered done until these gates are met.

### Modern Web Stack Discipline
The stack is Next.js (Vercel), S3, PostgreSQL with Prisma ORM, Tailwind CSS, Headless UI. All code MUST use these technologies unless a justified exception is approved in writing.

### Independent, Incremental Delivery
Each user story/feature MUST be independently testable and deliver value on its own. Features are delivered incrementally, with each increment validated before proceeding.

### Language and Style Discipline
All code MUST be written in English. All specifications (spec.md, user stories, requirements) MUST be written in French. No emoji are permitted in any code, documentation, or specifications.

**Branch**: `001-user-auth`  
**Input**: Design documents from `/specs/001-user-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Definition of Done (DoD):**
- All business logic MUST be tested with Jest
- Each feature MUST be tested with MCP Chrome DevTools
- Linting MUST pass with Biome
- All user-facing features MUST be RGAA compliant (accessibility)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Note**: Tests are integrated throughout based on TDD requirements (Core Principle III).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Next.js 14 App Router project structure per plan.md
- [ ] T002 Initialize package.json with dependencies: next, react, prisma, jose, bcrypt, nodemailer, zod, react-email, tailwindcss, @headlessui/react
- [ ] T003 [P] Configure Biome linting in biome.json per constitution
- [ ] T004 [P] Configure TypeScript in tsconfig.json with strict mode
- [ ] T005 [P] Configure Tailwind CSS in tailwind.config.js
- [ ] T006 Create docker-compose.yml with PostgreSQL 16-alpine, MinIO, MailHog services per research.md Decision 6
- [ ] T007 Create .env.example with all required environment variables per quickstart.md
- [ ] T008 [P] Setup Jest configuration in jest.config.js for unit and integration tests
- [ ] T009 [P] Setup MCP Chrome DevTools configuration for E2E testing

**Checkpoint**: Development environment ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create Prisma schema in prisma/schema.prisma with 8 entities from data-model.md
- [ ] T011 Create initial migration: `pnpm prisma migrate dev --name init`
- [ ] T012 [P] Implement JWT utilities in lib/auth/jwt.ts using jose (sign, verify, create access/refresh tokens) per research.md Decision 3
- [ ] T013 [P] Implement password hashing utilities in lib/auth/password.ts using bcrypt with 12 rounds per research.md Decision 7
- [ ] T014 [P] Implement email service abstraction in lib/email/service.ts supporting MailHog (dev) and Resend (prod) per research.md Decision 5
- [ ] T015 [P] Create email templates using react-email in emails/: verification.tsx, password-reset.tsx, security-alert.tsx, email-change.tsx
- [ ] T016 [P] Implement rate limiter in lib/rate-limit/index.ts (in-memory for dev, upstash for prod) per research.md Decision 4
- [ ] T017 [P] Implement validation schemas in lib/validation/auth.ts using zod for all auth inputs
- [ ] T018 Create middleware.ts for JWT validation and route protection per research.md Decision 1
- [ ] T019 [P] Implement error handling utilities in lib/errors/index.ts with RGAA-compliant messages
- [ ] T020 [P] Implement security event logger in lib/security/logger.ts for SecurityEvent entity
- [ ] T021 [P] Create Prisma client singleton in lib/db/prisma.ts

**Unit Tests (Foundational)**:
- [ ] T022 [P] Write tests for JWT utilities in lib/auth/jwt.test.ts (sign, verify, expiration, blacklist)
- [ ] T023 [P] Write tests for password utilities in lib/auth/password.test.ts (hash, compare, timing attack resistance)
- [ ] T024 [P] Write tests for validation schemas in lib/validation/auth.test.ts (all auth inputs)
- [ ] T025 [P] Write tests for rate limiter in lib/rate-limit/index.test.ts (counting, expiration, reset)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Création de compte + Vérification email (Priority: P1) MVP

**Goal**: Allow new users to create accounts with username/email/password and verify their email address before accessing the application.

**Independent Test**: Complete signup form → Receive verification email → Click link → Access application with active session.

**Combines**: US1 scenarios 1-8 from spec.md

### Implementation for User Story 1

- [ ] T026 [P] [US1] Implement User Prisma model queries in lib/db/repositories/user.ts (create, findByEmail, findByUsername, updateEmailVerified)
- [ ] T027 [P] [US1] Implement EmailVerificationToken Prisma model queries in lib/db/repositories/email-verification-token.ts (create, findByToken, markUsed, cleanup)
- [ ] T028 [US1] Implement signup business logic in lib/actions/auth/signup.ts (validate, check duplicates, hash password, create user, send email)
- [ ] T029 [US1] Implement email verification business logic in lib/actions/auth/verify-email.ts (validate token, update user, create session)
- [ ] T030 [US1] Implement resend verification logic in lib/actions/auth/resend-verification.ts (rate limit, invalidate old tokens, send new email)
- [ ] T031 [US1] Create POST /api/auth/signup route in app/api/auth/signup/route.ts per contracts/auth-api.openapi.yml
- [ ] T032 [US1] Create POST /api/auth/verify-email route in app/api/auth/verify-email/route.ts
- [ ] T033 [US1] Create POST /api/auth/resend-verification route in app/api/auth/resend-verification/route.ts
- [ ] T034 [P] [US1] Create signup page UI in app/(auth)/signup/page.tsx with real-time password strength indicator
- [ ] T035 [P] [US1] Create email verification page UI in app/(auth)/verify-email/page.tsx with resend option
- [ ] T036 [US1] Implement signup form component in components/auth/signup-form.tsx with React Hook Form + Headless UI + RGAA per research.md Decision 8
- [ ] T037 [US1] Implement password strength indicator component in components/auth/password-strength.tsx with ARIA live regions

**Unit Tests (US1)**:
- [ ] T038 [P] [US1] Write tests for signup logic in lib/actions/auth/signup.test.ts (validation, duplicates, email send failure)
- [ ] T039 [P] [US1] Write tests for verify-email logic in lib/actions/auth/verify-email.test.ts (valid token, expired token, invalid token)
- [ ] T040 [P] [US1] Write tests for resend-verification logic in lib/actions/auth/resend-verification.test.ts (rate limiting, token invalidation)

**Integration Tests (US1)**:
- [ ] T041 [US1] Write integration test for complete signup flow in tests/integration/auth/signup.test.ts (API → DB → Email)
- [ ] T042 [US1] Write integration test for email verification flow in tests/integration/auth/verify-email.test.ts

**E2E Tests (US1)** (MCP Chrome DevTools):
- [ ] T043 [US1] Write E2E test for signup with valid data in tests/e2e/auth/signup.spec.ts
- [ ] T044 [US1] Write E2E test for signup with duplicate username/email in tests/e2e/auth/signup.spec.ts
- [ ] T045 [US1] Write E2E test for password strength validation in tests/e2e/auth/signup.spec.ts
- [ ] T046 [US1] Write E2E test for email verification flow in tests/e2e/auth/verify-email.spec.ts

**Accessibility Tests (US1)**:
- [ ] T047 [US1] Write a11y tests for signup form in tests/a11y/signup.test.ts using axe-core (keyboard navigation, ARIA, screen reader)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create accounts and verify emails

---

## Phase 4: User Story 2 - Connexion avec identifiants (Priority: P1)

**Goal**: Allow existing verified users to log in with username/email + password, with "Remember Me" option for extended sessions.

**Independent Test**: Log in with valid credentials → Access protected page → Session persists for 30 minutes. With "Remember Me" → Session auto-renews for 30 days.

**Combines**: US2 scenarios 1-9 from spec.md

### Implementation for User Story 2

- [ ] T048 [P] [US2] Implement RefreshToken Prisma model queries in lib/db/repositories/refresh-token.ts (create, findByJti, revoke, revokeAll, cleanup)
- [ ] T049 [P] [US2] Implement RevokedToken Prisma model queries in lib/db/repositories/revoked-token.ts (create, findByJti, cleanup)
- [ ] T050 [US2] Implement login business logic in lib/actions/auth/login.ts (validate, check password, check lock, check verified, create session, handle remember-me)
- [ ] T051 [US2] Implement refresh token logic in lib/actions/auth/refresh.ts (validate refresh token, rotate token, create new access token)
- [ ] T052 [US2] Update middleware.ts to check revoked tokens blacklist per research.md Decision 3
- [ ] T053 [US2] Create POST /api/auth/login route in app/api/auth/login/route.ts per contracts/auth-api.openapi.yml
- [ ] T054 [US2] Create POST /api/auth/refresh route in app/api/auth/refresh/route.ts
- [ ] T055 [P] [US2] Create login page UI in app/(auth)/login/page.tsx
- [ ] T056 [US2] Implement login form component in components/auth/login-form.tsx with "Remember Me" checkbox + RGAA compliance

**Unit Tests (US2)**:
- [ ] T057 [P] [US2] Write tests for login logic in lib/actions/auth/login.test.ts (valid credentials, invalid credentials, locked account, unverified email, failed attempts counter)
- [ ] T058 [P] [US2] Write tests for refresh token logic in lib/actions/auth/refresh.test.ts (valid token, expired token, revoked token, rotation)
- [ ] T059 [P] [US2] Write tests for middleware blacklist check in middleware.test.ts

**Integration Tests (US2)**:
- [ ] T060 [US2] Write integration test for login flow in tests/integration/auth/login.test.ts (credentials validation, session creation, refresh token generation)
- [ ] T061 [US2] Write integration test for account lockout in tests/integration/auth/lockout.test.ts (5 failed attempts, 15-minute lock, email notification)
- [ ] T062 [US2] Write integration test for refresh token flow in tests/integration/auth/refresh.test.ts (token rotation, session renewal)

**E2E Tests (US2)** (MCP Chrome DevTools):
- [ ] T063 [US2] Write E2E test for successful login in tests/e2e/auth/login.spec.ts
- [ ] T064 [US2] Write E2E test for invalid credentials in tests/e2e/auth/login.spec.ts
- [ ] T065 [US2] Write E2E test for account lockout after 5 failures in tests/e2e/auth/login.spec.ts
- [ ] T066 [US2] Write E2E test for unverified email blocking login in tests/e2e/auth/login.spec.ts
- [ ] T067 [US2] Write E2E test for "Remember Me" functionality in tests/e2e/auth/remember-me.spec.ts

**Accessibility Tests (US2)**:
- [ ] T068 [US2] Write a11y tests for login form in tests/a11y/login.test.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - complete signup and login flows functional

---

## Phase 5: User Story 3 - Réinitialisation de mot de passe (Priority: P2)

**Goal**: Allow users who forgot their password to reset it via email link.

**Independent Test**: Click "Forgot password" → Enter email → Receive email with link → Set new password → Log in with new password.

**Combines**: US3 scenarios 1-5 from spec.md

### Implementation for User Story 3

- [ ] T069 [P] [US3] Implement PasswordResetToken Prisma model queries in lib/db/repositories/password-reset-token.ts (create, findByToken, markUsed, cleanup)
- [ ] T070 [US3] Implement forgot password logic in lib/actions/auth/forgot-password.ts (validate email, create token, send email, rate limit)
- [ ] T071 [US3] Implement reset password logic in lib/actions/auth/reset-password.ts (validate token, hash password, update user, revoke all sessions)
- [ ] T072 [US3] Create POST /api/auth/forgot-password route in app/api/auth/forgot-password/route.ts per contracts/auth-api.openapi.yml
- [ ] T073 [US3] Create POST /api/auth/reset-password route in app/api/auth/reset-password/route.ts
- [ ] T074 [P] [US3] Create forgot password page UI in app/(auth)/forgot-password/page.tsx
- [ ] T075 [P] [US3] Create reset password page UI in app/(auth)/reset-password/page.tsx
- [ ] T076 [US3] Implement forgot password form in components/auth/forgot-password-form.tsx with RGAA compliance
- [ ] T077 [US3] Implement reset password form in components/auth/reset-password-form.tsx with password strength validation

**Unit Tests (US3)**:
- [ ] T078 [P] [US3] Write tests for forgot password logic in lib/actions/auth/forgot-password.test.ts (valid email, non-existent email, rate limiting, email failure)
- [ ] T079 [P] [US3] Write tests for reset password logic in lib/actions/auth/reset-password.test.ts (valid token, expired token, password validation, session revocation)

**Integration Tests (US3)**:
- [ ] T080 [US3] Write integration test for password reset flow in tests/integration/auth/password-reset.test.ts (request → email → reset → login)

**E2E Tests (US3)** (MCP Chrome DevTools):
- [ ] T081 [US3] Write E2E test for forgot password flow in tests/e2e/auth/forgot-password.spec.ts
- [ ] T082 [US3] Write E2E test for reset password with valid token in tests/e2e/auth/reset-password.spec.ts
- [ ] T083 [US3] Write E2E test for expired token handling in tests/e2e/auth/reset-password.spec.ts

**Accessibility Tests (US3)**:
- [ ] T084 [US3] Write a11y tests for password reset forms in tests/a11y/password-reset.test.ts

**Checkpoint**: User Stories 1, 2, AND 3 all work independently - full authentication + password recovery functional

---

## Phase 6: User Story 4 - Déconnexion (Priority: P2)

**Goal**: Allow authenticated users to log out, terminating their session and revoking tokens.

**Independent Test**: Log in → Navigate to protected page → Log out → Verify unable to access protected page without re-authenticating.

**Combines**: US4 scenarios 1-3 from spec.md

### Implementation for User Story 4

- [ ] T085 [US4] Implement logout business logic in lib/actions/auth/logout.ts (revoke access token, revoke refresh token if present, blacklist tokens)
- [ ] T086 [US4] Create POST /api/auth/logout route in app/api/auth/logout/route.ts per contracts/auth-api.openapi.yml
- [ ] T087 [P] [US4] Add logout button to app layout in app/layout.tsx or components/header.tsx
- [ ] T088 [US4] Implement logout handler in components/auth/logout-button.tsx with confirmation dialog (Headless UI)

**Unit Tests (US4)**:
- [ ] T089 [P] [US4] Write tests for logout logic in lib/actions/auth/logout.test.ts (token revocation, blacklist addition, refresh token handling)

**Integration Tests (US4)**:
- [ ] T090 [US4] Write integration test for logout flow in tests/integration/auth/logout.test.ts (logout → blacklist check → protected route redirect)

**E2E Tests (US4)** (MCP Chrome DevTools):
- [ ] T091 [US4] Write E2E test for logout flow in tests/e2e/auth/logout.spec.ts (logout → verify session ended → verify token blacklisted)

**Checkpoint**: User Stories 1-4 all work independently - complete auth lifecycle (signup → login → logout → password reset)

---

## Phase 7: User Story 5 - Modification des informations de compte (Priority: P3)

**Goal**: Allow authenticated users to update their username, email, and password from account settings.

**Independent Test**: Log in → Navigate to settings → Change username/email/password → Verify changes applied and sessions managed correctly.

**Combines**: US5 scenarios 1-4 from spec.md

### Implementation for User Story 5

- [ ] T092 [P] [US5] Implement EmailChangeRequest Prisma model queries in lib/db/repositories/email-change-request.ts (create, findByToken, markVerified, cleanup)
- [ ] T093 [US5] Implement update username logic in lib/actions/auth/update-username.ts (validate, check uniqueness, update user)
- [ ] T094 [US5] Implement update email logic in lib/actions/auth/update-email.ts (create verification request, send email, validate token, update user)
- [ ] T095 [US5] Implement update password logic in lib/actions/auth/update-password.ts (validate current password, hash new password, update user, revoke all sessions, send notification)
- [ ] T096 [US5] Create PUT /api/auth/update-profile route in app/api/auth/update-profile/route.ts per contracts/auth-api.openapi.yml
- [ ] T097 [P] [US5] Create account settings page UI in app/(protected)/settings/page.tsx (requires authentication)
- [ ] T098 [US5] Implement username change form in components/settings/change-username-form.tsx with validation
- [ ] T099 [US5] Implement email change form in components/settings/change-email-form.tsx with verification flow
- [ ] T100 [US5] Implement password change form in components/settings/change-password-form.tsx with current password confirmation

**Unit Tests (US5)**:
- [ ] T101 [P] [US5] Write tests for update username logic in lib/actions/auth/update-username.test.ts (validation, uniqueness, case handling)
- [ ] T102 [P] [US5] Write tests for update email logic in lib/actions/auth/update-email.test.ts (verification flow, token expiration, uniqueness)
- [ ] T103 [P] [US5] Write tests for update password logic in lib/actions/auth/update-password.test.ts (current password validation, session revocation, notification)

**Integration Tests (US5)**:
- [ ] T104 [US5] Write integration test for profile update flow in tests/integration/auth/profile-update.test.ts (username, email, password changes)
- [ ] T105 [US5] Write integration test for email change verification in tests/integration/auth/email-change.test.ts

**E2E Tests (US5)** (MCP Chrome DevTools):
- [ ] T106 [US5] Write E2E test for username update in tests/e2e/settings/update-username.spec.ts
- [ ] T107 [US5] Write E2E test for email update flow in tests/e2e/settings/update-email.spec.ts (request → verify → login)
- [ ] T108 [US5] Write E2E test for password change in tests/e2e/settings/update-password.spec.ts (verify sessions revoked on all devices)

**Accessibility Tests (US5)**:
- [ ] T109 [US5] Write a11y tests for settings forms in tests/a11y/settings.test.ts

**Checkpoint**: All user stories (1-5) should now be independently functional - complete authentication system

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T110 [P] Create docker-compose.prod.yml for production-like local testing with SSL-enabled PostgreSQL
- [ ] T111 [P] Add Prisma seed script in prisma/seed.ts for test data generation
- [ ] T112 [P] Implement automated cleanup jobs for expired tokens in lib/jobs/cleanup-tokens.ts (cron or background worker)
- [ ] T113 [P] Add comprehensive logging throughout all auth flows with structured log format
- [ ] T114 [P] Implement monitoring dashboard for security events in app/(protected)/admin/security/page.tsx
- [ ] T115 [P] Add API rate limiting headers to all responses (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] T116 [P] Create production deployment guide in docs/deployment.md (Vercel, environment variables, Prisma migrations)
- [ ] T117 [P] Add JSDoc comments to all public functions and types
- [ ] T118 [P] Run Biome linting across entire codebase: `pnpm lint`
- [ ] T119 [P] Run TypeScript strict checks: `pnpm type-check`
- [ ] T120 [P] Generate test coverage report: `pnpm test:coverage` (target: 100% business logic per constitution)
- [ ] T121 [P] Run accessibility audit on all auth pages: `pnpm test:a11y` (target: 100% RGAA AA compliance)
- [ ] T122 Validate quickstart.md by following it step-by-step on clean machine
- [ ] T123 [P] Performance optimization: analyze and optimize database queries (add missing indexes if needed)
- [ ] T124 [P] Security audit: review all auth flows for OWASP Top 10 vulnerabilities
- [ ] T125 [P] Create README.md with project overview, setup instructions, and architecture diagram

**Checkpoint**: Production-ready authentication system with all quality gates passed

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
    ├─→ Phase 3 (US1) ← MVP - Must complete first
    ├─→ Phase 4 (US2) ← MVP - Can start after Phase 3 or in parallel if staffed
    ├─→ Phase 5 (US3) ← Can start after Phase 4 or in parallel
    ├─→ Phase 6 (US4) ← Can start after Phase 4 or in parallel
    └─→ Phase 7 (US5) ← Can start after Phase 4 or in parallel
    ↓
Phase 8 (Polish) ← After all desired user stories complete
```

### User Story Dependencies

- **US1 (Signup + Email Verification)**: No dependencies - can start immediately after Phase 2
- **US2 (Login)**: Light dependency on US1 (needs User entity, but can mock for testing)
- **US3 (Password Reset)**: Depends on User entity from US1, can start in parallel with US2
- **US4 (Logout)**: Depends on US2 (needs login functionality to test logout)
- **US5 (Profile Update)**: Depends on US2 (needs authenticated session), can start in parallel with US3/US4

### Recommended Execution Strategy

**MVP (Minimum Viable Product)**: Complete Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2)

This gives you:
- Account creation with email verification
- Login with "Remember Me"
- Basic authentication system functional

**Post-MVP Expansion**: Add Phase 5 (US3), Phase 6 (US4), Phase 7 (US5) in priority order or parallel if staffed

**Polish**: Phase 8 after all core features complete

---

## Parallel Execution Opportunities

### Phase 2 (Foundational) - Can Run in Parallel

**Team A** (Infrastructure):
- T010-T011 (Prisma schema + migration)
- T018 (Middleware)
- T021 (Prisma client)

**Team B** (Auth Utilities):
- T012 (JWT utilities) + T022 (JWT tests)
- T013 (Password utilities) + T023 (Password tests)
- T017 (Validation) + T024 (Validation tests)

**Team C** (Services):
- T014 (Email service)
- T015 (Email templates)
- T016 (Rate limiter) + T025 (Rate limiter tests)
- T019 (Error handling)
- T020 (Security logger)

### Phase 3 (US1) - Can Run in Parallel After Repositories Created

**Team A** (Backend):
- T026-T027 (Repositories)
- Then: T028-T030 (Business logic)
- Then: T031-T033 (API routes)
- Tests: T038-T042 (Unit + Integration)

**Team B** (Frontend):
- T034-T037 (UI components)
- Tests: T043-T047 (E2E + Accessibility)

### Phase 4 (US2) - Can Run in Parallel

**Team A** (Backend):
- T048-T049 (Repositories)
- Then: T050-T054 (Business logic + API routes)
- Tests: T057-T062 (Unit + Integration)

**Team B** (Frontend):
- T055-T056 (UI components)
- Tests: T063-T068 (E2E + Accessibility)

### Similar patterns for US3, US4, US5

---

## Task Count Summary

- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 16 tasks (12 implementation + 4 test tasks)
- **Phase 3 (US1)**: 22 tasks (12 implementation + 10 test tasks)
- **Phase 4 (US2)**: 21 tasks (9 implementation + 12 test tasks)
- **Phase 5 (US3)**: 16 tasks (9 implementation + 7 test tasks)
- **Phase 6 (US4)**: 7 tasks (4 implementation + 3 test tasks)
- **Phase 7 (US5)**: 18 tasks (9 implementation + 9 test tasks)
- **Phase 8 (Polish)**: 16 tasks

**Total**: 125 tasks

**Estimated Complexity**:
- Setup: ~1-2 days
- Foundational: ~3-5 days
- US1 (MVP): ~3-4 days
- US2 (MVP): ~3-4 days
- US3: ~2-3 days
- US4: ~1 day
- US5: ~2-3 days
- Polish: ~2-3 days

**MVP Timeline** (Phase 1 + 2 + 3 + 4): ~10-15 days (single developer)  
**Full Feature Timeline** (all phases): ~17-25 days (single developer)

With 3 developers working in parallel on independent tasks: **~7-12 days for full feature**

---

## Implementation Strategy

### MVP-First Approach (Recommended)

1. **Week 1**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
   - Day 1-2: Project setup, Docker, dependencies
   - Day 3-5: Foundational utilities, Prisma schema, middleware

2. **Week 2**: Complete Phase 3 (US1) + Phase 4 (US2) - MVP Ready
   - Day 1-3: US1 (Signup + Email verification)
   - Day 4-5: US2 (Login + Remember Me)
   - **MILESTONE**: MVP authentication system functional

3. **Week 3**: Complete Phase 5 (US3) + Phase 6 (US4) + Phase 7 (US5)
   - Day 1-2: US3 (Password reset)
   - Day 3: US4 (Logout)
   - Day 4-5: US5 (Profile update)

4. **Week 4**: Complete Phase 8 (Polish) + Production Readiness
   - Day 1-2: Tests, coverage, accessibility audits
   - Day 3-4: Performance optimization, security audit
   - Day 5: Documentation, deployment guide, validation

### Incremental Delivery Milestones

- **Milestone 1** (Phase 1+2): Development environment ready, foundation complete
- **Milestone 2** (Phase 3): Users can sign up and verify emails
- **Milestone 3** (Phase 4): Users can log in with "Remember Me" ← **MVP**
- **Milestone 4** (Phase 5): Users can reset forgotten passwords
- **Milestone 5** (Phase 6): Users can log out securely
- **Milestone 6** (Phase 7): Users can update their profile
- **Milestone 7** (Phase 8): Production-ready with all quality gates passed

---

## Testing Strategy

### Test Coverage Requirements (Per Constitution)

- **Unit Tests**: 100% coverage of all business logic (lib/actions/, lib/auth/, lib/validation/)
- **Integration Tests**: Cover all API endpoints and database interactions
- **E2E Tests**: Cover all user journeys (signup, login, password reset, logout, profile update)
- **Accessibility Tests**: 100% RGAA AA compliance for all auth pages

### Test Execution Order

1. **Write tests FIRST** for each story (TDD approach per Core Principle III)
2. **Ensure tests FAIL** before implementation
3. **Implement feature** until tests pass
4. **Run full test suite** after each story completion
5. **Run accessibility audit** on each completed page
6. **Validate with MCP Chrome DevTools** for each user journey

### Test Commands

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Accessibility tests
pnpm test:a11y

# Coverage report (target: 100% business logic)
pnpm test:coverage

# All tests
pnpm test:all
```

---

## Constitution Compliance Checklist

- ✅ All tasks use approved stack: Next.js, Prisma ORM, Tailwind CSS, Headless UI, Vercel, S3, PostgreSQL
- ✅ All business logic has Jest tests (tasks T022-T025, T038-T040, T057-T059, T078-T079, T089, T101-T103)
- ✅ Every feature validated with MCP Chrome DevTools (tasks T043-T046, T063-T067, T081-T083, T091, T106-T108)
- ✅ Biome linting enforced (task T118)
- ✅ RGAA compliance mandatory (tasks T047, T068, T084, T109, T121)
- ✅ Each user story independently testable (checkpoints after each phase)
- ✅ Incremental delivery with value at each milestone
- ✅ Code in English, specs in French (per Core Principle VI)
- ✅ No emojis in code or documentation

---

**Ready to Start**: Begin with Phase 1 (Setup) task T001
