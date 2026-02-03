const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});

async function run() {
    try {
        await client.connect();
        console.log('CONNECTED');

        // Check doctors table schema
        const res = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'doctors'
      AND column_name IN ('qualifications', 'languages');
    `);

        console.log('SCHEMA:', JSON.stringify(res.rows, null, 2));

        await client.end();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

run();
