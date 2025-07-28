class AmplTrapLadder {
  constructor() {
    this.trapLevels = [
      1.1600, 1.1212, 1.0838, 1.0126,
      0.9788, 0.9461, 0.9145, 0.8545
    ];
    this.trapStatus = {}; // Keeps track of which traps are filled
    this.cooldownMs = 120000; // Optional: prevent rapid rebuys
    this.lastTriggeredAt = null;

    this.init();
  }

  init() {
    // Mark all traps as unfilled initially
    this.trapLevels.forEach(level => {
      this.trapStatus[level.toFixed(4)] = false;
    });

    // Start monitoring
    this.monitorAMPL();
  }

  async monitorAMPL() {
    setInterval(async () => {
      const currentPrice = await this.fetchAmplPrice();
      if (!currentPrice) return;

      this.trapLevels.forEach(level => {
        const priceKey = level.toFixed(4);
        if (
          currentPrice <= level &&
          !this.trapStatus[priceKey] &&
          this.cooldownPassed()
        ) {
          this.placeTrapBuy(level);
          this.trapStatus[priceKey] = true;
          this.lastTriggeredAt = Date.now();
          console.log(`💸 Trap triggered at $${priceKey}`);
        }
      });
    }, 5000);
  }

  cooldownPassed() {
    if (!this.lastTriggeredAt) return true;
    return (Date.now() - this.lastTriggeredAt) > this.cooldownMs;
  }

async fetchAmplPrice() {
  const price = window.currentAmplPrice;
  if (!price || isNaN(price)) return null;
  return parseFloat(price);
}


async placeTrapBuy(level) {
  const order = {
    symbol: 'AMPL-USDT',
    side: 'buy',
    type: 'limit',
    price: level.toFixed(4),
    size: 0.1
  };

  // Simulate order
  console.log(`📬 Placing buy order: ${JSON.stringify(order)}`);

  // Log to Supabase
  const response = await fetch("https://fbkcdirkshubectuvxzi.supabase.co/rest/v1/trap_orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "YOUR_SUPABASE_API_KEY", // 🔐 Replace with your project key
      "Authorization": "Bearer YOUR_SUPABASE_API_KEY"
    },
    body: JSON.stringify({
      price: level,
      status: "filled",
      time_stamp: new Date().toISOString()
    })
  });

  if (response.ok) {
    console.log(`✅ Trap logged successfully at $${level.toFixed(4)}`);
    this.updateTrapBadge(level.toFixed(4));
  } else {
    console.warn("⚠️ Supabase log failed", await response.text());
  }
}






// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.amplTrapLadder = new AmplTrapLadder();
});
