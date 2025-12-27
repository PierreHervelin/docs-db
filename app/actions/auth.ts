/**
 * Server Actions for user signup and email verification
 * Used in Next.js App Router forms
 */

'use server'

import { AlreadyExistsError, ValidationError } from '@/lib/errors'
import { RateLimitPresets, rateLimit } from '@/lib/rate-limit'
import { resendVerification, signUp, verifyEmail } from '@/lib/services/signup'
import { emailSchema, signupSchema } from '@/lib/validation/auth'

export interface ActionResult<T = void> {
  success: boolean
  errors?: Partial<Record<string, string[]>>
  message?: string
  data?: T
}

/**
 * Server action for user signup
 */
export async function signupAction(
  _prevState: ActionResult<{ userId: string; email: string }> | null,
  formData: FormData
): Promise<ActionResult<{ userId: string; email: string }>> {
  try {
    // Rate limiting
    const ip = (await import('next/headers')).headers().get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimit(`signup:${ip}`, RateLimitPresets.SIGNUP)
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
      }
    }

    // Parse and validate input
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
    }

    const parsed = signupSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    // Execute signup
    const result = await signUp(parsed.data)

    return {
      success: true,
      message: 'Compte créé avec succès. Vérifiez votre email.',
      data: { userId: result.userId, email: parsed.data.email },
    }
  } catch (error) {
    if (error instanceof AlreadyExistsError) {
      return {
        success: false,
        errors: { email: [error.message] },
      }
    }

    console.error('Signup error:', error)
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Server action for email verification
 */
export async function verifyEmailAction(token: string): Promise<ActionResult<{ userId: string }>> {
  try {
    const result = await verifyEmail(token)

    if (!result.success) {
      return {
        success: false,
        message: 'Le lien de vérification est invalide ou expiré.',
      }
    }

    return {
      success: true,
      message: 'Email vérifié avec succès !',
      data: { userId: result.userId || '' },
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Server action for resending verification email
 */
export async function resendVerificationAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Rate limiting
    const ip = (await import('next/headers')).headers().get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimit(`resend:${ip}`, RateLimitPresets.PASSWORD_RESET) // Reuse same rate limit
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
      }
    }

    // Parse and validate input
    const data = { email: formData.get('email') }
    const parsed = emailSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    // Resend verification
    await resendVerification(parsed.data.email)

    return {
      success: true,
      message: 'Email de vérification renvoyé avec succès.',
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
      }
    }

    console.error('Resend verification error:', error)
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}
