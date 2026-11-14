import type { WeaponDef } from './types';

export const WEAPONS: Record<string, WeaponDef> = {
  clippings: { id: 'clippings', name: 'Clippings Blaster', kind: 'blaster', power: 1, chargeMs: 9000, shots: 2, damage: 1, fireChance: 0.1, cost: 40 },
  mulcher: { id: 'mulcher', name: 'Mulch Cannon', kind: 'blaster', power: 2, chargeMs: 12000, shots: 3, damage: 1, fireChance: 0.1, cost: 70 },
  blade: { id: 'blade', name: 'Spare Blade', kind: 'blaster', power: 1, chargeMs: 10000, shots: 1, damage: 2, fireChance: 0.05, cost: 45 },
  sprinkler: { id: 'sprinkler', name: 'Hot Sprinkler', kind: 'blaster', power: 1, chargeMs: 8000, shots: 1, damage: 1, fireChance: 0.6, cost: 50 },
  pinecone: { id: 'pinecone', name: 'Pinecone Lobber', kind: 'lobber', power: 1, chargeMs: 11000, shots: 1, damage: 3, fireChance: 0.2, cost: 55 },
};

export const SHOP_WEAPON_IDS = ['mulcher', 'blade', 'sprinkler', 'pinecone', 'clippings'];

export const GNOME_NAMES = [
  'Bramble', 'Toadstool', 'Pip', 'Thistle', 'Moss', 'Burdock', 'Clover', 'Nettle',
  'Fennel', 'Sorrel', 'Puck', 'Wort', 'Hazel', 'Dob', 'Mugwort', 'Tansy',
];

export const ENEMY_SHIP_NAMES = [
  'The Crabgrass', 'Weed Whacker', 'Sod Buster', 'The Thatcher', 'Hedge Hog',
  'Mulch Mauler', 'The Dethatcher', 'Clover Crusher',
];
