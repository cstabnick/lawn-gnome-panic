// New prefabs for sample-3d. One owner (the sample-3d adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const SAMPLE_3D_SCENERY: readonly PrefabDef[] = [
  {
    id: 'lobby-pedestal', name: 'Lobby Pedestal', category: 'prop', uses: ['place'],
    tags: ['pedestal', 'plinth', 'stand', 'lobby', 'display', 'stone'], emoji: [],
    about: 'A short round plinth that a prize or a gnome can stand on. Built at the lobby stage size, so it is scale 1.',
    examine: [
      'A squat round plinth of dark violet stone, wider at the foot than at the top.',
      'Gnome saying: "Stand the prize on the stone, and the stone will stand for the prize."',
      'Nobody remembers who carried it into the lobby. It was already there when the lights came on.',
      'It is cold to the touch, even on the warmest afternoon of the year.',
      'Dust gathers on the top in the shape of a small gnome boot. Nobody has tried to brush it off.',
    ],
    parts: [
      { s: 'cyl', d: [0.9, 1.0, 0.35], at: [0, 0.175, 0], c: 0x3a2a6a, seg: 24 },
    ],
  },
  {
    id: 'hose-reel', name: 'Hose Reel', category: 'prop', uses: ['place'],
    tags: ['hose', 'reel', 'garden', 'wall', 'coil', 'spool'], emoji: [],
    about: 'A wall-mounted garden hose reel with a grey drum, a black bracket and three green coils of hose.',
    examine: [
      'A grey drum on a black bracket, with three green coils of hose wound on it like a lazy snake.',
      'Gnome rule: a hose that is put back on the reel is a hose that will be found again.',
      'The hose has been pulled out to the far end of the yard so many times that it no longer rolls back in on its own.',
      'The coils are stiff with old water. They smell faintly of the pond and of a gnome who lost an argument with it.',
      'Hang it at arm height. Hanging it at gnome height has been tried, and the hose did not appreciate it.',
    ],
    parts: [
      { s: 'cyl', d: [1.1, 1.1, 0.7], at: [0, 1.375, 0], rot: [90, 0, 0], c: 0x8a9399, seg: 16 },
      { s: 'box', d: [0.5, 1.5, 0.4], at: [0, 1.375, -0.55], c: 0x555555 },
      { s: 'ring', d: [1.15, 0.225], at: [0, 1.375, -0.3], c: 0x2e7d32, seg: 8 },
      { s: 'ring', d: [1.15, 0.225], at: [0, 1.375, 0], c: 0x2e7d32, seg: 8 },
      { s: 'ring', d: [1.15, 0.225], at: [0, 1.375, 0.3], c: 0x2e7d32, seg: 8 },
    ],
  },
  {
    id: 'air-conditioner', name: 'Window Air Conditioner', category: 'prop', uses: ['place'],
    tags: ['air', 'conditioner', 'aircon', 'unit', 'grille', 'cooler', 'wall'], emoji: [],
    about: 'A boxy wall-mounted air conditioner with a dark grille on its front. Built at a quarter of the house size and scaled up.',
    examine: [
      'A grey box with a dark grille on its face, set into the wall where a window used to be.',
      'It hums in summer and clanks in winter, and it does both with the same tune.',
      'Gnome rule: never put a bowl of water on the top. It will be found there later, at the bottom of the lawn.',
      'The grille has collected a summer of cottonwood and a winter of small brave spiders.',
      'It is cool at the front and warm at the back, which is exactly how the gnomes of the house like their arguments.',
    ],
    parts: [
      { s: 'box', d: [1.75, 1.5, 0.75], at: [0, 0.75, 0], c: 0xdddddd },
      { s: 'box', d: [1.25, 1.0, 0.05], at: [0, 0.75, 0.4], c: 0x555555 },
    ],
  },
];
