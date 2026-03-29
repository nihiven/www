// ── Number Formatting ──
function formatNum(n) {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + 'Q';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

// ── Display Updates ──
function updateDisplay() {
  const inBlackHole = state.currentEra >= BLACK_HOLE_ERA;
  const locLabel = document.getElementById('loc-label');
  const locRateLabel = document.getElementById('loc-rate-label');

  if (inBlackHole) {
    document.getElementById('loc-display').textContent = formatNum(state.totalSR);
    document.getElementById('loc-per-sec').textContent = formatNum(calcSRPerSec());
    if (locLabel) locLabel.textContent = 'Simulated Realities';
    if (locRateLabel) locRateLabel.textContent = 'SR / sec';
  } else {
    document.getElementById('loc-display').textContent = formatNum(state.totalLoc);
    document.getElementById('loc-per-sec').textContent = formatNum(calcLocPerSec());
    if (locLabel) locLabel.textContent = 'Lines of Code';
    if (locRateLabel) locRateLabel.textContent = 'LoC / sec';
  }

  document.getElementById('credits-display').textContent = formatNum(state.credits);

  let totalAgents = 0;
  for (const id in state.agents) totalAgents += state.agents[id];
  document.getElementById('agents-display').textContent = totalAgents;

  const era = eraDefs[state.currentEra];
  const eraEl = document.getElementById('era-display');
  eraEl.textContent = era.name;
  eraEl.style.color = era.color;
}

// ── Floating LoC + Credits Animation ──
function spawnFloatLoc(locAmount, creditAmount) {
  const btn = document.getElementById('action-btn');
  const rect = btn.getBoundingClientRect();

  // LoC float (green, left)
  const locEl = document.createElement('div');
  locEl.className = 'float-loc';
  locEl.textContent = '+' + formatNum(locAmount) + ' LoC';
  locEl.style.left = (rect.left + rect.width / 2 - 60) + 'px';
  locEl.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(locEl);
  setTimeout(() => locEl.remove(), 1000);

  // Credit float (gold, right)
  if (creditAmount > 0) {
    const crEl = document.createElement('div');
    crEl.className = 'float-credit';
    crEl.textContent = '+' + formatNum(creditAmount) + ' $';
    crEl.style.left = (rect.left + rect.width / 2 + 10) + 'px';
    crEl.style.top = (rect.top - 10) + 'px';
    document.body.appendChild(crEl);
    setTimeout(() => crEl.remove(), 1000);
  }
}

// ── Log ──
function addLog(msg, success = false) {
  const container = document.getElementById('log-container');
  const line = document.createElement('div');
  line.className = 'log-line';
  const ts = new Date().toTimeString().slice(0, 8);
  line.innerHTML = `<span class="ts">[${ts}]</span> <span class="msg${success ? ' success' : ''}">${msg}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
  while (container.children.length > 50) container.removeChild(container.firstChild);
}

// ── Progress Bar Helper ──
function runWithProgress(label, duration, onComplete) {
  isProcessing = true;
  const btn = document.getElementById('action-btn');
  btn.classList.add('processing');
  btn.textContent = label;

  const progressEl = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  progressEl.style.display = 'block';
  progressBar.style.width = '0%';

  const start = Date.now();
  const timer = setInterval(() => {
    const pct = Math.min(((Date.now() - start) / duration) * 100, 100);
    progressBar.style.width = pct + '%';
  }, 30);

  setTimeout(() => {
    clearInterval(timer);
    progressBar.style.width = '100%';
    progressEl.style.display = 'none';
    isProcessing = false;
    btn.classList.remove('processing');
    onComplete();
  }, duration);
}

// ── Era Unlock Banner ──
function showEraBanner(era) {
  const banner = document.getElementById('era-banner');
  const bannerName = document.getElementById('era-banner-name');
  const bannerTheme = document.getElementById('era-banner-theme');

  bannerName.textContent = era.name;
  bannerName.style.color = era.color;
  bannerTheme.textContent = era.theme;

  banner.style.display = 'flex';
  banner.classList.remove('fade-out');
  banner.classList.add('fade-in');

  setTimeout(() => {
    banner.classList.remove('fade-in');
    banner.classList.add('fade-out');
    setTimeout(() => { banner.style.display = 'none'; }, 600);
  }, 2500);
}

// ── Victory Screen ──
function showVictoryScreen() {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  let totalAgents = 0;
  for (const id in state.agents) totalAgents += state.agents[id];

  document.getElementById('victory-time').textContent = `${mins}m ${secs}s`;
  document.getElementById('victory-loc').textContent = formatNum(state.totalSR) + ' SR';
  document.getElementById('victory-agents').textContent = totalAgents;
  document.getElementById('victory-clicks').textContent = state.totalClicks.toLocaleString();
  document.getElementById('victory-overlay').style.display = 'flex';
}

// ── Era-specific Visual Effects ──
function applyEraVisuals(eraIndex) {
  const body = document.body;
  body.classList.remove('era-orbital', 'era-dyson', 'era-blackhole');

  if (eraIndex >= 6) body.classList.add('era-orbital');
  if (eraIndex >= 7) body.classList.add('era-dyson');
  if (eraIndex >= 8) body.classList.add('era-blackhole');

  const termTitle = document.querySelector('#terminal-titlebar span');
  if (eraIndex >= 5) termTitle.textContent = 'sovereign-core';
  else if (eraIndex >= 3) termTitle.textContent = 'startup-terminal';
  else termTitle.textContent = 'agent-terminal';

  const subtitles = [
    'Build your AI coding empire. No humans required.',
    'Cloud-connected. Rate-limited. Unstoppable.',
    'Premium tier unlocked. The code flows freely.',
    'STARTUP MODE ACTIVATED. All systems autonomous.',
    'Datacenter online. Cooling systems nominal.',
    'Your AI has achieved sovereignty.',
    'First payload in orbit. Ground control is optional.',
    'The moon is now a computer. The sun is its power supply.',
    'All code has been written. Now compute what lies beyond.',
  ];
  document.querySelector('#header .subtitle').textContent = subtitles[eraIndex] || subtitles[0];
}
