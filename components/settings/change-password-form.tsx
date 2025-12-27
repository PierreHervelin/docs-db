'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ChangePasswordForm() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<number>(0)

  // Calculate password strength (0-5)
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0

    let strength = 0

    // Length check
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++

    // Character variety checks
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

    // Penalize common patterns
    if (/(.)\1{2,}/.test(password)) strength-- // repeating characters
    if (/(?:abc|123|qwerty)/i.test(password)) strength-- // common sequences

    return Math.max(0, Math.min(5, strength))
  }

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

  const getStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0:
        return ''
      case 1:
        return 'Très faible'
      case 2:
        return 'Faible'
      case 3:
        return 'Moyen'
      case 4:
        return 'Fort'
      case 5:
        return 'Très fort'
      default:
        return ''
    }
  }

  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0:
        return 'bg-gray-200'
      case 1:
        return 'bg-red-500'
      case 2:
        return 'bg-orange-500'
      case 3:
        return 'bg-yellow-500'
      case 4:
        return 'bg-green-500'
      case 5:
        return 'bg-green-500'
      default:
        return 'bg-gray-200'
    }
  }

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
          updateType: 'password',
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setSuccess(data.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStrength(0)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
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
          <p className="text-sm mt-1">Redirection vers la page de connexion...</p>
        </div>
      )}

      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
          Mot de passe actuel
        </label>
        <input
          type="password"
          id="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          id="new-password"
          value={newPassword}
          onChange={(e) => handleNewPasswordChange(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-describedby="password-help password-strength"
        />
        <p id="password-help" className="mt-1 text-xs text-gray-500">
          Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
        </p>

        {newPassword && (
          <div className="mt-2" id="password-strength">
            <div className="flex gap-1 mb-1">
              <div
                className={`h-1 flex-1 rounded ${passwordStrength >= 1 ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
              />
              <div
                className={`h-1 flex-1 rounded ${passwordStrength >= 2 ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
              />
              <div
                className={`h-1 flex-1 rounded ${passwordStrength >= 3 ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
              />
              <div
                className={`h-1 flex-1 rounded ${passwordStrength >= 4 ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
              />
              <div
                className={`h-1 flex-1 rounded ${passwordStrength >= 5 ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
              />
            </div>
            <p className="text-xs text-gray-600">Force : {getStrengthLabel(passwordStrength)}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
          Confirmer le nouveau mot de passe
        </label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h4 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Attention</h4>
        <p className="text-sm text-yellow-800">
          Vous serez déconnecté de tous vos appareils après le changement de mot de passe pour des
          raisons de sécurité.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && 'Mise à jour du mot de passe en cours'}
        {success && success}
        {error && error}
      </div>
    </form>
  )
}
