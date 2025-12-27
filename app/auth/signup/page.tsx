/**
 * Signup page
 * User registration form with RGAA compliance
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from './SignupForm'

export const metadata: Metadata = {
  title: 'Inscription | Doc-DB',
  description: 'Créez votre compte Doc-DB',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              connectez-vous si vous avez déjà un compte
            </Link>
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}
