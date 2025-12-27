import { RateLimitPresets, clearRateLimit, rateLimit } from './index'

describe('Rate Limiter', () => {
  beforeEach(async () => {
    // Clear any existing rate limits before each test
    await clearRateLimit('test-key')
  })

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', async () => {
      const result1 = await rateLimit('test-key', { max: 3, windowMs: 1000 })
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await rateLimit('test-key', { max: 3, windowMs: 1000 })
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await rateLimit('test-key', { max: 3, windowMs: 1000 })
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests over limit', async () => {
      const config = { max: 2, windowMs: 1000 }

      await rateLimit('test-key', config)
      await rateLimit('test-key', config)

      const result = await rateLimit('test-key', config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should return correct limit info', async () => {
      const config = { max: 5, windowMs: 1000 }
      const result = await rateLimit('test-key', config)

      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.resetAt).toBeInstanceOf(Date)
    })
  })

  describe('Key isolation', () => {
    it('should track different keys independently', async () => {
      const config = { max: 2, windowMs: 1000 }

      const result1 = await rateLimit('key1', config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(1)

      const result2 = await rateLimit('key2', config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await rateLimit('key1', config)
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)

      const result4 = await rateLimit('key2', config)
      expect(result4.success).toBe(true)
      expect(result4.remaining).toBe(0)
    })
  })

  describe('Window expiration', () => {
    it('should reset after window expires', async () => {
      const config = { max: 2, windowMs: 100 } // 100ms window

      // Use up the limit
      await rateLimit('test-key', config)
      await rateLimit('test-key', config)

      // Should be blocked
      let result = await rateLimit('test-key', config)
      expect(result.success).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should be allowed again
      result = await rateLimit('test-key', config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should provide accurate reset time', async () => {
      const config = { max: 1, windowMs: 1000 }
      const before = Date.now()

      const result = await rateLimit('test-key', config)
      const after = Date.now()

      const resetTime = result.resetAt.getTime()
      expect(resetTime).toBeGreaterThanOrEqual(before + config.windowMs)
      expect(resetTime).toBeLessThanOrEqual(after + config.windowMs + 10)
    })
  })

  describe('clearRateLimit', () => {
    it('should clear rate limit for a key', async () => {
      const config = { max: 1, windowMs: 10000 }

      // Use up the limit
      await rateLimit('test-key', config)
      let result = await rateLimit('test-key', config)
      expect(result.success).toBe(false)

      // Clear the limit
      await clearRateLimit('test-key')

      // Should be allowed again
      result = await rateLimit('test-key', config)
      expect(result.success).toBe(true)
    })

    it('should not affect other keys', async () => {
      const config = { max: 1, windowMs: 10000 }

      // Block both keys
      await rateLimit('key1', config)
      await rateLimit('key1', config)
      await rateLimit('key2', config)
      await rateLimit('key2', config)

      // Clear only key1
      await clearRateLimit('key1')

      // key1 should work, key2 should still be blocked
      const result1 = await rateLimit('key1', config)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit('key2', config)
      expect(result2.success).toBe(false)
    })
  })

  describe('RateLimitPresets', () => {
    it('should have SIGNUP preset', () => {
      expect(RateLimitPresets.SIGNUP).toBeDefined()
      expect(RateLimitPresets.SIGNUP.max).toBe(3)
      expect(RateLimitPresets.SIGNUP.windowMs).toBe(60 * 60 * 1000) // 1 hour
    })

    it('should have LOGIN preset', () => {
      expect(RateLimitPresets.LOGIN).toBeDefined()
      expect(RateLimitPresets.LOGIN.max).toBe(5)
      expect(RateLimitPresets.LOGIN.windowMs).toBe(15 * 60 * 1000) // 15 minutes
    })

    it('should have PASSWORD_RESET preset', () => {
      expect(RateLimitPresets.PASSWORD_RESET).toBeDefined()
      expect(RateLimitPresets.PASSWORD_RESET.max).toBe(3)
      expect(RateLimitPresets.PASSWORD_RESET.windowMs).toBe(60 * 60 * 1000) // 1 hour
    })

    it('should work with preset configs', async () => {
      const result = await rateLimit('test-key', RateLimitPresets.SIGNUP)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
    })
  })

  describe('Edge cases', () => {
    it('should handle concurrent requests', async () => {
      const config = { max: 5, windowMs: 1000 }

      const promises = Array(10)
        .fill(null)
        .map(() => rateLimit('test-key', config))

      const results = await Promise.all(promises)
      const successful = results.filter((r) => r.success).length
      const blocked = results.filter((r) => !r.success).length

      expect(successful).toBe(5)
      expect(blocked).toBe(5)
    })

    it('should handle max=1 limit', async () => {
      const config = { max: 1, windowMs: 1000 }

      const result1 = await rateLimit('test-key', config)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit('test-key', config)
      expect(result2.success).toBe(false)
    })

    it('should handle very short windows', async () => {
      const config = { max: 2, windowMs: 10 }

      await rateLimit('test-key', config)
      await rateLimit('test-key', config)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 20))

      const result = await rateLimit('test-key', config)
      expect(result.success).toBe(true)
    })
  })
})
