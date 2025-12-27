import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Doc-DB - Document Database',
  description: 'Secure document management system with user authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
