import { logout } from '@/lib/actions/auth/logout'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 *
 * Log out the current user by revoking their tokens
 *
 * Security features:
 * - Blacklists access token immediately
 * - Revokes refresh token if present
 * - Clears HttpOnly cookies
 * - No body required - tokens extracted from cookies
 *
 * @returns 200 with success message if logout successful
 * @returns 401 if no session found
 * @returns 500 if server error occurs
 */
export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get('session')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value

    // If no access token, nothing to logout
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Aucune session active',
        },
        { status: 401 }
      )
    }

    // Process logout
    const result = await logout(accessToken, refreshToken)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
        },
        { status: 500 }
      )
    }

    // Clear cookies
    const response = NextResponse.json(
      {
        message: result.message,
      },
      { status: 200 }
    )

    response.cookies.delete('session')
    response.cookies.delete('refresh_token')

    return response
  } catch (error) {
    console.error('[POST /api/auth/logout] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Une erreur est survenue',
      },
      { status: 500 }
    )
  }
}
