// Test file for KuCoin order placement - Simple Footer Integration
// Direct approach to replace footer button functionality

console.log('🧪 Loading KuCoin order test for footer...');

// Wait for page to load, then replace footer button
setTimeout(() => {
    console.log('🎯 Setting up footer test button...');
    
    // First, try to find the button by common patterns
    let footerButton = null;
    
    // Method 1: Find by text content
    const allButtons = document.querySelectorAll('button');
    for (let btn of allButtons) {
        if (btn.textContent.includes('Test') && btn.textContent.includes('Order')) {
            footerButton = btn;
            console.log('✅ Found button by text content:', btn.textContent);
            break;
        }
    }
    
    // Method 2: If not found, look for buttons in bottom area of page
    if (!footerButton) {
        const buttons = Array.from(allButtons);
        // Get buttons in the bottom 20% of the page
        footerButton = buttons.find(btn => {
            const rect = btn.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            return rect.top > windowHeight * 0.8; // Bottom 20% of screen
        });
        if (footerButton) {
            console.log('✅ Found button in footer area:', footerButton.textContent);
        }
    }
    
    // Method 3: Create new button if none found
    if (!footerButton) {
        console.log('⚠️ No existing button found, creating new one...');
        footerButton = document.createElement('button');
        footerButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.2s;
        `;
        document.body.appendChild(footerButton);
    }
    
    // Update button text and clear any existing handlers
    footerButton.textContent = '🧪 Test KuCoin Order';
    footerButton.onclick = null; // Clear existing handler
    footerButton.removeAttribute('onclick'); // Remove inline onclick
    
    // Add our working click handler
    footerButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🧪 Testing KuCoin order placement...');
        const originalText = this.textContent;
        const originalBg = this.style.backgroundColor || '#3b82f6';
        
        this.textContent = '⏳ Placing Order...';
        this.disabled = true;
        
        try {
            // Use the working Supabase Edge Function
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/index`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            
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
                this.textContent = '✅ Order Placed!';
                this.style.backgroundColor = '#059669'; // Success green
                alert(`🎉 KuCoin order placed successfully!\n\nOrder ID: ${data.orderId}\nClient ID: ${data.clientOid}\n\nCheck your KuCoin account!`);
            } else {
                this.textContent = '❌ Order Failed';
                this.style.backgroundColor = '#dc2626'; // Error red
                alert(`❌ Order failed: ${data.error}\n\nDetails: ${data.details || 'No additional details'}`);
            }
            
        } catch (error) {
            console.error('❌ Test error:', error);
            this.textContent = '❌ Error';
            this.style.backgroundColor = '#dc2626'; // Error red
            alert(`❌ Test failed: ${error.message}`);
        }
        
        // Reset button after 3 seconds
        setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = originalBg;
            this.disabled = false;
        }, 3000);
    });
    
    console.log('✅ Footer button functionality set up successfully');
    
}, 2000);

// Also define the old function to prevent errors
window.testSingleOrder = function() {
    console.log('🔄 Old testSingleOrder called, redirecting to new handler...');
    const button = document.querySelector('button[onclick*="testSingleOrder"]');
    if (button && button.click) {
        button.click();
    }
};

