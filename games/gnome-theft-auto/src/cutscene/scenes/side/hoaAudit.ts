// The HOA Audit (Burt, ex-HOA citation writer). Deadpan bureaucrat: locked-off static shots, long pauses, form-number
// title cards, a thud as a rubber stamp. Intro at Bodega & Sons (bodega-front, noon); the payoff is meanwhile at Burt's
// returns yard (clay-mart-lot), where Reginald Vance drives in on the approach road for a stand-off. Re-directed against
// docs/design/gnome-theft-auto/direction/bible.md; notes in docs/design/gnome-theft-auto/direction/scenes/sq-hoa-audit-*.md.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { above, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

const BODEGA = 'bodega-front';
const BURT = markOf(BODEGA, 'burt');
const PLAYER = markOf(BODEGA, 'player');
const SWEEP = walkOf(BODEGA, 'bodega');
const BURT_AT: Vec2 = [BURT.at[0], BURT.at[1]];
const YOU_AT: Vec2 = [PLAYER.at[0], PLAYER.at[1]];
/** One coverage object for every single of the intro's conversation (the 180-degree rule). */
const TALK = coverage('burt', 'you', -1);

export const HOA_AUDIT_INTRO: SceneScript = {
  id: 'sq-hoa-audit-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The HOA Audit',
  ambience: 'street',
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-hoa-audit-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: YOU_AT, yaw: towards(YOU_AT, BURT_AT) },
    { id: 'burt', preset: 'burt', at: BURT_AT, yaw: towards(BURT_AT, YOU_AT), held: 'ledger' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: SWEEP[0], yaw: Math.PI / 2, held: 'broom' },
  ],
  steps: [
    // 1. Hook: the form number and a stamp, on a frame of Burt, inside the first second.
    ...exchangeLooks('burt', 'you'),
    cut(TALK.single('burt', 'mcu')),
    { do: 'title', text: 'FORM 404-B: GRIEVANCE' },
    { do: 'walk', who: 'john', path: [SWEEP[1], SWEEP[0], SWEEP[1]], speed: 0.8, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.8 },
    { do: 'title', text: null },
    // 2. Setup: the grievance, read out and rejected.
    { do: 'say', who: 'burt', text: 'Form four-oh-four B. Grievance. Filed in triplicate, and read by nobody.' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'thud' },
    cut(stageCut(BODEGA, 'wide')),
    { do: 'wait', s: 2.0 },
    cut(TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'Rejected.' },
    { do: 'say', who: 'burt', text: 'Sorry. Per policy. Three weeks of overtime, docked.' },
    cut(TALK.single('you', 'ms')),
    { do: 'say', who: 'you', text: 'Docked for what?' },
    cut(TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'A cactus in the Dust Flats. A snowman in Frostbite Fells.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'So what is the grievance?' },
    // 3. The job, in his voice: five officers, crack them, bring the clipboards.
    cut(TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'The job is the grievance. Five petty HOA officers.' },
    { do: 'say', who: 'burt', text: 'Crack all five. Bring me their clipboards.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Five clipboards. Got it.' },
    // Sparse music under the rest of the brief; the Tall Ones are the turn: nobody has seen one.
    { do: 'music', track: 'mystery', fade: 3 },
    cut(TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'They are not on the board, you understand.' },
    { do: 'say', who: 'burt', text: 'The Tall Ones. I checked. Sorry. I checked twice.' },
    // 4. Button: the reward, the deal, and the stamp.
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What is the reward?' },
    cut(TALK.single('burt', 'mcu')),
    { do: 'gesture', who: 'burt', name: 'shrug', s: 1.2, async: true },
    { do: 'say', who: 'burt', text: 'My old badge. Still shiny.' },
    { do: 'say', who: 'burt', text: 'I would rather it were in the right hands.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Deal.' },
    beat('pause'),
    cut(TALK.single('burt', 'mcu')),
    { do: 'sfx', id: 'thud' },
    { do: 'say', who: 'burt', text: 'Stamped.' },
    { do: 'wait', s: 1.5 },
  ],
};

// Payoff, meanwhile (NO player actor): Burt sorts the clipboards on his van's bonnet at clay-mart-lot, finds the
// letterhead on the forged Tall-One forms, and Reginald Vance drives in on the approach road for a stand-off.
const CLAY = 'clay-mart-lot';
const CLERK = markOf(CLAY, 'clay-mart-clerk');
const BURT_LOT: Vec2 = [-127.5, 162];
const REG_STOP: Vec2 = [-126, 156];
const LOT_TALK = coverage('burt', 'reginald', 1);
/** Burt's solo frames face the clerk's side of the yard, so no shot looks at him from behind. */
const BURT_SOLO = shot('burt', 'mcu', { toward: 'clerk', side: 30 });
const FORMS: Vec2 = [-131, 164];

export const HOA_AUDIT_OUTRO: SceneScript = {
  id: 'sq-hoa-audit-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  ambience: 'street',
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-hoa-audit-outro.md', kind: 'outro' },
  actors: [
    { id: 'burt', preset: 'burt', at: BURT_LOT, yaw: towards(BURT_LOT, CLERK.at), held: 'ledger' },
    { id: 'clerk', name: 'Returns Clerk', look: { hat: 0xa0522d, shirt: 0xe6e0d0 }, at: CLERK.at, yaw: CLERK.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'rvan', seat: 0, at: [-122.5, 112] },
  ],
  props: [
    { id: 'form1', prefab: 'ledger', at: [-131.2, 163.2], yaw: 0, size: 0.7 },
    { id: 'form2', prefab: 'ledger', at: [-130.2, 163.6], yaw: 0.2, size: 0.7 },
    { id: 'form3', prefab: 'ledger', at: [-132.2, 163.6], yaw: -0.2, size: 0.7 },
    { id: 'form4', prefab: 'ledger', at: [-130.8, 164.4], yaw: 0.4, size: 0.7 },
    { id: 'form5', prefab: 'ledger', at: [-131.8, 164.6], yaw: -0.3, size: 0.7 },
  ],
  vehicles: [
    castRide('burt', 'van'),
    castRide('reginald', 'rvan', [-122.5, 112], 0),
  ],
  steps: [
    // 1. Hook: the first stamp on a locked insert of the forms, then the stamps come as quick cuts.
    { do: 'cam', shot: { kind: 'cut', pos: above(-128.5, 166.6, 1.1), look: [FORMS[0], 0.4, FORMS[1]], fov: 40 } },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.9 },
    cut(BURT_SOLO),
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.9 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-128.5, 166.6, 1.1), look: [FORMS[0], 0.4, FORMS[1]], fov: 40 } },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.9 },
    cut(BURT_SOLO),
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.9 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-128.5, 166.6, 1.1), look: [FORMS[0], 0.4, FORMS[1]], fov: 40 } },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 0.9 },
    // 2. The discovery: the letterhead is Vesper's, on the Tall Ones' forms. Burt, then a reaction from the clerk.
    cut(BURT_SOLO),
    { do: 'say', who: 'burt', text: 'Five clipboards. Five forged Tall-One mandates.' },
    { do: 'gesture', who: 'burt', name: 'point', s: 1.6, async: true },
    { do: 'say', who: 'burt', text: 'Look at the letterhead. Thorne Lawn and Order, Vesper\'s company.' },
    ...reaction('clerk', { toward: 'burt', size: 'mcu', hold: 'pause', gesture: 'crossArms' }),
    cut(BURT_SOLO),
    { do: 'say', who: 'burt', text: 'The Tall Ones do not print. Vesper does both.' },
    // 3. The turn: the HOA van drives in on the approach road.
    { do: 'music', track: 'mystery', fade: 2 },
    { do: 'cam', shot: { kind: 'track', pos: above(-118, 158, 1.6), who: 'rvan', fov: 40 } },
    { do: 'drive', vehicle: 'rvan', path: [[-122.5, 150]], speed: 7, arrive: true },
    { do: 'exit', who: 'reginald' },
    // The wide carries him across the yard; the singles start only once he has stopped, clear of the van.
    cut(stageCut(CLAY, 'wide')),
    { do: 'walk', who: 'reginald', path: [REG_STOP], speed: 1.5 },
    // 4. The stand-off, singles on one side of the line. Reginald shot high (looking down on them) until he enforces.
    cut(LOT_TALK.single('reginald', 'ms', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'You are not on the board, Burt.' },
    cut(LOT_TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'Neither are the Tall Ones.' },
    cut(LOT_TALK.single('reginald', 'ms', { height: 'high' })),
    { do: 'gesture', who: 'reginald', name: 'crossArms', s: 2.0 },
    { do: 'say', who: 'reginald', text: 'Those clipboards are HOA property.' },
    cut(LOT_TALK.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'They are on my bonnet, Reginald. Measure away.' },
    { do: 'wait', s: 1.0 },
    cut(LOT_TALK.single('reginald', 'ms', { height: 'low' })),
    { do: 'stinger', id: 'danger' },
    { do: 'say', who: 'reginald', text: 'Then I will be back with a laser level.' },
    // 5. Reginald gets back in and drives off; the wide holds the van's exit for 2-3 s.
    { do: 'enter', who: 'reginald', vehicle: 'rvan', s: 2.6 },
    cut(stageCut(CLAY, 'wide')),
    { do: 'drive', vehicle: 'rvan', path: [[-122.5, 112]], speed: 9, arrive: false, async: true },
    { do: 'wait', s: 2.5 },
    // Button: Burt, alone, locked off on the stamp.
    cut(BURT_SOLO),
    { do: 'sfx', id: 'thud' },
    { do: 'say', who: 'burt', text: 'Rejected. Stamped. Filed.' },
    { do: 'wait', s: 1.5 },
  ],
};

export const HOA_AUDIT_SCENES: SceneScript[] = [HOA_AUDIT_INTRO, HOA_AUDIT_OUTRO];
