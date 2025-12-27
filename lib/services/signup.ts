/**
 * Signup service
 * Handles user registration and email verification business logic
 */

import { randomBytes } from 'node:crypto'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { sendVerificationEmail } from '@/lib/email/service'
import { AlreadyExistsError, ValidationError } from '@/lib/errors'
import * as tokenRepo from '@/lib/repositories/email-verification-token'
import * as userRepo from '@/lib/repositories/user'
import { logSecurityEvent } from '@/lib/security/logger'

export interface SignUpInput {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface SignUpResult {
  userId: string
  email: string
}

/**
 * Register a new user
 * Creates user account and sends verification email
 * Uses transaction to ensure atomicity - rolls back if email send fails
 */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  // Check if user already exists
  const existingUser = await userRepo.findByEmail(input.email)
  if (existingUser) {
    throw new AlreadyExistsError('Un compte existe déjà avec cet email')
  }

  // Hash password
  const passwordHash = await hashPassword(input.password)

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create user within transaction
    const user = await tx.user.create({
      data: {
        email: input.email,
        emailNormalized: input.email.toLowerCase(),
        username: input.email.split('@')[0],
        usernameNormalized: input.email.split('@')[0].toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        emailVerified: false,
        failedLoginAttempts: 0,
      },
    })

    // Generate verification token within transaction
    const token = randomBytes(32).toString('hex')
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Send verification email - if this fails, transaction will rollback
    await sendVerificationEmail(input.email, `${input.firstName} ${input.lastName}`, token)

    return { user, token }
  })

  // Log security event (outside transaction - best effort)
  await logSecurityEvent({
    eventType: 'account_created',
    userId: result.user.id,
    metadata: { email: input.email },
  }).catch((err) => {
    console.error('Failed to log security event:', err)
  })

  return {
    userId: result.user.id,
    email: result.user.email,
  }
}

/**
 * Verify user email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; userId?: string }> {
  // Find valid token
  const verificationToken = await tokenRepo.findValid(token)
  if (!verificationToken) {
    return { success: false }
  }

  // Mark email as verified and token as used in a transaction
  await prisma.$transaction(async (tx) => {
    // Mark email as verified
    await tx.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    })

    // Mark token as used
    await tx.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    })
  })

  // Log security event (best effort)
  await logSecurityEvent({
    eventType: 'email_verified',
    userId: verificationToken.userId,
  }).catch((err) => {
    console.error('Failed to log security event:', err)
  })

  return { success: true, userId: verificationToken.userId }
}

/**
 * Resend verification email
 */
export async function resendVerification(email: string): Promise<void> {
  // Find user
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new ValidationError('Aucun compte trouvé avec cet email')
  }

  // Check if already verified
  if (user.emailVerified) {
    throw new ValidationError('Cet email est déjà vérifié')
  }

  // Generate new token
  const token = randomBytes(32).toString('hex')
  await tokenRepo.create(user.id, token)

  // Send email
  await sendVerificationEmail(email, `${user.firstName} ${user.lastName}`, token)

  // Log security event
  await logSecurityEvent({
    eventType: 'email_verified',
    userId: user.id,
    metadata: { email },
  })
}
