// Chapter 1 story scenes, second file: Two-Coat Tail, the Glaze & Tax break-in, Founder's Boot, the chapter 1 closer.
// Owner: one issue of docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { ScriptActor, ScriptVehicle, SceneScript, Vec2 } from '../../script';
import { markOf, pathOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const MAYOR_LOOK: Look = { hat: 0x2c3e50, shirt: 0x8b1e24, beard: 0xeeeeee, glasses: true };
const MABEL_LOOK: Look = { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null };
/** HOA enforcers and bodyguards (no preset in cast.ts). */
const ENFORCER_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };
const GUARD_LOOK: Look = { hat: 0x18181e, shirt: 0x23262e };
const PRESS_LOOK: Look = { hat: 0x6b6b6b, shirt: 0xe6e0c8 };
const TURNCOAT_LOOK: Look = { hat: 0xf4f4f8, shirt: 0xc9b99b };

/** A cast member's own vehicle (rideOf: kind and Pay 'n' Glaze look) at a point. */
function ride(id: string, castId: string, at: Vec2, yaw: number, extra: Partial<ScriptVehicle> = {}): ScriptVehicle {
  return { id, ...rideOf(castId), at, yaw, ...extra };
}

// ---- Stage marks (quests/stages/turfton.ts, turftonB.ts, cloverfield.ts ...) -----------------------------------------
const CH_PLAYER = markOf('city-hall-steps', 'player');
const JUNIPER = markOf('city-hall-steps', 'juniper');
const MAYOR = markOf('city-hall-steps', 'mayor-mulch');
const PRESS_A = markOf('city-hall-steps', 'press', 0);
const PRESS_B = markOf('city-hall-steps', 'press', 1);
const CITY_HALL_ARRIVAL = pathOf('city-hall-steps', 'city-hall-approach');

const PATIO_VESPER = markOf('patio-gallery', 'vesper');
const PATIO_MAYOR = markOf('patio-gallery', 'mayor-mulch');
const PATIO_GUARD_A = markOf('patio-gallery', 'hoa-bodyguard', 0);
const PATIO_GUARD_B = markOf('patio-gallery', 'hoa-bodyguard', 1);
const PATIO_PLAYER = markOf('patio-gallery', 'player');

const BAY_PLAYER = markOf('side-valve-bay', 'player');
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const BAY_PIP = markOf('side-valve-bay', 'pip');
const BAY_TURNCOAT = markOf('side-valve-bay', 'turncoat-cam');
const BAY_VESPER_ARRIVAL = pathOf('side-valve-bay', 'side-valve-approach');
const BAY_VESPER_GETAWAY = pathOf('side-valve-bay', 'side-valve-getaway');

const AMPH_BAILIFF_A = markOf('amphitheater', 'hoa-bailiff', 0);
const AMPH_BAILIFF_B = markOf('amphitheater', 'hoa-bailiff', 1);
const PARADE = pathOf('amphitheater', 'parade-route');

const BODEGA = markOf('bodega-front', 'bodega');
const PATIO_APPROACH = pathOf('patio-gallery', 'patio-gallery-approach');
const PATIO_GETAWAY = pathOf('patio-gallery', 'patio-gallery-getaway');

/** Two-Coat Tail, scene 1: Juniper's noon statement, the Mayor's scissors, the taxi that won't take the player. */
export const TWO_COAT_INTRO: SceneScript = {
  id: 'two-coat-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'crowd',
  actors: [
    { id: 'player', player: true, at: CH_PLAYER.at, yaw: CH_PLAYER.yaw },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: JUNIPER.at, yaw: JUNIPER.yaw },
    { id: 'mayor', name: 'Mayor Mulch', look: MAYOR_LOOK, held: 'hedge-shears', at: MAYOR.at, yaw: MAYOR.yaw },
    { id: 'press-a', name: 'Reporter', look: PRESS_LOOK, at: PRESS_A.at, yaw: PRESS_A.yaw },
    { id: 'press-b', name: 'Photographer', look: PRESS_LOOK, at: PRESS_B.at, yaw: PRESS_B.yaw },
    { id: 'mabel', name: 'Mabel Kerbstone', look: MABEL_LOOK, hz: 104, hidden: true, seatedIn: 'taxi', at: [0, 0] },
  ],
  vehicles: [
    ride('juniper-ride', 'juniper', [24, -68.5], 0),
    ride('mayor-ride', 'mayor-mulch', [40, -68.5], 0),
    { id: 'taxi', kind: 'ride-on', at: [120, -62.5], yaw: -Math.PI / 2, tint: 0xf2c230, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot('city-hall-steps', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [15.67, 1.25, -68.27], look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'Citizens of Turfton, the grass is growing at a healthy and legal height.' },
    { do: 'cam', shot: { kind: 'cut', pos: [10.72, 1.25, -68.19], look: 'press-a', fov: 46 } },
    { do: 'say', who: 'press-a', text: 'Councilwoman, what about the medians?' },
    { do: 'cam', shot: spot('city-hall-steps', 'two-shot') },
    { do: 'cam', shot: { kind: 'cut', pos: [15.67, 1.25, -68.27], look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'The medians are in very capable hands. Mayor, show them the scissors.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(21, -66.5, 1.5), look: 'mayor', fov: 46 } },
    { do: 'sfx', id: 'shutter' },
    { do: 'gesture', who: 'mayor', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'mayor', text: 'Snip! Fresh paint, fresh paving, fresh promises!' },
    // Statement over: Juniper crosses to the player.
    { do: 'walk', who: 'juniper', path: [[9, -69]], speed: 1.2, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(3, -65.5, 1.6), look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'They call me The Trowel. Reginald says it is because I dig. I say it is because he is dull.' },
    { do: 'say', who: 'juniper', text: 'My brother calls Vesper\'s 400-page grass study light reading.' },
    // The Mayor climbs onto his candy-red Ride-On and putters off east, bell ringing.
    { do: 'cam', shot: { kind: 'cut', pos: [15.27, 1.25, -69.33], look: 'mayor', fov: 46 } },
    { do: 'say', who: 'mayor', text: 'Ta-ta, Trowel! Ding, ding!' },
    { do: 'enter', who: 'mayor', vehicle: 'mayor-ride' },
    { do: 'cam', shot: { kind: 'track', pos: up(30, -52, 3), who: 'mayor-ride', fov: 50 } },
    { do: 'drive', vehicle: 'mayor-ride', path: [[40, -68.5], [40, -57.5], [100, -57.5]], speed: 8, arrive: false, async: true },
    { do: 'horn', vehicle: 'mayor-ride' },
    { do: 'cam', shot: { kind: 'cut', pos: up(3, -65.5, 1.6), look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'He is sneaking off to Patio Heights. Tail him past Bodega\'s and catch the handover.' },
    { do: 'give', from: 'juniper', to: 'player', prop: 'field-camera' },
    { do: 'say', who: 'player', text: 'Why me?' },
    { do: 'say', who: 'juniper', text: 'Because you have no reputation to lose. Bring me the photos.' },
    // Mabel Kerbstone's taxi.
    { do: 'spawn', id: 'taxi', at: [120, -62.5], yaw: -Math.PI / 2 },
    { do: 'spawn', id: 'mabel' },
    { do: 'cam', shot: { kind: 'track', pos: up(22, -66, 2.2), who: 'taxi', fov: 50 } },
    { do: 'drive', vehicle: 'taxi', path: CITY_HALL_ARRIVAL, speed: 9 },
    { do: 'say', who: 'mabel', text: 'Turfton Taxi! Hop in, dear.' },
    { do: 'cam', shot: { kind: 'cut', pos: [7.09, 1.25, -66.43], look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'They are on a job, Mabel.' },
    { do: 'cam', shot: { kind: 'cut', pos: [11.27, 1.25, -60.83], look: 'mabel', fov: 46 } },
    { do: 'say', who: 'mabel', text: 'Not on a job, dear. Suit yourself.' },
    { do: 'drive', vehicle: 'taxi', path: [[0, -62.5], [-50, -62.5]], speed: 11, arrive: false },
    { do: 'walk', who: 'player', path: [[4.5, -70.5]], speed: 1.2 },
  ],
};

/** Two-Coat Tail, arrival: the Mayor hands Vesper a ledger at Patio Heights; the player's photo gets them caught. */
export const TWO_COAT_HANDOVER: SceneScript = {
  id: 'two-coat-handover',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'player', player: true, at: PATIO_PLAYER.at, yaw: PATIO_PLAYER.yaw },
    { id: 'vesper', preset: 'vesper', at: PATIO_VESPER.at, yaw: PATIO_VESPER.yaw },
    { id: 'mayor', name: 'Mayor Mulch', look: MAYOR_LOOK, at: PATIO_MAYOR.at, yaw: PATIO_MAYOR.yaw },
    { id: 'guard-a', name: 'HOA Bodyguard', look: GUARD_LOOK, at: PATIO_GUARD_A.at, yaw: PATIO_GUARD_A.yaw },
    { id: 'guard-b', name: 'HOA Bodyguard', look: GUARD_LOOK, at: PATIO_GUARD_B.at, yaw: PATIO_GUARD_B.yaw },
  ],
  vehicles: [
    ride('vesper-car', 'vesper', [156, -134], Math.PI),
    ride('mayor-ride', 'mayor-mulch', [146, -134], Math.PI),
  ],
  steps: [
    { do: 'gesture', who: 'player', name: 'lean', s: 2, async: true },
    { do: 'cam', shot: spot('patio-gallery', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [159.25, 1.25, -158.89], look: 'mayor', fov: 46 } },
    { do: 'say', who: 'mayor', text: 'The median leases, Vesper. Every one signed in ink. Mostly.' },
    { do: 'give', from: 'mayor', to: 'vesper', prop: 'ledger' },
    { do: 'give', from: 'vesper', to: 'mayor', prop: 'sealed-letter', s: 1 },
    { do: 'cam', shot: spot('patio-gallery', 'two-shot') },
    { do: 'say', who: 'vesper', text: 'A second coat, Barnaby? Streaky.' },
    // The flash: a hedge-level cut from the player's camera.
    { do: 'cam', shot: { kind: 'cut', pos: up(145, -146, 0.9), look: 'vesper', fov: 50 } },
    { do: 'sfx', id: 'shutter' },
    { do: 'shake', amp: 0.03, s: 0.3 },
    { do: 'cam', shot: spot('patio-gallery', 'close') },
    { do: 'say', who: 'mayor', text: 'That was a different glaze!' },
    { do: 'stinger', id: 'danger' },
    { do: 'music', track: 'chase', fade: 0.5 },
    { do: 'face', who: 'guard-a', at: 'player', s: 0.4 },
    { do: 'face', who: 'guard-b', at: 'player', s: 0.4 },
    { do: 'walk', who: 'guard-a', path: [[150, -150], [147, -148]], run: true, async: true },
    { do: 'gesture', who: 'vesper', name: 'point', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: [139.73, 1.25, -153.67], look: 'vesper', fov: 46 } },
    { do: 'say', who: 'vesper', text: 'Gentlemen. We have a photographer.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(141, -149, 1.8), look: 'vesper', fov: 44 } },
    { do: 'say', who: 'vesper', text: 'Nice hat. Shame if it cracked.' },
  ],
};

/** Two-Coat Tail, chapter-side outro: the photos reach City Hall, Reginald measures the grass and the Trowel bites back. */
export const TWO_COAT_OUTRO: SceneScript = {
  id: 'two-coat-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, at: CH_PLAYER.at, yaw: CH_PLAYER.yaw, held: 'field-camera' },
    { id: 'juniper', preset: 'juniper', at: JUNIPER.at, yaw: JUNIPER.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'van', hidden: true, at: [0, 0] },
  ],
  vehicles: [
    ride('van', 'reginald', CITY_HALL_ARRIVAL[0], -Math.PI / 2, { hidden: true }),
  ],
  steps: [
    { do: 'cam', shot: spot('city-hall-steps', 'wide') },
    { do: 'give', from: 'player', to: 'juniper', prop: 'field-camera' },
    { do: 'cam', shot: { kind: 'cut', pos: [15.67, 1.25, -68.27], look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'Signing the medians straight over to Vesper. Barnaby, Barnaby.' },
    // Reginald's Code-Enforcement van on the z = -60 road.
    { do: 'spawn', id: 'van' },
    { do: 'spawn', id: 'reginald' },
    { do: 'cam', shot: { kind: 'track', pos: up(10, -58.5, 2), who: 'van', fov: 50 } },
    { do: 'parallel', tracks: [
      [{ do: 'drive', vehicle: 'van', path: CITY_HALL_ARRIVAL, speed: 9 }],
      [{ do: 'wait', s: 1 }, { do: 'say', who: 'juniper', text: 'Speaking of the Glazier\'s errand boys. My brother.' }],
    ] },
    { do: 'exit', who: 'reginald' },
    { do: 'walk', who: 'reginald', path: [[11, -63.5], [10, -64.5]], speed: 1.2 },
    { do: 'gesture', who: 'reginald', name: 'point', s: 1.2 },
    { do: 'cam', shot: spot('city-hall-steps', 'two-shot') },
    { do: 'say', who: 'reginald', text: 'Juniper. Your grass is a quarter-inch proud.' },
    { do: 'cam', shot: { kind: 'cut', pos: [15.67, 1.25, -68.27], look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'Reginald. Your boss is a crook.' },
    // He leaves stiffly.
    { do: 'enter', who: 'reginald', vehicle: 'van' },
    { do: 'drive', vehicle: 'van', path: [[14, -62.5], [0, -62.5], [-50, -62.5]], speed: 9, arrive: false, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(3, -65.5, 1.6), look: 'juniper', fov: 46 } },
    { do: 'say', who: 'juniper', text: 'Big Lou at the Gnomecino says the Glaze & Tax boys are squeezing him too.' },
    { do: 'walk', who: 'player', path: [[4.5, -70.5]], speed: 1.2 },
  ],
};

/** Glaze & Tax break-in, intro: Vesper serves Tansy a foreclosure lien; the crew plans the raid on the Buck-Iron Combine. */
export const TAX_BREAK_IN_INTRO: SceneScript = {
  id: 'tax-break-in-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER.at, yaw: BAY_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'vesper', preset: 'vesper', seatedIn: 'vesper-car', hidden: true, at: [0, 0] },
  ],
  vehicles: [
    ride('vesper-car', 'vesper', BAY_VESPER_ARRIVAL[0], -Math.PI / 2, { hidden: true }),
  ],
  steps: [
    { do: 'cam', shot: spot('side-valve-bay', 'wide') },
    { do: 'spawn', id: 'vesper-car' },
    { do: 'cam', shot: { kind: 'track', pos: up(-130, 50, 3), who: 'vesper-car', fov: 50 } },
    { do: 'stinger', id: 'villain' },
    { do: 'parallel', tracks: [
      [{ do: 'drive', vehicle: 'vesper-car', path: BAY_VESPER_ARRIVAL, speed: 10 }],
      [{ do: 'wait', s: 1.5 }, { do: 'say', who: 'pip', text: 'A clean car. In Turfton. That\'s never good news.' },
        { do: 'say', who: 'tansy', text: 'Vesper Thorne. Hide the toast.' }],
    ] },
    { do: 'spawn', id: 'vesper' },
    { do: 'exit', who: 'vesper' },
    { do: 'walk', who: 'vesper', path: [[-148, 70.5]], speed: 1.2 },
    { do: 'cam', shot: spot('side-valve-bay', 'two-shot') },
    { do: 'say', who: 'vesper', text: 'Forty-eight hours, Ms. Clayfoot.' },
    { do: 'give', from: 'vesper', to: 'tansy', prop: 'sealed-letter' },
    { do: 'say', who: 'vesper', text: 'Nice hat, by the way. Shame if it cracked.' },
    // Pip ducks behind a barrel.
    { do: 'walk', who: 'pip', path: [[-134.5, 79]], speed: 1.4, async: true },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.5, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(-146, 66, 1.7), look: up(-158, 72, 0.6), fov: 46 } },
    { do: 'say', who: 'vesper', text: 'And do not open that Seed-Cell crate.' },
    // He drives off: a follow shot on the getaway.
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car' },
    { do: 'cam', shot: { kind: 'follow', who: 'vesper-car', offset: [0, 2.2, -5.5] } },
    { do: 'drive', vehicle: 'vesper-car', path: BAY_VESPER_GETAWAY.slice(0, 3), speed: 12, arrive: false },
    { do: 'music', track: 'heist', fade: 1 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-139, 70.5, 1.8), look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'He filed my deed at the Glaze & Tax Office, under Thorne Tower.' },
    { do: 'say', who: 'tansy', text: 'So we crack his auditors, raid the vault, and borrow the Buck-Iron Combine.' },
    { do: 'say', who: 'tansy', text: 'Famous for opening with a butter knife.' },
    { do: 'say', who: 'pip', text: 'I brought two butter knives. One for the ignition, one for emergency toast.' },
    { do: 'say', who: 'tansy', text: 'Guns are free at Ammu-Gnation on the east road. The shiny bits are not.' },
    { do: 'say', who: 'pip', text: 'I want the golden kazoo.' },
    { do: 'walk', who: 'player', path: [[-147, 67]], speed: 1.4 },
  ],
};

/** Glaze & Tax break-in, outro: the player brings the stolen Buck-Iron Combine onto the apron; the blueprints say "golden acorn". */
export const TAX_BREAK_IN_OUTRO: SceneScript = {
  id: 'tax-break-in-outro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'turncoat', name: 'Turncoat Cam', look: TURNCOAT_LOOK, at: BAY_TURNCOAT.at, yaw: BAY_TURNCOAT.yaw },
  ],
  vehicles: [
    { id: 'ride', kind: 'combine', from: 'player', at: [-122.5, 57.5], yaw: -Math.PI / 2 },
  ],
  props: [
    { id: 'plans', prefab: 'folded-map', at: up(-158, 75.6, 0.95), yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: spot('side-valve-bay', 'wide') },
    { do: 'walk', who: 'turncoat', path: [[-158, 68], [-146, 68]], speed: 1, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-160, 50, 4), who: 'ride', fov: 50 } },
    { do: 'sfx', id: 'engine-rev' },
    { do: 'shake', amp: 0.08, s: 2.5 },
    { do: 'drive', vehicle: 'ride', path: [[-150, 57.5], [-150, 72]], speed: 6 },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.5 },
    { do: 'cam', shot: { kind: 'cut', pos: [-138.23, 1.25, 75.67], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'She is enormous! Tansy, she is enormous!' },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-148, 67]], speed: 1.4 },
    // The blueprints on the bench: a close dolly down onto them.
    { do: 'cam', shot: { kind: 'dolly', from: up(-152, 73, 2.5), to: up(-156, 75.5, 1.2), look: 'plans', s: 4 } },
    { do: 'say', who: 'tansy', text: 'The Grand Combine. A harvester the size of a block.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-142.88, 1.25, 69.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Zero-millimetre scalp.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-138.23, 1.25, 75.67], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'What does it run on?' },
    { do: 'cam', shot: { kind: 'cut', pos: [-142.88, 1.25, 69.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'A Fescue Golden Acorn.' },
    // Everyone turns to the crate.
    { do: 'cam', shot: { kind: 'cut', pos: up(-140, 64, 2.3), look: up(-160, 72, 0.8), fov: 50 } },
    { do: 'stinger', id: 'reveal' },
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'face', who: 'pip', at: [-160, 72], s: 0.3 },
    { do: 'face', who: 'tansy', at: [-160, 72], s: 0.3 },
    { do: 'face', who: 'turncoat', at: [-160, 72], s: 0.3 },
    { do: 'wait', s: 2 },
  ],
};

/** Founder's Boot, intro: Vesper's HOA tribunal during the parade; the crew decides to steal the Boot. */
export const FOUNDERS_BOOT_INTRO: SceneScript = {
  id: 'founders-boot-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'crowd',
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER.at, yaw: BAY_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    // Reginald stands on the dais floor in front of the lectern (his mark's dais edge is a wall).
    { id: 'reginald', preset: 'reginald', at: [-86, -91], yaw: 0, hidden: true },
    { id: 'bailiff-a', name: 'HOA Bailiff', look: ENFORCER_LOOK, at: AMPH_BAILIFF_A.at, yaw: AMPH_BAILIFF_A.yaw, hidden: true },
    { id: 'bailiff-b', name: 'HOA Bailiff', look: ENFORCER_LOOK, at: AMPH_BAILIFF_B.at, yaw: AMPH_BAILIFF_B.yaw, hidden: true },
  ],
  vehicles: [
    { id: 'boot', kind: 'boot-float', at: PARADE[0], yaw: -Math.PI / 2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot('side-valve-bay', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [-142.88, 1.25, 69.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Vesper has called an emergency HOA zoning tribunal at the Amphitheater.' },
    { do: 'say', who: 'tansy', text: 'During Founder\'s Trim Day, so nobody can protest it.' },
    // Cut to the amphitheater.
    { do: 'spawn', id: 'reginald' },
    { do: 'spawn', id: 'bailiff-a' },
    { do: 'spawn', id: 'bailiff-b' },
    { do: 'cam', shot: spot('amphitheater', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [-84.33, 1.25, -88.27], look: 'reginald', fov: 46 } },
    { do: 'say', who: 'reginald', text: 'Municipal Code four-oh-four, dash B: unlawful grass is a crime against the Tribunal.' },
    { do: 'cam', shot: spot('amphitheater', 'two-shot') },
    { do: 'say', who: 'bailiff-a', text: 'Yes, sir. The crowd is unlawful too.' },
    // Cut to the parade route: the Boot rolls along its path, filmed from behind.
    { do: 'spawn', id: 'boot' },
    { do: 'cam', shot: { kind: 'follow', who: 'boot', offset: [0, 4, -13], lag: 0.5 } },
    { do: 'say', who: 'Narrator', text: 'Founder\'s Trim Day, and the thirty-foot Gnorwin Clayfoot Boot is on parade.', hz: 130 },
    { do: 'drive', vehicle: 'boot', path: PARADE.slice(0, -1), speed: 11 },
    // Back at the bay.
    { do: 'cam', shot: { kind: 'cut', pos: up(-139, 70.5, 1.8), look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'What if we steal the Boot and park it in the jury box?' },
    { do: 'wait', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-139, 70.5, 1.8), look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: '...Yes.' },
    { do: 'walk', who: 'player', path: [[-147, 67]], speed: 1.4 },
  ],
};

/** Chapter 1 closer: the crew arrives in the Combine, Bodega & Sons, then Vesper and Reginald on the patio. */
export const FOUNDERS_BOOT_OUTRO: SceneScript = {
  id: 'founders-boot-outro',
  stage: { kind: 'world' },
  music: 'triumph',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'bodega', preset: 'bodega', at: BODEGA.at, yaw: BODEGA.yaw },
    { id: 'vesper', preset: 'vesper', at: PATIO_VESPER.at, yaw: PATIO_VESPER.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'van', hidden: true, at: [0, 0] },
  ],
  vehicles: [
    { id: 'ride', kind: 'combine', from: 'player', at: [-122.5, 57.5], yaw: -Math.PI / 2 },
    ride('vesper-car', 'vesper', [150, -134], Math.PI, { hidden: true }),
    ride('van', 'reginald', PATIO_APPROACH[0], Math.PI / 2, { hidden: true }),
  ],
  steps: [
    // The Combine rolls onto the apron.
    { do: 'cam', shot: { kind: 'track', pos: up(-160, 50, 4), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[-150, 57.5], [-150, 72]], speed: 7 },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-148, 67]], speed: 1.4 },
    { do: 'hold', who: 'tansy', prop: 'ledger' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-139, 70.5, 1.8), look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Stamped. Filed. Ours.' },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.5, async: true },
    { do: 'walk', who: 'pip', path: [[-130, 72], [-126, 76], [-130, 70], [-134, 70]], speed: 3, run: true, async: true },
    { do: 'say', who: 'pip', text: 'Lap of joy! Lap of joy!' },
    // Bodega & Sons.
    { do: 'music', track: 'turfton-dusk', fade: 1.5 },
    { do: 'cam', shot: spot('bodega-front', 'wide') },
    { do: 'walk', who: 'bodega', path: [[-80, 88]], speed: 0.9, async: true },
    { do: 'say', who: 'Narrator', text: 'Bodega & Sons. Asphalt the cat bats a bottlecap off the crate.', hz: 130 },
    { do: 'cam', shot: { kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'bodega', fov: 46 } },
    { do: 'say', who: 'bodega', text: 'Turfton FM says the Boot parked itself in the jury box.' },
    { do: 'say', who: 'bodega', text: 'Asphalt says she knew.' },
    // Patio Heights at dusk: Vesper alone, then Reginald with the bent calipers.
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'stinger', id: 'villain' },
    { do: 'cam', shot: spot('patio-gallery', 'wide') },
    { do: 'spawn', id: 'van' },
    { do: 'spawn', id: 'reginald' },
    { do: 'cam', shot: { kind: 'track', pos: up(120, -130, 4), who: 'van', fov: 50 } },
    { do: 'drive', vehicle: 'van', path: [PATIO_APPROACH[0], PATIO_APPROACH[1]], speed: 9 },
    { do: 'exit', who: 'reginald' },
    { do: 'walk', who: 'reginald', path: [[150, -124], [146, -136]], speed: 2.6 },
    { do: 'cam', shot: spot('patio-gallery', 'two-shot') },
    { do: 'say', who: 'reginald', text: 'They crashed the tribunal, sir. With a boot.' },
    { do: 'say', who: 'vesper', text: 'Then we stop asking.' },
    { do: 'say', who: 'vesper', text: 'Freeze the Black Dew. Cloverfield first.' },
    // Vesper's Lowrider leaves.
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car' },
    { do: 'drive', vehicle: 'vesper-car', path: PATIO_GETAWAY, speed: 9, arrive: false, spline: false, async: true },
    { do: 'cam', shot: { kind: 'follow', who: 'vesper-car', offset: [0, 2.2, -5.5] } },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: 'END OF CHAPTER 1' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
  ],
};

export const CH1B_SCENES: Record<string, SceneScript> = {
  'two-coat-intro': TWO_COAT_INTRO,
  'two-coat-handover': TWO_COAT_HANDOVER,
  'two-coat-outro': TWO_COAT_OUTRO,
  'tax-break-in-intro': TAX_BREAK_IN_INTRO,
  'tax-break-in-outro': TAX_BREAK_IN_OUTRO,
  'founders-boot-intro': FOUNDERS_BOOT_INTRO,
  'founders-boot-outro': FOUNDERS_BOOT_OUTRO,
};
