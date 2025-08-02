/**
 * Supabase Data Cleanup Script
 * This script helps identify and clean up malformed JSON data in your Supabase database
 * Run this in your browser console to diagnose and fix JSON parsing errors
 */

class SupabaseDataCleanup {
    constructor() {
        this.SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';
        this.problematicRecords = {
            webhooks: [],
            orders: [],
            settings: []
        };
    }

    async diagnoseAllTables() {
        console.log('🔍 Starting Supabase data diagnosis...');
        
        await this.diagnoseWebhooks();
        await this.diagnoseOrders();
        await this.diagnoseSettings();
        
        this.generateReport();
    }

    async diagnoseWebhooks() {
        console.log('📡 Diagnosing webhooks table...');
        
        try {
            const response = await fetch(`${this.SUPABASE_URL}/rest/v1/webhooks?select=*`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const webhooks = await response.json();
            console.log(`📊 Found ${webhooks.length} webhook records`);

            for (const webhook of webhooks) {
                try {
                    // Try to parse the content
                    if (webhook.content) {
                        JSON.parse(webhook.content);
                    }
                } catch (error) {
                    console.error(`❌ Malformed JSON in webhook ID ${webhook.id}:`, error.message);
                    this.problematicRecords.webhooks.push({
                        id: webhook.id,
                        content: webhook.content,
                        error: error.message,
                        created_at: webhook.created_at
                    });
                }
            }

            console.log(`✅ Webhooks diagnosis complete. Found ${this.problematicRecords.webhooks.length} problematic records.`);
        } catch (error) {
            console.error('❌ Error diagnosing webhooks:', error);
        }
    }

    async diagnoseOrders() {
        console.log('📋 Diagnosing orders table...');
        
        try {
            const response = await fetch(`${this.SUPABASE_URL}/rest/v1/orders?select=*`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const orders = await response.json();
            console.log(`📊 Found ${orders.length} order records`);

            for (const order of orders) {
                try {
                    // Try to parse the content
                    if (order.content) {
                        JSON.parse(order.content);
                    }
                } catch (error) {
                    console.error(`❌ Malformed JSON in order ID ${order.id}:`, error.message);
                    this.problematicRecords.orders.push({
                        id: order.id,
                        content: order.content,
                        error: error.message,
                        created_at: order.created_at
                    });
                }
            }

            console.log(`✅ Orders diagnosis complete. Found ${this.problematicRecords.orders.length} problematic records.`);
        } catch (error) {
            console.error('❌ Error diagnosing orders:', error);
        }
    }

    async diagnoseSettings() {
        console.log('⚙️ Diagnosing settings table...');
        
        try {
            const response = await fetch(`${this.SUPABASE_URL}/rest/v1/settings?select=*`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const settings = await response.json();
            console.log(`📊 Found ${settings.length} settings records`);

            for (const setting of settings) {
                try {
                    // Try to parse the settings
                    if (setting.settings) {
                        JSON.parse(setting.settings);
                    }
                } catch (error) {
                    console.error(`❌ Malformed JSON in settings ID ${setting.id}:`, error.message);
                    this.problematicRecords.settings.push({
                        id: setting.id,
                        settings: setting.settings,
                        error: error.message,
                        updated_at: setting.updated_at
                    });
                }
            }

            console.log(`✅ Settings diagnosis complete. Found ${this.problematicRecords.settings.length} problematic records.`);
        } catch (error) {
            console.error('❌ Error diagnosing settings:', error);
        }
    }

    generateReport() {
        console.log('\n📋 === SUPABASE DATA CLEANUP REPORT ===');
        console.log(`🔍 Diagnosis completed at: ${new Date().toISOString()}`);
        
        const totalProblems = this.problematicRecords.webhooks.length + 
                             this.problematicRecords.orders.length + 
                             this.problematicRecords.settings.length;

        if (totalProblems === 0) {
            console.log('✅ No problematic records found! Your database is clean.');
            return;
        }

        console.log(`❌ Found ${totalProblems} problematic records:`);
        console.log(`   📡 Webhooks: ${this.problematicRecords.webhooks.length} issues`);
        console.log(`   📋 Orders: ${this.problematicRecords.orders.length} issues`);
        console.log(`   ⚙️ Settings: ${this.problematicRecords.settings.length} issues`);

        console.log('\n🛠️ RECOMMENDED ACTIONS:');
        
        if (this.problematicRecords.webhooks.length > 0) {
            console.log('\n📡 WEBHOOKS TABLE:');
            this.problematicRecords.webhooks.forEach((record, index) => {
                console.log(`   ${index + 1}. ID: ${record.id} - Error: ${record.error}`);
                console.log(`      Content preview: ${record.content?.substring(0, 100)}...`);
            });
        }

        if (this.problematicRecords.orders.length > 0) {
            console.log('\n📋 ORDERS TABLE:');
            this.problematicRecords.orders.forEach((record, index) => {
                console.log(`   ${index + 1}. ID: ${record.id} - Error: ${record.error}`);
                console.log(`      Content preview: ${record.content?.substring(0, 100)}...`);
            });
        }

        if (this.problematicRecords.settings.length > 0) {
            console.log('\n⚙️ SETTINGS TABLE:');
            this.problematicRecords.settings.forEach((record, index) => {
                console.log(`   ${index + 1}. ID: ${record.id} - Error: ${record.error}`);
                console.log(`      Settings preview: ${record.settings?.substring(0, 100)}...`);
            });
        }

        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Use the cleanup methods below to fix or delete problematic records');
        console.log('2. Run cleanup.deleteProblematicRecords() to remove all bad records');
        console.log('3. Or use cleanup.fixProblematicRecords() to attempt repairs');
        console.log('4. Re-run cleanup.diagnoseAllTables() to verify fixes');
    }

    async deleteProblematicRecords() {
        console.log('🗑️ Starting deletion of problematic records...');
        
        let deletedCount = 0;

        // Delete problematic webhooks
        for (const record of this.problematicRecords.webhooks) {
            try {
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/webhooks?id=eq.${record.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'apikey': this.SUPABASE_ANON_KEY
                    }
                });

                if (response.ok) {
                    console.log(`✅ Deleted webhook ID: ${record.id}`);
                    deletedCount++;
                } else {
                    console.error(`❌ Failed to delete webhook ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error deleting webhook ID ${record.id}:`, error);
            }
        }

        // Delete problematic orders
        for (const record of this.problematicRecords.orders) {
            try {
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/orders?id=eq.${record.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'apikey': this.SUPABASE_ANON_KEY
                    }
                });

                if (response.ok) {
                    console.log(`✅ Deleted order ID: ${record.id}`);
                    deletedCount++;
                } else {
                    console.error(`❌ Failed to delete order ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error deleting order ID ${record.id}:`, error);
            }
        }

        // Delete problematic settings
        for (const record of this.problematicRecords.settings) {
            try {
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/settings?id=eq.${record.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'apikey': this.SUPABASE_ANON_KEY
                    }
                });

                if (response.ok) {
                    console.log(`✅ Deleted settings ID: ${record.id}`);
                    deletedCount++;
                } else {
                    console.error(`❌ Failed to delete settings ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error deleting settings ID ${record.id}:`, error);
            }
        }

        console.log(`🎉 Cleanup complete! Deleted ${deletedCount} problematic records.`);
        console.log('🔄 Run diagnoseAllTables() again to verify the cleanup.');
    }

    async fixProblematicRecords() {
        console.log('🔧 Attempting to fix problematic records...');
        
        let fixedCount = 0;

        // Try to fix webhooks by creating valid JSON structure
        for (const record of this.problematicRecords.webhooks) {
            try {
                let fixedContent;
                
                // Try to create a valid webhook structure
                if (record.content && record.content.trim()) {
                    // If it looks like partial JSON, try to complete it
                    if (record.content.includes('{') || record.content.includes('[')) {
                        // Try to fix common JSON issues
                        let cleaned = record.content.trim();
                        if (cleaned.endsWith(',')) {
                            cleaned = cleaned.slice(0, -1);
                        }
                        if (!cleaned.endsWith('}') && cleaned.includes('{')) {
                            cleaned += '}';
                        }
                        if (!cleaned.endsWith(']') && cleaned.includes('[')) {
                            cleaned += ']';
                        }
                        
                        try {
                            JSON.parse(cleaned);
                            fixedContent = cleaned;
                        } catch {
                            // If still can't parse, create a default structure
                            fixedContent = JSON.stringify({
                                action: "unknown",
                                ticker: "AMPL-USDT",
                                timestamp: record.created_at || new Date().toISOString(),
                                source: "recovered_data",
                                original_content: record.content
                            });
                        }
                    } else {
                        // Create default structure for non-JSON content
                        fixedContent = JSON.stringify({
                            action: "unknown",
                            ticker: "AMPL-USDT",
                            timestamp: record.created_at || new Date().toISOString(),
                            source: "recovered_data",
                            original_content: record.content
                        });
                    }
                } else {
                    // Create default structure for empty content
                    fixedContent = JSON.stringify({
                        action: "unknown",
                        ticker: "AMPL-USDT",
                        timestamp: record.created_at || new Date().toISOString(),
                        source: "recovered_data"
                    });
                }

                // Update the record
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/webhooks?id=eq.${record.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': this.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        content: fixedContent
                    })
                });

                if (response.ok) {
                    console.log(`✅ Fixed webhook ID: ${record.id}`);
                    fixedCount++;
                } else {
                    console.error(`❌ Failed to fix webhook ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error fixing webhook ID ${record.id}:`, error);
            }
        }

        // Try to fix orders
        for (const record of this.problematicRecords.orders) {
            try {
                let fixedContent;
                
                if (record.content && record.content.trim()) {
                    // Try to fix common JSON issues
                    let cleaned = record.content.trim();
                    if (cleaned.endsWith(',')) {
                        cleaned = cleaned.slice(0, -1);
                    }
                    if (!cleaned.endsWith('}') && cleaned.includes('{')) {
                        cleaned += '}';
                    }
                    
                    try {
                        JSON.parse(cleaned);
                        fixedContent = cleaned;
                    } catch {
                        // Create default order structure
                        fixedContent = JSON.stringify({
                            type: "limit",
                            side: "sell",
                            symbol: "AMPL-USDT",
                            price: 1.25,
                            size: 0.1,
                            timestamp: record.created_at || new Date().toISOString(),
                            source: "recovered_data",
                            original_content: record.content
                        });
                    }
                } else {
                    // Create default order structure
                    fixedContent = JSON.stringify({
                        type: "limit",
                        side: "sell",
                        symbol: "AMPL-USDT",
                        price: 1.25,
                        size: 0.1,
                        timestamp: record.created_at || new Date().toISOString(),
                        source: "recovered_data"
                    });
                }

                // Update the record
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/orders?id=eq.${record.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': this.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        content: fixedContent
                    })
                });

                if (response.ok) {
                    console.log(`✅ Fixed order ID: ${record.id}`);
                    fixedCount++;
                } else {
                    console.error(`❌ Failed to fix order ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error fixing order ID ${record.id}:`, error);
            }
        }

        // Try to fix settings
        for (const record of this.problematicRecords.settings) {
            try {
                let fixedSettings;
                
                if (record.settings && record.settings.trim()) {
                    // Try to fix common JSON issues
                    let cleaned = record.settings.trim();
                    if (cleaned.endsWith(',')) {
                        cleaned = cleaned.slice(0, -1);
                    }
                    if (!cleaned.endsWith('}') && cleaned.includes('{')) {
                        cleaned += '}';
                    }
                    
                    try {
                        JSON.parse(cleaned);
                        fixedSettings = cleaned;
                    } catch {
                        // Create default settings structure
                        fixedSettings = JSON.stringify({
                            sellThreshold: 1.25,
                            waitForWebhook: true,
                            sellOnThreshold: false,
                            source: "recovered_data",
                            original_settings: record.settings
                        });
                    }
                } else {
                    // Create default settings structure
                    fixedSettings = JSON.stringify({
                        sellThreshold: 1.25,
                        waitForWebhook: true,
                        sellOnThreshold: false,
                        source: "recovered_data"
                    });
                }

                // Update the record
                const response = await fetch(`${this.SUPABASE_URL}/rest/v1/settings?id=eq.${record.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': this.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        settings: fixedSettings
                    })
                });

                if (response.ok) {
                    console.log(`✅ Fixed settings ID: ${record.id}`);
                    fixedCount++;
                } else {
                    console.error(`❌ Failed to fix settings ID: ${record.id}`);
                }
            } catch (error) {
                console.error(`❌ Error fixing settings ID ${record.id}:`, error);
            }
        }

        console.log(`🎉 Fix attempt complete! Fixed ${fixedCount} records.`);
        console.log('🔄 Run diagnoseAllTables() again to verify the fixes.');
    }

    // Utility method to clear all data (use with caution!)
    async clearAllData() {
        const confirm = prompt('⚠️ This will DELETE ALL data from webhooks, orders, and settings tables. Type "DELETE ALL" to confirm:');
        
        if (confirm !== 'DELETE ALL') {
            console.log('❌ Operation cancelled.');
            return;
        }

        console.log('🗑️ Clearing all data...');

        try {
            // Clear webhooks
            await fetch(`${this.SUPABASE_URL}/rest/v1/webhooks`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY,
                    'Range': '0-1000'
                }
            });

            // Clear orders
            await fetch(`${this.SUPABASE_URL}/rest/v1/orders`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY,
                    'Range': '0-1000'
                }
            });

            // Clear settings
            await fetch(`${this.SUPABASE_URL}/rest/v1/settings`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'apikey': this.SUPABASE_ANON_KEY,
                    'Range': '0-1000'
                }
            });

            console.log('✅ All data cleared successfully.');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
        }
    }
}

// Usage instructions
console.log(`
🛠️ SUPABASE DATA CLEANUP TOOL
=============================

To use this tool, run the following commands in your browser console:

1. Create cleanup instance:
   const cleanup = new SupabaseDataCleanup();

2. Diagnose all tables:
   await cleanup.diagnoseAllTables();

3. Choose cleanup method:
   - Delete problematic records: await cleanup.deleteProblematicRecords();
   - Try to fix records: await cleanup.fixProblematicRecords();
   - Clear all data (CAUTION): await cleanup.clearAllData();

4. Verify cleanup:
   await cleanup.diagnoseAllTables();
`);

// Make the class available globally
window.SupabaseDataCleanup = SupabaseDataCleanup;

