# Database Access Guide

## Quick Access Commands

### PostgreSQL (using PostgreSQL.app)

**Connect to database:**
```bash
/Applications/Postgres.app/Contents/Versions/18/bin/psql -d healthlife
```

**Or add to your shell config for easier access:**
```bash
# Add to ~/.zshrc (or ~/.bash_profile)
alias pg-connect='/Applications/Postgres.app/Contents/Versions/18/bin/psql -d healthlife'
```

Then just use: `pg-connect`

**Useful PostgreSQL Commands:**
```sql
-- List all tables
\dt

-- View doctors
SELECT * FROM doctors;

-- View appointments
SELECT * FROM appointments ORDER BY date DESC;

-- View ratings
SELECT * FROM ratings;

-- View with details
SELECT 
  d.id, 
  d.specialization, 
  d."consultationFee", 
  d.rating, 
  d."totalReviews",
  COUNT(a.id) as appointment_count
FROM doctors d
LEFT JOIN appointments a ON d.id = a."doctorId"
GROUP BY d.id;

-- Exit
\q
```

### MongoDB

**Connect to database:**
```bash
mongosh mongodb://localhost:27017/healthlife
```

**Useful MongoDB Commands:**
```javascript
// List collections
show collections

// View users
db.users.find().pretty()

// View patients
db.patients.find().pretty()

// View EHR records
db.ehrs.find().pretty()

// View prescriptions only
db.ehrs.find({type: 'prescription'}).pretty()

// Count documents
db.users.countDocuments()
db.patients.countDocuments()
db.ehrs.countDocuments()

// Exit
exit
```

## Current Database Status

### PostgreSQL Tables:
- ✅ `doctors` - 3 doctors
- ✅ `appointments` - 5 appointments
- ✅ `ratings` - 0 ratings (new table, ready to use)
- ✅ `medicines` - Medicine catalog
- ✅ `orders` - Pharmacy orders

### MongoDB Collections:
- ✅ `users` - 5 users
- ✅ `patients` - Patient profiles
- ✅ `ehrs` - 6 EHR records

## GUI Tools (Recommended for Visual Browsing)

### For PostgreSQL:
1. **PostgreSQL.app** (You already have this!)
   - Open the app
   - Click on "healthlife" database
   - Browse tables visually

2. **DBeaver** (Free, works with both databases)
   - Download: https://dbeaver.io/download/
   - Create PostgreSQL connection:
     - Host: localhost
     - Port: 5432
     - Database: healthlife
     - Username: (your macOS username or postgres)

### For MongoDB:
1. **MongoDB Compass** (Official GUI)
   - Download: https://www.mongodb.com/try/download/compass
   - Connect: `mongodb://localhost:27017`
   - Select: `healthlife` database

2. **TablePlus** (macOS - supports both)
   - Download: https://tableplus.com/
   - Free tier available

## Quick View Commands

### View all doctors:
```bash
/Applications/Postgres.app/Contents/Versions/18/bin/psql -d healthlife -c "SELECT * FROM doctors;"
```

### View all appointments:
```bash
/Applications/Postgres.app/Contents/Versions/18/bin/psql -d healthlife -c "SELECT * FROM appointments ORDER BY date DESC;"
```

### View all users (MongoDB):
```bash
mongosh mongodb://localhost:27017/healthlife --eval "db.users.find().pretty()"
```

### View all EHR records (MongoDB):
```bash
mongosh mongodb://localhost:27017/healthlife --eval "db.ehrs.find().pretty()"
```

