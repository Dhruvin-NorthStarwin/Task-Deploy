#!/usr/bin/env node
/**
 * Test script to verify NFC proxy configuration
 * This tests that the frontend can successfully communicate with the backend NFC endpoints
 */

const { spawn } = require('child_process');
const path = require('path');

async function testNFCProxy() {
    console.log('🧪 Testing NFC Proxy Configuration');
    console.log('=' .repeat(50));
    
    // Test the proxy connection
    console.log('\n📍 Testing Frontend -> Backend Proxy');
    
    try {
        const response = await fetch('http://localhost:5173/api/nfc/clean/test-asset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                staff_name: 'Test Staff',
                notes: 'Proxy test'
            })
        });
        
        const contentType = response.headers.get('content-type');
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
            console.log('   ✅ Receiving JSON response (not HTML)');
            const data = await response.json();
            console.log('   📊 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('   ❌ Still receiving non-JSON response');
            const text = await response.text();
            console.log('   📄 Response:', text.substring(0, 200) + '...');
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 NFC Proxy Test Complete');
    console.log('\n💡 If you see JSON responses instead of HTML, the proxy fix worked!');
    console.log('   The backend error is expected since we\'re using a test asset ID.');
}

// Only run if we have fetch available (Node 18+)
if (typeof fetch !== 'undefined') {
    testNFCProxy();
} else {
    console.log('❌ This test requires Node.js 18+ with built-in fetch');
    console.log('💡 Alternatively, test manually by opening:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:8000');
    console.log('   Test NFC route: http://localhost:5173/nfc/clean/test-asset');
}
