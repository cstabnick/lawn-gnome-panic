// Runs quests: saves progress, plays the giver's cutscene, spawns targets and markers, tracks objectives on the HUD and
// finishes quests. It knows nothing about any one quest: everything comes from QuestDef data (defs.ts). To add an
// objective kind, add an entry to OBJECTIVE_KINDS below and a variant to ObjectiveDef in types.ts.
import * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { Blip, Hud, Npc, Npcs, World } from '../types';
import { randomTownLook } from '../gnomes';
import type { Cutscene } from './cutscene';
import { GIVERS, QUESTS } from './defs';
import type { GiverDef, ObjectiveDef, QuestDef, QuestSave, TargetDef } from './types';

const SAVE_KEY = 'gta-quests-v1';
const TARGET_COLOR = '#ff7a00';
const GIVER_COLOR = '#ffffff';
/** A target runs when the player gets this close. */
const SPOOK_DISTANCE = 16;
const SPOOK_COOLDOWN = 5;
/** How near the player must stand to a giver to use it. */
const GIVER_RANGE = 6;
/** What a target wears under the colours its definition sets, so its poster and its body always match. */
const TARGET_BASE: GnomeLook = {
  hat: 0xffd23f, shirt: 0x5b4636, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

export interface QuestDeps {
  scene: THREE.Scene;
  world: World;
  npcs: Npcs;
  hud: Hud;
  cutscene: Cutscene;
  /** Put the player (on foot) back in the world at the giver's exit. */
  placePlayer(x: number, z: number, yaw: number): void;
  unlock(achievementId: string): void;
  play(sfx: 'steal' | 'alarm' | 'whistle'): void;
}

export interface Quests {
  update(dt: number, px: number, pz: number): void;
  blips(): Blip[];
  /** The prompt label of a giver within reach of (x, z), or null. */
  prompt(x: number, z: number): string | null;
  /** Use the giver within reach of (x, z). Returns true if there was one. */
  interact(x: number, z: number): boolean;
  /** main calls this for every pedestrian the player cracks. */
  onCracked(npc: Npc): void;
}

/** One running objective. */
interface Run {
  lines(): string[];
  done(): boolean;
  update(dt: number, px: number, pz: number): void;
  onCracked(npc: Npc): void;
  blips(): Blip[];
  /** Target ids cracked so far (saved). */
  cracked(): string[];
  cleanup(): void;
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

const crackRun = (obj: Extract<ObjectiveDef, { kind: 'crack' }>, deps: QuestDeps, save: QuestSave, changed: () => void, say: (t: string) => void): Run => {
  const cracked = new Set(save.cracked);
  const live = new Map<string, { npc: Npc; def: TargetDef; marker: THREE.Mesh; cool: number }>();
  for (const def of obj.targets) {
    if (cracked.has(def.id)) continue;
    const p = nearestWalk(deps.world, def.near[0], def.near[1]);
    const look: GnomeLook = { ...TARGET_BASE, ...(def.look ?? {}) };
    const npc = deps.npcs.spawnNamed(def.name, p.x, p.z, look, def.id);
    const marker = makeMarker();
    npc.model.object.add(marker);
    live.set(def.id, { npc, def, marker, cool: 0 });
  }
  let t = 0;
  return {
    lines: () => [obj.text, ...obj.targets.map((d) => `${cracked.has(d.id) ? '☑' : '☐'} ${d.name} (${d.hint})`)],
    done: () => obj.targets.every((d) => cracked.has(d.id)),
    update(dt, px, pz) {
      t += dt;
      for (const e of live.values()) {
        e.marker.rotation.y = t * 2.5;
        e.marker.position.y = 2.3 + Math.sin(t * 3) * 0.08;
        e.cool = Math.max(0, e.cool - dt);
        // A target that notices the player runs.
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
    blips: () => [...live.values()].map((e) => ({ x: e.npc.x, z: e.npc.z, color: TARGET_COLOR })),
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

const visitRun = (obj: Extract<ObjectiveDef, { kind: 'visit' }>): Run => {
  let reached = false;
  return {
    lines: () => [obj.text, `${reached ? '☑' : '☐'} ${obj.hint}`],
    done: () => reached,
    update(_dt, px, pz) {
      if (Math.hypot(px - obj.at[0], pz - obj.at[1]) <= obj.radius) reached = true;
    },
    onCracked() {},
    blips: () => (reached ? [] : [{ x: obj.at[0], z: obj.at[1], color: TARGET_COLOR }]),
    cracked: () => [],
    cleanup() {},
  };
};

/** The objective kinds. A new kind is one entry here. */
const OBJECTIVE_KINDS: Record<ObjectiveDef['kind'], Maker> = {
  crack: crackRun as unknown as Maker,
  visit: ((obj: Extract<ObjectiveDef, { kind: 'visit' }>) => visitRun(obj)) as unknown as Maker,
};

// ---- Save ------------------------------------------------------------------------------------------------------------
function loadSaves(): Record<string, QuestSave> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, QuestSave>) : {};
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

export function createQuests(deps: QuestDeps): Quests {
  const saves = loadSaves();
  let activeId: string | null = null;
  let run: Run | null = null;
  let hideTrackerIn = 0;

  const quest = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);
  const giverOf = (x: number, z: number): GiverDef | null => {
    for (const g of Object.values(GIVERS)) if (Math.hypot(g.x - x, g.z - z) <= GIVER_RANGE) return g;
    return null;
  };

  function refreshTracker(): void {
    const q = activeId ? quest(activeId) : null;
    if (!q || !run) return;
    deps.hud.setObjective({ title: q.title, lines: run.lines(), demo: !!q.demo });
  }

  function startStep(q: QuestDef): void {
    run?.cleanup();
    const save = saves[q.id];
    const obj = q.objectives[save.step];
    const maker = OBJECTIVE_KINDS[obj.kind];
    run = maker(obj as never, deps, save, () => { storeSaves(saves); refreshTracker(); stepCheck(q); }, (t) => deps.hud.toast(t, 3200));
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
      startStep(q);
      deps.hud.toast('Next: ' + q.objectives[save.step].text, 3500);
      return;
    }
    run.cleanup();
    run = null;
    activeId = null;
    save.state = 'done';
    storeSaves(saves);
    deps.hud.banner('CONTRACT COMPLETE', 3500);
    deps.hud.toast(q.doneText, 9000);
    deps.play('steal');
    if (q.achievement) deps.unlock(q.achievement);
    deps.hud.setObjective({
      title: q.title, lines: ['Complete.', q.demo ? 'This is a demo: more contracts are coming. Come back to it!' : ''].filter(Boolean), demo: !!q.demo,
    });
    hideTrackerIn = 14;
  }

  function activate(q: QuestDef): void {
    saves[q.id] = { state: 'active', step: 0, cracked: [] };
    storeSaves(saves);
    activeId = q.id;
    startStep(q);
  }

  // Resume a quest that was active when the game was last closed.
  for (const q of QUESTS) {
    if (saves[q.id]?.state === 'active') {
      activeId = q.id;
      // Spawning waits for the world to have walk points, which it does by now.
      startStep(q);
      break;
    }
  }

  function requestFor(q: QuestDef): { room: 'mulch-club'; targets: { name: string; look: GnomeLook }[] } {
    const targets: { name: string; look: GnomeLook }[] = [];
    for (const o of q.objectives) {
      if (o.kind === 'crack') for (const t of o.targets) targets.push({ name: t.name, look: { ...TARGET_BASE, ...(t.look ?? {}) } });
    }
    return { room: GIVERS[q.giver].room, targets };
  }

  return {
    update(dt, px, pz) {
      run?.update(dt, px, pz);
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
      const out: Blip[] = Object.values(GIVERS).map((g) => ({ x: g.x, z: g.z, color: GIVER_COLOR }));
      if (run) out.push(...run.blips());
      return out;
    },

    prompt(x, z) {
      const g = giverOf(x, z);
      return g ? g.label : null;
    },

    interact(x, z) {
      const g = giverOf(x, z);
      if (!g || deps.cutscene.active) return false;
      const mine = QUESTS.filter((q) => q.giver === g.id);
      const open = mine.find((q) => saves[q.id]?.state === 'active');
      if (open) {
        deps.hud.toast(`Your contract is still open: ${open.objectives[saves[open.id].step].text}.`, 4000);
        return true;
      }
      const next = mine.find((q) => !saves[q.id]);
      if (!next) {
        deps.hud.toast('The Don has no more work for you. This is a demo: come back later!', 5000);
        return true;
      }
      deps.cutscene.play(requestFor(next), () => {
        deps.placePlayer(g.exit.x, g.exit.z, g.exit.yaw);
        activate(next);
        deps.hud.banner('NEW CONTRACT', 3000);
        deps.hud.toast('DEMO: this is a first taster of quests. Come back to it for more!', 7000);
        deps.play('whistle');
      });
      return true;
    },

    onCracked(npc) {
      run?.onCracked(npc);
    },
  };
}
