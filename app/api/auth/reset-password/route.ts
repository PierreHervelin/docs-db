import {
  type ResetPasswordInput,
  resetPassword,
  resetPasswordSchema,
} from '@/lib/actions/auth/reset-password'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/reset-password
 *
 * Reset user password using a valid reset token
 *
 * Security features:
 * - Validates token exists and not expired
 * - Checks token hasn't been used
 * - Enforces strong password requirements
 * - Revokes all active sessions after reset
 * - Deletes all password reset tokens
 *
 * @returns 200 with success message if password reset successful
 * @returns 400 if input validation fails or token invalid
 * @returns 410 if token expired or already used
 * @returns 500 if server error occurs
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordInput

    // Validate input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: validation.error.errors[0]?.message || 'Données invalides',
        },
        { status: 400 }
      )
    }

    // Process password reset
    const result = await resetPassword(validation.data)

    if (!result.success) {
      // Map error codes to HTTP status codes
      const statusMap = {
        INVALID_INPUT: 400,
        INVALID_TOKEN: 400,
        EXPIRED_TOKEN: 410, // Gone - token no longer valid
        USED_TOKEN: 410, // Gone - token already consumed
        SERVER_ERROR: 500,
      }

      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
        },
        { status: statusMap[result.error] }
      )
    }

    return NextResponse.json(
      {
        message: result.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/auth/reset-password] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Une erreur est survenue',
      },
      { status: 500 }
    )
  }
}
