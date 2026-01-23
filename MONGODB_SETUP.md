# MongoDB Setup Guide for HealthLife

## Issue: Connection Refused (ECONNREFUSED)

This means MongoDB is **not running** on your machine. Here are your options:

---

## Option 1: Install & Run MongoDB Locally (Recommended for Development)

### Step 1: Install MongoDB

**Using Homebrew (Easiest):**
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Or install specific version
brew install mongodb-community@7.0
```

**Or Download from MongoDB Website:**
1. Go to: https://www.mongodb.com/try/download/community
2. Select: macOS, your version
3. Download and install the `.dmg` file

### Step 2: Start MongoDB

**Using Homebrew:**
```bash
# Start MongoDB service
brew services start mongodb-community

# Or start manually (runs in foreground)
mongod --config /opt/homebrew/etc/mongod.conf
```

**Or manually:**
```bash
# Create data directory
mkdir -p ~/data/db

# Start MongoDB
mongod --dbpath ~/data/db
```

### Step 3: Verify MongoDB is Running

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Or check port
lsof -i :27017
```

### Step 4: Connect with MongoDB Compass

1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Click "Connect"
4. Select `healthlife` database (or create it)

---

## Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

This is the **easiest option** if you don't want to install MongoDB locally.

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a free cluster (M0 - Free tier)

### Step 2: Get Connection String

1. In Atlas dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 3: Update Your .env File

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/healthlife?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your Atlas credentials.

### Step 4: Connect with MongoDB Compass

1. Open MongoDB Compass
2. Paste the Atlas connection string
3. Click "Connect"
4. You'll see your `healthlife` database

### Step 5: Whitelist Your IP

In Atlas dashboard:
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   OR add your specific IP address

---

## Option 3: Use Docker (If You Have Docker)

```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb-data:/data/db \
  mongo:latest

# Verify it's running
docker ps | grep mongodb
```

Then connect with: `mongodb://localhost:27017`

---

## Quick Fix: Start MongoDB Now

If you have MongoDB installed but it's not running:

```bash
# Try Homebrew service
brew services start mongodb-community

# Or try manual start
mongod --dbpath ~/data/db &

# Check if it started
sleep 2
lsof -i :27017
```

---

## Verify Connection

### Test with MongoDB Compass:
1. Connection String: `mongodb://localhost:27017`
2. Should connect successfully
3. You should see databases listed

### Test with Command Line:
```bash
# If you have mongosh installed
mongosh mongodb://localhost:27017

# Or if you have mongo (older version)
mongo mongodb://localhost:27017
```

---

## Troubleshooting

### "mongod: command not found"
- MongoDB is not installed
- Install using Option 1 above

### "Address already in use" (port 27017)
- MongoDB is already running
- Check: `lsof -i :27017`
- Kill process if needed: `kill <PID>`

### "Permission denied" for data directory
```bash
# Fix permissions
sudo chown -R $(whoami) ~/data/db
```

### Connection still refused after starting
1. Wait a few seconds for MongoDB to fully start
2. Check logs: `tail -f /opt/homebrew/var/log/mongodb/mongo.log`
3. Verify port: `lsof -i :27017`

---

## Recommended: MongoDB Atlas (Easiest)

For development, **MongoDB Atlas** is the easiest option:
- ✅ No installation needed
- ✅ Free tier available (512MB storage)
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Easy to share with team

**Quick Setup:**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `backend/.env` with connection string
5. Connect with Compass using the connection string

---

## Next Steps After MongoDB is Running

1. **Create the database** (if it doesn't exist):
   - MongoDB will create it automatically when you first insert data
   - Or create it manually in Compass

2. **Start your backend**:
   ```bash
   cd backend
   npm run dev
   ```
   - This will create collections automatically

3. **Verify in Compass**:
   - You should see: `users`, `patients`, `ehrs` collections

---

*Choose the option that works best for you!*

