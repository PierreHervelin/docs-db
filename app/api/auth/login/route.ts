import { loginUser } from '@/lib/actions/auth/login'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema matching the OpenAPI contract
const loginSchema = z.object({
  login: z.string().min(1, 'Login est requis'),
  password: z.string().min(1, 'Mot de passe est requis'),
  rememberMe: z.boolean().default(false),
})

/**
 * POST /api/auth/login
 * Authenticate user with email/username and password
 * Returns access and refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        {
          error: 'Validation error',
          message: firstError.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const { login, password, rememberMe } = validationResult.data

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined

    // Attempt login
    const result = await loginUser({
      email: login, // The login field accepts email or username - for now just email
      password,
      rememberMe,
      userAgent,
      ipAddress,
    })

    if (!result.success) {
      // Map error messages to appropriate HTTP status codes
      if (result.error.includes('Email non vérifié')) {
        return NextResponse.json(
          {
            error: 'Email not verified',
            message: result.error,
            code: 'EMAIL_NOT_VERIFIED',
          },
          { status: 403 }
        )
      }

      if (result.error.includes('Compte verrouillé')) {
        return NextResponse.json(
          {
            error: 'Account locked',
            message: result.error,
            code: 'ACCOUNT_LOCKED',
          },
          { status: 423 }
        )
      }

      if (result.error.includes('Compte désactivé')) {
        return NextResponse.json(
          {
            error: 'Account inactive',
            message: result.error,
            code: 'ACCOUNT_INACTIVE',
          },
          { status: 403 }
        )
      }

      // Default to invalid credentials
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          message: 'The username/email or password you entered is incorrect.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // Success: Create response with cookies and tokens
    const response = NextResponse.json(
      {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          username: result.data.user.username,
        },
      },
      { status: 200 }
    )

    // Set HTTP-only cookie with access token
    response.cookies.set({
      name: 'session',
      value: result.data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60, // 30 minutes
      path: '/',
    })

    // Set refresh token cookie if rememberMe is true
    if (rememberMe) {
      response.cookies.set({
        name: 'refresh_token',
        value: result.data.refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during login.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
