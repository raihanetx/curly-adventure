import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, FileText, Users, LogOut } from 'lucide-react'
import Link from 'next/link'
import { query } from '@/lib/db'

interface Article {
  id: string
  title: string
  excerpt: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  author: {
    name: string
    email: string
  }
}

interface Stats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalUsers: number
}

async function getArticles(): Promise<Article[]> {
  try {
    const result = await query(`
      SELECT 
        a.id, a.title, a.excerpt, a.slug, a.published, a.created_at, a.updated_at,
        u.name, u.email
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `)

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      slug: row.slug,
      published: row.published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        name: row.name,
        email: row.email
      }
    }))
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return []
  }
}

async function getStats(): Promise<Stats> {
  try {
    const articlesResult = await query('SELECT COUNT(*) as total, SUM(CASE WHEN published = true THEN 1 ELSE 0 END) as published FROM articles')
    const usersResult = await query('SELECT COUNT(*) as total FROM users')
    
    const articlesRow = articlesResult.rows[0]
    const usersRow = usersResult.rows[0]
    
    return {
      totalArticles: parseInt(articlesRow.total),
      publishedArticles: parseInt(articlesRow.published),
      draftArticles: parseInt(articlesRow.total) - parseInt(articlesRow.published),
      totalUsers: parseInt(usersRow.total)
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      totalUsers: 0
    }
  }
}

export default async function AdminDashboard() {
  const articles = await getArticles()
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.svg"
                alt="Article Hub"
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, Admin
              </span>
              <form action="/api/auth/logout" method="POST">
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </form>
              <Link href="/">
                <Button variant="outline">View Site</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.publishedArticles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.draftArticles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Articles</h2>
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>

        {/* Articles List */}
        {articles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">Create your first article to get started</p>
              <Link href="/admin/articles/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <Badge variant={article.published ? "default" : "secondary"}>
                          {article.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>By {article.author.name || 'Anonymous'}</span>
                        <span>Created {new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/articles/${article.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <form action={`/api/articles/${article.id}`} method="DELETE">
                        <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}