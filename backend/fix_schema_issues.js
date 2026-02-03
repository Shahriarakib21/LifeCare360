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

        // Fix Doctor table
        console.log('🛠️  Fixing Doctor table...');
        await client.query('ALTER TABLE doctors DROP COLUMN IF EXISTS qualifications CASCADE;');
        await client.query('ALTER TABLE doctors DROP COLUMN IF EXISTS languages CASCADE;');
        console.log('✅ Dropped Doctor columns: qualifications, languages');

        // Fix Medicine table
        console.log('🛠️  Fixing Medicine table...');
        await client.query('ALTER TABLE medicines DROP COLUMN IF EXISTS "indications" CASCADE;');
        await client.query('ALTER TABLE medicines DROP COLUMN IF EXISTS "sideEffects" CASCADE;');
        await client.query('ALTER TABLE medicines DROP COLUMN IF EXISTS "contraindications" CASCADE;');
        await client.query('ALTER TABLE medicines DROP COLUMN IF EXISTS "interactions" CASCADE;');
        await client.query('ALTER TABLE medicines DROP COLUMN IF EXISTS "seoKeywords" CASCADE;');
        console.log('✅ Dropped Medicine columns: indications, sideEffects, contraindications, interactions, seoKeywords');

        console.log('🎉 Schema cleanup complete. Run sync now.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
