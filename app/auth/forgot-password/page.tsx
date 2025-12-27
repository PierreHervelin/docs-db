import type { Metadata } from 'next'
import ForgotPasswordForm from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Mot de passe oublié - Doc DB',
  description: 'Réinitialisez votre mot de passe',
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center text-sm">
          <a href="/auth/login" className="text-blue-600 hover:text-blue-800 hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    </main>
  )
}
