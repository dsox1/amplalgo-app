const API_URL = "https://your-supabase-edge-function-url"; // Replace with actual endpoint

async function fetchTradingData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    document.getElementById("price").textContent = data.amplPrice.toFixed(4);
    document.getElementById("usdt").textContent = data.usdtBalance.toFixed(2);
    document.getElementById("ampl").textContent = data.amplBalance.toFixed(2);

    const actionsList = document.getElementById("action-list");
    actionsList.innerHTML = "";

    if (data.actions && data.actions.length > 0) {
      data.actions.forEach(action => {
        const li = document.createElement("li");
        li.textContent = `Order placed at $${action.level.price} for ${action.level.quantity} AMPL (ID: ${action.orderId})`;
        actionsList.appendChild(li);
      });
    } else {
      actionsList.innerHTML = "<li>No new orders placed.</li>";
    }
  } catch (err) {
    console.error("Error fetching trading data:", err);
    document.getElementById("status").innerHTML = "<p>Error loading data.</p>";
  }
}

fetchTradingData();
