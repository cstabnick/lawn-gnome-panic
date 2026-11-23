// The HOA Audit (Burt, ex-HOA citation writer). Deadpan bureaucrat: locked-off static shots, long pauses, form-number
// title cards, a thud as a rubber stamp. Intro at Bodega & Sons (bodega-front, noon); the payoff is meanwhile at Burt's
// returns yard (clay-mart-lot), where Reginald Vance drives in on the approach road for a stand-off.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

const BURT = markOf('bodega-front', 'burt');
const PLAYER = markOf('bodega-front', 'player');
const SWEEP = walkOf('bodega-front', 'bodega');

export const HOA_AUDIT_INTRO: SceneScript = {
  id: 'sq-hoa-audit-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The HOA Audit',
  ambience: 'street',
  radio: 0.15,
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'burt', preset: 'burt', at: BURT.at, yaw: BURT.yaw, held: 'ledger' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: SWEEP[0], yaw: Math.PI / 2, held: 'broom' },
  ],
  steps: [
    { do: 'cam', shot: stageCut('bodega-front', 'wide') },
    { do: 'walk', who: 'john', path: [SWEEP[1], SWEEP[0], SWEEP[1]], speed: 0.8, async: true },
    { do: 'wait', s: 1.0 },
    // The form, the stamp.
    { do: 'title', text: 'FORM 404-B: GRIEVANCE' },
    { do: 'wait', s: 2.0 },
    { do: 'title', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-72.5, 92.5, 1.4), look: 'burt', fov: 36 } },
    { do: 'say', who: 'burt', text: 'Form four-oh-four B. Grievance. Filed in triplicate, and read by nobody.' },
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'thud' },
    { do: 'say', who: 'burt', text: 'Rejected.' },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'burt', text: 'The HOA docked three weeks of my overtime. For a cactus in the Dust Flats. And a snowman in Frostbite Fells.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-70.5, 88.5, 1.3), look: 'you', fov: 40 } },
    { do: 'say', who: 'you', text: 'So what is the grievance?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-72.5, 92.5, 1.4), look: 'burt', fov: 36 } },
    { do: 'say', who: 'burt', text: 'The job is the grievance. Five petty HOA officers, out ticketing cacti and snowmen across the map.' },
    { do: 'say', who: 'burt', text: 'Crack all five. Bring me their clipboards. Every clipboard, every stamp.' },
    { do: 'say', who: 'you', text: 'Five clipboards. Got it.' },
    // Sparse music under the rest of the brief.
    { do: 'music', track: 'mystery', fade: 3 },
    { do: 'cam', shot: stageCut('bodega-front', 'arrival') },
    { do: 'say', who: 'burt', text: 'They are not on the board, you understand. The Tall Ones. I checked. Nobody on the board has ever seen one.' },
    { do: 'wait', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-72.5, 92.5, 1.4), look: 'burt', fov: 36 } },
    { do: 'say', who: 'burt', text: 'The reward is my old badge. Still shiny. I would rather it were in the right hands.' },
    { do: 'gesture', who: 'burt', name: 'shrug', s: 1.2 },
    { do: 'say', who: 'you', text: 'Deal.' },
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'thud' },
    { do: 'say', who: 'burt', text: 'Stamped. Go on.' },
    { do: 'wait', s: 1.0 },
  ],
};

// Payoff, meanwhile (NO player actor): Burt sorts the clipboards on his van's bonnet at clay-mart-lot, finds the
// letterhead on the forged Tall-One forms, and Reginald Vance drives in on the approach road for a stand-off.
const CLAY = 'clay-mart-lot';
const LOT = markOf(CLAY, 'burt');
const CLERK = markOf(CLAY, 'clay-mart-clerk');

export const HOA_AUDIT_OUTRO: SceneScript = {
  id: 'sq-hoa-audit-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  ambience: 'street',
  radio: 0.15,
  actors: [
    { id: 'burt', preset: 'burt', at: [-127.5, 162], yaw: -Math.PI / 2, held: 'ledger' },
    { id: 'clerk', name: 'Returns Clerk', look: { hat: 0xa0522d, shirt: 0xe6e0d0 }, at: CLERK.at, yaw: CLERK.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'rvan', seat: 0, at: [-122.5, 60] },
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
    castRide('reginald', 'rvan', [-122.5, 60], 0),
  ],
  steps: [
    { do: 'cam', shot: stageCut(CLAY, 'wide') },
    { do: 'gesture', who: 'clerk', name: 'crossArms', s: 3.0, async: true },
    { do: 'wait', s: 1.0 },
    // Five clipboards, five stamps.
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud' },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-110, 164, 2.0), look: 'burt', fov: 34 } },
    { do: 'say', who: 'burt', text: 'Five clipboards. Five forged Tall-One mandates.' },
    { do: 'gesture', who: 'burt', name: 'point', s: 1.6 },
    { do: 'say', who: 'burt', text: 'Look at the letterhead. Thorne Lawn and Order. Vesper\'s company, printed on forms from the Tall Ones.' },
    { do: 'say', who: 'burt', text: 'The Tall Ones do not print. The Tall Ones do not write. Vesper does both.' },
    // The HOA van drives in on the approach road.
    { do: 'music', track: 'mystery', fade: 2 },
    { do: 'cam', shot: { kind: 'track', pos: above(-112, 150, 2.5), who: 'rvan', fov: 40 } },
    { do: 'drive', vehicle: 'rvan', path: pathOf(CLAY, 'clay-mart-lot-approach'), speed: 7, arrive: true },
    { do: 'exit', who: 'reginald' },
    { do: 'walk', who: 'reginald', path: [[-126, 156]], speed: 1.0 },
    { do: 'face', who: 'reginald', at: 'burt', s: 0.5 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-112, 164, 2.0), look: 'reginald', fov: 34 } },
    { do: 'say', who: 'reginald', text: 'You are not on the board, Burt.' },
    { do: 'say', who: 'burt', text: 'Neither are the Tall Ones.' },
    { do: 'gesture', who: 'reginald', name: 'crossArms', s: 2.0 },
    { do: 'say', who: 'reginald', text: 'Those clipboards are HOA property.' },
    { do: 'say', who: 'burt', text: 'They are on my bonnet, Reginald. Measure away.' },
    { do: 'wait', s: 1.0 },
    { do: 'stinger', id: 'danger' },
    { do: 'say', who: 'reginald', text: 'Then I will be back with a laser level.' },
    // Reginald gets back in and drives off.
    { do: 'enter', who: 'reginald', vehicle: 'rvan', s: 2.6 },
    { do: 'drive', vehicle: 'rvan', path: pathOf(CLAY, 'clay-mart-lot-getaway'), speed: 7, arrive: false },
    { do: 'cam', shot: { kind: 'cut', pos: above(-112, 164, 2.0), look: 'burt', fov: 34 } },
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'thud' },
    { do: 'say', who: 'burt', text: 'Rejected. Stamped. Filed.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const HOA_AUDIT_SCENES: SceneScript[] = [HOA_AUDIT_INTRO, HOA_AUDIT_OUTRO];
