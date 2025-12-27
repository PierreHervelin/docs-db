import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import * as emailService from '@/lib/email/service'
import * as signupService from '@/lib/services/signup'

// Mock email service
jest.mock('@/lib/email/service')

describe('Signup Integration Tests', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: { contains: 'integration-test' } } },
    })
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration-test' } },
    })
  })

  afterEach(async () => {
    // Clean up after each test
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: { contains: 'integration-test' } } },
    })
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration-test' } },
    })
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Complete Signup Flow', () => {
    it('should create user, send email, and store verification token', async () => {
      const testData = {
        email: 'integration-test-1@example.com',
        password: 'TestPassword123!',
        firstName: 'Integration',
        lastName: 'Test',
      }

      // Execute signup
      const result = await signupService.signUp(testData)

      // Verify user was created
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('email', testData.email)

      // Verify user in database
      const user = await prisma.user.findUnique({
        where: { email: testData.email },
      })

      expect(user).toBeTruthy()
      expect(user?.email).toBe(testData.email)
      expect(user?.emailNormalized).toBe(testData.email.toLowerCase())
      expect(user?.emailVerified).toBe(false)
      expect(user?.firstName).toBe(testData.firstName)
      expect(user?.lastName).toBe(testData.lastName)
      expect(user?.username).toBe('integration-test-1') // Generated from email
      expect(user?.usernameNormalized).toBe('integration-test-1')

      // Verify password was hashed
      expect(user?.passwordHash).toBeTruthy()
      expect(user?.passwordHash).not.toBe(testData.password)

      // Verify verification token was created
      const token = await prisma.emailVerificationToken.findFirst({
        where: { userId: user?.id },
      })

      expect(token).toBeTruthy()
      expect(token?.token).toBeTruthy()
      expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now())

      // Verify email was sent
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        testData.email,
        `${testData.firstName} ${testData.lastName}`,
        expect.any(String)
      )
    })

    it('should reject duplicate email', async () => {
      const testData = {
        email: 'integration-test-2@example.com',
        password: 'TestPassword123!',
        firstName: 'Integration',
        lastName: 'Test',
      }

      // First signup should succeed
      await signupService.signUp(testData)

      // Second signup with same email should fail
      await expect(signupService.signUp(testData)).rejects.toThrow('existe déjà')
    })

    it('should handle email send failure gracefully', async () => {
      const testData = {
        email: 'integration-test-3@example.com',
        password: 'TestPassword123!',
        firstName: 'Integration',
        lastName: 'Test',
      }

      // Mock email send failure
      ;(emailService.sendVerificationEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      )

      // Signup should fail
      await expect(signupService.signUp(testData)).rejects.toThrow()

      // Verify user was NOT created (rollback)
      const user = await prisma.user.findUnique({
        where: { email: testData.email },
      })

      expect(user).toBeNull()
    })
  })

  describe('Email Verification Flow', () => {
    it('should verify email with valid token', async () => {
      // Create a test user
      const password = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'integration-test-4@example.com',
          emailNormalized: 'integration-test-4@example.com',
          username: 'integration.test4',
          usernameNormalized: 'integration.test4',
          firstName: 'Integration',
          lastName: 'Test4',
          passwordHash: password,
          emailVerified: false,
          failedLoginAttempts: 0,
        },
      })

      // Create verification token
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: 'test-token-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // Verify email
      const result = await signupService.verifyEmail(token.token)

      expect(result.success).toBe(true)

      // Verify user is marked as verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(updatedUser?.emailVerified).toBe(true)

      // Verify token is marked as used
      const updatedToken = await prisma.emailVerificationToken.findUnique({
        where: { id: token.id },
      })

      expect(updatedToken?.usedAt).toBeTruthy()
    })

    it('should reject expired token', async () => {
      // Create a test user
      const password = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'integration-test-5@example.com',
          emailNormalized: 'integration-test-5@example.com',
          username: 'integration.test5',
          usernameNormalized: 'integration.test5',
          firstName: 'Integration',
          lastName: 'Test5',
          passwordHash: password,
          emailVerified: false,
          failedLoginAttempts: 0,
        },
      })

      // Create expired token
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: 'expired-token-123',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      })

      // Verify should fail
      const result = await signupService.verifyEmail(token.token)

      expect(result.success).toBe(false)

      // Verify user is still not verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(updatedUser?.emailVerified).toBe(false)
    })

    it('should reject invalid token', async () => {
      const result = await signupService.verifyEmail('invalid-token-xyz')

      expect(result.success).toBe(false)
    })
  })

  describe('Resend Verification Flow', () => {
    it('should create new token and send email', async () => {
      // Create a test user
      const password = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'integration-test-6@example.com',
          emailNormalized: 'integration-test-6@example.com',
          username: 'integration.test6',
          usernameNormalized: 'integration.test6',
          firstName: 'Integration',
          lastName: 'Test6',
          passwordHash: password,
          emailVerified: false,
          failedLoginAttempts: 0,
        },
      })

      // Resend verification
      await signupService.resendVerification(user.email)

      // Verify new token was created
      const tokens = await prisma.emailVerificationToken.findMany({
        where: { userId: user.id },
      })

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0].expiresAt.getTime()).toBeGreaterThan(Date.now())

      // Verify email was sent
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        user.email,
        `${user.firstName} ${user.lastName}`,
        expect.any(String)
      )
    })

    it('should reject already verified email', async () => {
      // Create verified user
      const password = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'integration-test-7@example.com',
          emailNormalized: 'integration-test-7@example.com',
          username: 'integration.test7',
          usernameNormalized: 'integration.test7',
          firstName: 'Integration',
          lastName: 'Test7',
          passwordHash: password,
          emailVerified: true,
          failedLoginAttempts: 0,
        },
      })

      // Resend should fail
      await expect(signupService.resendVerification(user.email)).rejects.toThrow('déjà vérifié')
    })

    it('should reject non-existent email', async () => {
      await expect(signupService.resendVerification('nonexistent@example.com')).rejects.toThrow(
        'Aucun compte'
      )
    })
  })
})
