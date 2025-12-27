'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function VerifyEmailChangeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Le lien de vérification est invalide')
        return
      }

      try {
        const response = await fetch(
          `/api/auth/verify-email-change?token=${encodeURIComponent(token)}`
        )

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Une erreur est survenue')
          return
        }

        setStatus('success')
        setMessage(data.message)
        setNewEmail(data.newEmail)

        // Redirect to settings after 3 seconds
        setTimeout(() => {
          router.push('/settings')
        }, 3000)
      } catch {
        setStatus('error')
        setMessage('Une erreur est survenue')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-600">Vérification en cours...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {message}
        </div>

        <div className="text-center">
          <Link
            href="/settings"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour aux paramètres
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4"
        role="alert"
      >
        {message}
      </div>

      {newEmail && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            ✅ Nouvelle adresse confirmée
          </h3>
          <p className="text-sm text-blue-800">{newEmail}</p>
        </div>
      )}

      <p className="text-sm text-gray-600 text-center mb-4">Redirection vers les paramètres...</p>

      <div className="text-center">
        <Link
          href="/settings"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retour aux paramètres
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'success' && message}
      </div>
    </div>
  )
}
