import { type JWTPayload, SignJWT, jwtVerify } from 'jose'
import { config } from '../config/env'

const JWT_SECRET = new TextEncoder().encode(config.JWT_SECRET)

export interface AccessTokenPayload extends JWTPayload {
  sub: string // userId
  type: 'access'
  jti: string
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string // userId
  type: 'refresh'
  jti: string
}

/**
 * Creates a JWT access token with 30-minute expiration
 */
export async function createAccessToken(userId: string): Promise<string> {
  const jti = crypto.randomUUID()

  return await new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(config.JWT_ACCESS_EXPIRATION)
    .setJti(jti)
    .sign(JWT_SECRET)
}

/**
 * Creates a JWT refresh token with 30-day expiration
 */
export async function createRefreshToken(userId: string): Promise<{ token: string; jti: string }> {
  const jti = crypto.randomUUID()

  const token = await new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(config.JWT_REFRESH_EXPIRATION)
    .setJti(jti)
    .sign(JWT_SECRET)

  return { token, jti }
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifyToken<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as T
  } catch {
    return null
  }
}

/**
 * Extracts JWT ID (jti) from token without full verification
 */
export function extractJti(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return payload.jti || null
  } catch {
    return null
  }
}

/**
 * Generates both access and refresh tokens with their metadata
 * @param payload - User data to include in token (userId, email)
 * @param rememberMe - If true, extends refresh token expiration to 30 days (default: 7 days)
 * @returns Object containing both tokens, their expiration dates, JTI, and token hash
 */
export async function generateTokens(
  payload: { userId: string; email: string },
  rememberMe = false
): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
  jti: string
  tokenHash: string
}> {
  const jti = crypto.randomUUID()
  const now = Date.now()

  // Access token expires in 15 minutes (900000ms)
  const accessTokenExpiresAt = new Date(now + 15 * 60 * 1000)

  // Refresh token expires in 7 days (default) or 30 days (rememberMe)
  const refreshTokenExpiration = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000 // 7 days
  const refreshTokenExpiresAt = new Date(now + refreshTokenExpiration)

  // Create access token
  const accessToken = await new SignJWT({
    type: 'access',
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(accessTokenExpiresAt.getTime() / 1000))
    .setJti(jti)
    .sign(JWT_SECRET)

  // Create refresh token
  const refreshToken = await new SignJWT({
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(refreshTokenExpiresAt.getTime() / 1000))
    .setJti(jti)
    .sign(JWT_SECRET)

  // Create a hash of the refresh token for database storage
  const tokenHash = Buffer.from(refreshToken).toString('base64')

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    jti,
    tokenHash,
  }
}
