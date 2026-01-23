
import mongoose from 'mongoose';
import User from '../src/models/mongodb/User.model';
import dotenv from 'dotenv';
import path from 'path';

// Force load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';

const checkUser = async () => {
    try {
        console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const email = 'patient1@healthlife.com';
        const password = 'password123';

        console.log(`Checking user: ${email}`);
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('❌ User NOT found.');
            const allUsers = await User.find({});
            console.log(`Total users in DB: ${allUsers.length}`);
            if (allUsers.length > 0) {
                console.log('First 3 users:');
                allUsers.slice(0, 3).forEach(u => console.log(` - ${u.email} (${u.role})`));
            }
        } else {
            console.log('✅ User found.');
            console.log(`Role: ${user.role}`);

            console.log('Checking password...');
            const isMatch = await user.comparePassword(password);

            if (isMatch) {
                console.log('✅ Password MATCHES.');
            } else {
                console.log('❌ Password DOES NOT match.');
                console.log('Stored hash:', user.password);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkUser();
