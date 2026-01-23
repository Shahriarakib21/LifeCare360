#!/bin/bash

# Backup Script for Healthcare Management System
# Run this before resetting your Mac

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/user/Development/intern"
BACKUP_DIR="$HOME/Desktop/intern_backup_$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Healthcare System Backup Script${NC}"
echo -e "${GREEN}Started: $TIMESTAMP${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Created backup directory: $BACKUP_DIR${NC}\n"

# Function to backup directory
backup_dir() {
    local source=$1
    local dest=$2
    local name=$3
    
    if [ -d "$source" ]; then
        echo -e "${YELLOW}Backing up $name...${NC}"
        cp -r "$source" "$dest"
        echo -e "${GREEN}✓ $name backed up${NC}\n"
    else
        echo -e "${YELLOW}⚠ $name not found (skipping)${NC}\n"
    fi
}

# Function to backup file
backup_file() {
    local source=$1
    local dest=$2
    local name=$3
    
    if [ -f "$source" ]; then
        echo -e "${YELLOW}Backing up $name...${NC}"
        cp "$source" "$dest"
        echo -e "${GREEN}✓ $name backed up${NC}\n"
    else
        echo -e "${YELLOW}⚠ $name not found (skipping)${NC}\n"
    fi
}

# Backup source code (excluding node_modules, .next, venv, etc.)
echo -e "${YELLOW}Backing up source code...${NC}"
cd "$PROJECT_DIR"

# Use rsync to exclude unnecessary files
rsync -av \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.nyc_output' \
    --exclude='tmp' \
    --exclude='temp' \
    . "$BACKUP_DIR/"

echo -e "${GREEN}✓ Source code backed up${NC}\n"

# Backup .env files specifically (they might be gitignored)
echo -e "${YELLOW}Searching for .env files...${NC}"
find "$PROJECT_DIR" -name ".env*" -type f 2>/dev/null | while read -r envfile; do
    rel_path=${envfile#$PROJECT_DIR/}
    dest_path="$BACKUP_DIR/$rel_path"
    mkdir -p "$(dirname "$dest_path")"
    cp "$envfile" "$dest_path"
    echo -e "${GREEN}✓ Found and backed up: $rel_path${NC}"
done
echo ""

# Backup uploads directory (if it exists and has content)
if [ -d "$PROJECT_DIR/backend/uploads" ] && [ "$(ls -A $PROJECT_DIR/backend/uploads 2>/dev/null)" ]; then
    echo -e "${YELLOW}Backing up uploads directory...${NC}"
    backup_dir "$PROJECT_DIR/backend/uploads" "$BACKUP_DIR/backend/" "uploads"
else
    echo -e "${YELLOW}⚠ Uploads directory is empty or doesn't exist (skipping)${NC}\n"
fi

# Create database backup instructions
echo -e "${YELLOW}Creating database backup instructions...${NC}"
cat > "$BACKUP_DIR/DATABASE_BACKUP_INSTRUCTIONS.txt" << EOF
========================================
DATABASE BACKUP INSTRUCTIONS
========================================

IMPORTANT: Run these commands manually to backup your databases!

1. PostgreSQL Backup:
   pg_dump -U your_username -d your_database_name > $BACKUP_DIR/postgres_backup.sql

2. MongoDB Backup:
   mongodump --uri="your_connection_string" --out=$BACKUP_DIR/mongodb_backup

3. Verify backups were created:
   ls -lh $BACKUP_DIR/*.sql
   ls -lh $BACKUP_DIR/mongodb_backup

========================================
EOF
echo -e "${GREEN}✓ Database backup instructions created${NC}\n"

# Create restoration guide
echo -e "${YELLOW}Creating restoration guide...${NC}"
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.txt" << EOF
========================================
RESTORATION INSTRUCTIONS
========================================

After resetting your Mac, follow these steps:

1. Restore project folder:
   - Copy entire backup to: /Users/user/Development/intern/

2. Restore environment variables:
   - Copy all .env files back to their original locations
   - Verify all API keys and secrets

3. Restore databases:
   - PostgreSQL: psql -U your_username -d your_database_name < postgres_backup.sql
   - MongoDB: mongorestore --uri="your_connection_string" ./mongodb_backup

4. Reinstall dependencies:
   cd backend && npm install
   cd ../frontend && npm install
   cd ../ai-engine && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

5. Test the application:
   cd backend && npm run dev
   cd ../frontend && npm run dev

========================================
EOF
echo -e "${GREEN}✓ Restoration guide created${NC}\n"

# Create backup summary
echo -e "${YELLOW}Creating backup summary...${NC}"
cat > "$BACKUP_DIR/BACKUP_SUMMARY.txt" << EOF
========================================
BACKUP SUMMARY
========================================

Backup Date: $TIMESTAMP
Backup Location: $BACKUP_DIR

Contents:
- Source code (excluding node_modules, .next, venv)
- Environment files (.env*)
- Uploads directory (if exists)
- Database backup instructions

Next Steps:
1. Review this backup
2. Follow DATABASE_BACKUP_INSTRUCTIONS.txt to backup databases
3. Store this backup in a safe location (external drive or cloud)
4. Verify backup before resetting Mac

========================================
EOF
echo -e "${GREEN}✓ Backup summary created${NC}\n"

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Backup completed successfully!${NC}"
echo -e "${GREEN}Backup size: $BACKUP_SIZE${NC}"
echo -e "${GREEN}Location: $BACKUP_DIR${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}⚠ IMPORTANT REMINDERS:${NC}"
echo -e "1. ${YELLOW}Run database backups manually${YELLOW} (see DATABASE_BACKUP_INSTRUCTIONS.txt)"
echo -e "2. ${YELLOW}Verify all .env files are backed up${NC}"
echo -e "3. ${YELLOW}Store backup in a safe location${NC}"
echo -e "4. ${YELLOW}Test restoration on a test machine if possible${NC}\n"

echo -e "${GREEN}Backup script completed!${NC}"

