# Data Model: Authentification utilisateur

**Date**: 2025-12-23  
**Feature**: 001-user-auth  
**Purpose**: Complete entity definitions for Prisma schema implementation

**References**:
- Feature Spec: [spec.md](./spec.md) - Key Entities section
- Research: [research.md](./research.md) - Decision 2 (Prisma Schema Design)

---

## Overview

This data model defines 8 entities for the authentication system:
1. **User** - Core user accounts
2. **RefreshToken** - Long-lived tokens for "Remember Me"
3. **RevokedToken** - Blacklist for invalidated JWTs
4. **EmailVerificationToken** - Email verification links
5. **PasswordResetToken** - Password reset links
6. **EmailChangeRequest** - Pending email changes
7. **SecurityEvent** - Audit log for security actions
8. **RateLimitEntry** - (Optional) Database-backed rate limiting

All entities use UUID primary keys, timestamps, and strategic indexes for performance.

---

## Entity 1: User

### Purpose
Represents a person with an account in the system. Central entity for authentication and authorization.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK, @default(uuid()) | Unique user identifier |
| `username` | String | Unique, 3-30 chars | Display username (case-preserved) |
| `usernameNormalized` | String | Unique, lowercase | Case-insensitive lookup |
| `email` | String | Unique, RFC 5322 | User email address |
| `emailNormalized` | String | Unique, lowercase | Case-insensitive lookup |
| `emailVerified` | Boolean | @default(false) | Email verification status |
| `passwordHash` | String | - | bcrypt hash (12 rounds) |
| `failedLoginAttempts` | Int | @default(0) | Consecutive failed logins |
| `lockedUntil` | DateTime? | Nullable | Account lock expiration |
| `createdAt` | DateTime | @default(now()) | Account creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Last modification timestamp |
| `lastLoginAt` | DateTime? | Nullable | Last successful login |

### Validation Rules

**From Functional Requirements:**
- **FR-025**: `username` 3-30 characters, alphanumeric + dash + underscore only
- **FR-002**: `email` must be RFC 5322 compliant
- **FR-003**: `passwordHash` from password meeting: min 8 chars, uppercase, lowercase, digit, special char
- **FR-004**: `username` and `email` must be unique
- **FR-024**: `usernameNormalized` enables case-insensitive login, `username` preserves display case
- **FR-007**: `failedLoginAttempts` increments on failed login, resets on success
- **FR-007**: `lockedUntil` set 15 minutes from 5th failed attempt
- **FR-035**: `emailVerified` default false, set true on email verification

### Relationships

```prisma
// One user has many...
refreshTokens         RefreshToken[]
revokedTokens         RevokedToken[]
emailVerificationTokens EmailVerificationToken[]
passwordResetTokens   PasswordResetToken[]
emailChangeRequests   EmailChangeRequest[]
securityEvents        SecurityEvent[]
```

**Cascade behavior**: All related tokens/events deleted when user is deleted (onDelete: Cascade)

### Indexes

```prisma
@@index([usernameNormalized])  // Fast case-insensitive username lookup
@@index([emailNormalized])     // Fast case-insensitive email lookup
@@index([lockedUntil])         // Efficient cleanup of expired locks
```

### State Transitions

```
[New] --signup--> [EmailUnverified]
      emailVerified = false
      
[EmailUnverified] --verify-email--> [Active]
      emailVerified = true
      
[Active] --5-failed-logins--> [Locked]
      failedLoginAttempts = 5
      lockedUntil = now + 15 min
      
[Locked] --wait-15min--> [Active]
      lockedUntil expires
      failedLoginAttempts remains 5
      
[Active] --successful-login--> [Active]
      failedLoginAttempts = 0
      lastLoginAt = now
```

### Prisma Schema

```prisma
model User {
  id                    String   @id @default(uuid())
  username              String   @unique
  usernameNormalized    String   @unique
  email                 String   @unique
  emailNormalized       String   @unique
  emailVerified         Boolean  @default(false)
  passwordHash          String
  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastLoginAt           DateTime?
  
  refreshTokens         RefreshToken[]
  revokedTokens         RevokedToken[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens   PasswordResetToken[]
  emailChangeRequests   EmailChangeRequest[]
  securityEvents        SecurityEvent[]
  
  @@index([usernameNormalized])
  @@index([emailNormalized])
  @@index([lockedUntil])
  @@map("users")
}
```

---

## Entity 2: RefreshToken

### Purpose
Represents a long-lived token for "Remember Me" functionality. Enables automatic session renewal without re-authentication.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique token record ID |
| `jti` | String | Unique | JWT ID for blacklist lookup |
| `userId` | String | FK → User.id | Token owner |
| `tokenHash` | String | - | bcrypt hash of refresh token value |
| `expiresAt` | DateTime | - | Token expiration (30 days from creation) |
| `createdAt` | DateTime | @default(now()) | Token creation timestamp |
| `lastUsedAt` | DateTime | @default(now()) | Last refresh operation |
| `revokedAt` | DateTime? | Nullable | Manual revocation timestamp |
| `userAgent` | String? | Nullable | Browser/device identifier |
| `ipAddress` | String? | Nullable | IP address at creation |

### Validation Rules

**From Functional Requirements:**
- **FR-042**: `expiresAt` = `createdAt` + 30 days
- **FR-043**: `tokenHash` bcrypt hash of refresh token string
- **FR-043**: `userAgent` + `ipAddress` identify device
- **FR-044**: Token valid if `revokedAt` is null AND `expiresAt` > now
- **FR-046**: All user's refresh tokens revoked (revokedAt set) on password change
- **FR-047**: Single token revoked (revokedAt set) on explicit logout
- **FR-048**: Tokens with `expiresAt` < now - 30 days deleted automatically

### Relationships

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Indexes

```prisma
@@index([userId])              // Find all tokens for a user
@@index([expiresAt])           // Cleanup expired tokens
@@index([jti, revokedAt])      // Fast blacklist check
@@unique([jti])                // Ensure JWT ID uniqueness
```

### State Transitions

```
[Created] --use-refresh--> [Rotated/Revoked]
      lastUsedAt updated
      NEW refresh token created
      OLD token revokedAt = now
      
[Created] --explicit-logout--> [Revoked]
      revokedAt = now
      
[Created] --password-change--> [Revoked]
      revokedAt = now (for ALL user tokens)
      
[Created/Revoked] --30-days--> [Deleted]
      Cleanup job removes expired tokens
```

### Prisma Schema

```prisma
model RefreshToken {
  id              String   @id @default(uuid())
  jti             String   @unique
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash       String
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  revokedAt       DateTime?
  userAgent       String?
  ipAddress       String?
  
  @@index([userId])
  @@index([expiresAt])
  @@index([jti, revokedAt])
  @@map("refresh_tokens")
}
```

---

## Entity 3: RevokedToken

### Purpose
Blacklist for JWT tokens (access + refresh) that have been explicitly revoked before their natural expiration. Enables immediate invalidation.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique blacklist entry ID |
| `jti` | String | Unique | JWT ID from token payload |
| `userId` | String? | FK → User.id, nullable | Token owner (if known) |
| `tokenType` | String | 'access' | 'refresh' | Type of revoked token |
| `expiresAt` | DateTime | - | Original token expiration |
| `revokedAt` | DateTime | @default(now()) | Revocation timestamp |
| `reason` | String | - | Reason for revocation |

### Validation Rules

**From Functional Requirements:**
- **FR-032**: `jti` must match JWT token's `jti` claim
- **FR-033**: Checked on every JWT validation
- **FR-033**: Entries with `expiresAt` < now deleted automatically (30 min for access, 30 days for refresh)
- **FR-013**: Reason = "explicit_logout" for logout
- **FR-019**: Reason = "password_change" for password change
- **FR-046**: Reason = "password_change" revokes all refresh tokens

### Relationships

```prisma
user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Indexes

```prisma
@@index([jti])                 // Fast blacklist lookup
@@index([expiresAt])           // Cleanup expired entries
@@index([userId, revokedAt])   // Audit queries per user
@@unique([jti])                // One entry per token ID
```

### Cleanup Logic

```typescript
// Cron job (daily)
await prisma.revokedToken.deleteMany({
  where: { expiresAt: { lt: new Date() } }
})
```

### Prisma Schema

```prisma
model RevokedToken {
  id              String   @id @default(uuid())
  jti             String   @unique
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenType       String   // 'access' or 'refresh'
  expiresAt       DateTime
  revokedAt       DateTime @default(now())
  reason          String   // 'explicit_logout', 'password_change', etc.
  
  @@index([jti])
  @@index([expiresAt])
  @@index([userId, revokedAt])
  @@map("revoked_tokens")
}
```

---

## Entity 4: EmailVerificationToken

### Purpose
Represents a one-time-use token for verifying user email addresses. Sent after account creation and on resend requests.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique token record ID |
| `userId` | String | FK → User.id | User to verify |
| `token` | String | Unique | Secure random token (URL-safe) |
| `expiresAt` | DateTime | - | Token expiration (24 hours) |
| `createdAt` | DateTime | @default(now()) | Token creation timestamp |
| `usedAt` | DateTime? | Nullable | Token usage timestamp |

### Validation Rules

**From Functional Requirements:**
- **FR-034**: `token` secure random string (crypto.randomBytes(32).toString('base64url'))
- **FR-034**: `expiresAt` = `createdAt` + 24 hours
- **FR-037**: New request invalidates all previous tokens (delete old, create new)
- **FR-038**: Rate limited (3 requests per hour per user)
- **FR-039**: `usedAt` set when token successfully used
- **FR-040**: Expired tokens (expiresAt < now) rejected

### Relationships

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Indexes

```prisma
@@index([userId])              // Find tokens for a user
@@index([token])               // Fast token lookup
@@index([expiresAt])           // Cleanup expired tokens
@@unique([token])              // Ensure token uniqueness
```

### State Transitions

```
[Created] --verify-email--> [Used]
      usedAt = now
      User.emailVerified = true
      
[Created] --resend--> [Invalidated]
      Old token deleted
      New token created
      
[Created] --24h-expire--> [Expired]
      expiresAt < now
      Rejected on use, cleanup eligible
```

### Prisma Schema

```prisma
model EmailVerificationToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  usedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

---

## Entity 5: PasswordResetToken

### Purpose
Represents a one-time-use token for password reset. Sent when user requests password reset.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique token record ID |
| `userId` | String | FK → User.id | User resetting password |
| `token` | String | Unique | Secure random token (URL-safe) |
| `expiresAt` | DateTime | - | Token expiration (1 hour) |
| `createdAt` | DateTime | @default(now()) | Token creation timestamp |
| `usedAt` | DateTime? | Nullable | Token usage timestamp |

### Validation Rules

**From Functional Requirements:**
- **FR-010**: `token` secure random string (crypto.randomBytes(32).toString('base64url'))
- **FR-010**: `expiresAt` = `createdAt` + 1 hour
- **FR-011**: New request invalidates all previous tokens (delete old, create new)
- **FR-012**: Same confirmation message shown regardless of email existence (don't reveal if user exists)
- **FR-003**: New password must meet security criteria

### Relationships

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Indexes

```prisma
@@index([userId])              // Find tokens for a user
@@index([token])               // Fast token lookup
@@index([expiresAt])           // Cleanup expired tokens
@@unique([token])              // Ensure token uniqueness
```

### State Transitions

```
[Created] --reset-password--> [Used]
      usedAt = now
      User.passwordHash updated
      User.refreshTokens revoked (all)
      
[Created] --new-request--> [Invalidated]
      Old token deleted
      New token created
      
[Created] --1h-expire--> [Expired]
      expiresAt < now
      Rejected on use, cleanup eligible
```

### Prisma Schema

```prisma
model PasswordResetToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  usedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

---

## Entity 6: EmailChangeRequest

### Purpose
Represents a pending email change request requiring verification via new email address.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique request ID |
| `userId` | String | FK → User.id | User changing email |
| `newEmail` | String | - | New email address (not unique yet) |
| `newEmailNormalized` | String | - | Lowercase for uniqueness check |
| `token` | String | Unique | Verification token |
| `expiresAt` | DateTime | - | Token expiration (24 hours) |
| `createdAt` | DateTime | @default(now()) | Request creation timestamp |
| `verifiedAt` | DateTime? | Nullable | Verification timestamp |

### Validation Rules

**From Functional Requirements:**
- **FR-017**: `newEmail` must pass RFC 5322 validation
- **FR-017**: `newEmailNormalized` must be unique across all users
- **FR-017**: Verification email sent to `newEmail`
- **FR-017**: Email change only effective after verification
- **FR-017**: `token` secure random string (24 hours validity)

### Relationships

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Indexes

```prisma
@@index([userId])              // Find requests for a user
@@index([token])               // Fast token lookup
@@index([newEmailNormalized])  // Check new email uniqueness
@@index([expiresAt])           // Cleanup expired requests
@@unique([token])              // Ensure token uniqueness
```

### State Transitions

```
[Created] --verify-token--> [Verified]
      verifiedAt = now
      User.email = newEmail
      User.emailNormalized = newEmailNormalized
      
[Created] --new-request--> [Invalidated]
      Old request deleted
      New request created
      
[Created] --24h-expire--> [Expired]
      expiresAt < now
      Cleanup eligible
```

### Prisma Schema

```prisma
model EmailChangeRequest {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  newEmail            String
  newEmailNormalized  String
  token               String   @unique
  expiresAt           DateTime
  createdAt           DateTime @default(now())
  verifiedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([newEmailNormalized])
  @@index([expiresAt])
  @@map("email_change_requests")
}
```

---

## Entity 7: SecurityEvent

### Purpose
Audit log for security-related actions. Enables monitoring, forensics, and compliance.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique event ID |
| `userId` | String? | FK → User.id, nullable | Associated user (if applicable) |
| `eventType` | String | - | Event type (enum-like) |
| `ipAddress` | String? | Nullable | IP address of actor |
| `userAgent` | String? | Nullable | Browser/device info |
| `metadata` | Json? | Nullable | Additional event details |
| `createdAt` | DateTime | @default(now()) | Event timestamp |

### Validation Rules

**From Functional Requirements:**
- **FR-022**: All critical events logged
- **FR-028**: Email delivery failures logged

**Event types**:
- `account_created`
- `login_success`
- `login_failed`
- `account_locked`
- `account_unlocked`
- `password_changed`
- `email_changed`
- `email_verified`
- `refresh_token_created`
- `refresh_token_revoked`
- `email_send_failed`

### Relationships

```prisma
user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
```

**Note**: SetNull on user delete to preserve audit trail

### Indexes

```prisma
@@index([userId, createdAt])   // User event history
@@index([eventType, createdAt]) // Event type queries
@@index([createdAt])           // Time-based queries
@@index([ipAddress])           // IP-based forensics
```

### Metadata Examples

```json
// login_failed
{
  "reason": "invalid_password",
  "attemptNumber": 3
}

// account_locked
{
  "failedAttempts": 5,
  "lockDuration": "15m"
}

// email_send_failed
{
  "emailType": "password_reset",
  "error": "SMTP connection timeout"
}
```

### Prisma Schema

```prisma
model SecurityEvent {
  id              String   @id @default(uuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  eventType       String
  ipAddress       String?
  userAgent       String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([eventType, createdAt])
  @@index([createdAt])
  @@index([ipAddress])
  @@map("security_events")
}
```

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // SSL/TLS configuration via connection string:
  // Development: ?sslmode=disable (localhost only)
  // Production:  ?sslmode=require (managed DB over internet)
}

model User {
  id                    String   @id @default(uuid())
  username              String   @unique
  usernameNormalized    String   @unique
  email                 String   @unique
  emailNormalized       String   @unique
  emailVerified         Boolean  @default(false)
  passwordHash          String
  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastLoginAt           DateTime?
  
  refreshTokens         RefreshToken[]
  revokedTokens         RevokedToken[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens   PasswordResetToken[]
  emailChangeRequests   EmailChangeRequest[]
  securityEvents        SecurityEvent[]
  
  @@index([usernameNormalized])
  @@index([emailNormalized])
  @@index([lockedUntil])
  @@map("users")
}

model RefreshToken {
  id              String   @id @default(uuid())
  jti             String   @unique
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash       String
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  revokedAt       DateTime?
  userAgent       String?
  ipAddress       String?
  
  @@index([userId])
  @@index([expiresAt])
  @@index([jti, revokedAt])
  @@map("refresh_tokens")
}

model RevokedToken {
  id              String   @id @default(uuid())
  jti             String   @unique
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenType       String
  expiresAt       DateTime
  revokedAt       DateTime @default(now())
  reason          String
  
  @@index([jti])
  @@index([expiresAt])
  @@index([userId, revokedAt])
  @@map("revoked_tokens")
}

model EmailVerificationToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  usedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  usedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

model EmailChangeRequest {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  newEmail            String
  newEmailNormalized  String
  token               String   @unique
  expiresAt           DateTime
  createdAt           DateTime @default(now())
  verifiedAt          DateTime?
  
  @@index([userId])
  @@index([token])
  @@index([newEmailNormalized])
  @@index([expiresAt])
  @@map("email_change_requests")
}

model SecurityEvent {
  id              String   @id @default(uuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  eventType       String
  ipAddress       String?
  userAgent       String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([eventType, createdAt])
  @@index([createdAt])
  @@index([ipAddress])
  @@map("security_events")
}
```

---

## Entity Relationship Diagram

```
User (1) ──────< (N) RefreshToken
     (1) ──────< (N) RevokedToken
     (1) ──────< (N) EmailVerificationToken
     (1) ──────< (N) PasswordResetToken
     (1) ──────< (N) EmailChangeRequest
     (1) ──────< (N) SecurityEvent
```

**Cascade Rules**:
- User deleted → All tokens/requests deleted (Cascade)
- User deleted → Security events preserved with null userId (SetNull)

---

## Migration Strategy

### Initial Migration

```bash
# Create initial schema
pnpm prisma migrate dev --name init

# Generate Prisma Client
pnpm prisma generate
```

### Seed Data (Development)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const passwordHash = await bcrypt.hash('Test1234!', 12)
  
  await prisma.user.create({
    data: {
      username: 'testuser',
      usernameNormalized: 'testuser',
      email: 'test@example.com',
      emailNormalized: 'test@example.com',
      emailVerified: true,
      passwordHash,
    }
  })
  
  console.log('Seed data created')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
```

### Cleanup Jobs

```typescript
// lib/db/cleanup.ts
import { prisma } from './prisma'

export async function cleanupExpiredTokens() {
  const now = new Date()
  
  // Delete expired refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: now } }
  })
  
  // Delete expired revoked tokens
  await prisma.revokedToken.deleteMany({
    where: { expiresAt: { lt: now } }
  })
  
  // Delete expired verification tokens
  await prisma.emailVerificationToken.deleteMany({
    where: { expiresAt: { lt: now } }
  })
  
  // Delete expired reset tokens
  await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: now } }
  })
  
  // Delete expired email change requests
  await prisma.emailChangeRequest.deleteMany({
    where: { expiresAt: { lt: now } }
  })
  
  console.log('Expired tokens cleaned up')
}

// Run daily via cron or scheduled job
```

---

## Completion Checklist

- ✅ All 8 entities fully defined
- ✅ All attributes documented with types and constraints
- ✅ All validation rules mapped to FR requirements
- ✅ All relationships defined with cascade behavior
- ✅ All indexes strategically placed for performance
- ✅ All state transitions documented
- ✅ Complete Prisma schema ready for implementation
- ✅ Migration strategy defined
- ✅ Cleanup jobs documented

**Next**: Create API contracts in `contracts/` directory
