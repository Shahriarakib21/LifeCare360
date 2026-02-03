const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});

client.connect()
    .then(() => {
        console.log('CONNECTED');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('QUERY SUCCESS:', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('CONNECTION ERROR:', err.message);
        process.exit(1);
    });
