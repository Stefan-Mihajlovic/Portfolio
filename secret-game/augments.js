// Roguelite Mid-Run Tactical Augments, Sector Mutators, Live Contracts & In-Arena Dilemma Gates

export const AUGMENTS = [
  {
    id: 'drone',
    name: 'Orbital Wingman',
    rarity: 'prototype',
    tag: 'CONSTRUCT',
    maxStacks: 2,
    desc: 'Deploys an autonomous plasma drone orbiting your ship that auto-fires at nearby foes.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="8" stroke-dasharray="4 4"/></svg>',
  },
  {
    id: 'arc',
    name: 'Chain Lightning',
    rarity: 'prototype',
    tag: 'SHOCK SYNERGY',
    maxStacks: 2,
    desc: 'Every 4th hit arcs jagged lightning to 2 nearby enemies for bonus shock damage.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  },
  {
    id: 'ricochet',
    name: 'Prism Ricochet',
    rarity: 'tactical',
    tag: 'BALLISTICS',
    maxStacks: 1,
    desc: 'Your main shots bounce cleanly off arena walls once, filling lanes with crossfire.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 12 4l8 16"/><path d="m17 14 3 6-6-2"/></svg>',
  },
  {
    id: 'novaBurst',
    name: 'Thermal Detonator',
    rarity: 'tactical',
    tag: 'CHAIN BLAST',
    maxStacks: 2,
    desc: 'Destroyed enemies detonate in a fiery shockwave, damaging adjacent ships.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2m0-14.2-2.2 2.2M7.1 16.9l-2.2 2.2"/></svg>',
  },
  {
    id: 'grazeAmp',
    name: 'Graze Reactor',
    rarity: 'prototype',
    tag: 'RISK / REWARD',
    maxStacks: 1,
    desc: 'Near-misses charge 2× Nova, cool barrels, and fire homing counter-sparks back.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><path d="M15 4h5v5"/></svg>',
  },
  {
    id: 'cryoShot',
    name: 'Cryo Payload',
    rarity: 'tactical',
    tag: 'CONTROL',
    maxStacks: 1,
    desc: 'Hits chill enemies with frost, slowing their flight speed and fire rate by 45%.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5"/><path d="m9 4 3 3 3-3m-6 16 3-3 3 3"/></svg>',
  },
  {
    id: 'phaseSlash',
    name: 'Phase Wake',
    rarity: 'prototype',
    tag: 'MOBILITY',
    maxStacks: 1,
    desc: 'Phase Dash vaporizes hostile bullets along your path and fires a 3-bolt plasma wake.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 17 6-5-6-5"/><path d="m11 17 6-5-6-5"/><path d="m18 15 3-3-3-3"/></svg>',
  },
  {
    id: 'siphon',
    name: 'Shield Siphon',
    rarity: 'tactical',
    tag: 'SUSTAIN',
    maxStacks: 1,
    desc: 'Every 18 enemies destroyed automatically regenerates +1 Shield pip.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3 4 6.5v5.5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6.5L12 3Z"/><path d="M12 8v8m-4-4h8"/></svg>',
  },
  {
    id: 'splitSeeker',
    name: 'Micro-Missile Pod',
    rarity: 'prototype',
    tag: 'ORDNANCE',
    maxStacks: 2,
    desc: 'Launches an automatic twin micro-seeker salvo every 2.2s while hostiles are present.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 2 16 10l-4 2-4-2 4-8Z"/><path d="M6 12 9 18l-3 2-3-2 3-6Z"/><path d="m18 12 3 6-3 2-3-2 3-6Z"/></svg>',
  },
  {
    id: 'glassCannon',
    name: 'Omega Overbore',
    rarity: 'omega',
    tag: 'HIGH RISK',
    maxStacks: 1,
    desc: '+45% Weapon Damage & -30% Heat build-up, at the cost of -1 Max Shield.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 19h20L12 2Z"/><path d="M12 9v4m0 3h.01"/></svg>',
  },
  {
    id: 'greed',
    name: 'Salvage Magnet',
    rarity: 'tactical',
    tag: 'ECONOMY',
    maxStacks: 1,
    desc: '+50% Coins & Shards, 2× pickup vacuum radius, and +15% score bonus.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 2 20 12 12 22 4 12 12 2Z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
  {
    id: 'ventNova',
    name: 'Thermal Purge',
    rarity: 'tactical',
    tag: 'HEAT ENGINE',
    maxStacks: 1,
    desc: 'Overheating unleashes a defensive bullet-clearing shockwave and cools 2× faster.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 2c2.5 3 5 5.6 5 9a5 5 0 1 1-10 0c0-1.9.9-3.6 2-5 0 2 1 3 2 3 .5-2.5 1-4.8 1-7Z"/></svg>',
  },
  {
    id: 'execute',
    name: 'Executioner Core',
    rarity: 'omega',
    tag: 'BOSS KILLER',
    maxStacks: 1,
    desc: '+60% bonus critical damage against Bosses, Aces & heavies below 45% armor.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>',
  },
  {
    id: 'staticOrb',
    name: 'Aegis Shield Orbs',
    rarity: 'omega',
    tag: 'DEFENSE',
    maxStacks: 1,
    desc: '2 orbiting energy spheres intercept & erase incoming enemy bullets (recharges every 5.5s).',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-25 12 12)"/><circle cx="6" cy="9" r="2.2" fill="currentColor"/><circle cx="18" cy="15" r="2.2" fill="currentColor"/></svg>',
  },
];

export function getAugmentById(id) {
  return AUGMENTS.find((a) => a.id === id) || null;
}

function makeRng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

export function pickAugmentDraft(ownedCounts = {}, seed = 1) {
  const pool = AUGMENTS.filter((a) => (ownedCounts[a.id] || 0) < (a.maxStacks || 1));
  const rng = makeRng(seed);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export const SECTOR_MUTATORS = [
  { id: 'salvage', label: 'SALVAGE BOOM // +45% COINS', coinMult: 1.45 },
  { id: 'volatileFoes', label: 'VOLATILE HULLS // FOES BLAST ON DEATH', explodeOnDeath: true },
  { id: 'hyperGraze', label: 'HYPER-GRAZE // 2× NOVA CHARGE', grazeMult: 2.0 },
  { id: 'turboDrive', label: 'ION TAILWIND // +16% SPEED & DASH', speedMult: 1.16 },
  { id: 'superCool', label: 'CRYO FRONT // -25% WEAPON HEAT', heatMult: 0.75 },
  { id: 'bounty', label: 'HIGH BOUNTY // +35% SCORE', scoreMult: 1.35 },
];

export function pickSectorMutator(sectorIndex, runSeed = 1) {
  if (sectorIndex <= 0) return null;
  const idx = Math.abs(sectorIndex * 7 + runSeed * 13) % SECTOR_MUTATORS.length;
  return SECTOR_MUTATORS[idx];
}

export function rollContract(wave, seed = 1) {
  const templates = [
    { id: 'graze', text: 'GRAZE 5 BULLETS', target: 5, reward: 'shield', coins: 75, rewardLabel: '+S & +75 COINS' },
    { id: 'kills', text: 'DOWN 10 HOSTILES', target: 10, reward: 'rapid', coins: 70, rewardLabel: 'RAPID FIRE & +70' },
    { id: 'combo', text: 'REACH ×4.0 COMBO', target: 4, reward: 'nova', coins: 85, rewardLabel: '+45% NOVA & +85' },
    { id: 'nohit', text: 'NO-HIT THIS WAVE', target: 1, reward: 'weapon', coins: 110, rewardLabel: 'WEAPON+ & +110' },
  ];
  const tpl = templates[Math.abs(Math.floor(wave / 2) + seed * 11) % templates.length];
  return { ...tpl, progress: 0, wave, failed: false, done: false };
}

export function rollDilemmaPair(seed = 1, w = 480) {
  const pairs = [
    {
      left: { id: 'rapid', title: 'OVERCHARGE', sub: 'RAPID FIRE 9s', color: '#8eff85' },
      right: { id: 'repair', title: 'REPAIR BAY', sub: '+1 SHIELD & COOL', color: '#79e3d5' },
    },
    {
      left: { id: 'bountyAce', title: 'HUNTER BOUNTY', sub: 'SPAWN ACE + 2× COINS', color: '#ff7a8a' },
      right: { id: 'overshield', title: 'SAFE CORRIDOR', sub: 'OVERSHIELD 7s', color: '#ffe27a' },
    },
    {
      left: { id: 'novaFull', title: 'NOVA SURGE', sub: 'INSTANT 100% NOVA', color: '#ffd485' },
      right: { id: 'weaponUp', title: 'ARMORY DROP', sub: 'WEAPON MK +1', color: '#88f0de' },
    },
    {
      left: { id: 'greedBurst', title: 'GOLD CACHE', sub: '+55 COINS + COOL', color: '#ffd66b' },
      right: { id: 'overdrive', title: 'OVERDRIVE', sub: 'HYPER MODE 7s', color: '#ffbe78' },
    },
  ];
  const pair = pairs[Math.abs(seed * 17) % pairs.length];
  const halfW = Math.min(110, Math.max(76, w * 0.24));
  return {
    y: -36,
    halfW,
    h: 34,
    leftX: Math.max(halfW + 14, w * 0.27),
    rightX: Math.min(w - halfW - 14, w * 0.73),
    left: pair.left,
    right: pair.right,
    resolved: false,
  };
}
