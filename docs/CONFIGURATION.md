# Configuration System

## Overview

This project uses a centralized, type-safe configuration system built with Zod for validation. All environment variables are declared, validated, and typed in a single location.

## Benefits

✅ **Type Safety**: Full TypeScript support with autocomplete  
✅ **Validation**: Automatic validation on startup with clear error messages  
✅ **Centralized**: Single source of truth for all configuration  
✅ **Default Values**: Sensible defaults for development  
✅ **No More `process.env`**: Use `config` object everywhere  

## Usage

### Import the config

```typescript
import { config } from '@/lib/config/env'

// Instead of:
const secret = process.env.JWT_SECRET || 'default'

// Use:
const secret = config.JWT_SECRET // Fully typed and validated!
```

### Available Configuration

```typescript
config.NODE_ENV                 // 'development' | 'production' | 'test'
config.NEXT_PUBLIC_APP_URL     // Application URL
config.DATABASE_URL            // PostgreSQL connection string
config.S3_ENDPOINT             // S3/MinIO endpoint
config.S3_ACCESS_KEY           // S3 access key
config.S3_SECRET_KEY           // S3 secret key
config.S3_BUCKET               // S3 bucket name
config.JWT_SECRET              // JWT signing secret
config.JWT_ACCESS_EXPIRATION   // Access token expiration (e.g., '30m')
config.JWT_REFRESH_EXPIRATION  // Refresh token expiration (e.g., '30d')
config.SMTP_HOST               // SMTP server host
config.SMTP_PORT               // SMTP server port
config.SMTP_SECURE             // SMTP use TLS ('true' | 'false')
config.SMTP_FROM               // Email sender address
config.SMTP_USER               // SMTP username (optional)
config.SMTP_PASS               // SMTP password (optional)
config.RESEND_API_KEY          // Resend API key (production)
config.UPSTASH_REDIS_REST_URL  // Upstash Redis URL (production)
config.UPSTASH_REDIS_REST_TOKEN // Upstash Redis token (production)
```

### Helper Functions

```typescript
import { isProduction, isDevelopment, isTest, hasResend, hasUpstash } from '@/lib/config/env'

// Environment checks
if (isProduction) {
  // Production-only code
}

if (isDevelopment) {
  // Development-only code
}

// Feature flags based on configuration
if (hasResend) {
  // Use Resend for email
} else {
  // Use MailHog/SMTP
}

if (hasUpstash) {
  // Use Upstash Redis for rate limiting
} else {
  // Use in-memory rate limiting
}
```

## Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

### Required Variables

These **MUST** be set or the application will fail to start:

- `DATABASE_URL` - PostgreSQL connection string
- `S3_ACCESS_KEY` - S3/MinIO access key
- `S3_SECRET_KEY` - S3/MinIO secret key
- `JWT_SECRET` - JWT signing secret (min 32 characters)

### Optional Variables (with defaults)

These have sensible defaults for development:

- `NODE_ENV` - Default: `development`
- `NEXT_PUBLIC_APP_URL` - Default: `http://localhost:3000`
- `S3_ENDPOINT` - Default: `http://localhost:9000`
- `S3_BUCKET` - Default: `docdb-uploads`
- `JWT_ACCESS_EXPIRATION` - Default: `30m`
- `JWT_REFRESH_EXPIRATION` - Default: `30d`
- `SMTP_HOST` - Default: `localhost`
- `SMTP_PORT` - Default: `1025`
- `SMTP_SECURE` - Default: `false`
- `SMTP_FROM` - Default: `noreply@localhost`

### Production-Only Variables

These are only used in production:

- `RESEND_API_KEY` - For production email sending
- `UPSTASH_REDIS_REST_URL` - For production rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - For production rate limiting

## Validation

On application startup, all environment variables are validated:

```typescript
// Invalid configuration will throw an error with details:
❌ Invalid environment variables:
{
  "JWT_SECRET": {
    "_errors": ["JWT_SECRET must be at least 32 characters"]
  },
  "DATABASE_URL": {
    "_errors": ["DATABASE_URL is required"]
  }
}
```

## Adding New Configuration

1. Add to the schema in `lib/config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing config
  
  // Add new variable
  NEW_FEATURE_URL: z.string().url().optional(),
})
```

2. Add to `.env.example`:

```bash
# New Feature
NEW_FEATURE_URL="https://api.example.com"
```

3. Use in your code:

```typescript
import { config } from '@/lib/config/env'

const apiUrl = config.NEW_FEATURE_URL
// Fully typed! TypeScript knows it's string | undefined
```

## Best Practices

### ✅ DO

```typescript
import { config, isDevelopment, hasResend } from '@/lib/config/env'

// Direct access to validated config
const secret = config.JWT_SECRET
const isDevMode = isDevelopment

// Using helpers for feature flags
if (hasResend) {
  // Use Resend for production emails
} else {
  // Use SMTP/MailHog
}

// Environment-specific behavior
export function getDatabaseConfig() {
  return {
    url: config.DATABASE_URL,
    logging: isDevelopment, // More logs in dev
  }
}

// Type-safe URL construction
export function createVerificationUrl(token: string): string {
  return `${config.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
}
```

### ❌ DON'T

```typescript
// ❌ No type safety, no validation
const secret = process.env.JWT_SECRET

// ❌ Fallback values bypass validation
const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ❌ Repetitive environment checks
const isDevMode = process.env.NODE_ENV === 'development'

// ❌ Manual feature detection
const hasResend = !!process.env.RESEND_API_KEY
```

## TypeScript Integration

The config object is fully typed:

```typescript
import { type Config } from '@/lib/config/env'

function useConfig(cfg: Config) {
  // TypeScript knows all available properties
  console.log(cfg.JWT_SECRET)
  console.log(cfg.DATABASE_URL)
  // etc.
}
```

## Testing

In tests, you can override config by setting environment variables before importing:

```typescript
// jest.setup.ts or individual test file
process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Then import
import { config } from '@/lib/config/env'
```

Or use Jest's `process.env` mocking:

```typescript
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

test('with custom config', () => {
  process.env.JWT_SECRET = 'custom_test_secret_very_long_one'
  const { config } = require('@/lib/config/env')
  expect(config.JWT_SECRET).toBe('custom_test_secret_very_long_one')
})
```
