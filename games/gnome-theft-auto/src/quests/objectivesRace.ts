// The 'race' objective runner (Lost & Found Speedway): the player and the rivals on the grid, the start lights, the race,
// the result. The pure parts (ordinal, rankRacers) are exported for objectivesRace.test.ts.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Blip, Vehicle } from '../types';
import { createVehicle, repairVehicle, syncVehicleMesh } from '../vehicles';
import { buildPrefab } from '@lawn/prefabs';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import type { Track } from '../raceTrack/trackDef';
import { driveRival, removeRival, resetRival, spawnRival } from '../raceTrack/raceAi';
import type { Rival } from '../raceTrack/raceAi';
import { setRaceActive, setStartLights } from '../raceTrack/state';
import { trackById } from '../raceTrack/tracks';
import { SCENES } from '../cutscene/scenes';
import type { ObjectiveDef, QuestDeps, Run } from './types';

const MARK_COLOR = '#ff7a00';
/** Seconds of red lamps before GO (the lamps step every LAMP_STEP). */
const COUNT_GO = 3.5;
const LAMP_STEP = 0.7;
/** Seconds the start gantry shows green after GO. */
const LIGHTS_GREEN = 3;
/** Seconds the GO! text stays up after GO. */
const GO_TEXT = 1;
/** Seconds the player may be out of the race vehicle before the race is abandoned. */
const OUT_LIMIT = 8;
/** Minimum seconds between two taunts. */
const TAUNT_GAP = 6;
/** Seconds a failed run shows its result before everyone goes back to the grid. */
const RESULT_HOLD = 3;
/** Seconds after a win before the podium scene starts. */
const PODIUM_AFTER = 2.5;

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st ... */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/**
 * Running order, first place first. Finished drivers come first, by finish time; everyone still running follows by
 * distance along the lap (furthest first).
 */
export function rankRacers(entries: { id: string; dist: number; finishedAt: number | null }[]): string[] {
  const done = entries.filter((e) => e.finishedAt !== null).sort((a, b) => (a.finishedAt as number) - (b.finishedAt as number));
  const running = entries.filter((e) => e.finishedAt === null).sort((a, b) => b.dist - a.dist);
  return [...done, ...running].map((e) => e.id);
}

/** Traffic keep-out circles along a track's centre line (closed: the whole lap; open: from just before the start to just past the finish). */
export function keepOutZones(track: Track, every = 25, r = 16): { x: number; z: number; r: number }[] {
  const S = track.samples();
  const lo = track.closed ? 0 : track.startS() - 30;
  const hi = track.closed ? Infinity : track.finishS() + 20;
  const out: { x: number; z: number; r: number }[] = [];
  for (let i = 0; i < S.length; i += every) {
    if (S[i].s < lo || S[i].s > hi) continue;
    out.push({ x: S[i].x, z: S[i].z, r });
  }
  return out;
}

function makeRing(scene: THREE.Scene, x: number, z: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(2.5, 3, 36);
  const mat = flatLayer(
    new THREE.MeshBasicMaterial({ color: 0xff7a00, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }),
    LAYER.marker,
  );
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  placeOnGround(m, x, z, 0.08, true);
  scene.add(m);
  return m;
}

const HUD_CSS = `
#gta-race-hud { position: absolute; top: calc(env(safe-area-inset-top) + 100px); left: 50%; transform: translateX(-50%);
  pointer-events: none; max-width: 92vw; text-align: center; color: #fff; font: 700 15px/1.2 system-ui, sans-serif; z-index: 5; }
@media (max-width: 700px) { #gta-race-hud { top: calc(env(safe-area-inset-top) + 240px); } }
#gta-race-hud .pill { display: inline-block; background: rgba(20, 22, 18, 0.72); border-radius: 999px; padding: 6px 14px; white-space: nowrap; }
#gta-race-hud .lights { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }
#gta-race-hud .lamp { width: 26px; height: 26px; border-radius: 50%; background: #3a1414; border: 2px solid #5a1f1f; }
#gta-race-hud .lamp.on { background: #ff2a2a; border-color: #ffb3b3; box-shadow: 0 0 12px #ff2a2a; }
#gta-race-hud .go { color: #3cff6e; font-size: 30px; font-weight: 900; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6); }
`;

function ensureHudCss(): void {
  if (document.getElementById('gta-race-hud-css')) return;
  const style = document.createElement('style');
  style.id = 'gta-race-hud-css';
  style.textContent = HUD_CSS;
  document.head.appendChild(style);
}

function clock(t: number): string {
  const s = (t % 60).toFixed(1).padStart(4, '0');
  return `${Math.floor(t / 60)}:${s}`;
}

type Phase = 'travel' | 'countdown' | 'racing' | 'finished' | 'won' | 'done';

/** What a race run reports to a race mode (E26 streetRace/session.ts). Times are seconds since GO. */
export type RaceEvent =
  | { type: 'go' }
  | { type: 'gate'; passed: number; t: number }
  | { type: 'finish'; t: number; place: number; of: number }
  | { type: 'abandon'; why: string };

/** One frame of the player's race, for a race mode (ghost recorder, online progress). */
export interface RaceTick {
  phase: 'countdown' | 'racing' | 'finished';
  /** Seconds since GO (0 in the countdown). */
  t: number;
  /** The player's race distance (m from the start line; negative on the grid). */
  dist: number;
  x: number; y: number; z: number; yaw: number;
  place: number;
}

/** Another racer to rank against (an online player): race distance and finish time (s since their own GO). */
export interface RaceOther { id: string; name: string; dist: number; finishedAt: number | null }

/**
 * Hooks for race modes (E26): quests pass none and the race plays exactly as before. Contract:
 * docs/roadmaps/gta-batch-3/E26/contracts.md.
 */
export interface RaceRunOpts {
  /** Seat the player in the race vehicle at once (no travel to the grid). Called once, at the start and on a restart. */
  seat?: (v: Vehicle) => void;
  /** The player's grid slot (default: behind the rivals, slot rivals.length). */
  slot?: number;
  /** Hold the countdown until this is true (online: the lobby host said go). Default: start as soon as seated. */
  canStart?: () => boolean;
  /** Other racers (online players) ranked with the player and the rivals. */
  others?: () => readonly RaceOther[];
  /** Any finish completes the run (no podium needed, no "back to the grid"): time trials, pickup and online races. */
  anyPlace?: boolean;
  /** Never play the podium scene. */
  noPodium?: boolean;
  /** An abandoned race (car wrecked, left too long) ends the run ('abandon' event, done) instead of going back to the grid. */
  endOnAbandon?: boolean;
  onEvent?: (e: RaceEvent) => void;
  onTick?: (s: RaceTick) => void;
}

export function raceRun(
  obj: Extract<ObjectiveDef, { kind: 'race' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
  opts: RaceRunOpts = {},
): Run {
  const track = trackById(obj.trackId ?? 'lost-and-found');
  const isSpeedway = track.id === 'lost-and-found';
  const closed = track.closed;
  const L = track.length();
  // Race distance is measured from the start line (closed: a lap behind it on the grid, open: from startS()).
  const base = closed ? L : track.startS();
  // Race distance at which a rival has finished.
  const raceLen = closed ? obj.laps * L : track.finishS() - track.startS();
  const n = obj.rivals.length;
  const playerSlot = opts.slot ?? n;
  const myGrid = track.gridSlot(playerSlot);
  const vehicles = deps.vehicles!;
  const gridSpot = (slot: number) => {
    const g = track.gridSlot(slot);
    return track.locate(g.x, g.z, 20);
  };
  const slotS = (slot: number): number => gridSpot(slot)?.s ?? track.wrapS(track.startS() - 8);

  let phase: Phase = 'travel';
  let wonAt = 0;
  let podiumPlaying = false;
  let cdT = 0;
  let raceTime = 0;
  let outT = 0;
  let failAt = 0;
  let lightsHeld = false;
  let lastTaunt = -Infinity;
  let prevAhead: boolean[] = [];
  let t = 0;

  // The player's race distance: a running total of the lap distance driven, starting `slotS - L` (behind the line).
  const tracker = track.tracker();
  let pDist = slotS(playerSlot) - base;
  let lastS = slotS(playerSlot);
  let pHint = gridSpot(playerSlot)?.i ?? -1;
  let pFinishedAt: number | null = null;
  // Open tracks: the finish line was crossed (the tracker's 'lap' event).
  let crossedFinish = false;

  const oldMode = obj.night ? deps.atmosphere?.getMode() : undefined;
  if (obj.night) deps.atmosphere?.setMode('night');
  const cones: THREE.Object3D[] = [];
  if (obj.closedRoad) {
    for (const g of track.gates()) {
      for (const sgn of [1, -1]) {
        const c = buildPrefab('site-cone');
        placeOnGround(c, g.x + sgn * g.nx * (g.half + 0.5), g.z + sgn * g.nz * (g.half + 0.5), 0, false);
        deps.scene.add(c);
        cones.push(c);
      }
    }
  }
  let gateMark: THREE.Mesh | null = null;
  if (track.def.relief === 'none') {
    gateMark = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(2, track.gates()[0]?.half ?? 6), 0.25, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xff7a00, transparent: true, opacity: 0.7 }),
    );
    gateMark.visible = false;
    deps.scene.add(gateMark);
  }

  setRaceActive(true);
  const mine: Vehicle = createVehicle(deps.scene, obj.vehicle, myGrid.x, myGrid.z, myGrid.yaw, obj.tint);
  mine.questOwned = true;
  vehicles.push(mine);
  opts.seat?.(mine);

  const rivals: Rival[] = obj.rivals.map((def, i) => {
    const r = spawnRival(deps.scene, vehicles, def, obj.vehicle, i, track);
    resetRival(r, i);
    r.dist = slotS(i) - base;
    r.finishedAt = null;
    r.hint = gridSpot(i)?.i ?? -1;
    return r;
  });

  const ring = makeRing(deps.scene, myGrid.x, myGrid.z);

  ensureHudCss();
  const hud = document.createElement('div');
  hud.id = 'gta-race-hud';
  hud.style.display = 'none';
  (document.getElementById('ui') ?? document.body).appendChild(hud);
  let hudKey = '';

  const seated = (): boolean => deps.player?.vehicle === mine;

  const place = (): { p: number; order: string[] } => {
    const entries = [
      { id: 'player', dist: pDist, finishedAt: pFinishedAt },
      ...rivals.map((r, i) => ({ id: String(i), dist: r.dist, finishedAt: r.finishedAt })),
      ...(opts.others?.() ?? []).map((o) => ({ id: 'o:' + o.id, dist: o.dist, finishedAt: o.finishedAt })),
    ];
    const order = rankRacers(entries);
    return { p: order.indexOf('player') + 1, order };
  };

  const fieldSize = (): number => n + (opts.others?.().length ?? 0) + 1;

  const need = (): string => (obj.mustPlace === 1 ? 'the win' : `a top ${obj.mustPlace}`);

  const holdPlayer = (): void => {
    mine.x = myGrid.x;
    mine.z = myGrid.z;
    mine.yaw = myGrid.yaw;
    mine.speed = 0;
    mine.vy = 0;
    syncVehicleMesh(mine, 0);
  };

  const rivalsFinished = (): number => rivals.filter((r) => r.finishedAt !== null).length;

  const toTravel = (): void => {
    phase = 'travel';
    cdT = 0;
    setStartLights(0);
  };

  const go = (): void => {
    phase = 'racing';
    raceTime = 0;
    outT = 0;
    lightsHeld = true;
    setStartLights(-1);
    deps.play('whistle');
    if (obj.closedRoad) deps.traffic?.setKeepOut?.(keepOutZones(track));
    opts.onEvent?.({ type: 'go' });
    prevAhead = rivals.map((r) => r.dist > pDist);
  };

  const reset = (): void => {
    rivals.forEach((r, i) => {
      resetRival(r, i);
      r.dist = slotS(i) - base;
      r.finishedAt = null;
      r.hint = gridSpot(i)?.i ?? -1;
    });
    repairVehicle(mine);
    // Repair does not clear a wreck or a sinking; a restart puts the car back on the grid running.
    mine.exploded = false;
    mine.sunk = false;
    mine.sunkT = 0;
    holdPlayer();
    tracker.reset();
    crossedFinish = false;
    pDist = slotS(playerSlot) - base;
    lastS = slotS(playerSlot);
    pHint = gridSpot(playerSlot)?.i ?? -1;
    pFinishedAt = null;
    raceTime = 0;
    outT = 0;
    lightsHeld = false;
    prevAhead = [];
    setStartLights(0);
    if (obj.closedRoad) deps.traffic?.setKeepOut?.(null);
    opts.seat?.(mine);
    if (seated()) {
      phase = 'countdown';
      cdT = 0;
    } else {
      phase = 'travel';
    }
  };

  const abandon = (msg: string): void => {
    say(msg);
    if (opts.endOnAbandon) {
      if (obj.closedRoad) deps.traffic?.setKeepOut?.(null);
      setStartLights(0);
      opts.onEvent?.({ type: 'abandon', why: msg });
      phase = 'done';
      changed();
      return;
    }
    reset();
  };

  const failRace = (msg: string): void => {
    say(msg);
    phase = 'finished';
    failAt = raceTime + RESULT_HOLD;
  };

  const finishPlayer = (): void => {
    const { p } = place();
    opts.onEvent?.({ type: 'finish', t: raceTime, place: p, of: fieldSize() });
    if (opts.anyPlace || p <= obj.mustPlace) {
      deps.hud.banner(`${ordinal(p)} PLACE!`);
      deps.play('steal');
      if (!opts.anyPlace || p === 1) deps.fx?.confetti(mine.x, mine.y + 1, mine.z);
      const gold = obj.timeAchievement;
      if (gold && raceTime < gold.seconds) {
        deps.unlock(gold.id);
        deps.hud.toast(`Gold time! ${clock(raceTime)}`);
      }
      // A cool-down roll past the crowd, then (on the Speedway) the podium scene (cutscene/scenes/speedway.ts); the quest
      // completes after it.
      phase = 'won';
      wonAt = raceTime + PODIUM_AFTER;
    } else {
      failRace(`Finished ${ordinal(p)}. You need ${need()} — back to the grid!`);
    }
  };

  const taunts = (): void => {
    rivals.forEach((r, i) => {
      const ahead = r.dist > pDist;
      if (prevAhead[i] !== undefined && ahead !== prevAhead[i] && raceTime - lastTaunt >= TAUNT_GAP && r.def.taunts.length > 0) {
        const line = r.def.taunts[Math.floor(Math.random() * r.def.taunts.length)];
        say(`${r.def.name}: "${line}"`);
        lastTaunt = raceTime;
      }
      prevAhead[i] = ahead;
    });
  };

  const cpTotal = Math.max(0, track.gates().length - 2);
  const checkpoints = (): number => Math.min(cpTotal, Math.max(0, tracker.passed));

  const drawHud = (): void => {
    if (phase === 'travel' || phase === 'done') {
      hud.style.display = 'none';
      return;
    }
    hud.style.display = '';
    let html = '';
    if (phase === 'countdown') {
      const lit = Math.min(5, Math.floor(cdT / LAMP_STEP) + 1);
      let dots = '';
      for (let k = 0; k < 5; k++) dots += `<span class="lamp${k < lit ? ' on' : ''}"></span>`;
      html = `<div class="lights">${dots}</div>`;
    } else {
      if (raceTime < GO_TEXT) html += '<div class="go">GO!</div>';
      const { p } = place();
      if (closed) {
        const lap = Math.min(obj.laps, tracker.laps + 1);
        html += `<div class="pill">POS ${p}/${fieldSize()}&nbsp; LAP ${lap}/${obj.laps}&nbsp; ${clock(raceTime)}</div>`;
      } else {
        html += `<div class="pill">POS ${p}/${fieldSize()}&nbsp; CP ${checkpoints()}/${cpTotal}&nbsp; ${clock(raceTime)}</div>`;
      }
    }
    if (html !== hudKey) {
      hudKey = html;
      hud.innerHTML = html;
    }
  };

  const updateGateMark = (): void => {
    if (!gateMark) return;
    if (phase !== 'racing') {
      gateMark.visible = false;
      return;
    }
    const G = track.gates();
    const g = G[tracker.next < 0 ? 0 : tracker.next % G.length];
    let y = heightAt(g.x, g.z);
    if (Math.hypot(mine.x - g.x, mine.z - g.z) < 25 && mine.y - y > 2) y = mine.y;
    gateMark.visible = true;
    gateMark.position.set(g.x, y + (gateMark.geometry as THREE.TorusGeometry).parameters.radius, g.z);
    gateMark.rotation.y = g.yaw;
    (gateMark.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.25 * Math.sin(t * 5);
  };

  return {
    lines: () => {
      if (phase === 'travel') {
        return [isSpeedway
          ? `Head to the {{Lost & Found Speedway}} grid and get in your ${mine.spec.name} (last slot).`
          : `Head to the ${track.name} start and get in your ${mine.spec.name} (last slot).`];
      }
      if (phase === 'countdown') return [opts.canStart && !opts.canStart() ? 'Waiting for the other racers…' : 'Wait for the lights…'];
      if (phase === 'done') return [obj.text];
      if (!closed) return [`Checkpoint ${checkpoints()}/${cpTotal} · Position ${place().p}/${fieldSize()}`, obj.text];
      const lap = Math.min(obj.laps, tracker.laps + 1);
      return [`Lap ${lap}/${obj.laps} · Position ${place().p}/${fieldSize()}`, obj.text];
    },
    done: () => phase === 'done',
    update(dt) {
      t += dt;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + 0.2 * Math.sin(t * 3.5);
      ring.visible = phase === 'travel' && !seated();
      if (phase === 'done') {
        if (gateMark) gateMark.visible = false;
        drawHud();
        return;
      }
      if (phase === 'won') {
        raceTime += dt;
        for (const r of rivals) driveRival(r, dt, deps.world, { hold: r.finishedAt !== null, playerDist: pDist, time: raceTime, others: vehicles });
        if (!podiumPlaying && raceTime >= wonAt) {
          podiumPlaying = true;
          const finish = (): void => { phase = 'done'; changed(); };
          const script = isSpeedway && !opts.noPodium ? SCENES[`race-${obj.raceId}-podium`] : undefined;
          if (script && !deps.cutscene.active) deps.cutscene.play({ kind: 'script', script }, finish);
          else finish();
        }
        drawHud();
        return;
      }

      if (phase === 'travel') {
        for (const r of rivals) driveRival(r, dt, deps.world, { hold: true, playerDist: pDist, time: raceTime });
        if (seated()) {
          phase = 'countdown';
          cdT = 0;
        }
      } else if (phase === 'countdown') {
        if (!seated()) {
          toTravel();
        } else if (mine.exploded || mine.sunk) {
          abandon('Race abandoned! Back to the grid.');
        } else {
          const ready = opts.canStart ? opts.canStart() : true;
          if (ready) cdT += dt;
          else cdT = 0;
          holdPlayer();
          for (const r of rivals) driveRival(r, dt, deps.world, { hold: true, playerDist: pDist, time: raceTime });
          if (!ready) {
            setStartLights(0);
          } else if (cdT < COUNT_GO) {
            setStartLights(Math.min(5, Math.floor(cdT / LAMP_STEP) + 1));
          } else {
            go();
          }
        }
      } else if (phase === 'racing' || phase === 'finished') {
        raceTime += dt;
        if (lightsHeld && raceTime >= LIGHTS_GREEN) {
          setStartLights(0);
          lightsHeld = false;
        }
        for (let i = 0; i < rivals.length; i++) {
          const r = rivals[i];
          driveRival(r, dt, deps.world, { hold: r.finishedAt !== null, playerDist: pDist, time: raceTime, others: vehicles });
          if (r.finishedAt === null && r.dist >= raceLen) r.finishedAt = raceTime;
        }

        if (phase === 'racing') {
          const ev = tracker.update(dt, mine.x, mine.z);
          if (ev === 'lap' && !closed) crossedFinish = true;
          if (ev === 'gate') opts.onEvent?.({ type: 'gate', passed: tracker.passed, t: raceTime });
          const spot = track.locate(mine.x, mine.z, 60, pHint);
          if (spot) {
            let d = spot.s - lastS;
            if (closed) {
              if (d < -L / 2) d += L;
              else if (d > L / 2) d -= L;
            }
            pDist += d;
            lastS = spot.s;
            pHint = spot.i;
          }
          outT = seated() ? 0 : outT + dt;

          if (mine.exploded || mine.sunk) {
            abandon('Race abandoned! Back to the grid.');
          } else if (outT >= OUT_LIMIT) {
            abandon('Race abandoned! Back to the grid.');
          } else {
            taunts();
            if (closed ? tracker.laps >= obj.laps : crossedFinish) {
              pFinishedAt = raceTime;
              finishPlayer();
            } else if (!opts.anyPlace && rivalsFinished() >= obj.mustPlace) {
              failRace(`Out of the places. You need ${need()} — back to the grid!`);
            }
          }
        } else if (raceTime >= failAt) {
          reset();
        }
      }
      if (opts.onTick && (phase === 'countdown' || phase === 'racing' || phase === 'finished')) {
        opts.onTick({ phase, t: raceTime, dist: pDist, x: mine.x, y: mine.y, z: mine.z, yaw: mine.yaw, place: place().p });
      }
      updateGateMark();
      drawHud();
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (phase === 'done') return [];
      if (phase === 'travel' || phase === 'countdown') {
        return [{ x: myGrid.x, z: myGrid.z, color: MARK_COLOR, quest: obj.hint }];
      }
      if (phase === 'finished') return [];
      const G = track.gates();
      const gate = G[tracker.next < 0 ? 0 : tracker.next % G.length];
      return [{ x: gate.x, z: gate.z, color: MARK_COLOR, quest: obj.hint }];
    },
    cracked: () => [],
    cleanup() {
      for (const r of rivals) removeRival(deps.scene, vehicles, r);
      deps.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      hud.remove();
      if (obj.closedRoad) deps.traffic?.setKeepOut?.(null);
      if (obj.night && oldMode) deps.atmosphere?.setMode(oldMode);
      for (const c of cones) deps.scene.remove(c);
      if (gateMark) {
        deps.scene.remove(gateMark);
        gateMark.geometry.dispose();
        (gateMark.material as THREE.Material).dispose();
      }
      setRaceActive(false);
      // The race vehicle stays in the world for the player; traffic may take it once it is no longer quest-owned.
      mine.questOwned = false;
    },
  };
}
