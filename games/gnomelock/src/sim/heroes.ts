// Four gnome-inspired Deadlock-parody heroes, weapons, and abilities.
import type { AbilitySlot, HeroId } from './config';

export interface AbilityDef {
  slot: AbilitySlot;
  name: string;
  desc: string;
  cooldownS: number;
  baseDamage: number;
  spiritScale: number;
  range: number;
}

export interface WeaponDef {
  prefabId: string;
  name: string;
  damage: number;
  pellets: number;
  spreadRad: number;
  fireIntervalS: number;
  magSize: number;
  reloadS: number;
  range: number;
  projectileSpeed: number; // 0 = hitscan-fast tracer, >0 = fast projectile
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  role: string;
  lore: string;
  baseHp: number;
  hpPerLevel: number;
  speedBonus: number;
  weapon: WeaponDef;
  abilities: Record<AbilitySlot, AbilityDef>;
  recommendedItems: readonly string[];
}

export const HEROES: Record<HeroId, HeroDef> = {
  bramble: {
    id: 'bramble',
    name: 'Bramble',
    title: 'Hedge-Warden',
    role: 'Frontline Brawler',
    lore: 'Fired in an extra-thick clay mould and armed with a Pinecone Blunderbuss.',
    baseHp: 720,
    hpPerLevel: 58,
    speedBonus: 0.35,
    weapon: {
      prefabId: 'pinecone-blunderbuss',
      name: 'Pinecone Blunderbuss',
      damage: 19.6,
      pellets: 5,
      spreadRad: 0.052,
      fireIntervalS: 0.54,
      magSize: 8,
      reloadS: 1.4,
      range: 38,
      projectileSpeed: 95,
    },
    abilities: {
      Q: { slot: 'Q', name: 'Mulch Charge', desc: 'Bull-rush forward, dealing damage and slamming enemies into walls.', cooldownS: 9, baseDamage: 95, spiritScale: 0.7, range: 11 },
      E: { slot: 'E', name: 'Clay Bulwark', desc: 'Harden glaze for a 190-HP barrier and +25% move speed for 3.5s.', cooldownS: 13, baseDamage: 0, spiritScale: 0.5, range: 0 },
      F: { slot: 'F', name: 'Root Snare', desc: 'Lob bramble roots that slow enemies by 55% and deal DoT for 3s.', cooldownS: 12, baseDamage: 110, spiritScale: 0.9, range: 18 },
      X: { slot: 'X', name: 'Lawn-Roller Slam', desc: 'Leap skyward and smash the ground, knocking up and stunning nearby foes.', cooldownS: 36, baseDamage: 220, spiritScale: 1.2, range: 9 },
    },
    recommendedItems: ['heavy-trowel', 'garden-plate', 'root-tonic', 'mulch-charger', 'clay-mortar', 'sprinkler-core'],
  },

  tansy: {
    id: 'tansy',
    name: 'Tansy',
    title: 'Dew-Slinger',
    role: 'Skirmisher & Assassin',
    lore: 'Moves like wind over wet clover; punishes anyone who leaves a Soul Acorn unguarded.',
    baseHp: 590,
    hpPerLevel: 46,
    speedBonus: 0.65,
    weapon: {
      prefabId: 'seed-sprayer',
      name: 'Seed Sprayer',
      damage: 16.5,
      pellets: 1,
      spreadRad: 0.025,
      fireIntervalS: 0.14,
      magSize: 28,
      reloadS: 1.35,
      range: 40,
      projectileSpeed: 120,
    },
    abilities: {
      Q: { slot: 'Q', name: 'Petal Blink', desc: 'Dash-blink in aim direction, refilling 1 stamina and boosting fire rate.', cooldownS: 8, baseDamage: 55, spiritScale: 0.4, range: 12 },
      E: { slot: 'E', name: 'Thistle Daggers', desc: 'Fling 3 thorns (+35% damage while sliding or airborne).', cooldownS: 6.5, baseDamage: 115, spiritScale: 0.9, range: 26 },
      F: { slot: 'F', name: 'Smoke-Puff Veil', desc: 'Vanish in dandelion puff for 3s with +35% speed.', cooldownS: 14, baseDamage: 0, spiritScale: 0, range: 0 },
      X: { slot: 'X', name: 'Acorn Barrage', desc: 'Unleash a rapid cone of golden seeds in front of you.', cooldownS: 34, baseDamage: 275, spiritScale: 1.2, range: 22 },
    },
    recommendedItems: ['clover-boots', 'acorn-magazine', 'dewdrops-flask', 'wind-pinwheel', 'golden-secateurs', 'sun-lantern'],
  },

  fernwick: {
    id: 'fernwick',
    name: 'Fernwick',
    title: 'Kiln-Alchemist',
    role: 'Spirit Burst Caster',
    lore: 'Carries an Acorn Rifle and three kinds of volatile garden glaze.',
    baseHp: 660,
    hpPerLevel: 58,
    speedBonus: 0.2,
    weapon: {
      prefabId: 'acorn-rifle',
      name: 'Acorn Rifle',
      damage: 33,
      pellets: 1,
      spreadRad: 0.015,
      fireIntervalS: 0.24,
      magSize: 18,
      reloadS: 1.45,
      range: 42,
      projectileSpeed: 130,
    },
    abilities: {
      Q: { slot: 'Q', name: 'Sap Bomb', desc: 'Hurl a sticky sap flask that explodes and burns enemies in an area.', cooldownS: 7.5, baseDamage: 120, spiritScale: 1.0, range: 24 },
      E: { slot: 'E', name: 'Glaze Bolt', desc: 'Zap a target with kiln lightning that chains to nearby foes.', cooldownS: 9, baseDamage: 105, spiritScale: 0.95, range: 26 },
      F: { slot: 'F', name: 'Sunbeam Surge', desc: 'Gain +30% fire rate, +25% speed, and instant stamina regen for 4s.', cooldownS: 14, baseDamage: 0, spiritScale: 0, range: 0 },
      X: { slot: 'X', name: 'Kiln Overheat', desc: 'Detonate a massive expanding ring of kiln fire around yourself.', cooldownS: 38, baseDamage: 260, spiritScale: 1.35, range: 11 },
    },
    recommendedItems: ['glaze-ampoule', 'sun-lantern', 'sprout-salve', 'sprinkler-core', 'clover-boots', 'clay-mortar'],
  },

  potsworth: {
    id: 'potsworth',
    name: 'Potsworth',
    title: 'Shard-Sniper',
    role: 'Long-Range & Deny Specialist',
    lore: 'Polished a Tall-eye marble into a scope to snipe creeps and steal Soul Acorns from across the lane.',
    baseHp: 530,
    hpPerLevel: 42,
    speedBonus: 0.15,
    weapon: {
      prefabId: 'pea-shooter',
      name: 'Pea Shooter',
      damage: 37.5,
      pellets: 1,
      spreadRad: 0.005,
      fireIntervalS: 0.66,
      magSize: 8,
      reloadS: 1.6,
      range: 48,
      projectileSpeed: 170,
    },
    abilities: {
      Q: { slot: 'Q', name: 'Birdbath Turret', desc: 'Deploy an automated clay turret for 14s that shoots nearby foes.', cooldownS: 13, baseDamage: 18, spiritScale: 0.35, range: 14 },
      E: { slot: 'E', name: 'Dewdrop Tether', desc: 'Slow and tag a target with a glowing tether for 3.5s.', cooldownS: 10, baseDamage: 75, spiritScale: 0.8, range: 30 },
      F: { slot: 'F', name: 'Updraft Gale', desc: 'Launch high into the air and reset double jump for aerial sniping.', cooldownS: 11, baseDamage: 0, spiritScale: 0, range: 0 },
      X: { slot: 'X', name: 'Golden Tall-Eye', desc: 'Fire a piercing beam that deals +65% bonus damage to low-HP enemies.', cooldownS: 35, baseDamage: 195, spiritScale: 1.15, range: 56 },
    },
    recommendedItems: ['tall-eye-lens', 'acorn-magazine', 'golden-secateurs', 'wind-pinwheel', 'dewdrops-flask', 'sun-lantern'],
  },
};

export const HERO_LIST: readonly HeroDef[] = [
  HEROES.bramble,
  HEROES.tansy,
  HEROES.fernwick,
  HEROES.potsworth,
];
