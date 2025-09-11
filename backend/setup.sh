#!/bin/bash

echo "🚀 Setting up Focus Guard Cam Backend with MongoDB..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration (Local)
MONGODB_URI=mongodb://localhost:27017/focus-guard-cam
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Install MongoDB: https://docs.mongodb.com/manual/installation/"
echo "2. Start MongoDB service"
echo "3. Run: npm start"
echo ""
echo "For detailed setup instructions, see: setup-mongodb.md"
