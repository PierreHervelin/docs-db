/**
 * Unit tests for EmailVerificationToken repository
 * Tests CRUD operations for email verification tokens
 */

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    emailVerificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/prisma'
import * as tokenRepo from '@/lib/repositories/email-verification-token'
import type { EmailVerificationToken } from '@prisma/client'

describe('EmailVerificationToken Repository', () => {
  const mockToken: EmailVerificationToken = {
    id: 'token-id',
    userId: 'user-id',
    token: 'verification-token-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    createdAt: new Date(),
    usedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new verification token', async () => {
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue(mockToken)

      const result = await tokenRepo.create('user-id', 'verification-token-123')

      expect(result).toEqual(mockToken)
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          token: 'verification-token-123',
          expiresAt: expect.any(Date),
        },
      })

      // Check expiration is ~24h from now
      const createCall = (prisma.emailVerificationToken.create as jest.Mock).mock.calls[0][0]
      const expiresAt = createCall.data.expiresAt
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000
      expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(1000)
    })

    it('should delete existing tokens before creating new one', async () => {
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue(mockToken)

      await tokenRepo.create('user-id', 'new-token')

      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      })
    })
  })

  describe('findValid', () => {
    it('should find valid token by token string', async () => {
      ;(prisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

      const result = await tokenRepo.findValid('verification-token-123')

      expect(result).toEqual(mockToken)
      expect(prisma.emailVerificationToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'verification-token-123',
          expiresAt: { gt: expect.any(Date) },
        },
      })
    })

    it('should return null for expired token', async () => {
      ;(prisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await tokenRepo.findValid('expired-token')

      expect(result).toBeNull()
    })

    it('should return null for nonexistent token', async () => {
      ;(prisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await tokenRepo.findValid('nonexistent-token')

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete token by id', async () => {
      ;(prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue(mockToken)

      await tokenRepo.deleteToken('token-id')

      expect(prisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      })
    })
  })

  describe('deleteByUserId', () => {
    it('should delete all tokens for a user', async () => {
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      })

      const result = await tokenRepo.deleteByUserId('user-id')

      expect(result).toEqual({ count: 2 })
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      })
    })
  })

  describe('cleanupExpired', () => {
    it('should delete all expired tokens', async () => {
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      })

      const result = await tokenRepo.cleanupExpired()

      expect(result).toEqual({ count: 5 })
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      })
    })
  })
})
