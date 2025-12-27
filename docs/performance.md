# Performance Optimization Report

**Date**: 2025-12-23  
**Scope**: Database queries, indexes, and application performance  
**Status**: ✅ Current schema is well-optimized

---

## Executive Summary

The current database schema includes comprehensive indexing for all critical query patterns. After analyzing all Prisma queries in the codebase, **no major performance issues were identified**. The schema follows PostgreSQL best practices with proper indexes on:

- Unique constraints (username, email, tokens)
- Foreign keys (userId in all related tables)
- Frequently queried fields (expiresAt, createdAt)
- Composite indexes for multi-column queries

---

## Index Coverage Analysis

### ✅ Well-Indexed Tables

#### 1. Users Table
```prisma
model User {
  @@index([usernameNormalized])  // Login by username
  @@index([emailNormalized])     // Login by email
  @@index([lockedUntil])         // Check account lockout status
}
```

**Query Patterns**:
- `findUnique({ where: { email } })` → Uses unique constraint (optimal)
- `findUnique({ where: { username } })` → Uses unique constraint (optimal)
- Account lockout checks → Uses lockedUntil index

**Performance**: ✅ Optimal

---

#### 2. RefreshToken Table
```prisma
model RefreshToken {
  @@index([userId])              // Fetch user's tokens
  @@index([expiresAt])           // Cleanup expired tokens
  @@index([jti, revokedAt])      // Token validation (revocation check)
}
```

**Query Patterns**:
- `findUnique({ where: { jti } })` → Uses unique constraint (optimal)
- `findMany({ where: { userId, revokedAt: null } })` → Uses userId index + filter
- Expired token cleanup → Uses expiresAt index

**Performance**: ✅ Optimal

---

#### 3. EmailVerificationToken Table
```prisma
model EmailVerificationToken {
  @@index([userId])              // Fetch user's verification tokens
  @@index([token])               // Token lookup
  @@index([expiresAt])           // Cleanup expired tokens
}
```

**Query Patterns**:
- `findFirst({ where: { token } })` → Uses token index (optimal)
- Expired token cleanup → Uses expiresAt index

**Performance**: ✅ Optimal

---

#### 4. PasswordResetToken Table
```prisma
model PasswordResetToken {
  @@index([userId])              // Fetch user's reset tokens
  @@index([token])               // Token lookup
  @@index([expiresAt])           // Cleanup expired tokens
}
```

**Query Patterns**:
- `findUnique({ where: { token } })` → Uses unique constraint (optimal)
- Expired token cleanup → Uses expiresAt index

**Performance**: ✅ Optimal

---

#### 5. EmailChangeRequest Table
```prisma
model EmailChangeRequest {
  @@index([userId])              // Fetch user's email change requests
  @@index([token])               // Token lookup
  @@index([newEmailNormalized])  // Check email availability
  @@index([expiresAt])           // Cleanup expired requests
}
```

**Query Patterns**:
- `findFirst({ where: { token } })` → Uses token index (optimal)
- `findUnique({ where: { newEmailNormalized } })` → Uses newEmailNormalized index
- Expired request cleanup → Uses expiresAt index

**Performance**: ✅ Optimal

---

#### 6. RevokedToken Table
```prisma
model RevokedToken {
  @@index([jti])                 // Token revocation checks
  @@index([expiresAt])           // Cleanup old revocations
  @@index([userId, revokedAt])   // User-specific revocation history
}
```

**Query Patterns**:
- `findUnique({ where: { jti } })` → Uses unique constraint (optimal)
- Cleanup old revocations (>7 days past expiration) → Uses expiresAt index

**Performance**: ✅ Optimal

---

#### 7. SecurityEvent Table
```prisma
model SecurityEvent {
  @@index([userId, createdAt])   // User activity timeline
  @@index([eventType, createdAt]) // Event type filtering
  @@index([createdAt])           // Cleanup old events (90+ days)
  @@index([ipAddress])           // IP-based analysis
}
```

**Query Patterns**:
- `findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })` → Uses userId+createdAt composite index (optimal)
- `findMany({ where: { eventType }, orderBy: { createdAt: 'desc' } })` → Uses eventType+createdAt composite index (optimal)
- Cleanup old events → Uses createdAt index

**Performance**: ✅ Optimal

---

## Query Efficiency Analysis

### 1. Login Flow (Most Critical Path)

**Query**: Find user by email
```typescript
const user = await prisma.user.findUnique({
  where: { email }
})
```

**Execution Plan**: Uses unique constraint on `email` field  
**Performance**: ✅ O(1) index lookup  
**No action needed**

---

### 2. Token Refresh Flow

**Query 1**: Verify refresh token
```typescript
const storedToken = await prisma.refreshToken.findUnique({
  where: { jti }
})
```

**Execution Plan**: Uses unique constraint on `jti` field  
**Performance**: ✅ O(1) index lookup

**Query 2**: Check if token is revoked
```typescript
const revokedToken = await prisma.revokedToken.findUnique({
  where: { jti }
})
```

**Execution Plan**: Uses unique constraint on `jti` field  
**Performance**: ✅ O(1) index lookup

**Query 3**: Fetch user
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true }
})
```

**Execution Plan**: Uses primary key (id)  
**Performance**: ✅ O(1) index lookup  
**No action needed**

---

### 3. Cleanup Jobs (Background Tasks)

#### Expired Email Verification Tokens
```typescript
await prisma.emailVerificationToken.deleteMany({
  where: {
    expiresAt: { lt: now },
    usedAt: null
  }
})
```

**Execution Plan**: Uses `expiresAt` index, then filters by `usedAt`  
**Performance**: ✅ Efficient with index  
**No action needed**

#### Expired Refresh Tokens
```typescript
await prisma.refreshToken.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: now } },
      { revokedAt: { not: null } }
    ]
  }
})
```

**Execution Plan**: Uses `expiresAt` index for first condition, `jti+revokedAt` composite index for second  
**Performance**: ✅ Efficient with indexes  
**No action needed**

#### Old Security Events (90+ days)
```typescript
await prisma.securityEvent.deleteMany({
  where: {
    createdAt: { lt: ninetyDaysAgo }
  }
})
```

**Execution Plan**: Uses `createdAt` index  
**Performance**: ✅ Efficient with index  
**No action needed**

---

## Recommendations

### ✅ Implemented (Already in Schema)

1. **Username/Email Normalization Indexes**: Both `usernameNormalized` and `emailNormalized` are indexed for case-insensitive lookups
2. **Token Expiration Indexes**: All token tables have `expiresAt` indexes for efficient cleanup
3. **Composite Indexes**: SecurityEvent uses composite indexes (`userId+createdAt`, `eventType+createdAt`) for timeline queries
4. **Foreign Key Indexes**: All `userId` foreign keys are indexed

### 🔄 Minor Optimizations (Optional)

#### 1. Add Partial Index for Active Refresh Tokens

Currently, the `refreshToken` table includes an index on `[jti, revokedAt]`, which is efficient. However, for production systems with millions of tokens, a partial index on non-revoked tokens can improve performance:

**Current Schema**:
```prisma
@@index([jti, revokedAt])
```

**Optimized Schema** (only if token volume exceeds 1M):
```prisma
// Add to RefreshToken model in schema.prisma
@@index([jti], where: "revoked_at IS NULL", name: "idx_active_refresh_tokens")
```

**Impact**: Reduces index size by ~50% (only indexes active tokens)  
**When to implement**: When `refreshToken` table exceeds 1 million rows  
**Current priority**: ⬇️ Low (not needed for MVP)

---

#### 2. Connection Pool Optimization

**Current Configuration** (docker-compose.prod.yml):
```yaml
max_connections=100
```

**Recommendation**: Monitor connection pool usage in production  
**Prisma Configuration** (if needed):

```typescript
// lib/db/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Uncomment if experiencing connection pool exhaustion
  // pool: {
  //   timeout: 20,
  //   idleTimeout: 30,
  //   maxConnections: 10,
  // },
})
```

**When to implement**: If Vercel serverless functions exceed connection limits  
**Current priority**: ⬇️ Low (monitor first)

---

#### 3. Query Response Time Monitoring

Add query logging to track slow queries in production:

```typescript
// lib/db/prisma.ts
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
})

// Log slow queries (>1s)
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query detected:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    })
  }
})
```

**When to implement**: After initial production deployment  
**Current priority**: 🔼 Medium (good for monitoring)

---

## Performance Benchmarks

### Expected Query Performance (Development Environment)

| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| User login (findUnique by email) | ~2-5ms | Uses unique index |
| Token validation (findUnique by jti) | ~2-5ms | Uses unique index |
| User profile fetch | ~2-5ms | Uses primary key |
| Security events (last 10) | ~5-10ms | Uses userId+createdAt composite index |
| Token cleanup (batch delete) | ~50-200ms | Depends on expired token count |

### Production Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Auth API response time (p95) | < 200ms | ✅ Expected to meet |
| Database query time (p95) | < 50ms | ✅ Expected to meet |
| Token refresh latency | < 100ms | ✅ Expected to meet |
| Cleanup job duration | < 30s | ✅ Expected to meet |

---

## Load Testing Recommendations

Before production launch, run load tests with:

- **Artillery**: HTTP load testing ([artillery.io](https://www.artillery.io/))
- **k6**: Performance testing ([k6.io](https://k6.io/))

**Test Scenarios**:
1. **Login Storm**: 100 concurrent users logging in
2. **Token Refresh Burst**: 1000 token refreshes in 1 minute
3. **Sustained Load**: 50 req/s for 10 minutes
4. **Database Connection Pool Stress**: Verify no connection exhaustion

**Sample Artillery Script**:
```yaml
config:
  target: "https://yourdomain.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Login and token refresh"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "Test1234!"
            rememberMe: true
      - think: 30
      - post:
          url: "/api/auth/refresh"
```

---

## Monitoring Checklist

For production deployment:

- [ ] Enable PostgreSQL slow query log (queries > 1s)
- [ ] Monitor Prisma connection pool usage (Vercel dashboard)
- [ ] Set up alerts for query response time > 500ms
- [ ] Track token cleanup job duration (should complete < 30s)
- [ ] Monitor database CPU/memory usage (target < 70%)
- [ ] Enable Vercel Analytics for endpoint latency tracking
- [ ] Add custom metrics for authentication success/failure rates

---

## Conclusion

The authentication system is **already well-optimized** for production use. The current schema includes all necessary indexes for efficient query execution. No immediate changes are required.

**Action Items**:
1. ✅ Current schema meets performance requirements → **No changes needed**
2. 🔼 Add query monitoring to track slow queries in production (optional)
3. ⬇️ Consider partial indexes if token volume exceeds 1M rows (future optimization)
4. ⬇️ Run load tests before production launch (recommended but optional for MVP)

**Next Steps**: Continue with deployment (see [docs/deployment.md](./deployment.md))
