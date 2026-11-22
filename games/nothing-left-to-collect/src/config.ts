// Constants and tuning. Pure: no DOM, no three, safe to import in tests.
import type { AchievementId, ChapterId, EggId, FloorId, ItemKind, Speaker } from './types';

export const GAME_ID = 'nothing-left-to-collect';
export const GAME_TITLE = 'Nothing Left to Collect';

export const TUNING = {
  walkSpeed: 5,
  accel: 40,
  jumpSpeed: 6.5,
  gravity: 20,
  flySpeed: 9,
  playerRadius: 0.3,
  playerHeight: 1.1,
  /** Max ledge the walker steps up without jumping. */
  stepUp: 0.25,
  /** Pickup radius at the start (CollectState.magnet). */
  magnet: 0.9,
  itemRestY: 0.35,
  itemFallG: 14,
  rainHeight: 6,
  maxLiveItems: 400,
  interactRadius: 1.4,
  wallHeight: 3,
  wallThickness: 0.2,
  /** Seconds without a pickup that end a combo. */
  comboGap: 1.2,
} as const;

export interface ItemKindDef { label: string; prefab: string; glow: number | null; emoji: string; value: number }
export const ITEM_KINDS: Record<ItemKind, ItemKindDef> = {
  acorn: { label: 'Acorns', prefab: 'acorn', glow: null, emoji: '🌰', value: 1 },
  'golden-acorn': { label: 'Golden Acorns', prefab: 'acorn', glow: 0xffd34d, emoji: '🌰', value: 1 },
  clip: { label: 'Clips', prefab: 'fc-paperclip', glow: null, emoji: '📎', value: 1 },
  sticky: { label: 'Sticky Squares', prefab: 'fc-sticky-note', glow: null, emoji: '🟨', value: 1 },
  button: { label: 'Gold Buttons', prefab: 'button', glow: 0xffd34d, emoji: '🟡', value: 1 },
  token: { label: 'Tokens of Appreciation', prefab: 'fc-appreciation-token', glow: 0x7fd0ff, emoji: '🪙', value: 1 },
  star: { label: 'Stars of Recognition', prefab: 'party-star', glow: 0xffe066, emoji: '⭐', value: 1 },
  badge: { label: "Collector's Badges", prefab: 'fc-collector-badge', glow: 0xff8fd0, emoji: '📛', value: 1 },
  anything: { label: 'Everything', prefab: 'crate', glow: null, emoji: '📦', value: 1 },
};
export const ITEM_ORDER: readonly ItemKind[] = ['acorn', 'golden-acorn', 'clip', 'sticky', 'button', 'token', 'star', 'badge', 'anything'];

export const CHAPTER_ORDER: readonly ChapterId[] = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ending'];
export const CHAPTER_FLOOR: Record<ChapterId, FloorId> = { prologue: 'lobby', ch1: 'f1', ch2: 'f2', ch3: 'f3', ch4: 'f4', ending: 'lobby' };
export const CHAPTER_TITLES: Record<ChapterId, { kicker: string; title: string; sub: string }> = {
  prologue: { kicker: '', title: 'Nothing Left to Collect', sub: 'Bucketworth & Sons, Collectors. Reception.' },
  ch1: { kicker: 'Chapter 1', title: 'Orientation', sub: 'Floor 1' },
  ch2: { kicker: 'Chapter 2', title: 'Onboarding', sub: 'Floor 2' },
  ch3: { kicker: 'Chapter 3', title: 'Synergy', sub: 'Floor 2½' },
  ch4: { kicker: 'Chapter 4', title: 'Everything', sub: 'Floor ∞' },
  ending: { kicker: '', title: 'Reception', sub: 'Still nine o\'clock' },
};
/** Lift panel buttons, in panel order. 'B' is the basement easter egg. */
export const LIFT_BUTTONS: readonly { label: string; floor: FloorId | null }[] = [
  { label: 'L', floor: 'lobby' }, { label: '1', floor: 'f1' }, { label: '2', floor: 'f2' },
  { label: '2½', floor: 'f3' }, { label: '∞', floor: 'f4' }, { label: 'B', floor: null },
];

export const SPEAKERS: Record<Speaker, { name: string; hz: number; color: string }> = {
  narrator: { name: 'The Interviewer', hz: 84, color: '#3b4a6b' },
  secretary: { name: 'Primrose Paperweight', hz: 132, color: '#a8457a' },
  player: { name: 'You', hz: 100, color: '#2f6b3b' },
  coworker: { name: 'A Coworker', hz: 112, color: '#6b5a2f' },
  pa: { name: 'Intercom', hz: 96, color: '#555555' },
};
/** The narrator's label drifts every chapter: is this an interview or a dream? */
export const NARRATOR_NAME: Record<ChapterId, string> = {
  prologue: 'The Interviewer', ch1: 'The Interviewer', ch2: 'The Interviewer (probably)',
  ch3: 'The Narrator', ch4: 'You, possibly', ending: 'The Interviewer',
};

export const EGGS: Record<EggId, string> = {
  'shortest-interview': 'The Shortest Interview',
  nameplate: 'Still Primrose',
  'skip-tutorial': 'Skip Skip Tutorial',
  'do-not-collect': 'The One You Were Told Not To',
  'water-cooler': 'Water Cooler Gossip',
  photocopier: 'Two of You',
  'arcade-cabinet': 'The Answer Is Always Gnome',
  basement: 'Floor B',
  splash: 'Out of Bounds',
};
export const EGG_COUNT = 9;

export const ACH = {
  hello: 'collectathon-hello',
  clipArt: 'collectathon-clip-art',
  employee: 'collectathon-employee-of-the-month',
  point: 'collectathon-the-point',
  notTaking: 'collectathon-not-taking-it',
  eggs: 'collectathon-easter-eggs',
} as const satisfies Record<string, AchievementId>;

export const SAVE_KEY = 'nothing-left-to-collect.save.v1';
export const MUSIC_MUTE_KEY = 'nothing-left-to-collect-music-muted';

export const CAMERA = {
  follow: { height: 7, back: 8.5, lookUp: 0.8, fov: 50 },
  close: { height: 2.4, back: 4, lookUp: 0.9, fov: 45 },
  wide: { height: 14, back: 15, lookUp: 0.5, fov: 50 },
  sky: { height: 2.5, back: 9, lookUp: 3, fov: 60 },
  /** Distance multiplier when the screen is taller than wide. */
  portraitBack: 1.45,
  lerp: 6,
} as const;

/** The secretary's look (Primrose Paperweight). */
export const PRIMROSE_LOOK = { hat: 0xc2457a, shirt: 0xf0d9e4, pants: 0x3b3b4a, skin: 0xf1c27d, boots: 0x2a2a2a, beard: null, hair: { color: 0x8a5a2b, style: 'pigtails' as const }, freckles: true, dress: true, glasses: true };
