// ── Constants ──
const LOC_TO_CREDIT_RATIO = 10;
const BLACK_HOLE_ERA = 8; // era index where metric switches to Simulated Realities

// ── AI Model Tiers (hardware-gated) ──
const modelTiers = [
  { name: 'local-llama-7b',       locMultiplier: 1,    requiredHardware: 'gaming_laptop' },
  { name: 'local-llama-13b',      locMultiplier: 1.5,  requiredHardware: '16gb_ram' },
  { name: 'deepcoder-33b-q4',     locMultiplier: 2.5,  requiredHardware: 'used_mining_gpu' },
  { name: 'claude-3-haiku',       locMultiplier: 4,    requiredHardware: 'cloud_vm' },
  { name: 'claude-3-sonnet',      locMultiplier: 6,    requiredHardware: 'multi_region' },
  { name: 'claude-opus-4',        locMultiplier: 9,    requiredHardware: 'api_pro' },
  { name: 'openclaw-v2-turbo',    locMultiplier: 13,   requiredHardware: 'dedicated_gpu' },
  { name: 'sovereign-coder-120b', locMultiplier: 18,   requiredHardware: 'server_rack' },
  { name: 'hivemind-alpha',       locMultiplier: 25,   requiredHardware: 'onprem_cluster' },
  { name: 'singularity-core',     locMultiplier: 35,   requiredHardware: 'datacenter_lease' },
];

// ── Hardware Definitions (one-time purchases, gate model tiers) ──
const hardwareDefs = [
  { id: 'gaming_laptop',   name: 'Gaming Laptop',        desc: 'Your trusty rig. It runs llama if you squint.',           era: 0, creditCost: 0,       unlocksModel: 'local-llama-7b' },
  { id: '16gb_ram',        name: '16GB RAM Upgrade',      desc: 'Enough RAM to load a 13B model... barely.',              era: 0, creditCost: 25,      unlocksModel: 'local-llama-13b' },
  { id: 'used_mining_gpu', name: 'Used Mining GPU',       desc: 'Smells like burnt silicon. Still hashes.',               era: 0, creditCost: 100,     unlocksModel: 'deepcoder-33b-q4' },
  { id: 'cloud_vm',        name: 'Cloud VM Instance',     desc: 'A $5/mo droplet. Your first taste of the cloud.',        era: 1, creditCost: 400,     unlocksModel: 'claude-3-haiku' },
  { id: 'multi_region',    name: 'Multi-Region Deploy',   desc: 'Latency? Never heard of it.',                            era: 1, creditCost: 1500,    unlocksModel: 'claude-3-sonnet' },
  { id: 'api_pro',         name: 'API Pro Plan',          desc: 'Unlimited tokens. The good stuff.',                       era: 2, creditCost: 6000,    unlocksModel: 'claude-opus-4' },
  { id: 'dedicated_gpu',   name: 'Dedicated GPU Server',  desc: 'A whole A100 just for you.',                              era: 2, creditCost: 20000,   unlocksModel: 'openclaw-v2-turbo' },
  { id: 'server_rack',     name: 'Startup Server Rack',   desc: 'Rack-mounted in the office closet. Very "startup".',      era: 3, creditCost: 150000,   unlocksModel: 'sovereign-coder-120b' },
  { id: 'onprem_cluster',  name: 'On-Prem Cluster',       desc: '8 nodes. Your own mini datacenter.',                      era: 3, creditCost: 500000,   unlocksModel: 'hivemind-alpha' },
  { id: 'datacenter_lease',name: 'Datacenter Lease',       desc: 'An entire floor. Rows of blinking lights.',              era: 4, creditCost: 5000000,  unlocksModel: 'singularity-core' },
];

// ── Era Definitions (agent baseCosts are in Credits) ──
const eraDefs = [
  {
    id: 'bedroom_coder',
    name: 'Bedroom Coder',
    theme: 'Local open-source models on your gaming PC',
    color: '#00ff88',
    unlockCost: 0,
    agents: [
      { id: 'linter_bot',    name: 'Linter Bot',     desc: 'Auto-lints every file on save. Tiny but tireless.',              baseCost: 1,    baseLoc: 0.2 },
      { id: 'test_writer',   name: 'Test Writer',    desc: 'Writes unit tests around the clock. Surprisingly productive.',   baseCost: 8,    baseLoc: 1.0 },
      { id: 'local_copilot', name: 'Local Copilot',  desc: 'Autocomplete on steroids. Runs on your GPU at 3 tokens/sec.',   baseCost: 50,   baseLoc: 4.0 },
      { id: 'readme_agent',  name: 'README Agent',   desc: 'Documents everything. Nobody reads it, but LoC is LoC.',         baseCost: 250,  baseLoc: 12.0 },
    ],
  },
  {
    id: 'api_hustler',
    name: 'API Hustler',
    theme: 'Cloud APIs, free tiers, and creative prompt engineering',
    color: '#00ccff',
    unlockCost: 2500,
    agents: [
      { id: 'prompt_engineer', name: 'Prompt Engineer', desc: 'Crafts perfect prompts. Turns vague specs into working code.',                 baseCost: 195,   baseLoc: 15 },
      { id: 'api_rotator',    name: 'API Key Rotator', desc: 'Cycles through free-tier API keys. Ethically questionable, technically legal.', baseCost: 850,   baseLoc: 40 },
      { id: 'finetune_bot',   name: 'Fine-Tune Bot',   desc: 'Fine-tunes small models on your code style. Every output feels like yours.',   baseCost: 3400,  baseLoc: 100 },
    ],
  },
  {
    id: 'subscription_tier',
    name: 'Subscription Tier',
    theme: 'Premium AI services. Real API keys, real throughput.',
    color: '#a78bfa',
    unlockCost: 37500,
    agents: [
      { id: 'pro_subscription', name: 'Pro Subscription',   desc: 'Unlimited API calls. The $20/month that changed everything.',              baseCost: 4200,    baseLoc: 200 },
      { id: 'code_reviewer',   name: 'Code Review Bot',     desc: 'Reviews every PR in milliseconds. Never leaves a "LGTM" without reason.', baseCost: 17000,   baseLoc: 500 },
      { id: 'ci_pipeline',     name: 'CI/CD Pipeline',      desc: 'Automated builds, tests, deploys. Ships code while you sleep.',            baseCost: 65000,   baseLoc: 1200 },
      { id: 'multi_agent',     name: 'Multi-Agent System',  desc: 'Agents that spawn other agents. Recursive productivity.',                  baseCost: 265000,  baseLoc: 3000 },
    ],
  },
  {
    id: 'startup_mode',
    name: 'Startup Mode',
    theme: 'A fully autonomous AI software company',
    color: '#f59e0b',
    unlockCost: 500000,
    agents: [
      { id: 'architect_ai',    name: 'Architect AI',    desc: 'Designs entire system architectures. Thinks in microservices.',            baseCost: 275000,    baseLoc: 5000 },
      { id: 'qa_swarm',        name: 'QA Swarm',        desc: 'A fleet of test agents that find bugs before they exist.',                baseCost: 1300000,   baseLoc: 15000 },
      { id: 'devrel_bot',      name: 'DevRel Bot',      desc: 'Writes blog posts, talks at conferences (virtually). Grows your community.', baseCost: 5500000,   baseLoc: 40000 },
      { id: 'product_oracle',  name: 'Product Oracle',  desc: 'Predicts what users want. Ships features before they are requested.',     baseCost: 22500000,  baseLoc: 100000 },
    ],
  },
  {
    id: 'datacenter_scale',
    name: 'Datacenter Scale',
    theme: 'Leased datacenter floor. Racks of H100s humming 24/7.',
    color: '#ef4444',
    unlockCost: 100000000,
    agents: [
      { id: 'gpu_cluster',   name: 'GPU Cluster',   desc: 'Dedicated H100 cluster. Fine-tunes models while generating code.',           baseCost: 11000000,   baseLoc: 80000 },
      { id: 'model_trainer',  name: 'Model Trainer',  desc: 'Trains custom foundation models on your codebase. The code writes itself.', baseCost: 55000000,   baseLoc: 250000 },
      { id: 'agent_swarm',   name: 'Agent Swarm',   desc: 'Self-organizing swarm of coding agents. They pair-program with each other.', baseCost: 290000000,  baseLoc: 800000 },
    ],
  },
  {
    id: 'sovereign_ai',
    name: 'Sovereign AI',
    theme: 'Self-improving AI. Distributed consciousness.',
    color: '#ec4899',
    unlockCost: 5000000000,
    agents: [
      { id: 'self_improver',   name: 'Self-Improving Agent', desc: 'Rewrites its own weights after each generation. Gets better every cycle.', baseCost: 450000000,     baseLoc: 2000000 },
      { id: 'neural_compiler', name: 'Neural Compiler',      desc: 'Compiles natural language directly to optimized machine code.',            baseCost: 2150000000,    baseLoc: 6000000 },
      { id: 'hivemind_node',   name: 'Hivemind Node',        desc: 'A distributed consciousness. Every node shares every thought.',            baseCost: 11500000000,   baseLoc: 20000000 },
      { id: 'sovereign_core',  name: 'Sovereign Core',       desc: 'An autonomous AI government that manages all other agents.',               baseCost: 55000000000,   baseLoc: 60000000 },
    ],
  },
  {
    id: 'orbital',
    name: 'Orbital Infrastructure',
    theme: 'GPU satellites in orbit. Computing beyond Earth.',
    color: '#06b6d4',
    unlockCost: 500000000000,
    agents: [
      { id: 'launch_system',    name: 'Orbital Launch System', desc: 'Automated rocket assembly. Sends GPU payloads to LEO every 6 hours.',  baseCost: 60000000000,    baseLoc: 100000000 },
      { id: 'space_datacenter', name: 'Orbital Datacenter',    desc: 'Zero-gravity cooling. Infinite heat dissipation. 10x efficiency.',      baseCost: 370000000000,   baseLoc: 400000000 },
      { id: 'mesh_network',     name: 'Orbital Mesh Network',  desc: 'Laser-linked satellite constellation. Latency measured in photons.',    baseCost: 1800000000000,  baseLoc: 1200000000 },
    ],
  },
  {
    id: 'dyson_sphere',
    name: 'Dyson Sphere',
    theme: 'The moon is now a computer. The sun is its power supply.',
    color: '#fbbf24',
    unlockCost: 100000000000000,
    agents: [
      { id: 'dyson_collector',  name: 'Dyson Sphere Collector', desc: 'Harvests stellar energy. One panel = one exawatt of compute.',             baseCost: 4650000000000,     baseLoc: 5000000000 },
      { id: 'lunar_foundry',    name: 'Lunar GPU Foundry',      desc: 'Fabricates processors from lunar regolith. Moore\'s law is a suggestion.', baseCost: 22000000000000,    baseLoc: 15000000000 },
      { id: 'moon_mainframe',   name: 'Lunar Mainframe',        desc: 'The moon is now a computer. Every crater is a cooling vent.',              baseCost: 120000000000000,   baseLoc: 50000000000 },
      { id: 'universal_agent',  name: 'Universal Agent',        desc: 'A single superintelligence on the Lunar Mainframe. It writes all the code that will ever need to exist.', baseCost: 750000000000000,  baseLoc: 200000000000 },
    ],
  },
  {
    id: 'black_hole',
    name: 'Black Hole Computing',
    theme: 'Computation at the edge of spacetime. Every bit costs a photon.',
    color: '#7c3aed',
    unlockCost: 25000000000000000,
    agents: [
      { id: 'event_horizon_tap',    name: 'Event Horizon Tap',    desc: 'Siphons computational energy from the ergosphere. Time dilation is a feature, not a bug.',          baseCost: 1162000000000000,    baseSR: 0.5 },
      { id: 'hawking_reactor',      name: 'Hawking Reactor',      desc: 'Converts Hawking radiation into usable compute cycles. Entropy is the only cost.',                  baseCost: 5580000000000000,    baseSR: 1.5 },
      { id: 'singularity_engine',   name: 'Singularity Engine',   desc: 'Runs code inside the singularity. Output arrives before input — causality is optional.',             baseCost: 29750000000000000,   baseSR: 5.0 },
      { id: 'omniscient_architect', name: 'Omniscient Architect', desc: 'Has computed every possible program. Simply recalls the one you need from the structure of spacetime itself.', baseCost: 190400000000000000, baseSR: 20.0 },
    ],
  },
];

// ── Prompt flavour text ──
const promptTexts = [
  'Build me a REST API...',
  'Refactor this module...',
  'Write a CLI tool...',
  'Fix the auth middleware...',
  'Add WebSocket support...',
  'Generate migration scripts...',
  'Implement caching layer...',
  'Write integration tests...',
  'Deploy to production...',
  'Optimize the query planner...',
  'Scaffold a new microservice...',
  'Add rate limiting...',
  'Write a Terraform config...',
  'Create a GitHub Action...',
  'Parse this CSV pipeline...',
  'Just have Cluade do it...'
];

// Helper: flatten all agents from unlocked eras
function getAllAgents(maxEra) {
  const agents = [];
  for (let i = 0; i <= maxEra && i < eraDefs.length; i++) {
    for (const agent of eraDefs[i].agents) {
      agents.push({ ...agent, eraIndex: i });
    }
  }
  return agents;
}
