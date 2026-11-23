// Base view: three.js meshes for the base. Every piece is drawn from its prefab (config.PIECES). Pure scene code:
// no DOM. Issue 2.2 (roadmap 9).
import * as THREE from 'three';
import { buildPrefab, setPrefabDamage } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import { PIECES, PLOT } from './config';
import { doorHinge, edgeCenter, parseSlot, piecePlacement } from './grid';
import type { Aim, BaseState, Placement, PieceKind, PieceState, PlotDef } from './types';

export interface BaseView {
  sync(base: BaseState | null): void;
  setLit(pieceId: string, lit: boolean): void;
  showGhost(kind: PieceKind | null, plot: PlotDef | null, aim: Aim | null, ok: boolean): void;
  showPlot(plot: PlotDef | null): void;
  update(dt: number): void;
}

const LADDER_SCALE = 2.0;          // the ladder prefab is 1.6 tall; 3.2 gm
const LEAN = 0.19;                 // radians: a ladder leaning on its wall, top toward the wall face
const LYING_LIFT = 3.2 + 0.05;     // a pulled-up ladder lies on top of its wall
const SWING = Math.PI / 2;         // an open door swings this far
const EASE_RATE = 12;              // per second: door and ladder poses settle in about 0.25 s
const GHOST_OPACITY = 0.45;
const GHOST_OK = 0x7ddc6f;
const GHOST_BAD = 0xdc6f6f;
const POST_SIZE = { x: 0.08, y: 0.6, z: 0.08 };
const POST_COLOUR = 0xe8dcc0;

interface LyingChild { x: number; y: number; z: number }
interface LadderPoses { lean: Placement; lying: Placement }
interface Rec {
  kind: PieceKind;
  root: THREE.Group;                  // placed at the piece (or at the ladder's leaning base)
  prefab: THREE.Group;                // the prefab root; setPrefabDamage target
  pivot: THREE.Group | null;          // doors: the hinge pivot
  ladder: LadderPoses | null;         // ladders: the two poses to ease between
  lyingChild: LyingChild | null;      // ladders: offset of the prefab while lying
  damage: number;
  pose: number;                       // 0 = closed / down, 1 = open / up
  target: number;
}
interface Ghost { kind: PieceKind; root: THREE.Group; mat: THREE.MeshBasicMaterial }

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const wrapAngle = (a: number): number => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

function scaleFor(kind: PieceKind): number { return kind === 'ladder' ? LADDER_SCALE : PREFAB_SCALE; }

function damageFor(piece: Pick<PieceState, 'hp' | 'maxHp'>): number {
  const r = piece.maxHp > 0 ? piece.hp / piece.maxHp : 0;
  return r > 0.66 ? 0 : r > 0.33 ? 1 : 2;
}

function targetFor(piece: PieceState): number {
  if (piece.kind === 'door') return piece.open ? 1 : 0;
  if (piece.kind === 'ladder') return piece.up ? 1 : 0;
  return 0;
}

function setShadows(obj: THREE.Object3D, on: boolean): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = on; o.receiveShadow = on; }
  });
}

function boundsOf(obj: THREE.Object3D): THREE.Box3 {
  obj.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(obj);
}

function buildPiecePrefab(piece: PieceState, level: number): THREE.Group {
  const prefab = buildPrefab(PIECES[piece.kind].prefab, { scale: scaleFor(piece.kind) });
  if (piece.kind === 'barricade' && piece.overDoor) prefab.scale.z *= 0.5;
  if (level > 0) setPrefabDamage(prefab, level);
  setShadows(prefab, true);
  return prefab;
}

function ladderPoses(piece: PieceState, plot: PlotDef): LadderPoses {
  const parsed = parseSlot(piece.slot);
  const axis = parsed && parsed.kind === 'edge' ? parsed.axis : 'x';
  const c = edgeCenter(plot, piece.slot);
  return {
    lean: piecePlacement(plot, piece),
    lying: { x: c.x, y: plot.y + LYING_LIFT, z: c.z, rotY: axis === 'x' ? -Math.PI / 2 : 0 },
  };
}

function createRec(piece: PieceState): Rec {
  const level = damageFor(piece);
  const prefab = buildPiecePrefab(piece, level);
  const root = new THREE.Group();
  root.name = `base-${piece.id}`;
  const rec: Rec = {
    kind: piece.kind, root, prefab, pivot: null, ladder: null, lyingChild: null,
    damage: level, pose: targetFor(piece), target: targetFor(piece),
  };
  if (piece.kind === 'door') {
    // The pivot sits at the hinge; the prefab's -x end sits on the pivot, centred across the wall line.
    const box = boundsOf(prefab);
    prefab.position.set(-box.min.x, 0, -(box.min.z + box.max.z) / 2);
    const pivot = new THREE.Group();
    pivot.add(prefab);
    root.add(pivot);
    rec.pivot = pivot;
  } else {
    root.add(prefab);
  }
  if (piece.kind === 'ladder') {
    // Lying, the ladder's length runs along the wall and its rungs face up; this offset centres it on the edge.
    const box = boundsOf(prefab);
    rec.lyingChild = { x: -(box.min.x + box.max.x) / 2, y: -box.min.z, z: (box.min.y + box.max.y) / 2 };
  }
  return rec;
}

function applyLadder(rec: Rec): void {
  if (!rec.ladder || !rec.lyingChild) return;
  const { lean, lying } = rec.ladder;
  const t = rec.pose;
  rec.root.position.set(lerp(lean.x, lying.x, t), lerp(lean.y, lying.y, t), lerp(lean.z, lying.z, t));
  const diff = wrapAngle(lying.rotY - lean.rotY);
  rec.root.rotation.set(0, lean.rotY + diff * t, 0);
  const lc = rec.lyingChild;
  rec.prefab.rotation.set(lerp(LEAN, -Math.PI / 2, t), 0, 0);
  rec.prefab.position.set(lerp(0, lc.x, t), lerp(0, lc.y, t), lerp(0, lc.z, t));
}

function applyPose(rec: Rec): void {
  if (rec.ladder) applyLadder(rec);
  else if (rec.pivot) rec.pivot.rotation.y = rec.pose * SWING;
}

function placeRec(rec: Rec, piece: PieceState, plot: PlotDef): void {
  if (piece.kind === 'ladder') {
    rec.ladder = ladderPoses(piece, plot);
    applyLadder(rec);
    return;
  }
  const place = piecePlacement(plot, piece);
  rec.root.position.set(place.x, place.y, place.z);
  rec.root.rotation.set(0, place.rotY, 0);
  if (rec.pivot) {
    // The hinge in the piece's own frame: undo the piece's yaw on the offset from its centre to the hinge.
    const h = doorHinge(plot, piece);
    const dx = h.x - place.x, dz = h.z - place.z;
    const c = Math.cos(-place.rotY), s = Math.sin(-place.rotY);
    rec.pivot.position.set(dx * c + dz * s, 0, -dx * s + dz * c);
  }
  applyPose(rec);
}

export function createBaseView(scene: THREE.Scene): BaseView {
  const root = new THREE.Group();
  root.name = 'base-view';
  scene.add(root);

  const recs = new Map<string, Rec>();
  const litIds = new Set<string>();
  let ghost: Ghost | null = null;
  const ghostRoot = new THREE.Group();
  root.add(ghostRoot);

  const postGeo = new THREE.BoxGeometry(POST_SIZE.x, POST_SIZE.y, POST_SIZE.z);
  const postMat = new THREE.MeshStandardMaterial({ color: POST_COLOUR, roughness: 0.8 });
  const plotGroup = new THREE.Group();
  plotGroup.visible = false;
  root.add(plotGroup);
  let plotKey = '';

  const removeRec = (id: string): void => {
    const rec = recs.get(id);
    if (!rec) return;
    rec.root.removeFromParent();
    recs.delete(id);
  };

  const applyLit = (id: string, rec: Rec): void => {
    rec.root.visible = !(rec.kind === 'fire-ring' && litIds.has(id));
  };

  return {
    sync(base) {
      if (!base) {
        for (const id of [...recs.keys()]) removeRec(id);
        return;
      }
      const seen = new Set<string>();
      for (const piece of base.pieces) {
        seen.add(piece.id);
        let rec = recs.get(piece.id);
        if (rec && rec.kind !== piece.kind) {
          removeRec(piece.id);
          rec = undefined;
        }
        if (!rec) {
          rec = createRec(piece);
          root.add(rec.root);
          recs.set(piece.id, rec);
        }
        rec.target = targetFor(piece);
        const level = damageFor(piece);
        if (level !== rec.damage) {
          setPrefabDamage(rec.prefab, level);
          rec.damage = level;
        }
        placeRec(rec, piece, base.plot);
        applyLit(piece.id, rec);
      }
      for (const id of [...recs.keys()]) if (!seen.has(id)) removeRec(id);
    },

    setLit(pieceId, lit) {
      if (lit) litIds.add(pieceId);
      else litIds.delete(pieceId);
      const rec = recs.get(pieceId);
      if (rec) applyLit(pieceId, rec);
    },

    showGhost(kind, plot, aim, ok) {
      if (!kind || !plot || !aim) {
        if (ghost) ghost.root.visible = false;
        return;
      }
      if (!ghost || ghost.kind !== kind) {
        if (ghost) {
          ghostRoot.remove(ghost.root);
          ghost.mat.dispose();
        }
        const prefab = buildPrefab(PIECES[kind].prefab, { scale: scaleFor(kind), lights: false });
        const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: GHOST_OPACITY, depthWrite: false, color: GHOST_OK });
        prefab.traverse((o) => {
          if (o instanceof THREE.Mesh) { o.material = mat; o.castShadow = false; o.receiveShadow = false; }
        });
        if (kind === 'door') {
          // Centred on the wall line, like the closed door it previews.
          const box = boundsOf(prefab);
          prefab.position.set(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
        }
        const g = new THREE.Group();
        g.add(prefab);
        ghostRoot.add(g);
        ghost = { kind, root: g, mat };
      }
      const place = piecePlacement(plot, { kind, slot: aim.slot, side: aim.side, overDoor: false });
      ghost.root.position.set(place.x, place.y, place.z);
      ghost.root.rotation.set(kind === 'ladder' ? LEAN : 0, place.rotY, 0, 'YXZ');
      ghost.mat.color.set(ok ? GHOST_OK : GHOST_BAD);
      ghost.root.visible = true;
    },

    showPlot(plot) {
      if (!plot) {
        plotGroup.visible = false;
        return;
      }
      const key = `${plot.x0},${plot.z0},${plot.y}`;
      if (key !== plotKey) {
        plotKey = key;
        for (const child of [...plotGroup.children]) plotGroup.remove(child);
        const T = PLOT.tiles;
        for (let b = 0; b <= T; b++) {
          for (let a = 0; a <= T; a++) {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(plot.x0 + a * PLOT.tile, plot.y + POST_SIZE.y / 2, plot.z0 + b * PLOT.tile);
            plotGroup.add(post);
          }
        }
      }
      plotGroup.visible = true;
    },

    update(dt) {
      const k = Math.min(1, Math.max(0, dt) * EASE_RATE);
      for (const rec of recs.values()) {
        if (rec.pose === rec.target) continue;
        const d = rec.target - rec.pose;
        rec.pose = Math.abs(d) < 1e-3 ? rec.target : rec.pose + d * k;
        applyPose(rec);
      }
    },
  };
}
