class AmplTrapLadder {
  constructor() {
    this.trapLevels = [
      1.1600, 1.1212, 1.0838, 1.0126,
      0.9788, 0.9461, 0.9145, 0.8545
    ];
    this.trapStatus = {};
    this.cooldownMs = 60000; // reduced to 1 minute
    this.lastTriggeredAt = null;

    this.init();
  }

  init() {
    this.trapLevels.forEach(level => {
      const key = level.toFixed(4);
      this.trapStatus[key] = false;
    });

    this.syncTrapHistory();        // ✅ Sync trap history from Supabase
    this.monitorAMPL();           // ✅ Start periodic trap check
    this.monitorAMPLTick();       // ✅ Run check immediately
  }

  async monitorAMPLTick() {
    const price = window.currentAmplPrice;
    if (!price || isNaN(price)) return;
    this.checkTrapsAgainstPrice(price);
  }

  monitorAMPL() {
    setInterval(() => {
      const price = window.currentAmplPrice;
      if (!price || isNaN(price)) return;
      this.checkTrapsAgainstPrice(price);
    }, 60000); // check every 60 seconds
  }

  checkTrapsAgainstPrice(price) {
    this.trapLevels.forEach(level => {
      const key = level.toFixed(4);
      if (
        price <= level &&
        !this.trapStatus[key] &&
        this.cooldownPassed()
      ) {
        this.placeTrapBuy(level);
        this.trapStatus[key] = true;
        this.lastTriggeredAt = Date.now();
      }
    });
  }

  cooldownPassed() {
    if (!this.lastTriggeredAt) return true;
    return (Date.now() - this.lastTriggeredAt) > this.cooldownMs;
  }

  updateTrapBadge(priceKey, status = "filled") {
    const badge = document.querySelector(`.price-level-badge[data-price="${priceKey}"]`);
    if (badge) {
      badge.classList.remove("filled", "engaged", "vacant");
      badge.classList.add(status);
    }
  }

  async syncTrapHistory() {
    try {
      const traps = await window.db.getTrapOrders();
      const res = await fetch("/api/get-traps");
      const traps = await res.json();

      this.trapLevels.forEach((price) => {
        const priceKey = price.toFixed(4);
        const trap = traps.find((t) => t.price === price);
        const status = trap?.status || "vacant";
        this.updateTrapBadge(priceKey, status);
      });

      console.log("🧠 Trap history synced.");
    } catch (err) {
      console.warn("⚠️ Failed to sync trap history:", err);
    }
  }

  async placeTrapBuy(level) {
    const order = {
      symbol: "AMPL-USDT",
      side: "buy",
      type: "limit",
      price: level.toFixed(4),
      size: 0.1
    };

    console.log(`📬 Placing buy order: ${JSON.stringify(order)}`);

    const response = await fetch("/api/log-trap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: level,
        status: "filled",
        time_stamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log(`✅ Trap logged successfully at $${level.toFixed(4)}`);
      this.updateTrapBadge(level.toFixed(4), "filled");
    } else {
      console.warn("⚠️ Supabase trap log failed", await response.text());
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.amplTrapLadder = new AmplTrapLadder();
});
