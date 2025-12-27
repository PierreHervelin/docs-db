/**
 * Mock for jose library
 * Used in Jest tests since jose is ESM-only
 */

export class SignJWT {
  private payload: Record<string, unknown> = {}
  private header: Record<string, string> = {}
  private subject?: string
  private issuedAt?: number
  private expirationTime?: string
  private jti?: string

  constructor(payload: Record<string, unknown>) {
    this.payload = payload
  }

  setProtectedHeader(header: Record<string, string>) {
    this.header = header
    return this
  }

  setSubject(subject: string) {
    this.subject = subject
    return this
  }

  setIssuedAt() {
    this.issuedAt = Math.floor(Date.now() / 1000)
    return this
  }

  setExpirationTime(expiration: string) {
    this.expirationTime = expiration
    return this
  }

  setJti(jti: string) {
    this.jti = jti
    return this
  }

  async sign(_secret: Uint8Array | string): Promise<string> {
    // Calculate actual expiration timestamp
    let exp: number
    if (this.expirationTime) {
      const now = Math.floor(Date.now() / 1000)
      const match = this.expirationTime.match(/^(\d+)([smhd])$/)
      if (match) {
        const value = Number.parseInt(match[1])
        const unit = match[2]
        const multipliers = { s: 1, m: 60, h: 3600, d: 86400 }
        exp = now + value * multipliers[unit as keyof typeof multipliers]
      } else {
        exp = now + 1800 // default 30min
      }
    } else {
      exp = Math.floor(Date.now() / 1000) + 1800
    }

    // Create a simple JWT-like token for testing
    const header = Buffer.from(JSON.stringify(this.header)).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({
        ...this.payload,
        sub: this.subject,
        iat: this.issuedAt,
        exp,
        jti: this.jti,
      })
    ).toString('base64url')
    const signature = Buffer.from('mock-signature').toString('base64url')
    return `${header}.${payload}.${signature}`
  }
}

export async function jwtVerify(
  token: string,
  _secret: Uint8Array | string
): Promise<{
  payload: {
    sub?: string
    type?: string
    jti?: string
    iat?: number
    exp?: number
  }
  protectedHeader: Record<string, string>
}> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  // Verify signature is valid (mock: just check it exists)
  if (parts[2] !== Buffer.from('mock-signature').toString('base64url')) {
    throw new Error('Invalid signature')
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())

  // Check expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      const error = new Error('Token expired')
      error.name = 'JWTExpired'
      throw error
    }
  }

  return {
    payload,
    protectedHeader: header,
  }
}

export const errors = {
  JWTExpired: class JWTExpired extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'JWTExpired'
    }
  },
}
