/**
 * Email verification content component
 * Client component for verification logic and resend form
 */

'use client'

import { resendVerificationAction, verifyEmailAction } from '@/app/actions/auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'

type VerificationStatus = 'pending' | 'success' | 'error' | 'resend'

export function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<VerificationStatus>('pending')
  const [message, setMessage] = useState('')

  const [resendState, resendAction] = useFormState(resendVerificationAction, null)
  const isResending = resendState !== null && resendState.success === undefined

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      verifyEmailAction(token).then((result) => {
        if (result.success) {
          setStatus('success')
          setMessage(result.message || 'Email vérifié avec succès !')
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(result.message || 'Le lien de vérification est invalide ou expiré.')
        }
      })
    } else if (!email) {
      setStatus('error')
      setMessage('Lien de vérification invalide.')
    } else {
      setStatus('resend')
    }
  }, [token, email, router])

  // Handle resend success
  useEffect(() => {
    if (resendState?.success) {
      setMessage(resendState.message || 'Email renvoyé avec succès.')
    }
  }, [resendState])

  if (status === 'pending') {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600">Vérification en cours...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="rounded-md bg-green-50 p-4" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">{message}</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Vous allez être redirigé vers la page de connexion...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-4" role="alert">
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
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{message}</h3>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStatus('resend')}
            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Renvoyer un email de vérification
          </button>
        </div>
      </div>
    )
  }

  // status === 'resend'
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Vérifiez votre boîte email</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Un email de vérification a été envoyé. Cliquez sur le lien dans l&apos;email pour
                activer votre compte.
              </p>
            </div>
          </div>
        </div>
      </div>

      {resendState?.success && (
        <div className="rounded-md bg-green-50 p-4" role="alert">
          <p className="text-sm text-green-800">{resendState.message}</p>
        </div>
      )}

      {resendState?.message && !resendState.success && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{resendState.message}</p>
        </div>
      )}

      <form action={resendAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Renvoyer l&apos;email de vérification
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email || ''}
            required
            aria-required="true"
            aria-invalid={!!resendState?.errors?.email}
            aria-describedby={resendState?.errors?.email ? 'email-error' : undefined}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
            placeholder="votre@email.com"
            disabled={isResending}
          />
          {resendState?.errors?.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {resendState.errors.email[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isResending}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? 'Envoi en cours...' : "Renvoyer l'email"}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
