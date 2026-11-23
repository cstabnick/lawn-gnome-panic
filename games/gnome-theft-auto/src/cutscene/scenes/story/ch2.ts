// Chapter 2 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript } from '../../script';
import { markOf, pathOf, rideOf, spot, up } from './kit';

const YARD = 'granny-barn';
const GRANNY = markOf(YARD, 'granny');
const BRAMBLE = markOf(YARD, 'bramble');
/** The south highway from the north, ending at Granny's pull-up (-25, 330). */
const DEW_APPROACH = pathOf(YARD, 'dew-approach');

const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };

/**
 * Chapter 2 opener. The player's Ride-On (Pip in the passenger seat) runs south down the highway into Cloverfield,
 * a Black Dew convoy passes on the other lane, then they pull up at Granny Gnertrude's barn.
 */
export const DEW_RUN_INTRO: SceneScript = {
  id: 'dew-run-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', seatedIn: 'ride', seat: 1, at: [0, 0] },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
  ],
  vehicles: [
    { id: 'ride', kind: 'ride-on', from: 'player', at: [-2.5, 196], yaw: 0 },
    { id: 'convoy', kind: 'hoa-van', at: [2.5, 150], yaw: 0 },
    { id: 'tanker', kind: 'ride-on', tint: 0xf08a24, at: [2.5, 128], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: up(14, 206, 26), who: 'ride', fov: 52 } },
    { do: 'gesture', who: 'granny', name: 'sit', s: 0.2 },
    { do: 'drive', vehicle: 'ride', path: [[-2.5, 196], [-2.5, 236], ...DEW_APPROACH.slice(1)], speed: 10, async: true },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 2 — BLACK DEW & GREENBACKS' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
    { do: 'say', who: 'Narrator', text: 'Cloverfield Farms. Forty acres of gold, and every one of them is for sale.', hz: 130 },
    // The convoy, in the other lane, rumbling up the highway behind the Ride-On.
    { do: 'cam', shot: { kind: 'track', pos: up(9, 214, 1.6), who: 'convoy', fov: 50 } },
    { do: 'drive', vehicle: 'convoy', path: [[2.5, 150], [2.5, 262]], speed: 14, async: true },
    { do: 'drive', vehicle: 'tanker', path: [[2.5, 128], [2.5, 262]], speed: 12, async: true },
    { do: 'say', who: 'Narrator', text: 'A Black Dew convoy rumbles up the highway behind them. Nobody waves.', hz: 130 },
    // Pulling up at the barn.
    { do: 'cam', shot: spot(YARD, 'arrival') },
    { do: 'music', track: 'warm', fade: 2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-57, 340, 1.6), look: 'granny', fov: 46 } },
    { do: 'say', who: 'granny', text: 'Vesper\'s boys are draining my Dew-Wells dry. Pure 87-octane, 100% unlicensed. Just how I like it.' },
    { do: 'gesture', who: 'granny', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'granny', text: 'Borrow a Buck-Iron Combine and park it across the South Highway by Fence-Post Frank\'s sign.' },
    { do: 'say', who: 'granny', text: 'Then bring that Dew-Hauler to my barn. Try not to splatter my prize pumpkins.' },
    { do: 'say', who: 'granny', text: 'They\'re load-bearing, sugar.' },
    { do: 'walk', who: 'bramble', path: [[-42, 358]], speed: 1.2, async: true },
    { do: 'exit', who: 'player' },
    { do: 'exit', who: 'pip' },
    { do: 'walk', who: 'player', path: [[-20, 326]] },
  ],
};

/**
 * Chapter 2 closer for the Dew run: the player brings the Dew-Hauler to Granny's barn. Granny taps the tank, the
 * Clay-Mart letter clears the Kiln-Debt, and Bramble leaves a tease about the pawprints in Biscuit's Nap.
 */
export const DEW_RUN_OUTRO: SceneScript = {
  id: 'dew-run-outro',
  stage: { kind: 'world' },
  music: 'triumph',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, seatedIn: 'hauler', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', seatedIn: 'hauler', seat: 1, at: [0, 0] },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
  ],
  vehicles: [
    { id: 'hauler', kind: 'ride-on', from: 'player', tint: 0xf08a24, at: DEW_APPROACH[0], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: spot(YARD, 'arrival') },
    { do: 'drive', vehicle: 'hauler', path: DEW_APPROACH, speed: 9, async: true },
    { do: 'gesture', who: 'granny', name: 'stand', s: 0.5 },
    { do: 'walk', who: 'granny', path: [[-36, 336]], speed: 1.6 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-28, 344, 1.6), look: 'granny', fov: 46 } },
    { do: 'sfx', id: 'knock', at: 'hauler' },
    { do: 'gesture', who: 'granny', name: 'nod', s: 1.0, async: true },
    { do: 'say', who: 'granny', text: 'Now we can cook.' },
    { do: 'exit', who: 'player' },
    { do: 'exit', who: 'pip' },
    { do: 'give', from: 'granny', to: 'pip', prop: 'sealed-letter' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-17, 334, 1.6), look: 'pip', fov: 44 } },
    { do: 'say', who: 'pip', text: 'Clay-Mart Collections. Your five thousand Acorn Kiln-Debt is PAID IN FULL.', stinger: 'triumph', sfx: 'cash' },
    { do: 'say', who: 'pip', text: 'We\'re legitimate! ...Don\'t tell anyone.' },
    { do: 'music', track: 'warm', fade: 2 },
    { do: 'give', from: 'granny', to: 'player', prop: 'espresso-cup' },
    { do: 'say', who: 'granny', text: 'Tea, sugar. Dew makes everybody thirsty.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-40, 360, 1.6), look: 'bramble', fov: 46 } },
    { do: 'say', who: 'bramble', text: 'Something big\'s been napping in Biscuit\'s Nap again. Paw prints like dinner plates.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-14, 324, 1.6), look: 'player', fov: 50 } },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    { do: 'walk', who: 'player', path: [[-20, 326]] },
  ],
};

/**
 * Chapter 2 sprinkler gauntlet, opener: Rooster on the windmill with his prophecy, then the barn. Granny's silo is
 * under foreclosure; a Reginald van crawls up the farm road with surveyors walking beside it.
 */
export const SPRINKLER_INTRO: SceneScript = {
  id: 'sprinkler-intro',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [-21, 327], yaw: -1.25 },
    { id: 'rooster', name: 'Rooster Weatherby', look: { hat: 0xbfc3c7, shirt: 0x6b7a3a }, hz: 110, at: up(11, 396, 0), yaw: Math.PI / 2 },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-52, 344], yaw: -2.25 },
    { id: 'peel', name: 'Surveyor Peel', look: HOA_LOOK, at: [-1, 250], yaw: 0 },
    { id: 'tine', name: 'Surveyor Tine', look: HOA_LOOK, at: [5, 252], yaw: 0 },
  ],
  vehicles: [
    { id: 'reg-van', ...rideOf('reginald'), at: [0, 236], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: up(5, 388, 2.4), look: 'rooster', fov: 50 } },
    { do: 'gesture', who: 'rooster', name: 'handsUp', s: 1.5, async: true },
    { do: 'say', who: 'rooster', text: 'THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS!' },
    { do: 'say', who: 'rooster', text: 'THE SPRINKLERS KNOW! THEY ALWAYS KNOW!' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-58, 337, 1.6), look: 'granny', fov: 46 } },
    { do: 'say', who: 'granny', text: 'Reginald Vance\'s laser-level squad wants my back-forty acorn silo. Foreclosure, sugar.' },
    { do: 'say', who: 'pip', text: 'Towing a silo through oscillating sprinklers? Do you know what thermal shock does to kiln glaze?!' },
    // The van crawls up the farm road; the surveyors walk beside it.
    { do: 'cam', shot: { kind: 'track', pos: up(8, 290, 1.8), who: 'reg-van', fov: 50 } },
    { do: 'drive', vehicle: 'reg-van', path: [[0, 236], [0, 260], [-24, 296], [-32, 320]], speed: 3, async: true },
    { do: 'walk', who: 'peel', path: [[-1, 250], [-7, 268]], speed: 1.4, async: true },
    { do: 'walk', who: 'tine', path: [[5, 252], [-3, 272]], speed: 1.4, async: true },
    { do: 'say', who: 'granny', text: 'Then drive fast, sugar. Keep the sprinklers off my pumpkins.' },
  ],
};

/**
 * Chapter 2 sprinkler gauntlet, closer: the silo rig is at the south barn drop. Granny brings pies and forged HOA
 * permits, then Driftwood at his trailer asks about a turtle.
 */
export const SPRINKLER_OUTRO: SceneScript = {
  id: 'sprinkler-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [40, 448], yaw: Math.PI },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [44, 454], yaw: -Math.PI / 2 },
    { id: 'granny', preset: 'granny', seatedIn: 'granny-ride', seat: 0, at: [0, 0] },
    { id: 'driftwood', preset: 'driftwood', at: up(19, 462, 0), yaw: Math.PI / 2 },
  ],
  vehicles: [
    { id: 'granny-ride', ...rideOf('granny'), at: [40, 570], yaw: Math.PI },
    { id: 'silo-rig', kind: 'ride-on', at: [40, 440], yaw: -Math.PI / 2, keep: true },
  ],
  steps: [
    { do: 'cam', shot: spot('south-barn', 'arrival') },
    { do: 'drive', vehicle: 'granny-ride', path: [[40, 570], [60, 450], [52, 444], [48, 450]], speed: 7 },
    { do: 'exit', who: 'granny' },
    { do: 'cam', shot: { kind: 'cut', pos: up(52, 462, 1.6), look: 'granny', fov: 46 } },
    { do: 'say', who: 'granny', text: 'I brought pie, sugar! And forged HOA permits. Official as a pie crust.' },
    { do: 'give', from: 'granny', to: 'player', prop: 'ledger' },
    { do: 'give', from: 'granny', to: 'pip', prop: 'acorn-cake' },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Pie. Evidence of a very good morning.' },
    { do: 'music', track: 'mystery', fade: 2 },
    { do: 'stinger', id: 'mystery' },
    { do: 'cam', shot: spot('driftwood-trailer', 'two-shot') },
    { do: 'say', who: 'driftwood', text: 'You lot! Seen a turtle? Big as a barn. Keeps a loch tidy.' },
    { do: 'say', who: 'granny', text: 'Ignore him, sugar. He\'s been out in the sun since spring.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(34, 456, 1.7), look: 'player', fov: 50 } },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
  ],
};

export const CH2_SCENES: Record<string, SceneScript> = {
  'dew-run-intro': DEW_RUN_INTRO,
  'dew-run-outro': DEW_RUN_OUTRO,
  'sprinkler-intro': SPRINKLER_INTRO,
  'sprinkler-outro': SPRINKLER_OUTRO,
};
