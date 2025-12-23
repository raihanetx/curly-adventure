import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-jwt'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.id, a.title, a.excerpt, a.slug, a.published, a.created_at, a.updated_at,
        u.name, u.email
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, excerpt, content, slug, published } = await request.json()

    if (!title || !content || !slug) {
      return NextResponse.json({ error: 'Title, content, and slug are required' }, { status: 400 })
    }

    const id = uuidv4()
    const result = await query(
      `INSERT INTO articles (id, title, excerpt, content, slug, published, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, title, excerpt || '', content, slug, published || false, user.id]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create article:', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}