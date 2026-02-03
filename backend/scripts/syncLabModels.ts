import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../src/config/database';
import LabTest from '../src/models/postgres/LabTest.model';
import LabRequest from '../src/models/postgres/LabRequest.model';
import LabRequestItem from '../src/models/postgres/LabRequestItem.model';

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Postgres Connected');

        // LabRequestItem defines associations when imported

        console.log('Syncing Lab models...');
        // Sync LabTest first, then LabRequest, then LabRequestItem
        await LabTest.sync({ alter: true });
        await LabRequest.sync({ force: true });
        await LabRequestItem.sync({ force: true });

        console.log('Lab models synced successfully');

        // Final associations check
        console.log('Registered models:', Object.keys(sequelize.models));

    } catch (err) {
        console.error('SYNC FAILED:', err);
    } finally {
        await sequelize.close();
    }
}

run();
