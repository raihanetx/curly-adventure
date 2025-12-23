import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthUser extends User {
  token: string
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function createUser(email: string, password: string, name?: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password)
    const id = crypto.randomUUID()
    
    await query(
      `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role`,
      [id, email, name, hashedPassword, 'USER']
    )

    return {
      id,
      email,
      name: name || '',
      role: 'USER'
    }
  } catch (error) {
    console.error('User creation error:', error)
    return null
  }
}