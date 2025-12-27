/**
 * Unit tests for RevokedToken repository
 */

import { prisma } from '@/lib/db/prisma'
import {
  cleanupExpiredRevokedTokens,
  createRevokedToken,
  findRevokedTokenByJti,
} from '@/lib/repositories/revoked-token'

describe('RevokedToken Repository', () => {
  const testJti = 'test-revoked-jti'
  let testUserId: string

  beforeAll(async () => {
    // Create a test user for foreign key constraints
    const user = await prisma.user.create({
      data: {
        email: 'revoked-token-test@example.com',
        emailNormalized: 'revoked-token-test@example.com',
        username: 'revoked-token-test-user',
        usernameNormalized: 'revoked-token-test-user',
        passwordHash: 'dummy-hash',
        firstName: 'Test',
        lastName: 'User',
      },
    })
    testUserId = user.id
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.revokedToken.deleteMany({
      where: { jti: { contains: 'test-revoked' } },
    })
  })

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  describe('createRevokedToken', () => {
    it('should add a token to the blacklist with all required fields', async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const revoked = await createRevokedToken({
        jti: testJti,
        tokenType: 'access',
        expiresAt,
        reason: 'user_logout',
      })

      expect(revoked).toBeDefined()
      expect(revoked.jti).toBe(testJti)
      expect(revoked.tokenType).toBe('access')
      expect(revoked.expiresAt).toEqual(expiresAt)
      expect(revoked.reason).toBe('user_logout')
      expect(revoked.revokedAt).toBeInstanceOf(Date)
    })

    it('should optionally associate with a user', async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

      const revoked = await createRevokedToken({
        jti: `${testJti}-with-user`,
        userId: testUserId,
        tokenType: 'access',
        expiresAt,
        reason: 'security_breach',
      })

      expect(revoked.userId).toBe(testUserId)
    })

    it('should allow different revocation reasons', async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const reasons = ['user_logout', 'password_change', 'security_breach', 'admin_revoke']

      for (const reason of reasons) {
        const revoked = await createRevokedToken({
          jti: `${testJti}-${reason}`,
          tokenType: 'access',
          expiresAt,
          reason,
        })

        expect(revoked.reason).toBe(reason)
      }
    })

    it('should support different token types', async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const types = ['access', 'refresh']

      for (const tokenType of types) {
        const revoked = await createRevokedToken({
          jti: `${testJti}-${tokenType}`,
          tokenType,
          expiresAt,
          reason: 'test',
        })

        expect(revoked.tokenType).toBe(tokenType)
      }
    })
  })

  describe('findRevokedTokenByJti', () => {
    it('should find a blacklisted token by JTI', async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const created = await createRevokedToken({
        jti: `${testJti}-find`,
        tokenType: 'access',
        expiresAt,
        reason: 'test',
      })

      const found = await findRevokedTokenByJti(created.jti)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.jti).toBe(created.jti)
    })

    it('should return null if token is not blacklisted', async () => {
      const found = await findRevokedTokenByJti('non-existent-jti')

      expect(found).toBeNull()
    })

    it('should find expired but not yet cleaned up tokens', async () => {
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

      const created = await createRevokedToken({
        jti: `${testJti}-expired`,
        tokenType: 'access',
        expiresAt: expiredDate,
        reason: 'test',
      })

      const found = await findRevokedTokenByJti(created.jti)

      expect(found).toBeDefined()
    })
  })

  describe('cleanupExpiredRevokedTokens', () => {
    it('should delete tokens expired more than 7 days ago', async () => {
      const oldExpiredDate = new Date()
      oldExpiredDate.setDate(oldExpiredDate.getDate() - 8) // 8 days ago

      await createRevokedToken({
        jti: `${testJti}-old-expired`,
        tokenType: 'access',
        expiresAt: oldExpiredDate,
        reason: 'test',
      })

      const result = await cleanupExpiredRevokedTokens()

      expect(result.count).toBeGreaterThanOrEqual(1)

      // Verify token was deleted
      const token = await findRevokedTokenByJti(`${testJti}-old-expired`)
      expect(token).toBeNull()
    })

    it('should keep tokens expired less than 7 days ago for audit', async () => {
      const recentExpiredDate = new Date()
      recentExpiredDate.setDate(recentExpiredDate.getDate() - 3) // 3 days ago

      await createRevokedToken({
        jti: `${testJti}-recent-expired`,
        tokenType: 'access',
        expiresAt: recentExpiredDate,
        reason: 'test',
      })

      await cleanupExpiredRevokedTokens()

      // Verify token still exists for audit trail
      const token = await findRevokedTokenByJti(`${testJti}-recent-expired`)
      expect(token).toBeDefined()
    })

    it('should not delete non-expired tokens', async () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000)

      await createRevokedToken({
        jti: `${testJti}-future`,
        tokenType: 'access',
        expiresAt: futureDate,
        reason: 'test',
      })

      await cleanupExpiredRevokedTokens()

      // Verify token still exists
      const token = await findRevokedTokenByJti(`${testJti}-future`)
      expect(token).toBeDefined()
    })

    it('should preserve userId associations for audit trail', async () => {
      const recentExpiredDate = new Date()
      recentExpiredDate.setDate(recentExpiredDate.getDate() - 3)

      const created = await createRevokedToken({
        jti: `${testJti}-user-audit`,
        userId: testUserId,
        tokenType: 'access',
        expiresAt: recentExpiredDate,
        reason: 'security_check',
      })

      await cleanupExpiredRevokedTokens()

      const token = await findRevokedTokenByJti(created.jti)
      expect(token?.userId).toBe(testUserId)
      expect(token?.reason).toBe('security_check')
    })
  })
})
