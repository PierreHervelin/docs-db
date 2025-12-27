/**
 * Simple in-memory rate limiter for development
 * Production: Use Upstash Redis or similar
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  max: number // Maximum requests
  windowMs: number // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: Date
}

/**
 * Checks if a request should be rate limited
 */
export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now()
  const entry = store.get(key)

  // Clean expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries()
  }

  if (!entry || entry.resetAt <= now) {
    // Create new entry
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetAt: new Date(resetAt),
    }
  }

  // Increment existing entry
  entry.count++

  if (entry.count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
    }
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetAt: new Date(entry.resetAt),
  }
}

/**
 * Clears rate limit for a specific key
 */
export async function clearRateLimit(key: string): Promise<void> {
  store.delete(key)
}

/**
 * Cleans up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  SIGNUP: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  LOGIN: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
  PASSWORD_RESET: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  EMAIL_VERIFICATION: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  EMAIL_CHANGE: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
}
