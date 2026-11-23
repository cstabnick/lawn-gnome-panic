// The Great Hose-Pipe Tax Revolt (Baroness Brenda, on her zip-tied lawn-chair throne by the Southern Drainage Canal): a
// pompous royal proclamation. Triumph music, crowd ambience, low-angle throne shots, title cards ("DECREE THE FIRST"), a
// parade lap of her pink push-bike gang on the bank's gang-run path. Staged at brenda-throne (quests/stages/cloverfield.ts)
// and at putting-green (quests/stages/turftonB.ts), Vesper's country club, which the intro sends her to flood.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { above, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

const BRENDA = markOf('brenda-throne', 'brenda');
const PLAYER = markOf('brenda-throne', 'player');
const BIKER = markOf('brenda-throne', 'biker');
const PARADE = pathOf('brenda-throne', 'gang-run');
const BRENDA_AT: [number, number] = [-41, 216]; // beside the throne box (the mark is inside its collider)
const CADDIE = walkOf('putting-green', 'caddie');
const GANG_PINK = 0xff69b4;

// Brenda is royalty: every line of hers is a low, still single. The player is the other side of the same line.
const DECREE = coverage('brenda', 'you', 1);
const BRENDA_LOW = DECREE.single('brenda', 'mcu', { height: 'low' });
// The objection: Brenda and the gang member b4 on one side of their own line.
const OBJECT = coverage('brenda', 'b4', 1);
// The club: Vesper, m1 and the caddie, every shot on the same side of the club's one line.
const CLUB = coverage('vesper', 'm1', 1);

export const HOSE_REVOLT_INTRO: SceneScript = {
  id: 'sq-hose-revolt-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Great Hose-Pipe Tax Revolt',
  music: 'triumph',
  ambience: 'crowd',
  radio: 0.4,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-hose-revolt-intro.md' },
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'brenda', preset: 'brenda', at: BRENDA_AT, yaw: BRENDA.yaw },
    { id: 'b1', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a }, seatedIn: 'g1', at: [0, 0] },
    { id: 'b2', name: 'Biker', look: { hat: GANG_PINK, shirt: 0xf0c0d0, pants: 0x303040 }, seatedIn: 'g2', at: [0, 0] },
    { id: 'b3', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x3a2a4a, pants: 0x1a1a1a }, seatedIn: 'g3', at: [0, 0] },
    { id: 'b4', name: 'Biker', look: { hat: 0x7a3b2e, shirt: 0xf0c0d0, pants: 0x303040 }, at: BIKER.at, yaw: BIKER.yaw },
  ],
  vehicles: [
    castRide('brenda', 'bike'),
    { id: 'g1', kind: 'push-bike', at: [-84, 216], yaw: Math.PI / 2, tint: GANG_PINK, loadout: { extras: ['flag'] } },
    { id: 'g2', kind: 'push-bike', at: [-89, 216], yaw: Math.PI / 2, tint: GANG_PINK, loadout: { extras: ['bunting'] } },
    { id: 'g3', kind: 'push-bike', at: [-94, 216], yaw: Math.PI / 2, tint: GANG_PINK, loadout: { extras: ['flag'] } },
  ],
  steps: [
    // Hook: the gang rides the bank loop; a tracking shot follows the lead bike past the flamingos.
    { do: 'cam', shot: { kind: 'track', pos: above(-76, 226, 2.0), who: 'g1', fov: 45 } },
    { do: 'drive', vehicle: 'g1', path: [[PARADE[1][0], 216]], speed: 5.5, arrive: false, async: true },
    { do: 'drive', vehicle: 'g2', path: [[PARADE[1][0] - 5, 216]], speed: 5.5, arrive: false, async: true },
    { do: 'drive', vehicle: 'g3', path: [[PARADE[1][0] - 10, 216]], speed: 5.5, arrive: false, async: true },
    { do: 'horn', vehicle: 'g1' },
    { do: 'title', text: 'DECREE THE FIRST' },
    { do: 'wait', s: 1.5 },
    { do: 'title', text: null },
    // Brenda, low on her throne: the decree.
    cut(BRENDA_LOW),
    { do: 'say', who: 'brenda', text: 'Subjects of the Sovereign Republic of New Puddle, hear your Baroness!' },
    cut(DECREE.single('you', 'mcu')),
    beat('pause'),
    cut(BRENDA_LOW),
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.6 },
    { do: 'say', who: 'brenda', text: 'By decree, the Hose-Pipe Tax is abolished. Forever. Mostly.' },
    cut(DECREE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What hose tax?' },
    cut(BRENDA_LOW),
    { do: 'say', who: 'brenda', text: 'The Tall-One hoses. Lovely, pressurised, and taxed by the metre.' },
    beat('pause'),
    // The turn: a gang member objects, and the Baroness overrules him.
    cut(OBJECT.single('b4', 'mcu')),
    { do: 'say', who: 'b4', text: 'Majesty, the committee is my auntie. Can we not?' },
    cut(OBJECT.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'Overruled. Auntie is a tax with a cardigan.' },
    cut(OBJECT.single('b4', 'mcu')),
    { do: 'gesture', who: 'b4', name: 'slump', s: 1.1 },
    beat('beat'),
    cut(OBJECT.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'Four hoses shall be kinked in my name, starting with the Greenhouse Strip.' },
    cut(OBJECT.single('b4', 'mcu')),
    { do: 'gesture', who: 'b4', name: 'cheer', s: 1.4 },
    cut(OBJECT.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'And the last, at Vesper\'s country club. Flood the eighteenth.' },
    cut(DECREE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Four hoses. Then the club.' },
    cut(BRENDA_LOW),
    { do: 'say', who: 'brenda', text: 'Kink them all and you shall receive the Turf-Code violation medal.' },
    { do: 'horn', vehicle: 'bike' },
    { do: 'say', who: 'brenda', text: 'Now go and be illegal.' },
  ],
};

export const HOSE_REVOLT_CLUB: SceneScript = {
  id: 'sq-hose-revolt-club',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'tension',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-hose-revolt-club.md' },
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: [196, -196], yaw: 0 },
    { id: 'm1', name: 'Member', look: { hat: 0x2e6b3a, shirt: 0xf5f5f5, pants: 0x2b3a55, beard: 0xcccccc }, at: [189, -200], yaw: Math.PI / 2 },
    { id: 'm2', name: 'Member', look: { hat: 0x7a3b2e, shirt: 0xe8e0c8, pants: 0x333344 }, at: [199, -210], yaw: 0 },
    { id: 'caddie', name: 'Caddie', look: { hat: 0x888888, shirt: 0x2c4f2c }, at: CADDIE[0], yaw: 0 },
  ],
  steps: [
    // Hook: a sprinkler ticks on the green while the wide holds the club from the road.
    { do: 'sfx', id: 'squirt', at: above(189, -208, 0.4) },
    { do: 'cam', shot: stageCut('putting-green', 'wide') },
    { do: 'walk', who: 'caddie', path: [CADDIE[1], CADDIE[0], CADDIE[1]], speed: 1.0, async: true },
    { do: 'gesture', who: 'm1', name: 'lean', s: 2.0, async: true },
    { do: 'wait', s: 1.5 },
    // Vesper, still and low: the villain motif is his alone, and it starts with him.
    { do: 'face', who: 'vesper', at: 'm1', s: 0.35, async: true },
    { do: 'face', who: 'm1', at: 'vesper', s: 0.35 },
    cut(CLUB.single('vesper', 'mcu', { height: 'low' })),
    { do: 'music', track: 'villain', fade: 0.6 },
    { do: 'say', who: 'vesper', text: 'The grass is brushed to the millimetre every dawn. Somebody has been unbrushing it.' },
    cut(CLUB.single('m1', 'mcu')),
    { do: 'say', who: 'm1', text: 'Probably the sprinklers, Vesper.' },
    // A groan in the pipes by the eighteenth; Vesper does not turn to look.
    { do: 'sfx', id: 'squirt', at: above(204, -206, 0.4) },
    cut(CLUB.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Pipes do not groan on my green.' },
    cut(CLUB.single('caddie', 'mcu')),
    { do: 'gesture', who: 'caddie', name: 'handsUp', s: 1.4 },
    { do: 'say', who: 'caddie', text: 'Sir, the Strip\'s hose has been kinked again.' },
    cut(CLUB.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Measure the slope, Sedge.' },
    beat('beat'),
    cut(CLUB.single('caddie', 'mcu')),
    beat('silence'),
    cut(CLUB.single('vesper', 'ms', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Write it down.' },
  ],
};

export const HOSE_REVOLT_OUTRO: SceneScript = {
  id: 'sq-hose-revolt-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'triumph',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-hose-revolt-outro.md' },
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: [196, -196], yaw: 0 },
    { id: 'm1', name: 'Member', look: { hat: 0x2e6b3a, shirt: 0xf5f5f5, pants: 0x2b3a55, beard: 0xcccccc }, at: [189, -200], yaw: Math.PI / 2 },
    { id: 'm2', name: 'Member', look: { hat: 0x7a3b2e, shirt: 0xe8e0c8, pants: 0x333344 }, at: [199, -210], yaw: 0 },
    { id: 'brenda', preset: 'brenda', at: BRENDA_AT, yaw: BRENDA.yaw },
    { id: 'b1', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a }, seatedIn: 'g1', at: [0, 0] },
    { id: 'b2', name: 'Biker', look: { hat: GANG_PINK, shirt: 0xf0c0d0, pants: 0x303040 }, seatedIn: 'g2', at: [0, 0] },
    { id: 'b3', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x3a2a4a, pants: 0x1a1a1a }, seatedIn: 'g3', at: [0, 0] },
    { id: 'b4', name: 'Biker', look: { hat: 0x7a3b2e, shirt: 0xf0c0d0, pants: 0x303040 }, at: BIKER.at, yaw: BIKER.yaw },
  ],
  vehicles: [
    { id: 'g1', kind: 'push-bike', at: [-44, 204], yaw: Math.PI / 2, tint: GANG_PINK },
    { id: 'g2', kind: 'push-bike', at: [-49, 204], yaw: Math.PI / 2, tint: GANG_PINK, loadout: { extras: ['bunting'] } },
    { id: 'g3', kind: 'push-bike', at: [-54, 204], yaw: Math.PI / 2, tint: GANG_PINK, loadout: { extras: ['flag'] } },
  ],
  steps: [
    // Hook: the splash on the green and the rumble; the members' faces tell it, not a wide.
    { do: 'sfx', id: 'splash', at: above(198, -198, 0.2) },
    { do: 'shake', amp: 0.2, s: 2.5, async: true },
    cut(shot('m1', 'fs', { side: 20 })),
    { do: 'walk', who: 'm1', path: [[180, -200], [170, -204]], speed: 4, run: true, async: true },
    { do: 'wait', s: 1.2 },
    cut(shot('m2', 'fs', { side: -20 })),
    { do: 'walk', who: 'm2', path: [[190, -214], [178, -222]], speed: 4, run: true },
    { do: 'wait', s: 0.8 },
    // Vesper, unmoved in the bog: low, still.
    cut(shot('vesper', 'mcu', { height: 'low', side: 20 })),
    { do: 'say', who: 'vesper', text: 'Calm. Calm. The turf is a bog, and I am calm.' },
    cut(shot('vesper', 'cu', { height: 'low', side: 20 })),
    { do: 'say', who: 'vesper', text: 'The monocle does not move. Neither do I.' },
    { do: 'fade', to: 1, s: 1.0 },
    { do: 'wait', s: 0.4 },
    // Back in the republic: the decree is the button.
    { do: 'cam', shot: stageCut('brenda-throne', 'wide') },
    { do: 'fade', to: 0, s: 1.0 },
    { do: 'wait', s: 0.6 },
    cut(BRENDA_LOW),
    { do: 'say', who: 'brenda', text: 'The club is a bog! The hoses have spoken!', stinger: 'triumph' },
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.6, async: true },
    { do: 'gesture', who: 'b1', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'b2', name: 'cheer', s: 1.6 },
    { do: 'horn', vehicle: 'g1' },
    cut(BRENDA_LOW),
    { do: 'say', who: 'brenda', text: 'A national holiday! Name it after me. Name everything after me.' },
    { do: 'wait', s: 0.8 },
  ],
};

export const HOSE_REVOLT_SCENES: SceneScript[] = [HOSE_REVOLT_INTRO, HOSE_REVOLT_CLUB, HOSE_REVOLT_OUTRO];
