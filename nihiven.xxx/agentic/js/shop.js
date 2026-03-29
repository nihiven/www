// ── Shop Rendering ──

const eraExpanded = {};

function initShop() {
  document.getElementById('shop-list').addEventListener('click', function(e) {
    // Era header toggle
    const header = e.target.closest('.era-header');
    if (header) {
      const eraIdx = parseInt(header.dataset.era);
      eraExpanded[eraIdx] = !eraExpanded[eraIdx];
      rebuildShop();
      return;
    }

    // Hardware card purchase
    const hwCard = e.target.closest('.hardware-card');
    if (hwCard && !hwCard.classList.contains('owned')) {
      const id = hwCard.dataset.hardwareId;
      if (id) buyHardware(id);
      return;
    }

    // Agent card purchase
    const card = e.target.closest('.upgrade-card');
    if (card) {
      const id = card.dataset.agentId;
      if (id) buyAgent(id);
    }
  });

  document.getElementById('era-unlock-btn').addEventListener('click', unlockNextEra);
}

// ── Structure snapshot: only things that require full DOM rebuild ──
let lastStructureSnapshot = '';

function getStructureSnapshot() {
  let s = `era:${state.currentEra}|hw:${state.hardware.join(',')}|`;
  for (let i = 0; i <= state.currentEra; i++) {
    s += `exp:${i}:${!!eraExpanded[i]}|`;
    for (const agent of eraDefs[i].agents) {
      s += `${agent.id}:${state.agents[agent.id] || 0}|`;
    }
  }
  return s;
}

function rebuildShop() {
  lastStructureSnapshot = getStructureSnapshot();

  const container = document.getElementById('shop-list');
  container.innerHTML = '';

  for (let i = state.currentEra; i >= 0; i--) {
    const era = eraDefs[i];
    const isCurrent = i === state.currentEra;

    if (!(i in eraExpanded)) eraExpanded[i] = isCurrent;
    const expanded = eraExpanded[i];

    // Era section header
    const header = document.createElement('div');
    header.className = 'era-header' + (isCurrent ? ' current' : '');
    header.dataset.era = i;
    header.innerHTML = `
      <span class="era-dot" style="background:${era.color}"></span>
      <span class="era-name" style="color:${era.color}">${era.name}</span>
      <span class="era-toggle">${expanded ? '▾' : '▸'}</span>
    `;
    container.appendChild(header);

    if (!expanded) continue;

    // Hardware cards for this era
    const eraHardware = hardwareDefs.filter(h => h.era === i);
    for (const hw of eraHardware) {
      const owned = state.hardware.includes(hw.id);
      const canAfford = !owned && state.credits >= hw.creditCost;

      const card = document.createElement('div');
      card.className = 'hardware-card' + (owned ? ' owned' : canAfford ? ' affordable' : '');
      card.dataset.hardwareId = hw.id;
      card.dataset.cost = hw.creditCost;

      if (owned) {
        card.innerHTML = `
          <div class="hw-header">
            <span class="hw-name">${hw.name}</span>
            <span class="hw-badge">Owned</span>
          </div>
          <div class="hw-desc">${hw.desc}</div>
          <span class="hw-unlocks">Unlocks: ${hw.unlocksModel}</span>
        `;
      } else {
        card.innerHTML = `
          <div class="hw-header">
            <span class="hw-name">${hw.name}</span>
          </div>
          <div class="hw-desc">${hw.desc}</div>
          <span class="hw-cost">${hw.creditCost > 0 ? formatNum(hw.creditCost) + ' $' : 'Free'}</span>
          <span class="hw-unlocks">Unlocks: ${hw.unlocksModel}</span>
        `;
      }
      container.appendChild(card);
    }

    // Agent cards for this era
    for (const def of era.agents) {
      const count = state.agents[def.id] || 0;
      const cost = getCost(def, count);
      const canAfford = state.credits >= cost;

      const card = document.createElement('div');
      card.className = 'upgrade-card' + (canAfford ? ' affordable' : '');
      card.dataset.agentId = def.id;
      card.dataset.cost = cost;

      card.innerHTML = `
        <div class="uc-header">
          <span class="uc-name">${def.name}</span>
          <span class="uc-count">x${count}</span>
        </div>
        <div class="uc-desc">${def.desc}</div>
        <span class="uc-cost">${formatNum(cost)} $</span>
        <span class="uc-production">+${formatNum(getProduction(def))}${isBlackHoleAgent(def) ? ' SR' : ' LoC'}/s each</span>
      `;
      container.appendChild(card);
    }
  }
}

// Lightweight tick update — just toggle CSS classes
function updateShopAffordability() {
  const agentCards = document.querySelectorAll('#shop-list .upgrade-card');
  for (const card of agentCards) {
    const cost = parseFloat(card.dataset.cost);
    const canAfford = state.credits >= cost;
    card.classList.toggle('affordable', canAfford);
  }

  const hwCards = document.querySelectorAll('#shop-list .hardware-card');
  for (const card of hwCards) {
    if (card.classList.contains('owned')) continue;
    const cost = parseFloat(card.dataset.cost);
    const canAfford = state.credits >= cost;
    card.classList.toggle('affordable', canAfford);
  }
}

function renderShop() {
  const snapshot = getStructureSnapshot();
  if (snapshot !== lastStructureSnapshot) {
    rebuildShop();
  } else {
    updateShopAffordability();
  }
  updateEraUnlockUI();
}

function updateEraUnlockUI() {
  const btn = document.getElementById('era-unlock-btn');
  const progressContainer = document.getElementById('era-progress-container');
  const progressBar = document.getElementById('era-progress-bar');
  const progressLabel = document.getElementById('era-progress-label');

  const nextEraIdx = state.currentEra + 1;

  if (nextEraIdx >= eraDefs.length) {
    btn.style.display = 'none';
    progressContainer.style.display = 'none';
    progressLabel.textContent = 'ALL ERAS UNLOCKED';
    progressLabel.style.display = 'block';
    return;
  }

  const nextEra = eraDefs[nextEraIdx];
  const cost = nextEra.unlockCost;
  const progress = Math.min(state.totalLoc / cost, 1);

  progressContainer.style.display = 'block';
  progressBar.style.width = (progress * 100) + '%';
  progressBar.style.background = `linear-gradient(90deg, ${nextEra.color}, ${nextEra.color}88)`;
  progressLabel.style.display = 'block';
  progressLabel.textContent = `${formatNum(state.totalLoc)} / ${formatNum(cost)} LoC`;
  progressLabel.style.color = nextEra.color;

  if (state.totalLoc >= cost) {
    btn.style.display = 'block';
    btn.textContent = `Unlock: ${nextEra.name}`;
    btn.style.borderColor = nextEra.color;
    btn.style.color = nextEra.color;
  } else {
    btn.style.display = 'none';
  }
}
