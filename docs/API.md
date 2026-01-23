# HealthLife API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "patient",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "mfaCode": "123456" // Optional if MFA enabled
}
```

### Patient Routes

#### Get Profile
```http
GET /patients/profile
Authorization: Bearer <token>
```

#### Get EHR Records
```http
GET /patients/ehr?type=vital&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50
Authorization: Bearer <token>
```

#### Upload Report
```http
POST /patients/reports/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <file>,
  "fileType": "pdf",
  "fileName": "lab-report.pdf"
}
```

#### Get Health Trends
```http
GET /patients/trends?metric=heartRate&days=30
Authorization: Bearer <token>
```

### Doctor Routes

#### Get Patients List
```http
GET /doctors/patients?search=john&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Patient History
```http
GET /doctors/patients/:patientId/history?type=lab&startDate=2024-01-01
Authorization: Bearer <token>
```

#### Create Prescription
```http
POST /doctors/prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient_id",
  "medication": "Paracetamol",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "instructions": "Take with food"
}
```

### Public Routes

#### Search Doctors
```http
GET /public/doctors/search?specialization=cardiology&city=New York&rating=4.5&page=1&limit=20
```

#### Search Medicines
```http
GET /public/medicines/search?q=paracetamol&category=pain-reliever&page=1&limit=20
```

### AI Routes

#### Analyze Health Trends
```http
POST /ai/analyze-trends
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient_id",
  "metrics": ["heartRate", "bloodPressure"],
  "days": 30
}
```

#### Detect Anomalies
```http
POST /ai/detect-anomalies
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient_id"
}
```

#### Chat with AI
```http
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are the symptoms of flu?",
  "patientId": "patient_id",
  "context": {}
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "stack": "Error stack (development only)"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

