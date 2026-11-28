// Story row 31 "Granny Cracks": Bramble whispers from the storm cellar while two bailiffs nail a notice to the barn gate
// (noon), Midge glues Granny at the Glaze Clinic and goes quiet for the first time in her life (dusk), and Granny, glued
// and frightened, tells the player about her late husband's acorn silo (dusk). The outro is sincere: no gag, no location.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m31-granny-cracks-{intro,mid,outro}.md
// Intro card: Midge (her first story appearance, in the mid scene). Granny and Bramble are not introduced again.
import type { SceneScript, ScriptActor, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const CELLAR = 'granny-storm-cellar';
const BAY = 'glaze-clinic-bay';

/** The black hat and beige coat of every HOA man. */
const BAILIFF_A: Look = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x6b6b6b };
const BAILIFF_B: Look = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x4a4a4a, glasses: true };

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const I_BRAMBLE = markOf(CELLAR, 'bramble');
const I_PLAYER = markOf(CELLAR, 'player');
const I_BAILIFF_A = markOf(CELLAR, 'hoa-bailiff', 0);
const I_BAILIFF_B = markOf(CELLAR, 'hoa-bailiff', 1);
const M_GRANNY = markOf(BAY, 'granny');
const M_MIDGE = markOf(BAY, 'midge');
const M_PLAYER = markOf(BAY, 'player');

/** Granny sits on the cot, whose top is half a metre off the forecourt. */
const COT_TOP = 0.5;
/** The dented pie tin the bailiffs kicked into the pumpkin patch, and the notice they nail to the barn gate. */
const TIN_AT: Vec2 = [-56.6, 353.4];
const NOTICE_AT: Vec2 = [-47.6, 331.2];

/** Bramble and the player at the cellar mouth. */
const WHISPER = coverage('bramble', 'player', 1);
/** Granny sits facing west; Midge and the player stand in front of her, Midge north-west and the player south-west. */
const TREAT = coverage('granny', 'midge', 1);
const COT = coverage('granny', 'player', 1);

// ---- Intro: the whisper (noon) ----------------------------------------------------------------------------------------
/**
 * Noon on the farm. Two HOA bailiffs hammer a foreclosure notice onto the barn gate across the yard; Bramble, in the
 * storm-cellar doorway, tells the player what happened at dawn without once looking at the sky, and sends them in. The
 * dented pie tin in the pumpkin patch is the small story: Granny's pie, thrown. Ends with the cellar door closing.
 */
export const M31_GRANNY_CRACKS_INTRO: SceneScript = {
  id: 'm31-granny-cracks-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'wind',
  radio: 0.1,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m31-granny-cracks-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: I_PLAYER.at, yaw: I_PLAYER.yaw },
    { id: 'bramble', preset: 'bramble', at: I_BRAMBLE.at, yaw: I_BRAMBLE.yaw },
    { id: 'bailiff-a', name: 'HOA Bailiff', look: BAILIFF_A, held: 'glaze-repair-mallet', at: I_BAILIFF_A.at, yaw: I_BAILIFF_A.yaw, hz: 96 },
    { id: 'bailiff-b', name: 'HOA Bailiff', look: BAILIFF_B, held: 'hoa-clipboard', at: I_BAILIFF_B.at, yaw: I_BAILIFF_B.yaw, hz: 104 },
  ],
  props: [
    // The notice they are nailing to the gate, and Granny's pie tin, dented, in the pumpkin patch.
    { id: 'notice', prefab: 'notice-board', at: up(NOTICE_AT[0], NOTICE_AT[1], 0), yaw: Math.PI, size: 1.5, by: 'h' },
    { id: 'tin', prefab: 'pie-tin', at: up(TIN_AT[0], TIN_AT[1], 0), yaw: 0.6, size: 0.7 },
  ],
  steps: [
    // 1. Hook: a mallet on a nail, across a quiet yard, before anyone speaks.
    cut(spot(CELLAR, 'cellar-wide')),
    { do: 'sfx', id: 'knock', at: 'bailiff-a', gain: 0.55, async: true },
    { do: 'gesture', who: 'bailiff-a', name: 'stomp', s: 0.6, async: true },
    { do: 'wait', s: 1.4 },
    // 2. Bramble, low, from the doorway.
    cut(WHISPER.single('bramble', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bramble', text: "Don't look up. Eyes on the dirt. Listen." },
    { do: 'say', who: 'bramble', text: 'They came at dawn. They cracked Granny.' },
    // 3. The yard: the notice goes up, a second knock, the clipboard.
    cut(spot(CELLAR, 'yard-far')),
    { do: 'sfx', id: 'knock', at: 'bailiff-a', gain: 0.5, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'knock', at: 'bailiff-a', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    // 4. The player's question; the answer is the stake.
    cut(WHISPER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is she all right?' },
    cut(WHISPER.single('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'Cracked. Not broken. She would not leave the farmhouse.' },
    // 5. The turn: the two at the gate, and the whole job in two lines.
    cut(pushIn('bramble', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'bramble', text: 'Two are still at the gate. Crack them quiet.' },
    { do: 'say', who: 'bramble', text: 'Then carry her to the clinic. Gently.' },
    cut(WHISPER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How gently?' },
    // 6. Button: peaches. And the cellar door closes on the only man who knows.
    cut(WHISPER.single('bramble', 'ms', { height: 'low' })),
    { do: 'say', who: 'bramble', text: 'Like peaches. Cellar peaches.' },
    { do: 'gesture', who: 'bramble', name: 'flinch', s: 0.7, async: true },
    { do: 'sfx', id: 'latch', at: 'bramble', gain: 0.5, async: true },
    { do: 'walk', who: 'bramble', path: [[I_BRAMBLE.at[0] - 0.6, I_BRAMBLE.at[1] + 1.4]], speed: 1.4, async: true },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- Mid: the glue (dusk) ---------------------------------------------------------------------------------------------
/**
 * The clinic forecourt at dusk. Midge glues Granny at a hundred and forty beats, then goes quiet when Granny says the
 * bailiffs knew her name, and does not know what to do with the quiet. Granny asks the player not to tell Bramble she was
 * frightened. Midge is introduced here, after her first line.
 */
export const M31_GRANNY_CRACKS_MID: SceneScript = {
  id: 'm31-granny-cracks-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'warm',
  ambience: 'street',
  radio: 0.1,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m31-granny-cracks-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: M_PLAYER.at, yaw: M_PLAYER.yaw },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: up(M_GRANNY.at[0], M_GRANNY.at[1], COT_TOP), yaw: M_GRANNY.yaw },
    { id: 'midge', preset: 'midge', held: 'glaze-pot', at: M_MIDGE.at, yaw: M_MIDGE.yaw },
  ],
  steps: [
    // 1. Hook: the forecourt in the last gold, a metronome tap at a hundred and forty, Midge bouncing on her toes.
    cut(spot(BAY, 'bay-wide')),
    { do: 'sfx', id: 'tap', at: 'midge', gain: 0.45, async: true },
    { do: 'gesture', who: 'midge', name: 'stomp', s: 1.0, async: true },
    { do: 'wait', s: 1.5 },
    cut(TREAT.single('midge', 'mcu')),
    { do: 'say', who: 'midge', text: 'A hundred forty! Two hairlines! Hold still, hold still!' },
    { do: 'intro', who: 'midge' },
    // 2. Granny, holding still, holding the tin.
    cut(TREAT.single('granny', 'mcu')),
    { do: 'gesture', who: 'granny', name: 'clutch', s: 1.6, async: true },
    { do: 'say', who: 'granny', text: 'I am holding still, dear. It is my hands that will not.' },
    // 3. The glue: the pop, an insert on the hat brim, the squeak.
    cut(TREAT.single('midge', 'mcu')),
    { do: 'sfx', id: 'pop', at: 'midge', gain: 0.5, async: true },
    { do: 'say', who: 'midge', text: 'Glue first! Heat second! Peppermint third!' },
    cut(insert('granny', { toward: 'midge' })),
    { do: 'sfx', id: 'squeak', at: 'granny', gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    // 4. The turn: the bailiffs knew her name, and Midge goes quiet.
    cut(TREAT.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'They knew my name. They said it so politely.' },
    ...reaction('midge', { toward: 'granny', hold: 'pause' }),
    { do: 'music', track: null, fade: 0.8 },
    cut(TREAT.single('midge', 'mcu')),
    { do: 'say', who: 'midge', text: '...I do not do quiet. A hundred forty. Softly.' },
    // 5. Button: she asks the player to keep it, and the last thing is her hands, still at last.
    cut(COT.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Do not tell Bramble I was frightened.' },
    ...reaction('player', { toward: 'granny', gesture: 'nod', hold: 'pause' }),
    cut(insert('granny', { toward: 'player' })),
    beat('silence'),
  ],
};

// ---- Outro: the silo (dusk) -------------------------------------------------------------------------------------------
/**
 * Granny, glued, on the clinic cot with the last light on her. The player stays. She tells them, plainly, about her late
 * husband's acorn silo: what he said, and that nobody counts it. No location. She gives the player her dented pie tin to
 * hold. Sincere: no gag, no music cue louder than a held chord.
 */
export const M31_GRANNY_CRACKS_OUTRO: SceneScript = {
  id: 'm31-granny-cracks-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sad',
  ambience: 'wind',
  radio: 0.05,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m31-granny-cracks-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: M_PLAYER.at, yaw: M_PLAYER.yaw },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: up(M_GRANNY.at[0], M_GRANNY.at[1], COT_TOP), yaw: M_GRANNY.yaw },
  ],
  steps: [
    // 1. Hook: Granny, glued, her hands still. She asks the player to stay.
    cut(COT.single('granny', 'mcu')),
    { do: 'sfx', id: 'cloth', at: 'granny', gain: 0.4, async: true },
    { do: 'say', who: 'granny', text: 'Sit with me a minute, sugar.' },
    { do: 'wait', s: 0.6 },
    // 2. The silo.
    cut(pushIn('granny', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'granny', text: 'My husband built a silo the winter we married.' },
    cut(COT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'A silo?' },
    cut(COT.single('granny', 'mcu', { height: 'low' })),
    { do: 'say', who: 'granny', text: 'He filled it with acorns, one at a time. Counted every one.' },
    cut(insert('granny', { toward: 'player' })),
    { do: 'sfx', id: 'creak', at: 'granny', gain: 0.35, async: true },
    { do: 'wait', s: 1.4 },
    // 3. What he said.
    cut(COT.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'He said a bank can take a farm. It cannot take what it cannot count.' },
    cut(COT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where is it?' },
    // 4. The answer is a refusal, gently.
    cut(COT.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Somewhere nobody counts. Not yet, dear.' },
    beat('silence'),
    // 5. Button: she hands over the dented tin. The last picture is the player's hands round it.
    { do: 'sfx', id: 'clink', at: 'granny', gain: 0.45, async: true },
    { do: 'give', from: 'granny', to: 'player', prop: 'pie-tin', s: 1.2 },
    cut(COT.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Hold my tin a while.' },
    cut(insert('player', { toward: 'granny' })),
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm31-granny-cracks-intro': M31_GRANNY_CRACKS_INTRO,
  'm31-granny-cracks-mid': M31_GRANNY_CRACKS_MID,
  'm31-granny-cracks-outro': M31_GRANNY_CRACKS_OUTRO,
};
