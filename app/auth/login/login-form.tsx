'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

interface FormErrors {
  login?: string
  password?: string
  general?: string
}

export default function LoginForm() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs for RGAA focus management
  const loginInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!login.trim()) {
      newErrors.login = "L'adresse email ou le nom d'utilisateur est requis"
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis'
    }

    setErrors(newErrors)

    // RGAA: Focus on first error
    if (newErrors.login) {
      loginInputRef.current?.focus()
    } else if (newErrors.password) {
      passwordInputRef.current?.focus()
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validate
    if (!validateForm()) {
      // RGAA: Announce errors to screen readers
      errorSummaryRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login,
          password,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Map API errors to form fields
        if (data.code === 'INVALID_CREDENTIALS') {
          setErrors({ general: data.message })
          errorSummaryRef.current?.focus()
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setErrors({ general: data.message })
          errorSummaryRef.current?.focus()
        } else if (data.code === 'ACCOUNT_LOCKED') {
          setErrors({ general: data.message })
          errorSummaryRef.current?.focus()
        } else {
          setErrors({ general: 'Une erreur est survenue lors de la connexion' })
          errorSummaryRef.current?.focus()
        }
        return
      }

      // Success: Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' })
      errorSummaryRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
      {/* RGAA: Error summary for screen readers */}
      {hasErrors && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 p-4 border border-red-200"
          tabIndex={-1}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.general ? 'Erreur de connexion' : 'Erreurs de validation'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.login && <li>{errors.login}</li>}
                  {errors.password && <li>{errors.password}</li>}
                  {errors.general && <li>{errors.general}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md shadow-sm space-y-4">
        {/* Login field (email or username) */}
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-gray-700">
            Adresse email ou nom d'utilisateur
          </label>
          <input
            id="login"
            ref={loginInputRef}
            name="login"
            type="text"
            autoComplete="username"
            required
            aria-required="true"
            aria-invalid={!!errors.login}
            aria-describedby={errors.login ? 'login-error' : undefined}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border ${
              errors.login ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.login && (
            <p id="login-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.login}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <input
            id="password"
            ref={passwordInputRef}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.password && (
            <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {/* Remember Me checkbox */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Se souvenir de moi (30 jours)
          </label>
        </div>

        <div className="text-sm">
          <a
            href="/auth/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Mot de passe oublié ?
          </a>
        </div>
      </div>

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </div>

      {/* RGAA: Screen reader status */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSubmitting && 'Connexion en cours'}
        {hasErrors && 'Des erreurs sont présentes dans le formulaire'}
      </div>
    </form>
  )
}
