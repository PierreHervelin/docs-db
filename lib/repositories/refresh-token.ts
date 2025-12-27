/**
 * RefreshToken repository
 * Handles database operations for refresh tokens
 */

import { prisma } from '@/lib/db/prisma'
import type { RefreshToken } from '@prisma/client'

/**
 * Create a new refresh token
 */
export async function createRefreshToken(data: {
  userId: string
  jti: string
  tokenHash: string
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
}): Promise<RefreshToken> {
  return prisma.refreshToken.create({
    data: {
      userId: data.userId,
      jti: data.jti,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    },
  })
}

/**
 * Find a refresh token by JTI
 */
export async function findRefreshTokenByJti(jti: string): Promise<RefreshToken | null> {
  return prisma.refreshToken.findUnique({
    where: { jti },
  })
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(jti: string): Promise<RefreshToken> {
  return prisma.refreshToken.update({
    where: { jti },
    data: { revokedAt: new Date() },
  })
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<{ count: number }> {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

/**
 * Clean up expired refresh tokens (older than 30 days)
 */
export async function cleanupExpiredRefreshTokens(): Promise<{ count: number }> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: thirtyDaysAgo,
      },
    },
  })
}
