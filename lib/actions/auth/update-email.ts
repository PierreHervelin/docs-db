import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import {
  createEmailChangeRequest,
  deleteAllEmailChangeRequestsForUser,
} from '@/lib/repositories/email-change-request'
import { z } from 'zod'

/**
 * Email update validation schema
 */
export const updateEmailSchema = z.object({
  email: z
    .string()
    .email("L'adresse email est invalide")
    .max(255, "L'adresse email est trop longue"),
})

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>

/**
 * Email update result types
 */
export type UpdateEmailSuccess = {
  success: true
  message: string
}

export type UpdateEmailError = {
  success: false
  error: 'INVALID_INPUT' | 'SAME_EMAIL' | 'EMAIL_TAKEN' | 'EMAIL_SEND_FAILED' | 'SERVER_ERROR'
  message: string
}

export type UpdateEmailResult = UpdateEmailSuccess | UpdateEmailError

/**
 * Initiate email change request
 *
 * Security considerations:
 * - Validates email format
 * - Checks uniqueness (case-insensitive)
 * - Prevents changing to same email
 * - Generates secure crypto token (32 bytes)
 * - Stores SHA-256 hash only
 * - Expires in 1 hour
 * - Deletes old pending requests
 * - Requires verification before actual change
 *
 * Flow:
 * 1. Validate new email
 * 2. Create EmailChangeRequest with token
 * 3. Send verification email to NEW address
 * 4. User clicks link, calls verify-email-change endpoint
 * 5. Endpoint verifies token, updates user.email
 *
 * @param userId - ID of the user requesting email change
 * @param input - New email data
 * @returns Success or error result
 */
export async function updateEmail(
  userId: string,
  input: UpdateEmailInput
): Promise<UpdateEmailResult> {
  try {
    // Validate input
    const validatedInput = updateEmailSchema.parse(input)
    const emailNormalized = validatedInput.email.toLowerCase()

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailNormalized: true },
    })

    if (!currentUser) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Utilisateur introuvable',
      }
    }

    // Check if email is same as current
    if (currentUser.emailNormalized === emailNormalized) {
      return {
        success: false,
        error: 'SAME_EMAIL',
        message: 'Cette adresse email est déjà la vôtre',
      }
    }

    // Check if email is already taken (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { emailNormalized },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'EMAIL_TAKEN',
        message: 'Cette adresse email est déjà utilisée',
      }
    }

    // Generate secure token (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Delete old pending email change requests for this user
    await deleteAllEmailChangeRequestsForUser(userId)

    // Create new email change request
    await createEmailChangeRequest(
      userId,
      validatedInput.email,
      emailNormalized,
      tokenHash,
      expiresAt
    )

    // TODO: Send verification email to NEW address
    // For dev: log the token
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/verify-email-change?token=${token}`

    console.log('\n=== EMAIL CHANGE VERIFICATION ===')
    console.log('User ID:', userId)
    console.log('Current email:', currentUser.email)
    console.log('New email:', validatedInput.email)
    console.log('Token:', token)
    console.log('Verify URL:', verifyUrl)
    console.log('Expires at:', expiresAt.toISOString())
    console.log('=================================\n')

    return {
      success: true,
      message: `Un email de vérification a été envoyé à ${validatedInput.email}. Veuillez cliquer sur le lien pour confirmer le changement.`,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[updateEmail] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue',
    }
  }
}
