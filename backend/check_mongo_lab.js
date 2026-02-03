const mongoose = require('mongoose');

async function checkMongoDBAndLab() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';
        console.log('Connecting to MongoDB:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Check if lab exists
        const labId = '698196f5a18dfde6a3544588';
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        console.log(`\nSearching for lab with ID: ${labId}`);
        const lab = await User.findOne({ _id: labId, role: 'lab' });

        if (lab) {
            console.log('✅ Lab found:', lab.email || lab._id);
        } else {
            console.log('❌ Lab NOT found');

            // Check if any labs exist
            const labCount = await User.countDocuments({ role: 'lab' });
            console.log(`Total labs in database: ${labCount}`);

            if (labCount > 0) {
                const sampleLab = await User.findOne({ role: 'lab' }).select('_id email');
                console.log('Sample lab ID:', sampleLab._id);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkMongoDBAndLab();
