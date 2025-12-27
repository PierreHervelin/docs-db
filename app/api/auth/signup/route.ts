import { AlreadyExistsError, ValidationError } from '@/lib/errors'
import { RateLimitPresets, rateLimit } from '@/lib/rate-limit'
import { signUp } from '@/lib/services/signup'
import { signupSchema } from '@/lib/validation/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    const rateLimitResult = await rateLimit(`signup:${ip}`, RateLimitPresets.SIGNUP)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            "Trop de tentatives d'inscription depuis cette adresse IP. Veuillez réessayer plus tard.",
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json(
        {
          error: 'Validation error',
          message: firstError.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Execute signup
    const result = await signUp(parsed.data)

    return NextResponse.json(
      {
        userId: result.userId,
        message:
          'Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AlreadyExistsError) {
      return NextResponse.json(
        {
          error: 'Email already exists',
          message: error.message,
          code: 'DUPLICATE_EMAIL',
        },
        { status: 409 }
      )
    }

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

    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        {
          error: 'Validation error',
          message: firstError.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    console.error('Signup API error:', error)
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
