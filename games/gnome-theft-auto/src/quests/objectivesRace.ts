// The 'race' objective runner (Lost & Found Speedway): the player and the rivals on the grid, the start lights, the race,
// the result. The pure parts (ordinal, rankRacers) are exported for objectivesRace.test.ts.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Blip, Vehicle } from '../types';
import { createVehicle, repairVehicle, syncVehicleMesh } from '../vehicles';
import { placeOnGround } from '../terrainMesh';
import { driveRival, removeRival, resetRival, spawnRival } from '../raceTrack/raceAi';
import type { Rival } from '../raceTrack/raceAi';
import { setRaceActive, setStartLights } from '../raceTrack/state';
import { GateTracker, gates, gridSlot, locate, trackLength } from '../raceTrack/track';
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

export function raceRun(
  obj: Extract<ObjectiveDef, { kind: 'race' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  const L = trackLength();
  const n = obj.rivals.length;
  const playerSlot = n;
  const myGrid = gridSlot(playerSlot);
  const vehicles = deps.vehicles!;
  const gridSpot = (slot: number) => {
    const g = gridSlot(slot);
    return locate(g.x, g.z, 20);
  };
  const slotS = (slot: number): number => gridSpot(slot)?.s ?? L - 8;

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
  const tracker = new GateTracker();
  let pDist = slotS(playerSlot) - L;
  let lastS = slotS(playerSlot);
  let pHint = gridSpot(playerSlot)?.i ?? -1;
  let pFinishedAt: number | null = null;

  setRaceActive(true);
  const mine: Vehicle = createVehicle(deps.scene, obj.vehicle, myGrid.x, myGrid.z, myGrid.yaw, obj.tint);
  mine.questOwned = true;
  vehicles.push(mine);

  const rivals: Rival[] = obj.rivals.map((def, i) => {
    const r = spawnRival(deps.scene, vehicles, def, obj.vehicle, i);
    resetRival(r, i);
    r.dist = slotS(i) - L;
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
    ];
    const order = rankRacers(entries);
    return { p: order.indexOf('player') + 1, order };
  };

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
    prevAhead = rivals.map((r) => r.dist > pDist);
  };

  const reset = (): void => {
    rivals.forEach((r, i) => {
      resetRival(r, i);
      r.dist = slotS(i) - L;
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
    pDist = slotS(playerSlot) - L;
    lastS = slotS(playerSlot);
    pHint = gridSpot(playerSlot)?.i ?? -1;
    pFinishedAt = null;
    raceTime = 0;
    outT = 0;
    lightsHeld = false;
    prevAhead = [];
    setStartLights(0);
    if (seated()) {
      phase = 'countdown';
      cdT = 0;
    } else {
      phase = 'travel';
    }
  };

  const abandon = (msg: string): void => {
    say(msg);
    reset();
  };

  const failRace = (msg: string): void => {
    say(msg);
    phase = 'finished';
    failAt = raceTime + RESULT_HOLD;
  };

  const finishPlayer = (): void => {
    const { p } = place();
    if (p <= obj.mustPlace) {
      deps.hud.banner(`${ordinal(p)} PLACE!`);
      deps.play('steal');
      deps.fx?.confetti(mine.x, mine.y + 1, mine.z);
      // A cool-down roll past the crowd, then the podium scene (cutscene/scenes/speedway.ts); the quest completes after it.
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
      const lap = Math.min(obj.laps, tracker.laps + 1);
      html += `<div class="pill">POS ${p}/${n + 1}&nbsp; LAP ${lap}/${obj.laps}&nbsp; ${clock(raceTime)}</div>`;
    }
    if (html !== hudKey) {
      hudKey = html;
      hud.innerHTML = html;
    }
  };

  return {
    lines: () => {
      if (phase === 'travel') {
        return [`Head to the {{Lost & Found Speedway}} grid and get in your ${mine.spec.name} (last slot).`];
      }
      if (phase === 'countdown') return ['Wait for the lights…'];
      if (phase === 'done') return [obj.text];
      const lap = Math.min(obj.laps, tracker.laps + 1);
      return [`Lap ${lap}/${obj.laps} · Position ${place().p}/${n + 1}`, obj.text];
    },
    done: () => phase === 'done',
    update(dt) {
      t += dt;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + 0.2 * Math.sin(t * 3.5);
      ring.visible = phase === 'travel' && !seated();
      if (phase === 'done') {
        drawHud();
        return;
      }
      if (phase === 'won') {
        raceTime += dt;
        for (const r of rivals) driveRival(r, dt, deps.world, { hold: r.finishedAt !== null, playerDist: pDist, time: raceTime });
        if (!podiumPlaying && raceTime >= wonAt) {
          podiumPlaying = true;
          const finish = (): void => { phase = 'done'; changed(); };
          const script = SCENES[`race-${obj.raceId}-podium`];
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
          cdT += dt;
          holdPlayer();
          for (const r of rivals) driveRival(r, dt, deps.world, { hold: true, playerDist: pDist, time: raceTime });
          if (cdT < COUNT_GO) {
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
          driveRival(r, dt, deps.world, { hold: r.finishedAt !== null, playerDist: pDist, time: raceTime });
          if (r.finishedAt === null && r.dist >= obj.laps * L) r.finishedAt = raceTime;
        }

        if (phase === 'racing') {
          tracker.update(dt, mine.x, mine.z);
          const spot = locate(mine.x, mine.z, 60, pHint);
          if (spot) {
            let d = spot.s - lastS;
            if (d < -L / 2) d += L;
            else if (d > L / 2) d -= L;
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
            if (tracker.laps >= obj.laps) {
              pFinishedAt = raceTime;
              finishPlayer();
            } else if (rivalsFinished() >= obj.mustPlace) {
              failRace(`Out of the places. You need ${need()} — back to the grid!`);
            }
          }
        } else if (raceTime >= failAt) {
          reset();
        }
      }
      drawHud();
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (phase === 'done') return [];
      if (phase === 'travel' || phase === 'countdown') {
        return [{ x: myGrid.x, z: myGrid.z, color: MARK_COLOR, quest: obj.hint }];
      }
      if (phase === 'finished') return [];
      const G = gates();
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
      setRaceActive(false);
      // The race vehicle stays in the world for the player; traffic may take it once it is no longer quest-owned.
      mine.questOwned = false;
    },
  };
}
