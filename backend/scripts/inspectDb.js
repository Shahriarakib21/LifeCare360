const { Client } = require('pg');

async function run() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'healthlife',
        password: 'postgres',
        port: 5432
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Tables:', tables);

        for (const table of tables) {
            if (table.toLowerCase().includes('lab')) {
                const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
                console.log(`Columns in ${table}:`, columns.rows);

                const sample = await client.query(`SELECT * FROM "${table}" LIMIT 1`);
                console.log(`Sample data from ${table}:`, sample.rows[0]);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

run();
