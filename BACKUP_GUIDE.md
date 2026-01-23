# Backup Guide - Files to Save Before Mac Reset

## 🚨 CRITICAL FILES TO BACKUP

### 1. **Entire Project Directory**
```
/Users/user/Development/intern/
```
**Backup the entire folder** - This contains all your source code, configurations, and project files.

### 2. **Environment Variables & Configuration Files**

#### Backend Environment Variables
- `backend/.env` (if exists - check manually)
- `backend/.env.local` (if exists)
- Any custom config files in `backend/src/config/`

#### Frontend Environment Variables
- `frontend/.env` (if exists)
- `frontend/.env.local` (if exists)
- `frontend/.env.production` (if exists)

#### AI Engine Environment Variables
- `ai-engine/.env` (if exists)

**⚠️ IMPORTANT:** These files are gitignored and may contain:
- Database connection strings
- API keys (AWS, email services, etc.)
- JWT secrets
- S3 credentials
- Other sensitive configuration

### 3. **Database Backups**

#### PostgreSQL Database
```bash
# Export PostgreSQL database
pg_dump -U your_username -d your_database_name > backup.sql
```

#### MongoDB Database
```bash
# Export MongoDB database
mongodump --uri="your_connection_string" --out=./mongodb_backup
```

**Save these backup files!**

### 4. **Uploaded Files (if important)**
- `backend/uploads/` - Contains user-uploaded files (prescriptions, doctor profiles, etc.)
- Only backup if you have important production data

### 5. **Log Files (optional)**
- `backend/logs/` - Only if you need to debug issues later
- `logs/` - Root level logs

### 6. **Python Virtual Environment (optional)**
- `ai-engine/venv/` - Can be regenerated, but backup `requirements.txt` is already in project

### 7. **Node Modules (DON'T BACKUP)**
- `node_modules/` - Can be regenerated with `npm install`
- `frontend/node_modules/`
- `backend/node_modules/`

## 📋 Quick Backup Checklist

### ✅ Must Backup:
- [ ] Entire `/Users/user/Development/intern/` folder (excluding node_modules)
- [ ] All `.env` files (check each directory)
- [ ] Database backups (PostgreSQL & MongoDB)
- [ ] `backend/uploads/` (if contains important data)

### ⚠️ Should Backup:
- [ ] `backend/logs/` (if needed for debugging)
- [ ] Any custom scripts or configurations not in git

### ❌ Don't Backup (can regenerate):
- [ ] `node_modules/` folders
- [ ] `.next/` build folder
- [ ] `venv/` Python virtual environment
- [ ] `__pycache__/` folders
- [ ] Log files (unless needed)

## 🔧 Backup Methods

### Option 1: External Drive / USB
```bash
# Copy entire project (excluding node_modules)
rsync -av --exclude 'node_modules' --exclude '.next' --exclude 'venv' \
  /Users/user/Development/intern/ \
  /Volumes/YourDrive/backup/intern/
```

### Option 2: Cloud Storage (Dropbox, Google Drive, iCloud)
- Upload the entire project folder
- Make sure to include `.env` files

### Option 3: Git Repository (if using version control)
```bash
# Ensure all changes are committed
git add .
git commit -m "Backup before Mac reset"
git push origin main
```

### Option 4: Time Machine (macOS)
- Make sure Time Machine includes your Development folder
- Verify backup before resetting

## 🔍 How to Find .env Files

Run these commands to find all environment files:

```bash
# Find all .env files
find /Users/user/Development/intern -name ".env*" -type f

# Find all config files
find /Users/user/Development/intern -name "*.config.*" -type f
```

## 📝 After Mac Reset - Restoration Steps

1. **Restore project folder** to `/Users/user/Development/intern/`

2. **Restore environment variables:**
   - Copy all `.env` files back to their original locations
   - Verify all API keys and secrets are correct

3. **Restore databases:**
   ```bash
   # PostgreSQL
   psql -U your_username -d your_database_name < backup.sql
   
   # MongoDB
   mongorestore --uri="your_connection_string" ./mongodb_backup
   ```

4. **Reinstall dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   
   # AI Engine
   cd ai-engine && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   ```

5. **Restore uploaded files:**
   - Copy `backend/uploads/` back if you backed it up

6. **Verify everything works:**
   ```bash
   # Test backend
   cd backend && npm run dev
   
   # Test frontend
   cd frontend && npm run dev
   ```

## 🎯 Recommended Backup Strategy

1. **Use Git** for source code (already done if you're using version control)
2. **Manual backup** of `.env` files to secure location (password manager or encrypted drive)
3. **Database dumps** to external drive or cloud storage
4. **Time Machine** for automatic backups of everything

## ⚠️ Security Notes

- **Never commit `.env` files to Git** (they're already in .gitignore)
- **Encrypt sensitive backups** before storing in cloud
- **Use password manager** for API keys and secrets
- **Verify backups** before resetting your Mac

## 📞 Quick Commands Reference

```bash
# Create a complete backup (excluding regenerable files)
cd /Users/user/Development/intern
tar -czf ~/Desktop/intern_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='*.log' \
  .

# This creates a compressed backup on your Desktop
```

---

**Last Updated:** December 2024
**Project:** Healthcare Management System

