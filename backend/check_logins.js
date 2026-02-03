const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/healthlife';

async function checkLogins() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const logs = await db.collection('loginlogs').find().sort({ createdAt: -1 }).limit(10).toArray();
        console.log(JSON.stringify(logs, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkLogins();
