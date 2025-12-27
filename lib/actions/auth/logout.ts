import { extractJti } from '@/lib/auth/jwt'
import { findRefreshTokenByJti, revokeRefreshToken } from '@/lib/repositories/refresh-token'
import { createRevokedToken } from '@/lib/repositories/revoked-token'

/**
 * Logout result types
 */
export type LogoutSuccess = {
  success: true
  message: string
}

export type LogoutError = {
  success: false
  error: 'INVALID_TOKEN' | 'SERVER_ERROR'
  message: string
}

export type LogoutResult = LogoutSuccess | LogoutError

/**
 * Log out a user by revoking their tokens
 *
 * This function:
 * 1. Extracts JTI from access token
 * 2. Adds access token to blacklist (RevokedToken)
 * 3. Finds and revokes associated refresh token if present
 * 4. Clears cookies (handled in API route)
 *
 * Security considerations:
 * - Access token is blacklisted immediately
 * - Refresh token is revoked to prevent new access tokens
 * - User must log in again to access protected resources
 *
 * @param accessToken - The JWT access token to revoke
 * @param refreshToken - Optional refresh token to revoke
 * @returns Success or error result
 */
export async function logout(accessToken: string, refreshToken?: string): Promise<LogoutResult> {
  try {
    // Extract JTI from access token
    const accessJti = extractJti(accessToken)

    if (!accessJti) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token invalide',
      }
    }

    // Add access token to blacklist
    // Token expires in 15 minutes, keep in blacklist for 30 minutes for safety
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await createRevokedToken({
      jti: accessJti,
      tokenType: 'access',
      expiresAt,
      reason: 'User logout',
    })

    // If refresh token provided, revoke it
    if (refreshToken) {
      const refreshJti = extractJti(refreshToken)

      if (refreshJti) {
        // Find refresh token in database
        const refreshTokenRecord = await findRefreshTokenByJti(refreshJti)

        if (refreshTokenRecord) {
          // Revoke refresh token
          await revokeRefreshToken(refreshTokenRecord.id)
        }
      }
    }

    return {
      success: true,
      message: 'Déconnexion réussie',
    }
  } catch (error) {
    console.error('[logout] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue lors de la déconnexion',
    }
  }
}
