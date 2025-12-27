import { prisma } from '@/lib/db/prisma'
import type { PasswordResetToken } from '@prisma/client'

/**
 * Create a password reset token for a user
 *
 * @param userId - User ID requesting password reset
 * @param token - Cryptographically secure token (hashed)
 * @param expiresAt - Token expiration timestamp (typically now + 1 hour)
 * @returns Created PasswordResetToken
 */
export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<PasswordResetToken> {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

/**
 * Find a password reset token by its token value
 *
 * @param token - Token string to search for
 * @returns PasswordResetToken or null if not found
 */
export async function findPasswordResetTokenByToken(
  token: string
): Promise<PasswordResetToken | null> {
  return prisma.passwordResetToken.findUnique({
    where: { token },
  })
}

/**
 * Mark a password reset token as used
 *
 * @param tokenId - ID of the token to mark as used
 * @returns Updated PasswordResetToken
 */
export async function markPasswordResetTokenAsUsed(tokenId: string): Promise<PasswordResetToken> {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  })
}

/**
 * Delete all password reset tokens for a user
 * Used when user successfully resets password or requests new token
 *
 * @param userId - User ID whose tokens should be deleted
 * @returns Count of deleted tokens
 */
export async function deleteAllPasswordResetTokensForUser(userId: string): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: { userId },
  })
  return result.count
}

/**
 * Cleanup expired password reset tokens
 * Should be run periodically (e.g., daily via cron)
 *
 * @returns Count of deleted tokens
 */
export async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
