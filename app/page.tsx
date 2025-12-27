import LogoutButton from '@/components/auth/logout-button'
import { getSession } from '@/lib/auth/session'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Doc DB</h1>
      <p className="mt-4 text-lg text-gray-600">Bienvenue, {session.email}</p>
      <p className="mt-2 text-sm text-gray-500">Session active</p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/settings"
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Paramètres
        </Link>
        <LogoutButton />
      </div>
    </main>
  )
}
