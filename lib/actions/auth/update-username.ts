import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * Username validation schema
 */
export const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(30, "Le nom d'utilisateur doit contenir au maximum 30 caractères")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
    ),
})

export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>

/**
 * Update username result types
 */
export type UpdateUsernameSuccess = {
  success: true
  message: string
  username: string
}

export type UpdateUsernameError = {
  success: false
  error: 'INVALID_INPUT' | 'USERNAME_TAKEN' | 'SAME_USERNAME' | 'SERVER_ERROR'
  message: string
}

export type UpdateUsernameResult = UpdateUsernameSuccess | UpdateUsernameError

/**
 * Update user's username
 *
 * Security considerations:
 * - Validates username format (3-30 chars, alphanumeric + dash + underscore)
 * - Checks uniqueness (case-insensitive)
 * - Prevents changing to same username
 * - Preserves display case, stores normalized for lookups
 *
 * @param userId - ID of the user updating username
 * @param input - New username data
 * @returns Success or error result
 */
export async function updateUsername(
  userId: string,
  input: UpdateUsernameInput
): Promise<UpdateUsernameResult> {
  try {
    // Validate input
    const validatedInput = updateUsernameSchema.parse(input)
    const usernameNormalized = validatedInput.username.toLowerCase()

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, usernameNormalized: true },
    })

    if (!currentUser) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Utilisateur introuvable',
      }
    }

    // Check if username is same as current
    if (currentUser.usernameNormalized === usernameNormalized) {
      return {
        success: false,
        error: 'SAME_USERNAME',
        message: "Ce nom d'utilisateur est déjà le vôtre",
      }
    }

    // Check if username is already taken (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { usernameNormalized },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'USERNAME_TAKEN',
        message: "Ce nom d'utilisateur est déjà utilisé",
      }
    }

    // Update username
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: validatedInput.username,
        usernameNormalized,
      },
    })

    return {
      success: true,
      message: "Nom d'utilisateur mis à jour avec succès",
      username: validatedInput.username,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: error.errors[0]?.message || 'Données invalides',
      }
    }

    console.error('[updateUsername] Unexpected error:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue',
    }
  }
}
