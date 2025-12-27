import { ValidationError } from '@/lib/errors'
import { verifyEmail } from '@/lib/services/signup'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        {
          error: 'Missing token',
          message: 'Le token de vérification est requis',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const result = await verifyEmail(token)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          message: 'Le token de vérification est invalide ou a expiré',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Email vérifié avec succès',
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

    console.error('Email verification API error:', error)
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
