// Test script to reproduce 422 validation errors

const testCases = [
    {
        name: "Empty name",
        data: {
            name: "",
            cuisine_type: "Italian",
            contact_email: "test@example.com",
            contact_phone: "1234567890",
            password: "testpassword123",
            locations: [
                {
                    address_line1: "123 Test Street",
                    town_city: "Test City",
                    postcode: "12345"
                }
            ]
        }
    },
    {
        name: "Invalid email",
        data: {
            name: "Test Restaurant",
            cuisine_type: "Italian",
            contact_email: "invalid-email",
            contact_phone: "1234567890",
            password: "testpassword123",
            locations: [
                {
                    address_line1: "123 Test Street",
                    town_city: "Test City",
                    postcode: "12345"
                }
            ]
        }
    },
    {
        name: "Missing locations",
        data: {
            name: "Test Restaurant",
            cuisine_type: "Italian",
            contact_email: "test@example.com",
            contact_phone: "1234567890",
            password: "testpassword123",
            locations: []
        }
    },
    {
        name: "Empty location fields",
        data: {
            name: "Test Restaurant",
            cuisine_type: "Italian",
            contact_email: "test@example.com",
            contact_phone: "1234567890",
            password: "testpassword123",
            locations: [
                {
                    address_line1: "",
                    town_city: "",
                    postcode: ""
                }
            ]
        }
    },
    {
        name: "Missing required field",
        data: {
            name: "Test Restaurant",
            // Missing cuisine_type
            contact_email: "test@example.com",
            contact_phone: "1234567890",
            password: "testpassword123",
            locations: [
                {
                    address_line1: "123 Test Street",
                    town_city: "Test City",
                    postcode: "12345"
                }
            ]
        }
    }
];

const testRegistration = async (testCase) => {
    try {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log('📤 Sending data:', { 
            ...testCase.data, 
            password: testCase.data.password ? '[HIDDEN]' : testCase.data.password 
        });

        const response = await fetch('https://radiant-amazement-production-d68f.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.data)
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Registration failed:', response.status, response.statusText);
            console.error('❌ Error details:', errorData);
            
            if (response.status === 422) {
                console.log('🎯 Found 422 error - this might be the issue!');
            }
            return;
        }

        const data = await response.json();
        console.log('✅ Registration successful:', data);

    } catch (error) {
        console.error('💥 Network error:', error);
    }
};

// Run all test cases
const runAllTests = async () => {
    for (const testCase of testCases) {
        await testRegistration(testCase);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
};

runAllTests();
