// Runs quests: saves progress (localStorage + @lawn/cloudsave), plays giver cutscenes, spawns targets and 3D markers,
// tracks objectives on the HUD, awards Acorns/Kiln-Debt paydown, and triggers radio bulletins.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createCloudSlot, type CloudDeps, type CloudSlot } from '@lawn/cloudsave';
import type { GnomeLook } from '@lawn/gnome';
import { randomTownLook } from '../gnomes';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import type { Blip, Npc, World } from '../types';
import { GIVERS, QUESTS } from './defs';
import { airDropRun, bossCombineRun, choiceRun, surviveDerbyRun } from './objectivesAction';
import { chaseFollowRun, convoyAmbushRun, stealDeliverRun } from './objectivesDrive';
import { tessieBuoysRun, tessieSightingsRun } from './objectivesTessie';
import { tessieEscortRun, tessieRideRun } from './objectivesTessieEscort';
import { checkUnlock, ensureBeat } from './tessieUnlock';
import { MAIN_COLOR, OBJECTIVE_COLOR, sideColor, unlockedSideIds, unlockMet } from './unlocks';
import { TESSIE } from '../config';
import type { CutsceneRequest, GiverDef, ObjectiveDef, QuestDef, QuestDeps, QuestSave, Run, TargetDef } from './types';

export type { QuestDeps, Run };

export const SAVE_KEY = 'gta-quests-v1';
export const SYNC_KEY = 'gta-quests.cloud.v1';
const TARGET_COLOR = '#ff7a00';
/** A target runs when the player gets this close. */
const SPOOK_DISTANCE = 16;
const SPOOK_COOLDOWN = 5;
/** How near the player must stand to a giver to use it. */
const GIVER_RANGE = 4.2;
/** What a target wears under the colours its definition sets, so its poster and its body always match. */
const TARGET_BASE: GnomeLook = {
  hat: 0xffd23f, shirt: 0x5b4636, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

export interface JournalSnapshot {
  activeId: string | null;
  activeStep: number;
  activeLines: string[];
  saves: Record<string, QuestSave>;
  quests: readonly QuestDef[];
  givers: Record<string, GiverDef>;
  /** The giver id pinned as the waypoint from the journal, or null. */
  pinned: string | null;
}

/** The point the HUD routes to (see Quests.waypoint). */
export interface Waypoint { x: number; z: number; color: string; label: string }

export interface Quests {
  update(dt: number, px: number, pz: number): void;
  blips(): Blip[];
  /** A one-line hint about where to find a waiting contract, or null when there is none. */
  hint(): string | null;
  /** The prompt label of a giver within reach of (x, z), or null. */
  prompt(x: number, z: number): string | null;
  /** Distance to the nearest waiting giver, or Infinity. */
  giverDist?(x: number, z: number): number;
  /** Use the giver within reach of (x, z). Returns true if there was one. */
  interact(x: number, z: number): boolean;
  /** main calls this for every pedestrian the player cracks. */
  onCracked(npc: Npc): void;
  /** Quest Journal snapshot & controls. */
  getJournal(): JournalSnapshot;
  abandonActive(): boolean;
  restartActive(): boolean;
  /**
   * Where the HUD route goes: the active quest's objective blip nearest the player (orange), else the giver pinned with
   * pinGiver while it still has a quest waiting (its marker colour), else null.
   */
  waypoint(): Waypoint | null;
  /** Pin a giver as the waypoint (the journal's Available tab), or null to clear. Not saved. */
  pinGiver(id: string | null): void;
}

type Maker = (obj: never, deps: QuestDeps, save: QuestSave, changed: () => void, say: (t: string) => void) => Run;

const nearestWalk = (world: World, x: number, z: number): { x: number; z: number } => {
  let best = { x, z };
  let bd = Infinity;
  for (const p of world.walkPoints) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
};

/** A spinning gold marker over a target's head. */
function makeMarker(): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffd23f }),
  );
  m.rotation.x = Math.PI;
  m.position.y = 2.3;
  return m;
}

/** A glowing 3D ground ring at a quest giver. */
function makeGiverRing(): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.0, 28),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide, transparent: true, opacity: 0.65, depthWrite: false }), LAYER.marker),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  return m;
}

/** A floating letter sprite ('D', 'P', 'T', 'G', 'B', '!', '?') above a quest giver, in `color`. */
function makeLetterBadge(letter: string, color = '#ffd23f'): THREE.Sprite | THREE.Mesh {
  if (typeof document === 'undefined') {
    return new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), new THREE.MeshBasicMaterial({ color }));
  }
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(18, 20, 26, 0.85)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.slice(0, 1).toUpperCase(), 32, 34);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(1.2, 1.2, 1);
  return sprite;
}

const crackRun = (obj: Extract<ObjectiveDef, { kind: 'crack' }>, deps: QuestDeps, save: QuestSave, changed: () => void, say: (t: string) => void): Run => {
  const cracked = new Set(save.cracked);
  const live = new Map<string, { npc: Npc; def: TargetDef; marker: THREE.Mesh; cool: number }>();
  for (const def of obj.targets) {
    if (cracked.has(def.id)) continue;
    const p = nearestWalk(deps.world, def.near[0], def.near[1]);
    const look: GnomeLook = { ...TARGET_BASE, ...(def.look ?? {}), ...(def.look ? {} : randomTownLook()) };
    const npc = deps.npcs.spawnNamed(def.name, p.x, p.z, look, def.id);
    const marker = makeMarker();
    npc.model.object.add(marker);
    live.set(def.id, { npc, def, marker, cool: 0 });
  }
  let t = 0;
  return {
    lines: () => {
      const out = obj.targets
        .filter((d) => !cracked.has(d.id))
        .map((d) => 'Crack {{' + d.name + '}}, last seen in {{' + d.hint + '}}.');
      if (cracked.size > 0) out.push(`${cracked.size} of ${obj.targets.length} cracked.`);
      return out;
    },
    done: () => obj.targets.every((d) => cracked.has(d.id)),
    update(dt, px, pz) {
      t += dt;
      for (const e of live.values()) {
        e.marker.rotation.y = t * 2.5;
        e.marker.position.y = 2.3 + Math.sin(t * 3) * 0.14;
        e.cool = Math.max(0, e.cool - dt);
        if (e.cool <= 0 && e.npc.state !== 'flee' && e.npc.state !== 'ragdoll' && Math.hypot(e.npc.x - px, e.npc.z - pz) < SPOOK_DISTANCE) {
          deps.npcs.scare(e.npc, px, pz);
          e.cool = SPOOK_COOLDOWN;
        }
      }
    },
    onCracked(npc) {
      if (!npc.quest) return;
      const e = live.get(npc.quest);
      if (!e) return;
      live.delete(npc.quest);
      cracked.add(e.def.id);
      save.cracked = [...cracked];
      say(`${e.def.name} cracked (${cracked.size}/${obj.targets.length})`);
      changed();
    },
    blips: () => [...live.values()].map((e) => ({ x: e.npc.x, z: e.npc.z, color: TARGET_COLOR, quest: e.def.name })),
    cracked: () => [...cracked],
    cleanup() {
      for (const e of live.values()) {
        e.npc.model.object.remove(e.marker);
        const i = deps.npcs.list.indexOf(e.npc);
        if (i >= 0) {
          deps.scene.remove(e.npc.model.object);
          deps.npcs.list.splice(i, 1);
        }
      }
      live.clear();
    },
  };
};

interface HoseVisual {
  group: THREE.Group;
  leftSeg: THREE.Mesh;
  rightSeg: THREE.Mesh;
  bulge: THREE.Mesh;
  valve: THREE.Mesh;
}

function buildHoseVisual(scene: THREE.Scene, x: number, z: number): HoseVisual {
  const group = new THREE.Group();
  group.position.set(x, heightAt(x, z), z);

  const hoseMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });
  const brassMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
  const redMat = new THREE.MeshLambertMaterial({ color: 0xe63946 });

  const segGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8);
  segGeo.rotateZ(Math.PI / 2);

  const leftSeg = new THREE.Mesh(segGeo, hoseMat);
  leftSeg.position.set(-1.1, 0.14, 0);
  const rightSeg = new THREE.Mesh(segGeo, hoseMat);
  rightSeg.position.set(1.1, 0.14, 0);

  const bulge = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), hoseMat);
  bulge.position.set(-0.25, 0.18, 0);

  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), redMat);
  valve.position.set(0, 0.52, 0);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.44, 8), brassMat);
  stem.position.set(0, 0.26, 0);

  group.add(leftSeg, rightSeg, bulge, stem, valve);
  scene.add(group);
  return { group, leftSeg, rightSeg, bulge, valve };
}

const visitRun = (obj: Extract<ObjectiveDef, { kind: 'visit' }>, deps: QuestDeps, _save: QuestSave, _changed: () => void, say: (t: string) => void): Run => {
  let reached = false;
  let t = 0;
  let mistTimer = 0;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.8, 3.4, 28),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false }), LAYER.marker),
  );
  ring.rotation.x = -Math.PI / 2;
  placeOnGround(ring, obj.at[0], obj.at[1], 0.08, true);
  deps.scene.add(ring);

  const hose = obj.prop === 'hose' ? buildHoseVisual(deps.scene, obj.at[0], obj.at[1]) : null;
  let hoseKinked = false;

  return {
    lines: () => [obj.text],
    done: () => reached,
    update(dt, px, pz) {
      t += dt;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.25 * Math.sin(t * 4);
      if (hose && !reached) {
        hose.valve.rotation.y += dt * 1.4;
        const pulse = 1 + Math.sin(t * 8) * 0.16;
        hose.bulge.scale.set(pulse, pulse, pulse);
        mistTimer -= dt;
        if (mistTimer <= 0) {
          mistTimer = 0.28;
          deps.fx?.waterJet?.(obj.at[0], 0.45, obj.at[1]);
        }
      }
      if (!reached && Math.hypot(px - obj.at[0], pz - obj.at[1]) <= obj.radius) {
        reached = true;
        if (hose) {
          hoseKinked = true;
          // Visibly bend both hose halves upward into a tight V-kink and swell the pressurized bulge.
          hose.leftSeg.rotation.z = -0.85;
          hose.leftSeg.position.set(-0.72, 0.78, 0);
          hose.rightSeg.rotation.z = 0.85;
          hose.rightSeg.position.set(0.72, 0.78, 0);
          hose.bulge.scale.set(2.1, 1.9, 2.1);
          hose.bulge.position.set(-0.45, 0.45, 0);
          hose.valve.rotation.z = 0.5;
          deps.fx?.waterJet?.(obj.at[0], 0.6, obj.at[1]);
          deps.fx?.confetti?.(obj.at[0], 0.7, obj.at[1]);
          deps.play('splash');
          const lingering = hose.group;
          setTimeout(() => deps.scene.remove(lingering), 3500);
        }
        if (obj.heatOnEnter) deps.watch?.addHeat(obj.heatOnEnter);
        if (obj.toastOnEnter) say(obj.toastOnEnter);
      }
    },
    onCracked() {},
    blips: () => (reached ? [] : [{ x: obj.at[0], z: obj.at[1], color: TARGET_COLOR, quest: obj.hint }]),
    cracked: () => [],
    cleanup() {
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      if (hose && !hoseKinked) deps.scene.remove(hose.group);
    },
  };
};

/** The objective kinds. A new kind is one entry here. */
const OBJECTIVE_KINDS: Record<ObjectiveDef['kind'], Maker> = {
  crack: crackRun as unknown as Maker,
  visit: visitRun as unknown as Maker,
  'steal-deliver': ((obj: Extract<ObjectiveDef, { kind: 'steal-deliver' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    stealDeliverRun(obj, deps, changed, say)) as unknown as Maker,
  'chase-follow': ((obj: Extract<ObjectiveDef, { kind: 'chase-follow' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    chaseFollowRun(obj, deps, changed, say)) as unknown as Maker,
  'convoy-ambush': ((obj: Extract<ObjectiveDef, { kind: 'convoy-ambush' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    convoyAmbushRun(obj, deps, changed, say)) as unknown as Maker,
  'air-drop': ((obj: Extract<ObjectiveDef, { kind: 'air-drop' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    airDropRun(obj, deps, changed, say)) as unknown as Maker,
  'survive-derby': ((obj: Extract<ObjectiveDef, { kind: 'survive-derby' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    surviveDerbyRun(obj, deps, changed, say)) as unknown as Maker,
  'boss-combine': ((obj: Extract<ObjectiveDef, { kind: 'boss-combine' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    bossCombineRun(obj, deps, changed, say)) as unknown as Maker,
  choice: ((obj: Extract<ObjectiveDef, { kind: 'choice' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    choiceRun(obj, deps, changed, say)) as unknown as Maker,
  'tessie-sightings': ((obj: Extract<ObjectiveDef, { kind: 'tessie-sightings' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    tessieSightingsRun(obj, deps, changed, say)) as unknown as Maker,
  'tessie-buoys': ((obj: Extract<ObjectiveDef, { kind: 'tessie-buoys' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    tessieBuoysRun(obj, deps, changed, say)) as unknown as Maker,
  'tessie-escort': ((obj: Extract<ObjectiveDef, { kind: 'tessie-escort' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    tessieEscortRun(obj, deps, changed, say)) as unknown as Maker,
  'tessie-ride': ((obj: Extract<ObjectiveDef, { kind: 'tessie-ride' }>, deps: QuestDeps, _save: QuestSave, changed: () => void, say: (t: string) => void) =>
    tessieRideRun(obj, deps, changed, say)) as unknown as Maker,
};

// ---- Pure helpers & Cloud Save ---------------------------------------------------------------------------------------

export function isQuestAvailable(q: QuestDef, saves: Record<string, QuestSave>): boolean {
  if (saves[q.id]) return false;
  if (!unlockMet(q.id, saves)) return false;
  if (!q.prereq) return true;
  return saves[q.prereq]?.state === 'done';
}

/** A story quest (it has a chapter) marks its giver 'main'; every other quest is a 'side' job. */
export function markerKind(q: QuestDef): 'main' | 'side' {
  return q.chapter !== undefined ? 'main' : 'side';
}

function parseSavesJson(raw: string | null): Record<string, QuestSave> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, QuestSave>) : {};
  } catch {
    return {};
  }
}

export function mergeQuestSaves(local: string | null, remote: string): string {
  const a = parseSavesJson(local);
  const b = parseSavesJson(remote);
  const out: Record<string, QuestSave> = {};
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) {
    const sa = a[id];
    const sb = b[id];
    if (!sa) { out[id] = sb; continue; }
    if (!sb) { out[id] = sa; continue; }
    const state: 'active' | 'done' = sa.state === 'done' || sb.state === 'done' ? 'done' : 'active';
    const step = state === 'done' ? Math.max(sa.step ?? 0, sb.step ?? 0) : Math.max(sa.step ?? 0, sb.step ?? 0);
    const cracked = [...new Set([...(sa.cracked ?? []), ...(sb.cracked ?? [])])];
    out[id] = { state, step, cracked };
    // The Tessie trigger beat (tessieUnlock.ts): this device's roll wins, so the beat never changes under the player.
    const beat = sa.beat ?? sb.beat;
    if (beat) out[id].beat = beat;
  }
  return JSON.stringify(out);
}

export function summarizeQuestSaves(text: string): string {
  const s = parseSavesJson(text);
  const done = Object.entries(s).filter(([id, v]) => id !== TESSIE.unlockKey && v.state === 'done').length;
  return `${done} quest${done === 1 ? '' : 's'} done`;
}

export function createQuestCloudSlot(deps?: Partial<CloudDeps>): CloudSlot {
  // TODO(platform): Add Game.GNOME_THEFT_AUTO to proto/gnome/common/v1/common.proto and switch `game` from
  // 'ARCADE' (reserved for @lawn/achievements) to 'GNOME_THEFT_AUTO', then remove the signedIn: () => false guard.
  return createCloudSlot({
    game: 'ARCADE',
    saveKey: SAVE_KEY,
    syncKey: SYNC_KEY,
    summarize: summarizeQuestSaves,
    mode: 'merge',
    merge: mergeQuestSaves,
    deps: { signedIn: () => false, ...deps },
  });
}

// ---- Local Save ------------------------------------------------------------------------------------------------------
function loadSaves(): Record<string, QuestSave> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return parseSavesJson(raw);
  } catch {
    return {};
  }
}
function storeSaves(s: Record<string, QuestSave>): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* private window or blocked storage: progress just is not remembered */
  }
}

export function createQuests(
  deps: QuestDeps,
  questList: readonly QuestDef[] = QUESTS,
  giversMap: Record<string, GiverDef> = GIVERS,
): Quests {
  const cloudSlot = createQuestCloudSlot();
  void cloudSlot.syncAtStartup();

  const saves = loadSaves();
  let activeId: string | null = null;

  /** The Tessie side quest: roll its trigger beat once the story starts, and unlock it when the beat is reached. */
  function tessieCheck(force = false, check = true): void {
    let dirty = ensureBeat(saves, Math.random, force);
    const unlocked = check || force ? checkUnlock(saves, force) : false;
    dirty ||= unlocked;
    if (!dirty) return;
    storeSaves(saves);
    cloudSlot.pushSave();
    if (unlocked) deps.onTessieUnlock?.();
  }
  let run: Run | null = null;
  let hideTrackerIn = 0;
  /** Runners whose lines depend on the moment (in a boat or not, near or far) are re-read this often, seconds. */
  let trackerRefreshT = 0;
  let lastLines = '';

  let clockT = 0;
  /** One giver's 3D marker parts. `kind` is the colour they were last set to. */
  interface GiverMarks {
    g: GiverDef;
    beam: THREE.Mesh;
    star: THREE.Mesh;
    ring: THREE.Mesh;
    main: THREE.Object3D;
    side: THREE.Object3D;
    kind?: 'main' | 'side';
  }
  const marks = new Map<string, GiverMarks>();
  for (const g of Object.values(giversMap)) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 90, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: MAIN_COLOR, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    beam.position.set(g.x, heightAt(g.x, g.z) + 45, g.z);
    deps.scene.add(beam);

    const star = makeMarker();
    star.scale.setScalar(1.5);
    star.position.set(g.x, heightAt(g.x, g.z) + 4, g.z);
    deps.scene.add(star);

    const ring = makeGiverRing();
    placeOnGround(ring, g.x, g.z, 0.06, true);
    deps.scene.add(ring);

    const main = makeLetterBadge(g.letter ?? g.name[0] ?? '!', MAIN_COLOR);
    const side = makeLetterBadge('?', sideColor(g.id));
    for (const b of [main, side]) {
      b.position.set(g.x, heightAt(g.x, g.z) + 2.7, g.z);
      deps.scene.add(b);
    }
    marks.set(g.id, { g, beam, star, ring, main, side });
  }

  const waitingAt = (id: string): boolean => activeId === null && questList.some((qd) => qd.giver === id && isQuestAvailable(qd, saves));
  /** The kind of the quest a giver offers next (the one interact() plays). */
  const giverKind = (id: string): 'main' | 'side' => {
    const next = questList.find((qd) => qd.giver === id && isQuestAvailable(qd, saves));
    return next ? markerKind(next) : 'side';
  };
  const giverColor = (id: string): string => (giverKind(id) === 'main' ? MAIN_COLOR : sideColor(id));

  // Unlock notices: side quests that open after this load, queued one by one (see noticeUnlocks).
  const known = new Set<string>();
  const notices: { id: string; t: number }[] = [];
  let lastPx = 0;
  let lastPz = 0;
  let pinned: string | null = null;
  const quest = (id: string): QuestDef | undefined => questList.find((q) => q.id === id);
  const giverOf = (x: number, z: number): GiverDef | null => {
    for (const g of Object.values(giversMap)) if (waitingAt(g.id) && Math.hypot(g.x - x, g.z - z) <= GIVER_RANGE) return g;
    return null;
  };

  function refreshTracker(): void {
    const q = activeId ? quest(activeId) : null;
    if (!q || !run) return;
    const lines = run.lines();
    lastLines = lines.join('|');
    deps.hud.setObjective({ title: q.title, lines, demo: !!q.demo });
  }

  function startStep(q: QuestDef): void {
    run?.cleanup();
    const save = saves[q.id];
    const obj = q.objectives[save.step];
    const maker = OBJECTIVE_KINDS[obj.kind];
    run = maker(
      obj as never,
      deps,
      save,
      () => {
        storeSaves(saves);
        cloudSlot.pushSave();
        refreshTracker();
        stepCheck(q);
      },
      (t) => deps.hud.toast(t, 3200),
    );
    refreshTracker();
  }

  /** After progress: go on to the next objective, or finish the quest. */
  function stepCheck(q: QuestDef): void {
    if (!run || !run.done()) return;
    const save = saves[q.id];
    save.step++;
    save.cracked = [];
    if (save.step < q.objectives.length) {
      storeSaves(saves);
      cloudSlot.pushSave();
      tessieCheck();
      noticeUnlocks();
      startStep(q);
      deps.hud.toast('Next: ' + q.objectives[save.step].text, 3500);
      return;
    }
    run.cleanup();
    run = null;
    activeId = null;
    save.state = 'done';
    storeSaves(saves);
    cloudSlot.pushSave();
    tessieCheck();
    noticeUnlocks();

    const reward = q.rewardAcorns ?? 250;
    deps.economy?.earn(reward, `Quest: ${q.title}`);
    if ((q.chapter === 1 || q.chapter === 2 || q.id === 'first-contract') && deps.economy) {
      const debtLeft = deps.economy.state().debtRemaining;
      if (debtLeft > 0) {
        deps.economy.payDebt(Math.min(reward, debtLeft));
      }
    }
    deps.onRadioBulletin?.(q.radioBulletin ?? q.id);

    deps.hud.banner('CONTRACT COMPLETE', 3500);
    deps.hud.toast(q.doneText, 9000);
    deps.play('steal');
    if (q.achievement) deps.unlock(q.achievement);
    deps.hud.setObjective({
      title: q.title,
      lines: ['Complete.', q.demo ? 'This is a demo: more contracts are coming. Come back to it!' : ''].filter(Boolean),
      demo: !!q.demo,
    });
    hideTrackerIn = 14;
  }

  function activate(q: QuestDef): void {
    pinned = null;
    saves[q.id] = { state: 'active', step: 0, cracked: [] };
    storeSaves(saves);
    cloudSlot.pushSave();
    tessieCheck();
    activeId = q.id;
    startStep(q);
  }

  // The table beat (unlocks.ts) and an old save's rolled beat unlock Tessie at once; `?tessie=now` forces it.
  tessieCheck(!!deps.tessieNow, true);
  // What is already open at load gets no notice.
  for (const id of unlockedSideIds(saves)) known.add(id);

  /** Queue a notice for each side quest that just opened (not Tessie, which has onTessieUnlock). The first is 4.5 s out, each next 3 s after the previous. */
  function noticeUnlocks(): void {
    for (const id of unlockedSideIds(saves)) {
      if (known.has(id)) continue;
      known.add(id);
      if (id === TESSIE.questId || !quest(id)) continue;
      const last = notices[notices.length - 1];
      notices.push({ id, t: last ? last.t + 3 : 4.5 });
    }
  }

  for (const q of questList) {
    if (saves[q.id]?.state === 'active') {
      activeId = q.id;
      startStep(q);
      break;
    }
  }

  function requestFor(q: QuestDef): CutsceneRequest {
    const giverRoom = giversMap[q.giver]?.room ?? 'mulch-club';
    if (q.cutscene?.kind === 'dialogue') {
      return {
        kind: 'dialogue',
        room: q.cutscene.room ?? giverRoom,
        lines: q.cutscene.lines,
        titleCard: q.cutscene.titleCard ?? q.title,
      };
    }
    const targets: { name: string; look: GnomeLook }[] = [];
    for (const o of q.objectives) {
      if (o.kind === 'crack') {
        for (const t of o.targets) targets.push({ name: t.name, look: { ...TARGET_BASE, ...(t.look ?? {}) } });
      }
    }
    return { kind: 'contract', room: giverRoom, targets };
  }

  return {
    update(dt, px, pz) {
      clockT += dt;
      lastPx = px;
      lastPz = pz;
      for (const n of notices) n.t -= dt;
      while (notices.length > 0 && notices[0].t <= 0) {
        const n = notices.shift()!;
        const q = quest(n.id);
        if (q) deps.onSideUnlock?.(q, giversMap[q.giver]);
      }
      for (const m of marks.values()) {
        const waiting = waitingAt(m.g.id);
        const kind = giverKind(m.g.id);
        if (m.kind !== kind) {
          m.kind = kind;
          const hex = kind === 'main' ? MAIN_COLOR : sideColor(m.g.id);
          (m.beam.material as THREE.MeshBasicMaterial).color.set(hex);
          (m.star.material as THREE.MeshBasicMaterial).color.set(hex);
          (m.ring.material as THREE.MeshBasicMaterial).color.set(hex);
        }
        m.beam.visible = waiting;
        (m.beam.material as THREE.MeshBasicMaterial).opacity = 0.28 + 0.12 * Math.sin(clockT * 2);
        m.star.visible = waiting;
        m.star.rotation.y = clockT * 1.8;
        m.star.position.y = heightAt(m.g.x, m.g.z) + 4 + Math.sin(clockT * 2.5) * 0.25;
        m.ring.visible = waiting;
        (m.ring.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.25 * Math.sin(clockT * 3);
        const bob = heightAt(m.g.x, m.g.z) + 2.7 + Math.sin(clockT * 2.5) * 0.18;
        m.main.visible = waiting && kind === 'main';
        m.main.position.y = bob;
        m.side.visible = waiting && kind === 'side';
        m.side.position.y = bob;
      }
      run?.update(dt, px, pz);
      trackerRefreshT -= dt;
      if (run && trackerRefreshT <= 0) {
        trackerRefreshT = 0.5;
        if (run.lines().join('|') !== lastLines) refreshTracker();
      }
      if (run && activeId) {
        const q = quest(activeId);
        if (q) stepCheck(q);
      }
      if (hideTrackerIn > 0) {
        hideTrackerIn -= dt;
        if (hideTrackerIn <= 0) deps.hud.setObjective(null);
      }
    },

    blips() {
      const out: Blip[] = [];
      for (const g of Object.values(giversMap)) {
        if (!waitingAt(g.id)) continue;
        const kind = giverKind(g.id);
        out.push({ x: g.x, z: g.z, color: kind === 'main' ? MAIN_COLOR : sideColor(g.id), quest: g.name, kind });
      }
      if (run) out.push(...run.blips().map((b) => ({ ...b, kind: 'objective' as const })));
      return out;
    },

    hint() {
      const waiting = Object.values(giversMap).filter((g) => waitingAt(g.id));
      const main = waiting.find((g) => giverKind(g.id) === 'main');
      if (main) return `A contract is waiting at ${main.name}.`;
      if (waiting.length > 0) return `A side job is waiting at ${waiting[0].name}.`;
      return null;
    },

    prompt(x, z) {
      const g = giverOf(x, z);
      return g ? g.label : null;
    },

    giverDist(x, z) {
      const g = giverOf(x, z);
      return g ? Math.hypot(g.x - x, g.z - z) : Infinity;
    },

    interact(x, z) {
      if (deps.cutscene.active) return false;
      if (activeId !== null) {
        for (const g of Object.values(giversMap)) {
          if (Math.hypot(g.x - x, g.z - z) <= GIVER_RANGE) {
            const cur = quest(activeId);
            deps.hud.toast(`Finish or abandon "${cur?.title ?? activeId}" in the Quest Journal (J) first!`, 4000);
            return true;
          }
        }
        return false;
      }
      const g = giverOf(x, z);
      if (!g) return false;
      const mine = questList.filter((q) => q.giver === g.id);
      const next = mine.find((q) => isQuestAvailable(q, saves));
      if (!next) {
        deps.hud.toast('No more work here right now. Check back later!', 5000);
        return true;
      }
      deps.cutscene.play(requestFor(next), () => {
        deps.placePlayer(g.exit.x, g.exit.z, g.exit.yaw);
        activate(next);
        deps.hud.banner('NEW CONTRACT', 3000);
        deps.play('whistle');
      });
      return true;
    },

    onCracked(npc) {
      run?.onCracked(npc);
    },

    getJournal() {
      return {
        activeId,
        activeStep: activeId ? (saves[activeId]?.step ?? 0) : 0,
        activeLines: run ? run.lines() : [],
        saves: { ...saves },
        quests: questList,
        givers: giversMap,
        pinned,
      };
    },

    abandonActive() {
      if (!activeId) return false;
      run?.cleanup();
      run = null;
      delete saves[activeId];
      activeId = null;
      storeSaves(saves);
      cloudSlot.pushSave();
      deps.hud.setObjective(null);
      deps.hud.toast('Quest abandoned.', 3000);
      return true;
    },

    restartActive() {
      if (!activeId) return false;
      const q = quest(activeId);
      if (!q || !saves[activeId]) return false;
      saves[activeId].cracked = [];
      storeSaves(saves);
      cloudSlot.pushSave();
      startStep(q);
      deps.hud.toast('Objective step restarted.', 3000);
      return true;
    },

    waypoint() {
      if (run) {
        let best: Blip | null = null;
        let bd = Infinity;
        for (const b of run.blips()) {
          const d = Math.hypot(b.x - lastPx, b.z - lastPz);
          if (d < bd) { bd = d; best = b; }
        }
        if (!best) return null;
        const title = activeId ? (quest(activeId)?.title ?? '') : '';
        return { x: best.x, z: best.z, color: OBJECTIVE_COLOR, label: best.quest ?? title };
      }
      if (pinned) {
        const g = giversMap[pinned] as GiverDef | undefined;
        if (!g || !waitingAt(pinned)) {
          pinned = null;
          return null;
        }
        return { x: g.x, z: g.z, color: giverColor(g.id), label: g.name };
      }
      return null;
    },

    pinGiver(id) {
      pinned = id;
    },
  };
}
