// Test file for separate order placement function
// This calls the completely independent place-order-test function
// Safe to use - won't affect your existing price/balance system!

console.log('🧪 Loading separate order test...');

// Wait for page to load, then add test button
setTimeout(() => {
    console.log('🎯 Adding independent test button...');
    
    // Create test button
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Order (Safe)';
    testButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #22c55e;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        transition: all 0.2s;
    `;
    
    // Hover effect
    testButton.onmouseover = () => {
        testButton.style.background = '#16a34a';
        testButton.style.transform = 'translateY(-2px)';
    };
    testButton.onmouseout = () => {
        testButton.style.background = '#22c55e';
        testButton.style.transform = 'translateY(0)';
    };
    
    // Click handler
    testButton.onclick = async () => {
        console.log('🧪 Testing separate order function...');
        testButton.textContent = '⏳ Testing...';
        testButton.disabled = true;
        
        try {
            // Call the completely separate test function
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/place-order-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('📡 Raw response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
            
            console.log('✅ Parsed response:', data);
            
            if (data.success) {
                testButton.textContent = '✅ Order Placed!';
                testButton.style.background = '#059669';
                alert(`🎉 Test order placed successfully!\n\nOrder ID: ${data.orderId}\nClient ID: ${data.clientOid}\n\nCheck your KuCoin account!`);
            } else {
                testButton.textContent = '❌ Failed';
                testButton.style.background = '#dc2626';
                alert(`❌ Test order failed: ${data.error}\n\nDetails: ${data.details || 'No additional details'}`);
            }
            
        } catch (error) {
            console.error('❌ Test error:', error);
            testButton.textContent = '❌ Error';
            testButton.style.background = '#dc2626';
            alert(`❌ Test failed: ${error.message}`);
        }
        
        // Reset button after 5 seconds
        setTimeout(() => {
            testButton.textContent = '🧪 Test Order (Safe)';
            testButton.style.background = '#22c55e';
            testButton.disabled = false;
        }, 5000);
    };
    
    // Add button to page
    document.body.appendChild(testButton);
    console.log('✅ Independent test button added to page');
    
}, 2000);

