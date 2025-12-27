import { z } from 'zod'

/**
 * Username validation: 3-30 characters, alphanumeric with dash/underscore
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, dashes, and underscores')

/**
 * Email validation: RFC 5322 compliant
 */
export const emailStringSchema = z
  .string()
  .email('Email must be a valid email address')
  .min(1, 'Email is required')

/**
 * Email input schema (for resend/reset forms)
 */
export const emailSchema = z.object({
  email: emailStringSchema,
})

/**
 * Password validation: min 8 chars, uppercase, lowercase, digit, special char
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * First name validation
 */
export const firstNameSchema = z
  .string()
  .min(1, 'Le prénom est requis')
  .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom contient des caractères invalides')

/**
 * Last name validation
 */
export const lastNameSchema = z
  .string()
  .min(1, 'Le nom est requis')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides')

/**
 * Signup input validation
 */
export const signupSchema = z.object({
  email: emailStringSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Login input validation
 */
export const loginSchema = z.object({
  login: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Password reset request validation
 */
export const forgotPasswordSchema = z.object({
  email: emailStringSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Password reset validation
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Email verification validation
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

/**
 * Update username validation
 */
export const updateUsernameSchema = z.object({
  username: usernameSchema,
})

export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>

/**
 * Update email validation
 */
export const updateEmailSchema = z.object({
  email: emailStringSchema,
})

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>

/**
 * Update password validation
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
})

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
