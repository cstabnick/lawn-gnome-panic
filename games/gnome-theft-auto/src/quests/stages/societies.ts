// E17 underground societies (docs/roadmaps/gta-batch-3/E17): the Underspan beside the Unfinished Span (Hogweed
// Sprocket), Wader's Rest (Mother Saxifrage Wader) and the Burrow Door (Nubbin; Old Mother Tumblesoil gives her quests
// inside Loamdeep, so her stage is the door above). Conventions and types: ../stages.ts and ./kit.ts. The places are
// built by societies/ (config.ts holds every point).
import { cam, mark, type Stage } from './kit';

export const SOCIETY_STAGES: readonly Stage[] = [
  {
    id: 'hogweed',
    name: "The Underspan, outside Hogweed's Workshop",
    region: 'dust-flats',
    center: [580, -18],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['hogweed'],
    usedBy: ['sq-underspan-verticality', 'sq-underspan-scrap-run'],
    look: 'A scrap shed patched with road signs, scaffold towers holding up a plank deck, manifesto posters, a post stacked with HOA citations.',
    sounds: 'Weld crackle, a pedal generator whirring, traffic thumping over the Skyway.',
    marks: [
      mark('hogweed', [580, -18], [578, -18], 'stand', 'goggles up, waving a spanner at three ideas at once'),
      mark('player', [578, -18], [580, -18], 'stand', 'walks in from the road'),
    ],
    cameras: [
      cam('shed', [574, 1.8, -22], [581, 1.2, -17], 'from the road side onto Hogweed and the workshop door'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'saxifrage',
    name: "Wader's Rest, by the ritual circle",
    region: 'west-estates',
    center: [-1121, -634],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['saxifrage'],
    usedBy: ['sq-flock-errands', 'sq-flock-vigil'],
    look: 'Grey tents round a ring of one-leg stones, the giant pink Standing Lady on her sand mound, grey washing, a rota board.',
    sounds: 'Reeds in the wind, a low hum from the circle, someone wobbling.',
    marks: [
      mark('saxifrage', [-1121, -634], [-1123, -634], 'stand', 'on one leg, staff in hand'),
      mark('player', [-1123, -634], [-1121, -634], 'stand', 'comes over from the gate, on two legs, for now'),
    ],
    cameras: [
      cam('circle', [-1127, 1.8, -630], [-1121, 1.3, -634], 'from the circle onto Saxifrage with the Lady behind'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'burrow-door',
    name: 'The Burrow Door, at the west edge of Mossy Wood',
    region: 'west-estates',
    center: [-993, 303.5],
    radius: 8,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['nubbin', 'tumblesoil'],
    usedBy: ['sq-burrow-post', 'sq-loamdeep-lamps', 'sq-loamdeep-under-chorus'],
    look: 'A grassy mound with a round stone door a little open, molehills, a tiny post box, a sign asking visitors to knock low.',
    sounds: 'Wind in the pines across the road, a polite squeak, a faint bass through the ground.',
    marks: [
      mark('nubbin', [-993, 303.5], [-991, 303.5], 'stand', 'a small mole with a satchel too big for him'),
      mark('player', [-991, 303.5], [-993, 303.5], 'stand', 'crouches a little to be polite'),
    ],
    cameras: [
      cam('door', [-987, 1.4, 306], [-994, 0.8, 302], 'from the road onto Nubbin and the round door'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
