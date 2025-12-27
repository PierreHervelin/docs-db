import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import {
  deleteAllPasswordResetTokensForUser,
  findPasswordResetTokenByToken,
  markPasswordResetTokenAsUsed,
} from '@/lib/repositories/password-reset-token'
import { revokeAllUserRefreshTokens } from '@/lib/repositories/refresh-token'
import bcrypt from 'bcrypt'
import { z } from 'zod'

/**
 * Password validation schema (matches signup requirements)
 */
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial')

/**
 * Reset password request schema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token requis'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Reset password result types
 */
export type ResetPasswordSuccess = {
  success: true
  message: string
}

export type ResetPasswordError = {
  success: false
  error: 'INVALID_INPUT' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'USED_TOKEN' | 'SERVER_ERROR'
  message: string
}

export type ResetPasswordResult = ResetPasswordSuccess | ResetPasswordError

/**
 * Reset user password using a valid reset token
 *
 * Security considerations:
 * - Verifies token exists and is valid
 * - Checks token has not expired (1 hour TTL)
 * - Checks token has not been used
 * - Hashes password with bcrypt (12 rounds)
 * - Revokes all active sessions for security
 * - Deletes all password reset tokens for user
 * - Resets failed login attempts counter
 *
 * @param input - Reset password request data
 * @returns Success or error result
 */
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  try {
    // Validate input
    const validatedInput = resetPasswordSchema.parse(input)

    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(validatedInput.token).digest('hex')

    // Find token in database
    const resetToken = await findPasswordResetTokenByToken(tokenHash)

    if (!resetToken) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token invalide ou expiré',
      }
    }

    // Check if token has been used
    if (resetToken.usedAt) {
      return {
        success: false,
        error: 'USED_TOKEN',
        message: 'Ce token a déjà été utilisé',
      }
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: 'EXPIRED_TOKEN',
        message: 'Ce token a expiré. Veuillez faire une nouvelle demande.',
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(validatedInput.password, 12)

    // Update user password and reset security counters
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Mark token as used
    await markPasswordResetTokenAsUsed(resetToken.id)

    // Delete all other password reset tokens for this user
    await deleteAllPasswordResetTokensForUser(resetToken.userId)

    // Revoke all refresh tokens (force re-login on all devices)
    await revokeAllUserRefreshTokens(resetToken.userId)

    return {
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[resetPassword] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
    }
  }
}
