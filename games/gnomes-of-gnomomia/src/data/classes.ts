// Classes, their abilities and talents, transcribed from docs/design/gnomomia/classes.md.
import type { AbilityDef, ClassDef, ClassId, TalentDef } from '../config';

// ---------------------------------------------------------------- Warden base kit + talent actives

const WARDEN_ABILITIES: readonly AbilityDef[] = [
  { id: 'bash', name: 'Bash', icon: '🔨', level: 5, cost: 20, cooldown: 6, castTime: 0, kind: 'attack', damageType: 'crush', power: 1.3, status: 'staggered', statusSeconds: 1, about: '130% weapon, Crush, Stagger 1 s. 6 s cd. Rank 2 at L12, rank 3 at L20 (+20% each).' },
  { id: 'hold-the-line', name: 'Hold the Line', icon: '🛡', level: 6, cost: 0, cooldown: 0, castTime: 0, kind: 'passive', about: 'Can use plate and shields' },
  { id: 'hedge-charge', name: 'Hedge Charge', icon: '🏃', level: 8, cost: 0, cooldown: 15, castTime: 0, kind: 'move', radius: 10, status: 'staggered', statusSeconds: 1, about: 'Rush to a target up to 10 m away, Stagger 1 s, +15 Grit. 15 s cd.' },
  { id: 'rallying-shout', name: 'Rallying Shout', icon: '📣', level: 10, cost: 30, cooldown: 0, castTime: 0, kind: 'buff', power: 0.1, about: '+10% damage to you and nearby allies for 30 s' },
  { id: 'second-wind', name: 'Second Wind', icon: '💨', level: 14, cost: 50, cooldown: 90, castTime: 0, kind: 'heal', power: 0.25, about: 'Heal 25% max HP over 6 s. 90 s cd.' },
  { id: 'challenge', name: 'Challenge', icon: '😤', level: 18, cost: 0, cooldown: 20, castTime: 0, kind: 'buff', about: 'Co-op: enemies target you for 6 s. Solo: target\'s accuracy −2 vs you. 20 s cd.' },
  { id: 'sunder', name: 'Sunder', icon: '💥', level: 22, cost: 25, cooldown: 0, castTime: 0, kind: 'attack', status: 'cracked', statusSeconds: 8, about: 'Cracked (−25% armor) for 8 s' },
  { id: 'last-stand', name: 'Last Stand', icon: '🏁', level: 26, cost: 0, cooldown: 180, castTime: 0, kind: 'buff', power: 0.3, about: '+30% max HP for 20 s. 3 min cd.' },
  { id: 'shield-slam', name: 'Shield Slam', icon: '🥫', level: 1, cost: 30, cooldown: 12, castTime: 0, kind: 'attack', damageType: 'crush', power: 1.0, status: 'stunned', statusSeconds: 2, fromTalent: 'warden-shield-slam', about: 'Crush = 100% weapon + half your shield\'s armor, Stun 2 s. 12 s cd.' },
  { id: 'trim', name: 'Trim', icon: '✂', level: 1, cost: 20, cooldown: 0, castTime: 0, kind: 'attack', power: 0.8, status: 'chipped', statusSeconds: 6, fromTalent: 'warden-trim', about: '80% weapon now plus Chipped for 80% over 6 s' },
  { id: 'sod-buster', name: 'Sod Buster', icon: '🌱', level: 1, cost: 35, cooldown: 8, castTime: 0, kind: 'attack', power: 1.2, radius: 4, status: 'slowed', statusSeconds: 4, fromTalent: 'warden-sod-buster', about: 'Slam the ground, 120% weapon to everything within 4 m, Slowed 4 s. 8 s cd.' },
  { id: 'topiary', name: 'Topiary', icon: '🌿', level: 1, cost: 50, cooldown: 10, castTime: 0, kind: 'attack', power: 1.5, radius: 3, fromTalent: 'warden-topiary', about: 'Spin, 150% weapon to everything within 3 m, and Trim each. 10 s cd.' },
  { id: 'gnome-smash', name: 'Gnome Smash', icon: '💫', level: 1, cost: 60, cooldown: 30, castTime: 0, kind: 'attack', power: 2.5, radius: 3, status: 'stunned', statusSeconds: 3, fromTalent: 'warden-gnome-smash', about: 'Leap up to 12 m, 250% weapon to everything within 3 m, Stun 3 s. 30 s cd.' },
];

// ---------------------------------------------------------------- Slinger base kit + talent actives

const SLINGER_ABILITIES: readonly AbilityDef[] = [
  { id: 'aimed-shot', name: 'Aimed Shot', icon: '🎯', level: 5, cost: 40, cooldown: 0, castTime: 1.5, kind: 'attack', power: 1.9, about: '1.5 s cast, 190% weapon. Ranks at L12 and L20 (+20% each).' },
  { id: 'ammo-pouch', name: 'Ammo Pouch', icon: '👝', level: 6, cost: 0, cooldown: 0, castTime: 0, kind: 'passive', about: 'Leather; choose an ammo type' },
  { id: 'scramble', name: 'Scramble', icon: '🍃', level: 8, cost: 20, cooldown: 12, castTime: 0, kind: 'move', radius: 6, about: 'Leap back 6 m. 12 s cd.' },
  { id: 'pebble-spray', name: 'Pebble Spray', icon: '⚫', level: 10, cost: 50, cooldown: 0, castTime: 0, kind: 'attack', power: 0.8, radius: 6, about: 'Cone, 6 m: 80% weapon to everything' },
  { id: 'mark-quarry', name: 'Mark Quarry', icon: '🔖', level: 14, cost: 10, cooldown: 0, castTime: 0, kind: 'buff', status: 'marked', statusSeconds: 20, about: 'Target takes +10% from all sources for 20 s' },
  { id: 'pinning-shot', name: 'Pinning Shot', icon: '📌', level: 18, cost: 30, cooldown: 0, castTime: 0, kind: 'attack', status: 'rooted', statusSeconds: 3, about: 'Rooted 3 s' },
  { id: 'volley', name: 'Volley', icon: '🏹', level: 22, cost: 60, cooldown: 0, castTime: 0, kind: 'attack', power: 0.6, radius: 5, about: '5 m circle at range: 3 waves of 60% weapon' },
  { id: 'steady-breath', name: 'Steady Breath', icon: '🌬', level: 26, cost: 0, cooldown: 120, castTime: 0, kind: 'buff', about: 'Focus regen ×2 for 10 s. 2 min cd.' },
  { id: 'bullseye', name: 'Bullseye', icon: '🎯', level: 1, cost: 40, cooldown: 20, castTime: 0, kind: 'attack', fromTalent: 'slinger-bullseye', about: 'Instant shot that always crits. 20 s cd.' },
  { id: 'thistle-volley', name: 'Thistle Volley', icon: '🌵', level: 1, cost: 35, cooldown: 0, castTime: 0, kind: 'attack', fromTalent: 'slinger-thistle-volley', about: '3 darts at up to 3 targets, each Poisons' },
  { id: 'burr-trap', name: 'Burr Trap', icon: '🪤', level: 1, cost: 25, cooldown: 15, castTime: 0, kind: 'trap', status: 'rooted', statusSeconds: 4, fromTalent: 'slinger-burr-trap', about: 'Lay a trap. The first enemy on it is Rooted 4 s and Chipped. Up to 2 traps, 15 s cd.' },
];

// ---------------------------------------------------------------- Hedge-Mage base kit + talent actives

const MAGE_ABILITIES: readonly AbilityDef[] = [
  { id: 'drizzle', name: 'Drizzle', icon: '🌧', level: 5, cost: 13, cooldown: 0, castTime: 1, kind: 'spell', damageType: 'rain', power: 0.6, status: 'soaked', statusSeconds: 6, about: '1 s cast: 60% of Flare\'s damage plus Soaked and Slowed for 6 s' },
  { id: 'root-snare', name: 'Root Snare', icon: '🌿', level: 6, cost: 14, cooldown: 15, castTime: 0, kind: 'spell', status: 'rooted', statusSeconds: 4, about: 'Rooted 4 s. 15 s cd.' },
  { id: 'sunbeam', name: 'Sunbeam', icon: '☀', level: 10, cost: 20, cooldown: 0, castTime: 3, kind: 'spell', damageType: 'sun', power: 0.8, about: 'Channel 3 s: 3 ticks of 80% Flare' },
  { id: 'puddle-step', name: 'Puddle Step', icon: '💧', level: 12, cost: 23, cooldown: 20, castTime: 0, kind: 'move', radius: 8, about: 'Blink 8 m. 20 s cd.' },
  { id: 'downpour', name: 'Downpour', icon: '⛈', level: 16, cost: 29, cooldown: 0, castTime: 0, kind: 'spell', damageType: 'rain', power: 0.25, radius: 5, status: 'soaked', statusSeconds: 6, about: '5 m circle for 6 s: 25% of Flare per second, Soaked' },
  { id: 'thin-glaze', name: 'Thin Glaze', icon: '🍯', level: 20, cost: 35, cooldown: 30, castTime: 0, kind: 'heal', power: 0.15, status: 'glazed', about: 'Absorb 15% max HP on yourself. 30 s cd.' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', level: 26, cost: 0, cooldown: 0, castTime: 0, kind: 'passive', about: 'Sun on a Soaked target makes Steam (2 s area blind) and +30% damage' },
  { id: 'heatwave', name: 'Heatwave', icon: '🔥', level: 1, cost: 7, cooldown: 10, castTime: 0, kind: 'attack', damageType: 'sun', power: 1.3, radius: 7, status: 'burning', fromTalent: 'mage-heatwave', about: 'Cone, 7 m: 130% Flare plus Burning. 10 s cd.' },
  { id: 'hailstone', name: 'Hailstone', icon: '🧊', level: 1, cost: 7, cooldown: 12, castTime: 0, kind: 'attack', damageType: 'rain', power: 1.2, status: 'stunned', statusSeconds: 2, fromTalent: 'mage-hailstone', about: '120% of Flare as Rain, Stun 2 s. 12 s cd.' },
  { id: 'thick-glaze', name: 'Thick Glaze', icon: '🟫', level: 1, cost: 7, cooldown: 25, castTime: 0, kind: 'heal', power: 0.3, status: 'glazed', statusSeconds: 10, fromTalent: 'mage-thick-glaze', about: 'Absorb 30% max HP on yourself or an ally for 10 s. 25 s cd.' },
  { id: 'thunderhead', name: 'Thunderhead', icon: '🌩', level: 1, cost: 7, cooldown: 45, castTime: 0, kind: 'summon', damageType: 'rain', power: 0.5, status: 'soaked', fromTalent: 'mage-thunderhead', about: 'A storm cloud follows you for 10 s and strikes the nearest enemy every second for 50% Flare (Rain), Soaking it. 45 s cd.' },
  { id: 'fairy-ring', name: 'Fairy Ring', icon: '🍄', level: 1, cost: 7, cooldown: 60, castTime: 0, kind: 'heal', power: 0.04, radius: 3, status: 'slowed', statusSeconds: 8, fromTalent: 'mage-fairy-ring', about: 'A ring of mushrooms for 8 s, 6 m wide: allies inside heal 4% max HP/s, enemies Slowed 50%. 60 s cd.' },
];

export const CLASSES: Record<ClassId, ClassDef> = {
  warden: { id: 'warden', name: 'Warden', primary: 'strength', resource: 'grit', armor: ['cloth', 'leather', 'plate', 'shield'], abilities: WARDEN_ABILITIES },
  slinger: { id: 'slinger', name: 'Slinger', primary: 'agility', resource: 'focus', armor: ['cloth', 'leather'], abilities: SLINGER_ABILITIES },
  mage: { id: 'mage', name: 'Hedge-Mage', primary: 'intelligence', resource: 'mana', armor: ['cloth'], abilities: MAGE_ABILITIES },
};

// ---------------------------------------------------------------- talents (3 classes x 3 branches x 6)

export const TALENTS: Record<string, TalentDef> = {
  // Warden: Bulwark
  'warden-thick-clay': { id: 'warden-thick-clay', classId: 'warden', branch: 'bulwark', tier: 1, maxRank: 3, name: 'Thick Clay', about: '+4% max HP per rank' },
  'warden-pot-lid-practice': { id: 'warden-pot-lid-practice', classId: 'warden', branch: 'bulwark', tier: 2, maxRank: 3, name: 'Pot-Lid Practice', about: '+1 Defense per rank with a shield (still capped at +6)' },
  'warden-shield-slam': { id: 'warden-shield-slam', classId: 'warden', branch: 'bulwark', tier: 3, maxRank: 1, name: 'Shield Slam', about: '30 Grit: Crush = 100% weapon + half your shield\'s armor, Stun 2 s. 12 s cd.', grants: 'shield-slam' },
  'warden-glazed-over': { id: 'warden-glazed-over', classId: 'warden', branch: 'bulwark', tier: 4, maxRank: 3, name: 'Glazed Over', about: '−3% damage taken per rank' },
  'warden-spiked-lid': { id: 'warden-spiked-lid', classId: 'warden', branch: 'bulwark', tier: 5, maxRank: 3, name: 'Spiked Lid', about: 'When an enemy misses you while you hold a shield, it takes 15% / 30% / 45% of your weapon average as Crush' },
  'warden-unbreakable': { id: 'warden-unbreakable', classId: 'warden', branch: 'bulwark', tier: 6, maxRank: 1, name: 'Unbreakable', about: 'A killing blow leaves you at 1 HP with 40% damage reduction for 6 s. 2 min cd. "You crack, but you hold."' },
  // Warden: Hedgecutter
  'warden-keen-edge': { id: 'warden-keen-edge', classId: 'warden', branch: 'hedgecutter', tier: 1, maxRank: 3, name: 'Keen Edge', about: '+3% Slash damage per rank' },
  'warden-quick-snips': { id: 'warden-quick-snips', classId: 'warden', branch: 'hedgecutter', tier: 2, maxRank: 3, name: 'Quick Snips', about: '−4% swing time per rank' },
  'warden-trim': { id: 'warden-trim', classId: 'warden', branch: 'hedgecutter', tier: 3, maxRank: 1, name: 'Trim', about: '20 Grit: 80% weapon now plus Chipped for 80% over 6 s', grants: 'trim' },
  'warden-double-snip': { id: 'warden-double-snip', classId: 'warden', branch: 'hedgecutter', tier: 4, maxRank: 3, name: 'Double Snip', about: '5% / 10% / 15% chance to swing twice' },
  'warden-deep-cuts': { id: 'warden-deep-cuts', classId: 'warden', branch: 'hedgecutter', tier: 5, maxRank: 3, name: 'Deep Cuts', about: 'Chipped deals +15% per rank. At rank 3, Chipped stacks twice.' },
  'warden-topiary': { id: 'warden-topiary', classId: 'warden', branch: 'hedgecutter', tier: 6, maxRank: 1, name: 'Topiary', about: '50 Grit: spin, 150% weapon to everything within 3 m, and Trim each. 10 s cd.', grants: 'topiary' },
  // Warden: Groundbreaker
  'warden-heavy-hands': { id: 'warden-heavy-hands', classId: 'warden', branch: 'groundbreaker', tier: 1, maxRank: 3, name: 'Heavy Hands', about: '+4% damage with two-handed weapons per rank' },
  'warden-tamp-down': { id: 'warden-tamp-down', classId: 'warden', branch: 'groundbreaker', tier: 2, maxRank: 3, name: 'Tamp Down', about: 'Crits Stagger for 1 s. At rank 3 they also Crack. (Ranks 1-2: +5% crit damage.)' },
  'warden-sod-buster': { id: 'warden-sod-buster', classId: 'warden', branch: 'groundbreaker', tier: 3, maxRank: 1, name: 'Sod Buster', about: '35 Grit: slam the ground, 120% weapon to everything within 4 m, Slowed 4 s. 8 s cd.', grants: 'sod-buster' },
  'warden-bedrock': { id: 'warden-bedrock', classId: 'warden', branch: 'groundbreaker', tier: 4, maxRank: 3, name: 'Bedrock', about: '+8% damage per rank against Staggered, Stunned or Slowed targets' },
  'warden-clod-thrower': { id: 'warden-clod-thrower', classId: 'warden', branch: 'groundbreaker', tier: 5, maxRank: 3, name: 'Clod Thrower', about: 'Bash also hits 1 / 2 / 3 extra enemies nearby for 50%' },
  'warden-gnome-smash': { id: 'warden-gnome-smash', classId: 'warden', branch: 'groundbreaker', tier: 6, maxRank: 1, name: 'Gnome Smash', about: '60 Grit: leap up to 12 m, 250% weapon to everything within 3 m, Stun 3 s. 30 s cd.', grants: 'gnome-smash' },
  // Slinger: Acorneer
  'slinger-hard-acorns': { id: 'slinger-hard-acorns', classId: 'slinger', branch: 'acorneer', tier: 1, maxRank: 3, name: 'Hard Acorns', about: '+3% ranged damage per rank' },
  'slinger-steady-hand': { id: 'slinger-steady-hand', classId: 'slinger', branch: 'acorneer', tier: 2, maxRank: 3, name: 'Steady Hand', about: 'Aimed Shot cast −0.2 s per rank' },
  'slinger-bullseye': { id: 'slinger-bullseye', classId: 'slinger', branch: 'acorneer', tier: 3, maxRank: 1, name: 'Bullseye', about: '40 Focus: instant shot that always crits. 20 s cd.', grants: 'bullseye' },
  'slinger-hawk-eye': { id: 'slinger-hawk-eye', classId: 'slinger', branch: 'acorneer', tier: 4, maxRank: 3, name: 'Hawk Eye', about: '+15% crit damage per rank (×2 becomes ×2.45)' },
  'slinger-long-shot': { id: 'slinger-long-shot', classId: 'slinger', branch: 'acorneer', tier: 5, maxRank: 3, name: 'Long Shot', about: '+1.5 m range per rank. Shots from beyond 8 m deal +5% per rank.' },
  'slinger-knockout': { id: 'slinger-knockout', classId: 'slinger', branch: 'acorneer', tier: 6, maxRank: 1, name: 'Knockout', about: '+1 crit range. Aimed Shot crits Stun for 2 s and reset Bullseye.' },
  // Slinger: Thornshot
  'slinger-nettle-darts': { id: 'slinger-nettle-darts', classId: 'slinger', branch: 'thornshot', tier: 1, maxRank: 3, name: 'Nettle Darts', about: 'Auto-shots have an 8% / 16% / 24% chance to Poison (40% weapon over 6 s)' },
  'slinger-quick-breath': { id: 'slinger-quick-breath', classId: 'slinger', branch: 'thornshot', tier: 2, maxRank: 3, name: 'Quick Breath', about: '−5% blowpipe swing time per rank' },
  'slinger-thistle-volley': { id: 'slinger-thistle-volley', classId: 'slinger', branch: 'thornshot', tier: 3, maxRank: 1, name: 'Thistle Volley', about: '35 Focus: 3 darts at up to 3 targets, each Poisons', grants: 'thistle-volley' },
  'slinger-creeping-rot': { id: 'slinger-creeping-rot', classId: 'slinger', branch: 'thornshot', tier: 4, maxRank: 3, name: 'Creeping Rot', about: 'Poison +15% per rank. At rank 3, Poison stacks to 4.' },
  'slinger-numbing-sap': { id: 'slinger-numbing-sap', classId: 'slinger', branch: 'thornshot', tier: 5, maxRank: 3, name: 'Numbing Sap', about: 'Poisoned enemies deal −4% damage per rank' },
  'slinger-hemlock': { id: 'slinger-hemlock', classId: 'slinger', branch: 'thornshot', tier: 6, maxRank: 1, name: 'Hemlock', about: 'Your shots deal double damage to Poisoned targets below 30% HP' },
  // Slinger: Trapper
  'slinger-snare-lore': { id: 'slinger-snare-lore', classId: 'slinger', branch: 'trapper', tier: 1, maxRank: 3, name: 'Snare Lore', about: 'Traps last +25% and arm 0.5 s faster per rank' },
  'slinger-field-dressing': { id: 'slinger-field-dressing', classId: 'slinger', branch: 'trapper', tier: 2, maxRank: 3, name: 'Field Dressing', about: 'Each kill heals you 3% max HP per rank' },
  'slinger-burr-trap': { id: 'slinger-burr-trap', classId: 'slinger', branch: 'trapper', tier: 3, maxRank: 1, name: 'Burr Trap', about: '25 Focus: lay a trap. The first enemy on it is Rooted 4 s and Chipped. Up to 2 traps, 15 s cd.', grants: 'burr-trap' },
  'slinger-beetle-companion': { id: 'slinger-beetle-companion', classId: 'slinger', branch: 'trapper', tier: 4, maxRank: 3, name: 'Beetle Companion', about: 'Summon your tamed stag beetle (from "A Beetle of Your Own" in the Hedgewood; until then a garden snail stands in). Pet HP and damage +0% / 20% / 40%. The pet draws enemies.' },
  'slinger-pack-bond': { id: 'slinger-pack-bond', classId: 'slinger', branch: 'trapper', tier: 5, maxRank: 3, name: 'Pack Bond', about: 'You and your pet deal +3% damage per rank; your crits heal your pet 5%' },
  'slinger-hunters-calm': { id: 'slinger-hunters-calm', classId: 'slinger', branch: 'trapper', tier: 6, maxRank: 1, name: "Hunter's Calm", about: 'When neither you nor your pet has taken damage for 3 s, both regenerate 3% HP/s. Your traps also apply Mark Quarry.' },
  // Hedge-Mage: Sun
  'mage-kindling': { id: 'mage-kindling', classId: 'mage', branch: 'sun', tier: 1, maxRank: 3, name: 'Kindling', about: '+3% Sun damage per rank' },
  'mage-dry-spell': { id: 'mage-dry-spell', classId: 'mage', branch: 'sun', tier: 2, maxRank: 3, name: 'Dry Spell', about: 'Sun spells cost −5% mana per rank' },
  'mage-heatwave': { id: 'mage-heatwave', classId: 'mage', branch: 'sun', tier: 3, maxRank: 1, name: 'Heatwave', about: 'Cone, 7 m: 130% Flare plus Burning. 10 s cd.', grants: 'heatwave' },
  'mage-scorch': { id: 'mage-scorch', classId: 'mage', branch: 'sun', tier: 4, maxRank: 3, name: 'Scorch', about: 'Flare crits Burn for 20% / 40% / 60% of the hit over 4 s' },
  'mage-long-day': { id: 'mage-long-day', classId: 'mage', branch: 'sun', tier: 5, maxRank: 3, name: 'Long Day', about: 'Flare cooldown −0.2 s per rank' },
  'mage-midsummer': { id: 'mage-midsummer', classId: 'mage', branch: 'sun', tier: 6, maxRank: 1, name: 'Midsummer', about: 'Every 4th Flare is free and deals triple' },
  // Hedge-Mage: Rain
  'mage-cold-snap': { id: 'mage-cold-snap', classId: 'mage', branch: 'rain', tier: 1, maxRank: 3, name: 'Cold Snap', about: 'Your Slows are 5% stronger and Rain damage +3% per rank' },
  'mage-soak-through': { id: 'mage-soak-through', classId: 'mage', branch: 'rain', tier: 2, maxRank: 3, name: 'Soak Through', about: 'Soaked lasts +2 s and the target takes +3% damage per rank' },
  'mage-hailstone': { id: 'mage-hailstone', classId: 'mage', branch: 'rain', tier: 3, maxRank: 1, name: 'Hailstone', about: '120% of Flare as Rain, Stun 2 s. 12 s cd.', grants: 'hailstone' },
  'mage-undertow': { id: 'mage-undertow', classId: 'mage', branch: 'rain', tier: 4, maxRank: 3, name: 'Undertow', about: 'Drizzle and Downpour cost −8% per rank; Drizzle cast −0.25 s per rank' },
  'mage-rust-lore': { id: 'mage-rust-lore', classId: 'mage', branch: 'rain', tier: 5, maxRank: 3, name: 'Rust Lore', about: '+8% Rain damage against Metal and Fired clay per rank. "Rust tames it." Royal Archive, Gromwell\'s notes.' },
  'mage-thunderhead': { id: 'mage-thunderhead', classId: 'mage', branch: 'rain', tier: 6, maxRank: 1, name: 'Thunderhead', about: 'A storm cloud follows you for 10 s and strikes the nearest enemy every second for 50% Flare (Rain), Soaking it. 45 s cd.', grants: 'thunderhead' },
  // Hedge-Mage: Bloom
  'mage-green-thumb': { id: 'mage-green-thumb', classId: 'mage', branch: 'bloom', tier: 1, maxRank: 3, name: 'Green Thumb', about: '+6% healing per rank' },
  'mage-overgrowth': { id: 'mage-overgrowth', classId: 'mage', branch: 'bloom', tier: 2, maxRank: 3, name: 'Overgrowth', about: 'Root Snare +1 s per rank; rooted targets take +3% damage per rank' },
  'mage-thick-glaze': { id: 'mage-thick-glaze', classId: 'mage', branch: 'bloom', tier: 3, maxRank: 1, name: 'Thick Glaze', about: 'Absorb 30% max HP on yourself or an ally for 10 s. 25 s cd.', grants: 'thick-glaze' },
  'mage-regrowth': { id: 'mage-regrowth', classId: 'mage', branch: 'bloom', tier: 4, maxRank: 3, name: 'Regrowth', about: 'Mend also heals 10% / 20% / 30% more over 8 s' },
  'mage-mulch': { id: 'mage-mulch', classId: 'mage', branch: 'bloom', tier: 5, maxRank: 3, name: 'Mulch', about: 'When an enemy dies near you, allies within 8 m heal 2% max HP per rank' },
  'mage-fairy-ring': { id: 'mage-fairy-ring', classId: 'mage', branch: 'bloom', tier: 6, maxRank: 1, name: 'Fairy Ring', about: 'A ring of mushrooms for 8 s, 6 m wide: allies inside heal 4% max HP/s, enemies Slowed 50%. 60 s cd.', grants: 'fairy-ring' },
};

/** Points needed in a branch to learn a talent of each tier (indexed by tier). */
export const TIER_GATE = [0, 0, 2, 4, 6, 8, 12] as const;

/** Talent branches per class, in the order of classes.md. */
export const BRANCHES: Record<ClassId, readonly string[]> = {
  warden: ['bulwark', 'hedgecutter', 'groundbreaker'],
  slinger: ['acorneer', 'thornshot', 'trapper'],
  mage: ['sun', 'rain', 'bloom'],
};
