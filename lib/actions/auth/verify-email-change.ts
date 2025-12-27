import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import {
  deleteAllEmailChangeRequestsForUser,
  findEmailChangeRequestByToken,
  markEmailChangeRequestAsVerified,
} from '@/lib/repositories/email-change-request'
import { z } from 'zod'

/**
 * Verify email change schema
 */
export const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
})

export type VerifyEmailChangeInput = z.infer<typeof verifyEmailChangeSchema>

/**
 * Verify email change result types
 */
export type VerifyEmailChangeSuccess = {
  success: true
  message: string
  newEmail: string
}

export type VerifyEmailChangeError = {
  success: false
  error:
    | 'INVALID_INPUT'
    | 'INVALID_TOKEN'
    | 'EXPIRED_TOKEN'
    | 'ALREADY_VERIFIED'
    | 'EMAIL_TAKEN'
    | 'SERVER_ERROR'
  message: string
}

export type VerifyEmailChangeResult = VerifyEmailChangeSuccess | VerifyEmailChangeError

/**
 * Verify email change request and update user email
 *
 * Security considerations:
 * - Validates token exists and not expired
 * - Prevents double verification (already verified)
 * - Checks email still available (could have been taken)
 * - Updates both email and emailNormalized
 * - Cleans up all pending requests for user
 *
 * @param input - Verification token data
 * @returns Success or error result
 */
export async function verifyEmailChange(
  input: VerifyEmailChangeInput
): Promise<VerifyEmailChangeResult> {
  try {
    // Validate input
    const validatedInput = verifyEmailChangeSchema.parse(input)

    // Hash token to look up in database
    const tokenHash = crypto.createHash('sha256').update(validatedInput.token).digest('hex')

    // Find email change request by token
    const emailChangeRequest = await findEmailChangeRequestByToken(tokenHash)

    if (!emailChangeRequest) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Le lien de vérification est invalide',
      }
    }

    // Check if token is expired
    if (emailChangeRequest.expiresAt < new Date()) {
      return {
        success: false,
        error: 'EXPIRED_TOKEN',
        message: 'Le lien de vérification a expiré',
      }
    }

    // Check if already verified
    if (emailChangeRequest.verifiedAt) {
      return {
        success: false,
        error: 'ALREADY_VERIFIED',
        message: "Ce changement d'email a déjà été effectué",
      }
    }

    // Check if new email is still available (could have been taken since request)
    const existingUser = await prisma.user.findUnique({
      where: { emailNormalized: emailChangeRequest.newEmailNormalized },
    })

    if (existingUser && existingUser.id !== emailChangeRequest.userId) {
      return {
        success: false,
        error: 'EMAIL_TAKEN',
        message: 'Cette adresse email est maintenant utilisée par un autre utilisateur',
      }
    }

    // Update user email
    await prisma.user.update({
      where: { id: emailChangeRequest.userId },
      data: {
        email: emailChangeRequest.newEmail,
        emailNormalized: emailChangeRequest.newEmailNormalized,
      },
    })

    // Mark request as verified
    await markEmailChangeRequestAsVerified(emailChangeRequest.id)

    // Clean up all pending requests for this user
    await deleteAllEmailChangeRequestsForUser(emailChangeRequest.userId)

    console.log('\n=== EMAIL CHANGE VERIFIED ===')
    console.log('User ID:', emailChangeRequest.userId)
    console.log('New email:', emailChangeRequest.newEmail)
    console.log('=============================\n')

    return {
      success: true,
      message: 'Votre adresse email a été mise à jour avec succès',
      newEmail: emailChangeRequest.newEmail,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[verifyEmailChange] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue',
    }
  }
}
