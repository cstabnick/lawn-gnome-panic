// Pay 'n' Glaze side quest (E20, L106): "On the House". Chrome-Knuckle Cass, foreman of the custom shop, never gives
// anything away; the HOA clamps a client's pink ride-on, the player gets it back, and Cass puts them on her tab: every
// Pay 'n' Glaze repair is free (perks.ts 'glaze-on-the-house'). Lore: docs/lore/entries/apocrypha/chrome-knuckle-cass.md.
import type { GnomeLook } from '@lawn/gnome';
import { PAY_N_GLAZE } from '../config';
import type { CommsCall } from './comms';
import type { GiverDef, QuestDef } from './types';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
/** The lot's board is at about (82, 130); Cass waits just west of it, clear of the bay strip. */
const CASS_AT: [number, number] = [76, 128];

export const GLAZE_GIVERS: Record<string, GiverDef> = {
  cass: {
    id: 'cass',
    name: "Pay 'n' Glaze",
    label: 'Talk to Chrome-Knuckle Cass',
    x: CASS_AT[0],
    z: CASS_AT[1],
    exit: { x: CASS_AT[0], z: CASS_AT[1] + 3, yaw: 0 },
    room: 'street',
    letter: '!',
  },
};

export const GLAZE_QUESTS: readonly QuestDef[] = [
  {
    id: 'sq-on-the-house',
    title: 'On the House',
    giver: 'cass',
    rewardAcorns: 200,
    achievement: 'gta-on-the-house',
    cutscene: { kind: 'script', script: 'sq-on-the-house-intro' },
    outro: { kind: 'script', script: 'sq-on-the-house-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the two Code-Enforcement clampers working the Ring Blocks',
        targets: [
          { id: 'glaze-clamper-1', name: 'Clamper Wedge', near: [40, 108], hint: 'Ring Blocks, west of the shop', look: HOA_LOOK },
          { id: 'glaze-clamper-2', name: 'Clamper Shim', near: [24, 112], hint: 'Ring Blocks, west of the shop', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: "Drive the clamped pink ride-on back to Pay 'n' Glaze, dent-free",
        vehicleKind: 'ride-on',
        spawnAt: [30, 104, Math.PI / 2],
        dropAt: [PAY_N_GLAZE.bay.x, PAY_N_GLAZE.bay.z],
        radius: 9,
        hint: "Pay 'n' Glaze bay",
        maxDamage: 0.35,
        heatOnEnter: 1,
        loadout: { paint: 0xff69b4, finish: 'pearl' },
      },
      {
        kind: 'visit',
        text: 'Tell Cass the ride-on is home',
        at: CASS_AT,
        radius: 6,
        hint: 'Cass, by the work-order board',
        toastOnEnter: 'Cass inspects the pink. "Still unapproved. Good."',
      },
    ],
    doneText: "Cass never gives anything away, so she calls it a tab. Pay 'n' Glaze repairs are free from now on.",
  },
];

const brief = (...lines: [string, string][]): CommsCall => ({ mode: 'briefing', lines: lines.map(([who, text]) => ({ who, text })) });
const call = (...lines: [string, string][]): CommsCall => ({ mode: 'call', lines: lines.map(([who, text]) => ({ who, text })) });

/** The lead wires this into COMMS (comms.ts). Step 0 is the briefing; steps 1 and 2 are calls. */
export const GLAZE_COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = {
  'sq-on-the-house': {
    0: brief(
      ['cass', "Code-Enforcement clamped a client's pink ride-on. Crack the clampers, west of the shop."],
      ['cass', "Then drive it home without a dent. Finish, and you're on my tab: repairs free."],
      ['cass', 'Two hundred Acorns too. Do not ask what the tab costs me.'],
    ),
    1: call(['cass', 'Clamp off, pink on. Bring it back whole. Whole is the job.']),
    2: call(['cass', 'Bay door is open. Park it where I can see it.']),
  },
};
