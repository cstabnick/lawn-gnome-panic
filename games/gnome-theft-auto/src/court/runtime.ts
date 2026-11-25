// Drainpipe Court at runtime (batch 3 E19): builds the court and its life, runs pickup games (@lawn/jam) and the
// shootaround, the HUD, the broadcast camera, achievements, the save and the CourtApi. app.ts installs it like golf.
import type * as THREE from 'three';
import { getMyGnome, type GnomeLook } from '@lawn/gnome';
import { DEFAULT_LOOK } from '../config';
import type { JobsDeps } from '../jobs/types';
import { PLACE_STYLE } from '../mapIcons';
import { playAt } from '../sound/bus';
import { registerFoundersApp } from '../sports/app';
import { sportsStore } from '../sports/save';
import { registerSportsSounds } from '../sports/sounds';
import { skateApi } from '../skate/runtime';
import { heightAt } from '../terrain';
import type { Blip, InputState } from '../types';
import { buildDrainpipeCourt } from './build';
import { disposePickup, newPickup, pickupResult, pickupView, stepPickup, type PickupGame } from './game';
import { courtControl, createCourtHud } from './hud';
import { buildCourtLife } from './life';
import { createCourtRender } from './render';
import { ballAt, isThree, newShoot, stepShoot, type ShootState } from './shootaround';
import {
  BALL_CAGE, COURT, COURT_ACH, COURT_ORIGIN, COURT_PEOPLE, COURT_RANGE, PICKUP, SCOREBOARD, SHOOT,
  type Court, type CourtApi, type CourtEvent, type CourtGameResult, type PickupOpts, type PickupView,
} from './types';
import { createCourtView } from './view';

export interface CourtDeps extends JobsDeps {
  /** True when the gnome is on foot and free (no vehicle, not airborne, no cutscene, alive). */
  onFoot(): boolean;
  camera: THREE.PerspectiveCamera;
}

export interface CourtOpts {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

let current: CourtApi | null = null;
/** The installed runtime's API (quests, the Gnomlet app), or null before install. */
export function courtApi(): CourtApi | null {
  return current;
}

/** Farther than this from the court and nothing can start. */
const FAR_FROM_COURT = 60;
/** The result card stays this long unless the player dismisses it. */
const CARD_S = 5;
/** E / quit presses this soon after a start are the same press that started it. */
const START_GRACE_S = 0.3;
/** The ball drops down the drainpipe this long after the swish. */
const DRAIN_DELAY_S = 0.35;

interface Playing {
  g: PickupGame;
  view: PickupView;
  names: [string, string];
  threes: number;
  dunks: number;
  prevShoot: boolean;
  age: number;
  /** Seconds left on the result card, or null while the game is on. */
  cardT: number | null;
}

interface Shooting {
  s: ShootState;
  age: number;
  /** Sounds due soon: [seconds, id, x, z]. */
  later: [number, string, number, number][];
}

export function installCourt(deps: CourtDeps, opts?: CourtOpts): Court {
  const store = sportsStore(opts?.storage);
  registerSportsSounds();
  const build = buildDrainpipeCourt(deps.scene);
  const life = buildCourtLife(deps.scene);
  deps.world.boxes.push(...build.boxes, ...life.boxes);
  const hud = createCourtHud(deps.ui);
  const look: GnomeLook = { ...DEFAULT_LOOK, ...getMyGnome()?.look };
  const render = createCourtRender(deps.scene, look);
  const view = createCourtView(deps.camera);
  const groundY = heightAt(COURT_ORIGIN.x, COURT_ORIGIN.z);
  const toast = (s: string): void => deps.hud.toast(s, 3000);
  const listeners = new Set<(r: CourtGameResult) => void>();
  let t = 0;
  let seed = Date.now() & 0xffff;
  let game: Playing | null = null;
  let shoot: Shooting | null = null;

  function putPlayer(x: number, z: number, yaw: number): void {
    const p = deps.player;
    const v = p.vehicle;
    if (v) { v.x = x; v.z = z; v.y = heightAt(x, z); v.yaw = yaw; v.speed = 0; }
    p.x = x; p.z = z; p.y = heightAt(x, z); p.yaw = yaw;
  }
  const showPlayer = (on: boolean): void => { deps.player.model.object.visible = on; };

  function refusal(): string | null {
    const why = deps.blocked();
    if (why) return why;
    const p = deps.player;
    if (p.vehicle) return 'Get out first.';
    if (Math.hypot(p.x - COURT.x, p.z - COURT.z) > FAR_FROM_COURT) return "Drainpipe Court is in Founders' Green, Downtown Turfton.";
    return null;
  }

  // ---- Pickup game ----
  function endGame(): void {
    const cur = game;
    if (!cur) return;
    game = null;
    disposePickup(cur.g);
    render.game(null, 0);
    hud.result(null);
    hud.show('none');
    view.apply(0, null);
    showPlayer(true);
  }

  function finishGame(cur: Playing): void {
    const r = pickupResult(cur.g);
    if (!r) return;
    const swish = r.opponents === 'swish';
    const [h, a] = r.score;
    store.recordGame({ won: r.won, margin: Math.abs(h - a), threes: cur.threes, dunks: cur.dunks, swish });
    let text: string;
    if (r.won) {
      deps.unlock(COURT_ACH.win);
      deps.economy.earn(swish ? PICKUP.swishAcorns : PICKUP.winAcorns, 'Drainpipe Court');
      text = swish
        ? `You beat Swish ${h}-${a}. He gives the stake back. He asked properly.`
        : `You and Pansy win ${h}-${a}. Old Burdock chalks it up.`;
    } else {
      text = swish
        ? 'Swish keeps the court. Bring a spare.'
        : `The regulars take it ${a}-${h}. They call it a pickup game. They keep score anyway.`;
    }
    hud.result(text);
    cur.cardT = CARD_S;
    for (const cb of [...listeners]) cb(r);
  }

  function handleEvents(cur: Playing, events: CourtEvent[]): void {
    for (const e of events) {
      if (e.kind === 'sound') playAt(e.id, { x: e.x, z: e.z });
      else if (e.kind === 'score' && e.byPlayer) {
        life.cheer();
        if (e.points === 3) { deps.unlock(COURT_ACH.three); cur.threes += 1; }
        if (e.dunk) { deps.unlock(COURT_ACH.dunk); cur.dunks += 1; }
      } else if (e.kind === 'end') finishGame(cur);
    }
  }

  function startGame(o: PickupOpts = {}): string | null {
    const why = refusal();
    if (why) return why;
    if (game) return 'A game is already on.';
    stopShoot();
    const opponents = o.opponents ?? 'regulars';
    const g = newPickup(look, groundY, {
      ...o,
      opponents,
      target: o.target ?? (opponents === 'swish' ? PICKUP.questTarget : PICKUP.target),
      seed: o.seed ?? seed++,
    });
    const v = pickupView(g);
    const first = (n: string): string => n.split(' ')[0];
    const names: [string, string] = [
      'You & Pansy',
      opponents === 'swish' ? 'Swish & Lintel' : `${first(v.gnomes[2].name)} & ${first(v.gnomes[3].name)}`,
    ];
    game = { g, view: v, names, threes: 0, dunks: 0, prevShoot: false, age: 0, cardT: null };
    putPlayer(v.gnomes[0].x, v.gnomes[0].z, v.gnomes[0].yaw);
    showPlayer(false);
    hud.show('game');
    hud.setGame(v, names);
    render.game(v, 0);
    return null;
  }

  function stepGame(cur: Playing, dt: number, inp: InputState): void {
    cur.age += dt;
    const touch = hud.touch();
    const p = deps.player;
    const quit = touch.quitPressed || (inp.enterExit && cur.age > START_GRACE_S);
    if (p.health <= 0 || p.vehicle) { endGame(); return; }
    if (cur.cardT !== null) {
      cur.cardT -= dt;
      if (cur.cardT <= 0 || quit || (inp.fire && cur.cardT < CARD_S - 1)) { endGame(); return; }
    } else {
      if (quit) { endGame(); return; }
      const ctl = courtControl(inp, touch, cur.prevShoot);
      cur.prevShoot = ctl.shootDown;
      handleEvents(cur, stepPickup(cur.g, dt, ctl));
    }
    cur.view = pickupView(cur.g);
    const me = cur.view.gnomes[0];
    putPlayer(me.x, me.z, me.yaw);
    showPlayer(false);
    render.game(cur.view, dt);
    hud.setGame(cur.view, cur.names);
  }

  // ---- Shootaround ----
  function stopShoot(): void {
    if (!shoot) return;
    shoot = null;
    render.ball(null, 0);
    hud.show('none');
  }

  function startShootaround(): string | null {
    const why = refusal();
    if (why) return why;
    if (game) return 'A game is already on.';
    if (shoot) return null;
    shoot = { s: newShoot(), age: 0, later: [] };
    hud.show('shootaround');
    return null;
  }

  function stepShootaround(cur: Shooting, dt: number, inp: InputState): void {
    cur.age += dt;
    const touch = hud.touch();
    const p = deps.player;
    const far = Math.hypot(p.x - BALL_CAGE.x, p.z - BALL_CAGE.z) > SHOOT.leaveRange;
    if (p.health <= 0 || p.vehicle || far || touch.quitPressed || (inp.enterExit && cur.age > START_GRACE_S)) {
      stopShoot();
      return;
    }
    const gy = heightAt(p.x, p.z);
    const e = stepShoot(cur.s, dt, !!inp.fire || touch.shootHeld, p.x, p.z, gy, Math.random());
    if (e?.kind === 'release') playAt('jam-bounce', p);
    else if (e?.kind === 'make') {
      store.recordShootMake();
      const hoop = COURT.hoops.reduce((b, h) => (Math.hypot(h.x - p.x, h.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? h : b));
      playAt('jam-swish', hoop);
      cur.later.push([DRAIN_DELAY_S, 'jam-drainpipe', hoop.x, hoop.z]);
      if (e.three) deps.unlock(COURT_ACH.three);
    } else if (e?.kind === 'miss') playAt('jam-clang', p);
    for (const l of cur.later) l[0] -= dt;
    for (const l of cur.later) if (l[0] <= 0) playAt(l[1], { x: l[2], z: l[3] });
    cur.later = cur.later.filter((l) => l[0] > 0);
    render.ball(ballAt(cur.s, p.x, p.z, gy), dt);
    hud.setShoot({ charge: cur.s.charge, makes: cur.s.makes, shots: cur.s.shots, three: isThree(p.x, p.z) });
  }

  // ---- Prompts ----
  interface Action { text: string; run(): void }
  const near = (x: number, z: number, s: { x: number; z: number }): boolean => Math.hypot(x - s.x, z - s.z) <= COURT_RANGE;
  function actionAt(x: number, z: number): Action | null {
    if (!deps.onFoot()) return null;
    if (shoot) return near(x, z, BALL_CAGE) ? { text: 'Put the ball back', run: stopShoot } : null;
    if (game) return null;
    const go = (o?: PickupOpts) => (): void => { const why = startGame(o); if (why) toast(why); };
    if (near(x, z, SCOREBOARD)) return { text: 'Pickup game with Pansy (to 11)', run: go() };
    if (near(x, z, COURT_PEOPLE.cardoon.spot) && store.data().jam.wins >= 1) {
      return { text: 'Challenge Swish and Lintel (to 7)', run: go({ opponents: 'swish', target: PICKUP.questTarget }) };
    }
    if (near(x, z, BALL_CAGE)) {
      return { text: 'Take a ball (shootaround)', run: () => { const why = startShootaround(); if (why) toast(why); } };
    }
    return null;
  }

  const api: CourtApi = {
    startGame,
    quitGame() {
      endGame();
      stopShoot();
    },
    inGame: () => game !== null,
    startShootaround,
    onGame(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
  current = api;
  registerFoundersApp({ store: () => store, court: () => api, skate: () => skateApi(), toast });

  return {
    update(dt: number, inp: InputState) {
      t += dt;
      if (game) stepGame(game, dt, inp);
      else if (shoot) stepShootaround(shoot, dt, inp);
      life.update(dt, t, deps.player.x, deps.player.z, game !== null);
    },
    prompt: (x, z) => actionAt(x, z)?.text ?? null,
    interact(x, z) {
      const a = actionAt(x, z);
      if (!a) return false;
      a.run();
      return true;
    },
    blips(): Blip[] {
      return [{ x: COURT.x, z: COURT.z, kind: 'court', label: 'Drainpipe Court', color: PLACE_STYLE.court.color } as Blip];
    },
    inputMode: () => (game ? 'game' : shoot ? 'shootaround' : 'none'),
    applyCamera: (dt) => view.apply(dt, game ? game.view : null),
    api,
    debug: () => ({
      mode: game ? 'game' : shoot ? 'shootaround' : 'none',
      score: game ? game.view.score : null,
      target: game ? game.g.target : null,
      shots: shoot ? shoot.s.shots : null,
      save: store.data(),
    }),
  };
}
