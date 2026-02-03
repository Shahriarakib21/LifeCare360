const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'healthlife',
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check doctors table schema
        const docRes = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'doctors'
      AND column_name IN ('qualifications', 'languages', 'specialization');
    `);

        console.log('\n📊 Doctor Table Columns:');
        docRes.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type} (${row.udt_name})`);
        });

        if (docRes.rows.length === 3) {
            console.log('\n✅ Doctor table schema looks correct!');
        } else {
            console.log(`\n❌ Doctor table missing columns (found ${docRes.rows.length}/3)`);
        }

        // Check medicines table schema
        const medRes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'medicines'
        AND column_name IN ('indications', 'sideEffects');
      `);

        console.log('\n📊 Medicine Table Columns (sample):');
        medRes.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        // Check lab_requests table
        const labRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'lab_requests';
    `);

        if (labRes.rows.length > 0) {
            console.log('\n✅ lab_requests table exists!');
        } else {
            console.log('\n❌ lab_requests table NOT found!');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error verifying schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
