import { refreshAccessToken } from '@/lib/actions/auth/refresh'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Implements token rotation for security
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshTokenCookie = request.cookies.get('refresh_token')?.value

    let refreshToken: string | undefined

    // Try to get from body first (for clients that don't use cookies)
    try {
      const body = await request.json()
      refreshToken = body.refreshToken
    } catch {
      // Body parsing failed, use cookie
    }

    // Fallback to cookie if not in body
    if (!refreshToken) {
      refreshToken = refreshTokenCookie
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Missing refresh token',
          message: 'Refresh token is required in body or cookie.',
          code: 'MISSING_REFRESH_TOKEN',
        },
        { status: 400 }
      )
    }

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined

    // Attempt token refresh
    const result = await refreshAccessToken({
      refreshToken,
      userAgent,
      ipAddress,
    })

    if (!result.success) {
      // Clear cookies on failure
      const response = NextResponse.json(
        {
          error: 'Token refresh failed',
          message: result.error,
          code: 'REFRESH_FAILED',
        },
        { status: 401 }
      )

      response.cookies.delete('session')
      response.cookies.delete('refresh_token')

      return response
    }

    // Success: Create response with new tokens
    const response = NextResponse.json(
      {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      },
      { status: 200 }
    )

    // Set new access token cookie
    response.cookies.set({
      name: 'session',
      value: result.data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60, // 30 minutes
      path: '/',
    })

    // Set new refresh token cookie
    response.cookies.set({
      name: 'refresh_token',
      value: result.data.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days (or 7 days depending on rememberMe)
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Refresh API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during token refresh.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
