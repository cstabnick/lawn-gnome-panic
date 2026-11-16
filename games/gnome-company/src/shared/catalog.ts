import type { ItemKind, LootKind, ToolKind, ZoneId } from './types';

export interface ItemDef {
  kind: ItemKind;
  name: string;
  category: 'loot' | 'tool';
  baseValue: number;
  cursed: boolean;
  color: string;
  description: string;
}

export const ITEM_CATALOG: Record<ItemKind, ItemDef> = {
  // Deku Tree Loot
  golden_acorn: {
    kind: 'golden_acorn',
    name: 'Golden Deku Acorn',
    category: 'loot',
    baseValue: 48,
    cursed: false,
    color: '#ffd147',
    description: 'Blessed nut of the Great Oak.',
  },
  deku_sap: {
    kind: 'deku_sap',
    name: 'Jar of Ancient Sap',
    category: 'loot',
    baseValue: 55,
    cursed: false,
    color: '#f59e0b',
    description: 'Smells like pine and mild heresy.',
  },
  mushroom_chalice: {
    kind: 'mushroom_chalice',
    name: 'Bioluminescent Chalice',
    category: 'loot',
    baseValue: 72,
    cursed: false,
    color: '#34d399',
    description: 'Gnome Jesus drinks holy Miracle-Gro from this.',
  },
  blighted_twig: {
    kind: 'blighted_twig',
    name: 'Blighted Deku Twig',
    category: 'loot',
    baseValue: 35,
    cursed: true,
    color: '#9333ea',
    description: 'Whispers rude HOA complaints.',
  },
  cursed_truffle: {
    kind: 'cursed_truffle',
    name: 'Screaming Truffle',
    category: 'loot',
    baseValue: 85,
    cursed: true,
    color: '#a855f7',
    description: 'High value. Mildly possessed.',
  },

  // House Loot
  toaster_666: {
    kind: 'toaster_666',
    name: '666-Watt Cursed Toaster',
    category: 'loot',
    baseValue: 95,
    cursed: true,
    color: '#ef4444',
    description: 'Only toasts bagels into pentagrams.',
  },
  porcelain_cat: {
    kind: 'porcelain_cat',
    name: 'Haunted Porcelain Cat',
    category: 'loot',
    baseValue: 78,
    cursed: true,
    color: '#f8fafc',
    description: 'Its eyes follow you. Worth a lot on eBay.',
  },
  necro_gnomeicon: {
    kind: 'necro_gnomeicon',
    name: 'The Necro-Gnomeicon',
    category: 'loot',
    baseValue: 120,
    cursed: true,
    color: '#7f1d1d',
    description: 'Bound in synthetic AstroTurf. Very evil.',
  },
  grandpa_dentures: {
    kind: 'grandpa_dentures',
    name: "Grandpa's Gold Dentures",
    category: 'loot',
    baseValue: 64,
    cursed: false,
    color: '#fbbf24',
    description: 'Still chattering slightly.',
  },
  cursed_flamingo: {
    kind: 'cursed_flamingo',
    name: 'Demon Lawn Flamingo',
    category: 'loot',
    baseValue: 88,
    cursed: true,
    color: '#ec4899',
    description: 'Plastic avatar of suburban sin.',
  },
  golden_remote: {
    kind: 'golden_remote',
    name: 'Sacred TV Remote',
    category: 'loot',
    baseValue: 52,
    cursed: false,
    color: '#eab308',
    description: 'Controls the neighbor’s sprinklers.',
  },
  gnome_biblia: {
    kind: 'gnome_biblia',
    name: 'Gospel of Mulch',
    category: 'loot',
    baseValue: 60,
    cursed: false,
    color: '#38bdf8',
    description: 'Chapter 4: Thou shalt not mow on Sunday.',
  },
  lawn_ornament: {
    kind: 'lawn_ornament',
    name: 'Tarnished Birdbath Idol',
    category: 'loot',
    baseValue: 42,
    cursed: false,
    color: '#94a3b8',
    description: 'Heavy, tacky, pleasing to Gnome Jesus.',
  },

  // Shop Tools
  flashlight: {
    kind: 'flashlight',
    name: 'Holy Flashlight',
    category: 'tool',
    baseValue: 25,
    cursed: false,
    color: '#fde047',
    description: 'Pierces the darkness of the Deku Oak & House.',
  },
  trowel: {
    kind: 'trowel',
    name: 'Blessed Garden Trowel',
    category: 'tool',
    baseValue: 45,
    cursed: false,
    color: '#cbd5e1',
    description: 'Bonk spiders, squirrels, and cultists to stun them!',
  },
  tennis_ball: {
    kind: 'tennis_ball',
    name: 'Squeaky Tennis Ball',
    category: 'tool',
    baseValue: 15,
    cursed: false,
    color: '#a3e635',
    description: 'Throw to play fetch with the Giant Dog!',
  },
  airhorn: {
    kind: 'airhorn',
    name: 'Trumpet of Jericho (Airhorn)',
    category: 'tool',
    baseValue: 35,
    cursed: false,
    color: '#f97316',
    description: 'Absurdly loud. Startles enemies & annoys friends.',
  },
  holy_dew: {
    kind: 'holy_dew',
    name: 'Bottle of Holy Dew',
    category: 'tool',
    baseValue: 30,
    cursed: false,
    color: '#22d3ee',
    description: 'Restores 50 HP & grants speed blessing!',
  },
};

export const SHOP_TOOLS: ToolKind[] = [
  'tennis_ball',
  'flashlight',
  'holy_dew',
  'airhorn',
  'trowel',
];

export const DEKU_LOOT_POOL: LootKind[] = [
  'golden_acorn',
  'deku_sap',
  'mushroom_chalice',
  'blighted_twig',
  'cursed_truffle',
];

export const HOUSE_LOOT_POOL: LootKind[] = [
  'toaster_666',
  'porcelain_cat',
  'necro_gnomeicon',
  'grandpa_dentures',
  'cursed_flamingo',
  'golden_remote',
  'gnome_biblia',
];

export const YARD_LOOT_POOL: LootKind[] = [
  'golden_acorn',
  'lawn_ornament',
  'cursed_flamingo',
  'gnome_biblia',
];

export const GNOME_COLORS = [
  '#ef4444', // Classic Red Hat
  '#3b82f6', // Blue Hat
  '#22c55e', // Moss Hat
  '#eab308', // Mustard Hat
  '#a855f7', // Cult Purple Hat
  '#ec4899', // Flamingo Pink Hat
];

export const SERMONS = {
  dayStart: [
    'MY CHILDREN OF CERAMIC! THE HOA DEMANDS SACRIFICE. STEAL FROM THE YARD!',
    'BLESSED ARE THE SHORT, FOR THEY SHALL INHERIT THE MULCH. GO FORTH!',
    'THE DEKU OAK GROANS WITH TREASURE. THE HOUSE STINKS OF SIN. LOOT BOTH!',
    'BRING ME TOASTERS, ACORNS, AND PORCELAIN CATS! DO NOT EMBARRASS ME!',
  ],
  duskWarning: [
    'THE SUN SETS! THE LAWNMOWERS THIRST FOR CERAMIC BLOOD!',
    'DARKNESS FALLS! RETURN TO MY SHED BEFORE MIDNIGHT OR BECOME COMPOST!',
  ],
  cursedPickup: [
    'UGH, THAT ITEM SMELLS LIKE SUBURBAN SIN. BRING IT HERE ANYWAY.',
    'YOU TOUCHED AN EVIL RELIC! WASH YOUR TINY HANDS IN HOLY MIRACLE-GRO.',
    'THE NECRO-GNOMEICON! DO NOT READ IT OUT LOUD, YOU FOOL!',
  ],
  titheGood: [
    'AMEN! GNOME JESUS ACCEPTS YOUR STOLEN LAWN JUNK!',
    'GLORY TO THE SHED! YOUR QUOTA GROWS CLOSER!',
    'YESSS, FEED THE TITHE CRATE! MORE SHINY GARBAGE!',
  ],
  quotaMet: [
    'HALLELUJAH! QUOTA MET! YOU MAY LIVE ANOTHER CYCLE IN MY SHED!',
    'THE HOA IS APPEASED! RECEIVE MY BLESSING AND A HIGHER QUOTA!',
  ],
  quotaFailed: [
    'YOU FAILED THE QUOTA! INTO THE COSMIC COMPOST BIN OF ETERNITY!',
    'NO TOASTERS?! NO ACORNS?! GNOME JESUS HATH NO MERCY! *FLUSH*',
  ],
  playerDied: [
    'A BROTHER HATH SHATTERED! PRESS F TO PAY MULCH.',
    'REST IN PIECES, TINY DISCIPLE. SOMEONE GRAB THEIR LOOT!',
  ],
  dogFetch: [
    'EVEN THE GIANT HOUND OBEYS THE GOSPEL OF FETCH. GOOD BOY!',
    'BEHOLD THE BEAST OF SLOBBER! HE ONLY WANTS THE BALL, MY CHILD.',
  ],
};

export interface ZoneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const ZONE_BOUNDS: Record<ZoneId, ZoneBounds> = {
  shed: { minX: -4.1, maxX: 4.1, minZ: -4.1, maxZ: 4.1 },
  yard: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
  deku: { minX: -16.5, maxX: 16.5, minZ: -16.5, maxZ: 16.5 },
  house: { minX: -14.5, maxX: 14.5, minZ: -14.5, maxZ: 14.5 },
};

export const PORTALS = {
  shedToYard: { zone: 'shed' as ZoneId, x: 0, z: 3.7, toZone: 'yard' as ZoneId, toX: 0, toZ: 23.5, label: 'Step Outside to Yard' },
  yardToShed: { zone: 'yard' as ZoneId, x: 0, z: 25.2, toZone: 'shed' as ZoneId, toX: 0, toZ: 2.6, label: 'Enter Garden Shed' },
  yardToDeku: { zone: 'yard' as ZoneId, x: -22, z: -12.5, toZone: 'deku' as ZoneId, toX: 0, toZ: 13.5, label: 'Enter Great Deku Oak' },
  dekuToYard: { zone: 'deku' as ZoneId, x: 0, z: 15.2, toZone: 'yard' as ZoneId, toX: -22, toZ: -10.5, label: 'Exit Deku Oak to Yard' },
  yardToHouse: { zone: 'yard' as ZoneId, x: 22, z: -13.5, toZone: 'house' as ZoneId, toX: 0, toZ: 12.5, label: 'Enter Cursed House' },
  houseToYard: { zone: 'house' as ZoneId, x: 0, z: 14.0, toZone: 'yard' as ZoneId, toX: 22, toZ: -11.5, label: 'Exit House to Yard' },
};

export const SHED_STATIONS = {
  shrine: { x: 0, z: -3.2, label: 'Pray at Gnome Jesus Shrine' },
  tithe: { x: -2.4, z: -2.2, label: 'Tithe Held Loot to Gnome Jesus' },
  shop: { x: 2.8, z: -2.0, label: 'Open Shed Miracle Shop' },
  lever: { x: 2.6, z: 2.6, label: 'Pull Sacred Departure Lever' },
};
