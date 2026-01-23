# Database Connection Fixes Applied

## ✅ PostgreSQL - FIXED!

**What I did:**
- Created the `healthlife` database in PostgreSQL

**What you need to do:**
1. **Refresh PostgreSQL.app** (close and reopen, or press `Cmd+R`)
2. You should now see **`healthlife`** database in the left sidebar
3. Click on it to browse

**If you still don't see it:**
1. In PostgreSQL.app, click the **"+"** button
2. Look for `healthlife` in the list
3. Or manually verify:
   ```bash
   /Applications/Postgres.app/Contents/Versions/18/bin/psql -d postgres -c "\l" | grep healthlife
   ```

**Next Step - Create Tables:**
Once you can see the database, you need to create the tables. Run:
```bash
cd backend
npm install  # If you haven't already
npx ts-node scripts/sync-database.ts
```

This will create:
- `doctors` table
- `appointments` table
- `ratings` table
- `medicines` table
- `orders` table

---

## ⚠️ MongoDB - Needs Setup

**Problem:** MongoDB is not installed or not running on your machine.

**You have 3 options:**

### Option 1: Install MongoDB Locally (Recommended)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
lsof -i :27017
```

Then connect with MongoDB Compass using: `mongodb://localhost:27017`

### Option 2: Use MongoDB Atlas (Easiest - Cloud)

1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Get connection string
4. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthlife
   ```
5. Connect Compass using the Atlas connection string

### Option 3: Use Docker

```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

**See detailed guide:** `MONGODB_SETUP.md`

---

## Quick Action Items

### For PostgreSQL (Do This Now):
1. ✅ Database created - just refresh PostgreSQL.app
2. ⏳ Create tables by running sync script

### For MongoDB (Choose One):
1. ⏳ Install MongoDB locally, OR
2. ⏳ Use MongoDB Atlas (cloud), OR  
3. ⏳ Use Docker

---

## After Both Are Working

1. **PostgreSQL.app** should show:
   - `healthlife` database
   - Tables: `doctors`, `appointments`, `ratings`, `medicines`, `orders`

2. **MongoDB Compass** should show:
   - `healthlife` database
   - Collections: `users`, `patients`, `ehrs`

3. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```
   This will:
   - Connect to both databases
   - Create collections/tables if needed
   - Populate initial data

---

## Need Help?

- **PostgreSQL issues:** See `POSTGRESQL_SETUP.md`
- **MongoDB issues:** See `MONGODB_SETUP.md`
- **Using GUI tools:** See `GUI_DATABASE_GUIDE.md`

