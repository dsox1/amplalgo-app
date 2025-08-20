const endpoint = "https://your-supabase-project.functions.supabase.co/get-usdt-balance";

fetch(endpoint)
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").textContent = `${data.usdtBalance} USDT`;
  })
  .catch(err => {
    document.getElementById("balance").textContent = `Error: ${err.message}`;
  });
