import { verifyEmailChange } from '@/lib/actions/auth/verify-email-change'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/verify-email-change
 *
 * Verify email change request and update user's email address
 * Token is passed as query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Le token est requis' }, { status: 400 })
    }

    const result = await verifyEmailChange({ token })

    if (!result.success) {
      const statusCode =
        result.error === 'INVALID_INPUT'
          ? 400
          : result.error === 'INVALID_TOKEN'
            ? 400
            : result.error === 'EXPIRED_TOKEN'
              ? 410
              : result.error === 'ALREADY_VERIFIED'
                ? 409
                : result.error === 'EMAIL_TAKEN'
                  ? 409
                  : 500

      return NextResponse.json({ error: result.message }, { status: statusCode })
    }

    return NextResponse.json({
      message: result.message,
      newEmail: result.newEmail,
    })
  } catch (error) {
    console.error('[GET /api/auth/verify-email-change] Error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
