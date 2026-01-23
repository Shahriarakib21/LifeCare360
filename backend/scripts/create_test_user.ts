
import mongoose from 'mongoose';
import User from '../src/models/mongodb/User.model';
import Patient from '../src/models/mongodb/Patient.model';
import dotenv from 'dotenv';
import path from 'path';

// Force load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';

const createTestUser = async () => {
    try {
        console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const email = 'patient1@healthlife.com';
        const password = 'password123';
        const firstName = 'John';
        const lastName = 'Doe';
        const role = 'patient';
        const phone = '555-0101';

        console.log(`Checking if user ${email} exists...`);
        let user = await User.findOne({ email });

        if (user) {
            console.log('User exists. Updating password...');
            user.password = password;
            await user.save();
            console.log('Password updated.');
        } else {
            console.log('Creating new user...');
            user = await User.create({
                email,
                password,
                role,
                isEmailVerified: true,
                profile: {
                    firstName,
                    lastName,
                    phone,
                },
            });
            console.log(`User created with ID: ${user._id}`);
        }

        // Check for patient profile
        const patient = await Patient.findOne({ userId: user._id });
        if (!patient) {
            console.log('Creating patient profile...');
            await Patient.create({
                userId: user._id,
                emergencyContacts: [],
                insurance: {
                    provider: 'HealthLife Insurance',
                    policyNumber: 'HL-123456789',
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
            console.log('Patient profile created.');
        } else {
            console.log('Patient profile already exists.');
        }

        console.log('✅ Setup success! You can now login.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

createTestUser();
