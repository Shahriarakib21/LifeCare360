# Using MongoDB Compass & PostgreSQL.app with HealthLife

## Quick Start Guide

### MongoDB Compass

#### 1. Connect to MongoDB

1. **Open MongoDB Compass**
2. **Connection String**: 
   ```
   mongodb://localhost:27017
   ```
   Or simply click "Fill in connection fields individually":
   - **Host**: `localhost`
   - **Port**: `27017`
   - **Authentication**: None (if running locally without auth)

3. **Click "Connect"**

#### 2. Select the HealthLife Database

1. In the left sidebar, you'll see a list of databases
2. Click on **`healthlife`** database
3. If it doesn't exist, it will be created when you first insert data

#### 3. Browse Collections

You should see these collections:
- **`users`** - User accounts and authentication
- **`patients`** - Patient profiles
- **`ehrs`** - Electronic Health Records

#### 4. View Data

**View Users:**
- Click on `users` collection
- You'll see all user documents
- Click on any document to view details

**View Patients:**
- Click on `patients` collection
- See patient profiles with emergency contacts, insurance, preferences

**View EHR Records:**
- Click on `ehrs` collection
- Filter by type: Use the filter bar at the top
  - Type: `{"type": "prescription"}` to see only prescriptions
  - Type: `{"type": "lab"}` to see only lab results
  - Type: `{"patientId": ObjectId("...")}` to see records for a specific patient

#### 5. Useful MongoDB Compass Features

**Filter Documents:**
```
{"type": "prescription"}
{"patientId": ObjectId("507f1f77bcf86cd799439011")}
{"date": {"$gte": ISODate("2024-01-01")}}
```

**Sort Documents:**
- Click the sort icon
- Add: `{"date": -1}` to sort by date descending

**Project Fields:**
- Click the project icon
- Select only fields you want to see

**Export Data:**
- Select documents
- Click "Export Collection"
- Choose JSON or CSV format

---

### PostgreSQL.app

#### 1. Open PostgreSQL.app

1. **Launch PostgreSQL.app** from Applications
2. The app will show your databases in the left sidebar
3. If you see **`healthlife`** database, click on it
4. If not, you may need to create it first (see below)

#### 2. Create Database (if needed)

If `healthlife` database doesn't exist:

1. Click the **"+"** button or right-click in the sidebar
2. Select "New Database"
3. Name: `healthlife`
4. Click "Create"

#### 3. Browse Tables

You should see these tables:
- **`doctors`** - Doctor profiles
- **`appointments`** - Appointment records
- **`ratings`** - Doctor ratings
- **`medicines`** - Medicine catalog
- **`orders`** - Pharmacy orders

#### 4. View Data

**View Doctors:**
- Double-click `doctors` table
- See all doctor records with their details
- Note: JSONB fields (address, contact, availability) are shown as JSON

**View Appointments:**
- Double-click `appointments` table
- See all appointments with patient IDs, doctor IDs, dates, times

**View Ratings:**
- Double-click `ratings` table
- See patient ratings for doctors

**View Medicines:**
- Double-click `medicines` table
- Browse the medicine catalog

**View Orders:**
- Double-click `orders` table
- See pharmacy orders with items (JSONB)

#### 5. Run SQL Queries

1. Click the **SQL Query** button (or press `Cmd+T`)
2. Type your query:

**Example Queries:**

```sql
-- View all doctors with their ratings
SELECT 
  id,
  specialization,
  "consultationFee",
  rating,
  "totalReviews"
FROM doctors
WHERE "isActive" = true
ORDER BY rating DESC;

-- View upcoming appointments
SELECT 
  a.id,
  a.date,
  a.time,
  a.type,
  a.status,
  d.specialization,
  d."consultationFee"
FROM appointments a
JOIN doctors d ON a."doctorId" = d.id
WHERE a.date >= CURRENT_DATE
ORDER BY a.date, a.time;

-- Count appointments by status
SELECT 
  status,
  COUNT(*) as count
FROM appointments
GROUP BY status;

-- View doctor ratings
SELECT 
  d.specialization,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_ratings
FROM doctors d
LEFT JOIN ratings r ON d.id = r."doctorId"
GROUP BY d.id, d.specialization
ORDER BY avg_rating DESC;
```

3. Click **Run** (or press `Cmd+Enter`)

#### 6. Edit Data

**Edit a Record:**
- Double-click any cell to edit
- Press `Enter` to save
- Press `Esc` to cancel

**Add New Record:**
- Right-click table → "Insert Row"
- Fill in the fields
- Press `Enter` to save

**Delete Record:**
- Right-click row → "Delete Row"
- Confirm deletion

---

## Common Tasks

### Find a User's Patient Profile

**In MongoDB Compass:**
1. Go to `users` collection
2. Find user by email: Filter: `{"email": "user@example.com"}`
3. Note the `_id` (ObjectId)
4. Go to `patients` collection
5. Filter: `{"userId": ObjectId("...")}` (use the _id from step 3)

### Find a Patient's EHR Records

**In MongoDB Compass:**
1. Go to `patients` collection
2. Find patient (by userId or search)
3. Note the `_id` (ObjectId)
4. Go to `ehrs` collection
5. Filter: `{"patientId": ObjectId("...")}` (use the _id from step 3)
6. Sort by date: `{"date": -1}` to see most recent first

### Find a Doctor's Appointments

**In PostgreSQL.app:**
1. Go to `doctors` table
2. Find doctor (by specialization or name)
3. Note the `id` (integer)
4. Run SQL query:
```sql
SELECT * FROM appointments 
WHERE "doctorId" = 1  -- Replace 1 with doctor's id
ORDER BY date, time;
```

### Link MongoDB User to PostgreSQL Doctor

**In MongoDB Compass:**
1. Go to `users` collection
2. Find user with role "doctor"
3. Note the `_id` (ObjectId) - convert to string

**In PostgreSQL.app:**
1. Go to `doctors` table
2. Find doctor where `userId` matches the MongoDB ObjectId (as string)

### View Prescription Details

**In MongoDB Compass:**
1. Go to `ehrs` collection
2. Filter: `{"type": "prescription"}`
3. Click on a document to see:
   - `data.prescription.medications[]` - Multiple medications (new format)
   - `data.prescription.medication` - Single medication (old format)
   - `data.prescription.pdfUrl` - PDF link if available
   - `data.attachments[]` - Uploaded files

---

## Troubleshooting

### MongoDB Compass - Can't Connect

**Issue**: Connection refused or timeout

**Solutions**:
1. Make sure MongoDB is running:
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod
   ```
2. Check MongoDB is listening on port 27017:
   ```bash
   lsof -i :27017
   ```
3. If using MongoDB Atlas (cloud), use the connection string from Atlas dashboard
4. If using local MongoDB, try: `mongodb://127.0.0.1:27017`

### PostgreSQL.app - Database Not Found

**Issue**: `healthlife` database doesn't appear

**Solutions**:
1. Create the database manually (see step 2 above)
2. Or run the backend server - it will create tables automatically
3. Or run the sync script:
   ```bash
   cd backend
   npx ts-node scripts/sync-database.ts
   ```

### PostgreSQL.app - Tables Not Showing

**Issue**: Database exists but no tables visible

**Solutions**:
1. Tables are created automatically when models are loaded
2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
3. Or run the sync script:
   ```bash
   cd backend
   npx ts-node scripts/sync-database.ts
   ```

### Viewing JSONB Fields in PostgreSQL.app

**Issue**: JSONB fields look messy

**Solutions**:
1. PostgreSQL.app should format JSONB automatically
2. If not, you can query specific fields:
   ```sql
   SELECT 
     id,
     specialization,
     address->>'city' as city,
     address->>'state' as state,
     contact->>'email' as email
   FROM doctors;
   ```

---

## Quick Reference

### MongoDB Compass Keyboard Shortcuts
- `Cmd+F` - Find/Filter
- `Cmd+G` - Find next
- `Cmd+Shift+G` - Find previous
- `Cmd+R` - Refresh
- `Cmd+E` - Export

### PostgreSQL.app Keyboard Shortcuts
- `Cmd+T` - New query tab
- `Cmd+Enter` - Run query
- `Cmd+/` - Comment/uncomment
- `Cmd+W` - Close tab
- `Cmd+R` - Refresh

### Connection Strings

**MongoDB:**
```
mongodb://localhost:27017/healthlife
```

**PostgreSQL:**
```
postgresql://localhost:5432/healthlife
```
(Username: your macOS username or 'postgres')

---

## Data Exploration Tips

### MongoDB Compass

1. **Use the Schema Tab**: 
   - Click "Schema" tab to see field types and sample values
   - Helps understand the data structure

2. **Use Aggregations**:
   - Click "Aggregations" tab
   - Build pipeline to analyze data
   - Example: Count records by type

3. **Use Indexes Tab**:
   - See what indexes exist
   - Understand query performance

### PostgreSQL.app

1. **Use Table Info**:
   - Right-click table → "Table Info"
   - See columns, indexes, constraints

2. **Use Explain Plan**:
   - Run query with `EXPLAIN` prefix
   - See how PostgreSQL executes the query

3. **Use Query History**:
   - View previously run queries
   - Reuse successful queries

---

## Best Practices

1. **Don't Edit Production Data Directly**: Always backup first
2. **Use Filters**: Don't load all documents/rows at once
3. **Export Before Major Changes**: Export data before bulk updates
4. **Test Queries**: Test queries on small datasets first
5. **Document Changes**: Keep notes of manual data changes

---

*Happy Database Exploring! 🗄️*

