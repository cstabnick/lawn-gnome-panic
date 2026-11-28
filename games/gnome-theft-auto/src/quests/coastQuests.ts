// Saltbucket Shore's four side quests (E11 issue 3A): the Wobbly Gondola (Marram Teaspoon, the Spokewheel), Tubing the Long
// Spoon (Driftwood, the Last Tube), Pirate Tours, Mostly and The Queen's Treasure (Captain Samphire Bilge, the Bathtub
// Queen's cabin). They start in the existing side-quest web (unlocks.ts) and send the player down the coast spur. The
// activities report through window events (coast/probes.ts counts them into 'probe' objectives).
// Lore: docs/lore/entries/apocrypha/{marram-teaspoon,driftwood-castaway,samphire-bilge,the-bathtub-queen,the-spokewheel,
// the-last-tube,the-saltcut}.md.
import type { GnomeLook } from '@lawn/gnome';
import { COAST, COAST_ACH, COAST_QUESTS } from '../coast/config';
import { installCoastProbes } from '../coast/probes';
import { QUEEN_CABIN_INTERIOR } from '../coast/pirateShip';
import { CAST } from '../cutscene/cast';
import type { GiverDef, QuestDef } from './types';

if (typeof window !== 'undefined') installCoastProbes();

// One look per character everywhere: the cutscene cast presets (cutscene/cast.ts).
const MARRAM_LOOK: Partial<GnomeLook> = CAST.marram.look;
const DRIFTWOOD_LOOK: Partial<GnomeLook> = CAST.driftwood.look;
const BILGE_LOOK: Partial<GnomeLook> = CAST.samphire.look;

const MARRAM = 'Marram Teaspoon';
const DRIFTWOOD = 'Driftwood';
const BILGE = 'Captain Samphire Bilge';

const WHEEL = COAST.spokewheel.board;
const RACK = COAST.lastTube.rack;
/** Plank & Pickle's counter on the boardwalk (stall x, a step in front of it). */
const PICKLE_STALL: [number, number] = [-95, 1104];
/** The Bathtub Queen's anchor line on the beach, the end of the pier bowl, the mouth of the Saltcut. */
const ANCHOR: [number, number] = [360, 1175];
/** The pier's handle on the beach (the bowl itself is a deck over the sea, not a ground spot). */
const PIER_HANDLE: [number, number] = [300, 1165];
/** The Saltcut's bank by its mouth (the channel itself is water: a boat can take the same stop). */
const SALTCUT_MOUTH: [number, number] = [770, 1185];
/** The treasure chart's X, on the western beach. */
const CHART_X: [number, number] = [-520, 1170];
/** Where Bilge's cabin is on the deck, and the cabin's own rooms (local coordinates, metres from the room centre). */
const BILGE_SPOT: [number, number] = [0, 1.5];

export const COAST_GIVERS: Record<string, GiverDef> = {
  'coast-spokewheel': {
    id: 'coast-spokewheel',
    name: 'The Spokewheel platform',
    label: 'Talk to Marram Teaspoon',
    x: -252,
    z: 1110,
    exit: { x: -252, z: 1113, yaw: 0 },
    room: 'street',
    letter: '!',
  },
  'coast-last-tube': {
    id: 'coast-last-tube',
    name: 'The Last Tube',
    label: 'Talk to Driftwood',
    x: 156,
    z: 1150,
    exit: { x: 156, z: 1154, yaw: 0 },
    room: 'street',
    letter: '!',
  },
  'coast-bathtub-queen': {
    id: 'coast-bathtub-queen',
    name: "Captain Bilge's Cabin",
    label: 'Talk to Captain Bilge',
    // Local to the cabin (by the table, next to where she stands). The cabin is defined when pirateShip.ts loads, which
    // the import above guarantees happens before createQuests turns this into world coordinates.
    x: BILGE_SPOT[0],
    z: BILGE_SPOT[1],
    exit: { x: 0, z: -3.2, yaw: 0 },
    room: 'street',
    letter: '!',
    interior: QUEEN_CABIN_INTERIOR,
  },
};

const [WHEEL_Q, TUBE_Q, TOURS_Q, TREASURE_Q] = COAST_QUESTS;

export const COAST_QUEST_DEFS: QuestDef[] = [
  {
    id: WHEEL_Q,
    title: 'The Wobbly Gondola',
    giver: 'coast-spokewheel',
    rewardAcorns: 300,
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: MARRAM, text: 'Gondola seven wobbles. Not a lot. A polite amount, but I do not like polite from a gondola.', look: MARRAM_LOOK },
        { speaker: MARRAM, text: 'Ride it round once and listen for the rattle. Hat on, hands in, wait for the bell.', look: MARRAM_LOOK },
        { speaker: MARRAM, text: 'Then fetch a spanner from the Plank & Pickle. Sal swears it is a pickle fork. It is a spanner.', look: MARRAM_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: MARRAM, text: 'Tight as a lid. Gondola seven has stopped being polite.', look: MARRAM_LOOK },
        { speaker: MARRAM, text: 'Ride free, any time. Within reason. I decide the reason.', look: MARRAM_LOOK },
      ],
    },
    objectives: [
      { kind: 'probe', text: 'Ride the Spokewheel once, and listen for the rattle', probe: 'coast-spokewheel-rides', at: [WHEEL.x, WHEEL.z], hint: 'The Spokewheel', },
      { kind: 'visit', text: "Fetch a spanner from Plank & Pickle on the boardwalk", at: PICKLE_STALL, radius: 4, hint: 'Plank & Pickle', toastOnEnter: 'A spanner, wrapped in a pickle napkin. Sal looks innocent.' },
      { kind: 'visit', text: 'Take the spanner back to Marram at the Spokewheel', at: [-252, 1110], radius: 5, hint: 'The Spokewheel platform' },
    ],
    doneText: 'Gondola seven is tight. Marram Teaspoon owes you a ride, and the bell.',
  },
  {
    id: TUBE_Q,
    title: 'Tubing the Long Spoon',
    giver: 'coast-last-tube',
    rewardAcorns: 400,
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: DRIFTWOOD, text: 'I told them the Big Puddle was a real sea. Now there is a real sea. Vindicated, and a little damp.', look: DRIFTWOOD_LOOK },
        { speaker: DRIFTWOOD, text: 'I have set a new slalom out past the pier. Buoys, mostly. Lawn sharks, I hope not.', look: DRIFTWOOD_LOOK },
        { speaker: DRIFTWOOD, text: 'Rent a tube off the rack, hold on, and take three gates. Then see it through to the end.', look: DRIFTWOOD_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: DRIFTWOOD, text: 'You went round the whole thing and came back with your hat. That is a good slalom.', look: DRIFTWOOD_LOOK },
        { speaker: DRIFTWOOD, text: 'No sharks reported. I am taking that as a result.', look: DRIFTWOOD_LOOK },
      ],
    },
    objectives: [
      { kind: 'visit', text: "Rent a tube at Driftwood's rack on the beach", at: [RACK.x, RACK.z], radius: 4, hint: 'The Last Tube', toastOnEnter: 'Rent a tube here (E). Driftwood tows from the launch.' },
      { kind: 'probe', text: 'Take three buoy gates of the slalom on the tube', probe: 'coast-tow-gates', count: 3, at: [RACK.x, RACK.z], hint: 'The Saltwater slalom' },
      { kind: 'probe', text: 'Finish one run of the Saltwater slalom', probe: 'coast-tow-finish', hint: 'The Saltwater slalom' },
      { kind: 'visit', text: 'Tell Driftwood how the slalom rides', at: [156, 1150], radius: 5, hint: 'The Last Tube' },
    ],
    doneText: "The Long Spoon slalom is open. Driftwood's rack is yours at a friend's price.",
  },
  {
    id: TOURS_Q,
    title: 'Pirate Tours, Mostly',
    giver: 'coast-bathtub-queen',
    achievement: COAST_ACH.tours,
    rewardAcorns: 600,
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BILGE, text: 'Tours are at noon. Cargo is at midnight. Both are honest. Every cargo is honest.', look: BILGE_LOOK },
        { speaker: BILGE, text: 'Walk my tourists\' route for me: the anchor, the end of the pier, and the mouth of the Saltcut. Boat or boots, I am not particular.', look: BILGE_LOOK },
        { speaker: BILGE, text: 'And if a Hat Watch patrol wants to look in my hold, they are very welcome to look at you instead.', look: BILGE_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BILGE, text: 'Five stars, no complaints, and nobody asked what was in the hold. Shiver me glaze.', look: BILGE_LOOK },
      ],
    },
    objectives: [
      { kind: 'visit', text: "Walk the tour: the Queen's anchor on the beach", at: ANCHOR, radius: 6, hint: "The Queen's anchor", toastOnEnter: 'Anchor, one. Tourists, none. A gull has taken the first row.' },
      { kind: 'visit', text: 'Stop two: Long Spoon Pier, down the handle', at: PIER_HANDLE, radius: 6, hint: 'Long Spoon Pier' },
      { kind: 'visit', text: 'Stop three: the mouth of the Saltcut, by boat or on foot', at: SALTCUT_MOUTH, radius: 20, hint: 'The Saltcut mouth', toastOnEnter: 'The Saltcut. Where the Puddle Sea learned to run downhill.' },
      { kind: 'visit', text: "Draw the Hat Watch patrol off Bilge's hold, back at the pier", at: [300, 1185], radius: 6, hint: 'Long Spoon Pier', heatOnEnter: 1, toastOnEnter: 'A patrol is nosing about the gangplank. Wave, and keep moving.' },
      { kind: 'visit', text: 'Report back to Captain Bilge in her cabin', at: BILGE_SPOT, radius: 3, hint: 'The Bathtub Queen', interior: QUEEN_CABIN_INTERIOR },
    ],
    doneText: 'Pirate Tours, Mostly: done. Captain Bilge calls it a cruise.',
  },
  {
    id: TREASURE_Q,
    title: "The Queen's Treasure",
    giver: 'coast-bathtub-queen',
    prereq: TOURS_Q,
    achievement: COAST_ACH.treasure,
    rewardAcorns: 800,
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BILGE, text: 'The Queen has a treasure. I have a chart. The chart has an X, and I have a spade you did not see.', look: BILGE_LOOK },
        { speaker: BILGE, text: 'Dig on the western beach, where the X says. Then come and see where I sleep.', look: BILGE_LOOK },
      ],
    },
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BILGE, text: 'You found it. Under my own bed, the whole time. I did say it was honest.', look: BILGE_LOOK },
      ],
    },
    objectives: [
      { kind: 'visit', text: "Dig where Bilge's chart says, on the western beach", at: CHART_X, radius: 5, hint: 'The chart X', toastOnEnter: 'Only a boot.' },
      { kind: 'probe', text: "Open the sea chest where Bilge sleeps, in her cabin", probe: 'coast-queen-chest', hint: "Captain Bilge's cabin" },
    ],
    doneText: "The Queen's Treasure: found, and sort of yours. The chest keeps the rest.",
  },
];
