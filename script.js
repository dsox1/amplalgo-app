const supabaseBaseURL = "https://yalzpcvh.manus.space/functions/v1/rebase-monitor";

async function fetchAMPLPrice() {
  try {
    const res = await fetch(`${supabaseBaseURL}?action=price`);
    const data = await res.json();
    document.getElementById("ampl-price").textContent = `$${data.price?.toFixed(4) || "0.0000"}`;
  } catch (err) {
    console.error("AMPL price fetch error:", err);
    document.getElementById("ampl-price").textContent = "$0.0000";
  }
}

async function fetchBalances() {
  try {
    const res = await fetch(`${supabaseBaseURL}?action=balance`);
    const data = await res.json();
    document.getElementById("usdt-balance").textContent = data.usdt || "0.00";
    document.getElementById("ampl-balance").textContent = data.ampl || "0.00";
  } catch (err) {
    console.error("Balance fetch error:", err);
    document.getElementById("usdt-balance").textContent = "0.00";
    document.getElementById("ampl-balance").textContent = "0.00";
  }
}

async function fetchRebaseStatus() {
  try {
    const res = await fetch(`${supabaseBaseURL}?action=rebase`);
    const data = await res.json();
    document.getElementById("next-rebase").textContent = data.nextRebase || "--";
    document.getElementById("rebase-probability").textContent = data.probability || "--";
  } catch (err) {
    console.error("Rebase fetch error:", err);
    document.getElementById("next-rebase").textContent = "--";
    document.getElementById("rebase-probability").textContent = "--";
  }
}

async function initDashboard() {
  await fetchAMPLPrice();
  await fetchBalances();
  await fetchRebaseStatus();
}

initDashboard();
