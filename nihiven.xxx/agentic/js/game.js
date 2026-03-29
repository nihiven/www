// ── Core Game Mechanics ──

let isProcessing = false;

function getCurrentModel() {
  const idx = Math.min(state.modelLevel - 1, modelTiers.length - 1);
  return modelTiers[idx];
}

function getClickReward() {
  return state.locPerClick * getCurrentModel().locMultiplier;
}

function getUpgradeCost() {
  return Math.floor(20 * Math.pow(4, state.modelLevel - 1));
}

function getCost(def, count) {
  return Math.floor(def.baseCost * Math.pow(1.15, count));
}

function getProduction(def) {
  if (def.baseSR !== undefined) return def.baseSR;
  return def.baseLoc * getCurrentModel().locMultiplier;
}

function isBlackHoleAgent(def) {
  return def.baseSR !== undefined;
}

function calcLocPerSec() {
  let total = 0;
  const agents = getAllAgents(state.currentEra);
  for (const def of agents) {
    if (isBlackHoleAgent(def)) continue;
    const count = state.agents[def.id] || 0;
    if (count > 0) total += count * getProduction(def);
  }
  return total;
}

function calcSRPerSec() {
  let total = 0;
  if (state.currentEra < BLACK_HOLE_ERA) return 0;
  const agents = getAllAgents(state.currentEra);
  for (const def of agents) {
    if (!isBlackHoleAgent(def)) continue;
    const count = state.agents[def.id] || 0;
    if (count > 0) total += count * getProduction(def);
  }
  return total;
}

// ── Main Action (Download / Install / Run Prompt) ──
function handleAction() {
  if (isProcessing) return;

  if (state.phase === 'download') {
    runWithProgress('Downloading agent...', 1200, () => {
      addLog('Agent package downloaded.', true);
      state.phase = 'install';
      document.getElementById('action-btn').textContent = 'Install Agent';
      document.getElementById('agent-status').innerHTML =
        'Package downloaded.<br><span class="highlight">Install the agent to continue.</span>';
    });
  } else if (state.phase === 'install') {
    runWithProgress('Installing dependencies...', 1500, () => {
      addLog('Agent installed and ready.', true);
      state.phase = 'prompting';
      enterPromptingPhase();
    });
  } else if (state.phase === 'prompting') {
    const reward = getClickReward();
    const creditReward = reward / LOC_TO_CREDIT_RATIO;
    state.loc += reward;
    state.totalLoc += reward;
    state.credits += creditReward;
    state.totalClicks++;
    spawnFloatLoc(reward, creditReward);
    const prompt = promptTexts[Math.floor(Math.random() * promptTexts.length)];
    addLog(`<span style="color:#445">$</span> ${prompt} <span class="success">+${formatNum(reward)} LoC</span> <span style="color:#ffbd2e">+${formatNum(creditReward)} $</span>`);
    updateDisplay();
  }
}

function enterPromptingPhase() {
  const btn = document.getElementById('action-btn');
  btn.textContent = 'Run Prompt';
  document.getElementById('agent-status').innerHTML =
    `Agent online. Model: <span class="highlight">${getCurrentModel().name}</span><br>` +
    '<span class="highlight">Click to run prompts and generate code!</span>';
  updateModelStats();
  updateUpgradeButton();
}

function updateModelStats() {
  const panel = document.getElementById('model-stats');
  if (state.phase !== 'prompting') {
    panel.innerHTML = '';
    return;
  }

  const current = getCurrentModel();
  const currentReward = getClickReward();

  let html = `
    <div class="model-row current">
      <div>
        <div class="mr-label">Current Model</div>
        <div class="mr-name">${current.name}</div>
      </div>
      <div class="mr-loc">+${formatNum(currentReward)} LoC</div>
    </div>
  `;

  // Show next model preview if not maxed
  if (state.modelLevel < modelTiers.length) {
    const next = modelTiers[state.modelLevel];
    const nextLocPerClick = Math.ceil(state.locPerClick * 1.2);
    const nextReward = nextLocPerClick * next.locMultiplier;
    const boost = nextReward / currentReward;
    const hasHardware = state.hardware.includes(next.requiredHardware);
    const hwDef = hardwareDefs.find(h => h.id === next.requiredHardware);

    let lockLabel = '';
    if (!hasHardware) {
      lockLabel = ` (needs ${hwDef.name})`;
    }

    html += `
      <div class="model-row next ${!hasHardware ? 'hw-locked' : ''}">
        <div>
          <div class="mr-label">Next${lockLabel}</div>
          <div class="mr-name">${next.name}</div>
        </div>
        <div>
          <span class="mr-loc">+${formatNum(nextReward)} LoC</span>
          <span class="mr-boost">${boost.toFixed(1)}x</span>
        </div>
      </div>
    `;
  }

  panel.innerHTML = html;
}

// ── Model Upgrade ──
function handleUpgrade() {
  if (isProcessing) return;
  const cost = getUpgradeCost();
  if (state.credits < cost) return;
  if (state.modelLevel >= modelTiers.length) return;

  // Check hardware gate
  const nextTier = modelTiers[state.modelLevel];
  if (!state.hardware.includes(nextTier.requiredHardware)) return;

  state.credits -= cost;

  const upgradeBtn = document.getElementById('upgrade-btn');
  upgradeBtn.textContent = 'Upgrading...';
  upgradeBtn.className = 'dim';

  runWithProgress('Upgrading model...', 1500, () => {
    state.modelLevel++;
    state.locPerClick = Math.ceil(state.locPerClick * 1.2);

    const model = getCurrentModel();
    addLog(`Model upgraded to <span class="highlight">${model.name}</span>! LoC per prompt increased.`, true);

    enterPromptingPhase();
    updateDisplay();
  });
}

function updateUpgradeButton() {
  const btn = document.getElementById('upgrade-btn');

  if (state.phase !== 'prompting') {
    btn.style.display = 'none';
    return;
  }

  if (state.modelLevel >= modelTiers.length) {
    btn.style.display = 'none';
    return;
  }

  const nextTier = modelTiers[state.modelLevel];
  const cost = getUpgradeCost();
  const hasHardware = state.hardware.includes(nextTier.requiredHardware);

  // Hardware-gated
  if (!hasHardware) {
    const hwDef = hardwareDefs.find(h => h.id === nextTier.requiredHardware);
    btn.style.display = '';
    btn.textContent = `Requires: ${hwDef.name}`;
    btn.className = 'dim';
    return;
  }

  btn.style.display = '';
  btn.textContent = `Upgrade Model (${formatNum(cost)} $)`;

  if (state.credits >= cost) {
    btn.className = '';
  } else {
    btn.className = 'dim';
  }
}

// ── Buy Agent ──
function buyAgent(id) {
  const agents = getAllAgents(state.currentEra);
  const def = agents.find(d => d.id === id);
  if (!def) return;

  const count = state.agents[id] || 0;
  const cost = getCost(def, count);
  if (state.credits < cost) return;

  state.credits -= cost;
  state.agents[id] = count + 1;
  addLog(`Deployed ${def.name} #${state.agents[id]}`, true);

  // Check if Universal Agent was purchased
  if (id === 'omniscient_architect' && !state.gameComplete) {
    state.gameComplete = true;
    addLog('ALL REALITIES HAVE BEEN COMPUTED.', true);
    setTimeout(() => showVictoryScreen(), 1500);
  }

  rebuildShop();
  updateDisplay();
}

// ── Buy Hardware ──
function buyHardware(id) {
  if (state.hardware.includes(id)) return;
  const def = hardwareDefs.find(h => h.id === id);
  if (!def) return;
  if (def.era > state.currentEra) return;
  if (def.creditCost > 0 && state.credits < def.creditCost) return;

  if (def.creditCost > 0) state.credits -= def.creditCost;
  state.hardware.push(id);
  addLog(`Hardware acquired: <span class="highlight">${def.name}</span>`, true);

  rebuildShop();
  updateDisplay();
  updateUpgradeButton();
  updateModelStats();
}

// ── Era Unlock ──
function unlockNextEra() {
  const nextIdx = state.currentEra + 1;
  if (nextIdx >= eraDefs.length) return;

  const era = eraDefs[nextIdx];
  if (state.totalLoc < era.unlockCost) return;

  state.currentEra = nextIdx;
  eraExpanded[nextIdx] = true;

  addLog(`<span style="color:${era.color}">ERA UNLOCKED: ${era.name}</span>`, true);
  addLog(era.theme, true);

  showEraBanner(era);
  applyEraVisuals(nextIdx);
  enterPromptingPhase();
  rebuildShop();
  updateDisplay();
}
