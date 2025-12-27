import type { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe - Doc DB',
  description: 'Créez un nouveau mot de passe',
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Réinitialiser le mot de passe</h1>
          <p className="mt-2 text-sm text-gray-600">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <ResetPasswordForm />

        <div className="text-center text-sm">
          <a href="/auth/login" className="text-blue-600 hover:text-blue-800 hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    </main>
  )
}
