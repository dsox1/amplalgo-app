// supabase/functions/ampl-manager/index.ts
// AMPL Manager Supabase Edge Function
// Integrates KuCoin API with your existing Supabase database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for frontend communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// AMPL Manager Configuration
const KUCOIN_API_BASE = 'https://api.kucoin.com'
const AMPL_SYMBOL = 'AMPL-USDT'
const AMPL_BUY_LEVELS = [1.16, 1.12, 1.08, 1.04, 1.00, 0.96, 0.92, 0.85]
const AMPL_ORDER_SIZE = '10' // 10 AMPL per order
const PROFIT_MARGIN = 0.03 // 3% profit margin

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

// Get KuCoin credentials from environment variables
const kucoinApiKey = Deno.env.get('KUCOIN_API_KEY')
const kucoinApiSecret = Deno.env.get('KUCOIN_API_SECRET')
const kucoinPassphrase = Deno.env.get('KUCOIN_API_PASSPHRASE')

console.log('Debug - API Key exists:', !!kucoinApiKey)
console.log('Debug - API Secret exists:', !!kucoinApiSecret)
console.log('Debug - Passphrase exists:', !!kucoinPassphrase)

if (!kucoinApiKey || !kucoinApiSecret || !kucoinPassphrase) {
  throw new Error(`KuCoin API credentials not configured - Key: ${!!kucoinApiKey}, Secret: ${!!kucoinApiSecret}, Passphrase: ${!!kucoinPassphrase}`)
}


    // Parse request
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    console.log(`AMPL Manager: ${req.method} ${action}`)

    // Route to appropriate handler
    switch (action) {
      case 'toggle':
        return await handleToggleAmplManager(req, supabase)
      
      case 'status':
        return await handleGetStatus(supabase, kucoinApiKey, kucoinApiSecret, kucoinPassphrase)
      
      case 'price':
        return await handleGetPrice()
      
      case 'balance':
        return await handleGetBalance(kucoinApiKey, kucoinApiSecret, kucoinPassphrase)
      
      case 'orders':
        return await handleGetOrders(supabase, kucoinApiKey, kucoinApiSecret, kucoinPassphrase)
      
      case 'monitor':
        return await handleMonitorOrders(supabase, kucoinApiKey, kucoinApiSecret, kucoinPassphrase)
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('AMPL Manager Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Toggle AMPL Manager on/off
async function handleToggleAmplManager(req: Request, supabase: any) {
  const { enabled } = await req.json()
  
  console.log(`AMPL Manager toggle: ${enabled ? 'ENABLE' : 'DISABLE'}`)
  
  // Update settings in your Supabase settings table
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 'ampl_manager',
      content: { 
        enabled, 
        updated_at: new Date().toISOString(),
        buy_levels: AMPL_BUY_LEVELS,
        order_size: AMPL_ORDER_SIZE,
        profit_margin: PROFIT_MARGIN
      },
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Database error:', error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }
  
  return new Response(JSON.stringify({
    success: true,
    enabled,
    message: `AMPL Manager ${enabled ? 'enabled' : 'disabled'}`,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Get AMPL Manager status
async function handleGetStatus(supabase: any, apiKey: string, apiSecret: string, passphrase: string) {
  try {
    // Get current settings from Supabase
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('content')
      .eq('id', 'ampl_manager')
      .single()
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError
    }
    
    // Get active orders from Supabase orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('content->symbol', AMPL_SYMBOL)
      .eq('content->status', 'active')
    
    if (ordersError) {
      console.error('Orders query error:', ordersError)
    }
    
    const enabled = settings?.content?.enabled || false
    const activeOrders = orders?.length || 0
    
    // Get current AMPL price
    const priceData = await getAmplPrice()
    
    // Get AMPL balance if enabled
    let amplBalance = 0
    if (enabled) {
      try {
        const balanceData = await getKuCoinBalance('AMPL', apiKey, apiSecret, passphrase)
        amplBalance = parseFloat(balanceData.available || '0')
      } catch (error) {
        console.error('Balance fetch error:', error)
      }
    }
    
    return new Response(JSON.stringify({
      enabled,
      active_trades: activeOrders,
      pending_trades: activeOrders,
      ampl_balance: amplBalance,
      current_price: priceData.price,
      buy_orders_total: activeOrders * parseFloat(AMPL_ORDER_SIZE) * 1.08, // Approximate
      current_value: amplBalance * priceData.price,
      last_update: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Status error:', error)
    return new Response(JSON.stringify({
      enabled: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get real-time AMPL price (public endpoint - no auth required)
async function handleGetPrice() {
  try {
    const priceData = await getAmplPrice()
    
    return new Response(JSON.stringify({
      symbol: AMPL_SYMBOL,
      price: priceData.price,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Price fetch error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch price',
      symbol: AMPL_SYMBOL,
      price: 1.15, // Fallback price
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get KuCoin balance with proper authentication
async function handleGetBalance(apiKey: string, apiSecret: string, passphrase: string) {
  try {
    const usdtBalance = await getKuCoinBalance('USDT', apiKey, apiSecret, passphrase)
    const amplBalance = await getKuCoinBalance('AMPL', apiKey, apiSecret, passphrase)
    
    return new Response(JSON.stringify({
      usdt: {
        currency: 'USDT',
        balance: parseFloat(usdtBalance.available || '0'),
        available: usdtBalance.available,
        hold: usdtBalance.hold
      },
      ampl: {
        currency: 'AMPL',
        balance: parseFloat(amplBalance.available || '0'),
        available: amplBalance.available,
        hold: amplBalance.hold
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Balance fetch error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch balance',
      usdt: { currency: 'USDT', balance: 0, available: '0.00', hold: '0.00' },
      ampl: { currency: 'AMPL', balance: 0, available: '0.00', hold: '0.00' },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get active orders
async function handleGetOrders(supabase: any, apiKey: string, apiSecret: string, passphrase: string) {
  try {
    const orders = await getKuCoinOrders(AMPL_SYMBOL, apiKey, apiSecret, passphrase)
    
    // Store orders in Supabase for tracking
    for (const order of orders) {
      await supabase
        .from('orders')
        .upsert({
          id: order.id,
          content: order,
          created_at: new Date(order.createdAt).toISOString()
        })
    }
    
    return new Response(JSON.stringify({
      orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Orders fetch error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch orders',
      orders: [],
      count: 0,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Monitor and manage orders
async function handleMonitorOrders(supabase: any, apiKey: string, apiSecret: string, passphrase: string) {
  try {
    // Check if AMPL Manager is enabled
    const { data: settings } = await supabase
      .from('settings')
      .select('content')
      .eq('id', 'ampl_manager')
      .single()
    
    if (!settings?.content?.enabled) {
      return new Response(JSON.stringify({
        message: 'AMPL Manager is disabled',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Get current price
    const priceData = await getAmplPrice()
    const currentPrice = priceData.price
    
    // Get active orders
    const activeOrders = await getKuCoinOrders(AMPL_SYMBOL, apiKey, apiSecret, passphrase)
    const buyOrders = activeOrders.filter(order => order.side === 'buy')
    
    // Check for missing buy order levels
    const missingLevels = []
    for (const level of AMPL_BUY_LEVELS) {
      if (level < currentPrice) {
        const hasOrderAtLevel = buyOrders.some(order => 
          Math.abs(parseFloat(order.price) - level) < 0.01
        )
        
        if (!hasOrderAtLevel) {
          missingLevels.push(level)
        }
      }
    }
    
    // Place missing buy orders
    const ordersPlaced = []
    for (const level of missingLevels) {
      try {
        const orderResult = await placeKuCoinOrder({
          symbol: AMPL_SYMBOL,
          side: 'buy',
          type: 'limit',
          size: AMPL_ORDER_SIZE,
          price: level.toString()
        }, apiKey, apiSecret, passphrase)
        
        if (orderResult.orderId) {
          ordersPlaced.push({
            level,
            orderId: orderResult.orderId,
            price: level,
            size: AMPL_ORDER_SIZE
          })
          
          // Store in Supabase
          await supabase
            .from('orders')
            .insert({
              id: orderResult.orderId,
              content: {
                symbol: AMPL_SYMBOL,
                side: 'buy',
                type: 'limit',
                size: AMPL_ORDER_SIZE,
                price: level.toString(),
                status: 'active',
                level: AMPL_BUY_LEVELS.indexOf(level) + 1
              },
              created_at: new Date().toISOString()
            })
        }
      } catch (error) {
        console.error(`Failed to place order at $${level}:`, error)
      }
    }
    
    return new Response(JSON.stringify({
      current_price: currentPrice,
      active_buy_orders: buyOrders.length,
      missing_levels: missingLevels,
      orders_placed: ordersPlaced,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Monitor error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to monitor orders',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Helper Functions for KuCoin API

// Get AMPL price (public endpoint)
async function getAmplPrice() {
  const response = await fetch(`${KUCOIN_API_BASE}/api/v1/market/orderbook/level1?symbol=${AMPL_SYMBOL}`)
  const data = await response.json()
  
  if (!data.data) {
    throw new Error('Invalid price response')
  }
  
  return {
    price: parseFloat(data.data.price),
    bid: parseFloat(data.data.bestBid),
    ask: parseFloat(data.data.bestAsk)
  }
}

// Get KuCoin balance with authentication
async function getKuCoinBalance(currency: string, apiKey: string, apiSecret: string, passphrase: string) {
  const timestamp = Date.now().toString()
  const endpoint = '/api/v1/accounts'
  const method = 'GET'
  
  const signature = await generateKuCoinSignature(timestamp, method, endpoint, '', apiSecret)
  const passphraseSignature = await generateKuCoinPassphrase(passphrase, apiSecret)
  
  const response = await fetch(`${KUCOIN_API_BASE}${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphraseSignature,
      'KC-API-KEY-VERSION': '2'
    }
  })
  
  const data = await response.json()
  
  if (!data.data) {
    throw new Error(`Balance API error: ${data.msg || 'Unknown error'}`)
  }
  
  // Find the trading account for the specified currency
  const account = data.data.find((acc: any) => 
    acc.currency === currency && acc.type === 'trade'
  )
  
  return account || { currency, available: '0.00', hold: '0.00', balance: '0.00' }
}

// Get active orders
async function getKuCoinOrders(symbol: string, apiKey: string, apiSecret: string, passphrase: string) {
  const timestamp = Date.now().toString()
  const endpoint = `/api/v1/orders?status=active&symbol=${symbol}`
  const method = 'GET'
  
  const signature = await generateKuCoinSignature(timestamp, method, endpoint, '', apiSecret)
  const passphraseSignature = await generateKuCoinPassphrase(passphrase, apiSecret)
  
  const response = await fetch(`${KUCOIN_API_BASE}${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphraseSignature,
      'KC-API-KEY-VERSION': '2'
    }
  })
  
  const data = await response.json()
  
  if (!data.data) {
    throw new Error(`Orders API error: ${data.msg || 'Unknown error'}`)
  }
  
  return data.data.items || []
}

// Place order
async function placeKuCoinOrder(orderData: any, apiKey: string, apiSecret: string, passphrase: string) {
  const timestamp = Date.now().toString()
  const endpoint = '/api/v1/orders'
  const method = 'POST'
  const body = JSON.stringify({
    clientOid: `ampl_${Date.now()}`,
    ...orderData
  })
  
  const signature = await generateKuCoinSignature(timestamp, method, endpoint, body, apiSecret)
  const passphraseSignature = await generateKuCoinPassphrase(passphrase, apiSecret)
  
  const response = await fetch(`${KUCOIN_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphraseSignature,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json'
    },
    body
  })
  
  const data = await response.json()
  
  if (!data.data) {
    throw new Error(`Order API error: ${data.msg || 'Unknown error'}`)
  }
  
  return data.data
}

// Generate KuCoin signature
async function generateKuCoinSignature(timestamp: string, method: string, endpoint: string, body: string, secret: string) {
  const message = timestamp + method + endpoint + body
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// Generate KuCoin passphrase signature
async function generateKuCoinPassphrase(passphrase: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(passphrase))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

