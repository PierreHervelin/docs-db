import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import {
  createPasswordResetToken,
  deleteAllPasswordResetTokensForUser,
} from '@/lib/repositories/password-reset-token'
import { z } from 'zod'

/**
 * Forgot password request schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Forgot password result types
 */
export type ForgotPasswordSuccess = {
  success: true
  message: string
}

export type ForgotPasswordError = {
  success: false
  error: 'INVALID_INPUT' | 'RATE_LIMIT_EXCEEDED' | 'EMAIL_SEND_FAILED'
  message: string
}

export type ForgotPasswordResult = ForgotPasswordSuccess | ForgotPasswordError

/**
 * Request a password reset for a user
 *
 * Security considerations:
 * - Always returns success to prevent email enumeration
 * - Generates cryptographically secure token (32 bytes)
 * - Token expires after 1 hour
 * - Invalidates all previous reset tokens for user
 * - Rate limited to prevent abuse
 *
 * @param input - Forgot password request data
 * @returns Success message (even if email doesn't exist)
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
  try {
    // Validate input
    const validatedInput = forgotPasswordSchema.parse(input)
    const emailNormalized = validatedInput.email.toLowerCase().trim()

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { emailNormalized },
      select: {
        id: true,
        email: true,
        username: true,
        passwordResetTokens: {
          where: {
            createdAt: {
              // Check if user requested reset in last 5 minutes (rate limit)
              gte: new Date(Date.now() - 5 * 60 * 1000),
            },
          },
          select: { id: true },
        },
      },
    })

    // Rate limiting: max 1 request per 5 minutes
    if (user?.passwordResetTokens.length && user.passwordResetTokens.length > 0) {
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Trop de demandes. Veuillez réessayer dans quelques minutes.',
      }
    }

    // If user exists, create reset token
    if (user) {
      // Delete all existing reset tokens for this user
      await deleteAllPasswordResetTokensForUser(user.id)

      // Generate cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex')

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // Store hashed token in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await createPasswordResetToken(user.id, tokenHash, expiresAt)

      // TODO: Send email with reset link
      // Email will contain: ${baseUrl}/auth/reset-password?token=${token}
      // For now, log to console (will be implemented with nodemailer)
      console.log(`[DEV] Password reset token for ${user.email}: ${token}`)
      console.log(`[DEV] Reset link: http://localhost:3000/auth/reset-password?token=${token}`)
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message:
        'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation sous peu.',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[forgotPassword] Unexpected error:', error)
    return {
      success: false,
      error: 'EMAIL_SEND_FAILED',
      message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
    }
  }
}
