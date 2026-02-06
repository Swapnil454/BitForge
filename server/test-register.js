// Using Node.js built-in fetch (available in Node 18+)

const testRegistration = async () => {
    try {
        console.log('Testing registration endpoint...');
        
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123',
                role: 'buyer'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('Success:', data);
        } else {
            console.log('Error:', responseText);
        }
        
    } catch (error) {
        console.error('Request failed:', error);
    }
};

testRegistration();