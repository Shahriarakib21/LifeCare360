const { Sequelize } = require('sequelize');
require('dotenv').config();

// Setup Sequelize
const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'healthlife',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        dialect: 'postgres',
        logging: false // reduced noise
    }
);

async function testSync() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL');

        console.log('🔄 Loading models...');

        // Import models manually to control order and isolation
        // Note: We need to use require because we are in a JS script, but the models are TS.
        // However, we can't easily require TS files without ts-node.
        // So we will assume we run this with ts-node.

        // We will mimic sync-database.ts but sync one by one

        console.log('   Syncing Doctor...');
        const Doctor = (await import('./src/models/postgres/Doctor.model')).default;
        await Doctor.sync({ alter: true });
        console.log('   ✅ Doctor synced');

        console.log('   Syncing Medicine...');
        const Medicine = (await import('./src/models/postgres/Medicine.model')).default;
        await Medicine.sync({ alter: true });
        console.log('   ✅ Medicine synced');

        console.log('   Syncing Order...');
        const Order = (await import('./src/models/postgres/Order.model')).default;
        await Order.sync({ alter: true });
        console.log('   ✅ Order synced');

        console.log('   Syncing Appointment...');
        const Appointment = (await import('./src/models/postgres/Appointment.model')).default;
        await Appointment.sync({ alter: true });
        console.log('   ✅ Appointment synced');

        console.log('   Syncing Rating...');
        const Rating = (await import('./src/models/postgres/Rating.model')).default;
        await Rating.sync({ alter: true });
        console.log('   ✅ Rating synced');

        console.log('   Syncing LabTest...');
        const LabTest = (await import('./src/models/postgres/LabTest.model')).default;
        await LabTest.sync({ alter: true });
        console.log('   ✅ LabTest synced');

        console.log('   Syncing LabRequest...');
        const LabRequest = (await import('./src/models/postgres/LabRequest.model')).default;
        await LabRequest.sync({ alter: true });
        console.log('   ✅ LabRequest synced');

        console.log('   Syncing LabRequestItem...');
        const LabRequestItem = (await import('./src/models/postgres/LabRequestItem.model')).default;
        await LabRequestItem.sync({ alter: true });
        console.log('   ✅ LabRequestItem synced');

        console.log('🎉 ALL SYNCED SUCCESSFULLY');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ SYNC FAILED');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.original) {
            console.error('SQL details:', error.parent ? error.parent.toString() : 'No parent');
            console.error('Original error:', error.original);
        }
        process.exit(1);
    }
}

testSync();
