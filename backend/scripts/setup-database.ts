/**
 * Complete Database Setup Script
 * 
 * This script:
 * 1. Syncs PostgreSQL tables
 * 2. Creates sample users (patients, doctors)
 * 3. Creates patient profiles
 * 4. Creates doctor profiles
 * 5. Creates sample medicines
 * 6. Creates sample EHR records
 * 7. Creates sample appointments
 * 
 * Usage: npx ts-node scripts/setup-database.ts
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import User from '../src/models/mongodb/User.model';
import Patient from '../src/models/mongodb/Patient.model';
import EHR from '../src/models/mongodb/EHR.model';
import Doctor from '../src/models/postgres/Doctor.model';
import Medicine from '../src/models/postgres/Medicine.model';
import Appointment from '../src/models/postgres/Appointment.model';
import Order from '../src/models/postgres/Order.model';
import Rating from '../src/models/postgres/Rating.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'healthlife',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
  }
);

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Connect to databases
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL\n');

    // Step 1: Sync PostgreSQL tables
    console.log('📦 Syncing PostgreSQL tables...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ PostgreSQL tables synced\n');

    // Step 2: Create sample users
    console.log('👥 Creating sample users...');
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️  ${existingUsers} users already exist. Skipping user creation.`);
    } else {
      // Create patient users
      const patient1 = await User.create({
        email: 'patient1@healthlife.com',
        password: 'password123',
        role: 'patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-0101',
          dateOfBirth: new Date('1990-05-15'),
        },
      });

      const patient2 = await User.create({
        email: 'patient2@healthlife.com',
        password: 'password123',
        role: 'patient',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1-555-0102',
          dateOfBirth: new Date('1985-08-20'),
        },
      });

      // Create doctor users
      const doctor1 = await User.create({
        email: 'doctor1@healthlife.com',
        password: 'password123',
        role: 'doctor',
        profile: {
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          phone: '+1-555-0201',
        },
      });

      const doctor2 = await User.create({
        email: 'doctor2@healthlife.com',
        password: 'password123',
        role: 'doctor',
        profile: {
          firstName: 'Dr. Michael',
          lastName: 'Chen',
          phone: '+1-555-0202',
        },
      });

      console.log('✅ Created 4 users (2 patients, 2 doctors)\n');

      // Step 3: Create patient profiles
      console.log('🏥 Creating patient profiles...');
      
      await Patient.create({
        userId: patient1._id,
        emergencyContacts: [
          {
            name: 'Mary Doe',
            relationship: 'Spouse',
            phone: '+1-555-0103',
            email: 'mary@example.com',
          },
        ],
        insurance: {
          provider: 'BlueCross BlueShield',
          policyNumber: 'BC123456789',
          groupNumber: 'GRP001',
          expiryDate: new Date('2025-12-31'),
        },
        preferences: {
          diet: { type: 'none' },
          language: 'en',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
        consentSettings: {
          shareWithDoctors: true,
          shareWithLabs: true,
          shareWithPharmacies: false,
          shareWithInsurance: false,
          shareWithHospitals: true,
        },
      });

      await Patient.create({
        userId: patient2._id,
        emergencyContacts: [
          {
            name: 'Robert Smith',
            relationship: 'Brother',
            phone: '+1-555-0104',
          },
        ],
        insurance: {
          provider: 'Aetna',
          policyNumber: 'AET987654321',
          expiryDate: new Date('2025-06-30'),
        },
        preferences: {
          diet: { type: 'vegetarian', restrictions: ['no dairy'] },
          language: 'en',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
        consentSettings: {
          shareWithDoctors: true,
          shareWithLabs: true,
          shareWithPharmacies: true,
          shareWithInsurance: true,
          shareWithHospitals: true,
        },
      });

      console.log('✅ Created 2 patient profiles\n');

      // Step 4: Create doctor profiles
      console.log('👨‍⚕️ Creating doctor profiles...');
      
      const doctorProfile1 = await Doctor.create({
        userId: doctor1._id.toString(),
        specialization: 'Cardiology',
        qualifications: ['MD', 'FACC'],
        experience: 15,
        licenseNumber: 'MD-LIC-001',
        licenseExpiry: new Date('2026-12-31'),
        hospital: 'City General Hospital',
        clinic: 'Heart Care Clinic',
        address: {
          street: '123 Medical Center Dr',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        contact: {
          phone: '+1-555-0201',
          email: 'doctor1@healthlife.com',
          website: 'https://heartcare.example.com',
        },
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          hours: {
            start: '09:00',
            end: '17:00',
          },
          timezone: 'America/New_York',
        },
        consultationFee: 200.00,
        rating: 4.8,
        totalReviews: 25,
        bio: 'Board-certified cardiologist with 15 years of experience in treating heart conditions.',
        languages: ['English', 'Spanish'],
        isVerified: true,
        isActive: true,
      });

      const doctorProfile2 = await Doctor.create({
        userId: doctor2._id.toString(),
        specialization: 'General Medicine',
        qualifications: ['MD', 'MPH'],
        experience: 10,
        licenseNumber: 'MD-LIC-002',
        licenseExpiry: new Date('2026-06-30'),
        clinic: 'Family Health Center',
        address: {
          street: '456 Health Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'US',
        },
        contact: {
          phone: '+1-555-0202',
          email: 'doctor2@healthlife.com',
        },
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday'],
          hours: {
            start: '10:00',
            end: '18:00',
          },
          timezone: 'America/Los_Angeles',
        },
        consultationFee: 150.00,
        rating: 4.5,
        totalReviews: 18,
        bio: 'Primary care physician specializing in preventive medicine and chronic disease management.',
        languages: ['English', 'Mandarin'],
        isVerified: true,
        isActive: true,
      });

      console.log('✅ Created 2 doctor profiles\n');

      // Step 5: Create sample medicines
      console.log('💊 Creating sample medicines...');
      
      const medicines = [
        {
          name: 'Paracetamol',
          genericName: 'Acetaminophen',
          manufacturer: 'Generic Pharma',
          category: 'pain-reliever',
          dosageForm: 'tablet',
          strength: '500mg',
          price: 5.99,
          description: 'Pain reliever and fever reducer',
          indications: ['headache', 'fever', 'muscle pain'],
          sideEffects: ['nausea', 'stomach upset'],
          contraindications: ['liver disease'],
          interactions: ['alcohol'],
          storageConditions: 'Store at room temperature',
          stock: 1000,
          isPrescriptionRequired: false,
          seoKeywords: ['paracetamol', 'acetaminophen', 'pain relief', 'fever'],
        },
        {
          name: 'Ibuprofen',
          genericName: 'Ibuprofen',
          manufacturer: 'MedCorp',
          category: 'pain-reliever',
          dosageForm: 'tablet',
          strength: '400mg',
          price: 8.99,
          description: 'Nonsteroidal anti-inflammatory drug',
          indications: ['pain', 'inflammation', 'fever'],
          sideEffects: ['stomach upset', 'dizziness'],
          contraindications: ['stomach ulcers', 'kidney disease'],
          interactions: ['aspirin', 'blood thinners'],
          storageConditions: 'Store at room temperature',
          stock: 800,
          isPrescriptionRequired: false,
          seoKeywords: ['ibuprofen', 'pain relief', 'anti-inflammatory'],
        },
        {
          name: 'Amoxicillin',
          genericName: 'Amoxicillin',
          manufacturer: 'Antibio Inc',
          category: 'antibiotic',
          dosageForm: 'capsule',
          strength: '500mg',
          price: 15.99,
          description: 'Broad-spectrum antibiotic',
          indications: ['bacterial infections', 'pneumonia', 'ear infections'],
          sideEffects: ['diarrhea', 'nausea', 'rash'],
          contraindications: ['penicillin allergy'],
          interactions: ['oral contraceptives'],
          storageConditions: 'Store in refrigerator',
          stock: 500,
          isPrescriptionRequired: true,
          seoKeywords: ['amoxicillin', 'antibiotic', 'infection'],
        },
        {
          name: 'Metformin',
          genericName: 'Metformin',
          manufacturer: 'Diabetes Care',
          category: 'diabetes',
          dosageForm: 'tablet',
          strength: '500mg',
          price: 12.99,
          description: 'Oral medication for type 2 diabetes',
          indications: ['type 2 diabetes', 'insulin resistance'],
          sideEffects: ['nausea', 'diarrhea', 'stomach upset'],
          contraindications: ['kidney disease', 'liver disease'],
          interactions: ['alcohol'],
          storageConditions: 'Store at room temperature',
          stock: 600,
          isPrescriptionRequired: true,
          seoKeywords: ['metformin', 'diabetes', 'blood sugar'],
        },
      ];

      const createdMedicines = await Medicine.bulkCreate(medicines);
      console.log(`✅ Created ${createdMedicines.length} medicines\n`);

      // Step 6: Create sample EHR records
      console.log('📋 Creating sample EHR records...');
      
      const patient1Profile = await Patient.findOne({ userId: patient1._id });
      const patient2Profile = await Patient.findOne({ userId: patient2._id });

      if (patient1Profile) {
        // Vital signs
        await EHR.create({
          patientId: patient1Profile._id,
          type: 'vital',
          date: new Date('2024-12-01'),
          recordedBy: doctor1._id,
          data: {
            vitals: {
              bloodPressure: { systolic: 120, diastolic: 80 },
              heartRate: 72,
              temperature: 98.6,
              oxygenSaturation: 98,
              weight: 75,
              height: 175,
              bmi: 24.5,
            },
          },
        });

        // Lab results
        await EHR.create({
          patientId: patient1Profile._id,
          type: 'lab',
          date: new Date('2024-12-05'),
          recordedBy: doctor1._id,
          data: {
            labResults: [
              {
                testName: 'Blood Glucose',
                value: 95,
                unit: 'mg/dL',
                normalRange: { min: 70, max: 100 },
                status: 'normal',
              },
              {
                testName: 'Cholesterol',
                value: 180,
                unit: 'mg/dL',
                normalRange: { min: 0, max: 200 },
                status: 'normal',
              },
            ],
          },
        });

        // Prescription
        await EHR.create({
          patientId: patient1Profile._id,
          type: 'prescription',
          date: new Date('2024-12-10'),
          recordedBy: doctor1._id,
          data: {
            prescription: {
              medications: [
                {
                  name: 'Metformin',
                  dosage: '500mg',
                  frequency: 'Twice daily',
                  duration: '30 days',
                  instructions: 'Take with meals',
                },
              ],
              diagnosis: 'Type 2 Diabetes',
              notes: 'Monitor blood sugar levels regularly',
              followUpDate: '2025-01-10',
            },
          },
        });
      }

      if (patient2Profile) {
        // Diagnosis
        await EHR.create({
          patientId: patient2Profile._id,
          type: 'diagnosis',
          date: new Date('2024-12-08'),
          recordedBy: doctor2._id,
          data: {
            diagnosis: {
              condition: 'Hypertension',
              icd10Code: 'I10',
              severity: 'mild',
              notes: 'Blood pressure slightly elevated, lifestyle modifications recommended',
            },
          },
        });

        // Prescription
        await EHR.create({
          patientId: patient2Profile._id,
          type: 'prescription',
          date: new Date('2024-12-08'),
          recordedBy: doctor2._id,
          data: {
            prescription: {
              medications: [
                {
                  name: 'Ibuprofen',
                  dosage: '400mg',
                  frequency: 'As needed',
                  duration: '7 days',
                  instructions: 'Take with food to reduce stomach upset',
                },
              ],
              diagnosis: 'Muscle Pain',
              notes: 'Use only when pain occurs',
            },
          },
        });
      }

      console.log('✅ Created sample EHR records\n');

      // Step 7: Create sample appointments
      console.log('📅 Creating sample appointments...');
      
      if (patient1Profile && patient2Profile) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        await Appointment.create({
          patientId: patient1Profile._id.toString(),
          doctorId: doctorProfile1.id,
          date: tomorrow,
          time: '10:00',
          type: 'in-person',
          status: 'confirmed',
          duration: 30,
          notes: 'Follow-up for diabetes management',
        });

        await Appointment.create({
          patientId: patient2Profile._id.toString(),
          doctorId: doctorProfile2.id,
          date: nextWeek,
          time: '14:00',
          type: 'video',
          status: 'scheduled',
          duration: 30,
          meetingLink: 'https://meet.example.com/room123',
        });

        console.log('✅ Created 2 sample appointments\n');
      }

      console.log('✅ Database setup complete!\n');
      console.log('📊 Summary:');
      console.log('   - Users: 4 (2 patients, 2 doctors)');
      console.log('   - Patient Profiles: 2');
      console.log('   - Doctor Profiles: 2');
      console.log('   - Medicines: 4');
      console.log('   - EHR Records: 5');
      console.log('   - Appointments: 2');
      console.log('\n🔑 Test Credentials:');
      console.log('   Patient 1: patient1@healthlife.com / password123');
      console.log('   Patient 2: patient2@healthlife.com / password123');
      console.log('   Doctor 1: doctor1@healthlife.com / password123');
      console.log('   Doctor 2: doctor2@healthlife.com / password123');
    }

    await mongoose.disconnect();
    await sequelize.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDatabase();

