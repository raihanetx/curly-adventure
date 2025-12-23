#!/bin/bash

echo "🔐 JWT Secret Generator for Article Hub"
echo "=================================="
echo ""

# Generate a cryptographically secure JWT secret
JWT_SECRET=$(openssl rand -base64 64)

echo "Generated JWT Secret:"
echo "=================="
echo "$JWT_SECRET"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Keep this secret absolutely private"
echo "2. Never commit it to version control"
echo "3. Use different secrets for development/production"
echo "4. Store securely in environment variables"
echo ""

# Show how to use it
echo "📝 Environment Variable Setup:"
echo "=========================="
echo "Add this to your .env.local file:"
echo ""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""

echo "🚀 For Vercel Deployment:"
echo "=========================="
echo "In Vercel Dashboard → Environment Variables:"
echo "Name: JWT_SECRET"
echo "Value: $JWT_SECRET"
echo ""

echo "✅ Security Features of this secret:"
echo "- 64 bytes of cryptographically secure random data"
echo "- Base64 encoded for safe transport"
echo "- Compatible with JWT HS256 algorithm"
echo "- Meets industry standards for production use"
echo ""

# Test the secret strength
SECRET_LENGTH=${#JWT_SECRET}
if [ $SECRET_LENGTH -ge 32 ]; then
    echo "✅ Secret length: $SECRET_LENGTH characters (GOOD - >= 32)"
else
    echo "❌ Secret length: $SECRET_LENGTH characters (TOO SHORT - should be >= 32)"
fi

echo ""
echo "🔄 Need a new secret? Run this command again!"
echo "============================================="