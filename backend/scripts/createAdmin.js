/**
 * Script to create an admin user
 * 
 * Usage:
 * 1. Make sure your backend is running (npm run dev)
 * 2. Run: node scripts/createAdmin.js
 * 3. Or use the API endpoint directly with curl/Postman
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5001';

async function createAdmin() {
    try {
        const adminData = {
            email: 'admin@healthlife.com',
            password: 'Admin@123456',
            role: 'admin',
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+1234567890'
        };

        console.log('Creating admin user...');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('');

        const response = await axios.post(`${API_URL}/api/auth/register`, adminData);

        if (response.data.success) {
            console.log('✅ Admin user created successfully!');
            console.log('');
            console.log('Login credentials:');
            console.log('Email:', adminData.email);
            console.log('Password:', adminData.password);
            console.log('');
            console.log('You can now login at: http://localhost:3000/auth/login');
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ Error:', error.response.data.message || error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

createAdmin();
