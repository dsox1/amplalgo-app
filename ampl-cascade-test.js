// AMPL Cascade Test Button
// Triggers the AMPL Cascade system deployment

console.log('🌊 Loading AMPL Cascade test...');

// Wait for page to load, then add cascade test button
setTimeout(() => {
    console.log('🎯 Adding AMPL Cascade test button...');
    
    // Create cascade test button
    const cascadeButton = document.createElement('button');
    cascadeButton.textContent = '🌊 Deploy AMPL Cascade';
    cascadeButton.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    `;
    
    // Hover effect
    cascadeButton.onmouseover = () => {
        cascadeButton.style.background = '#7c3aed';
        cascadeButton.style.transform = 'translateY(-2px)';
    };
    cascadeButton.onmouseout = () => {
        cascadeButton.style.background = '#8b5cf6';
        cascadeButton.style.transform = 'translateY(0)';
    };
    
    // Click handler
    cascadeButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🌊 Deploying AMPL Cascade...');
        const originalText = this.textContent;
        const originalBg = this.style.backgroundColor;
        
        this.textContent = '⏳ Deploying Cascade...';
        this.disabled = true;
        
        try {
            // Call the AMPL Cascade function
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-cascade`, {
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
                this.textContent = '✅ Cascade Deployed!';
                this.style.backgroundColor = '#059669'; // Success green
                
                // Create detailed success message
                const summary = data.summary;
                const placedCount = summary.ordersPlaced;
                const failedCount = summary.ordersFailed;
                const totalUSDT = summary.totalUSDTDeployed;
                
                let message = `🌊 AMPL Cascade Deployed Successfully!\n\n`;
                message += `📊 Summary:\n`;
                message += `• Current AMPL Price: $${summary.currentPrice}\n`;
                message += `• Cascade Starting Price: $${summary.startingPrice}\n`;
                message += `• Orders Placed: ${placedCount}/${summary.totalLevels}\n`;
                message += `• Total USDT Deployed: $${totalUSDT}\n\n`;
                
                if (placedCount > 0) {
                    message += `✅ Successfully placed ${placedCount} cascade orders!\n`;
                }
                if (failedCount > 0) {
                    message += `⚠️ ${failedCount} orders failed (check console for details)\n`;
                }
                
                message += `\nCheck your KuCoin account to see the cascade!`;
                
                alert(message);
                
                // Log detailed results
                console.log('🌊 AMPL Cascade Results:');
                console.log('📊 Summary:', summary);
                console.log('✅ Placed Orders:', data.placedOrders);
                if (data.failedOrders.length > 0) {
                    console.log('❌ Failed Orders:', data.failedOrders);
                }
                console.log('📋 All Cascade Levels:', data.cascadeLevels);
                
            } else {
                this.textContent = '❌ Cascade Failed';
                this.style.backgroundColor = '#dc2626'; // Error red
                alert(`❌ AMPL Cascade failed: ${data.error}\n\nDetails: ${data.details || 'No additional details'}`);
            }
            
        } catch (error) {
            console.error('❌ Cascade error:', error);
            this.textContent = '❌ Error';
            this.style.backgroundColor = '#dc2626'; // Error red
            alert(`❌ Cascade deployment failed: ${error.message}`);
        }
        
        // Reset button after 5 seconds
        setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = originalBg;
            this.disabled = false;
        }, 5000);
    });
    
    // Add button to page
    document.body.appendChild(cascadeButton);
    console.log('✅ AMPL Cascade test button added to page');
    
}, 2000);

