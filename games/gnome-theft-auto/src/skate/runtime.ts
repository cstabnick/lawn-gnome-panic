// The Gutter Bowls and the skateboard at runtime (batch 3 E19): builds the park and its life, the Board Library, riding
// a board anywhere (skate/board.ts), tricks and combos (@lawn/trickboard), lines, the HUD, achievements, the save and
// the SkateApi. app.ts installs it like winter (the board is a vehicle kind it steps itself).
import { clampToWorld, sweepCircleBoxes, wallBounce } from '../collide';
import { WORLD_HALF } from '../config';
import { addItem, count, itemDef, onItemUse, registerItem } from '../inventory';
import type { JobsDeps } from '../jobs/types';
import { PLACE_STYLE } from '../mapIcons';
import { playAt } from '../sound/bus';
import { sportsStore } from '../sports/save';
import { registerSportsSounds } from '../sports/sounds';
import { surfaceAt } from '../terrain';
import type { Blip, InputState, Vehicle } from '../types';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { boardSpeed, newBoard, stepBoard } from './board';
import { buildGutterBowls } from './build';
import { createSkateHud, createSkateInputReader } from './hud';
import { buildSkateLife } from './life';
import { abortLineRun, lineById, newLineRun, stepLineRun, type LineRun } from './lines';
import { parkBoxes, skateGround } from './park';
import { createSkateScore } from './score';
import {
  BOARD_LIBRARY, SKATE_ACH, SKATE_LINES, SKATE_ORIGIN, SKATE_RANGE, SKATE_SITE, SKATEBOARD_ITEM,
  type BoardState, type LineEvent, type LineId, type Skate, type SkateApi, type SkateEvent, type SkateLineResult,
} from './types';

export interface SkateDeps extends JobsDeps {
  /** True when the gnome is on foot and free (no vehicle, not airborne, no cutscene, alive). */
  onFoot(): boolean;
}

export interface SkateOpts {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

let current: SkateApi | null = null;
/** The installed runtime's API (quests, the Gnomlet app), or null before install. */
export function skateApi(): SkateApi | null {
  return current;
}

/** Loose boards at once, and how far from the player an empty one is kept. */
const MAX_LOOSE = 4;
const KEEP_M = 300;
const GRIND_SOUND_S = 0.45;
const ROLL_SOUND_S = 0.4;
const FAIL_SHOW_S = 2;
const SPAWN_BEHIND_M = 4;
/** The board is drawn this far above the ridden surface, as the park meshes are (skate/build.ts SURF_LIFT). */
const DRAW_LIFT = 0.03;

/** Pitch and roll of a body on a ground normal, for a heading (the same maths vehicles.ts syncVehicleMesh uses). */
function tiltOf(nx: number, ny: number, nz: number, yaw: number): { pitch: number; roll: number } {
  const s = Math.sin(yaw);
  const c = Math.cos(yaw);
  return { pitch: Math.atan2(nx * s + nz * c, ny), roll: Math.atan2(-(nx * c - nz * s), ny) };
}

function inSite(x: number, z: number): boolean {
  return x >= SKATE_SITE.minX && x <= SKATE_SITE.maxX && z >= SKATE_SITE.minZ && z <= SKATE_SITE.maxZ;
}

export function installSkate(deps: SkateDeps, opts?: SkateOpts): Skate {
  const store = sportsStore(opts?.storage);
  registerSportsSounds();
  const ground = skateGround();
  const build = buildGutterBowls(deps.scene);
  const life = buildSkateLife(deps.scene);
  deps.world.boxes.push(...parkBoxes(), ...build.boxes, ...life.boxes);
  const hud = createSkateHud(deps.ui);
  const reader = createSkateInputReader();
  const score = createSkateScore();
  const listeners = new Set<(r: SkateLineResult) => void>();
  const toast = (text: string): void => deps.hud.toast(text, 3000);

  if (!itemDef(SKATEBOARD_ITEM)) {
    registerItem({
      id: SKATEBOARD_ITEM,
      name: 'Skateboard',
      prefab: 'gta-skateboard',
      kind: 'tool',
      blurb: 'A wooden board on four wheels. Grass stops it. The Hat Watch pretends it is not there.',
    });
  }

  const boards: Vehicle[] = [];
  const states = new Map<Vehicle, BoardState>();
  const runs = new Map<LineId, LineRun>();
  for (const l of SKATE_LINES) runs.set(l.id, newLineRun(l));
  let ownBoard: Vehicle | null = null;
  let ownSeated = false;
  let toldStow = false;
  let lastBoard: BoardState | null = null;
  let wasRiding = false;
  let t = 0;
  let grindT = 0;
  let rollT = 0;
  let cleanT = 0;
  let shownLine: { id: LineId; failT: number; text: string } | null = null;

  const myBoard = (): Vehicle | null => {
    const v = deps.player.vehicle;
    return v && v.kind === 'skateboard' && v.driver === 'player' ? v : null;
  };

  // ---- Boards: spawn, remove ----

  function removeBoard(v: Vehicle): void {
    states.delete(v);
    const i = boards.indexOf(v);
    if (i >= 0) boards.splice(i, 1);
    const j = deps.vehicles.indexOf(v);
    if (j >= 0) deps.vehicles.splice(j, 1);
    if (v === ownBoard) {
      ownBoard = null;
      ownSeated = false;
    }
    removeVehicle(deps.scene, v);
  }

  function spawnBoard(x: number, z: number, yaw: number): Vehicle {
    while (boards.length >= MAX_LOOSE) {
      const old = boards.find((b) => b.driver !== 'player' && b !== ownBoard) ?? boards.find((b) => b.driver !== 'player');
      if (!old) break;
      removeBoard(old);
    }
    const v = createVehicle(deps.scene, 'skateboard', x, z, yaw);
    v.y = ground.height(x, z);
    deps.vehicles.push(v);
    boards.push(v);
    return v;
  }

  // ---- Lines ----

  function resetRun(id: LineId): void {
    runs.set(id, newLineRun(lineById(id)));
  }

  function lineText(run: LineRun): string {
    const n = run.line.gates.length;
    return `${run.line.name}  gate ${Math.min(run.next + 1, n)}/${n}  ${run.t.toFixed(1)} s`;
  }

  function lineEvent(run: LineRun, ev: LineEvent): void {
    if (!ev) return;
    const id = run.line.id;
    if (ev.kind === 'done') {
      const best = store.recordLine(id, ev.time);
      toast(`${run.line.name}: ${ev.time.toFixed(1)} s${best ? ' - best!' : ''}`);
      for (const cb of listeners) cb({ id, ok: true, time: ev.time });
      shownLine = null;
      resetRun(id);
    } else if (ev.kind === 'fail') {
      if (run.started) {
        for (const cb of listeners) cb({ id, ok: false, time: run.t });
        shownLine = { id, failT: FAIL_SHOW_S, text: `${run.line.name}  failed` };
      }
      resetRun(id);
    }
  }

  function stepLines(b: BoardState, dt: number): void {
    if (!inSite(b.x, b.z) && ![...runs.values()].some((r) => r.started)) return;
    for (const run of [...runs.values()]) {
      lineEvent(run, stepLineRun(run, b, dt));
    }
    // Show the run that has started (the latest one).
    const live = [...runs.values()].find((r) => r.started && !r.done);
    if (live) shownLine = { id: live.line.id, failT: 0, text: lineText(live) };
  }

  function abortLines(): void {
    for (const run of [...runs.values()]) {
      if (run.started && !run.done) lineEvent(run, abortLineRun(run));
      else resetRun(run.line.id);
    }
    if (shownLine && shownLine.failT <= 0) shownLine = null;
  }

  // ---- Riding ----

  function sound(id: string, b: BoardState, param?: number): void {
    playAt(id, { x: b.x, z: b.z }, param === undefined ? {} : { param });
  }

  function handleEvents(v: Vehicle, b: BoardState, events: SkateEvent[], dt: number): void {
    let bailed = false;
    for (const ev of events) {
      score.event(ev, b);
      switch (ev.e) {
        case 'pop':
          sound('skate-pop', b);
          if (ev.trick === 'ollie') {
            store.recordOllie();
            deps.unlock(SKATE_ACH.firstOllie);
          }
          break;
        case 'land':
          sound('skate-land', b, Math.min(1, Math.max(0, ev.impact / 6)));
          break;
        case 'push':
          sound('skate-push', b);
          break;
        case 'fullRail':
          store.recordFullRail();
          deps.unlock(SKATE_ACH.fullRail);
          toast('End to end.');
          break;
        case 'bail':
          bailed = true;
          break;
        default:
          break;
      }
    }
    score.tick(dt, b);
    const banked = score.takeBanked();
    if (banked) {
      if (banked.tricks >= 5) deps.unlock(SKATE_ACH.fiveCombo);
      if (store.recordCombo(banked.points)) toast(`New best combo: ${banked.points}`);
    }

    if (b.mode === 'grind') {
      grindT -= dt;
      if (grindT <= 0) {
        sound('skate-grind', b);
        grindT = GRIND_SOUND_S;
      }
    } else grindT = 0;
    if (b.mode === 'ground' && boardSpeed(b) > 1) {
      rollT -= dt;
      if (rollT <= 0) {
        sound('skate-roll', b, Math.min(1, boardSpeed(b) / 12));
        rollT = ROLL_SOUND_S;
      }
    }

    stepLines(b, dt);

    if (bailed) {
      sound('skate-bail', b);
      if (v === ownBoard) {
        // It stays where it fell, as any loose board.
        ownBoard = null;
        ownSeated = false;
      }
      states.delete(v);
      deps.throwPlayer(v, b.vx, 2.5, b.vz);
      abortLines();
    }
  }

  function stepRider(v: Vehicle, inp: InputState, dt: number, raw: InputState): void {
    // Getting in gives ground vehicles a physics chassis (app.ts takeWheel); the board has its own physics.
    v.sim = undefined;
    let b = states.get(v);
    if (!b) {
      b = newBoard(v.x, v.z, v.yaw, ground);
      states.set(v, b);
    }
    lastBoard = b;
    const si = reader.read(inp, raw, hud.touch());
    const px = b.x, pz = b.z;
    const events = stepBoard(b, si, ground, dt);

    // Real walls stop the board (the park's own boxes never rise above its surface).
    const hit = sweepCircleBoxes(px, pz, b.x, b.z, 0.3, deps.world.boxes, b.y + 0.05);
    if (hit.hit) {
      b.x = hit.x;
      b.z = hit.z;
      const bounced = wallBounce(b.vx, b.vz, hit.nx, hit.nz);
      b.vx = bounced.vx;
      b.vz = bounced.vz;
    }
    const c = clampToWorld(b.x, b.z, WORLD_HALF, 0.3);
    if (c.hit) {
      b.x = c.x;
      b.z = c.z;
    }

    v.x = b.x;
    v.y = b.y + DRAW_LIFT; // the park surfaces are drawn DRAW_LIFT proud of the ridden height (skate/build.ts)
    v.z = b.z;
    v.yaw = b.yaw;
    v.speed = b.vx * Math.sin(b.yaw) + b.vz * Math.cos(b.yaw);
    v.vy = b.vy;
    syncVehicleMesh(v, dt);
    const tilt = tiltOf(b.nx, b.ny, b.nz, b.yaw);
    v.object.rotation.set(tilt.pitch, b.yaw, tilt.roll - b.lean * 0.2, 'YXZ');

    handleEvents(v, b, events, dt);
  }

  // ---- The owned board ----

  function boardOwned(): boolean {
    return store.data().skate.boardOwned;
  }

  function giveBoard(): void {
    store.setBoardOwned();
    if (count(SKATEBOARD_ITEM) === 0) addItem(SKATEBOARD_ITEM);
  }

  /** Put the player on a board at (x, z): their own when `own`, else a library one. */
  function mount(x: number, z: number, yaw: number, own: boolean): void {
    const pv = myBoard();
    if (pv) {
      pv.x = x;
      pv.z = z;
      pv.yaw = yaw;
      pv.y = ground.height(x, z);
      pv.speed = 0;
      states.delete(pv);
      syncVehicleMesh(pv, 0);
      return;
    }
    if (own && ownBoard) removeBoard(ownBoard);
    const v = spawnBoard(x, z, yaw);
    if (own) {
      ownBoard = v;
      ownSeated = false;
    }
    deps.seatPlayer(v);
  }

  function dropBoard(): string | null {
    const why = deps.blocked();
    if (why) return why;
    if (deps.player.vehicle) return 'Get off first.';
    if (!boardOwned()) return 'You have no board yet. The Board Library at the Gutter Bowls has one.';
    const p = deps.player;
    if (surfaceAt(p.x, p.z) === 'water') return 'Too steep or wet here.';
    const dh = Math.abs(ground.height(p.x + Math.sin(p.yaw), p.z + Math.cos(p.yaw)) - ground.height(p.x, p.z));
    if (dh > 1) return 'Too steep or wet here.';
    mount(p.x, p.z, p.yaw, true);
    return null;
  }

  onItemUse((def) => {
    if (def.id !== SKATEBOARD_ITEM) return;
    const why = dropBoard();
    if (why) toast(why);
  });

  const api: SkateApi = {
    boardOwned,
    giveBoard,
    dropBoard,
    startLine(id) {
      const why = deps.blocked();
      if (why) return why;
      const p = deps.player;
      if (Math.hypot(p.x - SKATE_ORIGIN.x, p.z - SKATE_ORIGIN.z) > KEEP_M) {
        return "The Gutter Bowls are in Founders' Green, Downtown Turfton.";
      }
      if (deps.player.vehicle && !myBoard()) return 'Get off first.';
      const line = lineById(id);
      const g0 = line.gates[0];
      const g1 = line.gates[1] ?? g0;
      let dx = g1.u - g0.u, dz = g1.v - g0.v;
      const len = Math.hypot(dx, dz);
      if (len < 1e-6) { dx = 1; dz = 0; } else { dx /= len; dz /= len; }
      const x = SKATE_ORIGIN.x + g0.u - dx * SPAWN_BEHIND_M;
      const z = SKATE_ORIGIN.z + g0.v - dz * SPAWN_BEHIND_M;
      const yaw = Math.atan2(dx, dz);
      const own = boardOwned() && !myBoard();
      mount(x, z, yaw, own);
      abortLines();
      resetRun(id);
      shownLine = null;
      return null;
    },
    onLine(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
  current = api;

  // ---- On foot: the Board Library ----

  const nearLibrary = (x: number, z: number): boolean =>
    deps.onFoot() && Math.hypot(x - BOARD_LIBRARY.x, z - BOARD_LIBRARY.z) <= SKATE_RANGE;

  function prompt(x: number, z: number): string | null {
    if (!nearLibrary(x, z)) return null;
    return boardOwned() ? 'Borrow a board' : 'Take a board (the Board Library)';
  }

  function interact(x: number, z: number): boolean {
    if (!nearLibrary(x, z)) return false;
    if (!boardOwned()) {
      giveBoard();
      toast("Fennel: 'Take one, leave one. You can leave one later.'");
      const why = dropBoard();
      if (why) toast(why);
      return true;
    }
    const p = deps.player;
    mount(p.x, p.z, p.yaw, false);
    return true;
  }

  // ---- Every frame ----

  function update(dt: number, raw: InputState): void {
    void raw;
    t += dt;
    const p = deps.player;
    const mine = myBoard();
    const riding = !!mine;

    if (ownBoard) {
      if (p.vehicle === ownBoard) ownSeated = true;
      else if (ownSeated) {
        removeBoard(ownBoard);
        if (!toldStow) {
          toast('Board under your arm.');
          toldStow = true;
        }
      }
    }
    if (wasRiding && !riding) {
      abortLines();
      lastBoard = null;
    }
    wasRiding = riding;

    life.update(dt, t, p.x, p.z, riding && inSite(p.x, p.z));

    hud.show(riding);
    if (riding && lastBoard) {
      const view = score.view();
      hud.setCombo(view, lastBoard.t);
      const best = Math.max(store.data().skate.bestCombo, view.best);
      hud.setInfo(`${Math.round(boardSpeed(lastBoard) * 3.6)} km/h  best combo ${Math.round(best).toLocaleString('en-US')}`);
    }
    if (shownLine && shownLine.failT > 0) {
      shownLine.failT -= dt;
      if (shownLine.failT <= 0) shownLine = null;
    }
    hud.setLine(riding && shownLine ? shownLine.text : null);

    cleanT -= dt;
    if (cleanT <= 0) {
      cleanT = 2;
      for (const v of [...boards]) {
        if (v.driver === 'player' || v === deps.player.vehicle) continue;
        if (Math.hypot(v.x - p.x, v.z - p.z) > KEEP_M) removeBoard(v);
      }
    }
  }

  return {
    drives: (v) => v.kind === 'skateboard' && v.driver === 'player',
    stepRider,
    update,
    riding: () => !!myBoard(),
    prompt,
    interact,
    blips(): Blip[] {
      return [{
        x: SKATE_ORIGIN.x, z: SKATE_ORIGIN.z, kind: 'skate', label: 'The Gutter Bowls', color: PLACE_STYLE.skate.color,
      }];
    },
    api,
    debug() {
      const b = lastBoard;
      const live = [...runs.values()].find((r) => r.started && !r.done);
      return {
        riding: !!myBoard(),
        mode: b?.mode ?? null,
        speed: b ? boardSpeed(b) : 0,
        combo: score.view().points,
        line: live ? { id: live.line.id, next: live.next, t: live.t } : null,
        save: store.data().skate,
      };
    },
  };
}
