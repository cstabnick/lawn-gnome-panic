// Hedgeworth Links at runtime (batch 3 E15): builds the yard, course, buildings and life, and runs a round of golf:
// the Kicked Board, the carts, rustling through giant plants, lost balls, molehills, the round itself and the blips.
// app.ts installs it like winter.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { CAST_INTROS } from '../cutscene/castIntros';
import { showCharacterIntro } from '../cutscene/introCard';
import { PLACE_STYLE } from '../mapIcons';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { JobsDeps } from '../jobs/types';
import type { Blip, InputState, Vehicle } from '../types';
import { createVehicle, removeVehicle } from '../vehicles';
import { buildHedgeworthBuildings, defineClubhouseInterior, registerHedgeworthHomes } from './clubhouse';
import { registerGolfApp } from './golfApp';
import { buildCourseGround } from './greens';
import { createGolfHud } from './hud';
import { buildHedgeworthLife } from './life';
import {
  addressBall, ballWorld, cardView, cycleClub, hudView, newRound, nextHole, tapSwing, tickRound, turnAim,
} from './round';
import { createGolfStore } from './save';
import { registerGolfSounds } from './sounds';
import {
  BOARD_BREAK_SPEED, BOARD_KICK_RANGE, CART_SPOTS, CLUBHOUSE, GOLF_ACH, GOLF_ORIGIN, HEDGE_ARCHES, HOLES, KICKED_BOARD,
  LOST_BALLS, MOLEHILLS, PEOPLE_SPOTS, PICK_RANGE, SOFT_SLOW_PER_S, inYard,
  type Golf, type GolfApi, type GolfStore, type HudAction, type RoundEvent, type RoundState,
} from './types';
import { createGolfView } from './view';
import { buildYard } from './yard';

export interface GolfDeps extends JobsDeps {
  /** True when the gnome is on foot and free (no vehicle, not airborne, no cutscene, alive). */
  onFoot(): boolean;
  camera: THREE.PerspectiveCamera;
}

export interface GolfOpts {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

let current: GolfApi | null = null;
/** The installed runtime's API (quests, the Gnomlet app), or null before install. */
export function golfApi(): GolfApi | null {
  return current;
}

const TEE_PROMPT_RANGE = 4;
const ADDRESS_RANGE = 2.5;
const FAR_FROM_YARD = 300;
const AUTO_QUIT_OUTSIDE = 60;
const CART_CHECK_S = 20;
const CART_STRAY = 400;
const CART_RESPAWN_PLAYER_FAR = 80;
const INTRO_RANGE = 8;
const ARCH_RANGE = 2;
const LOOSE_BALL_R = 0.09;
const BALL_PREFAB_R = 0.016;
const RUSTLE_GAP_S = 0.8;

const face = (yaw: number): { x: number; z: number } => ({ x: Math.sin(yaw), z: Math.cos(yaw) });

interface LooseSpot { id: string; x: number; z: number; obj: THREE.Object3D | null }

export function installGolf(deps: GolfDeps, opts?: GolfOpts): Golf {
  const store: GolfStore = createGolfStore(opts?.storage);
  registerGolfSounds();
  registerHedgeworthHomes();
  const yard = buildYard(deps.scene, { boardBroken: store.data().boardBroken });
  const ground = buildCourseGround(deps.scene);
  const buildings = buildHedgeworthBuildings(deps.scene);
  const life = buildHedgeworthLife(deps.scene);
  deps.world.boxes.push(...yard.boxes, ...ground.boxes, ...buildings.boxes, ...life.boxes);
  if (!store.data().boardBroken) deps.world.boxes.push(yard.boardBox);
  const hud = createGolfHud(deps.ui);
  const view = createGolfView(deps.scene, deps.camera);
  let t = 0;
  let round: RoundState | null = null;
  let seed = Date.now() & 0xffff;
  let broken = store.data().boardBroken;
  let syncT = 0;
  let cartT = 0;
  let rustleT = 0;
  let aimHold = 0;
  let cardOpen = false;
  let prevUp = false;
  let prevDown = false;
  let prevFire = false;
  const listeners = new Set<(e: { hole: number; strokes: number; par: number }) => void>();
  const toast = (s: string): void => deps.hud.toast(s, 3000);

  // ---- Lost balls and molehills ----
  function makePicks(list: readonly { id: string; x: number; z: number }[], done: readonly string[], prefab: string, scale: number, lift: number): LooseSpot[] {
    return list.map((p) => {
      let obj: THREE.Object3D | null = null;
      if (!done.includes(p.id) && getPrefab(prefab)) {
        obj = buildPrefab(prefab, { scale });
        obj.position.set(p.x, heightAt(p.x, p.z) + lift, p.z);
        deps.scene.add(obj);
      }
      return { id: p.id, x: p.x, z: p.z, obj };
    });
  }
  const balls = makePicks(LOST_BALLS, store.data().ballsFound, 'golf-ball', LOOSE_BALL_R / BALL_PREFAB_R, LOOSE_BALL_R);
  const hills = makePicks(MOLEHILLS, store.data().molehills, 'mole-hill', 1, 0);
  const hide = (p: LooseSpot): void => { if (p.obj) p.obj.visible = false; };

  // ---- Carts ----
  const carts: { spot: (typeof CART_SPOTS)[number]; v: Vehicle }[] = [];
  function spawnCart(spot: (typeof CART_SPOTS)[number]): Vehicle {
    const v = createVehicle(deps.scene, 'golf-cart', spot.x, spot.z, spot.yaw);
    v.y = heightAt(spot.x, spot.z);
    deps.vehicles.push(v);
    return v;
  }
  for (const spot of CART_SPOTS) carts.push({ spot, v: spawnCart(spot) });
  function checkCarts(): void {
    const me = deps.player;
    for (const c of carts) {
      const gone = !deps.vehicles.includes(c.v);
      const stray = c.v.driver === 'none' && Math.hypot(c.v.x - GOLF_ORIGIN.x, c.v.z - GOLF_ORIGIN.z) > CART_STRAY;
      if (!gone && !stray) continue;
      if (Math.hypot(me.x - c.spot.x, me.z - c.spot.z) <= CART_RESPAWN_PLAYER_FAR) continue;
      if (!gone) {
        const i = deps.vehicles.indexOf(c.v);
        if (i >= 0) deps.vehicles.splice(i, 1);
        removeVehicle(deps.scene, c.v);
      }
      c.v = spawnCart(c.spot);
    }
  }

  // ---- The Kicked Board ----
  function doBreakBoard(announce: boolean): void {
    if (broken) return;
    broken = true;
    const i = deps.world.boxes.indexOf(yard.boardBox);
    if (i >= 0) deps.world.boxes.splice(i, 1);
    yard.breakBoard();
    store.breakBoard();
    playAt('board-crack', KICKED_BOARD);
    deps.unlock(GOLF_ACH.kickedBoard);
    if (announce) toast('The Kicked Board gives. Welcome to Hedgeworth.');
  }
  function nearBoard(x: number, z: number, range: number): boolean {
    const dz = Math.max(0, Math.abs(z - KICKED_BOARD.z) - KICKED_BOARD.half);
    return Math.hypot(x - KICKED_BOARD.x, dz) <= range;
  }
  function checkBoardRam(): void {
    const v = deps.player.vehicle;
    if (broken || !v || v.driver !== 'player' || Math.abs(v.speed) < BOARD_BREAK_SPEED) return;
    const b = yard.boardBox;
    const dx = Math.max(b.minX - v.x, 0, v.x - b.maxX);
    const dz = Math.max(b.minZ - v.z, 0, v.z - b.maxZ);
    if (Math.hypot(dx, dz) <= v.spec.radius + 0.8) doBreakBoard(true);
  }

  // ---- Soft plants and arches ----
  function softPlants(dt: number): void {
    const v = deps.player.vehicle;
    rustleT -= dt;
    if (!v || v.driver !== 'player') return;
    for (const s of yard.soft) {
      if (Math.hypot(v.x - s.x, v.z - s.z) > s.r) continue;
      v.speed *= Math.exp(-SOFT_SLOW_PER_S * dt);
      if (rustleT <= 0 && Math.abs(v.speed) > 0.5) {
        playAt('hedge-rustle', v);
        rustleT = RUSTLE_GAP_S;
      }
      return;
    }
  }
  const archSide: (number | null)[] = HEDGE_ARCHES.map(() => null);
  function arches(): void {
    const v = deps.player.vehicle;
    const cart = v && v.driver === 'player' && v.kind === 'golf-cart' ? v : null;
    HEDGE_ARCHES.forEach((a, i) => {
      if (!cart || Math.hypot(cart.x - a.x, cart.z - a.z) > ARCH_RANGE) { archSide[i] = null; return; }
      const f = face(a.yaw);
      const side = Math.sign((cart.x - a.x) * f.x + (cart.z - a.z) * f.z);
      const prev = archSide[i];
      archSide[i] = side;
      if (prev !== null && prev !== 0 && side !== 0 && prev !== side) deps.unlock(GOLF_ACH.arch);
    });
  }

  // ---- Intro cards ----
  const introduced = new Set<string>();
  function intros(): void {
    if (!deps.onFoot()) return;
    if (round && (round.phase === 'aim' || round.phase === 'swing' || round.phase === 'flight')) return;
    for (const key of ['peony', 'basil', 'thrift'] as const) {
      const s = PEOPLE_SPOTS[key];
      if (introduced.has(key) || Math.hypot(deps.player.x - s.x, deps.player.z - s.z) > INTRO_RANGE) continue;
      introduced.add(key);
      try {
        void showCharacterIntro(CAST_INTROS[key]).catch(() => {});
      } catch { /* no DOM */ }
      return;
    }
  }

  // ---- The round ----
  const addressing = (): boolean => !!round && (round.phase === 'aim' || round.phase === 'swing' || round.phase === 'flight');
  const behind = (x: number, z: number, yaw: number, d: number): { x: number; z: number } => ({ x: x - Math.sin(yaw) * d, z: z - Math.cos(yaw) * d });
  function putPlayer(x: number, z: number, yaw: number): void {
    const p = deps.player;
    const v = p.vehicle;
    if (v) { v.x = x; v.z = z; v.y = heightAt(x, z); v.yaw = yaw; v.speed = 0; }
    p.x = x; p.z = z; p.y = heightAt(x, z); p.yaw = yaw;
  }
  function standAtBall(s: RoundState): void {
    // Beside the ball on its left (left of the aim), facing the aim.
    putPlayer(s.ball.x + Math.cos(s.aimYaw) * 0.6, s.ball.z - Math.sin(s.aimYaw) * 0.6, s.aimYaw);
  }
  function quitRound(): void {
    round = null;
    aimHold = 0;
    cardOpen = false;
    hud.card(null);
    hud.show(false);
    view.update(0, null);
  }
  function startRound(hole = 0): string | null {
    const why = deps.blocked();
    if (why) return why;
    const p = deps.player;
    if (p.vehicle) return 'Get out of the cart first.';
    if (Math.hypot(p.x - GOLF_ORIGIN.x, p.z - GOLF_ORIGIN.z) > FAR_FROM_YARD) return 'Too far from Hedgeworth.';
    if (!broken && !inYard(p.x, p.z)) return 'The fence is in the way. Find the loose board.';
    const h = Math.max(0, Math.min(HOLES.length - 1, Math.floor(hole)));
    round = newRound(seed++, h);
    const b = behind(round.ball.x, round.ball.z, round.aimYaw, 1.5);
    putPlayer(b.x, b.z, round.aimYaw);
    hud.show(true);
    return null;
  }
  function handleEvents(events: RoundEvent[]): void {
    const s = round;
    if (!s) return;
    for (const e of events) {
      if (e.kind === 'shot') playAt(e.club === 'PT' ? 'golf-putt' : 'golf-tock', ballWorld(s));
      else if (e.kind === 'water') playAt('golf-splash-reed', ballWorld(s));
      else if (e.kind === 'holed') {
        playAt('golf-cup', ballWorld(s));
        store.recordHole(e.hole, e.strokes, e.par);
        if (e.strokes === 1) deps.unlock(GOLF_ACH.ace);
        if (s.birdieRun >= 2) deps.unlock(GOLF_ACH.birdies);
        for (const cb of [...listeners]) cb({ hole: e.hole, strokes: e.strokes, par: e.par });
        cardOpen = true;
        hud.card(cardView(s, store.data().best));
      } else if (e.kind === 'picked-up') {
        cardOpen = true;
        hud.card(cardView(s, store.data().best));
      } else if (e.kind === 'round-done') {
        store.recordRound(e.total);
        deps.unlock(GOLF_ACH.card);
        cardOpen = true;
        hud.card(cardView(s, store.data().best));
      }
    }
  }
  function onAction(a: HudAction): void {
    const s = round;
    if (!s) return;
    if (a === 'swing') handleEvents(tapSwing(s));
    else if (a === 'aim-left') aimHold = 1;
    else if (a === 'aim-right') aimHold = -1;
    else if (a === 'aim-stop') aimHold = 0;
    else if (a === 'club-prev') cycleClub(s, -1);
    else if (a === 'club-next') cycleClub(s, 1);
    else if (a === 'card') {
      cardOpen = !cardOpen;
      hud.card(cardOpen ? cardView(s, store.data().best) : null);
    } else if (a === 'card-close') {
      cardOpen = false;
      hud.card(null);
      if (s.phase === 'done') quitRound();
    } else if (a === 'next-hole') {
      cardOpen = false;
      hud.card(null);
      handleEvents(nextHole(s));
    } else if (a === 'to-ball') {
      if (s.phase !== 'walk') return;
      const pin = HOLES[s.hole].pin;
      const yaw = Math.atan2(pin.x - s.ball.x, pin.z - s.ball.z);
      const b = behind(s.ball.x, s.ball.z, yaw, 1.5);
      putPlayer(b.x, b.z, yaw);
    } else if (a === 'quit') api.quitRound();
  }
  hud.onAction(onAction);

  function stepRound(dt: number, inp: InputState): void {
    const s = round;
    if (!s) return;
    const p = deps.player;
    const v = p.vehicle;
    if (p.health <= 0 || (v && v.kind !== 'golf-cart') || !inYard(p.x, p.z, -AUTO_QUIT_OUTSIDE)) {
      toast('Round abandoned.');
      quitRound();
      return;
    }
    if (v && s.phase === 'aim') s.phase = 'walk';
    const up = inp.moveY > 0.6;
    const down = inp.moveY < -0.6;
    const tap = inp.jump || (inp.fire && !prevFire);
    if (s.phase === 'aim') {
      turnAim(s, -inp.moveX + aimHold, dt);
      if (up && !prevUp) cycleClub(s, -1);
      if (down && !prevDown) cycleClub(s, 1);
    }
    if (tap && (s.phase === 'aim' || s.phase === 'swing')) handleEvents(tapSwing(s));
    prevUp = up; prevDown = down; prevFire = inp.fire;
    handleEvents(tickRound(s, dt));
    if (addressing()) standAtBall(s);
    const atBall = addressing() || (s.phase === 'walk' && Math.hypot(p.x - s.ball.x, p.z - s.ball.z) <= ADDRESS_RANGE);
    hud.set(hudView(s, atBall));
    view.update(dt, s);
  }

  // ---- Prompts ----
  interface Action { text: string; run(): void }
  function actionAt(x: number, z: number): Action | null {
    if (addressing()) return null;
    if (!broken && nearBoard(x, z, BOARD_KICK_RANGE)) return { text: 'Kick the loose board', run: () => doBreakBoard(true) };
    const s = round;
    if (s) {
      if (s.phase === 'walk' && Math.hypot(x - s.ball.x, z - s.ball.z) <= ADDRESS_RANGE) {
        return { text: 'Address the ball', run: () => { addressBall(s); standAtBall(s); } };
      }
    } else {
      for (const h of HOLES) {
        if (Math.hypot(x - h.tee.x, z - h.tee.z) <= TEE_PROMPT_RANGE) {
          return { text: `Tee off: hole ${h.number} (par ${h.par})`, run: () => { const why = startRound(h.index); if (why) toast(why); } };
        }
      }
    }
    for (const b of balls) {
      if (b.obj?.visible && Math.hypot(x - b.x, z - b.z) <= PICK_RANGE) {
        return {
          text: 'Pick up the lost ball',
          run: () => {
            if (!store.findBall(b.id)) return;
            hide(b);
            toast(`Lost ball (${store.data().ballsFound.length}/${LOST_BALLS.length})`);
          },
        };
      }
    }
    for (const m of hills) {
      if (m.obj?.visible && Math.hypot(x - m.x, z - m.z) <= PICK_RANGE) {
        return {
          text: 'Pat the molehill flat',
          run: () => {
            if (!store.flattenMolehill(m.id)) return;
            hide(m);
            deps.increment(GOLF_ACH.secret);
            toast("Thrift (whispering): 'Gently. They're asleep.'");
          },
        };
      }
    }
    return null;
  }

  const api: GolfApi = {
    startRound,
    quitRound,
    inRound: () => round !== null,
    boardBroken: () => broken || store.data().boardBroken,
    breakBoard: () => doBreakBoard(false),
    onHole(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    store: () => store,
  };
  current = api;
  defineClubhouseInterior({ store: () => store, startRound: (h) => api.startRound(h), toast });
  registerGolfApp({ store: () => store, api: () => current, toast });

  return {
    update(dt: number, inp: InputState) {
      t += dt;
      yard.update(dt, t);
      life.update(dt, t, deps.player.x, deps.player.z);
      syncT += dt;
      if (syncT >= 1) {
        syncT = 0;
        if (!broken && store.data().boardBroken) doBreakBoard(false);
      }
      checkBoardRam();
      cartT += dt;
      if (cartT >= CART_CHECK_S) { cartT = 0; checkCarts(); }
      softPlants(dt);
      arches();
      intros();
      if (round) stepRound(dt, inp);
      else view.update(dt, null);
    },
    prompt: (x, z) => actionAt(x, z)?.text ?? null,
    interact(x, z) {
      const a = actionAt(x, z);
      if (!a) return false;
      a.run();
      return true;
    },
    blips(): Blip[] {
      const out: Blip[] = [{ x: CLUBHOUSE.x, z: CLUBHOUSE.z, kind: 'golf', label: 'Hedgeworth Links', color: PLACE_STYLE.golf.color }];
      if (round) {
        const h = HOLES[round.hole];
        if (round.phase === 'walk') out.push({ x: round.ball.x, z: round.ball.z, kind: 'objective', quest: 'Your ball', color: '#ffffff' });
        out.push({ x: h.pin.x, z: h.pin.z, kind: 'objective', quest: `Hole ${h.number}`, color: '#ff5a3c' });
      }
      return out;
    },
    addressing,
    applyCamera: (dt) => view.applyCamera(round, dt),
    api,
    debug: () => ({ round, store: store.data(), boardBroken: api.boardBroken(), carts: carts.length }),
  };
}
