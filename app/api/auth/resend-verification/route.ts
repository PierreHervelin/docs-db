import { ValidationError } from '@/lib/errors'
import { RateLimitPresets, rateLimit } from '@/lib/rate-limit'
import { resendVerification } from '@/lib/services/signup'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    const rateLimitResult = await rateLimit(
      `resend-verification:${ip}`,
      RateLimitPresets.PASSWORD_RESET
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Trop de tentatives. Veuillez réessayer plus tard.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          error: 'Missing email',
          message: "L'adresse email est requise",
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    await resendVerification(email)

    return NextResponse.json(
      {
        message: 'Email de vérification renvoyé avec succès',
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    console.error('Resend verification API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Une erreur interne est survenue',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
