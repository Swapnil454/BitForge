import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

async function testRegistrationFlow() {
    try {
        console.log('🔄 Testing registration...');
        
        // Step 1: Register
        const registerResponse = await api.post('/auth/register', {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        
        console.log(' Registration success:', registerResponse.data);
        
        // Step 2: Try to verify with wrong OTP first
        console.log('🔄 Testing verify with wrong OTP...');
        try {
            const verifyResponse = await api.post('/auth/verify-otp', {
                email: 'test@example.com',
                otp: '123456'
            });
            console.log(' Verify success:', verifyResponse.data);
        } catch (verifyError) {
            console.log(' Verify error (expected):', verifyError.response?.status, verifyError.response?.data);
        }
        
        // Step 3: Try to verify with empty email
        console.log('🔄 Testing verify with empty email...');
        try {
            const verifyResponse2 = await api.post('/auth/verify-otp', {
                email: '',
                otp: '123456'
            });
            console.log(' Verify success:', verifyResponse2.data);
        } catch (verifyError2) {
            console.log(' Verify error:', verifyError2.response?.status, verifyError2.response?.data);
        }
        
    } catch (error) {
        console.error(' Test error:', error.message);
        console.error(' Error code:', error.code);
        if (error.response) {
            console.error(' Response status:', error.response.status);
            console.error(' Response data:', error.response.data);
        } else {
            console.error(' No response - network error');
            console.error(' Error config:', error.config?.url);
        }
    }
}

testRegistrationFlow();