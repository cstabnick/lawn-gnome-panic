// Quest sim, headless layer: the real world (buildWorld), the real quest engine (createQuests) and the real objective
// runners, pedestrians, Hat Watch, player and vehicles, with the renderer, HUD, audio and cutscene player swapped for
// recorders. Import ./globals first (it installs document / window / localStorage).
//
//   const sim = buildSimWorld();             // once per test file (~1-2 s)
//   const s = openSession(sim, ALL_CHEATS);  // per quest run (cheap); s is a SimCtx
//   ... solvers act on s, s.step() advances ...
//   s.dispose();
import * as THREE from 'three';
import { buildWorld } from '../world';
import { installSkyways } from '../highways/install';
import { createNpcs } from '../npcs';
import { createWatch } from '../police';
import { createFx } from '../fx';
import { createPlayer } from '../player';
import { createEconomy, type Economy } from '../economy';
import { createQuests } from '../quests/quests';
import { commsFor } from '../quests/comms';
import { BAIL_MIN_ALTITUDE } from '../config';
import { groundAt, heightAt } from '../terrain';
import { createVehicle, stepVehicle, syncVehicleMesh, repairVehicle } from '../vehicles';
import { bumpProbe, declareCounter, installProbeEconomy, registerProbe } from '../city/probes';
import { compile } from '../cutscene/timeline';
import { lineTiming } from '../cutscene/textSpeed';
import type { SceneScript } from '../cutscene/script';
import type { CutsceneHandle, CutsceneRequest, GiverDef, QuestDef, QuestDeps } from '../quests/types';
import type { DriveControls, Fx, Hud, Npc, Vehicle, World } from '../types';
import { resetSimStorage, simStorage } from './globals';
import { SAVE_KEY } from '../quests/quests';
import type { Cheats, RunSession, SessionHost, SessionRecord, SimActions } from './types';
import { SimFail } from './types';

/** The expensive, shared part: the built world. Build once per process / test file. */
export interface SimWorld {
  world: World;
}

export function buildSimWorld(): SimWorld {
  const scene = new THREE.Scene();
  const world = buildWorld(scene, undefined as unknown as THREE.WebGLRenderer);
  // As app.ts does right after buildWorld: the skyways' colliders and deck road nodes (the Skyway jobs drive them).
  installSkyways(scene, world);
  return { world };
}

export interface SimSession extends RunSession {
  readonly scene: THREE.Scene;
}

/** Test kits: play a hand-made quest list instead of the game's (quests/defs.ts). */
export interface SessionOpts {
  quests?: readonly QuestDef[];
  givers?: Record<string, GiverDef>;
}

const DT = 1 / 30;

// One economy facade per process: installProbeEconomy wraps the object it is given only once, so every session's
// economy is reached through this facade (the 'spend:<reason>' / 'earn:<reason>' probes keep counting).
let currentEconomy: Economy | null = null;
const economyFacade: Economy = {
  state: () => currentEconomy!.state(),
  earn: (a, r) => currentEconomy!.earn(a, r),
  spend: (a, r) => currentEconomy!.spend(a, r),
  payDebt: (a) => currentEconomy!.payDebt(a),
  chargeHospital: () => currentEconomy!.chargeHospital(),
  inFraudZone: (x, z) => currentEconomy!.inFraudZone(x, z),
  onPlayerRagdollImpact: (s, x, z) => currentEconomy!.onPlayerRagdollImpact(s, x, z),
};

// Live probe state (city/install.ts registers these getters in the game; the headless sim owns them here).
const live = { wheel: false, kit: false, lockupStored: 0, bannerDist: Infinity, party: false };
let probesInstalled = false;
let currentPlayer: { vehicle: Vehicle | null } | null = null;
function installProbes(): void {
  if (probesInstalled) return;
  probesInstalled = true;
  installProbeEconomy(economyFacade);
  for (const id of ['emote', 'pair-emote', 'street-event']) declareCounter(id);
  registerProbe('wheel-open', () => (live.wheel ? 1 : 0));
  registerProbe('kit-open', () => (live.kit ? 1 : 0));
  registerProbe('lockup-stored', () => live.lockupStored);
  registerProbe('banner-near', () => (live.bannerDist <= 150 ? 1 : 0));
  registerProbe('party-on', () => (live.party ? 1 : 0));
  registerProbe('boat', () => (currentPlayer?.vehicle?.spec.boat ? 1 : 0));
  registerProbe('golf-cart', () => (currentPlayer?.vehicle?.kind === 'golf-cart' ? 1 : 0));
}

/** Every 'call' step name in a script (parallel tracks included). */
function callNames(steps: SceneScript['steps']): string[] {
  const out: string[] = [];
  for (const st of steps) {
    if (st.do === 'call') out.push(st.name);
    else if (st.do === 'parallel') for (const t of st.tracks) out.push(...callNames(t));
  }
  return out;
}

/**
 * Open a session on the built world: a fresh scene, player, pedestrians, Watch, vehicles, economy and quest engine
 * that read the quest save from simStorage as it is now (write saves before opening; see prereqs.ts).
 */
export function openSession(sim: SimWorld, cheats: Cheats, opts: SessionOpts = {}): SimSession {
  installProbes();
  const { world } = sim;
  const scene = new THREE.Scene();
  const record: SessionRecord = {
    toasts: [], banners: [], achievements: [], bulletins: [], earned: [], scenes: [], sceneErrors: [],
    objectiveStarts: [], triggers: [], cheats: new Map(), log: [], errors: [], heatAdded: 0,
  };
  const fx: Fx = createFx(scene);
  const vehicles: Vehicle[] = [];
  // The world's fixed vehicles that quests rely on (app.ts creates them at load): the Whirligig on Fort Sandpit's pad.
  vehicles.push(createVehicle(scene, 'whirligig', world.base.padX, world.base.padZ, Math.PI));
  const npcs = createNpcs(scene, world, fx);
  const watch = createWatch(scene, world, fx, vehicles);
  // Mission squads (convoy escorts, the boss's guards): watch has no list of them, so the sim keeps one.
  const squad: Npc[] = [];
  const spawnSquad = watch.spawnSquad.bind(watch);
  watch.spawnSquad = (kind, points) => { const out = spawnSquad(kind, points); squad.push(...out); return out; };
  const despawnSquad = watch.despawnSquad?.bind(watch);
  watch.despawnSquad = (list) => { for (const n of list) { const i = squad.indexOf(n); if (i >= 0) squad.splice(i, 1); } despawnSquad?.(list); };
  const addHeat = watch.addHeat.bind(watch);
  watch.addHeat = (n: number) => { record.heatAdded += n; addHeat(n); };
  const player = createPlayer(scene, { hat: 0xd8342c, shirt: 0x3a6ea5, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xeeeeee, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null });
  currentPlayer = player;
  const economy = createEconomy(simStorage);
  currentEconomy = economy;
  const earn = economy.earn.bind(economy);
  economy.earn = (amount: number, reason?: string) => { record.earned.push({ amount, reason: reason ?? '' }); earn(amount, reason); };

  const hud: Hud = {
    setWorld() {}, set() {},
    toast(t: string) { record.toasts.push(t); },
    banner(t: string) { record.banners.push(t); },
    setObjective() {}, setVisible() {},
  } as unknown as Hud;

  // The cutscene player: records the scene, checks it compiles, fires its 'call' steps, and ends it at the next step
  // (skipCutscenes) or after its compiled length.
  let pending: { done: () => void; left: number } | null = null;
  const cutscene: CutsceneHandle = {
    active: false,
    play(req: CutsceneRequest, onDone, opts) {
      let length = 0.1;
      if (req.kind === 'script') {
        record.scenes.push(req.script.id);
        try {
          length = compile(req.script, lineTiming('normal')).duration;
          if (!(length > 0) || !Number.isFinite(length)) record.sceneErrors.push(`${req.script.id}: length ${length}`);
        } catch (e) {
          record.sceneErrors.push(`${req.script.id}: ${(e as Error).message}`);
        }
        for (const name of callNames(req.script.steps)) {
          record.triggers.push(name);
          opts?.onTrigger?.(name, undefined);
        }
      } else if (req.kind === 'dialogue') {
        record.scenes.push(`dialogue:${req.titleCard ?? req.room}`);
        length = req.lines.length * 3;
      } else {
        record.scenes.push('contract');
        length = 6;
      }
      cutscene.active = true;
      pending = { done: onDone, left: cheats.skipCutscenes ? 0 : length };
      if (cheats.skipCutscenes) record.cheats.set('skipCutscenes', 'cutscenes end after one step');
    },
    update() {},
    skip() { if (pending) pending.left = 0; },
  };

  const deps: QuestDeps = {
    scene, world, npcs, hud, cutscene,
    placePlayer(x, z, yaw) { player.respawn(x, z, yaw); },
    unlock(id) { record.achievements.push(id); },
    play() {},
    player, vehicles, watch, fx, economy: economyFacade,
    onRadioBulletin(id) { record.bulletins.push(id); },
    onObjectiveStart(q, step) { record.objectiveStarts.push({ questId: q.id, step, comms: !!commsFor(q.id, step) }); },
  };
  const quests = opts.quests ? createQuests(deps, opts.quests, opts.givers ?? {}) : createQuests(deps);

  let time = 0;
  let controls: DriveControls | null = null;
  let foot: { moveX: number; moveY: number; camYaw: number } | null = null;

  const actions: SimActions = {
    async setWheelOpen(open) { live.wheel = open; },
    async setKitOpen(open) { live.kit = open; },
    async emote(pair) { bumpProbe('emote'); if (pair) bumpProbe('pair-emote'); },
    async streetEventDone() { bumpProbe('street-event'); },
    async storeInLockup() {
      const v = player.vehicle;
      if (!v) throw new SimFail('bot', 'storeInLockup: not driving');
      live.lockupStored++;
    },
    async nearBanner() { live.bannerDist = 100; },
    async joinParty() { throw new SimFail('blocked', 'online party: no relay server in the headless sim'); },
  };

  const footInput = (moveX: number, moveY: number) => ({
    moveX, moveY, lift: 0, jump: false, fire: false, aim: false, interact: false, horn: false, pad: false,
  }) as unknown as Parameters<typeof player.updateFoot>[0];

  const session: SimSession = {
    layer: 'headless', world, player, vehicles, npcs, watch, quests, cheats, actions, record, economy: economyFacade, scene, squad,
    now: () => time,
    async step(dt = DT) {
      try {
        time += dt;
        if (cheats.godMode) player.health = 1;
        if (cheats.noHeat || cheats.noWanted) watch.clear();
        if (cutscene.active && pending) {
          pending.left -= dt;
          if (pending.left <= 0) {
            const p = pending;
            pending = null;
            cutscene.active = false;
            p.done();
          }
          return;
        }
        const v = player.vehicle;
        if (v) {
          stepVehicle(v, controls ?? { throttle: 0, steer: 0, lift: 0 }, dt, world);
          if (cheats.vehicleRepair && v.hp < 1 && !v.exploded) {
            repairVehicle(v);
            record.cheats.set('vehicleRepair', record.cheats.get('vehicleRepair') ?? 'the ride was repaired');
          }
          syncVehicleMesh(v, 0);
          player.x = v.x; player.y = v.y; player.z = v.z; player.yaw = v.yaw;
        } else if (player.airborne) {
          player.updateAir(footInput(foot?.moveX ?? 0, foot?.moveY ?? 0), foot?.camYaw ?? player.yaw, dt, world);
        } else {
          player.updateFoot(footInput(foot?.moveX ?? 0, foot?.moveY ?? 0), foot?.camYaw ?? player.yaw, dt, world);
        }
        npcs.update(dt, world, player.x, player.z, vehicles);
        watch.update(dt, { playerX: player.x, playerY: player.y, playerZ: player.z, playerVehicle: player.vehicle }, world);
        quests.update(dt, player.x, player.z);
      } catch (e) {
        record.errors.push((e as Error).stack ?? String(e));
        throw e;
      }
    },
    drive(c) { controls = c; },
    walk(input) { foot = input; },
    teleport(x, z, opts) {
      const v = player.vehicle;
      const y = opts?.y ?? heightAt(x, z);
      if (v) {
        v.x = x; v.z = z; v.y = y; v.speed = 0; v.vy = 0;
        if (opts?.yaw !== undefined) v.yaw = opts.yaw;
        syncVehicleMesh(v, 0);
        player.x = x; player.y = y; player.z = z;
      } else {
        player.respawn(x, z, opts?.yaw ?? player.yaw);
        player.y = y;
      }
    },
    spawnVehicle(kind, x, z, yaw) {
      const v = createVehicle(scene, kind, x, z, yaw);
      vehicles.push(v);
      return v;
    },
    enter(v) {
      if (player.vehicle) session.exit();
      v.driver = 'player';
      player.enter(v);
      player.x = v.x; player.y = v.y; player.z = v.z;
    },
    exit() {
      const v = player.vehicle;
      if (!v) return;
      player.exit();
      v.driver = 'none';
      v.speed = 0;
    },
    bail() {
      const v = player.vehicle;
      if (!v || !v.spec.flies || v.y - groundAt(v.x, v.z) <= BAIL_MIN_ALTITUDE) return false;
      v.driver = 'none';
      player.bail(v);
      return true;
    },
    shoot(npc: Npc) {
      // Mirrors app.ts hitTest: pedestrians first (quest targets are pedestrians), then Watch / squad units.
      if (npcs.list.includes(npc)) {
        quests.onCracked(npc);
        npcs.crack(npc, player.x, player.z);
        return;
      }
      for (let i = 0; i < 20; i++) {
        if (watch.crack(npc)) {
          quests.onCracked(npc); // as app.ts hitTest does (since the quest-sim fix)
          const k = squad.indexOf(npc);
          if (k >= 0) squad.splice(k, 1);
          return;
        }
      }
    },
    useCheat(id, why) { if (!record.cheats.has(id)) record.cheats.set(id, why); },
    log(msg) { record.log.push(`[${time.toFixed(1)}s] ${msg}`); },
    dispose() {
      for (const v of vehicles) scene.remove(v.object);
      vehicles.length = 0;
      currentPlayer = null;
    },
  };
  return session;
}

/** The headless SessionHost: every open() starts a fresh in-memory profile on the shared world. */
export function headlessHost(sim: SimWorld): SessionHost {
  return {
    async open(saves, cheats) {
      resetSimStorage();
      simStorage.setItem(SAVE_KEY, JSON.stringify(saves));
      const s = openSession(sim, cheats);
      if (cheats.freeAcorns) s.economy.earn(100000, 'Quest sim: freeAcorns');
      return s;
    },
    async reopen(old) {
      const cheats = old.cheats;
      old.dispose();
      return openSession(sim, cheats);
    },
  };
}
