// Sector Mutators & Live Tactical Contracts (pure non-stop arcade flow, zero menu interruptions!)

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
    { id: 'graze', text: 'GRAZE 5 BULLETS', target: 5, reward: 'aegisOrbs', coins: 75, rewardLabel: 'SHIELD ORBS & +75' },
    { id: 'kills', text: 'DOWN 10 HOSTILES', target: 10, reward: 'lightning', coins: 70, rewardLabel: 'TESLA ARC & +70' },
    { id: 'combo', text: 'REACH ×4.0 COMBO', target: 4, reward: 'drone', coins: 85, rewardLabel: 'WINGMAN DRONE & +85' },
    { id: 'nohit', text: 'NO-HIT THIS WAVE', target: 1, reward: 'blackhole', coins: 110, rewardLabel: 'SINGULARITY & +110' },
  ];
  const tpl = templates[Math.abs(Math.floor(wave / 2) + seed * 11) % templates.length];
  return { ...tpl, progress: 0, wave, failed: false, done: false };
}

export const CREATIVE_DROP_KINDS = ['drone', 'lightning', 'ricochet', 'cryo', 'aegisOrbs', 'blackhole'];

export function pickCreativeDrop(seed = Math.random()) {
  const idx = Math.floor(Math.abs(seed * 997) % CREATIVE_DROP_KINDS.length);
  return CREATIVE_DROP_KINDS[idx];
}
