/**
 * Database Sync Script
 * 
 * This script creates all PostgreSQL tables based on Sequelize models.
 * Run this before running the create-doctor-profiles migration script.
 */

import dotenv from 'dotenv';

dotenv.config();

// Import sequelize from config (same instance used by models)
import { sequelize } from '../src/config/database';
import Rating from '../src/models/postgres/Rating.model';

async function syncDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Import all models (order matters - Doctor before Appointment)
    // This ensures the models are initialized and registered with Sequelize
    console.log('\n📦 Loading models...');
    const Doctor = (await import('../src/models/postgres/Doctor.model')).default;
    const Medicine = (await import('../src/models/postgres/Medicine.model')).default;
    const Order = (await import('../src/models/postgres/Order.model')).default;
    const Appointment = (await import('../src/models/postgres/Appointment.model')).default;
    const Rating = (await import('../src/models/postgres/Rating.model')).default;
    const LabTest = (await import('../src/models/postgres/LabTest.model')).default;
    const LabRequest = (await import('../src/models/postgres/LabRequest.model')).default;
    const LabRequestItem = (await import('../src/models/postgres/LabRequestItem.model')).default;
    console.log('✅ All models loaded');

    // Verify models are registered
    console.log(`\n📋 Registered models: ${Object.keys(sequelize.models).join(', ')}`);

    // Sync all models (create tables)
    console.log('\n🔄 Syncing database schema...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database schema synced successfully');

    // List created tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    (results as Array<{ table_name: string }>).forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✅ Database setup complete!');
    console.log('   You can now run: npx ts-node scripts/create-doctor-profiles.ts');

  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncDatabase();

