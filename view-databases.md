# How to View Your Databases

## MongoDB (User data, EHR records, Patients)

### Using Command Line (mongosh)
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/healthlife

# Useful commands once connected:
show dbs                    # List all databases
use healthlife              # Switch to healthlife database
show collections            # List all collections (tables)

# View data:
db.users.find().pretty()           # View all users
db.users.find().limit(5).pretty()  # View first 5 users
db.patients.find().pretty()        # View all patients
db.ehrs.find().pretty()            # View all EHR records
db.ehrs.find({type: 'prescription'}).pretty()  # View only prescriptions

# Count documents:
db.users.countDocuments()
db.patients.countDocuments()
db.ehrs.countDocuments()

# Find specific user:
db.users.findOne({email: "user@example.com"})

exit  # Exit mongosh
```

### Using MongoDB Compass (GUI - Recommended)
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect using: `mongodb://localhost:27017`
3. Select database: `healthlife`
4. Browse collections visually

---

## PostgreSQL (Doctors, Appointments, Ratings, Medicines)

### Using Command Line (psql)
First, check if psql is installed:
```bash
which psql
```

If not installed, install PostgreSQL client:
```bash
brew install postgresql
```

Then connect:
```bash
# Default connection (if password is 'postgres')
psql -h localhost -U postgres -d healthlife

# Or if you have a password set:
PGPASSWORD=your_password psql -h localhost -U postgres -d healthlife
```

### Useful PostgreSQL Commands:
```sql
-- List all tables
\dt

-- View doctors table
SELECT * FROM doctors;

-- View appointments
SELECT * FROM appointments ORDER BY date DESC;

-- View ratings
SELECT * FROM ratings;

-- View with joins (doctors with user info)
SELECT d.*, COUNT(a.id) as appointment_count 
FROM doctors d 
LEFT JOIN appointments a ON d.id = a."doctorId" 
GROUP BY d.id;

-- Count records
SELECT COUNT(*) FROM doctors;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM ratings;

-- Exit
\q
```

### Using GUI Tools (Recommended)

#### Option 1: pgAdmin (Official PostgreSQL GUI)
1. Download: https://www.pgadmin.org/download/
2. Install and open pgAdmin
3. Add new server:
   - Host: localhost
   - Port: 5432
   - Database: healthlife
   - Username: postgres
   - Password: (your PostgreSQL password)

#### Option 2: DBeaver (Free, works with both databases)
1. Download: https://dbeaver.io/download/
2. Install and open DBeaver
3. Create new connection:
   - For PostgreSQL: Choose PostgreSQL, enter connection details
   - For MongoDB: Choose MongoDB, enter connection string

#### Option 3: TablePlus (macOS - Paid but has free tier)
1. Download: https://tableplus.com/
2. Supports both PostgreSQL and MongoDB
3. Easy visual interface

---

## Quick Database Info

### MongoDB Collections:
- `users` - All user accounts (patients, doctors, etc.)
- `patients` - Patient profiles and consent settings
- `ehrs` - Electronic Health Records (prescriptions, lab results, etc.)

### PostgreSQL Tables:
- `doctors` - Doctor profiles and availability
- `appointments` - Patient appointments
- `ratings` - Doctor ratings from patients
- `medicines` - Medicine catalog
- `orders` - Pharmacy orders

---

## Quick View Scripts

I can create simple scripts to view data if you'd like. Just let me know!

