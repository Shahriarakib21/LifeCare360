const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/healthlife';

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({}, { projection: { email: 1, role: 1, isActive: 1 } }).toArray();

        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            console.log('Users found:');
            for (const u of users) {
                console.log(`Email: [${u.email}], Role: [${u.role}], Active: [${u.isActive}]`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
