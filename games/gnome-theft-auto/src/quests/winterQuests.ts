// Winter side quests (E12): Gentian Bootlace's sled and ski trials, Thermos Theo's lines through the ice on Pail Pond.
// Both read the winter save through probes (city/probes.ts). Tone and names: lore R-186..R-188.
import { SHANTY, TEA_TRAY_RUN, WOOL_RUN } from '../winter/types';
import type { QuestDef } from './types';

const GENTIAN = 'Gentian Bootlace';
const GENTIAN_LOOK = { hat: 0xc2402e, shirt: 0x3a5f8f, beard: 0xe6e0d6 };
const THEO = 'Thermos Theo';
const THEO_LOOK = { hat: 0x2e5e8a, shirt: 0x8a2f2f, beard: 0xbfb8aa };

// The porch of the Woolly Sock Lodge (the lodge door faces east), and a spot on the ice 15 m west of the shanty.
const LODGE_PORCH: [number, number] = [-437, -1020];
const ICE_SPOT: [number, number] = [SHANTY.x - 15, SHANTY.z];

export const WINTER_QUESTS: readonly QuestDef[] = [
  {
    id: 'sq-snowdrop-sled-trials',
    title: 'Snowdrop Sled Trials',
    giver: 'gentian',
    rewardAcorns: 300,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: GENTIAN, text: 'You have the look of someone who thinks a tea tray is a toy.', look: GENTIAN_LOOK },
        { speaker: 'You', text: 'Is it not?' },
        { speaker: GENTIAN, text: 'It is a tray. It becomes a sled when you stop arguing with it.', look: GENTIAN_LOOK },
        { speaker: GENTIAN, text: 'One run on the tray, one on skis, start line to finish. Then I lend you the good skis.', look: GENTIAN_LOOK },
        { speaker: GENTIAN, text: 'I am unimpressed by anything that falls over twice. Fall over once, and it is training.', look: GENTIAN_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Sled the Tea-Tray Run, start line to finish',
        probe: 'winter-sled-runs',
        count: 1,
        at: [TEA_TRAY_RUN.start.x, TEA_TRAY_RUN.start.z],
        hint: 'The Tea-Tray Run (rent a tray at the lodge, ride the Bootlace Tow up)',
      },
      {
        kind: 'probe',
        text: 'Ski the Wool Run through the gates',
        probe: 'winter-ski-runs',
        count: 1,
        at: [WOOL_RUN.start.x, WOOL_RUN.start.z],
        hint: 'The Wool Run (rent skis at the lodge, ride the Bootlace Tow up)',
      },
      {
        kind: 'visit',
        text: 'Report back to Gentian on the lodge porch',
        at: LODGE_PORCH,
        radius: 4,
        hint: 'The Woolly Sock Lodge',
        toastOnEnter: `${GENTIAN}: "Both runs, both finished. The good skis are on the rack. Mind the bobble."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: GENTIAN, text: 'Adequate. You fell over once. I counted it as part of the run.', look: GENTIAN_LOOK },
        { speaker: GENTIAN, text: 'Cocoa is on the hatch. It is not a compliment, it is a cup.', look: GENTIAN_LOOK },
      ],
    },
    doneText: 'Gentian has seen you finish both runs. Your best times are in the Snowdrop app on the Gnomlet.',
  },
  {
    id: 'sq-pail-pond-lines',
    title: 'Lines on Pail Pond',
    giver: 'theo-pond',
    rewardAcorns: 250,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THEO, text: '(unscrewing a thermos) Sit. Not there, that is a bear.', look: THEO_LOOK },
        { speaker: 'You', text: 'The bears are fine with this?' },
        { speaker: THEO, text: 'They have been paid in sardines. The tin is by the holes. Do not ask what it cost.', look: THEO_LOOK },
        { speaker: THEO, text: 'Stand on the ice, press E, drill. The ice has never cracked on anybody. It would be rude.', look: THEO_LOOK },
        { speaker: THEO, text: 'Land two. Measure them, card them, slip them back. I lend the rod. The thermos stays with me.', look: THEO_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Drill a hole in the ice on Pail Pond',
        probe: 'ice-holes',
        count: 1,
        at: ICE_SPOT,
        hint: 'Stand on the ice, press E to drill',
      },
      {
        kind: 'probe',
        text: 'Land two fish through the ice (Theo lends a rod)',
        probe: 'ice-catches',
        count: 2,
        at: ICE_SPOT,
        hint: 'Stand on the ice, press E to drill',
      },
      {
        kind: 'visit',
        text: "Show Theo your cards at his shanty",
        at: [SHANTY.x, SHANTY.z],
        radius: 4,
        hint: "Theo's red shanty",
        toastOnEnter: `${THEO}: "Two cards. Both fish are home already. Good. Have some tea."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THEO, text: 'Hm. Not bad. Not good. I would not mention it to the Char.', look: THEO_LOOK },
        { speaker: THEO, text: '(pours) Fishing is mostly sitting. You sat well.', look: THEO_LOOK },
      ],
    },
    doneText: 'Theo has seen your cards. The pond is open to you whenever you bring an auger.',
  },
];
