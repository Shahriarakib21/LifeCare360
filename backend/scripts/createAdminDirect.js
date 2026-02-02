const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/healthlife';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'lab', 'pharmacy', 'admin'], default: 'patient' },
    profile: {
        firstName: String,
        lastName: String,
        phone: String
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@healthcare.com';
        const password = 'Admin@12345678';

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists. Updating password and role...');
            existingUser.password = await bcrypt.hash(password, 10);
            existingUser.role = 'admin';
            existingUser.isActive = true;
            existingUser.isEmailVerified = true;
            await existingUser.save();
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = new User({
                email,
                password: hashedPassword,
                role: 'admin',
                profile: {
                    firstName: 'System',
                    lastName: 'Administrator',
                    phone: '+1234567890'
                },
                isActive: true,
                isEmailVerified: true
            });
            await admin.save();
            console.log('Admin user created successfully');
        }

        console.log('-------------------------');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
        console.log('-------------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
