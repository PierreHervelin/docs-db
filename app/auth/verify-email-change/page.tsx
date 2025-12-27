import { Suspense } from 'react'
import VerifyEmailChangeContent from './verify-email-change-content'

export const metadata = {
  title: "Vérification du changement d'email - Doc DB",
  description: 'Confirmez votre nouvelle adresse email',
}

export default function VerifyEmailChangePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vérification du changement d&apos;email
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Confirmation de votre nouvelle adresse email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Suspense
            fallback={
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-sm text-gray-600">Vérification en cours...</p>
              </div>
            }
          >
            <VerifyEmailChangeContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
