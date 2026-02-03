const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/healthlife';

async function diag() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
        console.log(JSON.stringify(users, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

diag();
