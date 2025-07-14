#!/bin/bash

echo "🚀 Starting deployment process..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Copy build files to backend for production serving
echo "📁 Copying build files to backend..."
cp -r build backend/

echo "✅ Deployment preparation complete!"
echo "🌐 Ready to deploy to your hosting platform"
echo ""
echo "📋 Next steps:"
echo "1. For Heroku: git push heroku main"
echo "2. For Railway: railway up"
echo "3. For Render: connect your repository"
echo "4. For Vercel: vercel --prod" 