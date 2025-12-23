import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword } from '@/lib/auth-jwt'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
  try {
    console.log('Initializing database...')
    
    // Initialize database tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        slug TEXT UNIQUE NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        author_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)

    // Create admin user
    const adminId = uuidv4()
    const hashedPassword = await hashPassword('admin123')
    
    await query(
      `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [adminId, 'admin@example.com', 'Admin User', hashedPassword, 'ADMIN']
    )
    
    // Create a sample article
    const articleId = uuidv4()
    await query(
      `INSERT INTO articles (id, title, excerpt, content, slug, published, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [
        articleId,
        'Welcome to Article Hub',
        'This is a sample article to get you started with the platform.',
        `# Welcome to Article Hub

This is a sample article that demonstrates the capabilities of our article platform.

## Features

- **Markdown Support**: Write articles using Markdown syntax
- **Admin Dashboard**: Manage your articles with ease
- **Responsive Design**: Works on all devices
- **Neon Database**: Fast and reliable database backend

## Getting Started

1. Log in to the admin dashboard
2. Create your first article
3. Publish it for the world to see

## Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, Article Hub!');
}
\`\`\`

Enjoy writing and sharing your articles!`,
        'welcome-to-article-hub',
        true,
        adminId
      ]
    )
    
    return NextResponse.json({ 
      message: 'Database initialized successfully!',
      admin: { email: 'admin@example.com', password: 'admin123' }
    })
    
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 })
  }
}