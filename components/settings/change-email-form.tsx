'use client'

import { useState } from 'react'

interface ChangeEmailFormProps {
  currentEmail: string
}

export default function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updateType: 'email',
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setSuccess(data.message)
      setEmail('')
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded"
          role="alert"
        >
          {success}
        </div>
      )}

      <div>
        <label htmlFor="new-email" className="block text-sm font-medium text-gray-700">
          Nouvelle adresse email
        </label>
        <input
          type="email"
          id="new-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={255}
          placeholder="nouveau@example.com"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-describedby="email-help"
        />
        <p id="email-help" className="mt-1 text-xs text-gray-500">
          Un email de vérification sera envoyé à cette adresse
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="text-sm font-semibold text-blue-900 mb-1">📧 Email actuel</h4>
        <p className="text-sm text-blue-800">{currentEmail}</p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Envoi...' : "Envoyer l'email de vérification"}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Envoi de l'email de vérification en cours"}
        {success && success}
        {error && error}
      </div>
    </form>
  )
}
