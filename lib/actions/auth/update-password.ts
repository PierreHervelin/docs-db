import { prisma } from '@/lib/db/prisma'
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
 * Update password validation schema
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel",
    path: ['newPassword'],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

/**
 * Update password result types
 */
export type UpdatePasswordSuccess = {
  success: true
  message: string
}

export type UpdatePasswordError = {
  success: false
  error: 'INVALID_INPUT' | 'INVALID_CURRENT_PASSWORD' | 'SAME_PASSWORD' | 'SERVER_ERROR'
  message: string
}

export type UpdatePasswordResult = UpdatePasswordSuccess | UpdatePasswordError

/**
 * Update user's password
 *
 * Security considerations:
 * - Verifies current password (prevents unauthorized changes)
 * - Validates new password strength
 * - Prevents reusing current password
 * - Hashes with bcrypt (12 rounds)
 * - Revokes all refresh tokens (force re-login on all devices)
 * - TODO: Send security notification email
 *
 * @param userId - ID of the user updating password
 * @param input - Password change data
 * @returns Success or error result
 */
export async function updatePassword(
  userId: string,
  input: UpdatePasswordInput
): Promise<UpdatePasswordResult> {
  try {
    // Validate input
    const validatedInput = updatePasswordSchema.parse(input)

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    })

    if (!currentUser) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Utilisateur introuvable',
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedInput.currentPassword,
      currentUser.passwordHash
    )

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Le mot de passe actuel est incorrect',
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validatedInput.newPassword, 12)

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    // Revoke all refresh tokens (force re-login on all devices for security)
    await revokeAllUserRefreshTokens(userId)

    // TODO: Send security notification email to user
    console.log('\n=== PASSWORD UPDATED ===')
    console.log('User ID:', userId)
    console.log('Email:', currentUser.email)
    console.log('All sessions revoked - user will need to re-login')
    console.log('TODO: Send security notification email')
    console.log('========================\n')

    return {
      success: true,
      message:
        'Mot de passe mis à jour avec succès. Vous allez être déconnecté pour des raisons de sécurité.',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[updatePassword] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue',
    }
  }
}
