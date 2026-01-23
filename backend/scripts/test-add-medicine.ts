import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../src/config/database';
import Medicine from '../src/models/postgres/Medicine.model';

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Postgres');

        const testMedicine = {
            name: 'Test Medicine ' + Date.now(),
            genericName: 'Test Generic',
            manufacturer: 'Test Manufacturer',
            category: 'Test Category',
            dosageForm: 'Tablet',
            strength: '500mg',
            price: 10.50,
            storageConditions: 'Room Temperature',
            stock: 100,
            isActive: true,
            indications: ['Test Indication'],
            sideEffects: [],
            contraindications: [],
            interactions: [],
            seoKeywords: []
        };

        const created = await Medicine.create(testMedicine);
        console.log('✅ Medicine Created:', created.toJSON());
    } catch (error: any) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

test();
