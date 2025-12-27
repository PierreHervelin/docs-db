'use server'

import { generateTokens } from '@/lib/auth/jwt'
import { comparePassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { createRefreshToken } from '@/lib/repositories/refresh-token'
import { z } from 'zod'

// Validation schema for login input
const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export type LoginResult =
  | {
      success: true
      data: {
        user: {
          id: string
          email: string
          username: string
        }
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
 * Login a user with email and password
 * Creates access token and refresh token on success
 * Handles account locking after 5 failed attempts
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(input)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const { email, password, rememberMe, userAgent, ipAddress } = validationResult.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return {
        success: false,
        error: 'Identifiants invalides',
      }
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60))
      return {
        success: false,
        error: `Compte verrouillé. Réessayez dans ${minutesLeft} minute${
          minutesLeft > 1 ? 's' : ''
        }.`,
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        error: 'Email non vérifié. Veuillez vérifier votre email avant de vous connecter.',
      }
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = user.failedLoginAttempts + 1
      const updateData: {
        failedLoginAttempts: { increment: number }
        lockedUntil?: Date
      } = {
        failedLoginAttempts: { increment: 1 },
      }

      // Lock account if 5 failed attempts
      if (newAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      return {
        success: false,
        error: 'Identifiants invalides',
      }
    }

    // Generate tokens
    const tokens = await generateTokens({ userId: user.id, email: user.email }, rememberMe)

    // Create refresh token in database
    await createRefreshToken({
      userId: user.id,
      jti: tokens.jti,
      tokenHash: tokens.tokenHash,
      expiresAt: tokens.refreshTokenExpiresAt,
      userAgent,
      ipAddress,
    })

    // Reset failed login attempts and update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    })

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la connexion',
    }
  }
}
