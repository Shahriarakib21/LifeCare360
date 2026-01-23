# Quick Connection Guide - MongoDB Compass & PostgreSQL.app

## ✅ PostgreSQL.app - Ready to Use!

PostgreSQL is **running** on port 5432. You can connect now!

### Steps:
1. **Open PostgreSQL.app**
2. Look for **`healthlife`** database in the left sidebar
3. If you see it, click on it to browse tables
4. If you don't see it, create it:
   - Click the **"+"** button
   - Name: `healthlife`
   - Click "Create"

### Quick Test:
1. Open a SQL query tab (`Cmd+T`)
2. Run:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. You should see: `doctors`, `appointments`, `ratings`, `medicines`, `orders`

---

## ⚠️ MongoDB Compass - Start MongoDB First

MongoDB may not be running. Here's how to start it:

### Option 1: Using Homebrew (if installed via Homebrew)
```bash
brew services start mongodb-community
# or
brew services start mongodb-community@7.0
```

### Option 2: Using MongoDB Compass
1. Open MongoDB Compass
2. Try to connect - if it fails, MongoDB isn't running
3. Start MongoDB manually:
   ```bash
   mongod --dbpath ~/data/db
   ```
   (Create the directory first: `mkdir -p ~/data/db`)

### Option 3: Using MongoDB Atlas (Cloud)
If you're using MongoDB Atlas:
1. Get connection string from Atlas dashboard
2. Use that connection string in Compass

### Connection in MongoDB Compass:
1. **Open MongoDB Compass**
2. **Connection String**: `mongodb://localhost:27017`
3. **Click "Connect"**
4. **Select `healthlife` database**

---

## Quick Connection Checklist

### PostgreSQL.app ✅
- [x] PostgreSQL is running (port 5432)
- [ ] Open PostgreSQL.app
- [ ] Find/select `healthlife` database
- [ ] Browse tables: `doctors`, `appointments`, `ratings`, `medicines`, `orders`

### MongoDB Compass ⚠️
- [ ] Start MongoDB (if not running)
- [ ] Open MongoDB Compass
- [ ] Connect to `mongodb://localhost:27017`
- [ ] Select `healthlife` database
- [ ] Browse collections: `users`, `patients`, `ehrs`

---

## What to Check First

### In PostgreSQL.app:
1. **Doctors Table**: 
   ```sql
   SELECT COUNT(*) FROM doctors;
   ```
   Should show number of doctors (expected: 3)

2. **Appointments Table**:
   ```sql
   SELECT * FROM appointments ORDER BY date DESC LIMIT 5;
   ```
   Should show recent appointments

### In MongoDB Compass:
1. **Users Collection**:
   - Filter: `{}` (show all)
   - Should see user documents

2. **EHR Collection**:
   - Filter: `{"type": "prescription"}`
   - Should see prescription records

---

## Need Help?

See the detailed guide: `GUI_DATABASE_GUIDE.md`

