import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth-jwt'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      )
    }

    const user = verifyAccessToken(accessToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}