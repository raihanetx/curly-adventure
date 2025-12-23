import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import crypto from 'crypto'

// Professional JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: '15m', // Shorter for security
  issuer: 'article-hub',
  audience: 'article-hub-users'
}

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthUser extends User {
  token: string
  refreshToken: string
}

export interface JwtPayload {
  id: string
  email: string
  name: string
  role: string
  iat: number
  exp: number
  iss: string
  aud: string
}

// Security: Validate JWT secret on startup
if (!JWT_CONFIG.secret || JWT_CONFIG.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long')
}

export async function hashPassword(password: string): Promise<string> {
  // Higher salt rounds for better security
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }

  // Access token (short-lived)
  const accessToken = jwt.sign(payload, JWT_CONFIG.secret!, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    algorithm: 'HS256'
  })

  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_CONFIG.secret!,
    { expiresIn: '7d', algorithm: 'HS256' }
  )

  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret!, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: ['HS256']
    }) as JwtPayload

    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret!) as any
    
    if (decoded.type !== 'refresh') {
      return null
    }

    return { id: decoded.id }
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

// Rate limiting function
function isRateLimited(email: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset after 15 minutes
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return false
  }
  
  // Lock after 5 failed attempts
  if (attempts.count >= 5) {
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    // Rate limiting check
    if (isRateLimited(email)) {
      throw new Error('Too many login attempts. Please try again later.')
    }

    // Sanitize email to prevent SQL injection
    const sanitizedEmail = email.toLowerCase().trim()
    
    const result = await query(
      'SELECT id, email, name, password, role FROM users WHERE email = $1',
      [sanitizedEmail]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    // Generate both access and refresh tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    // Clear rate limit on successful login
    loginAttempts.delete(email)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token: accessToken,
      refreshToken
    }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
  try {
    const decoded = verifyRefreshToken(refreshToken)
    
    if (!decoded) {
      return null
    }

    // Get user from database
    const result = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    
    // Generate new access token
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    const accessToken = jwt.sign(payload, JWT_CONFIG.secret!, {
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithm: 'HS256'
    })

    return { accessToken }
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

export async function createUser(email: string, password: string, name?: string): Promise<User | null> {
  try {
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const hashedPassword = await hashPassword(password)
    const id = crypto.randomUUID()
    
    await query(
      `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role`,
      [id, email.toLowerCase().trim(), name, hashedPassword, 'USER']
    )

    return {
      id,
      email: email.toLowerCase().trim(),
      name: name || '',
      role: 'USER'
    }
  } catch (error) {
    console.error('User creation error:', error)
    return null
  }
}