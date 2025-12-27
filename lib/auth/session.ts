import { cookies } from 'next/headers'
import { findRevokedTokenByJti } from '../repositories/revoked-token'
import { verifyToken } from './jwt'

export interface SessionPayload {
  userId: string
  email: string
  jti: string
  iat: number
  exp: number
}

/**
 * Get and validate the current user session from cookies
 *
 * This function:
 * 1. Retrieves the session cookie
 * 2. Verifies the JWT signature and expiration
 * 3. Checks if the token is blacklisted
 *
 * Returns the session payload if valid, null otherwise
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) {
    return null
  }

  // Verify JWT token
  const payload = await verifyToken(token)

  if (!payload || !payload.jti) {
    return null
  }

  // Check if token is blacklisted
  const revokedToken = await findRevokedTokenByJti(payload.jti)

  if (revokedToken) {
    return null
  }

  // Validate payload has required fields (JWT uses 'sub' for subject/userId)
  if (!payload.sub || !payload.email || !payload.iat || !payload.exp) {
    return null
  }

  return {
    userId: payload.sub,
    email: payload.email,
    jti: payload.jti,
    iat: payload.iat,
    exp: payload.exp,
  } as SessionPayload
}

/**
 * Require a valid session, redirect to login if not authenticated
 *
 * Use this in server components to protect pages
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()

  if (!session) {
    // This will be caught by Next.js and result in a redirect
    throw new Error('Unauthorized')
  }

  return session
}
