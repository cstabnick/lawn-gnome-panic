// Quest sim, browser layer: the same runner and solvers against the live game (?questsim, the trainer's Quest sim tab,
// tools/quest-sim.mjs). The live page is the world. A run that needs a fresh save writes it, reloads the page and
// resumes on the new page from the 'pending' run in sessionStorage (the host's open() cannot build a live world on
// the current page once the save is in place). window.__questSim is the page's API.
import * as THREE from 'three';
import { BAIL_MIN_ALTITUDE } from '../config';
import { KEYS } from '../keys';
import { SAVE_KEY } from '../quests/quests';
import { groundAt, heightAt } from '../terrain';
import type { TrainerCtx } from '../trainer/types';
import { createVehicle, syncVehicleMesh } from '../vehicles';
import type { DriveControls, Npc, Vehicle, VehicleKind } from '../types';
import { setQuestSimInput } from './input';
import { QUEST_PLANS } from './plans';
import { runQuest } from './runner';
import { ALL_CHEATS, CHEAT_IDS, NO_CHEATS, SimFail } from './types';
import type { Cheats, QuestResult, RunSession, SessionHost, SessionRecord, SimActions } from './types';

/** What the page exposes as window.__questSim (tools/quest-sim.mjs and the trainer call these). */
export interface QuestSimApi {
  /** Every quest id the sim has a plan for, in table order. */
  list(): string[];
  /** Play one quest (one ending of a choice quest) with the bot; resolves with the result. */
  run(questId: string, opts?: { variant?: 'A' | 'B'; cheats?: Partial<Cheats> }): Promise<QuestResult>;
  /** What the bot is doing now: quest, step, the objective it is solving, the last log line. */
  status(): { running: boolean; questId: string | null; step: number; line: string };
  /** Stop the current run (and the queue) at the next step; the run resolves as a 'bot' failure 'stopped'. */
  stop(): void;
  /**
   * Play several quests in order (the trainer's 'Play chapter'). Survives the page reloads a run needs: the queue and
   * the results so far live in sessionStorage 'gta-questsim-queue'. Resolves when the queue is empty.
   */
  queue(runs: { questId: string; variant?: 'A' | 'B' }[], cheats?: Partial<Cheats>): Promise<QuestResult[]>;
  /** Results of this tab's runs so far, newest last (sessionStorage 'gta-questsim-results'). */
  results(): QuestResult[];
}

type Variant = 'A' | 'B';
interface RunMeta { questId: string; variant?: Variant }
interface PendingRun extends RunMeta { cheats: Cheats }
interface QueueState { runs: RunMeta[]; cheats: Cheats }
interface FootWish { moveX: number; moveY: number; camYaw: number }

const PENDING_KEY = 'gta-questsim-pending';
const RESULTS_KEY = 'gta-questsim-results';
const QUEUE_KEY = 'gta-questsim-queue';
const TOKENS_KEY = 'gta-questsim-tokens';
const INTRO_KEY = 'gta-intro-seen-v1';
const RESUME_DELAY_MS = 1500;
const STEP_DT = 1 / 30;

// ---- Pure helpers (exported for browser.test.ts) --------------------------------------------------------------------

/** The cheats a URL asks for: 'all' (default), 'none', or a comma list of the cheats to turn on. */
export function parseCheats(text: string | null): Cheats {
  const t = (text ?? '').trim();
  if (t === '' || t === 'all') return { ...ALL_CHEATS };
  if (t === 'none') return { ...NO_CHEATS };
  const want = new Set(t.split(',').map((s) => s.trim()));
  const out: Cheats = { ...NO_CHEATS };
  for (const id of CHEAT_IDS) if (want.has(id)) out[id] = true;
  return out;
}

/**
 * The foot input that walks along heading `camYaw` (moveX / moveY as the solver gives them, relative to that heading)
 * when the camera faces `cameraYaw`. updateFoot moves along the camera: forward (sin, cos), right (-cos, sin).
 */
function footFromHeading(moveX: number, moveY: number, camYaw: number, cameraYaw: number): { moveX: number; moveY: number } {
  const d = camYaw - cameraYaw;
  return { moveX: moveX * Math.cos(d) - moveY * Math.sin(d), moveY: moveY * Math.cos(d) + moveX * Math.sin(d) };
}

/** Walking forward along `camYaw` when the camera faces `cameraYaw`: the foot input for it. */
export function walkInput(camYaw: number, cameraYaw: number): { moveX: number; moveY: number } {
  return footFromHeading(0, 1, camYaw, cameraYaw);
}

// ---- Storage (every access may throw: private windows, blocked site data) --------------------------------------------

function readJson<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function writeJson(store: Storage, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the run cannot resume after a reload, and the status line says so.
  }
}

function removeKey(store: Storage, key: string): void {
  try {
    store.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

// ---- Page state -----------------------------------------------------------------------------------------------------

const squad: Npc[] = [];
let liveCtx: TrainerCtx | null = null;
let liveRecord: SessionRecord | null = null;
let sessionStart = 0;
let mounted = false;
let hudEl: HTMLElement | null = null;
let running = false;
let runningQuest: string | null = null;
let line = '';
let stopRequested = false;
/** Set when a resumed page is about to run: the next host.open() builds the live session instead of reloading. */
let preparedFor = false;
/** The run host.open() is serving: needed to store the pending run before a reload. */
let runMeta: RunMeta | null = null;
let advancing = false;
let queueWaiters: ((r: QuestResult[]) => void)[] = [];
let wheelOpen = false;
let kitOpen = false;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** One animation frame, or 100 ms when the page is hidden and frames stop. */
function nextFrame(): Promise<void> {
  return Promise.race([new Promise<void>((resolve) => requestAnimationFrame(() => resolve())), sleep(100)]);
}

function cameraYaw(ctx: TrainerCtx): number {
  const d = ctx.camera.getWorldDirection(new THREE.Vector3());
  return Math.atan2(d.x, d.z);
}

function keyEvent(type: 'keydown' | 'keyup', code: string): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function emptyRecord(): SessionRecord {
  return {
    toasts: [], banners: [], achievements: [], bulletins: [], earned: [], scenes: [], sceneErrors: [],
    objectiveStarts: [], triggers: [], cheats: new Map(), log: [], errors: [], heatAdded: 0,
  };
}

// ---- Wrappers on the live game (installed once, at mount) -----------------------------------------------------------

function installWrappers(ctx: TrainerCtx): void {
  const { watch, hud, economy, cutscene } = ctx;

  // Mission squads: watch keeps no list of them, so the page does.
  const spawnSquad = watch.spawnSquad.bind(watch);
  watch.spawnSquad = (kind, points) => {
    const out = spawnSquad(kind, points);
    squad.push(...out);
    return out;
  };
  const despawnSquad = watch.despawnSquad?.bind(watch);
  watch.despawnSquad = (list) => {
    for (const n of list) {
      const i = squad.indexOf(n);
      if (i >= 0) squad.splice(i, 1);
    }
    despawnSquad?.(list);
  };

  const addHeat = watch.addHeat.bind(watch);
  watch.addHeat = (n: number) => {
    if (liveRecord) liveRecord.heatAdded += n;
    addHeat(n);
  };

  const toast = hud.toast.bind(hud);
  hud.toast = (t: string) => {
    liveRecord?.toasts.push(t);
    toast(t);
  };
  const banner = hud.banner.bind(hud);
  hud.banner = (t: string) => {
    liveRecord?.banners.push(t);
    banner(t);
  };

  const earn = economy.earn.bind(economy);
  economy.earn = (amount: number, reason?: string) => {
    liveRecord?.earned.push({ amount, reason: reason ?? '' });
    earn(amount, reason);
  };

  const play = cutscene.play.bind(cutscene);
  cutscene.play = (req, onDone, opts) => {
    if (liveRecord) {
      liveRecord.scenes.push(
        req.kind === 'script' ? req.script.id : req.kind === 'dialogue' ? `dialogue:${req.titleCard ?? req.room}` : 'contract',
      );
    }
    play(req, onDone, opts);
  };
}

// ---- The HUD line ---------------------------------------------------------------------------------------------------

function installHud(ui: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.id = 'questsim-hud';
  el.style.cssText = [
    'position:fixed', 'top:calc(env(safe-area-inset-top, 0px) + 8px)', 'left:50%', 'transform:translateX(-50%)',
    'z-index:60', 'pointer-events:none', 'padding:4px 12px', 'border-radius:999px', 'background:rgba(0,0,0,0.65)',
    'color:#fff', 'font:13px/1.3 system-ui, sans-serif', 'max-width:90vw', 'white-space:nowrap', 'overflow:hidden',
    'text-overflow:ellipsis', 'display:none',
  ].join(';');
  ui.appendChild(el);
  return el;
}

function refreshHud(): void {
  if (!hudEl) return;
  hudEl.textContent = running ? `\u{1F916} ${line}` : '';
  hudEl.style.display = running ? 'block' : 'none';
}

// ---- The live session -----------------------------------------------------------------------------------------------

/** The bot's inputs, applied every step: the vehicle's controls while driving, the foot input otherwise. */
function applyInput(ctx: TrainerCtx, controls: DriveControls | null, foot: FootWish | null): void {
  if (ctx.player.vehicle) {
    setQuestSimInput(controls ? { moveX: controls.steer, moveY: controls.throttle, lift: controls.lift } : { moveX: 0, moveY: 0, lift: 0 });
    return;
  }
  if (!foot) {
    setQuestSimInput(null);
    return;
  }
  setQuestSimInput(footFromHeading(foot.moveX, foot.moveY, foot.camYaw, cameraYaw(ctx)));
}

function openLive(ctx: TrainerCtx, cheats: Cheats): RunSession {
  const record = emptyRecord();
  liveRecord = record;
  sessionStart = performance.now();
  let controls: DriveControls | null = null;
  let foot: FootWish | null = null;

  const exitVehicle = (): void => {
    const v = ctx.player.vehicle;
    if (!v) return;
    ctx.player.exit();
    v.driver = 'none';
    v.speed = 0;
  };

  const actions: SimActions = {
    async setWheelOpen(open) {
      // The weapon wheel opens while the gun key is held and closes on release.
      if (open !== wheelOpen) {
        wheelOpen = open;
        keyEvent(open ? 'keydown' : 'keyup', KEYS.switchGun);
      }
    },
    async setKitOpen(open) {
      // The Pocket Kit toggles on a tap of its key.
      if (open !== kitOpen) {
        kitOpen = open;
        keyEvent('keydown', KEYS.modKit);
        keyEvent('keyup', KEYS.modKit);
      }
    },
    async emote(_pair) {
      // Pair emotes need a townsgnome next to the player; the bot always waves.
      if (!ctx.emote.play('wave')) throw new SimFail('bot', 'emote: the wave was refused');
    },
    async streetEventDone() {
      throw new SimFail('blocked', 'streetEventDone: not scriptable in the browser layer yet');
    },
    async storeInLockup() {
      throw new SimFail('blocked', 'storeInLockup: not scriptable in the browser layer yet');
    },
    async nearBanner() {
      throw new SimFail('blocked', 'nearBanner: not scriptable in the browser layer yet');
    },
    async joinParty() {
      throw new SimFail('blocked', 'joinParty: not scriptable in the browser layer yet');
    },
  };

  const session: RunSession = {
    layer: 'browser',
    world: ctx.world,
    player: ctx.player,
    vehicles: ctx.vehicles,
    npcs: ctx.npcs,
    watch: ctx.watch,
    quests: ctx.quests,
    economy: ctx.economy,
    cheats,
    actions,
    record,
    squad,
    now: () => (performance.now() - sessionStart) / 1000,
    async step(dt = STEP_DT) {
      applyInput(ctx, controls, foot);
      const t0 = performance.now();
      do {
        await nextFrame();
      } while ((performance.now() - t0) / 1000 < dt);
      if (stopRequested) throw new SimFail('bot', 'stopped');
      if (cheats.godMode) ctx.player.health = 1;
      if (cheats.noHeat || cheats.noWanted) ctx.watch.clear();
      if (ctx.cutscene.active && cheats.skipCutscenes) ctx.cutscene.skip();
    },
    drive(c) {
      controls = c;
      applyInput(ctx, controls, foot);
    },
    walk(w) {
      foot = w ? { moveX: w.moveX, moveY: w.moveY, camYaw: w.camYaw } : null;
      applyInput(ctx, controls, foot);
    },
    teleport(x, z, opts) {
      const p = ctx.player;
      const v = p.vehicle;
      const y = opts?.y ?? heightAt(x, z);
      if (v) {
        v.sim = undefined; // the sim-drive chassis would put the vehicle back
        v.x = x; v.z = z; v.y = y; v.speed = 0; v.vy = 0;
        if (opts?.yaw !== undefined) v.yaw = opts.yaw;
        syncVehicleMesh(v, 0);
        p.x = x; p.y = y; p.z = z;
      } else {
        p.respawn(x, z, opts?.yaw ?? p.yaw);
        p.y = y;
      }
    },
    spawnVehicle(kind: VehicleKind, x: number, z: number, yaw: number): Vehicle {
      const v = createVehicle(ctx.scene, kind, x, z, yaw);
      ctx.vehicles.push(v);
      return v;
    },
    enter(v) {
      if (ctx.player.vehicle) exitVehicle();
      v.driver = 'player';
      ctx.player.enter(v);
      ctx.player.x = v.x; ctx.player.y = v.y; ctx.player.z = v.z;
    },
    exit: exitVehicle,
    bail() {
      const v = ctx.player.vehicle;
      if (!v || !v.spec.flies || v.y - groundAt(v.x, v.z) <= BAIL_MIN_ALTITUDE) return false;
      v.driver = 'none';
      ctx.player.bail(v);
      return true;
    },
    shoot(npc: Npc) {
      // Mirrors app.ts hitTest: pedestrians first (quest targets are pedestrians), then Watch / squad units.
      if (ctx.npcs.list.includes(npc)) {
        ctx.quests.onCracked(npc);
        ctx.npcs.crack(npc, ctx.player.x, ctx.player.z);
        return;
      }
      for (let i = 0; i < 20; i++) {
        if (ctx.watch.crack(npc)) {
          const k = squad.indexOf(npc);
          if (k >= 0) squad.splice(k, 1);
          return;
        }
      }
    },
    useCheat(id, why) {
      if (!record.cheats.has(id)) record.cheats.set(id, why);
    },
    log(msg) {
      record.log.push(`[${((performance.now() - sessionStart) / 1000).toFixed(1)}s] ${msg}`);
    },
    dispose() {
      setQuestSimInput(null);
      liveRecord = null;
    },
  };
  return session;
}

// ---- The host, the run, the queue -----------------------------------------------------------------------------------

const host: SessionHost = {
  // A reload cannot be undone mid-run, so the browser never supports the save round trip.
  reopen: null,
  async open(saves, cheats) {
    if (preparedFor && liveCtx) {
      preparedFor = false;
      const s = openLive(liveCtx, cheats);
      if (cheats.freeAcorns) s.economy.earn(100000, 'Quest sim: freeAcorns');
      return s;
    }
    // Not prepared: write the saves and the pending run, reload, and let the new page play it. This promise never
    // resolves on this page; the new page finishes the run and appends its result.
    if (!runMeta) throw new Error('quest sim: open() without a run');
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      throw new Error('quest sim: cannot write the save (storage blocked)');
    }
    const pending: PendingRun = { questId: runMeta.questId, variant: runMeta.variant, cheats };
    writeJson(sessionStorage, PENDING_KEY, pending);
    line = 'reloading to play the quest on the live game';
    refreshHud();
    location.reload();
    return new Promise<RunSession>(() => {});
  },
};

function appendResult(r: QuestResult): void {
  const list = readJson<QuestResult[]>(sessionStorage, RESULTS_KEY) ?? [];
  list.push(r);
  writeJson(sessionStorage, RESULTS_KEY, list);
}

/** Play one quest on this page (or start the reload that plays it). Resolves with the result when played here. */
async function execute(questId: string, variant: Variant | undefined, cheats: Cheats): Promise<QuestResult> {
  stopRequested = false;
  running = true;
  runningQuest = questId;
  runMeta = { questId, variant };
  line = 'starting';
  refreshHud();
  try {
    const result = await runQuest(host, questId, {
      cheats,
      variant,
      onStatus: (s) => {
        line = s;
        refreshHud();
      },
    });
    line = `${result.status}${result.reason ? `: ${result.reason}` : ''}`;
    appendResult(result);
    return result;
  } finally {
    running = false;
    runningQuest = null;
    runMeta = null;
    preparedFor = false;
    setQuestSimInput(null);
    refreshHud();
  }
}

/** Play the queue's entries one after another; resolves the queue waiters when it is empty. */
async function advanceQueue(): Promise<void> {
  for (;;) {
    const q = readJson<QueueState>(sessionStorage, QUEUE_KEY);
    if (!q || q.runs.length === 0) {
      removeKey(sessionStorage, QUEUE_KEY);
      const waiters = queueWaiters;
      queueWaiters = [];
      for (const w of waiters) w(readJson<QuestResult[]>(sessionStorage, RESULTS_KEY) ?? []);
      return;
    }
    const next = q.runs.shift()!;
    writeJson(sessionStorage, QUEUE_KEY, q);
    await execute(next.questId, next.variant, q.cheats);
  }
}

function startQueue(): void {
  if (advancing) return;
  advancing = true;
  void advanceQueue().finally(() => {
    advancing = false;
  });
}

/** Play the pending run this page was reloaded for, once the game has settled. */
function resumePending(p: PendingRun): void {
  running = true;
  runningQuest = p.questId;
  line = 'starting';
  refreshHud();
  setTimeout(() => {
    preparedFor = true;
    void execute(p.questId, p.variant, p.cheats).then(() => startQueue());
  }, RESUME_DELAY_MS);
}

// ---- window.__questSim ----------------------------------------------------------------------------------------------

const api: QuestSimApi = {
  list: () => Object.keys(QUEST_PLANS),
  run: (questId, opts) => execute(questId, opts?.variant, { ...ALL_CHEATS, ...opts?.cheats }),
  status: () => ({
    running,
    questId: runningQuest,
    step: running && liveCtx ? liveCtx.quests.getJournal().activeStep : 0,
    line,
  }),
  stop() {
    stopRequested = true;
    removeKey(sessionStorage, QUEUE_KEY);
  },
  queue(runs, cheats) {
    const q = readJson<QueueState>(sessionStorage, QUEUE_KEY);
    const merged: QueueState = {
      runs: [...(q?.runs ?? []), ...runs],
      cheats: { ...ALL_CHEATS, ...cheats },
    };
    writeJson(sessionStorage, QUEUE_KEY, merged);
    return new Promise<QuestResult[]>((resolve) => {
      queueWaiters.push(resolve);
      startQueue();
    });
  },
  results: () => readJson<QuestResult[]>(sessionStorage, RESULTS_KEY) ?? [],
};

/** Install window.__questSim on the live game; with ?questsim=<id> start that quest at once. Idempotent. */
export function mountQuestSim(ctx: TrainerCtx): QuestSimApi {
  if (mounted) return api;
  mounted = true;
  liveCtx = ctx;
  installWrappers(ctx);
  hudEl = installHud(ctx.ui);
  window.addEventListener('error', (e) => {
    if (running && liveRecord) liveRecord.errors.push(String(e.error?.stack ?? e.message));
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (running && liveRecord) liveRecord.errors.push(String((e.reason as Error | undefined)?.stack ?? e.reason));
  });
  (window as unknown as { __questSim?: QuestSimApi }).__questSim = api;

  // A reload for a run: play it now.
  const pending = readJson<PendingRun>(sessionStorage, PENDING_KEY);
  removeKey(sessionStorage, PENDING_KEY);
  if (pending) {
    resumePending(pending);
    return api;
  }

  // A URL that asks for a run: once per token (a reload of the same URL must not start it again).
  let url: URL | null = null;
  try {
    url = new URL(location.href);
  } catch {
    url = null;
  }
  const questId = url?.searchParams.get('questsim') ?? '';
  if (url && questId) {
    const token = url.searchParams.get('questsimRun') ?? questId;
    const seen = readJson<string[]>(sessionStorage, TOKENS_KEY) ?? [];
    if (!seen.includes(token)) {
      writeJson(sessionStorage, TOKENS_KEY, [...seen, token]);
      const v = url.searchParams.get('questsimVariant');
      const variant: Variant | undefined = v === 'A' || v === 'B' ? v : undefined;
      const cheats = parseCheats(url.searchParams.get('questsimCheats'));
      void execute(questId, variant, cheats).then(() => startQueue());
      return api;
    }
  }

  // A queue left from an earlier page: keep going.
  if ((readJson<QueueState>(sessionStorage, QUEUE_KEY)?.runs.length ?? 0) > 0) startQueue();
  return api;
}
