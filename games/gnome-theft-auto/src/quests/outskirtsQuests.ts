// Pebblewick's two side quests (Strangers & Freaks style): The Weeping Line and The Hum at Three. Each has a dialogue
// intro and outro in the street set, an Acorn reward, an achievement and a perk (perks.ts). Their givers are the
// 'pebblewick-plots' and 'pebblewick-tower' markers in the level documents (defs.ts GIVERS).
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from './types';

const PURSLANE_LOOK: Partial<GnomeLook> = { hat: 0x7a8a3a, shirt: 0xa8743a, beard: 0xf0eee6 };
const MALLOW_LOOK: Partial<GnomeLook> = { hat: 0xf2c94c, shirt: 0xe06a8a, beard: null, freckles: true };

export const OUTSKIRTS_QUESTS: readonly QuestDef[] = [
  {
    id: 'sq-weeping-line',
    title: 'The Weeping Line',
    giver: 'pebblewick-plots',
    rewardAcorns: 450,
    achievement: 'gta-weeping-line',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Purslane Furrow', text: 'My peppers are thirsty, and the line that waters them has gone dry.', look: PURSLANE_LOOK },
        { speaker: 'Purslane Furrow', text: 'It runs out past the canyon. I hear a pump out there at night.', look: PURSLANE_LOOK },
        { speaker: 'Purslane Furrow', text: 'Follow the line west and see who is drinking it.', look: PURSLANE_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Purslane Furrow', text: 'The peppers have noticed the water is back. So have I.', look: PURSLANE_LOOK },
        { speaker: 'Purslane Furrow', text: 'You are a friend of the line now.', look: PURSLANE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Follow the Weeping Line west to the first dry joint',
        at: [560, 170],
        radius: 10,
        hint: 'First dry joint',
        toastOnEnter: 'The tube is bone dry here. Someone has spliced a second tube into it.',
      },
      {
        kind: 'visit',
        text: 'Follow the splice up the canyon trail',
        at: [532, 262],
        radius: 12,
        hint: 'Dry Canyon trail',
        heatOnEnter: 1,
        toastOnEnter: 'A Black Dew bowser, hooked to the line and drinking. Nobody about.',
      },
      {
        kind: 'steal-deliver',
        text: "Drive the tappers' mower back to Ratchet's workshop in Pebblewick",
        vehicleKind: 'mulch-spreader',
        spawnAt: [536, 270, 0.2],
        dropAt: [650, 60],
        radius: 8,
        hint: "Ratchet's Mower & Dew",
        maxDamage: 0.8,
      },
      {
        kind: 'visit',
        text: 'Tell Purslane the line is weeping again',
        at: [612, 150],
        radius: 6,
        hint: 'The dry plots',
      },
    ],
    doneText: "The Weeping Line weeps again. Pebblewick's counters will remember you (20% off).",
  },
  {
    id: 'sq-hum-at-three',
    title: 'The Hum at Three',
    giver: 'pebblewick-tower',
    rewardAcorns: 500,
    achievement: 'gta-hum-at-three',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Mallow Bucket', text: 'Every night at three, a combine in the eastern dunes hums.', look: MALLOW_LOOK },
        { speaker: 'Mallow Bucket', text: 'Nobody believes me. The HOA says it is the wind.', look: MALLOW_LOOK },
        { speaker: 'Mallow Bucket', text: 'I have a map. Mostly arrows. Will you check it for me?', look: MALLOW_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Mallow Bucket', text: 'It is real. I told you it was real.', look: MALLOW_LOOK },
        { speaker: 'Mallow Bucket', text: 'I am writing it on the notice board right now.', look: MALLOW_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: "Find the chrome thing on Mallow's map, in the dunes east of town",
        at: [845, 147],
        radius: 12,
        hint: 'The Old Combine',
        toastOnEnter: 'Half-buried, chrome all over, and very slightly humming.',
      },
      {
        kind: 'visit',
        text: "Borrow Burnet Ratchet's listening stick from the workshop",
        at: [650, 60],
        radius: 6,
        hint: "Ratchet's Mower & Dew",
      },
      {
        kind: 'visit',
        text: 'Hold the listening stick to the Old Combine',
        at: [845, 147],
        radius: 8,
        hint: 'The Old Combine',
        toastOnEnter: 'It is not an engine. It is singing. Somebody else is listening too.',
      },
      {
        kind: 'chase-follow',
        text: 'Tail the HOA van that came to inspect the hum',
        leaderName: 'HOA Inspector',
        leaderKind: 'hoa-van',
        waypoints: [[830, 120], [790, 60], [760, 50], [650, 20], [570, 30], [520, 30], [450, 70]],
        speed: 13,
        maxDist: 60,
        hint: 'HOA van',
      },
      {
        kind: 'visit',
        text: 'Tell Mallow what you heard',
        at: [712, 172],
        radius: 6,
        hint: 'The water tower',
      },
    ],
    doneText: 'The hum is real and the HOA wants it. Burnet Ratchet now fixes your rides for free.',
  },
];
