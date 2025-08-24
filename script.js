// install dependencies first:
// npm install node-fetch

import fetch from 'node-fetch';
import crypto from 'crypto';

const API_KEY = "680577fd26d5c60001c64761";
const API_SECRET = "407053e3-0d5a-491b-ae02-f168021b0e86";
const PASSPHRASE = "Dsox1234";

function sign(message, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
}

async function getBalance() {
  const endpoint = '/api/v1/accounts';
  const url = 'https://api.kucoin.com' + endpoint;
  const timestamp = Date.now().toString();

  // Sign request
  const strToSign = timestamp + 'GET' + endpoint;
  const signature = sign(strToSign, API_SECRET);
  const passphrase = sign(PASSPHRASE, API_SECRET);

  const headers = {
    'KC-API-KEY': API_KEY,
    'KC-API-SIGN': signature,
    'KC-API-TIMESTAMP': timestamp,
    'KC-API-PASSPHRASE': passphrase,
    'KC-API-KEY-VERSION': '2',
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(url, { method: 'GET', headers });
    const json = await res.json();
    console.log(json);

    // Example: find USDT balance
    const usdt = json.data?.find(a => a.currency === 'USDT');
    console.log(`USDT Balance: ${usdt?.balance || '0'}`);
  } catch (err) {
    console.error('Error fetching balance:', err.message);
  }
}

getBalance();
