/**
 * Email verification page
 * Handles email verification with token from URL
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { VerifyEmailContent } from './VerifyEmailContent'

export const metadata: Metadata = {
  title: 'Vérification email | Doc-DB',
  description: 'Vérifiez votre adresse email',
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Vérification de votre email
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
