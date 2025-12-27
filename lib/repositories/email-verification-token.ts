/**
 * EmailVerificationToken repository
 * Handles all database operations for email verification tokens
 */

import { prisma } from '@/lib/db/prisma'
import type { EmailVerificationToken } from '@prisma/client'

const TOKEN_EXPIRATION_HOURS = 24

/**
 * Create a new verification token for a user
 * Deletes any existing tokens for the user first
 */
export async function create(userId: string, token: string): Promise<EmailVerificationToken> {
  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  })

  // Create new token with 24h expiration
  return prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000),
    },
  })
}

/**
 * Find a valid (non-expired) verification token
 */
export async function findValid(token: string): Promise<EmailVerificationToken | null> {
  return prisma.emailVerificationToken.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
  })
}

/**
 * Delete a verification token by ID
 */
export async function deleteToken(id: string): Promise<void> {
  await prisma.emailVerificationToken.delete({
    where: { id },
  })
}

/**
 * Mark a verification token as used
 */
export async function markAsUsed(id: string): Promise<EmailVerificationToken> {
  return prisma.emailVerificationToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
}

/**
 * Delete all verification tokens for a user
 */
export async function deleteByUserId(userId: string): Promise<{ count: number }> {
  return prisma.emailVerificationToken.deleteMany({
    where: { userId },
  })
}

/**
 * Delete all expired tokens (cleanup job)
 */
export async function cleanupExpired(): Promise<{ count: number }> {
  return prisma.emailVerificationToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}
