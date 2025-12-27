'use client'

import { useState } from 'react'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (!email.trim()) {
      setError('Adresse email requise')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Une erreur est survenue')
        return
      }

      setSuccess(data.message)
      setEmail('') // Clear form on success
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              </div>
            </div>
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
        </button>

        {/* Screen reader announcement for loading state */}
        {isSubmitting && (
          <span className="sr-only" aria-live="polite">
            Envoi en cours
          </span>
        )}
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Vous recevrez un email contenant un lien pour réinitialiser votre mot de passe si cette
          adresse est enregistrée dans notre système.
        </p>
      </div>
    </div>
  )
}
