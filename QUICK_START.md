# 🚀 Quick Start Guide

## Prerequisites

Before running the project, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)

## Quick Setup (Automated)

1. **Make scripts executable:**
   ```bash
   chmod +x setup.sh start.sh
   ```

2. **Run setup:**
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables:**
   ```bash
   # Copy example files
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   cp ai-engine/.env.example ai-engine/.env
   ```

4. **Edit environment files** with your configuration (databases, API keys, etc.)

5. **Start databases:**
   ```bash
   # MongoDB (if installed locally)
   mongod
   
   # PostgreSQL (if installed locally)
   # Usually starts automatically, or:
   pg_ctl -D /usr/local/var/postgres start
   ```

6. **Start all services:**
   ```bash
   ./start.sh
   ```

## Manual Setup

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

**AI Engine:**
```bash
cd ai-engine
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

### 2. Configure Environment Variables

**Frontend (.env):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthlife
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

**AI Engine (.env):**
```env
FLASK_ENV=development
FLASK_PORT=8000
MONGODB_URI=mongodb://localhost:27017/healthlife
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### 3. Start Databases

**MongoDB:**
```bash
# Local installation
mongod

# Or use MongoDB Atlas (cloud) - update MONGODB_URI in .env
```

**PostgreSQL:**
```bash
# Create database
createdb healthlife

# Or use psql
psql -U postgres
CREATE DATABASE healthlife;
\q
```

### 4. Run Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Engine:**
```bash
cd ai-engine
source venv/bin/activate
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **AI Engine:** http://localhost:8000
- **Health Check:** http://localhost:5000/health

## First Steps

1. **Register a new account:**
   - Go to http://localhost:3000/auth/register
   - Create a patient account

2. **Explore the dashboard:**
   - Login and explore the patient dashboard
   - View medical records (sample data)

3. **Test API:**
   - Visit http://localhost:5000/health
   - Check API docs at `/docs/API.md`

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :8000  # AI Engine

# Kill process
kill -9 <PID>
```

### Database Connection Issues
- Check if MongoDB is running: `mongod --version`
- Check if PostgreSQL is running: `pg_isready`
- Verify connection strings in `.env` files
- For MongoDB Atlas, ensure IP is whitelisted

### Module Not Found Errors
```bash
# Reinstall dependencies
cd frontend && rm -rf node_modules package-lock.json && npm install
cd ../backend && rm -rf node_modules package-lock.json && npm install
cd ../ai-engine && rm -rf venv && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Python Virtual Environment Issues
```bash
cd ai-engine
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Development Tips

1. **Hot Reload:** All services support hot reload during development
2. **Logs:** Check console output for errors
3. **Database:** Use MongoDB Compass and pgAdmin for database management
4. **API Testing:** Use Postman or curl to test API endpoints

## Next Steps

- Read [API.md](./docs/API.md) for API documentation
- Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture
- Read [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment

