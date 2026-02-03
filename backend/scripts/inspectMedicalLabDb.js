const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'medical_lab_db',
        password: 'postgres',
        port: 5432
    });

    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await client.connect();
        log('Connected to medical_lab_db');

        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        log('Tables: ' + tables.join(', '));

        for (const table of tables) {
            log(`\n--- Inspecting ${table} ---`);
            const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
            log(`Columns: ` + JSON.stringify(columns.rows, null, 2));

            const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
            log(`Sample Data: ` + JSON.stringify(sample.rows, null, 2));
        }

    } catch (e) {
        log('Error: ' + e.message);
    } finally {
        await client.end();
        fs.writeFileSync(path.join(__dirname, 'db_medical_lab_inspection.txt'), output);
    }
}

run();
