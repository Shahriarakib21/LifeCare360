const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'healthlife',
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
        log('Connected to PostgreSQL');

        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        log('All Tables: ' + tables.join(', '));

        const labTable = tables.find(t => t.toLowerCase().includes('lab'));
        if (labTable) {
            log(`\n--- Inspecting ${labTable} ---`);
            const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${labTable}'`);
            log(`Columns: ` + JSON.stringify(columns.rows, null, 2));

            const sample = await client.query(`SELECT * FROM "${labTable}" LIMIT 3`);
            log(`Sample Data: ` + JSON.stringify(sample.rows, null, 2));
        } else {
            log('\nTable medical_lab_train or lab-related table not found.');
        }

    } catch (e) {
        log('Error: ' + e.message);
    } finally {
        await client.end();
        fs.writeFileSync(path.join(__dirname, 'db_inspection_output.txt'), output);
    }
}

run();
