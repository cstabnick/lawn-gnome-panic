// Gnome Theft Auto: the Side-Valve Lock-Up and the Sling-Lift (docs/roadmaps/gta-garage-and-delivery.md): achievement gear.
import type { PrefabDef } from '../types';

export const GTA_LOCKUP: readonly PrefabDef[] = [
  {
    id: 'lockup-key-lanyard', name: 'Lock-Up Key Lanyard', category: 'trinket', uses: ['wear-neck'],
    tags: ['key', 'keys', 'lanyard', 'lock-up', 'garage', 'tag', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Lock-Up Key Lanyard. A yellow cord round the neck with a steel ring at the chest holding five small keys, each with a brass number tag.',
    examine: [
      'A yellow cord with a steel ring hanging at the chest, and on the ring five small keys, each with its own brass number tag.',
      'Saying: five keys, five doors, five mowers; a gnome with a sixth key is a gnome with a problem.',
      'Tip: keep the tags facing out, or you will try every key on the wrong door while the Hat Watch watches.',
      'Joke: the keys jingle so loudly that Tansy can hear a customer coming from the far end of the forecourt.',
      'Number three is shinier than the others. It is the door its owner opens most, or the one Tansy oiled.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'yellow', seg: 12 },     // neck cord (min.y = 0)
      { s: 'ring', d: [0.035, 0.006], at: [0, 0.035, 0.17], c: 'steel', seg: 10 },                       // key ring
      { s: 'box', d: [0.012, 0.05, 0.006], at: [-0.03, 0.025, 0.18], rot: [0, 0, 20], c: 'steel' },      // key
      { s: 'box', d: [0.012, 0.05, 0.006], at: [-0.012, 0.022, 0.185], rot: [0, 0, 8], c: 'steel' },     // key
      { s: 'box', d: [0.012, 0.05, 0.006], at: [0.006, 0.02, 0.19], c: 'iron' },                          // key
      { s: 'box', d: [0.012, 0.05, 0.006], at: [0.024, 0.022, 0.185], rot: [0, 0, -8], c: 'steel' },     // key
      { s: 'box', d: [0.012, 0.05, 0.006], at: [0.042, 0.025, 0.18], rot: [0, 0, -20], c: 'steel' },     // key
      { s: 'cyl', d: [0.014, 0.014, 0.004], at: [0.006, 0.006, 0.195], rot: [90, 0, 0], c: 'brass', seg: 8 }, // number tag
    ],
  },
  {
    id: 'sling-lift-headset', name: 'Sling-Lift Headset', category: 'armor', uses: ['wear-head'],
    tags: ['headset', 'headphones', 'pilot', 'radio', 'microphone', 'helicopter', 'sling-lift', 'reward', 'gta'], emoji: [],
    about: "Gnome Theft Auto: the Sling-Lift Headset. A dark headband ring with two round yellow ear cups at the sides and a thin boom microphone curving to the front. Sits like the Flight Goggles.",
    examine: [
      'A dark headband with two round yellow ear cups and a thin boom microphone that curves round to the front of the face.',
      'Saying: the Sling-Lift never lands, so everything worth saying has to be said through the headset.',
      'Tip: speak into the microphone, not the ear cup. Tansy only hears the ear cup as a sort of distant flapping.',
      'Joke: the headset makes every gnome sound like a pilot, even when it is only asking where the toilet is.',
      'The left cup has a sticker of a rope and a hook on it. The right cup has the shape of where a sticker used to be.',
    ],
    parts: [
      { s: 'ring', d: [0.175, 0.024], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 12 },                  // headband
      { s: 'cyl', d: [0.05, 0.05, 0.03], at: [0.175, 0.04, 0], rot: [0, 0, 90], c: 'yellow', seg: 10, mirror: true }, // ear cup
      { s: 'cyl', d: [0.006, 0.006, 0.16], at: [0.15, 0.035, 0.09], rot: [90, -30, 0], c: 'iron-dark', seg: 4 },     // mic boom
      { s: 'ball', d: [0.016], at: [0.1, 0.035, 0.16], c: 'black', seg: 6 },                                           // mic
    ],
  },
];
