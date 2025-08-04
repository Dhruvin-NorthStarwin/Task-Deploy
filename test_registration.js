// Test script to reproduce the 422 registration error

const testRegistration = async () => {
    const testData = {
        name: "Test Restaurant",
        cuisine_type: "Italian",
        contact_email: `test${Date.now()}@example.com`,
        contact_phone: "1234567890",
        password: "testpassword123",
        locations: [
            {
                address_line1: "123 Test Street",
                town_city: "Test City",
                postcode: "12345"
            }
        ]
    };

    try {
        console.log('🔥 Testing registration with data:', { 
            ...testData, 
            password: '[HIDDEN]' 
        });

        const response = await fetch('https://radiant-amazement-production-d68f.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Registration failed:', response.status, response.statusText);
            console.error('❌ Error details:', errorData);
            return;
        }

        const data = await response.json();
        console.log('✅ Registration successful:', data);

    } catch (error) {
        console.error('💥 Network error:', error);
    }
};

// Run the test
testRegistration();
