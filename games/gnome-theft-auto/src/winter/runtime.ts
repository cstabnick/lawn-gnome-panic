// Winter sports runtime (E12): rentals at the Woolly Sock Lodge, riding skis and the tea-tray sled (slideRider.ts), the
// Bootlace Tow, the Wool Run and the Tea-Tray Run with best times, Hot Cocoa, ice holes on Pail Pond, Bear Hug, the HUD
// line and the "ride again" button, achievements and the WinterApi hooks for story epics.
import { quietRegionBanner, setActivityOn, setTouchActivity } from '../activityMode';
import { clampToWorld, sweepCircleBoxes, wallBounce } from '../collide';
import { WORLD_HALF } from '../config';
import { addItem } from '../inventory';
import type { JobsDeps } from '../jobs/types';
import { PLACE_STYLE } from '../mapIcons';
import { inSite } from '../sites';
import { heightAt, surfaceAt } from '../terrain';
import type { Blip, InputState, Vehicle } from '../types';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import { getWeather } from '../weather';
import { formatTime, newRun, stepRun } from './course';
import { buildSnowdropSlope } from './hill';
import { createIceFishing } from './iceFishing';
import { buildPailPond } from './pond';
import { createWinterStore, emptyWinterSave, type WinterStore } from './save';
import { newSlide, slideSpeed, stepSlide } from './slideRider';
import { canGrab, startTow, stepTow, towPoint } from './tow';
import {
  BEAR_DECK, BLACK_DIAMOND_S, BEAR_HUG_TARGET, COCOA_HATCH, HUG_RANGE, LODGE, PAIL_POND, RANGE, RENT, RUNS, SHANTY,
  SKI, SKI_RACK, SLED, SLED_STACK, TOW, WINTER_ACHIEVEMENTS,
  type RunId, type RunResult, type RunState, type SlideGround, type SlideInput, type SlideState, type SlideTuning,
  type TowRide, type Winter, type WinterApi, type WinterDebug,
} from './types';
import { HOT_COCOA_ID, registerWinterApp, registerWinterItems } from './winterApp';

export interface WinterDeps extends JobsDeps {
  /** fishing.ts lendRod: give the Bent-Pin Twig Rod when the player has no rod. True when one was lent. */
  lendRod(): boolean;
  /** Every polar bear in the world now (critters list), for Bear Hug. */
  bears(): readonly { x: number; z: number }[];
  /** The player is on foot, alive and not in a cutscene (can drill, rent, buy). */
  onFoot(): boolean;
}

/** Optional test hook: where the save lives. */
export interface WinterOpts {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

type RideKind = 'snow-skis' | 'tea-tray-sled';

let api: WinterApi | null = null;

/** The installed runtime's hooks (null before installWinter). */
export function winterApi(): WinterApi | null {
  return api;
}

// ---- Pure helpers (tested) -------------------------------------------------------------------------------------------

/** The game's input as the slide rider reads it: steer, brake and push from the stick, hop from jump or the touch button. */
export function rideInput(inp: Pick<InputState, 'moveX' | 'moveY' | 'jump'>, hop: boolean): SlideInput {
  return {
    steer: Math.max(-1, Math.min(1, inp.moveX || 0)),
    brake: Math.max(0, -(inp.moveY || 0)),
    push: Math.max(0, inp.moveY || 0),
    jump: !!inp.jump || hop,
  };
}

export type LodgeKind = 'skis' | 'sled-take' | 'sled-buy' | 'sled-rent' | 'cocoa' | 'rod';
export interface LodgeAction { kind: LodgeKind; prompt: string }
export interface LodgeCtx {
  sledOwned: boolean;
  /** Finished the Tea-Tray Run at least once. */
  teaTrayDone: boolean;
  acorns: number;
  /** The shanty rod was already lent (or the player has a rod). */
  rodLent: boolean;
}

const near = (x: number, z: number, s: { x: number; z: number }, r: number): boolean => Math.hypot(x - s.x, z - s.z) <= r;

/** Which lodge or shanty action applies at (x, z), with its E prompt; null when none does. */
export function lodgeAction(x: number, z: number, ctx: LodgeCtx): LodgeAction | null {
  if (near(x, z, SKI_RACK, RANGE)) return { kind: 'skis', prompt: `Rent skis (${RENT.skis} Acorns)` };
  if (near(x, z, SLED_STACK, RANGE)) {
    if (ctx.sledOwned) return { kind: 'sled-take', prompt: 'Take your tea tray' };
    if (ctx.teaTrayDone && ctx.acorns >= RENT.ownSled) {
      return { kind: 'sled-buy', prompt: `Buy a tea tray to keep (${RENT.ownSled} Acorns)` };
    }
    return { kind: 'sled-rent', prompt: `Rent a tea tray (${RENT.sled} Acorns)` };
  }
  if (near(x, z, COCOA_HATCH, RANGE)) return { kind: 'cocoa', prompt: `Buy Hot Cocoa (${RENT.cocoa} Acorns)` };
  if (!ctx.rodLent && near(x, z, SHANTY, RANGE + 1)) return { kind: 'rod', prompt: 'Borrow a jigging rod from Theo' };
  return null;
}

/** A tuning for fresh powder: snow grips a little slower. */
export function powderTune(t: SlideTuning): SlideTuning {
  return { ...t, muSnow: t.muSnow * 0.85 };
}

/** Pitch and roll of a body on a ground normal, for a heading (the same maths vehicles.ts syncVehicleMesh uses). */
export function tiltOf(nx: number, ny: number, nz: number, yaw: number): { pitch: number; roll: number } {
  const s = Math.sin(yaw);
  const c = Math.cos(yaw);
  return { pitch: Math.atan2(nx * s + nz * c, ny), roll: Math.atan2(-(nx * c - nz * s), ny) };
}

// ---- Per-ride state --------------------------------------------------------------------------------------------------

interface Ride {
  slide: SlideState;
  runs: RunState[];
  tow: TowRide | null;
  prevX: number;
  prevZ: number;
  /** Seconds before the tow may be grabbed again after letting go. */
  grabLock: number;
}

const GROUND: SlideGround = {
  height: heightAt,
  surface: (x, z) => {
    const k = surfaceAt(x, z);
    return k === 'snow' ? 'snow' : k === 'ice' ? 'ice' : 'other';
  },
};

const tuneOf = (kind: Vehicle['kind']): SlideTuning => (kind === 'snow-skis' ? SKI : SLED);
const isRide = (v: Vehicle | null | undefined): v is Vehicle => !!v && (v.kind === 'snow-skis' || v.kind === 'tea-tray-sled');
const AWAY_M = 400;
const RIDE_AGAIN_S = 8;
const BEAR_TICK_S = 0.5;
/** How close to the tow base the grab hint and button show. */
const BASE_HINT_M = 12;

// ---- HUD -------------------------------------------------------------------------------------------------------------

interface WinterHud {
  /** Set the pill text; empty hides it. */
  setLine(text: string): void;
  setButtons(b: { hop: boolean; letGo: boolean; grab: boolean; again: boolean }): void;
  show(on: boolean): void;
}

interface HudHooks {
  hop(): void;
  letGo(): void;
  grab(): void;
  again(): void;
}

function buildHud(ui: HTMLElement, hooks: HudHooks): WinterHud {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;pointer-events:none;display:none;z-index:20;';
  const pill = document.createElement('div');
  pill.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 52px);'
    + 'max-width:92vw;padding:6px 12px;border-radius:999px;background:rgba(10,16,24,.72);color:#e8f4ff;font:600 14px/1.3 system-ui,sans-serif;'
    + 'text-align:center;pointer-events:none;white-space:normal;';
  const col = document.createElement('div');
  // Above the activity cluster's Exit button (bottom-right) and the move stick. Lower on a short landscape phone.
  const short = typeof matchMedia === 'function' ? matchMedia('(max-height:500px)') : null;
  const colBottom = (): string => `calc(env(safe-area-inset-bottom,0px) + ${short?.matches ? 110 : 260}px)`;
  col.style.cssText = `position:absolute;left:calc(env(safe-area-inset-left,0px) + 12px);bottom:${colBottom()};`
    + 'display:flex;flex-direction:column;gap:8px;pointer-events:none;';
  short?.addEventListener?.('change', () => { col.style.bottom = colBottom(); });
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const make = (label: string, fn: () => void): HTMLElement => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'min-width:88px;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.5);'
      + 'background:rgba(30,60,100,.85);color:#fff;font:700 15px system-ui,sans-serif;pointer-events:auto;touch-action:manipulation;display:none;';
    b.addEventListener?.('click', fn);
    col.appendChild(b);
    return b;
  };
  const bHop = make('Hop', hooks.hop);
  const bLet = make('Let go', hooks.letGo);
  const bGrab = make('Grab tow', hooks.grab);
  const bAgain = make('Ride again', hooks.again);
  root.appendChild(pill);
  root.appendChild(col);
  ui.appendChild(root);
  return {
    setLine(text) {
      if (pill.textContent !== text) pill.textContent = text;
      pill.style.display = text ? 'block' : 'none';
    },
    setButtons(b) {
      bHop.style.display = coarse && b.hop ? 'block' : 'none';
      bLet.style.display = coarse && b.letGo ? 'block' : 'none';
      bGrab.style.display = coarse && b.grab ? 'block' : 'none';
      bAgain.style.display = b.again ? 'block' : 'none';
    },
    show(on) {
      root.style.display = on ? 'block' : 'none';
    },
  };
}

// ---- Install ---------------------------------------------------------------------------------------------------------

export function installWinter(deps: WinterDeps, opts?: WinterOpts): Winter {
  const store: WinterStore = createWinterStore(opts?.storage);
  registerWinterItems();
  const hill = buildSnowdropSlope(deps.scene);
  const pond = buildPailPond(deps.scene);
  deps.world.boxes.push(...hill.boxes, ...pond.boxes);
  const ice = createIceFishing({
    scene: deps.scene,
    surfaceAt,
    heightAt,
    toast: (t) => deps.hud.toast(t, 3000),
    play: () => deps.play('shutter'),
    onHole: () => { store.recordHole(); },
  });

  const listeners = new Set<(r: RunResult) => void>();
  const rides = new Map<Vehicle, Ride>();
  const rented: Vehicle[] = [];
  let t = 0;
  let hopPressed = false;
  let letGoPressed = false;
  let grabPressed = false;
  let lastRunId: RunId | null = null;
  let againT = 0;
  let rodLent = false;
  let bearT = 0;
  let cleanT = 0;
  let powderToasted = false;
  let toldTow = false;

  const toast = (text: string): void => deps.hud.toast(text, 3000);
  const myRide = (): Vehicle | null => {
    const v = deps.player.vehicle;
    return isRide(v) && v.driver === 'player' ? v : null;
  };

  // ---- Rides: spawn, rent, remove ----

  function removeRide(v: Vehicle): void {
    rides.delete(v);
    const i = rented.indexOf(v);
    if (i >= 0) rented.splice(i, 1);
    const j = deps.vehicles.indexOf(v);
    if (j >= 0) deps.vehicles.splice(j, 1);
    removeVehicle(deps.scene, v);
  }

  /** Drop the oldest unridden rental of this kind while RENT.max exist. */
  function makeRoom(kind: RideKind): void {
    for (;;) {
      const same = rented.filter((v) => v.kind === kind);
      if (same.length < RENT.max) return;
      const old = same.find((v) => v.driver === 'none');
      if (!old) return;
      removeRide(old);
    }
  }

  function spawnRide(kind: RideKind, x: number, z: number, yaw: number): Vehicle {
    makeRoom(kind);
    const v = createVehicle(deps.scene, kind, x, z, yaw);
    v.y = heightAt(x, z);
    deps.vehicles.push(v);
    rented.push(v);
    return v;
  }

  function sit(v: Vehicle): void {
    rides.delete(v);
    deps.seatPlayer(v);
  }

  // ---- The Ride state and its runs ----

  function newRide(v: Vehicle): Ride {
    return {
      slide: newSlide(v.x, v.z, v.yaw, GROUND),
      runs: RUNS.filter((r) => r.ride === v.kind).map((r) => newRun(r)),
      tow: null,
      prevX: v.x,
      prevZ: v.z,
      grabLock: 0,
    };
  }

  function abortRuns(r: Ride): void {
    r.runs = r.runs.map((s) => (s.phase === 'running' ? newRun(s.run) : s));
  }

  function finishRun(v: Vehicle, ride: Ride, state: RunState, result: Omit<RunResult, 'ride'>): void {
    const rec = store.recordRun(result.id, result.seconds, result.clean);
    const best = store.data().best[result.id] ?? result.seconds;
    if (result.id === 'tea-tray-run') deps.unlock(WINTER_ACHIEVEMENTS.teaTray);
    else {
      deps.unlock(WINTER_ACHIEVEMENTS.firstTracks);
      if (result.clean && result.seconds <= BLACK_DIAMOND_S) deps.unlock(WINTER_ACHIEVEMENTS.blackDiamond);
    }
    deps.hud.callout?.(formatTime(result.seconds), rec.best ? 'New best!' : `Best ${formatTime(best)}`);
    lastRunId = result.id;
    againT = RIDE_AGAIN_S;
    const full: RunResult = { ...result, ride: v.kind };
    for (const cb of [...listeners]) cb(full);
    ride.runs[ride.runs.indexOf(state)] = newRun(state.run);
  }

  const powderOn = (x: number, z: number): boolean => {
    const w = getWeather();
    return w.kind === 'snow' && w.intensity > 0.3 && inSite('ski-hill', x, z) && GROUND.surface(x, z) === 'snow';
  };

  // ---- stepRider ----

  function letGoTow(v: Vehicle, ride: Ride, atTop: boolean): void {
    const s = ride.slide;
    ride.tow = null;
    ride.grabLock = 1;
    if (atTop) {
      s.yaw = 0;
      s.vx = 0;
      s.vz = 0;
      toast('Top of Snowdrop Slope. The Wool Run starts west of here.');
    }
    v.speed = 0;
  }

  function stepRider(v: Vehicle, inp: InputState, dt: number): void {
    // Getting in gives every ground vehicle a physics chassis (app.ts takeWheel); syncVehicleMesh then places the mesh
    // (and the seated gnome) from that chassis, which never moves here. The slide body is the only physics on a ride.
    v.sim = undefined;
    let ride = rides.get(v);
    if (!ride) {
      ride = newRide(v);
      rides.set(v, ride);
    }
    const s = ride.slide;
    const hop = hopPressed;
    hopPressed = false;
    const input = rideInput(inp, hop);
    const letGo = letGoPressed;
    letGoPressed = false;
    const grab = grabPressed;
    grabPressed = false;
    ride.grabLock = Math.max(0, ride.grabLock - dt);

    if (!ride.tow && ride.grabLock <= 0 && canGrab(s.x, s.z, slideSpeed(s)) && (input.push > 0.5 || grab)) {
      ride.tow = startTow();
      abortRuns(ride);
      if (!toldTow) toast('Hold on. Let go at the top.');
      toldTow = true;
    }

    if (ride.tow) {
      const tow = ride.tow;
      stepTow(tow, dt);
      const p = towPoint(tow.s);
      s.x = p.x;
      s.z = p.z;
      s.y = heightAt(p.x, p.z);
      s.yaw = p.yaw;
      s.vx = Math.sin(p.yaw) * TOW.speed;
      s.vz = Math.cos(p.yaw) * TOW.speed;
      s.vy = 0;
      s.grounded = true;
      writeBack(v, ride, dt);
      if (tow.done) letGoTow(v, ride, true);
      else if (input.jump || input.brake > 0.5 || letGo) letGoTow(v, ride, false);
      ride.prevX = v.x;
      ride.prevZ = v.z;
      return;
    }
    toldTow = false;

    const powder = powderOn(s.x, s.z);
    if (powder && !powderToasted) {
      powderToasted = true;
      toast('Fresh powder!');
    } else if (!powder && getWeather().kind !== 'snow') powderToasted = false;
    const tune = powder ? powderTune(tuneOf(v.kind)) : tuneOf(v.kind);

    const ox = s.x;
    const oz = s.z;
    const ev = stepSlide(s, input, GROUND, tune, dt);
    // Walls: slide along them, tumble on a hard hit.
    const hit = sweepCircleBoxes(ox, oz, s.x, s.z, v.spec.radius, deps.world.boxes, s.y);
    let tumble = false;
    if (hit.hit) {
      s.x = hit.x;
      s.z = hit.z;
      const b = wallBounce(s.vx, s.vz, hit.nx, hit.nz);
      s.vx = b.vx;
      s.vz = b.vz;
      tumble = b.impact > tune.crashSpeed;
    }
    const edge = clampToWorld(s.x, s.z, WORLD_HALF, v.spec.radius);
    if (edge.hit) {
      s.x = edge.x;
      s.z = edge.z;
    }
    if (ev?.t === 'landed') {
      if (ev.air > 0.6) deps.play('stunt');
      if (ev.spins >= 1) toast(`Spin! (${ev.spins})`);
    }

    writeBack(v, ride, dt);

    if (tumble) {
      abortRuns(ride);
      deps.throwPlayer(v, s.vx * 0.5, 3, s.vz * 0.5);
      toast('Tumble! Nobody cracks on snow.');
      rides.delete(v);
      return;
    }

    for (const state of ride.runs) {
      const e = stepRun(state, ride.prevX, ride.prevZ, v.x, v.z, dt);
      if (!e) continue;
      if (e.t === 'start') deps.hud.callout?.('GO!', state.run.name);
      else if (e.t === 'gate') {
        if (e.ok) deps.play('whistle');
        else toast('Missed gate (+3 s)');
      } else finishRun(v, ride, state, e.result);
    }
    ride.prevX = v.x;
    ride.prevZ = v.z;
  }

  /** The slide state onto the vehicle and its mesh, tilted to the snow. */
  function writeBack(v: Vehicle, ride: Ride, dt: number): void {
    const s = ride.slide;
    v.x = s.x;
    v.y = s.y;
    v.z = s.z;
    v.yaw = s.yaw;
    v.speed = s.vx * Math.sin(s.yaw) + s.vz * Math.cos(s.yaw);
    v.vy = s.vy;
    syncVehicleMesh(v, dt);
    const tilt = tiltOf(s.nx, s.ny, s.nz, s.yaw);
    v.object.rotation.set(tilt.pitch, s.yaw, tilt.roll - s.lean * (v.kind === 'snow-skis' ? 0.25 : 0.15), 'YXZ');
  }

  // ---- On foot ----

  function lodgeCtx(): LodgeCtx {
    return {
      sledOwned: store.hasSled(),
      teaTrayDone: (store.data().runs['tea-tray-run'] ?? 0) > 0,
      acorns: deps.economy.state().acorns,
      rodLent,
    };
  }

  function takeRide(kind: RideKind, spot: { x: number; z: number }): void {
    const x = spot.x + 3;
    const v = spawnRide(kind, x, spot.z, 0);
    sit(v);
  }

  function prompt(x: number, z: number): string | null {
    if (!deps.onFoot()) return null;
    const a = lodgeAction(x, z, lodgeCtx());
    if (a) return a.prompt;
    return ice.prompt(x, z);
  }

  function interact(x: number, z: number): boolean {
    if (!deps.onFoot()) return false;
    const a = lodgeAction(x, z, lodgeCtx());
    if (!a) return ice.interact(x, z);
    switch (a.kind) {
      case 'skis':
        if (!deps.economy.spend(RENT.skis, 'Woolly Sock Lodge')) {
          toast("Gentian: 'Skis are 8 Acorns. Charm is free and does not work.'");
        } else takeRide('snow-skis', SKI_RACK);
        break;
      case 'sled-take':
        takeRide('tea-tray-sled', SLED_STACK);
        break;
      case 'sled-buy':
        if (deps.economy.spend(RENT.ownSled, 'Woolly Sock Lodge')) {
          store.buySled();
          toast("Tea tray is yours. The Snowdrop app can drop it on any snow.");
        }
        break;
      case 'sled-rent':
        if (!deps.economy.spend(RENT.sled, 'Woolly Sock Lodge')) {
          toast("Gentian: 'A tea tray is 4 Acorns. Optimism is not accepted.'");
        } else takeRide('tea-tray-sled', SLED_STACK);
        break;
      case 'cocoa':
        if (!deps.economy.spend(RENT.cocoa, 'Woolly Sock Lodge')) toast('Not enough Acorns for Hot Cocoa.');
        else if (addItem(HOT_COCOA_ID) === 0) {
          deps.economy.earn(RENT.cocoa, 'Hot Cocoa refund');
          toast('Your bag is full.');
        } else toast('Hot Cocoa in your bag. Three marshmallows, by the rules.');
        break;
      case 'rod':
        rodLent = true;
        toast(deps.lendRod() ? "Theo: 'Bring it back. Or don't. It is a bent pin.'" : "Theo: 'You have a rod. Use it.'");
        break;
    }
    return true;
  }

  // ---- Runs from outside ----

  const winterApiImpl: WinterApi = {
    startRun(id) {
      const why = deps.blocked();
      if (why) return why;
      const def = RUNS.find((r) => r.id === id);
      if (!def) return 'No such run.';
      const pv = deps.player.vehicle;
      if (pv && !isRide(pv)) return 'Get out first.';
      const x = def.start.x;
      const z = def.start.z - 8;
      let v: Vehicle | null = pv && pv.kind === def.ride ? pv : null;
      if (!v) {
        if (pv) {
          // On the other winter ride: leave it where it is.
          pv.driver = 'none';
        }
        v = rented.find((r) => r.kind === def.ride && r.driver === 'none') ?? null;
      }
      if (v) {
        v.x = x;
        v.z = z;
        v.yaw = 0;
        v.y = heightAt(x, z);
        v.speed = 0;
        v.vy = 0;
        syncVehicleMesh(v, 0);
      } else v = spawnRide(def.ride, x, z, 0);
      if (pv === v) rides.delete(v);
      else sit(v);
      againT = 0;
      if (typeof document !== 'undefined' && document.body) quietRegionBanner(8000);
      return null;
    },
    isOnSlope: (x, z) => inSite('ski-hill', x, z) && surfaceAt(x, z) === 'snow',
    onFinish(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };

  function dropSled(): string | null {
    if (!store.hasSled()) return 'Buy a tea tray at the Woolly Sock Lodge first.';
    if (!deps.onFoot()) return 'Get out first.';
    const p = deps.player;
    const k = GROUND.surface(p.x, p.z);
    if (k !== 'snow' && k !== 'ice') return 'You need snow or ice.';
    const v = spawnRide('tea-tray-sled', p.x, p.z, p.yaw);
    sit(v);
    return null;
  }

  registerWinterApp({ store: () => store, dropSled, startRun: winterApiImpl.startRun, toast });
  api = winterApiImpl;

  // ---- HUD ----

  const hud = buildHud(deps.ui, {
    hop: () => { hopPressed = true; },
    letGo: () => { letGoPressed = true; },
    grab: () => { grabPressed = true; },
    again: () => {
      if (lastRunId) {
        const why = winterApiImpl.startRun(lastRunId);
        if (why) toast(why);
      }
    },
  });

  function refreshHud(): void {
    const v = myRide();
    const p = deps.player;
    const base = Math.hypot(p.x - TOW.base.x, p.z - TOW.base.z) <= BASE_HINT_M;
    if (!v && !base) {
      hud.show(false);
      return;
    }
    hud.show(true);
    const ride = v ? rides.get(v) : undefined;
    const parts: string[] = [];
    if (v) {
      parts.push(`${Math.round(Math.abs(v.speed) * 3.6)} km/h`);
      const run = ride?.runs.find((r) => r.phase === 'running');
      if (run) {
        const n = run.run.gates.length;
        parts.push(n > 0 ? `${formatTime(run.t)} gates ${run.passed + run.missed}/${n}` : formatTime(run.t));
      }
      const shown = run ?? ride?.runs[0];
      const best = shown ? store.data().best[shown.run.id] : undefined;
      if (best !== undefined) parts.push(`best ${formatTime(best)}`);
    }
    const towing = !!ride?.tow;
    const atBase = !!v && !towing && canGrab(v.x, v.z, Math.abs(v.speed));
    if (atBase) parts.push('Push forward to grab the Bootlace Tow');
    else if (towing) parts.push('On the Bootlace Tow');
    hud.setLine(parts.join(' | '));
    hud.setButtons({ hop: !!v && !towing, letGo: towing, grab: atBase, again: againT > 0 });
  }

  // ---- Per frame ----

  function update(dt: number): void {
    t += dt;
    const p = deps.player;
    hill.update(dt, t, p.x, p.z);
    pond.update(dt, t, p.x, p.z);
    ice.update(dt, p.x, p.z, deps.onFoot());
    if (againT > 0) againT = Math.max(0, againT - dt);
    if (rodLent && !near(p.x, p.z, SHANTY, RANGE + 6)) rodLent = false;

    bearT += dt;
    if (bearT >= BEAR_TICK_S) {
      bearT = 0;
      if (deps.onFoot()) {
        for (const b of deps.bears()) {
          if (Math.hypot(b.x - p.x, b.z - p.z) > HUG_RANGE) continue;
          const key = `${Math.round(b.x)},${Math.round(b.z)}`;
          if (store.data().hugged.includes(key)) continue;
          const n = store.hug(key);
          deps.increment(WINTER_ACHIEVEMENTS.bearHug, 1);
          toast(`The polar bear lets you stand there. (${n}/${BEAR_HUG_TARGET})`);
        }
      }
    }

    // Drop state for rides nobody is on (a tumble, getting off).
    for (const [v, r] of rides) {
      if (v.driver !== 'player') {
        abortRuns(r);
        rides.delete(v);
      }
    }
    cleanT += dt;
    if (cleanT >= BEAR_TICK_S) {
      cleanT = 0;
      for (const v of [...rented]) {
        if (v.driver === 'none' && Math.hypot(v.x - p.x, v.z - p.z) > AWAY_M) removeRide(v);
      }
    }
    // Touch: on a sled or skis the cluster shows only Exit (the winter buttons live in their own column).
    const riding = myRide() !== null;
    setActivityOn('winter', riding);
    if (typeof document !== 'undefined' && document.body) {
      setTouchActivity('winter', riding ? { stick: true, buttons: ['enter'] } : null);
    }
    refreshHud();
  }

  const w: Winter = {
    drives: (v) => v.driver === 'player' && isRide(v),
    stepRider,
    update,
    blips(): Blip[] {
      return [
        { x: LODGE.x, z: LODGE.z, kind: 'ski', label: 'Snowdrop Slope', color: PLACE_STYLE.ski.color },
        { x: BEAR_DECK.x, z: BEAR_DECK.z, kind: 'bears', label: 'Bear Deck', color: PLACE_STYLE.bears.color },
        { x: PAIL_POND.x, z: PAIL_POND.z, kind: 'icefish', label: 'Pail Pond', color: PLACE_STYLE.icefish.color },
      ];
    },
    prompt,
    interact,
    onCatch(water) {
      if (water !== 'ice') return;
      store.recordIceCatch();
      deps.increment(WINTER_ACHIEVEMENTS.iceStation, 1);
    },
    api: winterApiImpl,
    debug(): WinterDebug {
      const v = myRide();
      const ride = v ? rides.get(v) : undefined;
      const run = ride?.runs.find((r) => r.phase === 'running') ?? ride?.runs[0];
      return {
        riding: v ? v.kind : null,
        speed: v ? Math.abs(v.speed) : 0,
        towing: !!ride?.tow,
        run: run ? { id: run.run.id, phase: run.phase, t: run.t, next: run.next, missed: run.missed } : null,
        holes: ice.holes().length,
        save: { ...emptyWinterSave(), ...store.data() },
      };
    },
  };
  return w;
}
