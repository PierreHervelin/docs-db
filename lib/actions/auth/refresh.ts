'use server'

import { verifyToken } from '@/lib/auth/jwt'
import { generateTokens } from '@/lib/auth/jwt'
import type { RefreshTokenPayload } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import {
  createRefreshToken,
  findRefreshTokenByJti,
  revokeRefreshToken,
} from '@/lib/repositories/refresh-token'
import { findRevokedTokenByJti } from '@/lib/repositories/revoked-token'
import { z } from 'zod'

// Validation schema for refresh input
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Le token de rafraîchissement est requis'),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
})

export type RefreshInput = z.infer<typeof refreshSchema>

export type RefreshResult =
  | {
      success: true
      data: {
        accessToken: string
        refreshToken: string
        accessTokenExpiresAt: Date
        refreshTokenExpiresAt: Date
      }
    }
  | {
      success: false
      error: string
    }

/**
 * Refresh access token using a refresh token
 * Implements token rotation for security
 * Checks blacklist for revoked tokens
 */
export async function refreshAccessToken(input: RefreshInput): Promise<RefreshResult> {
  try {
    // Validate input
    const validationResult = refreshSchema.safeParse(input)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const { refreshToken, userAgent, ipAddress } = validationResult.data

    // Verify token signature and structure
    const payload = await verifyToken<RefreshTokenPayload>(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      return {
        success: false,
        error: 'Token de rafraîchissement invalide',
      }
    }

    // Check if token is blacklisted (revoked)
    const isRevoked = await findRevokedTokenByJti(payload.jti)
    if (isRevoked) {
      return {
        success: false,
        error: 'Token révoqué',
      }
    }

    // Find refresh token in database
    const storedToken = await findRefreshTokenByJti(payload.jti)
    if (!storedToken) {
      return {
        success: false,
        error: 'Token non trouvé',
      }
    }

    // Check if token is already revoked
    if (storedToken.revokedAt) {
      return {
        success: false,
        error: 'Token révoqué',
      }
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      return {
        success: false,
        error: 'Token expiré',
      }
    }

    // Get user email from database (needed for new tokens)
    const userId = payload.sub
    if (!userId) {
      return {
        success: false,
        error: 'Utilisateur non trouvé dans le token',
      }
    }

    // Fetch user to get email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé',
      }
    }

    // Token rotation: Revoke old refresh token
    await revokeRefreshToken(payload.jti)

    // Calculate if this was a "remember me" token based on original expiration
    // If original token had >14 days, it was a "remember me" token
    const originalDuration = storedToken.expiresAt.getTime() - storedToken.createdAt.getTime()
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
    const rememberMe = originalDuration > fourteenDaysMs

    // Generate new tokens (access + refresh)
    const newTokens = await generateTokens({ userId: user.id, email: user.email }, rememberMe)

    // Create new refresh token in database
    await createRefreshToken({
      userId: user.id,
      jti: newTokens.jti,
      tokenHash: newTokens.tokenHash,
      expiresAt: newTokens.refreshTokenExpiresAt,
      userAgent,
      ipAddress,
    })

    return {
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        accessTokenExpiresAt: newTokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: newTokens.refreshTokenExpiresAt,
      },
    }
  } catch (error) {
    console.error('Refresh token error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors du rafraîchissement du token',
    }
  }
}
