// Vercel API route for AMPL price
// This file should be placed at /api/ampl/price.js in your Vercel project

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // KuCoin API endpoint for AMPL-USDT ticker
    const kucoinUrl = 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=AMPL-USDT';
    
    const response = await fetch(kucoinUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`KuCoin API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== '200000' || !data.data) {
      throw new Error('Invalid response from KuCoin API');
    }

    // Extract the current price (using the best ask price)
    const price = parseFloat(data.data.price);
    
    if (isNaN(price)) {
      throw new Error('Invalid price data received');
    }

    // Return the price data
    res.status(200).json({
      price: price,
      symbol: 'AMPL-USDT',
      timestamp: new Date().toISOString(),
      source: 'kucoin'
    });

  } catch (error) {
    console.error('Error fetching AMPL price:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AMPL price',
      message: error.message 
    });
  }
}

