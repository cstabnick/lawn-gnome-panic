// Story row 52 (docs/design/gnome-theft-auto/story-outline.md): The Test Cut, the extended quest that turns act III into
// act IV. Previously: the Flock, the moles and Dame Peony are all at Hedgeworth for the test, and the crew holds the
// other three parts (power, guidance, money). Tonight the fourth part, the Grand Combine's cutting deck, is tested on
// Peony's course, and nothing the crew has can stop it.
// - p1 Tee Time (day, then dusk): Peony puts the player in a caddy bib for Vesper's backers' gala; caddy the
//   Countess's bag down to the first tee, then overhear Vesper and the Countess at the terrace rail ("a straight line
//   through the ninth"; the Countess flinches at "vines").
// - p2 Mow Line (dusk): the deck wakes behind the hedge in the middle of the course; moles first (Tumblesoil's family
//   off the ninth green to the Burrow Door, L58), then crack the HOA marshals roping the Clubhouse path, then Peony (with
//   Basil and Thrift) to the Clubhouse door. The Flock stand in the line and hop clear on one leg.
// - p3 Against the Deck (dusk): 60 s on the ninth against the deck's escort (the deck itself is a cutscene set piece
//   and cannot be damaged: the outline's fallback); Pip and Tansy come in on the radio. The player's best shot, off
//   Peony's own driver, goes under the blades and they keep turning.
// - final Through the Hedge (dusk, night): Vesper on every loudspeaker; out through the hedge arches and the Kicked
//   Board ahead of the deck; at night Turfton hears the date of the Even Cut: the longest day. W14 (the mown scar)
//   follows it; achievement gta-nothing-works.
// The deck's test line (W14, worldChanges/rows/mownScar.ts TEST_LINE): from the middle of the course, past the cut end
// of the hedge between the ninth and the middle, across the ninth fairway south of the green, to the Kicked Board.
// Scenes: cutscene/scenes/story/m52-the-test-cut.ts. Stages: quests/stages/story/s52-the-test-cut.ts.
import type { GnomeLook } from '@lawn/gnome';
import { BURROW_DOOR } from '../../societies/config';
import { CLUBHOUSE, HEDGE_ARCHES, KICKED_BOARD } from '../../golf/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const P1 = 'm52-the-test-cut-p1';
const P2 = 'm52-the-test-cut-p2';
const P3 = 'm52-the-test-cut-p3';
const FINAL = 'm52-the-test-cut';

/** HOA marshals: the black hat and the tan shirt, with a hi-vis vest for the night of the test. */
const MARSHAL_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xd8c24a, pants: 0x3a3228 };

const BOARD: [number, number] = [KICKED_BOARD.x, KICKED_BOARD.z];
const CLUB_DOOR: [number, number] = [CLUBHOUSE.doorOut.x, CLUBHOUSE.doorOut.z + 1];
/** The first tee arch (into the middle of the course) and the ninth's arch (out of it), golf/types.ts HEDGE_ARCHES. */
const ARCH_MIDDLE = HEDGE_ARCHES[0];
const ARCH_NINTH = HEDGE_ARCHES[2];

const QUESTS: readonly QuestDef[] = [
  {
    id: P1,
    title: 'The Test Cut: Tee Time',
    giver: 'peony',
    prereq: 'm51-the-flock-stands',
    chapter: 3,
    rewardAcorns: 250,
    radioBulletin: P1,
    // A gala on a golf course: nobody in the Hat Watch would dream of making a scene at a gala.
    hoa: 'off',
    // Day on the terrace: the HOA tests its new loudspeakers; Peony hands the player a caddy bib with a nine on it.
    cutscene: { kind: 'script', script: 'm52-the-test-cut-p1-intro' },
    objectives: [
      {
        kind: 'visit',
        text: "Caddy the Countess's bag across the terrace and down to the first tee",
        at: [-1078, 481],
        radius: 4,
        hint: 'The first tee, below the Clubhouse terrace',
        toastOnEnter: 'The backers drive off one by one. Nobody looks at the caddy. Nobody tips.',
      },
      {
        kind: 'inspect',
        text: 'Stand by the terrace rail with the bag and overhear Vesper and the Countess',
        verb: 'Overhear',
        holdSeconds: 3,
        hint: 'The east end of the Clubhouse terrace',
        scene: 'm52-the-test-cut-p1-mid',
        points: [
          {
            at: [-1053.4, 458.2],
            label: "By the rail, behind the parasol, with the Countess's bag",
            prop: 'golf-bag',
            note: 'Very soft, very even: "...a straight line through the ninth." The Countess has gone quiet.',
          },
        ],
      },
    ],
    doneText: 'Vesper says the deck will cut a straight line through the ninth, round nothing. The Countess flinched. Peony said nothing.',
  },
  {
    id: P2,
    title: 'The Test Cut: Mow Line',
    giver: 'peony',
    prereq: P1,
    chapter: 3,
    rewardAcorns: 400,
    radioBulletin: P2,
    // An evacuation: no Hat Watch on the rides. The marshals on the Clubhouse path may notice (1 hat), no pursuits.
    hoa: 'off',
    hoaSteps: { 1: { cap: 1 } },
    // Dusk on the ninth: the teacup rattles, then the first blade comes up over the hedge.
    cutscene: { kind: 'script', script: 'm52-the-test-cut-p2-intro' },
    // Dusk from the terrace: the deck draws its line across the course; the Flock stand in it and hop clear.
    outro: { kind: 'script', script: 'm52-the-test-cut-p2-outro' },
    objectives: [
      {
        // L58: the mole family off the ninth green, down to the Burrow Door (their burrow is in Loamdeep).
        kind: 'passenger',
        text: 'Moles first: drive Old Mother Tumblesoil and the ninth-green family to the Burrow Door',
        who: 'tumblesoil',
        name: 'Old Mother Tumblesoil',
        pickup: [-1064, 623],
        dropAt: [BURROW_DOOR.exit.x + 3, BURROW_DOOR.exit.z],
        radius: 7,
        hint: 'Out through the Kicked Board and north up the fence road to the Burrow Door',
        vehicle: { kind: 'golf-cart', at: [-1058, 621, Math.PI / 2] },
        onBoard: 'Tumblesoil climbs in. Five small moles climb in after her, oldest first.',
        onDrop: 'The family goes down through the Burrow Door. Tumblesoil waits at the top, looking west.',
        banter: [
          'Tumblesoil: "Gently over the bumps, dear one. The little ones are counting."',
          'Tumblesoil: "Five. Yes. That is all of them. Most kind."',
          'Tumblesoil: "We dig under every garden in Turfton. Never once under a machine like that."',
        ],
      },
      {
        kind: 'crack',
        text: 'Crack the HOA marshals roping off the cart path to the Clubhouse',
        targets: [
          { id: 'm52-marshal-pumice', name: 'HOA Marshal Pumice', near: [-1027, 584], hint: 'The east cart path, by the ninth', look: MARSHAL_LOOK },
          { id: 'm52-marshal-grit', name: 'HOA Marshal Grit', near: [-1026, 556], hint: 'The east cart path', look: MARSHAL_LOOK },
          { id: 'm52-marshal-lime', name: 'HOA Marshal Lime', near: [-1029, 526], hint: 'The east cart path, below the Clubhouse', look: MARSHAL_LOOK },
        ],
      },
      {
        kind: 'passenger',
        text: 'Then the rest: drive Dame Peony, Basil and Thrift off the ninth to the Clubhouse door',
        who: 'peony',
        name: 'Dame Peony',
        pickup: [-1058, 617],
        dropAt: CLUB_DOOR,
        radius: 6,
        hint: "Thrift's shed by the ninth green, then up the east cart path to the Clubhouse",
        vehicle: { kind: 'golf-cart', at: [-1052, 619, Math.PI / 2] },
        onBoard: 'Peony climbs in. Basil climbs in after her with the gala flag. Thrift has to be talked off his green.',
        onDrop: 'Peony steps down at her own front door and does not look round. Basil and Thrift do.',
        banter: [
          'Thrift: "I watered it this morning. All of it."',
          'Basil: "Nine holes, champ. Twenty years. It took the ninth first."',
          'Peony: "Eyes front, my dear. One does not look back at a course."',
        ],
      },
    ],
    doneText: "The moles are down the Burrow Door and Hedgeworth's three are at the Clubhouse. The deck has drawn its line to the ninth.",
  },
  {
    id: P3,
    title: 'The Test Cut: Against the Deck',
    giver: 'peony',
    prereq: P2,
    chapter: 3,
    rewardAcorns: 400,
    radioBulletin: P3,
    // Dusk on the ninth: the deck rolls toward the green; Pip and Tansy on the radio; the player turns to face it.
    cutscene: { kind: 'script', script: 'm52-the-test-cut-p3-intro' },
    // Dusk: the player's best shot goes under the blades, and they keep turning. No gag.
    outro: { kind: 'script', script: 'm52-the-test-cut-p3-outro' },
    objectives: [
      {
        // The outline's fallback: the deck is a set piece and cannot be damaged; the fight is with its escort.
        kind: 'survive-derby',
        text: 'Throw everything at the deck on the ninth fairway: hold out against its escort for 60 seconds',
        arena: [-1077, 662],
        radius: 16,
        seconds: 60,
        attackers: 5,
        hint: 'The ninth fairway, in front of the deck',
      },
    ],
    doneText: 'Sixty seconds of everything. The blades went over all of it and kept turning. Nothing works.',
  },
  {
    // The final part keeps the row id (prereq chain: p1 <- m51, p2 <- p1, p3 <- p2, this <- p3).
    id: FINAL,
    title: 'The Test Cut: Through the Hedge',
    giver: 'peony',
    prereq: P3,
    chapter: 3,
    rewardAcorns: 750,
    radioBulletin: FINAL,
    achievement: 'gta-nothing-works',
    // Dusk on the terrace: Vesper on every loudspeaker; Tansy: nothing works, go.
    cutscene: { kind: 'script', script: 'm52-the-test-cut-intro' },
    // Night outside the Kicked Board: the crew through the hedge, and the longest day named across Turfton.
    outro: { kind: 'script', script: 'm52-the-test-cut-outro' },
    objectives: [
      {
        // The long way round: the deck's escort holds the east cart path, so through the middle by the two hedge arches.
        kind: 'checkpoints',
        text: 'Get everyone out the long way: through the hedge arches, round behind the deck',
        vehicle: { kind: 'golf-cart', at: [-1066, 469, Math.PI] },
        seconds: 70,
        heatOnStart: 2,
        hint: 'The hedge arch below the first tee, then the arch onto the ninth',
        points: [
          { at: [-1080, 490], radius: 9, label: 'Off the terrace, past the first tee (the clock starts)' },
          { at: [ARCH_MIDDLE.x, ARCH_MIDDLE.z], radius: 5, label: 'Through the hedge arch into the middle' },
          { at: [-1162, 600], radius: 10, label: 'Through the giants, the deck loud behind the hedge' },
          { at: [ARCH_NINTH.x, ARCH_NINTH.z], radius: 5, label: 'Through the hedge arch onto the ninth' },
        ],
      },
      {
        kind: 'checkpoints',
        text: 'Race the deck to the Kicked Board and out through the fence',
        seconds: 40,
        hint: 'The Kicked Board, east of the ninth green',
        points: [
          { at: [-1040, 628], radius: 9, label: 'Past the ninth green, ahead of the deck' },
          { at: BOARD, radius: 6, label: 'Out through the Kicked Board' },
          { at: [-965, 640], radius: 10, label: 'The fence road, clear of the fence' },
        ],
      },
    ],
    doneText: 'Out through the Kicked Board. The deck stopped at the fence, pointing at Turfton. The Even Cut is on the longest day.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P1]: {
      0: brief(
        ['peony', 'The Flock is here, the moles are under my ninth. Tonight they test the deck.'],
        ["peony", "Mr Thorne's backers dine on my terrace first. Caddy for them. I will say nothing."],
        ['peony', 'Hedgeworth, my dear: in through the Kicked Board. Two hundred and fifty acorns.'],
      ),
      1: call(['peony', 'Bag down, my dear. Now drift back to the rail. Caddies drift.']),
    },
    [P2]: {
      0: brief(
        ['pip', 'The HOA radio just said "deck awake". That is a very big blade!'],
        ['tumblesoil', 'Moles first, dear one, if it pleases the Hall. Then the rest.'],
        ['peony', 'The Burrow Door, then back for us. Four hundred acorns. Mind the marshals.'],
      ),
      1: call(['thrift', 'Marshals on my cart path, roping it off. Rope. On my path.']),
      2: call(['peony', 'Path is clear. We are at the shed, my dear. Basil has the flag.']),
    },
    [P3]: {
      0: brief(
        ['tansy', 'Pip and I are on the radio. Coming in by the board. Hit it.'],
        ['pip', 'Everything we have! Carts, balls, my toolbox. Everything!'],
        ['peony', 'Sixty seconds on my ninth, my dear. Four hundred acorns. Make it count.'],
      ),
    },
    [FINAL]: {
      0: brief(
        ['tansy', 'Nothing works on it. Go. Everyone in the cart, out by the arches.'],
        ['peony', 'Through the hedge, my dear, and out by the Kicked Board. Seven hundred and fifty.'],
      ),
      1: call(
        ['vesper', 'Friends of Turfton. The test is concluded. The deck performs to specification.'],
        ['vesper', 'The Even Cut will take place on the longest day. Thank you.'],
      ),
    },
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
    [P3]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P1]: [
      'Hedgeworth Links hosted a gala for the backers of a large civic project today. Guests praised the canapés and the view.',
      'One guest described the caddies at the Hedgeworth gala as very quiet, very attentive, and wearing a six.',
    ],
    [P2]: [
      'Residents west of Tallgrass Commons report the ground shaking at dusk. The HOA describes it as a scheduled demonstration.',
      'A family of moles was seen leaving Hedgeworth Links in a golf cart this evening. Witnesses say the moles were very polite.',
    ],
    [P3]: [
      'A large machine is crossing Hedgeworth Links at walking pace. Golfers are asked not to play through.',
      'The HOA confirms the machine was struck by several objects this evening. The HOA confirms the machine did not notice.',
    ],
    [FINAL]: [
      'Vesper Thorne announced the date of the Even Cut tonight, over every loudspeaker in Turfton. It is the longest day.',
      'Hedgeworth Links is closed until further notice. Its groundskeeper was seen on the ninth after dark, on his knees.',
    ],
  },
};
