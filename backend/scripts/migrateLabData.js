const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
    const medicalClient = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'medical_lab_db',
        password: 'postgres',
        port: 5432
    });

    const healthClient = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'healthlife',
        password: 'postgres',
        port: 5432
    });

    try {
        await medicalClient.connect();
        await healthClient.connect();
        console.log('Connected to both databases');

        // 1. Create the lab_tests table in healthlife if not exists
        await healthClient.query(`
            CREATE TABLE IF NOT EXISTS lab_tests (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                unit VARCHAR(50),
                reference_range VARCHAR(100),
                price_bdt DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Ensure lab_tests table exists in healthlife');

        // 2. Fetch distinct tests from medical_lab_db (using distinct combinations)
        const testsRes = await medicalClient.query(`
            SELECT DISTINCT lab_test_name, test_category, unit, reference_range 
            FROM medical_lab_tests
        `);
        console.log(`Found ${testsRes.rows.length} unique tests to migrate`);

        // 3. Insert into healthlife
        let count = 0;
        for (const test of testsRes.rows) {
            // Assign a random realistic price between 200 and 5000 BDT
            const price = (Math.floor(Math.random() * 480) + 20) * 10;

            await healthClient.query(`
                INSERT INTO lab_tests (id, name, category, unit, reference_range, price_bdt)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING
            `, [
                uuidv4(),
                test.lab_test_name,
                test.test_category,
                test.unit,
                test.reference_range,
                price
            ]);
            count++;
        }

        console.log(`Successfully migrated ${count} tests to healthlife.lab_tests`);

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await medicalClient.end();
        await healthClient.end();
    }
}

migrate();
