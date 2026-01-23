#!/bin/bash

echo "📝 Creating .env files..."
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/healthlife
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=ws://localhost:5001
EOF
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

# AI Engine .env
if [ ! -f "ai-engine/.env" ]; then
    cat > ai-engine/.env << 'EOF'
FLASK_ENV=development
FLASK_PORT=8000
MONGODB_URI=mongodb://localhost:27017/healthlife
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
EOF
    echo "✅ Created ai-engine/.env"
else
    echo "⚠️  ai-engine/.env already exists"
fi

echo ""
echo "✅ All .env files created!"
echo ""
echo "📝 Note: If using MongoDB Atlas, update MONGODB_URI in backend/.env and ai-engine/.env"



