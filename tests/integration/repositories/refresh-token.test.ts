/**
 * Unit tests for RefreshToken repository
 */

import { prisma } from '@/lib/db/prisma'
import {
  cleanupExpiredRefreshTokens,
  createRefreshToken,
  findRefreshTokenByJti,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
} from '@/lib/repositories/refresh-token'

describe('RefreshToken Repository', () => {
  let testUserId: string
  const testJti = 'test-jti'
  const testTokenHash = 'test-token-hash'

  beforeAll(async () => {
    // Create a test user for foreign key constraints
    const user = await prisma.user.create({
      data: {
        email: 'refresh-token-test@example.com',
        emailNormalized: 'refresh-token-test@example.com',
        username: 'refresh-token-test-user',
        usernameNormalized: 'refresh-token-test-user',
        passwordHash: 'dummy-hash',
        firstName: 'Test',
        lastName: 'User',
      },
    })
    testUserId = user.id
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({
      where: { userId: testUserId },
    })
  })

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  describe('createRefreshToken', () => {
    it('should create a new refresh token', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const token = await createRefreshToken({
        userId: testUserId,
        jti: testJti,
        tokenHash: testTokenHash,
        expiresAt,
      })

      expect(token).toBeDefined()
      expect(token.userId).toBe(testUserId)
      expect(token.jti).toBe(testJti)
      expect(token.tokenHash).toBe(testTokenHash)
      expect(token.expiresAt).toEqual(expiresAt)
      expect(token.revokedAt).toBeNull()
    })

    it('should set createdAt and lastUsedAt timestamps', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const token = await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-timestamp`,
        tokenHash: testTokenHash,
        expiresAt,
      })

      expect(token.createdAt).toBeInstanceOf(Date)
      expect(token.lastUsedAt).toBeInstanceOf(Date)
    })

    it('should optionally store userAgent and ipAddress', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const token = await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-metadata`,
        tokenHash: testTokenHash,
        expiresAt,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      })

      expect(token.userAgent).toBe('Test Browser')
      expect(token.ipAddress).toBe('127.0.0.1')
    })
  })

  describe('findRefreshTokenByJti', () => {
    it('should find a token by JTI', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const created = await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-find`,
        tokenHash: testTokenHash,
        expiresAt,
      })

      const found = await findRefreshTokenByJti(created.jti)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.jti).toBe(created.jti)
    })

    it('should return null if token not found', async () => {
      const found = await findRefreshTokenByJti('non-existent-jti')

      expect(found).toBeNull()
    })
  })

  describe('revokeRefreshToken', () => {
    it('should revoke a specific token', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const token = await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-revoke`,
        tokenHash: testTokenHash,
        expiresAt,
      })

      const revoked = await revokeRefreshToken(token.jti)

      expect(revoked.revokedAt).toBeInstanceOf(Date)
      expect(revoked.revokedAt).not.toBeNull()
    })

    it('should throw error if token does not exist', async () => {
      await expect(revokeRefreshToken('non-existent-jti')).rejects.toThrow()
    })
  })

  describe('revokeAllUserRefreshTokens', () => {
    it('should revoke all non-revoked tokens for a user', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create multiple tokens for the user
      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-bulk-1`,
        tokenHash: testTokenHash,
        expiresAt,
      })
      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-bulk-2`,
        tokenHash: testTokenHash,
        expiresAt,
      })
      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-bulk-3`,
        tokenHash: testTokenHash,
        expiresAt,
      })

      const result = await revokeAllUserRefreshTokens(testUserId)

      expect(result.count).toBe(3)

      // Verify all tokens are revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { userId: testUserId },
      })
      expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)
    })

    it('should not affect already revoked tokens', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create and revoke one token
      const token1 = await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-already-revoked`,
        tokenHash: testTokenHash,
        expiresAt,
      })
      await revokeRefreshToken(token1.jti)

      // Create another token
      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-not-revoked`,
        tokenHash: testTokenHash,
        expiresAt,
      })

      const result = await revokeAllUserRefreshTokens(testUserId)

      // Should only revoke the one non-revoked token
      expect(result.count).toBe(1)
    })
  })

  describe('cleanupExpiredRefreshTokens', () => {
    it('should delete tokens expired more than 30 days ago', async () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 31) // 31 days ago

      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-expired`,
        tokenHash: testTokenHash,
        expiresAt: expiredDate,
      })

      const result = await cleanupExpiredRefreshTokens()

      expect(result.count).toBeGreaterThanOrEqual(1)

      // Verify token was deleted
      const token = await findRefreshTokenByJti(`${testJti}-expired`)
      expect(token).toBeNull()
    })

    it('should not delete tokens expired less than 30 days ago', async () => {
      const recentlyExpired = new Date()
      recentlyExpired.setDate(recentlyExpired.getDate() - 15) // 15 days ago

      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-recent`,
        tokenHash: testTokenHash,
        expiresAt: recentlyExpired,
      })

      await cleanupExpiredRefreshTokens()

      // Verify token still exists
      const token = await findRefreshTokenByJti(`${testJti}-recent`)
      expect(token).toBeDefined()
    })

    it('should not delete non-expired tokens', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await createRefreshToken({
        userId: testUserId,
        jti: `${testJti}-future`,
        tokenHash: testTokenHash,
        expiresAt: futureDate,
      })

      await cleanupExpiredRefreshTokens()

      // Verify token still exists
      const token = await findRefreshTokenByJti(`${testJti}-future`)
      expect(token).toBeDefined()
    })
  })
})
