// The four downtown homes (E10): Juniper Vance's terrace on Kerb Row (home-01), the Mayor's red villa (home-02),
// Reginald Vance's townhouse 404 (home-03) and Mabel's flat over the Kerbstone Cabs garage (home-04).
// Each stands on its E01 home site, faces its HOME_DOORS spot, and keeps small story props, jokes and a resident.
// Everything is a prefab (buildPieces) plus text plates, lit panes and static gnomes.
import * as THREE from 'three';
import { DEFAULT_LOOK } from '../config';
import { makeGnome } from '../gnomes';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildPieces, litWindow, textPlate, type HomePiece } from './pieces';
import type { GnomeLook } from '@lawn/gnome';

/** A home's frame: origin in the world and the yaw its front faces. Local x runs across the front, local z out of it. */
interface Frame { x: number; z: number; yaw: number }

interface Plate { text: string; lx: number; y: number; lz: number; w: number; h: number; bg?: number; fg?: number; back?: boolean }
interface Pane { lx: number; y: number; lz: number; w: number; h: number }
interface Resident { look: GnomeLook; lx: number; lz: number; y?: number; yaw: number; scale?: number }
/** A loop of string between pegs (local x, z) at a height. */
interface StringLoop { pts: [number, number][]; y: number }

interface Home {
  pieces: HomePiece[];
  plates: Plate[];
  panes: Pane[];
  residents: Resident[];
  strings?: StringLoop[];
  frame: Frame;
}

/** Local (lx, lz) of a frame to world (x, z); the same turn planPieces uses. */
function at(f: Frame, lx: number, lz: number): [number, number] {
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  return [f.x + lx * c + lz * s, f.z - lx * s + lz * c];
}

type PieceOpts = Partial<Omit<HomePiece, 'prefab' | 'x' | 'z' | 'yaw'>> & { turn?: number };

/** A prefab at a local spot of the frame; `turn` adds to the frame's yaw. */
function put(f: Frame, prefab: string, lx: number, lz: number, o: PieceOpts = {}): HomePiece {
  const [x, z] = at(f, lx, lz);
  const { turn, ...rest } = o;
  return { prefab, x, z, yaw: f.yaw + (turn ?? 0), ...rest };
}

/** Non-solid prop (a pot, a parcel): never a collider. */
const soft = (o: PieceOpts = {}): PieceOpts => ({ solid: false, ...o });

const GOLD = 0xd4af37;

// ---- Juniper Vance: the Kerb Row terrace (home-01) --------------------------------------------------------------------

function juniper(): Home {
  const f: Frame = { x: -90, z: 140, yaw: Math.PI };
  const S = 1.7;
  const F = 3.47 * S; // front of the stoop (collider face)
  const W = 3.4 * S; // one house wide
  const pieces: HomePiece[] = [
    put(f, 'euro-townhouse-tall', -W, 0, { scale: S, tint: 0xd9c8a0 }),
    put(f, 'euro-townhouse-tall', 0, 0, { scale: S, tint: 0x9fc5a0 }), // Juniper's, in the middle
    put(f, 'euro-townhouse-tall', W, 0, { scale: S, tint: 0xc9a99a }),
    // The street sign stands on a plaque post.
    put(f, 'stone-plaque', 9, F + 1.6, { scale: 1.6 }),
    // The council bike, ticketed by her own council.
    put(f, 'bike-rack', -3.4, F + 1.3),
    // Rezoning papers weighed down by a stone on the step.
    put(f, 'sealed-letter', -1.5, F + 0.6, soft({ scale: 2, turn: 0.2 })),
    put(f, 'sealed-letter', -1.4, F + 0.55, soft({ scale: 2, y: 0.04, turn: -0.3 })),
    put(f, 'garden-rock', -1.45, F + 0.58, soft({ scale: 0.5, y: 0.08 })),
    // The paint pot beside the half-painted door.
    put(f, 'clay-jar', 1.3, F + 0.35, soft({ scale: 0.9, tint: 0x2e7d32 })),
    // Her file and her mug on a crate.
    put(f, 'crate', 2.6, F + 0.5, soft({ scale: 0.8 })),
    put(f, 'ledger', 2.6, F + 0.5, soft({ scale: 3, y: 0.48 })),
    put(f, 'espresso-cup', 2.9, F + 0.45, soft({ scale: 1.4, y: 0.48 })),
    put(f, 'mailbox', -2.3, F + 0.5, soft()),
  ];
  const plates: Plate[] = [
    { text: 'J. VANCE', lx: 0, y: 1.9 * S, lz: 3.06 * S, w: 1.3, h: 0.45 },
    // Half-painted front door: a green patch over its lower half.
    { text: '', lx: 0, y: 0.4 * S, lz: 3.1 * S, w: 0.9 * S, h: 0.8 * S, bg: 0x2e7d32 },
    { text: 'WET PAINT\n(HALF)', lx: 0, y: 1.1 * S, lz: 3.12 * S, w: 0.8, h: 0.3, bg: 0xf5f0e1 },
    // Free-standing in the front garden: both faces printed, on a backing.
    { text: 'KERB ROW\nkerbs: yes  row: ongoing', lx: 9, y: 1.2, lz: F + 1.6 + 0.36, w: 1.8, h: 0.8, bg: 0x2f6f4f, fg: 0xf5f0e1, back: true },
    { text: 'PARKING FINE\nISSUED BY: COUNCIL', lx: -3.4, y: 0.6, lz: F + 1.3 + 0.3, w: 0.9, h: 0.4, bg: 0xf2c200 },
  ];
  const pane = (lx: number, y: number, w = 0.55): Pane => ({ lx: lx * S, y: y * S, lz: 3.095 * S, w: w * S, h: 1.2 * S });
  const panes: Pane[] = [
    pane(0, 3.6, 0.6), pane(0, 5.9, 0.6), // hers, lit late
    { ...pane(0, 5.9, 0.6), lx: -W }, { ...pane(0, 3.6, 0.6), lx: W }, // the neighbours'
  ];
  const residents: Resident[] = [
    // Juniper on her front step, reading the rezoning file.
    { look: { ...DEFAULT_LOOK, hat: 0x2e7d32, shirt: 0xf5f0e1, glasses: true }, lx: 0.45, lz: 3.3 * S, y: 0.26, yaw: f.yaw },
  ];
  return { pieces, plates, panes, residents, frame: f };
}

// ---- Mayor Mulch: the red villa (home-02) ----------------------------------------------------------------------------

function mayor(): Home {
  const f: Frame = { x: 80, z: -147.8, yaw: 0 };
  const S = 2.4;
  const F = 3.47 * S;
  const gate = F + 4.0;
  const pieces: HomePiece[] = [
    put(f, 'euro-townhouse-mansard', 0, 0, { scale: S, tint: 0xb3261e }),
    put(f, 'mailbox', 1.7, F + 0.5, soft({ tint: GOLD })),
    put(f, 'rose-bush', -2.1, F + 0.7, soft()),
    put(f, 'rose-bush', 2.1, F + 0.7, soft()),
    // The ribbon is still tied across the gate.
    put(f, 'street-bollard', -1.6, gate),
    put(f, 'street-bollard', 1.6, gate),
    // The donations sign on a plaque post.
    put(f, 'stone-plaque', -2.6, F + 2.4, { scale: 1.5 }),
    // His gold statue's plinth.
    put(f, 'crate', -4.6, F + 1.6, { scale: 1.2, tint: 0x8d8d86 }),
    // The overflowing bin of thank-you gifts.
    put(f, 'litter-bin', 4.2, F + 1.8, { scale: 1.4 }),
    put(f, 'parcel-box', 4.9, F + 1.2, soft({ scale: 2.6, tint: 0xd93636, turn: 0.4 })),
    put(f, 'parcel-box', 3.4, F + 1.3, soft({ scale: 2.6, tint: 0x3a7bd5, turn: -0.5 })),
    put(f, 'parcel-box', 4.3, F + 2.7, soft({ scale: 2.6, tint: 0x2e7d32, turn: 0.2 })),
    put(f, 'parcel-box', 4.2, F + 1.8, soft({ scale: 2.6, y: 1.35, tint: GOLD, turn: 0.8 })),
  ];
  const plates: Plate[] = [
    { text: 'THE MAYOR\nPLEASE KNOCK LOUDLY', lx: 0, y: 1.9 * S, lz: 3.06 * S, w: 2.2, h: 0.7, bg: GOLD },
    { text: 'RESIDENCE OF THE MAYOR\nCAMPAIGN DONATIONS: SIDE DOOR', lx: -2.6, y: 1.35, lz: F + 2.4 + 0.3, w: 1.8, h: 0.7, bg: 0x7a1a14, fg: 0xf5f0e1 },
    { text: 'RIBBON CUT (AGAIN)', lx: 0, y: 1.0, lz: gate, w: 2.7, h: 0.3, bg: 0xd93636, fg: 0xffffff },
  ];
  const pane = (lx: number, y: number, w: number, h: number): Pane => ({ lx: lx * S, y: y * S, lz: 3.095 * S, w: w * S, h: h * S });
  const panes: Pane[] = [pane(-1.1, 1.3, 0.6, 1.3), pane(1.1, 1.3, 0.6, 1.3), pane(-1.1, 3.6, 0.6, 1.4), pane(1.1, 3.6, 0.6, 1.4)];
  const gold: GnomeLook = { ...DEFAULT_LOOK, hat: GOLD, shirt: GOLD, pants: GOLD, skin: GOLD, boots: GOLD, beard: GOLD };
  const residents: Resident[] = [
    // The gold statue of himself, on its plinth.
    { look: gold, lx: -4.6, lz: F + 1.6, y: 0.72, yaw: f.yaw + 0.3, scale: 1.3 },
  ];
  return { pieces, plates, panes, residents, frame: f };
}

// ---- Reginald "Quarter-Inch" Vance: townhouse 404 (home-03) -----------------------------------------------------------

function reginald(): Home {
  const f: Frame = { x: 102, z: -146.2, yaw: 0 };
  const S = 1.5;
  const F = 3.47 * S;
  const sq: [number, number][] = [[5.2, F + 0.4], [7.2, F + 0.4], [7.2, F + 2.4], [5.2, F + 2.4]];
  const pieces: HomePiece[] = [
    put(f, 'euro-townhouse-tall', 0, 0, { scale: S, tint: 0xd8c9a0 }),
    put(f, 'mailbox', -1.6, F + 0.5, soft()),
    // The tidy box hedge, and the notice pinned on his own hedge.
    put(f, 'euro-box-hedge', -3.3, F + 2.2, { scale: 1.5 }),
    put(f, 'euro-box-hedge', 3.3, F + 2.2, { scale: 1.5 }),
    // A neat row of identical pots.
    ...[1.2, 1.65, 2.1, 2.55].map((lx) => put(f, 'euro-geranium-pot', lx, F + 0.35, soft())),
    // The one perfectly measured square: pegs, string (see strings below), calipers on a crate.
    ...sq.map(([lx, lz]) => put(f, 'site-cone', lx, lz, soft({ scale: 0.45 }))),
    put(f, 'crate', 4.3, F + 0.4, soft({ scale: 0.5 })),
    put(f, 'brass-calipers', 4.3, F + 0.4, soft({ scale: 2.5, y: 0.3 })),
    // The sign on its plaque post.
    put(f, 'stone-plaque', -6, F + 1.0, { scale: 1.4 }),
  ];
  const plates: Plate[] = [
    { text: '404\nR. VANCE', lx: 0, y: 1.9 * S, lz: 3.06 * S, w: 1.0, h: 0.4 },
    { text: 'NOTICE OF\nNON-COMPLIANCE', lx: -3.3, y: 0.5, lz: F + 2.2 + 0.5, w: 1.0, h: 0.5, bg: 0xf5f0e1 },
    { text: 'LAWN UNDER\nOBSERVATION', lx: -6, y: 1.1, lz: F + 1.0 + 0.3, w: 1.5, h: 0.6, bg: 0xf5f0e1 },
  ];
  const pane = (y: number): Pane => ({ lx: 0, y: y * S, lz: 3.095 * S, w: 0.6 * S, h: 1.2 * S });
  const panes: Pane[] = [pane(3.6), pane(5.9), pane(8.15)];
  const strings: StringLoop[] = [{ pts: sq, y: 0.2 }];
  return { pieces, plates, panes, residents: [], strings, frame: f };
}

// ---- Mabel Kerbstone: the flat over the cab garage (home-04) ----------------------------------------------------------

function mabel(): Home {
  const S = 1.3;
  const doorX = 2.2; // the flat's own door, local x, in line with HOME_DOORS.mabel (z 30)
  const f: Frame = { x: -147.6, z: 30 + doorX, yaw: Math.PI / 2 };
  const Fw = 4.0 * S; // front wall
  const F = 4.26 * S; // collider face
  const pieces: HomePiece[] = [
    put(f, 'rough-workshop', 0, 0, { scale: S, tint: 0xb9b2a0 }),
    put(f, 'panelled-door', doorX, Fw + 0.05, soft({ scale: 1.2 })),
    // The stair to the flat, beside the garage door.
    put(f, 'wooden-staircase', -5.4, Fw + 0.45, { scale: 1.2 }),
    // The cab she leans on, and the old one with its bonnet up.
    put(f, 'gta-taxi', -1.5, F + 1.0, { scale: 1.8, turn: Math.PI / 2 }),
    put(f, 'scrap-car', 5.5, F + 0.9, { scale: 0.9, tint: 0xf2c200 }),
    put(f, 'crate', 3.6, F + 0.8, soft({ scale: 0.6, tint: 0xb3261e })), // the toolbox
    put(f, 'oil-drum', 4.4, F + 0.35, soft({ scale: 0.8 })),
    // The jar of change at the stair foot.
    put(f, 'clay-jar', -4.2, F + 0.45, soft({ scale: 1.2, tint: GOLD })),
    put(f, 'mailbox', 0.9, F + 0.2, soft()),
  ];
  const plates: Plate[] = [
    { text: 'M. KERBSTONE\nFLAT ABOVE', lx: doorX, y: 2.9, lz: Fw + 0.06, w: 1.5, h: 0.5 },
    { text: 'KERBSTONE CABS\nCASH ONLY. CORRECT CHANGE NOT REQUIRED: I HAVE IT', lx: -1.95, y: 4.45, lz: Fw + 0.3, w: 4.0, h: 0.9, bg: 0xf2c200 },
    { text: 'BACK IN 5 MINS\n(MAYBE 50)', lx: -1.95, y: 1.8, lz: Fw + 0.25, w: 1.6, h: 0.5, bg: 0xf5f0e1 },
  ];
  const pane = (lx: number): Pane => ({ lx, y: 4.2, lz: Fw + 0.03, w: 1.0, h: 0.9 });
  const panes: Pane[] = [pane(0.6), pane(2.2), pane(3.8), pane(5.4)];
  const residents: Resident[] = [
    // Mabel at the tail of her cab, counting change.
    { look: { ...DEFAULT_LOOK, hat: 0xd93636, shirt: 0xf2c200 }, lx: -3.9, lz: F + 1.0, yaw: Math.PI, scale: 1 },
  ];
  return { pieces, plates, panes, residents, frame: f };
}

function homes(): Home[] {
  return [juniper(), mayor(), reginald(), mabel()];
}

/** Every prefab of the four homes (pure; the unit test checks their colliders against the sites and doors). */
export function townHomePieces(): HomePiece[] {
  return homes().flatMap((h) => h.pieces);
}

/** Build the four homes into the scene; returns their colliders (push into world.boxes). */
export function buildTownHomes(scene: THREE.Scene): Box[] {
  const boxes = buildPieces(scene, townHomePieces(), 'town-homes');
  const life = new THREE.Group();
  life.name = 'town-homes-life';
  for (const h of homes()) {
    const f = h.frame;
    const gy = (lx: number, lz: number): [number, number, number] => {
      const [x, z] = at(f, lx, lz);
      return [x, heightAt(x, z), z];
    };
    for (const p of h.plates) {
      const [x, g, z] = gy(p.lx, p.lz);
      life.add(textPlate(p.text, x, g + p.y, z, f.yaw, { w: p.w, h: p.h, bg: p.bg, fg: p.fg, back: p.back, backing: p.back ? true : undefined }));
    }
    for (const p of h.panes) {
      const [x, g, z] = gy(p.lx, p.lz);
      life.add(litWindow(x, g + p.y, z, f.yaw, p.w, p.h));
    }
    for (const r of h.residents) {
      const [x, g, z] = gy(r.lx, r.lz);
      const model = makeGnome(life, r.look);
      model.object.position.set(x, g + (r.y ?? 0), z);
      model.object.rotation.y = r.yaw;
      if (r.scale && r.scale !== 1) model.object.scale.multiplyScalar(r.scale);
    }
    for (const s of h.strings ?? []) {
      const pts = s.pts.map(([lx, lz]) => { const [x, g, z] = gy(lx, lz); return new THREE.Vector3(x, g + s.y, z); });
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xf5f0e1 }));
      line.name = 'measuring-string';
      life.add(line);
    }
  }
  scene.add(life);
  return boxes;
}
