import ChangeEmailForm from '@/components/settings/change-email-form'
import ChangePasswordForm from '@/components/settings/change-password-form'
import ChangeUsernameForm from '@/components/settings/change-username-form'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Paramètres du compte - Doc DB',
  description: 'Gérez vos informations de compte',
}

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paramètres du compte</h1>
            <p className="text-sm text-gray-600 mb-8">
              Gérez vos informations personnelles et vos préférences de sécurité
            </p>

            {/* Account Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h2>
              <div className="space-y-4">
                <div>
                  <p className="block text-sm font-medium text-gray-700">Email actuel</p>
                  <p className="mt-1 text-sm text-gray-900">{session.email}</p>
                </div>
              </div>
            </div>

            {/* Change Username Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Changer le nom d&apos;utilisateur
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Modifiez votre nom d&apos;utilisateur. Les changements sont immédiats.
              </p>
              <ChangeUsernameForm />
            </div>

            {/* Change Email Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Changer l&apos;adresse email
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Un email de vérification sera envoyé à votre nouvelle adresse.
              </p>
              <ChangeEmailForm currentEmail={session.email} />
            </div>

            {/* Change Password Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Changer le mot de passe</h2>
              <p className="text-sm text-gray-600 mb-4">
                Pour votre sécurité, vous serez déconnecté de tous les appareils après le changement
                de mot de passe.
              </p>
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
