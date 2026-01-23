# PostgreSQL Setup Guide for macOS

## Step 1: Start PostgreSQL Service

### If installed via Homebrew:
```bash
# Start PostgreSQL service
brew services start postgresql@14
# or for latest version:
brew services start postgresql

# Check if it's running
brew services list | grep postgresql
```

### If installed via Postgres.app:
1. Open Postgres.app from Applications
2. Click "Initialize" if it's the first time
3. The server should start automatically

### If installed via official installer:
```bash
# Start PostgreSQL (usually auto-starts on boot)
sudo launchctl load -w /Library/LaunchDaemons/com.edb.launchd.postgresql-*.plist

# Or manually:
pg_ctl -D /usr/local/var/postgres start
```

## Step 2: Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
pg_isready

# Or check the process
ps aux | grep postgres
```

## Step 3: Create the Database

```bash
# Connect to PostgreSQL (default user is usually your macOS username or 'postgres')
psql postgres

# Or if you need to specify user:
psql -U postgres
```

**If you get "command not found":**
- Add PostgreSQL to your PATH. For Homebrew: `echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc`
- Or use full path: `/opt/homebrew/opt/postgresql@14/bin/psql`

Once connected, run:
```sql
-- Create the database
CREATE DATABASE healthlife;

-- Create a user (if needed)
CREATE USER postgres WITH PASSWORD 'postgres';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE healthlife TO postgres;

-- Exit
\q
```

## Step 4: Update .env File

The `.env` file in the `backend/` directory has been updated with default PostgreSQL settings:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthlife
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Important:** If you set a different password during PostgreSQL installation, update `POSTGRES_PASSWORD` in `backend/.env`.

## Step 5: Test the Connection

```bash
# Navigate to backend directory
cd backend

# Test connection (if you have psql)
psql -h localhost -U postgres -d healthlife

# Or test via Node.js
node -e "const { sequelize } = require('./dist/config/database'); sequelize.authenticate().then(() => console.log('✅ Connected!')).catch(err => console.error('❌ Error:', err));"
```

## Step 6: Create Database Tables

The tables will be created automatically when you:
1. Start the backend server
2. Or run the migration script

```bash
# Start backend (this will create tables automatically via Sequelize)
cd backend
npm run dev
```

## Step 7: Run Migration Script (Create Doctor Profiles)

After PostgreSQL is connected, run the migration script to create profiles for existing doctors:

```bash
cd backend
npx ts-node scripts/create-doctor-profiles.ts
```

## Troubleshooting

### "psql: command not found"
Add PostgreSQL to your PATH:
```bash
# For Homebrew on Apple Silicon (M1/M2):
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Homebrew on Intel:
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "password authentication failed"
1. Check your PostgreSQL password in `backend/.env`
2. Reset password:
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

### "database does not exist"
Create it:
```sql
CREATE DATABASE healthlife;
```

### "connection refused"
1. Make sure PostgreSQL is running: `brew services list | grep postgresql`
2. Check if port 5432 is in use: `lsof -i :5432`
3. Start PostgreSQL: `brew services start postgresql`

### Find PostgreSQL Installation
```bash
# Homebrew location
brew --prefix postgresql

# Common locations
ls -la /usr/local/var/postgres
ls -la /opt/homebrew/var/postgres
ls -la ~/Library/Application\ Support/Postgres/
```

## Quick Test

After setup, restart your backend server and check the logs. You should see:
```
✅ PostgreSQL connected successfully
```

If you see:
```
⚠️  PostgreSQL connection error
```
Check your `.env` file and make sure PostgreSQL is running.


