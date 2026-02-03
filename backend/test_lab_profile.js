const axios = require('axios');

async function testLabProfile() {
    const labId = '698196f5a18dfde6a3544588'; // From the error message

    console.log(`Testing GET /api/public/labs/${labId}...`);

    try {
        const response = await axios.get(`http://localhost:5001/api/public/labs/${labId}`, {
            timeout: 10000 // 10 second timeout
        });

        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Lab Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ FAILED');
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout occurred after', error.config.timeout, 'ms');
        } else if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received');
            console.error('Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLabProfile();
