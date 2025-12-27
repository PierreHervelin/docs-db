/**
 * RevokedToken repository
 * Handles database operations for revoked (blacklisted) tokens
 */

import { prisma } from '@/lib/db/prisma'
import type { RevokedToken } from '@prisma/client'

/**
 * Add a token to the blacklist
 */
export async function createRevokedToken(data: {
  jti: string
  tokenType: string
  expiresAt: Date
  reason: string
  userId?: string
}): Promise<RevokedToken> {
  return prisma.revokedToken.create({
    data: {
      jti: data.jti,
      tokenType: data.tokenType,
      expiresAt: data.expiresAt,
      reason: data.reason,
      userId: data.userId,
    },
  })
}

/**
 * Check if a token is blacklisted
 */
export async function findRevokedTokenByJti(jti: string): Promise<RevokedToken | null> {
  return prisma.revokedToken.findUnique({
    where: { jti },
  })
}

/**
 * Clean up expired revoked tokens (keep for 7 days after expiry for security audit)
 */
export async function cleanupExpiredRevokedTokens(): Promise<{ count: number }> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: sevenDaysAgo,
      },
    },
  })
}
