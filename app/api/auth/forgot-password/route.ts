import {
  type ForgotPasswordInput,
  forgotPassword,
  forgotPasswordSchema,
} from '@/lib/actions/auth/forgot-password'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/forgot-password
 *
 * Request password reset for a user
 *
 * Security features:
 * - Always returns 200 to prevent email enumeration
 * - Rate limited to 1 request per 5 minutes per email
 * - Generates cryptographically secure token
 * - Token expires after 1 hour
 *
 * @returns 200 with success message (even if email doesn't exist)
 * @returns 429 if rate limit exceeded
 * @returns 400 if input validation fails
 * @returns 500 if server error occurs
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ForgotPasswordInput

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: validation.error.errors[0]?.message || 'Données invalides',
        },
        { status: 400 }
      )
    }

    // Process forgot password request
    const result = await forgotPassword(validation.data)

    if (!result.success) {
      // Map error codes to HTTP status codes
      const statusMap = {
        INVALID_INPUT: 400,
        RATE_LIMIT_EXCEEDED: 429,
        EMAIL_SEND_FAILED: 500,
      }

      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
        },
        { status: statusMap[result.error] }
      )
    }

    // Always return 200 to prevent email enumeration
    return NextResponse.json(
      {
        message: result.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/auth/forgot-password] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Une erreur est survenue',
      },
      { status: 500 }
    )
  }
}
