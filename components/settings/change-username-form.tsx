'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ChangeUsernameForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
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
          updateType: 'username',
          username,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setSuccess(data.message)
      setUsername('')

      // Refresh page to show updated username
      router.refresh()
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
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Nouveau nom d&apos;utilisateur
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          placeholder="Ex: john_doe"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-describedby="username-help"
        />
        <p id="username-help" className="mt-1 text-xs text-gray-500">
          3-30 caractères, lettres, chiffres, tirets et underscores uniquement
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Mise à jour du nom d'utilisateur en cours"}
        {success && success}
        {error && error}
      </div>
    </form>
  )
}
