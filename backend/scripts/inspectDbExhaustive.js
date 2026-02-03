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

        log('\n--- All Schemas ---');
        const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata");
        log('Schemas: ' + schemasRes.rows.map(r => r.schema_name).join(', '));

        log('\n--- All Tables in All Schemas ---');
        const tablesRes = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' ORDER BY table_schema, table_name");
        tablesRes.rows.forEach(r => {
            log(`${r.table_schema}.${r.table_name}`);
        });

        // Check for specific lab table case-insensitive
        const labTable = tablesRes.rows.find(r => r.table_name.toLowerCase().includes('lab'));
        if (labTable) {
            log(`\n--- Inspecting ${labTable.table_schema}.${labTable.table_name} ---`);
            const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${labTable.table_name}' AND table_schema = '${labTable.table_schema}'`);
            log(`Columns: ` + JSON.stringify(columns.rows, null, 2));

            const sample = await client.query(`SELECT * FROM "${labTable.table_schema}"."${labTable.table_name}" LIMIT 3`);
            log(`Sample Data: ` + JSON.stringify(sample.rows, null, 2));
        }

    } catch (e) {
        log('Error: ' + e.message);
    } finally {
        await client.end();
        fs.writeFileSync(path.join(__dirname, 'db_inspection_full.txt'), output);
    }
}

run();
