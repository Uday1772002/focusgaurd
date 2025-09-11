#!/bin/bash

echo "🚀 Deploying Focus Guard Cam..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

echo "🎉 Deployment complete!"
echo "📱 Frontend: https://focus-guard-cam.vercel.app"
echo "🔧 Backend: Deploy separately to Railway/Heroku"
