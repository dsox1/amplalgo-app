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

    // Enhanced logging for debugging
    console.log('Balance API called at:', new Date().toISOString());
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasPassphrase: !!passphrase,
      apiKeyLength: apiKey ? apiKey.length : 0
    });

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
        source: 'mock_data',
        debug: 'Credentials not configured in environment variables'
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

    console.log('Making KuCoin API request...');

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

    console.log('KuCoin API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('KuCoin API error:', response.status, errorText);
      throw new Error(`KuCoin API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('KuCoin API response code:', data.code);
    
    if (data.code !== '200000' || !data.data) {
      console.error('Invalid KuCoin API response:', data);
      throw new Error(`Invalid response from KuCoin API: ${data.msg || 'Unknown error'}`);
    }

    // Enhanced account finding logic
    const accounts = data.data;
    console.log(`Found ${accounts.length} accounts`);
    
    // Log all account types for debugging
    const accountTypes = [...new Set(accounts.map(acc => acc.type))];
    console.log('Available account types:', accountTypes);
    
    // Log USDT accounts for debugging
    const usdtAccounts = accounts.filter(acc => acc.currency === 'USDT');
    console.log('USDT accounts found:', usdtAccounts.map(acc => ({
      type: acc.type,
      balance: acc.balance,
      available: acc.available
    })));

    // Try to find USDT account in preferred order: trade, main, then any other type
    let usdtAccount = accounts.find(acc => acc.currency === 'USDT' && acc.type === 'trade');
    if (!usdtAccount) {
      usdtAccount = accounts.find(acc => acc.currency === 'USDT' && acc.type === 'main');
    }
    if (!usdtAccount) {
      // Fallback to any USDT account with a balance > 0
      usdtAccount = accounts.find(acc => acc.currency === 'USDT' && parseFloat(acc.balance || '0') > 0);
    }
    if (!usdtAccount) {
      // Final fallback to any USDT account
      usdtAccount = accounts.find(acc => acc.currency === 'USDT');
    }

    // Try to find AMPL account in preferred order: trade, main, then any other type
    let amplAccount = accounts.find(acc => acc.currency === 'AMPL' && acc.type === 'trade');
    if (!amplAccount) {
      amplAccount = accounts.find(acc => acc.currency === 'AMPL' && acc.type === 'main');
    }
    if (!amplAccount) {
      // Fallback to any AMPL account with a balance > 0
      amplAccount = accounts.find(acc => acc.currency === 'AMPL' && parseFloat(acc.balance || '0') > 0);
    }
    if (!amplAccount) {
      // Final fallback to any AMPL account
      amplAccount = accounts.find(acc => acc.currency === 'AMPL');
    }

    console.log('Selected accounts:', {
      usdt: usdtAccount ? { type: usdtAccount.type, balance: usdtAccount.balance } : null,
      ampl: amplAccount ? { type: amplAccount.type, balance: amplAccount.balance } : null
    });

    // Return the balance data
    const result = {
      usdt: {
        currency: 'USDT',
        balance: parseFloat(usdtAccount?.balance || '0'),
        available: usdtAccount?.available || '0.00',
        hold: usdtAccount?.holds || '0.00',
        accountType: usdtAccount?.type || 'not_found'
      },
      ampl: {
        currency: 'AMPL',
        balance: parseFloat(amplAccount?.balance || '0'),
        available: amplAccount?.available || '0.00',
        hold: amplAccount?.holds || '0.00',
        accountType: amplAccount?.type || 'not_found'
      },
      timestamp: new Date().toISOString(),
      source: 'kucoin',
      debug: {
        totalAccounts: accounts.length,
        accountTypes: accountTypes,
        usdtAccountsFound: usdtAccounts.length
      }
    };

    console.log('Returning balance data:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching balance:', error);
    
    // Return enhanced error information
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      message: error.message,
      timestamp: new Date().toISOString(),
      debug: 'Check Vercel function logs for detailed error information'
    });
  }
}

