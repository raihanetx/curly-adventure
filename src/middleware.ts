import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth-jwt'

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access-token')?.value

  // Protected routes
  const protectedPaths = ['/admin', '/admin/dashboard', '/admin/articles']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If trying to access protected route without token, redirect to login
  if (isProtectedPath && !accessToken) {
    const loginUrl = new URL('/admin/login', request.url)
    return Response.redirect(loginUrl)
  }

  // If token exists, verify it
  if (accessToken) {
    const user = verifyAccessToken(accessToken)
    
    // If token is invalid, clear it and redirect to login
    if (!user && isProtectedPath) {
      const loginUrl = new URL('/admin/login', request.url)
      const response = Response.redirect(loginUrl)
      response.headers.set('Set-Cookie', 'access-token=; Path=/; HttpOnly; Max-Age=0')
      response.headers.set('Set-Cookie', 'refresh-token=; Path=/; HttpOnly; Max-Age=0')
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