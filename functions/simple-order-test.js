/**
 * Simple Order Test - Standalone File
 * No changes needed to script.js
 * Creates green test button and handles single order placement
 */

// Test function that calls the Supabase Edge Function
async function testSingleOrder() {
    try {
        console.log('🧪 Testing single order placement...');
        
        // Use same pattern as your working price/balance functions
	const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/place---single--order`, {

            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ REAL ORDER PLACED SUCCESSFULLY!');
            console.log('📋 Order Details:', {
                orderId: data.orderId,
                clientOid: data.clientOid,
                price: data.price,
                size: data.size,
                symbol: data.symbol
            });
            
            // Update UI to show success
            alert(`✅ Real order placed!\nOrder ID: ${data.orderId}\nPrice: $${data.price}\nSize: ${data.size} AMPL\n\nCheck your KuCoin account!`);
            
        } else {
            console.error('❌ Order placement failed:', data.error);
            alert(`❌ Order failed: ${data.error}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing single order:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

// Create and add the green test button
function createTestButton() {
    // Check if button already exists
    if (document.getElementById('single-order-test-btn')) {
        return;
    }
    
    const testButton = document.createElement('button');
    testButton.id = 'single-order-test-btn';
    testButton.textContent = '🧪 Test Single Order ($0.99)';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        padding: 12px 16px;
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: black;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 8px rgba(0,255,0,0.3);
        transition: all 0.3s ease;
    `;
    
    // Add hover effect
    testButton.onmouseover = function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 12px rgba(0,255,0,0.4)';
    };
    
    testButton.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 8px rgba(0,255,0,0.3)';
    };
    
    testButton.onclick = testSingleOrder;
    document.body.appendChild(testButton);
    
    console.log('🧪 Test button created - click to place single order at $0.99');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(createTestButton, 2000); // Add after 2 seconds
    });
} else {
    // DOM already loaded
    setTimeout(createTestButton, 2000);
}

console.log('📦 Simple order test loaded - button will appear in 2 seconds');

