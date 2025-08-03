// Make all element updates safer with null checks
const originalSetTextContent = function(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.log(`⚠️ Element '${elementId}' not found, skipping update`);
    }
};

// Override the problematic function
window.safeUpdateElement = originalSetTextContent;

console.log('✅ Added safe element update function');




document.addEventListener("DOMContentLoaded", function() {
  function updateStats() {
    // Mock values (replace with real APIs or Supabase queries)
    document.getElementById("invested-amount").textContent = "$1,200.00";
    document.getElementById("portfolio-value").textContent = "$1,340.00";
    document.getElementById("total-profit").textContent = "$140.00 (11.67%)";

    document.getElementById("ampl-qty").textContent = "482.100";
    document.getElementById("current-price").textContent = "$1.192";
    document.getElementById("next-rebase").textContent = "2h 10m";

    //document.getElementById("orders-open").textContent = "4";
    document.getElementById("orders-pending").textContent = "2";
    document.getElementById("trapped-value").textContent = "$95.20";
  }

  updateStats();
  setInterval(updateStats, 10000);
});




document.addEventListener("DOMContentLoaded", () => {
  const toggleCheckbox = document.getElementById("show-ladder-panel");
  const thirdRowPanel = document.getElementById("third-row-panel");

  if (toggleCheckbox && thirdRowPanel) {
    toggleCheckbox.addEventListener("change", () => {
      thirdRowPanel.style.display = toggleCheckbox.checked ? "grid" : "none";
    });

    // Init state on load
    thirdRowPanel.style.display = toggleCheckbox.checked ? "grid" : "none";
  }
});
