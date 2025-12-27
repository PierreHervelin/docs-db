import { z } from 'zod'

/**
 * Environment configuration schema with validation
 * All environment variables are centralized and type-safe
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // S3 Storage
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY is required'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),
  S3_BUCKET: z.string().default('docdb-uploads'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('30m'),
  JWT_REFRESH_EXPIRATION: z.string().default('30d'),

  // Email Configuration
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025'),
  SMTP_SECURE: z.string().default('false'),
  SMTP_FROM: z.string().email().default('noreply@localhost'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Production Email (Resend)
  RESEND_API_KEY: z.string().optional(),

  // Rate Limiting (Production - Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

/**
 * Parses and validates environment variables
 * Throws error if validation fails
 */
function parseEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * Validated and typed environment configuration
 * Access with: config.DATABASE_URL, config.JWT_SECRET, etc.
 */
export const config = parseEnv()

/**
 * Type-safe environment config type
 */
export type Config = z.infer<typeof envSchema>

/**
 * Helper to check if running in production
 */
export const isProduction = config.NODE_ENV === 'production'

/**
 * Helper to check if running in development
 */
export const isDevelopment = config.NODE_ENV === 'development'

/**
 * Helper to check if running in test
 */
export const isTest = config.NODE_ENV === 'test'

/**
 * Helper to check if Resend is configured (production email)
 */
export const hasResend = !!config.RESEND_API_KEY

/**
 * Helper to check if Upstash Redis is configured (production rate limiting)
 */
export const hasUpstash = !!(config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN)
