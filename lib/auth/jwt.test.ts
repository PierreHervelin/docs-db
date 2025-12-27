// Mock config before importing jwt
jest.mock('@/lib/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-for-jwt-testing-only',
    JWT_ACCESS_EXPIRATION: '30m',
    JWT_REFRESH_EXPIRATION: '30d',
  },
}))

import { createAccessToken, createRefreshToken, extractJti, verifyToken } from './jwt'
import type { AccessTokenPayload, RefreshTokenPayload } from './jwt'

describe('JWT Utilities', () => {
  describe('createAccessToken', () => {
    it('should create a valid access token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include correct payload in access token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const payload = await verifyToken<AccessTokenPayload>(token)

      expect(payload).toBeTruthy()
      expect(payload?.sub).toBe(userId)
      expect(payload?.type).toBe('access')
      expect(payload?.jti).toBeTruthy()
      expect(payload?.iat).toBeTruthy()
      expect(payload?.exp).toBeTruthy()
    })

    it('should create different JTIs for different tokens', async () => {
      const userId = 'test-user-id'
      const token1 = await createAccessToken(userId)
      const token2 = await createAccessToken(userId)

      const payload1 = await verifyToken<AccessTokenPayload>(token1)
      const payload2 = await verifyToken<AccessTokenPayload>(token2)

      expect(payload1?.jti).not.toBe(payload2?.jti)
    })
  })

  describe('createRefreshToken', () => {
    it('should create a valid refresh token with JTI', async () => {
      const userId = 'test-user-id'
      const { token, jti } = await createRefreshToken(userId)

      expect(token).toBeTruthy()
      expect(jti).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(typeof jti).toBe('string')
    })

    it('should include correct payload in refresh token', async () => {
      const userId = 'test-user-id'
      const { token, jti } = await createRefreshToken(userId)
      const payload = await verifyToken<RefreshTokenPayload>(token)

      expect(payload).toBeTruthy()
      expect(payload?.sub).toBe(userId)
      expect(payload?.type).toBe('refresh')
      expect(payload?.jti).toBe(jti)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const payload = await verifyToken<AccessTokenPayload>(token)

      expect(payload).toBeTruthy()
      expect(payload?.sub).toBe(userId)
    })

    it('should return null for invalid token', async () => {
      const payload = await verifyToken('invalid.token.here')
      expect(payload).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const payload = await verifyToken('not-a-jwt')
      expect(payload).toBeNull()
    })

    it('should return null for tampered token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const tamperedToken = `${token.slice(0, -5)}xxxxx`
      const payload = await verifyToken(tamperedToken)

      expect(payload).toBeNull()
    })
  })

  describe('extractJti', () => {
    it('should extract JTI from valid token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const jti = extractJti(token)

      expect(jti).toBeTruthy()
      expect(typeof jti).toBe('string')
    })

    it('should return null for invalid token', () => {
      const jti = extractJti('invalid.token')
      expect(jti).toBeNull()
    })

    it('should return null for malformed token', () => {
      const jti = extractJti('not-a-jwt')
      expect(jti).toBeNull()
    })

    it('should match JTI from verification', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const extractedJti = extractJti(token)
      const payload = await verifyToken<AccessTokenPayload>(token)

      expect(extractedJti).toBe(payload?.jti)
    })
  })

  describe('Token expiration', () => {
    it('should have expiration time in access token', async () => {
      const userId = 'test-user-id'
      const token = await createAccessToken(userId)
      const payload = await verifyToken<AccessTokenPayload>(token)

      expect(payload?.exp).toBeTruthy()
      expect(payload?.iat).toBeTruthy()

      // Expiration should be after issuance
      if (payload?.exp && payload?.iat) {
        expect(payload.exp).toBeGreaterThan(payload.iat)
      }
    })

    it('should have expiration time in refresh token', async () => {
      const userId = 'test-user-id'
      const { token } = await createRefreshToken(userId)
      const payload = await verifyToken<RefreshTokenPayload>(token)

      expect(payload?.exp).toBeTruthy()
      expect(payload?.iat).toBeTruthy()

      // Expiration should be after issuance
      if (payload?.exp && payload?.iat) {
        expect(payload.exp).toBeGreaterThan(payload.iat)
      }
    })
  })
})
