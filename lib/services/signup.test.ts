/**
 * Unit tests for Signup service
 * Tests user registration business logic
 */

// Mock config first
jest.mock('@/lib/config/env', () => ({
  config: {
    DATABASE_URL: 'postgresql://test',
    SMTP_FROM: 'test@example.com',
  },
}))

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock dependencies
jest.mock('@/lib/repositories/user')
jest.mock('@/lib/repositories/email-verification-token')
jest.mock('@/lib/auth/password')
jest.mock('@/lib/email/service')
jest.mock('@/lib/security/logger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
}))

import * as passwordUtil from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import * as emailService from '@/lib/email/service'
import { AlreadyExistsError, ValidationError } from '@/lib/errors'
import * as tokenRepo from '@/lib/repositories/email-verification-token'
import * as userRepo from '@/lib/repositories/user'
import * as signupService from '@/lib/services/signup'
import type { User } from '@prisma/client'

describe('Signup Service', () => {
  const mockUser: User = {
    id: 'user-id',
    username: 'test.user',
    usernameNormalized: 'test.user',
    email: 'test@example.com',
    emailNormalized: 'test@example.com',
    emailVerified: false,
    firstName: 'Test',
    lastName: 'User',
    passwordHash: '$2b$12$hashedpassword',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully create a new user', async () => {
      // Setup mocks
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(null)
      ;(passwordUtil.hashPassword as jest.Mock).mockResolvedValue('$2b$12$hashedpassword')
      ;(emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined)

      // Mock Prisma transaction - execute callback and return result
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          emailVerificationToken: {
            create: jest.fn().mockResolvedValue({
              id: 'token-id',
              userId: 'user-id',
              token: 'verification-token',
              expiresAt: new Date(),
              createdAt: new Date(),
            }),
          },
        }
        return callback(mockTx)
      })

      const result = await signupService.signUp({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })

      expect(result).toEqual({
        userId: 'user-id',
        email: 'test@example.com',
      })

      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('Password123!')
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String)
      )
    })

    it('should throw AlreadyExistsError when email is taken', async () => {
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser)

      await expect(
        signupService.signUp({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow(AlreadyExistsError)

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should normalize email for duplicate check', async () => {
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(null)
      ;(passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hash')
      ;(emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          emailVerificationToken: {
            create: jest.fn().mockResolvedValue({ token: 'mock-token' }),
          },
        }
        return callback(mockTx)
      })

      await signupService.signUp({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })

      expect(userRepo.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        usedAt: null,
      }
      ;(tokenRepo.findValid as jest.Mock).mockResolvedValue(mockToken)

      // Mock Prisma transaction
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue({ ...mockUser, emailVerified: true }),
          },
          emailVerificationToken: {
            update: jest.fn().mockResolvedValue({ ...mockToken, usedAt: new Date() }),
          },
        }
        return callback(mockTx)
      })

      const result = await signupService.verifyEmail('valid-token')

      expect(result).toEqual({ success: true, userId: 'user-id' })
      expect(tokenRepo.findValid).toHaveBeenCalledWith('valid-token')
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should return failure for invalid token', async () => {
      ;(tokenRepo.findValid as jest.Mock).mockResolvedValue(null)

      const result = await signupService.verifyEmail('invalid-token')

      expect(result).toEqual({ success: false })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should return failure for expired token', async () => {
      ;(tokenRepo.findValid as jest.Mock).mockResolvedValue(null)

      const result = await signupService.verifyEmail('expired-token')

      expect(result).toEqual({ success: false })
    })
  })

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(tokenRepo.create as jest.Mock).mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'new-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      })
      ;(emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined)

      await signupService.resendVerification('test@example.com')

      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(tokenRepo.create).toHaveBeenCalledWith('user-id', expect.any(String))
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String)
      )
    })

    it('should throw ValidationError if user not found', async () => {
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(null)

      await expect(signupService.resendVerification('notfound@example.com')).rejects.toThrow(
        ValidationError
      )

      expect(tokenRepo.create).not.toHaveBeenCalled()
    })

    it('should throw ValidationError if email already verified', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true }
      ;(userRepo.findByEmail as jest.Mock).mockResolvedValue(verifiedUser)

      await expect(signupService.resendVerification('test@example.com')).rejects.toThrow(
        ValidationError
      )

      expect(tokenRepo.create).not.toHaveBeenCalled()
    })
  })
})
