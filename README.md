# LifeCare360 - Complete Healthcare Management Platform

LifeCare360 is a comprehensive, secure, and AI-powered healthcare ecosystem that connects patients, doctors, pharmacies, and laboratories through a unified digital platform.

## 🚀 Features

### For Patients
- **Lifetime EHR**: Access your complete medical history from birth.
- **AI Insights**: Receive personalized health analytics and trend predictions.
- **Direct Connectivity**: Book appointments, order medicines, and view lab results in one place.
- **Secure Data**: Patient-controlled data sharing and bank-level encryption.

### For Doctors
- **Digital Prescriptions**: Create and manage prescriptions efficiently.
- **Patient Dashboard**: View comprehensive medical histories before consultations.
- **Telemedicine**: Integrated video consultations and scheduling.

### For Pharmacies
- **Inventory Management**: Real-time stock tracking and refill notifications.
- **Online Medicine Shop**: Deliver medicines directly to patients' doorsteps.

### For Laboratories
- **Lab Request Tracking**: Manage test orders and upload results securely.
- **Accreditation Support**: Tools for maintaining high diagnostic standards.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express, Socket.io
- **Database**: 
  - **MongoDB**: For EHR, Notifications, and Patient Data
  - **PostgreSQL (Sequelize)**: For Medicine Inventory and Orders
- **Authentication**: JWT, bcrypt

## 📦 Project Structure

```text
LifeCare360/
├── frontend/             # Next.js Application
│   ├── src/
│   │   ├── app/         # App Data & Routes
│   │   ├── components/  # UI Components
│   │   └── store/       # State Management (Zustand)
├── backend/              # Express API
│   ├── src/
│   │   ├── controllers/ # Business Logic
│   │   ├── models/      # Database Schemas
│   │   ├── routes/      # API Endpoints
│   │   └── utils/       # Helper Functions
│   └── scripts/          # Database Migration & Seed Scripts
└── README.md
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- PostgreSQL

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`.
4. Run migrations/seeds (if applicable).
5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security
- HIPAA & GDPR Compliant
- AES-256 Encryption
- Multi-Factor Authentication

## 📄 License
This project is licensed under the MIT License.
