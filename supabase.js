// supabase.js - This file connects our app to the Supabase database

// Create our connection to Supabase
const supabaseUrl = "https://fbkcdirkshubectuvxzi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8";

// Initialize the Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey );

// Function to save a webhook to the database
async function saveWebhook(webhookData) {
  try {
    // Insert the webhook data into the 'webhooks' table
    const { data, error } = await supabase
      .from('webhooks')
      .insert([
        { 
          content: JSON.stringify(webhookData),
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) throw error;
    console.log('Webhook saved to Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving webhook to Supabase:', error);
    return null;
  }
}

// Function to get all webhooks from the database
async function getWebhooks() {
  try {
    // Get all webhooks from the 'webhooks' table, ordered by creation date
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting webhooks from Supabase:', error);
    return [];
  }
}

// Function to save an order to the database
async function saveOrder(orderData) {
  try {
    // Insert the order data into the 'orders' table
    const { data, error } = await supabase
      .from('orders')
      .insert([
        { 
          content: JSON.stringify(orderData),
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) throw error;
    console.log('Order saved to Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving order to Supabase:', error);
    return null;
  }
}

// Function to get all orders from the database
async function getOrders() {
  try {
    // Get all orders from the 'orders' table, ordered by creation date
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting orders from Supabase:', error);
    return [];
  }
}

// Function to save settings to the database
async function saveSettings(settings) {
  try {
    // Upsert (update or insert) the settings
    const { data, error } = await supabase
      .from('settings')
      .upsert([
        { 
          id: 1, // We'll always use ID 1 for the main settings
          content: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        }
      ]);
      
    if (error) throw error;
    console.log('Settings saved to Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving settings to Supabase:', error);
    return null;
  }
}

// Function to get settings from the database
async function getSettings() {
  try {
    // Get the settings with ID 1
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows returned
    
    if (!data) {
      // If no settings exist yet, return default settings
      return {
        sellThreshold: 1.25,
        waitForWebhook: true,
        sellOnThreshold: false
      };
    }
    
    return JSON.parse(data.content);
  } catch (error) {
    console.error('Error getting settings from Supabase:', error);
    // Return default settings if there's an error
    return {
      sellThreshold: 1.25,
      waitForWebhook: true,
      sellOnThreshold: false
    };
  }
}

// Function to delete the last webhook from the database
async function deleteLastWebhook() {
  try {
    // Get the last webhook
    const { data: webhooks, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (fetchError) throw fetchError;
    
    if (webhooks && webhooks.length > 0) {
      // Delete the last webhook
      const { error: deleteError } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhooks[0].id);
        
      if (deleteError) throw deleteError;
      console.log('Last webhook deleted');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting last webhook:', error);
    return false;
  }
}

// Function to delete all webhooks from the database
async function deleteAllWebhooks() {
  try {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .neq('id', 0); // This will delete all records
      
    if (error) throw error;
    console.log('All webhooks deleted');
    return true;
  } catch (error) {
    console.error('Error deleting all webhooks:', error);
    return false;
  }
}

// Function to delete the last order from the database
async function deleteLastOrder() {
  try {
    // Get the last order
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (fetchError) throw fetchError;
    
    if (orders && orders.length > 0) {
      // Delete the last order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orders[0].id);
        
      if (deleteError) throw deleteError;
      console.log('Last order deleted');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting last order:', error);
    return false;
  }
}

// Function to delete all orders from the database
async function deleteAllOrders() {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', 0); // This will delete all records
      
    if (error) throw error;
    console.log('All orders deleted');
    return true;
  } catch (error) {
    console.error('Error deleting all orders:', error);
    return false;
  }
}


// Function to get trap status from the database
async function getTrapOrders() {
  try {
    const { data, error } = await supabase
      .from('trap_orders')
      .select('price, status');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting trap orders from Supabase:', error);
    return supabase.from("trap_orders").select("price, status")
    //return [];
  }
}




// Export all functions so they can be used in other files
window.db = {
  saveWebhook,
  getWebhooks,
  saveOrder,
  getOrders,
  saveSettings,
  getSettings,
  deleteLastWebhook,
  deleteAllWebhooks,
  deleteLastOrder,
  deleteAllOrders,
  getTrapOrders  
};
