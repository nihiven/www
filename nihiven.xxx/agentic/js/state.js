// ── Game State ──
const state = {
  loc: 0,
  totalLoc: 0,
  credits: 0,
  locPerClick: 2,
  phase: 'download',       // 'download' -> 'install' -> 'prompting'
  modelLevel: 1,
  currentEra: 0,
  agents: {},              // agentId -> count
  hardware: ['gaming_laptop'],  // owned hardware IDs
  sr: 0,               // Simulated Realities (Black Hole era)
  totalSR: 0,
  gameComplete: false,
  startTime: Date.now(),
  totalClicks: 0,
};
