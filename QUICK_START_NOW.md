# Quick Start - Run Project Now

## Current Status

- ❌ **Node.js**: Not installed or not in PATH
- ✅ **Python**: Installed (3.14.2)
- ✅ **PostgreSQL**: Running (database `healthlife` created)
- ❌ **MongoDB**: Not running

## Immediate Actions Required

### 1. Install Node.js (CRITICAL)

```bash
# Install Node.js using Homebrew
brew install node

# Verify installation
node --version
npm --version
```

**OR** download from: https://nodejs.org/ (LTS version)

### 2. Start MongoDB

**Option A: Install & Start Locally**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Option B: Use MongoDB Atlas (Easier)**
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account and cluster
3. Get connection string
4. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthlife
   ```

### 3. Install Dependencies

After Node.js is installed:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# AI Engine
cd ../ai-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

### 4. Create PostgreSQL Tables

```bash
cd backend
npx ts-node scripts/sync-database.ts
```

### 5. Start All Services

```bash
# Make script executable
chmod +x start.sh

# Start everything
./start.sh
```

---

## What I've Already Done

✅ Created `.env` files:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration  
- `ai-engine/.env` - AI engine configuration

✅ Created `healthlife` database in PostgreSQL

✅ Created logs directory

---

## After Installing Node.js

Run this complete setup:

```bash
# 1. Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd ai-engine && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..

# 2. Create PostgreSQL tables
cd backend && npx ts-node scripts/sync-database.ts && cd ..

# 3. Start MongoDB (if using local)
brew services start mongodb-community

# 4. Start all services
./start.sh
```

---

## Access After Starting

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **AI Engine**: http://localhost:8000
- **Health Check**: http://localhost:5001/health

---

## Need Help?

- **Node.js issues**: See `RUN_PROJECT.md`
- **MongoDB issues**: See `MONGODB_SETUP.md`
- **PostgreSQL issues**: See `POSTGRESQL_SETUP.md`



