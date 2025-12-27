import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
]
const authRoutes = ['/auth/login', '/auth/signup']

/**
 * Middleware for authentication and authorization
 *
 * Note: Edge Runtime doesn't support Prisma, so token blacklist checking
 * is deferred to API routes and server components.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session token from cookie
  const token = request.cookies.get('session')?.value

  // Verify JWT token if present
  let isAuthenticated = false
  if (token) {
    const payload = await verifyToken(token)
    isAuthenticated = !!payload?.jti
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow public routes without authentication
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated) {
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // Token blacklist checking is performed in API routes and server components
  // where Node.js runtime is available for Prisma

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
