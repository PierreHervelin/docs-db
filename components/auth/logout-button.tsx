'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to login page
        router.push('/auth/login')
      } else {
        const data = await response.json()
        alert(data.message || 'Erreur lors de la déconnexion')
        setIsLoggingOut(false)
      }
    } catch {
      alert('Erreur de connexion au serveur')
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Se déconnecter
      </button>

      <Dialog
        open={isOpen}
        onClose={() => !isLoggingOut && setIsOpen(false)}
        className="relative z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Full-screen container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Confirmer la déconnexion
            </DialogTitle>

            <p className="mt-2 text-sm text-gray-600">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder
              à votre compte.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </button>
            </div>

            {/* Screen reader announcement */}
            {isLoggingOut && (
              <span className="sr-only" aria-live="polite">
                Déconnexion en cours
              </span>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
