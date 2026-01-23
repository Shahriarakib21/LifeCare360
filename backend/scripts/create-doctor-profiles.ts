/**
 * Migration script to create Doctor profiles for existing registered doctors
 * Run this script to backfill Doctor records for doctors who registered before
 * the auto-create feature was added.
 * 
 * Usage: npx ts-node backend/scripts/create-doctor-profiles.ts
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import User from '../src/models/mongodb/User.model';
import Doctor from '../src/models/postgres/Doctor.model';
import dotenv from 'dotenv';

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

async function createDoctorProfiles() {
  try {
    // Connect to databases
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    try {
      await sequelize.authenticate();
      console.log('✅ Connected to PostgreSQL');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      process.exit(1);
    }

    // Find all users with role 'doctor'
    const doctors = await User.find({ role: 'doctor' });
    console.log(`\nFound ${doctors.length} registered doctors`);

    let created = 0;
    let skipped = 0;

    for (const user of doctors) {
      // Check if Doctor profile already exists
      const existingDoctor = await Doctor.findOne({
        where: { userId: user._id.toString() },
      });

      if (existingDoctor) {
        console.log(`⏭️  Skipping ${user.email} - profile already exists`);
        skipped++;
        continue;
      }

      // Create Doctor profile
      try {
        await Doctor.create({
          userId: user._id.toString(),
          specialization: 'General Medicine',
          qualifications: [],
          experience: 0,
          licenseNumber: `TEMP-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US',
          },
          contact: {
            phone: user.profile?.phone || '',
            email: user.email,
          },
          availability: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours: {
              start: '09:00',
              end: '17:00',
            },
            timezone: 'America/New_York',
          },
          consultationFee: 100.00,
          languages: ['English'],
          isVerified: false,
          isActive: true,
        });

        console.log(`✅ Created profile for ${user.email}`);
        created++;
      } catch (error: any) {
        console.error(`❌ Failed to create profile for ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${doctors.length}`);

    await mongoose.disconnect();
    await sequelize.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDoctorProfiles();

