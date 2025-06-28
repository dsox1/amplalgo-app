// Vercel API route for KuCoin balance
// This file should be placed at /api/ampl/balance.js in your Vercel project

import crypto from 'crypto';

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
    // Get KuCoin API credentials from environment variables
    const apiKey = process.env.KUCOIN_API_KEY;
    const apiSecret = process.env.KUCOIN_API_SECRET;
    const passphrase = process.env.KUCOIN_PASSPHRASE;

    if (!apiKey || !apiSecret || !passphrase) {
      // Return mock data if credentials are not configured
      console.log('KuCoin credentials not configured, returning mock data');
      return res.status(200).json({
        usdt: {
          currency: 'USDT',
          balance: 1000.0,
          available: '950.00',
          hold: '50.00'
        },
        ampl: {
          currency: 'AMPL',
          balance: 500.0,
          available: '480.00',
          hold: '20.00'
        },
        timestamp: new Date().toISOString(),
        source: 'mock_data'
      });
    }

    // KuCoin API authentication
    const timestamp = Date.now().toString();
    const method = 'GET';
    const endpoint = '/api/v1/accounts';
    const queryString = '';
    
    // Create signature
    const what = timestamp + method + endpoint + queryString;
    const key = Buffer.from(apiSecret, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    const signature = hmac.update(what).digest('base64');
    
    // Encrypt passphrase
    const passphraseHmac = crypto.createHmac('sha256', apiSecret);
    const encryptedPassphrase = passphraseHmac.update(passphrase).digest('base64');

    const response = await fetch(`https://api.kucoin.com${endpoint}`, {
      method: 'GET',
      headers: {
        'KC-API-KEY': apiKey,
        'KC-API-SIGN': signature,
        'KC-API-TIMESTAMP': timestamp,
        'KC-API-PASSPHRASE': encryptedPassphrase,
        'KC-API-KEY-VERSION': '2',
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

    // Find USDT and AMPL balances
    const accounts = data.data;
    const usdtAccount = accounts.find(acc => acc.currency === 'USDT' && acc.type === 'trade');
    const amplAccount = accounts.find(acc => acc.currency === 'AMPL' && acc.type === 'trade');

    // Return the balance data
    res.status(200).json({
      usdt: {
        currency: 'USDT',
        balance: parseFloat(usdtAccount?.balance || '0'),
        available: usdtAccount?.available || '0.00',
        hold: usdtAccount?.holds || '0.00'
      },
      ampl: {
        currency: 'AMPL',
        balance: parseFloat(amplAccount?.balance || '0'),
        available: amplAccount?.available || '0.00',
        hold: amplAccount?.holds || '0.00'
      },
      timestamp: new Date().toISOString(),
      source: 'kucoin'
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      message: error.message 
    });
  }
}

