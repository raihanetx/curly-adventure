# Article Hub

A modern article management platform built with Next.js, TypeScript, and Neon database featuring **Standard JWT Authentication**.

## Features

- **Article Management**: Create, read, update, and delete articles
- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing
- **Admin Dashboard**: Comprehensive admin interface for managing articles
- **Role-Based Access**: Admin-only access to article management
- **Markdown Support**: Write articles using Markdown syntax with syntax highlighting
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Neon Database**: Fast, serverless PostgreSQL database
- **Vercel Optimized**: Ready for deployment on Vercel

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Neon (PostgreSQL)
- **Authentication**: Custom JWT system with bcrypt
- **Markdown**: react-markdown with syntax highlighting

## Authentication System

This platform uses a **Standard JWT Authentication System**:

### 🔐 Security Features
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevent XSS attacks
- **Token Expiration**: 7-day token expiry
- **Role-Based Access**: Admin-only routes protection

### 📋 Authentication Flow
1. User submits email/password
2. Server verifies credentials against database
3. JWT token generated and stored in HTTP-only cookie
4. Subsequent requests include token for authentication
5. Middleware protects admin routes

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Neon database account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your credentials:
   ```
   DATABASE_URL="your_neon_database_url"
   JWT_SECRET="your_secure_jwt_secret"
   ```

4. Initialize the database:
   ```bash
   bun run dev
   curl -X POST http://localhost:3000/api/init
   ```

5. Run the development server:
   ```bash
   bun run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Admin Access

After initializing the database:

- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
- Email: `admin@example.com`
- Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── admin/                 # Admin routes (protected)
│   │   ├── dashboard/         # Admin dashboard
│   │   ├── login/            # Admin login
│   │   └── articles/         # Article management
│   ├── api/                  # API routes
│   │   ├── auth/             # JWT authentication endpoints
│   │   ├── articles/         # Article CRUD API
│   │   └── init/             # Database initialization
│   ├── article/[slug]/       # Individual article pages
│   └── page.tsx              # Homepage
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── auth-provider.tsx     # JWT authentication context
├── lib/
│   ├── auth-jwt.ts          # JWT authentication utilities
│   └── db.ts                # Database connection
└── middleware.ts              # Route protection middleware
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Articles
- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create new article (admin only)

### Database
- `POST /api/init` - Initialize database and create admin user

## Deployment

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Neon database connection string
   - `JWT_SECRET`: A random secret string

4. Deploy!

### Environment Variables for Production

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `JWT_SECRET`: A random secret for JWT signing

## Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique email address
- `name`: User display name
- `password`: Hashed password (bcrypt)
- `role`: User role (USER/ADMIN)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Articles Table
- `id`: Primary key
- `title`: Article title
- `content`: Article content (Markdown)
- `excerpt`: Article excerpt
- `slug`: URL-friendly slug
- `published`: Publication status
- `author_id`: Foreign key to users table
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Security Considerations

- ✅ Passwords are hashed with bcrypt
- ✅ JWT tokens stored in HTTP-only cookies
- ✅ Admin routes protected by middleware
- ✅ Token expiration and validation
- ✅ Role-based access control
- ✅ SQL injection prevention with parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).