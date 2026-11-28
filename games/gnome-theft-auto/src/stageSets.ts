// Stage set dressing: the prefab props each story/side-quest stage lists in `set` (src/quests/stages.ts), with their
// solid colliders in the world's boxes. Kept out of buildWorld so the golden layout test stays pinned. `?stagesets=0`
// leaves it out, `?stagesets=all` shows every set at once (screenshots, zfight); `?stagemarks` adds buildStageMarks'
// debug shapes.
//
// GR3 (FX05): a story stage's set (quests/stages/story/) is quest-scoped. It is built at game start but only shown, and
// only solid, while its window is open (stageSetWindow): one of its quests is active, or one of their scenes is playing
// (an intro plays before its quest is taken; an outro after it is done). A prop marked `always` is part of the place
// itself and stays; a stage marked `setStays` keeps its set once a quest is done. Permanent traces of a beat go through
// worldChanges/, not through here. Side-quest and region stages keep their sets for good, as before.
import * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { buildStaticCells } from './cull';
import { STAGES, setPropBox, stageSetBoxes } from './quests/stages';
import { STORY_STAGES } from './quests/stages/story';
import type { Stage } from './quests/stages/kit';
import type { QuestDef, QuestSave } from './quests/types';
import { heightAt } from './terrain';
import type { Box } from './types';

/** What the window test reads: the quest engine's journal (quests.getJournal()). */
export interface StageJournal {
  activeId: string | null;
  saves: Record<string, QuestSave>;
}

/** One stage's quest window: the quest ids it belongs to and the scene ids those quests play. */
export interface StageWindow {
  quests: readonly string[];
  scenes: ReadonlySet<string>;
  /** Keep the set once any of its quests is done (a world change keeps it). */
  stays: boolean;
}

/** The story stages (quests/stages/story/), with the usedBy ids other rows added to them. */
export function storyStages(): Stage[] {
  const ids = new Set(STORY_STAGES.map((s) => s.id));
  return STAGES.filter((s) => ids.has(s.id));
}

/** Every string a quest def holds (scene ids among them), for the scene -> quest map. */
function stringsOf(v: unknown, out: Set<string>, depth = 0): void {
  if (depth > 8 || v === null || v === undefined) return;
  if (typeof v === 'string') out.add(v);
  else if (Array.isArray(v)) for (const x of v) stringsOf(x, out, depth + 1);
  else if (typeof v === 'object') for (const x of Object.values(v as Record<string, unknown>)) stringsOf(x, out, depth + 1);
}

/**
 * The windows of the quest-scoped stages (story stages with at least one quest in `usedBy`). A stage whose usedBy names
 * no known quest keeps its set for good (it has no window to open).
 */
export function stageWindows(quests: readonly QuestDef[], stages: readonly Stage[] = storyStages()): Map<string, StageWindow> {
  const byId = new Map(quests.map((q) => [q.id, q] as const));
  const scenesOf = new Map<string, Set<string>>();
  const out = new Map<string, StageWindow>();
  for (const s of stages) {
    const qs = s.usedBy.filter((id) => byId.has(id));
    if (qs.length === 0) continue;
    const scenes = new Set<string>(s.usedBy.filter((id) => !byId.has(id)));
    for (const q of qs) {
      let mine = scenesOf.get(q);
      if (!mine) {
        mine = new Set();
        stringsOf(byId.get(q), mine);
        scenesOf.set(q, mine);
      }
      for (const id of mine) scenes.add(id);
    }
    out.set(s.id, { quests: qs, scenes, stays: !!s.setStays });
  }
  return out;
}

/** Is this window open: a quest of it active, one of its scenes playing, or (setStays) one of its quests done? */
export function windowOpen(w: StageWindow, journal: StageJournal, sceneId: string | null): boolean {
  if (sceneId && w.scenes.has(sceneId)) return true;
  for (const q of w.quests) {
    const st = journal.saves[q]?.state;
    if (journal.activeId === q || st === 'active') return true;
    if (w.stays && st === 'done') return true;
  }
  return false;
}

export interface StageSets {
  /** Every stage set prop built (shown or not). */
  count: number;
  /** The quest-scoped sets' journal source, once the quest engine exists (app.ts). */
  bind(journal: () => StageJournal): void;
  /** A scene starts (its id) or ends (null): its stages' sets show at once. */
  scene(id: string | null): void;
  /** Per frame: re-checks the windows twice a second. */
  update(dt: number): void;
  /** The quest-scoped stage ids shown now (tests, debug). */
  shown(): string[];
}

const CHECK_EVERY = 0.5;

/**
 * Builds every stage's `set` props: the permanent ones (side and region stages, `always` props) in one static batch
 * with their colliders pushed into `boxes`, each quest-scoped story set as its own hidden group whose colliders go into
 * `boxes` only while it is shown. `all`: show every set for good (?stagesets=all).
 */
export function buildStageSets(scene: THREE.Scene, boxes: Box[], quests: readonly QuestDef[] = [], opts: { all?: boolean } = {}): StageSets {
  const windows = opts.all ? new Map<string, StageWindow>() : stageWindows(quests);
  const place = (p: Stage['set'][number]): StaticPrefabPlacement => (
    { id: p.prefab, x: p.at[0], y: heightAt(p.at[0], p.at[1]) + (p.lift ?? 0), z: p.at[1], yaw: p.yaw, scale: p.scale ?? 1 }
  );
  const fixed: StaticPrefabPlacement[] = [];
  const fixedBoxes: Box[] = [];
  const scoped: { id: string; w: StageWindow; group: THREE.Group; boxes: Box[]; on: boolean }[] = [];
  let count = 0;
  for (const s of STAGES) {
    const w = windows.get(s.id);
    const mine: StaticPrefabPlacement[] = [];
    const mineBoxes: Box[] = [];
    for (const p of s.set) {
      count++;
      const box = p.solid ? setPropBox(p) : null;
      if (!w || p.always) {
        fixed.push(place(p));
        if (box) fixedBoxes.push(box);
      } else {
        mine.push(place(p));
        if (box) mineBoxes.push(box);
      }
    }
    if (w && mine.length) {
      const group = buildStaticCells(mine, { lights: false, name: `stage-set:${s.id}` });
      group.visible = false;
      scene.add(group);
      scoped.push({ id: s.id, w, group, boxes: mineBoxes, on: false });
    }
  }
  if (fixed.length) scene.add(buildStaticCells(fixed, { lights: false, name: 'stage-sets' }));
  boxes.push(...fixedBoxes);

  let journal: (() => StageJournal) | null = null;
  let sceneId: string | null = null;
  let acc = CHECK_EVERY;
  const check = (): void => {
    const j = journal?.() ?? { activeId: null, saves: {} };
    for (const s of scoped) {
      const on = windowOpen(s.w, j, sceneId);
      if (on === s.on) continue;
      s.on = on;
      s.group.visible = on;
      if (on) boxes.push(...s.boxes);
      else {
        for (const b of s.boxes) {
          const i = boxes.indexOf(b);
          if (i >= 0) boxes.splice(i, 1);
        }
      }
    }
  };
  return {
    count,
    bind(fn) { journal = fn; check(); },
    scene(id) { sceneId = id; check(); },
    update(dt) {
      acc += dt;
      if (acc < CHECK_EVERY) return;
      acc = 0;
      check();
    },
    shown: () => scoped.filter((s) => s.on).map((s) => s.id),
  };
}

/** No stage sets (?stagesets=0). */
export function noStageSets(): StageSets {
  return { count: 0, bind() {}, scene() {}, update() {}, shown: () => [] };
}

/** Every stage set's colliders, whether shown now or not (keep-outs for scenery placed at build time). */
export { stageSetBoxes };

const LIFT = 0.15;

/** Debug overlay for ?stagemarks: marks, cameras, vehicle marks, walks and paths of every stage. */
export function buildStageMarks(scene: THREE.Scene): THREE.Group {
  void scene;
  const group = new THREE.Group();
  group.name = 'stage-marks';
  const mat = (c: number): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color: c });
  const line = (c: number): THREE.LineBasicMaterial => new THREE.LineBasicMaterial({ color: c });
  const M = { mark: mat(0xffd23f), cam: mat(0x4aa3ff), parked: mat(0xd8342c), 'pull-up': mat(0xf08a24), exit: mat(0xffffff) };
  const L = { cam: line(0x4aa3ff), walk: line(0x3fa34d), path: line(0xff3fb0) };
  const cone = new THREE.ConeGeometry(0.25, 1.6, 8).translate(0, 0.8, 0);
  const arrow = new THREE.BoxGeometry(0.08, 0.08, 0.6).translate(0, 1.2, 0.3);
  const camBox = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const carBox = new THREE.BoxGeometry(1.2, 0.5, 2.2).translate(0, 0.25, 0);
  const ground = (x: number, z: number, up = LIFT): THREE.Vector3 => new THREE.Vector3(x, heightAt(x, z) + up, z);
  /** A polyline following the ground, long segments sampled every 4 m. */
  const trace = (pts: readonly (readonly [number, number])[], loop: boolean, m: THREE.LineBasicMaterial): void => {
    const all = loop && pts.length > 2 ? [...pts, pts[0]] : [...pts];
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < all.length - 1; i++) {
      const [ax, az] = all[i];
      const [bx, bz] = all[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
      for (let k = 0; k < n; k++) out.push(ground(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n));
    }
    if (all.length) out.push(ground(all[all.length - 1][0], all[all.length - 1][1]));
    if (out.length > 1) group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(out), m));
  };
  for (const s of STAGES) {
    for (const m of s.marks) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(cone, M.mark), new THREE.Mesh(arrow, M.mark));
      g.position.copy(ground(m.at[0], m.at[1], m.lift ?? 0));
      g.rotation.y = m.yaw;
      group.add(g);
    }
    for (const c of s.cameras) {
      const from = ground(c.from[0], c.from[2], c.from[1]);
      const box = new THREE.Mesh(camBox, M.cam);
      box.position.copy(from);
      group.add(box);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, ground(c.look[0], c.look[2], c.look[1])]), L.cam));
    }
    for (const v of s.vehicles) {
      const b = new THREE.Mesh(carBox, M[v.role]);
      b.position.copy(ground(v.at[0], v.at[1], 0));
      b.rotation.y = v.yaw;
      group.add(b);
    }
    for (const w of s.walks) trace(w.points, w.loop, L.walk);
    for (const p of s.paths) trace(p.points, false, L.path);
  }
  return group;
}
