// ── Init & Game Loop ──

function init() {
  addLog('System booting...');
  addLog('Welcome to Agentic Hero.', true);
  addLog('No humans detected. Perfect.');

  initShop();
  renderShop();
  updateDisplay();
  applyEraVisuals(0);

  setInterval(gameTick, 100);
}

function gameTick() {
  const lps = calcLocPerSec();
  if (lps > 0) {
    const gain = lps * 0.1; // 100ms tick
    state.loc += gain;
    state.totalLoc += gain;
    state.credits += gain / LOC_TO_CREDIT_RATIO;
  }
  const srps = calcSRPerSec();
  if (srps > 0) {
    const srGain = srps * 0.1;
    state.sr += srGain;
    state.totalSR += srGain;
  }
  updateDisplay();
  updateUpgradeButton();
  updateModelStats();
  renderShop();
}

init();
