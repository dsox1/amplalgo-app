const supabaseBaseURL = "https://yalzpcvh.manus.space/functions/v1/ampl-manager";

async function fetchAMPLPrice() {
  const res = await fetch(`${supabaseBaseURL}/price`);
  const data = await res.json();
  document.getElementById("ampl-price").textContent = `$${data.price.toFixed(4)}`;
}

async function fetchBalances() {
  const res = await fetch(`${supabaseBaseURL}/balance`);
  const data = await res.json();
  document.getElementById("usdt-balance").textContent = data.usdt;
  document.getElementById("ampl-balance").textContent = data.ampl;
}

async function fetchRebaseStatus() {
  const res = await fetch(`${supabaseBaseURL}/rebase`);
  const data = await res.json();
  document.getElementById("next-rebase").textContent = data.nextRebase;
  document.getElementById("rebase-probability").textContent = data.probability;
}

async function initDashboard() {
  await fetchAMPLPrice();
  await fetchBalances();
  await fetchRebaseStatus();
}

initDashboard();
