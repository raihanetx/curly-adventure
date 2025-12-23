import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, refreshAccessToken } from '@/lib/auth-jwt'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    const newTokens = await refreshAccessToken(refreshToken)

    if (!newTokens) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      accessToken: newTokens.accessToken
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}