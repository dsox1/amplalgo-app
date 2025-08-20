const API_KEY = "680577fd26d5c60001c64761";
const API_SECRET = "407053e3-0d5a-491b-ae02-f168021b0e86";
const PASSPHRASE = "Dsox1234";

function base64Hmac(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then(key => crypto.subtle.sign("HMAC", key, msgData))
    .then(sig => btoa(String.fromCharCode(...new Uint8Array(sig))));
}

async function getBalance() {
  const endpoint = "/api/v1/accounts";
  const url = "https://api.kucoin.com" + endpoint;
  const timestamp = Date.now().toString();

  const strToSign = timestamp + "GET" + endpoint;
  const signature = await base64Hmac(strToSign, API_SECRET);
  const encryptedPassphrase = await base64Hmac(PASSPHRASE, API_SECRET);

  const headers = {
    "KC-API-KEY": API_KEY,
    "KC-API-SIGN": signature,
    "KC-API-TIMESTAMP": timestamp,
    "KC-API-PASSPHRASE": encryptedPassphrase,
    "KC-API-KEY-VERSION": "2",
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch(url, { method: "GET", headers });
    const json = await res.json();
    const usdt = json.data.find(a => a.currency === "USDT");
    document.getElementById("balance").textContent = `${usdt?.balance || "0"} USDT`;
  } catch (err) {
    document.getElementById("balance").textContent = `Error: ${err.message}`;
  }
}

getBalance();
