# HealthLife Database Schema Analysis

## Overview

HealthLife uses a **dual-database architecture**:
- **MongoDB**: For flexible, document-based data (EHR, Users, Patients)
- **PostgreSQL**: For structured, relational data (Doctors, Appointments, Medicines, Orders, Ratings)

---

## MongoDB Collections

### 1. Users Collection (`users`)

**Purpose**: Authentication and user account management

**Schema**:
```typescript
{
  _id: ObjectId,
  email: String (unique, indexed, lowercase, trimmed),
  password: String (hashed with bcrypt, 12 rounds, select: false),
  role: String (enum: ['patient', 'doctor', 'pharmacy', 'lab', 'hospital', 'insurance'], indexed),
  isEmailVerified: Boolean (default: false),
  mfaEnabled: Boolean (default: false),
  mfaSecret: String (select: false),
  profile: {
    firstName: String (required),
    lastName: String (required),
    phone: String,
    avatar: String,
    dateOfBirth: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `role`

**Methods**:
- `comparePassword(candidatePassword: string): Promise<boolean>`

**Relationships**:
- One-to-one with `Patient` (if role is 'patient')
- Referenced by `EHR.recordedBy`
- Referenced by `Doctor.userId` (PostgreSQL)

---

### 2. Patients Collection (`patients`)

**Purpose**: Patient-specific profile information and preferences

**Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique, indexed),
  emergencyContacts: [{
    name: String (required),
    relationship: String (required),
    phone: String (required),
    email: String
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  preferences: {
    diet: {
      type: String (enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'none'], default: 'none'),
      restrictions: [String]
    },
    language: String (default: 'en'),
    notifications: {
      email: Boolean (default: true),
      sms: Boolean (default: false),
      push: Boolean (default: true)
    }
  },
  consentSettings: {
    shareWithDoctors: Boolean (default: true),
    shareWithLabs: Boolean (default: true),
    shareWithPharmacies: Boolean (default: false),
    shareWithInsurance: Boolean (default: false),
    shareWithHospitals: Boolean (default: true)
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId` (unique)

**Relationships**:
- One-to-one with `User` (via userId)
- One-to-many with `EHR` (via patientId)

---

### 3. EHR Collection (`ehrs`)

**Purpose**: Electronic Health Records - all medical records for patients

**Schema**:
```typescript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patient', required, indexed),
  type: String (enum: [
    'vital', 
    'lab', 
    'diagnosis', 
    'prescription', 
    'procedure', 
    'vaccination', 
    'allergy', 
    'note',
    'lab-test-request'
  ], required, indexed),
  date: Date (required, indexed),
  recordedBy: ObjectId (ref: 'User'), // Doctor/Lab ID
  data: {
    // Vitals
    vitals: {
      bloodPressure: { systolic: Number, diastolic: Number },
      heartRate: Number,
      temperature: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number
    },
    // Lab Results
    labResults: [{
      testName: String (required),
      value: Number (required),
      unit: String (required),
      normalRange: { min: Number (required), max: Number (required) },
      status: String (enum: ['normal', 'low', 'high', 'critical'], default: 'normal')
    }],
    // Diagnosis
    diagnosis: {
      condition: String,
      icd10Code: String,
      severity: String (enum: ['mild', 'moderate', 'severe']),
      notes: String
    },
    // Prescription (supports both old and new format)
    prescription: {
      // Old format (single medication)
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
      // New format (multiple medications)
      medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
      }],
      diagnosis: String,
      notes: String,
      followUpDate: String,
      pdfUrl: String
    },
    // General notes
    notes: String,
    // Attachments
    attachments: [{
      type: String (enum: ['image', 'pdf', 'document']),
      url: String (required),
      name: String (required),
      uploadedAt: Date (default: Date.now)
    }]
  },
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `patientId` + `date` (compound, descending date)
- `patientId` + `type` (compound)
- `data.labResults.testName`

**Relationships**:
- Many-to-one with `Patient` (via patientId)
- Many-to-one with `User` (via recordedBy, optional)

**Key Features**:
- Flexible schema supports multiple record types
- Prescription format supports both single and multiple medications (backward compatible)
- Attachments support for PDFs, images, documents
- Tags for categorization

---

## PostgreSQL Tables

### 1. Doctors Table (`doctors`)

**Purpose**: Doctor profiles and professional information

**Schema**:
```sql
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  "userId" VARCHAR UNIQUE NOT NULL,  -- MongoDB User ID
  specialization VARCHAR NOT NULL,
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  experience INTEGER NOT NULL,
  "licenseNumber" VARCHAR UNIQUE NOT NULL,
  "licenseExpiry" DATE NOT NULL,
  hospital VARCHAR,
  clinic VARCHAR,
  address JSONB NOT NULL,  -- {street, city, state, zipCode, country}
  contact JSONB NOT NULL,  -- {phone, email, website?}
  availability JSONB NOT NULL,  -- {days: [], hours: {start, end}, timezone}
  "consultationFee" DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  "totalReviews" INTEGER DEFAULT 0,
  bio TEXT,
  "profileImage" VARCHAR,
  languages TEXT[] NOT NULL DEFAULT '{}',
  "isVerified" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `userId` (unique)
- `specialization`
- `isVerified` + `isActive` (compound)
- `address` (for location-based searches)

**Relationships**:
- One-to-one with `User` (via userId, MongoDB)
- One-to-many with `Appointment` (via doctorId)
- One-to-many with `Rating` (via doctorId)

**Key Features**:
- JSONB fields for flexible nested data (address, contact, availability)
- Rating system with total reviews count
- Verification status for doctor credentials
- Active/inactive status for account management

---

### 2. Appointments Table (`appointments`)

**Purpose**: Appointment scheduling and management

**Schema**:
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  "patientId" VARCHAR NOT NULL,  -- MongoDB Patient ID
  "doctorId" INTEGER NOT NULL REFERENCES doctors(id),
  date DATE NOT NULL,
  time VARCHAR NOT NULL,  -- 'HH:mm' format
  type VARCHAR NOT NULL DEFAULT 'in-person',  -- 'in-person' | 'video' | 'phone'
  status VARCHAR NOT NULL DEFAULT 'scheduled',  -- 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  duration INTEGER NOT NULL DEFAULT 30,  -- minutes
  notes TEXT,
  "meetingLink" VARCHAR,  -- For video consultations
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `patientId`
- `doctorId`
- `date` + `time` (compound)
- `status`
- `doctorId` + `date` + `time` (compound, for availability checks)

**Relationships**:
- Many-to-one with `Patient` (via patientId, MongoDB)
- Many-to-one with `Doctor` (via doctorId)
- One-to-one with `Rating` (via appointmentId)

**Key Features**:
- Supports multiple appointment types (in-person, video, phone)
- Status tracking throughout appointment lifecycle
- Meeting link for video consultations
- Duration tracking for billing/analytics

---

### 3. Ratings Table (`ratings`)

**Purpose**: Patient ratings and reviews for doctors

**Schema**:
```sql
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  "appointmentId" INTEGER NOT NULL UNIQUE REFERENCES appointments(id),
  "doctorId" INTEGER NOT NULL REFERENCES doctors(id),
  "patientId" VARCHAR NOT NULL,  -- MongoDB Patient ID
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `appointmentId` (unique - one rating per appointment)
- `doctorId`
- `patientId`

**Relationships**:
- One-to-one with `Appointment` (via appointmentId)
- Many-to-one with `Doctor` (via doctorId)
- Many-to-one with `Patient` (via patientId, MongoDB)

**Key Features**:
- One rating per appointment (enforced by unique constraint)
- Rating scale: 1-5 stars
- Optional comment field
- Used to calculate doctor's average rating

---

### 4. Medicines Table (`medicines`)

**Purpose**: Medicine catalog and inventory

**Schema**:
```sql
CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,  -- Brand name
  "genericName" VARCHAR NOT NULL,
  manufacturer VARCHAR NOT NULL,
  category VARCHAR NOT NULL,  -- e.g., 'antibiotic', 'pain-reliever'
  "dosageForm" VARCHAR NOT NULL,  -- 'tablet', 'capsule', 'syrup', etc.
  strength VARCHAR NOT NULL,  -- '500mg', '10ml', etc.
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  indications TEXT[] NOT NULL DEFAULT '{}',  -- What it's used for
  "sideEffects" TEXT[] NOT NULL DEFAULT '{}',
  contraindications TEXT[] NOT NULL DEFAULT '{}',
  interactions TEXT[] NOT NULL DEFAULT '{}',  -- Drug interactions
  "storageConditions" VARCHAR NOT NULL,
  "expiryDate" DATE,
  stock INTEGER NOT NULL DEFAULT 0,
  "isPrescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "seoKeywords" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `name`
- `genericName`
- `category`
- `isActive`
- Note: Full-text search index available (requires pg_trgm extension)

**Relationships**:
- Referenced by `Order.items[].medicineId`

**Key Features**:
- Comprehensive medicine information
- Drug interaction tracking
- SEO optimization with keywords
- Stock management
- Prescription requirement flag

---

### 5. Orders Table (`orders`)

**Purpose**: Pharmacy orders and transactions

**Schema**:
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  "patientId" VARCHAR NOT NULL,  -- MongoDB Patient ID
  items JSONB NOT NULL,  -- [{medicineId, quantity, price, name}]
  "totalAmount" DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  "shippingAddress" JSONB NOT NULL,  -- {street, city, state, zipCode, country}
  "paymentMethod" VARCHAR NOT NULL,  -- 'card' | 'paypal' | 'cash'
  "paymentStatus" VARCHAR NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed' | 'refunded'
  "trackingNumber" VARCHAR,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `patientId`
- `status`
- `paymentStatus`
- `createdAt`

**Relationships**:
- Many-to-one with `Patient` (via patientId, MongoDB)
- References `Medicine` (via items[].medicineId)

**Key Features**:
- JSONB items array for flexible order structure
- Order status tracking
- Payment status tracking
- Shipping address storage
- Tracking number for deliveries

---

## Database Relationships Diagram

```
MongoDB (Document Store)
├── users
│   ├── _id (ObjectId)
│   └── role: 'patient' | 'doctor' | ...
│
├── patients
│   ├── _id (ObjectId)
│   ├── userId → users._id (1:1)
│   └── consentSettings (data sharing controls)
│
└── ehrs
    ├── _id (ObjectId)
    ├── patientId → patients._id (N:1)
    ├── recordedBy → users._id (N:1, optional)
    └── data (flexible schema for different record types)

PostgreSQL (Relational)
├── doctors
│   ├── id (SERIAL)
│   ├── userId → users._id (MongoDB) (1:1)
│   └── rating, totalReviews (calculated from ratings)
│
├── appointments
│   ├── id (SERIAL)
│   ├── patientId → patients._id (MongoDB) (N:1)
│   ├── doctorId → doctors.id (N:1)
│   └── status, type, meetingLink
│
├── ratings
│   ├── id (SERIAL)
│   ├── appointmentId → appointments.id (1:1, unique)
│   ├── doctorId → doctors.id (N:1)
│   └── patientId → patients._id (MongoDB) (N:1)
│
├── medicines
│   ├── id (SERIAL)
│   └── name, genericName, interactions, etc.
│
└── orders
    ├── id (SERIAL)
    ├── patientId → patients._id (MongoDB) (N:1)
    └── items[].medicineId → medicines.id (N:M)
```

---

## Data Flow Patterns

### Cross-Database Relationships

1. **User → Doctor**:
   - MongoDB `users._id` → PostgreSQL `doctors.userId` (string)
   - No foreign key constraint (cross-database)
   - Application-level validation required

2. **Patient → Appointment**:
   - MongoDB `patients._id` → PostgreSQL `appointments.patientId` (string)
   - No foreign key constraint
   - Application-level validation required

3. **Appointment → Rating**:
   - PostgreSQL `appointments.id` → PostgreSQL `ratings.appointmentId`
   - Foreign key constraint enforced
   - Unique constraint ensures one rating per appointment

---

## Indexing Strategy

### MongoDB Indexes

**Users**:
- `email` (unique) - Fast login lookups
- `role` - Role-based queries

**Patients**:
- `userId` (unique) - Fast user-to-patient lookups

**EHR**:
- `patientId` + `date` (compound, descending) - Patient history queries
- `patientId` + `type` (compound) - Filtered record queries
- `data.labResults.testName` - Lab test searches

### PostgreSQL Indexes

**Doctors**:
- `userId` (unique) - User-to-doctor lookups
- `specialization` - Search by specialty
- `isVerified` + `isActive` (compound) - Active doctor queries
- `address` (JSONB) - Location-based searches

**Appointments**:
- `patientId` - Patient appointment history
- `doctorId` - Doctor's schedule
- `date` + `time` (compound) - Time-based queries
- `status` - Status filtering
- `doctorId` + `date` + `time` (compound) - Availability checks

**Ratings**:
- `appointmentId` (unique) - One rating per appointment
- `doctorId` - Doctor rating aggregation
- `patientId` - Patient rating history

**Medicines**:
- `name` - Brand name search
- `genericName` - Generic name search
- `category` - Category filtering
- `isActive` - Active medicine queries

**Orders**:
- `patientId` - Patient order history
- `status` - Status filtering
- `paymentStatus` - Payment queries
- `createdAt` - Time-based queries

---

## Data Types & Constraints

### MongoDB
- **Flexible Schema**: Documents can have varying structures
- **Embedded Documents**: Nested objects for related data (e.g., vitals, prescription)
- **Arrays**: Support for multiple values (e.g., medications, lab results)
- **References**: ObjectId references to other collections

### PostgreSQL
- **Strict Schema**: Defined columns with types
- **JSONB**: Flexible nested data (address, contact, availability, items)
- **Arrays**: PostgreSQL arrays for lists (qualifications, languages, indications)
- **ENUMs**: Restricted values (appointment type, status, payment method)
- **Foreign Keys**: Referential integrity for same-database relationships
- **Check Constraints**: Data validation (rating 1-5)
- **Unique Constraints**: Prevent duplicates (userId, licenseNumber, appointmentId)

---

## Query Patterns

### Common MongoDB Queries

**Get patient EHR records**:
```javascript
db.ehrs.find({ 
  patientId: ObjectId("..."),
  type: "prescription",
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: -1 })
```

**Get user with password**:
```javascript
db.users.findOne({ email: "..." }).select("+password")
```

**Get patient by user ID**:
```javascript
db.patients.findOne({ userId: ObjectId("...") })
```

### Common PostgreSQL Queries

**Search doctors**:
```sql
SELECT * FROM doctors 
WHERE specialization ILIKE '%cardiology%'
  AND isActive = true
  AND address::text ILIKE '%New York%'
ORDER BY rating DESC;
```

**Get doctor appointments**:
```sql
SELECT a.*, d.specialization 
FROM appointments a
JOIN doctors d ON a."doctorId" = d.id
WHERE a."doctorId" = 1
  AND a.date >= CURRENT_DATE
ORDER BY a.date, a.time;
```

**Calculate doctor rating**:
```sql
SELECT 
  d.id,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_reviews
FROM doctors d
LEFT JOIN ratings r ON d.id = r."doctorId"
GROUP BY d.id;
```

---

## Data Integrity Considerations

### Cross-Database Integrity
- **No Foreign Keys**: MongoDB and PostgreSQL cannot enforce cross-database foreign keys
- **Application-Level Validation**: Must validate references in application code
- **Cascade Deletes**: Must be handled manually in application code

### Same-Database Integrity
- **PostgreSQL Foreign Keys**: Enforced for same-database relationships
- **Unique Constraints**: Prevent duplicates (userId, appointmentId)
- **Check Constraints**: Validate data ranges (rating 1-5)

### Data Consistency
- **Transactions**: PostgreSQL supports ACID transactions
- **MongoDB**: Single-document operations are atomic
- **Cross-Database**: No native transaction support - must use application-level patterns

---

## Current Database Status (from DATABASE_ACCESS.md)

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

---

## Recommendations

### Performance
1. **Add More Indexes**: Consider indexes for frequently queried fields
2. **Query Optimization**: Review slow queries and optimize
3. **Connection Pooling**: Already configured in Sequelize
4. **Caching**: Consider Redis for frequently accessed data

### Data Integrity
1. **Validation**: Add application-level validation for cross-database references
2. **Audit Logging**: Track data changes for compliance
3. **Backup Strategy**: Regular backups for both databases
4. **Data Migration**: Plan for schema changes

### Scalability
1. **Read Replicas**: Consider for read-heavy operations
2. **Sharding**: MongoDB sharding for large datasets
3. **Partitioning**: PostgreSQL table partitioning for large tables
4. **Archiving**: Archive old EHR records to separate collections/tables

---

*Last Updated: 2024*
*Schema Version: 1.0*

