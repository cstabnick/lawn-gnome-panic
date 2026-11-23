// Chapter 2 story scenes, first file: the Dew run (the chapter 2 opener and its payoff).
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, pathOf, spot, up } from './kit';

const YARD = 'granny-barn';
const GRANNY = markOf(YARD, 'granny');
const BRAMBLE = markOf(YARD, 'bramble');
/** The south highway from the north, ending at Granny's pull-up (-25, 330). */
const DEW_APPROACH = pathOf(YARD, 'dew-approach');

/** Granny's briefing: Granny and the player on one side of their line; Pip stands on the player's side. */
const BRIEF = coverage('granny', 'player', 1);
const BRIEF_PIP = coverage('granny', 'pip', 1);
/** The payoff: Pip and the player on one side of their line. */
const PAYOFF = coverage('pip', 'player', 1);

/**
 * Chapter 2 opener, re-directed: notes in docs/design/gnome-theft-auto/direction/scenes/dew-run-intro.md. The Ride-On
 * (Pip in the passenger seat) runs south down the highway as the Black Dew convoy passes the other way, horn blaring:
 * the chapter's question in a picture. The title card. Then the barn: Granny's briefing, broken by a Dew-Well that
 * coughs dry, and the job she gives in answer. Pip wants in; the player nods; the pumpkins are load-bearing.
 */
export const DEW_RUN_INTRO: SceneScript = {
  id: 'dew-run-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dew-run-intro.md', kind: 'chapter-open' },
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', seatedIn: 'ride', seat: 1, at: [0, 0] },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
  ],
  vehicles: [
    { id: 'ride', kind: 'ride-on', from: 'player', at: [-2.5, 196], yaw: 0 },
    // The convoy, northbound in the other lane: the HOA van and the orange tanker, leaving the farm with the Dew.
    { id: 'convoy', kind: 'hoa-van', at: [2.5, 236], yaw: Math.PI },
    { id: 'tanker', kind: 'ride-on', tint: 0xf08a24, at: [2.5, 262], yaw: Math.PI },
  ],
  steps: [
    // 1. Hook: the Ride-On comes down the highway; the convoy rumbles past the other way, road level, horn blaring.
    { do: 'cam', shot: { kind: 'track', pos: up(8, 186, 1.4), who: 'tanker', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[-2.5, 196], [-2.5, 236], ...DEW_APPROACH.slice(1)], speed: 10, async: true },
    { do: 'drive', vehicle: 'convoy', path: [[2.5, 236], [2.5, 120]], speed: 14, async: true },
    { do: 'drive', vehicle: 'tanker', path: [[2.5, 262], [2.5, 120]], speed: 12, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'horn', vehicle: 'tanker', async: true },
    { do: 'wait', s: 1.8 },
    // 2. The chapter card, over the road.
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 2 — BLACK DEW & GREENBACKS' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
    // 3. The Ride-On follows the highway into the farm. The one narrator line sets the place.
    { do: 'cam', shot: { kind: 'follow', who: 'ride' } },
    { do: 'say', who: 'Narrator', text: 'Cloverfield Farms. Forty acres of gold, and every one of them is for sale.', hz: 130 },
    { do: 'wait', s: 4.5 },
    // 4. Pulling up at the barn: the player and Pip get out, and Granny is on her porch.
    { do: 'cam', shot: spot(YARD, 'arrival') },
    { do: 'music', track: 'warm', fade: 2 },
    { do: 'exit', who: 'player' },
    { do: 'exit', who: 'pip' },
    { do: 'face', who: 'player', at: 'granny', s: 0.4, async: true },
    { do: 'face', who: 'pip', at: 'granny', s: 0.4 },
    // 5. The briefing. Granny's lines, the player's question, Pip's delight, then the turn.
    cut(BRIEF.single('granny', 'mcu', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'Vesper\'s boys are draining my Dew-Wells dry.' },
    cut(BRIEF.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What\'s it worth?' },
    cut(BRIEF.single('granny', 'mcu', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'Pure 87-octane, 100% unlicensed. Just how I like it.' },
    cut(BRIEF_PIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Unlicensed! I love this place already!' },
    // 6. The turn: a Dew-Well coughs dry behind the barn. Granny answers it with the job.
    cut(BRIEF.single('granny', 'mcu', { height: 'high' })),
    { do: 'sfx', id: 'thud' },
    beat('pause'),
    { do: 'say', who: 'granny', text: 'Dry as a biscuit. So here\'s the plan.' },
    cut(BRIEF.single('granny', 'cu', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'Borrow a Buck-Iron Combine and block the South Highway.' },
    cut(BRIEF_PIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'A Buck-Iron Combine? I can drive that! Please?' },
    cut(BRIEF.single('granny', 'mcu', { height: 'high' })),
    { do: 'gesture', who: 'granny', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'granny', text: 'Park it by Fence-Post Frank\'s sign.' },
    cut(BRIEF.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why me?' },
    // 7. The rest of the job, and the button: the pumpkins, then Pip's flinch.
    { do: 'walk', who: 'player', path: [[-20, 326]], async: true },
    cut(BRIEF.single('granny', 'mcu', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'You\'ve got the Dew-Hauler. Bring it to my barn.' },
    { do: 'say', who: 'granny', text: 'Try not to splatter my prize pumpkins.' },
    cut(BRIEF.single('granny', 'cu', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'They\'re load-bearing, sugar.' },
    cut(BRIEF_PIP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'flinch', s: 1.0, async: true },
    beat('pause'),
  ],
};

/**
 * Chapter 2 closer for the Dew run: the player brings the Dew-Hauler to Granny's barn. Granny taps the tank, the
 * Clay-Mart letter clears the Kiln-Debt, and Bramble leaves a tease about the pawprints in Biscuit's Nap. The button is
 * a picture: the player holds the tea, the tank is patted, and nobody talks.
 */
export const DEW_RUN_OUTRO: SceneScript = {
  id: 'dew-run-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dew-run-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, seatedIn: 'hauler', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', seatedIn: 'hauler', seat: 1, at: [0, 0] },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
  ],
  vehicles: [
    // The player's own Dew-Hauler, rolling in off the highway. The last stretch of the approach is enough for a hook.
    { id: 'hauler', kind: 'ride-on', from: 'player', tint: 0xf08a24, at: DEW_APPROACH[2], yaw: 0 },
  ],
  steps: [
    // 1. Hook: the Dew-Hauler rolls through the gate and stops by the tank.
    { do: 'cam', shot: spot(YARD, 'arrival') },
    { do: 'drive', vehicle: 'hauler', path: DEW_APPROACH.slice(2), speed: 9 },
    // 2. Granny gets up and comes out to the tank, slowly, as she does everything. The player and Pip climb out meanwhile.
    { do: 'cam', shot: { kind: 'track', pos: up(-46, 342, 1.6), who: 'granny', fov: 50 } },
    { do: 'exit', who: 'player', async: true },
    { do: 'exit', who: 'pip', async: true },
    { do: 'gesture', who: 'granny', name: 'stand', s: 0.5, async: true },
    { do: 'walk', who: 'granny', path: [[-40, 336]], speed: 2.6 },
    { do: 'sfx', id: 'knock', at: 'hauler' },
    cut(shot('granny', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'granny', text: 'Now we can cook.' },
    // 3. The letter. Music out, Pip reads it in silence first; then the line, and the player's face takes it.
    { do: 'give', from: 'granny', to: 'pip', prop: 'sealed-letter' },
    { do: 'music', track: null, fade: 0.6 },
    cut(PAYOFF.single('pip', 'cu')),
    beat('pause'),
    cut(PAYOFF.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Clay-Mart Collections. Your five thousand Acorn Kiln-Debt is PAID IN FULL.', stinger: 'triumph', sfx: 'cash' },
    cut(PAYOFF.single('player', 'mcu')),
    beat('pause'),
    { do: 'music', track: 'warm', fade: 2 },
    cut(PAYOFF.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'We\'re legitimate! ...Don\'t tell anyone.' },
    // 4. Granny gives the player tea; Bramble leaves his tease, framed square to the camera.
    { do: 'give', from: 'granny', to: 'player', prop: 'espresso-cup' },
    cut(shot('granny', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'granny', text: 'Tea, sugar. Dew makes everybody thirsty.' },
    cut(shot('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'Something big\'s been napping in Biscuit\'s Nap again. Paw prints like dinner plates.' },
    // 5. The button, a picture: the player with the tea, the tank patted once more, and nobody says a word.
    { do: 'walk', who: 'player', path: [[-20, 326]], async: true },
    cut(shot('player', 'mcu', { toward: 'granny' })),
    { do: 'sfx', id: 'knock', at: 'hauler' },
    beat('silence'),
  ],
};

export const CH2_SCENES: Record<string, SceneScript> = {
  'dew-run-intro': DEW_RUN_INTRO,
  'dew-run-outro': DEW_RUN_OUTRO,
};
