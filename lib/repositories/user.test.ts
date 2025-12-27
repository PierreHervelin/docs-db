/**
 * Unit tests for User repository
 * Tests CRUD operations for User entity
 */

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/prisma'
import * as userRepo from '@/lib/repositories/user'
import type { User } from '@prisma/client'

describe('User Repository', () => {
  const mockUser: User = {
    id: 'test-user-id',
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new user', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const result = await userRepo.create({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: '$2b$12$hashedpassword',
      })

      expect(result).toEqual(mockUser)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          emailNormalized: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          passwordHash: '$2b$12$hashedpassword',
          username: 'test.user',
          usernameNormalized: 'test.user',
        },
      })
    })

    it('should normalize email to lowercase', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      await userRepo.create({
        email: 'Test@Example.COM',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: '$2b$12$hashedpassword',
      })

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'Test@Example.COM',
          emailNormalized: 'test@example.com',
        }),
      })
    })
  })

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await userRepo.findByEmail('TEST@EXAMPLE.COM')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { emailNormalized: 'test@example.com' },
      })
    })

    it('should return null when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await userRepo.findByEmail('notfound@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('should find user by ID', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await userRepo.findById('test-user-id')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      })
    })

    it('should return null when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await userRepo.findById('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('verifyEmail', () => {
    it('should mark user email as verified', async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(verifiedUser)

      const result = await userRepo.verifyEmail('test-user-id')

      expect(result).toEqual(verifiedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { emailVerified: true },
      })
    })
  })

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const now = new Date()
      const updatedUser = { ...mockUser, lastLoginAt: now }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await userRepo.updateLastLogin('test-user-id')

      expect(result).toEqual(updatedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { lastLoginAt: expect.any(Date) },
      })
    })
  })

  describe('updatePassword', () => {
    it('should update user password hash', async () => {
      const updatedUser = {
        ...mockUser,
        passwordHash: '$2b$12$newhashedpassword',
      }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await userRepo.updatePassword('test-user-id', '$2b$12$newhashedpassword')

      expect(result).toEqual(updatedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { passwordHash: '$2b$12$newhashedpassword' },
      })
    })
  })

  describe('updateEmail', () => {
    it('should update user email', async () => {
      const updatedUser = {
        ...mockUser,
        email: 'newemail@example.com',
        normalizedEmail: 'newemail@example.com',
        isEmailVerified: false,
      }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await userRepo.updateEmail('test-user-id', 'newemail@example.com')

      expect(result).toEqual(updatedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          email: 'newemail@example.com',
          emailNormalized: 'newemail@example.com',
          emailVerified: false,
        },
      })
    })

    it('should normalize new email to lowercase', async () => {
      const updatedUser = {
        ...mockUser,
        email: 'NewEmail@Example.COM',
        normalizedEmail: 'newemail@example.com',
      }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await userRepo.updateEmail('test-user-id', 'NewEmail@Example.COM')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          emailNormalized: 'newemail@example.com',
        }),
      })
    })
  })
})
