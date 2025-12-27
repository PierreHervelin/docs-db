/**
 * Signup form component
 * Client component with form state and validation
 */

'use client'

import { signupAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'

type ValidationErrors = {
  email?: string[]
  firstName?: string[]
  lastName?: string[]
  password?: string[]
}

export function SignupForm() {
  const router = useRouter()
  const [state, formAction] = useFormState(signupAction, null)
  const [clientErrors, setClientErrors] = useState<ValidationErrors>({})
  const isPending = state !== null && state.success === undefined

  // Client-side validation
  const validateForm = (formData: FormData): boolean => {
    const errors: ValidationErrors = {}

    // Email validation
    const email = formData.get('email') as string
    if (!email) {
      errors.email = ['Email is required']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ['Email format is invalid']
    }

    // First name validation
    const firstName = formData.get('firstName') as string
    if (!firstName || firstName.trim().length === 0) {
      errors.firstName = ['First name is required']
    }

    // Last name validation
    const lastName = formData.get('lastName') as string
    if (!lastName || lastName.trim().length === 0) {
      errors.lastName = ['Last name is required']
    }

    // Password validation
    const password = formData.get('password') as string
    if (!password) {
      errors.password = ['Password is required']
    } else {
      if (password.length < 8) {
        errors.password = ['Password must be at least 8 characters']
      } else if (!/[A-Z]/.test(password)) {
        errors.password = ['Password must contain at least one uppercase letter']
      } else if (!/[a-z]/.test(password)) {
        errors.password = ['Password must contain at least one lowercase letter']
      } else if (!/\d/.test(password)) {
        errors.password = ['Password must contain at least one number']
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.password = ['Password must contain at least one special character']
      }
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission with client-side validation
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget)

    if (!validateForm(formData)) {
      event.preventDefault()
      return
    }

    // Clear client errors if validation passes
    setClientErrors({})
  }

  // Redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(state.data?.email || '')}`)
    }
  }, [state?.success, router, state?.data?.email])

  // Merge client and server errors
  const errors = {
    email: clientErrors.email || state?.errors?.email,
    firstName: clientErrors.firstName || state?.errors?.firstName,
    lastName: clientErrors.lastName || state?.errors?.lastName,
    password: clientErrors.password || state?.errors?.password,
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
      <div className="rounded-md shadow-sm space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email{' '}
            <span aria-label="requis" className="text-red-600">
              *
            </span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50"
            placeholder="votre@email.com"
            disabled={isPending}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email[0]}
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom{' '}
            <span aria-label="requis" className="text-red-600">
              *
            </span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            aria-required="true"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50"
            placeholder="Jean"
            disabled={isPending}
          />
          {errors.firstName && (
            <p id="firstName-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.firstName[0]}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom{' '}
            <span aria-label="requis" className="text-red-600">
              *
            </span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            aria-required="true"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50"
            placeholder="Dupont"
            disabled={isPending}
          />
          {errors.lastName && (
            <p id="lastName-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.lastName[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe{' '}
            <span aria-label="requis" className="text-red-600">
              *
            </span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : 'password-help'}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50"
            placeholder="••••••••"
            disabled={isPending}
          />
          <p id="password-help" className="mt-1 text-xs text-gray-500">
            Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
          </p>
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.password[0]}
            </p>
          )}
        </div>
      </div>

      {/* Global error message */}
      {state?.message && !state.success && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{state.message}</p>
        </div>
      )}

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Création en cours...' : 'Créer mon compte'}
        </button>
      </div>
    </form>
  )
}
