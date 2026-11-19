// New prefabs for tribute-schedule. One owner (the tribute-schedule adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const TRIBUTE_SCHEDULE: readonly PrefabDef[] = [
  {
    id: 'fridge', name: 'Fridge', category: 'furniture', uses: ['place', 'open'],
    tags: ['fridge', 'refrigerator', 'cold', 'kitchen', 'hum', 'steel', 'door'], emoji: [],
    tint: 0x8e969d, trim: 0x3a3f45,
    about: 'A tall steel fridge with one door, one handle and a low hum. Tint is the steel, trim is the handle and feet.',
    examine: [
      'A tall steel fridge with one door, one handle and a faint hum that carries on even when it is unplugged.',
      'A note on the door reads: "Keep the cold things cold and the warm things where you can see them."',
      'The seal is cracked along the bottom. Something cold leaks out at night and sits on the lino.',
      'The handle is worn bright where a great many hands have pulled it, and most of those hands were not yours.',
      'Do not open it when the hum changes pitch. The hum is the only warning you get.',
    ],
    parts: [
      { s: 'box', d: [1.05, 2.05, 1.05], at: [0, 1.125, 0], c: 'tint' },
      { s: 'box', d: [0.9, 0.1, 0.9], at: [0, 0.05, 0], c: 'trim' },
      { s: 'box', d: [0.05, 0.5, 0.05], at: [0.4, 1.4, 0.54], c: 'trim' },
    ],
  },
  {
    id: 'microwave', name: 'Microwave', category: 'prop', uses: ['place'],
    tags: ['microwave', 'oven', 'kitchen', 'hum', 'keypad', 'counter', 'glass', 'display'], emoji: [],
    tint: 0x23262b, trim: 0x6d737a,
    about: 'A countertop microwave with a dark case, a small glass door and a keypad. Tint is the case, trim is the door and keypad.',
    examine: [
      'A countertop microwave with a dark case, a small glass door and a keypad on the right-hand side.',
      'A sticker on the door reads: "Do not microwave anything you are not prepared to explain."',
      'The turntable stopped turning a long time ago. It still hums when the door is shut.',
      'It is warm to the touch even when switched off. The casing is very patient about being warm.',
      'Cover it with a towel and it goes quiet. Uncover it and the display starts counting again.',
    ],
    parts: [
      { s: 'box', d: [0.75, 0.44, 0.48], at: [0, 0.22, 0], c: 'tint' },
      { s: 'box', d: [0.5, 0.3, 0.02], at: [-0.08, 0.22, 0.245], c: 'trim' },
      { s: 'box', d: [0.12, 0.3, 0.02], at: [0.27, 0.22, 0.245], c: 'trim' },
    ],
  },
  {
    id: 'frozen-burrito', name: 'Frozen Burrito', category: 'food', uses: ['eat'],
    tags: ['burrito', 'frozen', 'tortilla', 'thaw', 'food', 'counter', 'wrap'], emoji: ['🌯'],
    tint: 0xd5ba8a,
    about: 'A frozen burrito in a pale tortilla, thawing on the counter the natural way. Tint is the tortilla.',
    examine: [
      'A burrito in a pale tortilla, frozen solid at the middle and soft at both ends.',
      'The label says to microwave for two minutes. The label has not been updated since the last tenant.',
      'It has been on the counter since before anyone thought to check. Nobody is sure it is still a burrito.',
      'Eating it cold is not recommended. Eating it at all is a matter of nerve.',
    ],
    parts: [
      { s: 'pill', d: [0.06, 0.18], at: [0, 0.06, 0], rot: [0, 0, 90], c: 'tint' },
    ],
  },
  {
    id: 'printer', name: 'Printer', category: 'prop', uses: ['place'],
    tags: ['printer', 'paper', 'jam', 'ink', 'office', 'desk', 'sheet', 'tray'], emoji: [],
    tint: 0xd6d3cc, trim: 0x2a2a2e,
    about: 'A beige office printer with a paper slot along its front. Tint is the case, trim is the slot.',
    examine: [
      'A beige office printer with a paper slot along its front that takes one sheet at a time, politely.',
      'It prints the schedule. Nobody has ever found out who asked it to.',
      'The paper slot is jammed with a sheet that is still warm. Pull it out and the same line prints again.',
      'Ink comes off on the fingers, and the smudge spells something that is not your name.',
      'Keep it on the desk. On the floor it stops printing and starts listening.',
    ],
    parts: [
      { s: 'box', d: [0.62, 0.34, 0.48], at: [0, 0.17, 0], c: 'tint' },
      { s: 'box', d: [0.5, 0.02, 0.04], at: [0, 0.35, 0.1], c: 'trim' },
    ],
  },
  {
    id: 'smoke-detector', name: 'Smoke Detector', category: 'prop', uses: ['place'],
    tags: ['smoke', 'detector', 'alarm', 'ceiling', 'chirp', 'beep', 'round'], emoji: [],
    tint: 0xd8d5ce,
    about: 'A round white smoke detector screwed to the ceiling, flat as a biscuit. Tint is the casing.',
    examine: [
      'A round white smoke detector, flat as a biscuit, screwed to the ceiling above the kitchen.',
      'It has never once detected smoke. It has detected other things, and it chirps about those instead.',
      'The battery was replaced last week. The chirp was not, and it is still going.',
      'Looking up at it for too long makes the little light seem to blink back.',
    ],
    parts: [
      { s: 'cyl', d: [0.18, 0.2, 0.08], at: [0, 0.04, 0], c: 'tint' },
    ],
  },
  {
    id: 'tv-set', name: 'Television', category: 'furniture', uses: ['place'],
    tags: ['tv', 'television', 'set', 'stand', 'crt', 'screen', 'hockey', 'box'], emoji: [],
    tint: 0x16171a, trim: 0x201c1a,
    about: 'A boxy television on a low dark stand. Tint is the set, trim is the stand.',
    examine: [
      'A boxy television with a glass front on a low dark stand, the sort that takes a minute to warm up.',
      'The dial has no numbers, only a long scratch that points at the hockey.',
      'Its cord goes into the wall at a point the wall does not have a socket for.',
      'The stand is sturdy and the set on it is not. Leaning on the stand makes the picture roll.',
      'Nobody remembers switching it on. The picture is always already on when you walk in.',
    ],
    parts: [
      { s: 'box', d: [1.4, 0.65, 0.8], at: [0, 0.325, 0], c: 'trim' },
      { s: 'box', d: [0.95, 0.7, 0.6], at: [0, 1.0, 0], c: 'tint' },
    ],
  },
  {
    id: 'couch', name: 'Couch', category: 'furniture', uses: ['place', 'sit'],
    tags: ['couch', 'sofa', 'settee', 'cushion', 'seat', 'lounge', 'upholstered'], emoji: [],
    tint: 0x3a2c2b, trim: 0x2a201f,
    seat: [0, 0.5, 0.05],
    about: 'A long upholstered couch with a seat, a back and two arms. Tint is the upholstery, trim is the frame.',
    examine: [
      'A long upholstered couch with a sagging seat, two arms and a back that leans toward the television.',
      'The cushions are the colour of old wine. One of them has a shape pressed into it that is not quite a gnome.',
      'Sitting down is easy. Getting up again is a separate negotiation with the couch.',
      'Under the cushions: three coins, a remote with no batteries and a note that says only "still here".',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.3, 1.0], at: [0, 0.15, 0], c: 'trim' },
      { s: 'box', d: [2.4, 0.15, 0.8], at: [0, 0.375, 0.08], c: 'tint' },
      { s: 'box', d: [2.6, 0.3, 0.2], at: [0, 0.6, -0.4], c: 'tint' },
      { s: 'box', d: [0.2, 0.25, 1.0], at: [-1.2, 0.425, 0], c: 'tint' },
      { s: 'box', d: [0.2, 0.25, 1.0], at: [1.2, 0.425, 0], c: 'tint' },
    ],
  },
];
