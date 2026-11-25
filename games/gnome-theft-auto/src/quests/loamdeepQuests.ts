// Loamdeep side quests (E17 issue Q1): Nubbin's post, Tumblesoil's lamps, and the Under-Chorus (DJ Moleman comes up to
// play). Places: societies/config.ts (LOAMDEEP, BURROW_DOOR, MOLEMAN_BURROW, SOCIETY_QUESTS, SOCIETY_PROBES).
import { LOAMDEEP, MOLEMAN_BURROW, SOCIETY_CAST, SOCIETY_INTERIORS, SOCIETY_PROBES, SOCIETY_QUESTS, type XZ } from '../societies/config';
import type { QuestDef } from './types';

const NUBBIN = SOCIETY_CAST.nubbin;
const TUMBLESOIL = SOCIETY_CAST.tumblesoil;
const SIFT = SOCIETY_CAST.sift;
const DELVE = SOCIETY_CAST.delve;
const CRUMB = SOCIETY_CAST.crumb;
const MOLEMAN = SOCIETY_CAST.moleman;

/** Copies a config point into the mutable tuple a visit objective takes. */
const at = (p: XZ): [number, number] => [p[0], p[1]];

/** The Moles have no gnome look: their lines carry none. */
const MOLE_LOOK = undefined;

export const LOAMDEEP_QUESTS: readonly QuestDef[] = [
  {
    id: SOCIETY_QUESTS.burrowPost,
    title: 'Sorting the Post',
    giver: 'nubbin',
    rewardAcorns: 300,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: NUBBIN, text: 'If you please, the post is late. I am sorry for it.', look: MOLE_LOOK },
        { speaker: 'You', text: 'Late by how much?' },
        { speaker: NUBBIN, text: 'Eleven days. I got lost up top, and the pigeonholes have been waiting for me ever since.', look: MOLE_LOOK },
        { speaker: NUBBIN, text: `${SIFT} is far too polite to complain, so I am complaining for him. Quietly.`, look: MOLE_LOOK },
        { speaker: NUBBIN, text: 'Would you sort the post at the Postern? Mind the pigeonholes. They are very particular.', look: MOLE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Sort the post with Mister Sift at the Postern',
        at: at(LOAMDEEP.spots.sortingDesk),
        radius: 2.5,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: 'Postern Hall, Loamdeep (the Burrow Door)',
        toastOnEnter: `${SIFT}: "Ah. The post. Thank you, you are very kind not to ask why it is late."`,
      },
      {
        kind: 'probe',
        text: 'Sort the post at the pigeonholes',
        probe: SOCIETY_PROBES.molePost,
        count: 1,
        hint: 'Postern Hall',
      },
      {
        kind: 'visit',
        text: "Take Ma'am her letter to the Mother's Hall",
        at: at(LOAMDEEP.spots.tumblesoilFront),
        radius: 2.5,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: "The Mother's Hall, Loamdeep (the Burrow Door)",
      },
      {
        kind: 'visit',
        text: "Auntie Crumb's letter, to Hearth Hall",
        at: at(LOAMDEEP.spots.rootDrops.hearth),
        radius: 3,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: 'Hearth Hall, Loamdeep (the Burrow Door)',
        toastOnEnter: `${CRUMB}: "Grub bread? No? Oh. Never mind, dear. Next time."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: NUBBIN, text: 'Oh. Most kind. I shall carry the next one with care.', look: MOLE_LOOK },
        { speaker: TUMBLESOIL, text: 'Dear one. Come and see me.', look: MOLE_LOOK },
      ],
    },
    doneText: 'The post is sorted and mostly on time. Nubbin has promised to carry the next one with care.',
  },
  {
    id: SOCIETY_QUESTS.lamps,
    title: 'Lamplighters',
    giver: 'tumblesoil',
    prereq: SOCIETY_QUESTS.burrowPost,
    rewardAcorns: 400,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: TUMBLESOIL, text: 'Sit. Mind the lamp. It is older than your hat.', look: MOLE_LOOK },
        { speaker: 'You', text: 'I was not going to sit on the lamp.' },
        { speaker: TUMBLESOIL, text: 'The lamps down the tunnels have burned low, dear. Mistress Delve\'s knees are not what they were.', look: MOLE_LOOK },
        { speaker: TUMBLESOIL, text: 'Go to Lamplight Hall and ask her for a taper. Then light the lamps down three tunnels.', look: MOLE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Take a taper from Mistress Delve in Lamplight Hall',
        at: at(LOAMDEEP.spots.taper),
        radius: 2.5,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: 'Lamplight Hall, Loamdeep (take a taper)',
        toastOnEnter: `${DELVE} hands you a taper. "Light them as if they were asleep. Gently."`,
      },
      {
        kind: 'probe',
        text: 'Light the lamps down three tunnels (Lamplighter x3)',
        probe: SOCIETY_PROBES.moleLamps,
        count: 3,
        hint: 'Lamplight Hall: take a taper',
      },
      {
        kind: 'visit',
        text: "Tell Old Mother Tumblesoil the lamps are lit",
        at: at(LOAMDEEP.spots.tumblesoilFront),
        radius: 2.5,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: "The Mother's Hall, Loamdeep (the Burrow Door)",
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: TUMBLESOIL, text: 'We dig where we are asked, dear one. Nobody has ever asked.', look: MOLE_LOOK },
        { speaker: TUMBLESOIL, text: 'The Under-Chorus has had no music since the cousin moved out. I should like the family together for one supper.', look: MOLE_LOOK },
      ],
    },
    doneText: 'The lamps are lit down three tunnels. Old Mother Tumblesoil says the Mother\'s Hall is warmer already.',
  },
  {
    id: SOCIETY_QUESTS.underChorus,
    title: 'The Under-Chorus',
    giver: 'tumblesoil',
    prereq: SOCIETY_QUESTS.lamps,
    rewardAcorns: 500,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: TUMBLESOIL, text: 'I want the family together for one supper. Every one of us, dear.', look: MOLE_LOOK },
        { speaker: 'You', text: 'Who is missing?' },
        { speaker: TUMBLESOIL, text: `${MOLEMAN} lives at the bottom of the Long Tunnel. He has been home for supper every night for eleven years, just further down.`, look: MOLE_LOOK },
        { speaker: TUMBLESOIL, text: 'Bring him the invitation. Take the Long Tunnel down, and bring him up to the Under-Chorus.', look: MOLE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Roots for the welcome supper (a Root Run)',
        probe: SOCIETY_PROBES.moleRoots,
        count: 1,
        hint: 'Rootway Hall',
      },
      {
        kind: 'visit',
        text: 'Take the invitation down the Long Tunnel',
        at: [MOLEMAN_BURROW.moleman[0], MOLEMAN_BURROW.moleman[1] + 1.6],
        radius: 2.5,
        interior: SOCIETY_INTERIORS.moleman,
        hint: 'Under-Chorus Hall: the Long Tunnel',
        toastOnEnter: `${MOLEMAN} lifts one headphone, reads the invitation, says "Seat." and starts packing a crate of records.`,
      },
      {
        kind: 'visit',
        text: 'Back up to the Under-Chorus',
        at: at(LOAMDEEP.spots.danceFloor),
        radius: 4,
        interior: SOCIETY_INTERIORS.loamdeep,
        hint: 'Under-Chorus Hall, Loamdeep (the Long Tunnel)',
        toastOnEnter: 'The floor starts to hum.',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: MOLEMAN, text: 'Evening, Ma\'am. I brought the floor.', look: MOLE_LOOK },
        { speaker: TUMBLESOIL, text: 'The Hall\'s heartbeat. Welcome home, cousin.', look: MOLE_LOOK },
        { speaker: NUBBIN, text: 'Is it always this loud?', look: MOLE_LOOK },
        { speaker: MOLEMAN, text: 'Only where it matters. Seat.', look: MOLE_LOOK },
      ],
    },
    doneText: 'DJ Moleman is playing the Under-Chorus. The moles say it is the first time the halls have danced since the dry summer.',
  },
];
