import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Protected routes
  const protectedPaths = ['/admin', '/admin/dashboard', '/admin/articles']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If trying to access protected route without token, redirect to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/admin/login', request.url)
    return Response.redirect(loginUrl)
  }

  // If token exists, verify it
  if (token) {
    const user = verifyToken(token)
    
    // If token is invalid, clear it and redirect to login
    if (!user && isProtectedPath) {
      const loginUrl = new URL('/admin/login', request.url)
      const response = Response.redirect(loginUrl)
      response.headers.set('Set-Cookie', 'auth-token=; Path=/; HttpOnly; Max-Age=0')
      return response
    }

    // Check if user is admin for admin routes
    if (isProtectedPath && user?.role !== 'ADMIN') {
      const loginUrl = new URL('/admin/login', request.url)
      return Response.redirect(loginUrl)
    }
  }

  return null
}

export const config = {
  matcher: ['/admin/:path*']
}