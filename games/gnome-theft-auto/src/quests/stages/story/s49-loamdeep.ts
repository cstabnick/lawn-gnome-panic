// Story row 49 (Loamdeep): the stages its scenes stand on. The intro and the outro play at the Burrow Door (E17:
// societies/config.ts BURROW_DOOR; the door, its mound, post and signs are built by societies/loamdeep/door.ts, nothing
// here stands inside them): by day with the round door open on a lit hall, and by night with a supper table laid out on
// the grass. DJ Moleman's decks are an interior (the hidden burrow at the bottom of the Long Tunnel) and a scene cannot
// be staged inside one, so the mid scene plays on a cutscene-only set on the apron south-east of the mound: his decks,
// dug-in speakers and lamps, carried up for one night. The set exists only inside the scene (scene `props`), never in
// the live world. The Juniper's-call giver of row 50 stands at the supper stage: it is where row 49 ends.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'burrow-door-welcome',
    name: 'The Burrow Door by day, the hall lit behind it',
    region: 'west-estates',
    center: [-989, 301],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m49-loamdeep'],
    look: 'The round stone door open in its grassy mound with warm yellow lamplight spilling out over the step, molehills round the mound, a post box and a sign that asks visitors to knock low, the west road bright and quiet behind.',
    sounds: 'Pine wind across the road, a lamp wick ticking, a polite squeak, a slow bass thump that comes up through the step and is nobody\'s fault.',
    marks: [
      mark('tumblesoil', [-991.2, 300.4], [-986, 300.4], 'stand', 'in the open doorway, a lace shawl, a root cane in one hand and the other held out to the step'),
      mark('nubbin', [-987.5, 301.6], [-991.2, 300.4], 'stand', 'at her side on the step, satchel straight, a post sack that is as big as he is'),
      mark('player', [-984.6, 299.2], [-991.2, 300.4], 'stand', 'on the road side of the step, hat in hand, a little early'),
    ],
    cameras: [
      cam('door', [-984.4, 0.5, 302.4], [-991.4, 0.7, 300.4], 'a mole\'s height from the road, level on the round door with the lamplight in it'),
      cam('step', [-985.6, 0.55, 298.4], [-990.8, 0.75, 301.2], 'low on the step: the lamp, the post sack, and the doorway behind them'),
      cam('wide', [-978, 2.6, 307], [-990, 0.8, 300.5], 'the mound, the open door and the three of them from the road'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'moleman-set-night',
    name: "DJ Moleman's decks, carried up for the night",
    region: 'west-estates',
    center: [-987.5, 307.5],
    radius: 7,
    facing: 0,
    time: 'night',
    built: 'existing',
    usedBy: ['m49-loamdeep'],
    look: 'A square of grass south-east of the mound turned into a burrow for one night: a moss rug, dug-in speakers, crates of records, a ring of lit mole lamps, and one set of decks with a very still mole behind them. The mound is a dark wall of earth behind.',
    sounds: 'Crickets stopped. A record seated in its groove, then the bass: one long track that lifts the grass off the ground.',
    marks: [
      mark('dj moleman', [-987.5, 309.0], [-987.5, 304], 'stand', 'behind his decks, headphones round his neck, spectacles catching the lamplight, one paw on the record'),
      mark('player', [-987.5, 305.0], [-987.5, 309], 'stand', 'on the moss rug in front of the decks, hat in hand'),
      mark('tumblesoil', [-984.6, 306.0], [-987.5, 308], 'stand', 'at the edge of the rug on her root cane, eyes closing'),
      mark('nubbin', [-990.6, 306.2], [-987.5, 308], 'stand', 'small and upright at the other edge, spectacles sliding'),
      mark('pim', [-985.4, 303.8], [-987.5, 308], 'stand', 'the smaller of the twins, bouncing very slightly'),
      mark('pod', [-989.6, 303.8], [-987.5, 308], 'stand', 'the other twin, bouncing very slightly the other way'),
    ],
    cameras: [
      cam('decks', [-987.5, 0.45, 306.2], [-987.5, 0.6, 309.1], 'ground level, a mole\'s eye line, onto the record and the paw on it'),
      cam('wide', [-980.5, 1.7, 300.5], [-987.5, 0.7, 307.5], 'the whole set from the road side: the lamps, the rug, the family round it, the dark mound'),
      cam('crowd', [-993.5, 0.9, 311.5], [-987.2, 0.7, 305.2], 'from behind the decks, low, onto the player and the listening family'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'burrow-door-supper',
    name: 'The Burrow Door at night, a supper table on the grass',
    region: 'west-estates',
    center: [-989, 301],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'night',
    built: 'existing',
    givers: ['juniper-call'],
    usedBy: ['m49-loamdeep'],
    look: 'The round door a little open with the hall lit behind it, a table dragged out onto the grass and laid for a family, lamps lit down the mound, root bundles in a bowl, the road dark and the pines darker.',
    sounds: 'Crickets, a spoon on a bowl, a polite squeak, and a bass thump now and then under the grass that nobody mentions.',
    marks: [
      mark('tumblesoil', [-990.6, 301.2], [-986, 300.4], 'stand', 'behind the table, shawl pinned, a single long root held in both paws'),
      mark('nubbin', [-988.6, 303.4], [-990.6, 301.2], 'stand', 'at the end of the table, a napkin tucked under his chin, too early for supper'),
      mark('player', [-987.2, 299.9], [-990.6, 301.2], 'stand', 'across the table from her, hat in hand'),
    ],
    cameras: [
      cam('table', [-985.6, 0.8, 303.4], [-990.4, 0.8, 300.9], 'low across the table onto Tumblesoil and the root'),
      cam('lamps', [-986.4, 0.5, 297.0], [-993.0, 1.0, 300.4], 'ground level along the lit lamps to the open door'),
      cam('wide', [-978, 2.6, 307], [-990, 0.8, 300.5], 'the mound, the lamps, the table and the three of them in the dark'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
