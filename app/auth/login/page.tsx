import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Connexion - Doc DB',
  description: 'Connectez-vous à votre compte Doc DB',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <a
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              créez un nouveau compte
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
