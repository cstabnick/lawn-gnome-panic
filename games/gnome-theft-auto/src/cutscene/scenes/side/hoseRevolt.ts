// The Great Hose-Pipe Tax Revolt (Baroness Brenda, on her zip-tied lawn-chair throne by the Southern Drainage Canal): a
// pompous royal proclamation. Triumph music, crowd ambience, low-angle throne shots, title cards ("DECREE THE FIRST"), a
// parade lap of her pink push-bike gang on the bank's gang-run path. Staged at brenda-throne (quests/stages/cloverfield.ts)
// and at putting-green (quests/stages/turftonB.ts), Vesper's country club, which the intro sends her to flood.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

const BRENDA = markOf('brenda-throne', 'brenda');
const PLAYER = markOf('brenda-throne', 'player');
const BIKER = markOf('brenda-throne', 'biker');
const BANK_PACE = walkOf('brenda-throne', 'biker');
const PARADE = pathOf('brenda-throne', 'gang-run');
const BRENDA_AT: [number, number] = [-41, 216]; // beside the throne box (the mark is inside its collider)
const CADDIE = walkOf('putting-green', 'caddie');
const GANG_PINK = 0xff69b4;

export const HOSE_REVOLT_INTRO: SceneScript = {
  id: 'sq-hose-revolt-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Great Hose-Pipe Tax Revolt',
  music: 'triumph',
  ambience: 'crowd',
  radio: 0.4,
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'brenda', preset: 'brenda', at: BRENDA_AT, yaw: BRENDA.yaw },
    { id: 'b1', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a }, at: BANK_PACE[0], yaw: Math.PI / 2 },
    { id: 'b2', name: 'Biker', look: { hat: 0x7a3b2e, shirt: 0xf0c0d0, pants: 0x303040 }, at: BIKER.at, yaw: BIKER.yaw },
  ],
  vehicles: [
    castRide('brenda', 'bike', [-80, 220], Math.PI / 2),
    { id: 'g1', kind: 'push-bike', at: [-80, 216], yaw: Math.PI / 2, tint: GANG_PINK },
    { id: 'g2', kind: 'push-bike', at: [-80, 213], yaw: Math.PI / 2, tint: GANG_PINK },
    { id: 'g3', kind: 'push-bike', at: [-80, 209], yaw: Math.PI / 2, tint: GANG_PINK },
  ],
  steps: [
    // The throne, from the kerb: a low-angle shot up at Brenda.
    { do: 'cam', shot: { kind: 'cut', pos: above(-44, 209, 0.6), look: 'brenda', fov: 40 } },
    { do: 'title', text: 'DECREE THE FIRST' },
    { do: 'gesture', who: 'brenda', name: 'stand', s: 1.4 },
    // The parade lap: the lead bike and the gang ride the bank loop while she speaks.
    { do: 'drive', vehicle: 'bike', path: PARADE, speed: 5, async: true },
    { do: 'drive', vehicle: 'g1', path: PARADE, speed: 5, async: true },
    { do: 'drive', vehicle: 'g2', path: PARADE, speed: 5, async: true },
    { do: 'drive', vehicle: 'g3', path: PARADE, speed: 5, async: true },
    { do: 'walk', who: 'b1', path: [BANK_PACE[1], BANK_PACE[0]], speed: 1.2, async: true },
    { do: 'title', text: null },
    { do: 'cam', shot: { kind: 'track', pos: above(-40, 200, 1.6), who: 'bike', fov: 40 } },
    { do: 'say', who: 'brenda', text: 'Subjects of the Sovereign Republic of New Puddle, hear your Baroness!', stinger: 'triumph' },
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.6 },
    { do: 'say', who: 'brenda', text: 'By decree, the Hose-Pipe Tax is abolished. Forever. Mostly.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-44, 209, 0.9), look: 'brenda', fov: 38 } },
    { do: 'say', who: 'you', text: 'What hose tax?' },
    { do: 'say', who: 'brenda', text: 'The Tall-One hoses. Pressurised, lovely, and taxed by the metre by a committee that never shows its face.' },
    { do: 'cam', shot: stageCut('brenda-throne', 'two-shot', 34) },
    { do: 'gesture', who: 'b2', name: 'cheer', s: 1.4, async: true },
    { do: 'say', who: 'brenda', text: 'Four hoses shall be kinked in my name. North Turfton. The Greenhouse Strip. The Patio Heights west gate.' },
    { do: 'say', who: 'brenda', text: 'And the last at Vesper Thorne\'s putting-green club. Membership by porcelain credential only. Flood the eighteenth.' },
    { do: 'cam', shot: { kind: 'orbit', around: 'brenda', radius: 4.5, height: 1.4, fromYaw: 0.2, toYaw: -0.5, s: 6, fov: 40 } },
    { do: 'say', who: 'you', text: 'Four hoses. Then the club.' },
    { do: 'say', who: 'brenda', text: 'Four-hat heat is a compliment, subject. Frame it.', stinger: 'comic' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-44, 209, 0.8), look: 'brenda', fov: 40 } },
    { do: 'say', who: 'brenda', text: 'Kink them all and you shall receive the Turf-Code violation medal. Made by me. From bottle caps.' },
    { do: 'horn', vehicle: 'bike' },
    { do: 'say', who: 'brenda', text: 'Now go and be illegal.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const HOSE_REVOLT_CLUB: SceneScript = {
  id: 'sq-hose-revolt-club',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'tension',
  ambience: 'water',
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: [196, -196], yaw: 0 },
    { id: 'm1', name: 'Member', look: { hat: 0x2e6b3a, shirt: 0xf5f5f5, pants: 0x2b3a55, beard: 0xcccccc }, at: [189, -200], yaw: Math.PI / 2 },
    { id: 'm2', name: 'Member', look: { hat: 0x7a3b2e, shirt: 0xe8e0c8, pants: 0x333344 }, at: [199, -210], yaw: 0 },
    { id: 'caddie', name: 'Caddie', look: { hat: 0x888888, shirt: 0x2c4f2c }, at: CADDIE[0], yaw: 0 },
  ],
  steps: [
    // The club from the road: pristine turf, two members putting, a caddie raking.
    { do: 'cam', shot: stageCut('putting-green', 'wide') },
    { do: 'caption', text: "VESPER'S PUTTING-GREEN COUNTRY CLUB. MEMBERS ONLY." },
    { do: 'walk', who: 'caddie', path: [CADDIE[1], CADDIE[0], CADDIE[1]], speed: 1.0, async: true },
    { do: 'gesture', who: 'm1', name: 'lean', s: 2.0, async: true },
    { do: 'caption', text: null },
    // Vesper, calipers in hand, still and cold.
    { do: 'cam', shot: { kind: 'cut', pos: above(193, -188, 1.4), look: 'vesper', fov: 36 } },
    { do: 'say', who: 'vesper', text: 'The grass is brushed to the millimetre every dawn. Somebody has been unbrushing it.' },
    { do: 'say', who: 'm1', text: 'Probably the sprinklers, Vesper.' },
    // A groan in the pipes: the sprinkler by the eighteenth.
    { do: 'sfx', id: 'squirt', at: above(204, -206, 0.4) },
    { do: 'cam', shot: stageCut('putting-green', 'close', 30) },
    { do: 'say', who: 'vesper', text: 'Pipes do not groan on my green.', stinger: 'mystery' },
    { do: 'gesture', who: 'caddie', name: 'handsUp', s: 1.4 },
    { do: 'say', who: 'caddie', text: 'Sir, the Strip\'s hose has been kinked again.' },
    { do: 'cam', shot: { kind: 'orbit', around: 'vesper', radius: 3.0, height: 1.2, fromYaw: 0.4, toYaw: -0.2, s: 6, fov: 40 } },
    { do: 'say', who: 'vesper', text: 'Measure the slope, Sedge. Two hair-widths. Write it down.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const HOSE_REVOLT_OUTRO: SceneScript = {
  id: 'sq-hose-revolt-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'triumph',
  ambience: 'water',
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: [196, -196], yaw: 0 },
    { id: 'm1', name: 'Member', look: { hat: 0x2e6b3a, shirt: 0xf5f5f5, pants: 0x2b3a55, beard: 0xcccccc }, at: [189, -200], yaw: Math.PI / 2 },
    { id: 'm2', name: 'Member', look: { hat: 0x7a3b2e, shirt: 0xe8e0c8, pants: 0x333344 }, at: [199, -210], yaw: 0 },
    { id: 'brenda', preset: 'brenda', at: BRENDA_AT, yaw: BRENDA.yaw },
    { id: 'b1', name: 'Biker', look: { hat: GANG_PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a }, at: BANK_PACE[0], yaw: Math.PI / 2 },
    { id: 'b2', name: 'Biker', look: { hat: 0x7a3b2e, shirt: 0xf0c0d0, pants: 0x303040 }, at: BIKER.at, yaw: BIKER.yaw },
  ],
  vehicles: [
    { id: 'g1', kind: 'push-bike', at: [-44, 204], yaw: Math.PI / 2, tint: GANG_PINK },
  ],
  steps: [
    // Meanwhile at the club: a rumble, a splash, the members flee the green.
    { do: 'cam', shot: stageCut('putting-green', 'wide') },
    { do: 'shake', amp: 0.2, s: 2.5, async: true },
    { do: 'sfx', id: 'splash', at: above(198, -198, 0.2) },
    { do: 'walk', who: 'm1', path: [[180, -200], [170, -204]], speed: 4, run: true, async: true },
    { do: 'walk', who: 'm2', path: [[190, -214], [178, -222]], speed: 4, run: true },
    { do: 'cam', shot: { kind: 'cut', pos: above(191, -188, 1.6), look: 'vesper', fov: 42 } },
    { do: 'say', who: 'vesper', text: 'Calm. Calm. The turf is a bog, and I am calm.' },
    { do: 'say', who: 'vesper', text: 'The monocle does not move. Neither do I.' },
    { do: 'fade', to: 1, s: 1.0 },
    { do: 'wait', s: 0.4 },
    // Back in the republic: Brenda receives the news from her throne.
    { do: 'cam', shot: stageCut('brenda-throne', 'wide') },
    { do: 'fade', to: 0, s: 1.0 },
    { do: 'say', who: 'brenda', text: 'The club is a bog! The hoses have spoken!', stinger: 'triumph' },
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.6, async: true },
    { do: 'gesture', who: 'b1', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'b2', name: 'cheer', s: 1.6 },
    { do: 'horn', vehicle: 'g1' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-44, 209, 0.8), look: 'brenda', fov: 40 } },
    { do: 'say', who: 'brenda', text: 'A national holiday! Name it after me. Name everything after me.' },
    { do: 'wait', s: 0.8 },
  ],
};

export const HOSE_REVOLT_SCENES: SceneScript[] = [HOSE_REVOLT_INTRO, HOSE_REVOLT_CLUB, HOSE_REVOLT_OUTRO];
