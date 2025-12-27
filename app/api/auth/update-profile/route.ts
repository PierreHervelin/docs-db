import { type UpdateEmailInput, updateEmail } from '@/lib/actions/auth/update-email'
import { type UpdatePasswordInput, updatePassword } from '@/lib/actions/auth/update-password'
import { type UpdateUsernameInput, updateUsername } from '@/lib/actions/auth/update-username'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * PUT /api/auth/update-profile
 *
 * Update user profile information (username, email, or password)
 * Requires authentication
 *
 * Supports three update types via `updateType` field:
 * - 'username': Change username (immediate effect)
 * - 'email': Change email (requires verification)
 * - 'password': Change password (revokes all sessions)
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Verify JWT and extract user ID
    const payload = await verifyToken(sessionCookie.value)
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const userId = payload.sub

    // Parse request body
    const body = await request.json()
    const { updateType } = body

    if (!updateType) {
      return NextResponse.json({ error: 'Le type de mise à jour est requis' }, { status: 400 })
    }

    // Route to appropriate update handler
    switch (updateType) {
      case 'username': {
        const input: UpdateUsernameInput = {
          username: body.username,
        }

        const result = await updateUsername(userId, input)

        if (!result.success) {
          const statusCode =
            result.error === 'INVALID_INPUT' || result.error === 'USERNAME_TAKEN'
              ? 400
              : result.error === 'SAME_USERNAME'
                ? 409
                : 500

          return NextResponse.json({ error: result.message }, { status: statusCode })
        }

        return NextResponse.json({
          message: result.message,
          username: result.username,
        })
      }

      case 'email': {
        const input: UpdateEmailInput = {
          email: body.email,
        }

        const result = await updateEmail(userId, input)

        if (!result.success) {
          const statusCode =
            result.error === 'INVALID_INPUT' || result.error === 'EMAIL_TAKEN'
              ? 400
              : result.error === 'SAME_EMAIL'
                ? 409
                : result.error === 'EMAIL_SEND_FAILED'
                  ? 500
                  : 500

          return NextResponse.json({ error: result.message }, { status: statusCode })
        }

        return NextResponse.json({
          message: result.message,
        })
      }

      case 'password': {
        const input: UpdatePasswordInput = {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
          confirmPassword: body.confirmPassword,
        }

        const result = await updatePassword(userId, input)

        if (!result.success) {
          const statusCode =
            result.error === 'INVALID_INPUT' || result.error === 'INVALID_CURRENT_PASSWORD'
              ? 400
              : result.error === 'SAME_PASSWORD'
                ? 409
                : 500

          return NextResponse.json({ error: result.message }, { status: statusCode })
        }

        // Password change requires re-authentication (sessions were revoked)
        // Clear session cookie
        const response = NextResponse.json({
          message: result.message,
          requiresReauth: true,
        })

        response.cookies.delete('session')
        response.cookies.delete('refresh_token')

        return response
      }

      default:
        return NextResponse.json({ error: 'Type de mise à jour invalide' }, { status: 400 })
    }
  } catch (error) {
    console.error('[PUT /api/auth/update-profile] Error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
