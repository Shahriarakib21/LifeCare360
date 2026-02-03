import mongoose from 'mongoose';
import User from '../src/models/mongodb/User.model';
import Patient from '../src/models/mongodb/Patient.model';
import EHR from '../src/models/mongodb/EHR.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find or create a test patient
        let user = await User.findOne({ role: 'patient' });
        if (!user) {
            console.log('No patient found, creating one...');
            user = await User.create({
                email: 'patient@example.com',
                password: 'Patient@123456',
                role: 'patient',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '+1234567890',
                    dateOfBirth: new Date('1990-01-01')
                },
                isActive: true,
                isEmailVerified: true
            });

            await Patient.create({
                userId: user._id,
                emergencyContacts: [{
                    name: 'Jane Doe',
                    relationship: 'Spouse',
                    phone: '+1234567891'
                }],
                preferences: {
                    diet: { type: 'none' },
                    language: 'en',
                    notifications: { email: true, sms: false, push: true }
                },
                consentSettings: {
                    shareWithDoctors: true,
                    shareWithLabs: true,
                    shareWithPharmacies: true,
                    shareWithInsurance: true,
                    shareWithHospitals: true
                }
            });
        }

        console.log(`Using patient: ${user.email} (ID: ${user._id})`);

        // 2. Clear old EHR data for this patient to have a clean trend
        await EHR.deleteMany({ patientId: user._id });
        console.log('Cleared existing EHR records for this patient');

        // 3. Seed data for the last 7 days
        const days = 7;
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Add Vitals
            await EHR.create({
                patientId: user._id,
                type: 'vital',
                date: date,
                data: {
                    vitals: {
                        bloodPressure: {
                            systolic: 110 + Math.floor(Math.random() * 20),
                            diastolic: 70 + Math.floor(Math.random() * 15)
                        },
                        heartRate: 65 + Math.floor(Math.random() * 20),
                        weight: 75 + (Math.random() * 2 - 1), // slight fluctuation
                        temperature: 36.5 + (Math.random() * 0.5),
                        height: 175,
                        bmi: 24.5
                    }
                }
            });

            // Add Blood Sugar (Lab Result)
            await EHR.create({
                patientId: user._id,
                type: 'lab',
                date: date,
                data: {
                    labResults: [{
                        testName: 'Blood Sugar',
                        value: 90 + Math.floor(Math.random() * 40),
                        unit: 'mg/dL',
                        normalRange: { min: 70, max: 130 },
                        status: 'normal'
                    }]
                }
            });

            // Add Hemoglobin (Lab Result) - maybe once or twice in the week
            if (i % 3 === 0) {
                await EHR.create({
                    patientId: user._id,
                    type: 'lab',
                    date: date,
                    data: {
                        labResults: [{
                            testName: 'Hemoglobin',
                            value: 13 + (Math.random() * 2),
                            unit: 'g/dL',
                            normalRange: { min: 12, max: 16 },
                            status: 'normal'
                        }]
                    }
                });
            }
        }

        console.log('✅ Successfully seeded dummy patient data');
        console.log('Login credentials:');
        console.log('Email: patient@example.com (or existing patient email)');
        console.log('Password: Patient@123456 (if new)');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
