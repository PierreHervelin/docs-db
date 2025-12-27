'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setError('Token manquant ou invalide')
    }
  }, [token])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une majuscule'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une minuscule'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un chiffre'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setValidationErrors({})

    // Client-side validation
    const errors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      errors.password = 'Mot de passe requis'
    } else {
      const passwordError = validatePassword(password)
      if (passwordError) {
        errors.password = passwordError
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation du mot de passe requise'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    if (!token) {
      setError('Token manquant')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Une erreur est survenue')
        return
      }

      setSuccess(data.message)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (pwd: string): number => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = password ? getPasswordStrength(password) : 0
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Erreur</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-green-200 bg-green-50 p-4"
          >
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800">Succès</h3>
                <p className="mt-1 text-sm text-green-700">{success}</p>
                <p className="mt-2 text-sm text-green-600">
                  Redirection vers la page de connexion...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={!!validationErrors.password}
            aria-describedby={
              validationErrors.password ? 'password-error' : 'password-requirements'
            }
            disabled={isSubmitting || !!success}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${
              validationErrors.password
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {validationErrors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {validationErrors.password}
            </p>
          )}

          {/* Password strength indicator */}
          {password && !validationErrors.password && (
            <div className="mt-2">
              <div className="flex gap-1">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    0 < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    1 < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    2 < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    3 < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    4 < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Force: {strengthLabels[passwordStrength - 1]}
              </p>
            </div>
          )}

          <p id="password-requirements" className="mt-2 text-xs text-gray-600">
            Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un
            chiffre et un caractère spécial
          </p>
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={!!validationErrors.confirmPassword}
            aria-describedby={
              validationErrors.confirmPassword ? 'confirm-password-error' : undefined
            }
            disabled={isSubmitting || !!success}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${
              validationErrors.confirmPassword
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {validationErrors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-sm text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !!success || !token}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
        </button>

        {/* Screen reader announcement for loading state */}
        {isSubmitting && (
          <span className="sr-only" aria-live="polite">
            Réinitialisation en cours
          </span>
        )}
      </form>
    </div>
  )
}
