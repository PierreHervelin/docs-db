/**
 * Custom error classes for authentication system
 * All messages are RGAA-compliant (clear, actionable, accessible)
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class DuplicateEmailError extends AuthError {
  constructor() {
    super(
      'An account with this email already exists. Please log in or reset your password.',
      'DUPLICATE_EMAIL',
      409
    )
    this.name = 'DuplicateEmailError'
  }
}

/**
 * Alias for DuplicateEmailError with custom message support
 */
export class AlreadyExistsError extends AuthError {
  constructor(message?: string) {
    super(
      message || 'An account with this email already exists. Please log in or reset your password.',
      'ALREADY_EXISTS',
      409
    )
    this.name = 'AlreadyExistsError'
  }
}

export class DuplicateUsernameError extends AuthError {
  constructor(suggestedUsername?: string) {
    const suggestion = suggestedUsername ? ` Try ${suggestedUsername} instead.` : ''
    super(`This username is already taken.${suggestion}`, 'DUPLICATE_USERNAME', 409)
    this.name = 'DuplicateUsernameError'
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('The username/email or password you entered is incorrect.', 'INVALID_CREDENTIALS', 401)
    this.name = 'InvalidCredentialsError'
  }
}

export class EmailNotVerifiedError extends AuthError {
  constructor() {
    super(
      'Please verify your email address before logging in. Check your inbox or request a new verification link.',
      'EMAIL_NOT_VERIFIED',
      403
    )
    this.name = 'EmailNotVerifiedError'
  }
}

export class AccountLockedError extends AuthError {
  constructor(public lockedUntil: Date) {
    super(
      'Too many failed login attempts. Your account is locked for 15 minutes.',
      'ACCOUNT_LOCKED',
      423
    )
    this.name = 'AccountLockedError'
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('This link has expired. Please request a new one.', 'TOKEN_EXPIRED', 401)
    this.name = 'TokenExpiredError'
  }
}

export class TokenInvalidError extends AuthError {
  constructor() {
    super('This link is invalid. Please request a new one.', 'TOKEN_INVALID', 401)
    this.name = 'TokenInvalidError'
  }
}

export class RateLimitError extends AuthError {
  constructor(public resetAt: Date) {
    super('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    this.name = 'RateLimitError'
  }
}

export class EmailSendError extends AuthError {
  constructor() {
    super('Unable to send email. Please try again later.', 'EMAIL_SEND_FAILED', 500)
    this.name = 'EmailSendError'
  }
}

/**
 * Formats error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string
  message: string
  code: string
  statusCode: number
  lockedUntil?: string
  resetAt?: string
} {
  if (error instanceof AuthError) {
    const response: ReturnType<typeof formatErrorResponse> = {
      error: error.name
        .replace('Error', '')
        .replace(/([A-Z])/g, ' $1')
        .trim(),
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }

    if (error instanceof AccountLockedError) {
      response.lockedUntil = error.lockedUntil.toISOString()
    }

    if (error instanceof RateLimitError) {
      response.resetAt = error.resetAt.toISOString()
    }

    return response
  }

  // Generic error
  return {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }
}
