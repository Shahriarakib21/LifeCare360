# How to Run the HealthLife Project

## Prerequisites Check

Before running, you need:

1. ✅ **Node.js 18+** - Currently: ❌ Not found in PATH
2. ✅ **Python 3.9+** - Currently: ✅ Python 3.14.2 installed
3. ✅ **PostgreSQL** - Currently: ✅ Running (port 5432)
4. ⚠️ **MongoDB** - Currently: ❌ Not running

---

## Step 1: Install Node.js (Required)

**Option A: Using Homebrew (Recommended)**
```bash
brew install node
```

**Option B: Download from Node.js Website**
1. Go to: https://nodejs.org/
2. Download LTS version (v20 or v18)
3. Install the .pkg file
4. Restart terminal

**Verify Installation:**
```bash
node --version  # Should show v18.x or v20.x
npm --version   # Should show 9.x or 10.x
```

---

## Step 2: Install MongoDB (Required)

Choose one option:

**Option A: Install Locally**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Option B: Use MongoDB Atlas (Cloud - Easier)**
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `backend/.env` (see Step 3)

---

## Step 3: Create Environment Files

Create `.env` files for each service:

### Backend (.env)
```bash
cd backend
cat > .env << 'EOF'
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
```

**If using MongoDB Atlas**, replace `MONGODB_URI` with your Atlas connection string.

### Frontend (.env)
```bash
cd frontend
cat > .env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=ws://localhost:5001
EOF
```

### AI Engine (.env)
```bash
cd ai-engine
cat > .env << 'EOF'
FLASK_ENV=development
FLASK_PORT=8000
MONGODB_URI=mongodb://localhost:27017/healthlife
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
EOF
```

---

## Step 4: Install Dependencies

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Install Backend Dependencies
```bash
cd backend
npm install
```

### Setup AI Engine
```bash
cd ai-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

---

## Step 5: Setup Databases

### PostgreSQL - Create Tables
```bash
cd backend
npx ts-node scripts/sync-database.ts
```

This creates:
- `doctors` table
- `appointments` table
- `ratings` table
- `medicines` table
- `orders` table

### MongoDB - Will be created automatically
MongoDB collections (`users`, `patients`, `ehrs`) will be created automatically when you first insert data.

---

## Step 6: Run the Project

### Option A: Run All Services at Once (Recommended)

```bash
# Make script executable
chmod +x start.sh

# Run all services
./start.sh
```

This starts:
- Backend on http://localhost:5001
- AI Engine on http://localhost:8000
- Frontend on http://localhost:3000

### Option B: Run Services Separately (3 Terminal Windows)

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

---

## Step 7: Access the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **AI Engine**: http://localhost:8000
- **Health Check**: http://localhost:5001/health

---

## Troubleshooting

### "node: command not found"
- Install Node.js (see Step 1)
- Restart terminal after installation
- Verify: `node --version`

### "npm: command not found"
- Comes with Node.js
- Reinstall Node.js if npm is missing

### "MongoDB connection refused"
- Start MongoDB (see Step 2)
- Or use MongoDB Atlas connection string

### "PostgreSQL connection error"
- Make sure PostgreSQL.app is running
- Check database exists: `healthlife`
- Verify credentials in `backend/.env`

### "Port already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### "Module not found" errors
- Reinstall dependencies:
```bash
cd frontend && rm -rf node_modules package-lock.json && npm install
cd ../backend && rm -rf node_modules package-lock.json && npm install
```

### Python virtual environment issues
```bash
cd ai-engine
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Quick Start Checklist

- [ ] Install Node.js
- [ ] Install/Start MongoDB
- [ ] Create `.env` files (backend, frontend, ai-engine)
- [ ] Install dependencies (frontend, backend, ai-engine)
- [ ] Create PostgreSQL tables (run sync script)
- [ ] Start all services
- [ ] Access http://localhost:3000

---

## First Time Setup Script

Run this to set up everything:

```bash
# Install Node.js (if not installed)
brew install node

# Install MongoDB (if not installed)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Create .env files (see Step 3 above)

# Install all dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd ai-engine && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..

# Create PostgreSQL tables
cd backend && npx ts-node scripts/sync-database.ts && cd ..

# Start all services
./start.sh
```

---

*Once everything is set up, you can use `./start.sh` to start all services at once!*



