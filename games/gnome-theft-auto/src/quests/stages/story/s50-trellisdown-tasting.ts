// Story row 50 (Trellisdown Tasting): the stages its scenes stand on. Juniper's terrace on Kerb Row at dusk (the call, the
// ledger sketched on a blotter; the same pavement as row 12's stage, other light), Brassknock Manor's front terrace at night
// (E16: country/manor.ts; the tasting spills out onto the forecourt, the Countess at a lectern on the raised terrace, 1.2 m
// above the gravel) and the manor gate on the vineyard lane at night (the way out, Chicory at the gatepost). The tasting
// HALL is an interior and a scene cannot be staged inside one: the waiter's tray runs through the hall (interior-visit),
// the ledger is read on the terrace (the outline's own fallback). All dressing (the side table, lectern, lamps, ledger) is
// scene `props`: nothing is built into the live world.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'juniper-terrace-dusk',
    name: "Juniper's terrace, Kerb Row, at dusk",
    region: 'turfton',
    center: [-90, 126],
    radius: 14,
    facing: Math.PI,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m50-trellisdown-tasting'],
    look: 'The pavement in front of the narrowest terrace on Kerb Row at the end of the day: the J. VANCE plate lit by the last gold, a council push-bike on the kerb, and a side table dragged out onto the step with a blotter on it, a cold can, a pencil and a sketch.',
    sounds: 'A phone ringing once on a table, a cold can set down, a bin lid on Kerb Row closed on time, a pencil going over a line twice.',
    marks: [
      mark('juniper', [-88.4, 127.6], [-91.6, 124.6], 'stand', 'on her own front step in her shirtsleeves, the phone at her ear, pencil in the other hand, never hurrying'),
    ],
    cameras: [
      cam('step', [-92.6, 1.5, 123.2], [-88.6, 1.4, 127.4], 'from the pavement onto Juniper on her step, the dusk light on her glasses'),
      cam('wide', [-76, 4.5, 113], [-90, 1.2, 127], 'the terrace front, the bike and the lit step from across the road'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'manor-terrace-night',
    name: 'Brassknock Manor, the tasting on the forecourt',
    region: 'west-estates',
    center: [-1139, 12],
    radius: 14,
    facing: 0,
    time: 'night',
    built: 'existing',
    usedBy: ['m50-trellisdown-tasting'],
    look: 'The pale manor front lit by lanterns, the raised terrace with a lectern and a great open ledger on it, a half-circle of black-tied guests holding thimble glasses on the gravel below, and one waiter with a tray moving through them.',
    sounds: 'Crickets, glass clinks, a distant string tune, murmured approval, a pen scratching on thick paper.',
    marks: [
      mark('wisteria', [-1139, 20.4], Math.PI, 'stand', 'at the lectern on the raised terrace, opera glasses on a stick, one hand flat on the ledger', 1.2),
      mark('vesper', [-1135.2, 15.4], [-1139, 19], 'stand', 'in the front row of guests, calipers in one hand, perfectly still'),
      mark('player', [-1143.4, 13.2], [-1139, 19], 'stand', 'in a waiter\'s black and white, tray at shoulder height, a small camera under the napkin'),
      mark('backer', [-1147.8, 15.6], [-1139, 19], 'stand', 'a stout guest raising a thimble glass to the terrace'),
      mark('backer', [-1131.4, 14.6], [-1139, 19], 'stand', 'a thin guest who has not yet decided whether to like it'),
      mark('backer', [-1133.0, 11.0], [-1139, 19], 'stand', 'at the back of the party, hunting for a waiter'),
    ],
    cameras: [
      cam('wide', [-1156, 2.2, 8], [-1141, 1.9, 17.5], 'low from the forecourt\'s west corner: the lanterns, the guests, the lectern on the terrace'),
      cam('profile', [-1139, 1.5, 6.5], [-1139, 1.6, 14.5], 'from the north, level, onto the player and Vesper in profile with the lit terrace and the Countess between and behind them'),
      cam('lectern', [-1139.6, 1.9, 15.2], [-1139, 2.2, 19.2], 'close from the forecourt onto the lectern and the open ledger'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'manor-gate-night',
    name: 'Brassknock Manor gate, on the vineyard lane at night',
    region: 'west-estates',
    center: [-1150, -14],
    radius: 10,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: ['m50-trellisdown-tasting'],
    look: 'The manor\'s stone gate piers and the lane beyond them, a single carriage lamp on the left pier, the vines black on the hill across the lane and a gardener in a cap with a lantern standing exactly in the gap.',
    sounds: 'Crickets, gravel underfoot, the string tune very far behind, a gardener\'s small sigh.',
    marks: [
      mark('chicory', [-1147.4, -14.2], [-1150, -8], 'stand', 'in the lane just outside the gate piers, a lantern held low, his shears on their lanyard'),
      mark('player', [-1150.6, -9.6], [-1147.4, -14.2], 'stand', 'in the gap between the piers in his waiter\'s black and white, the tray still level'),
    ],
    cameras: [
      cam('gate', [-1156.5, 1.3, -17.5], [-1149, 1.3, -11], 'from the lane, level, onto the gap in the piers and the two of them in it'),
      cam('lane', [-1150.4, 1.5, -2.4], [-1149, 1.3, -12.4], 'from the gravel inside the gate, back through the gap to the lane'),
      cam('wide', [-1134, 2.6, -19], [-1149, 1.0, -11.5], 'the gate, the lamp on the pier, the lane and the dark vineyard'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
