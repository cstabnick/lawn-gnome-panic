// E24 comedy job runtime: "Go on stage" puts the player's gnome on the stage, locks the camera on it from the crowd and
// plays the show clock (captions, gestures, crowd sounds, heckles, thrown tomatoes). The player can only Double Down or
// Walk off. The booker's verdict and the pay come through finishShift.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { setActivityOn } from '../../activityMode';
import { currentInterior, interiorToWorld } from '../../interiors';
import { TOMATO_HAZARD_PAY, WORK_ACHIEVEMENTS, WORK_JOBS } from '../../jobs/workDefs';
import { play2d } from '../../sound/bus';
import { finishShift, workLevel } from '../shift';
import { registerWorkSounds } from '../sounds';
import type { WorkDeps, WorkJobRuntime } from '../types';
import { buildClubStreet, CLUB_DOOR } from './club';
import { DOUBLE_DOWN_LINES, HECKLERS, HECKLES, setFor, VERDICTS } from './material';
import { createShow, type Show } from './show';
import { openStageUi } from './stageUi';
import { CLUB, COMEDY_CLUB_ID, COMEDY_START_EVENT, type CrowdReaction, type ShowEvent, type StageUi } from './types';

const SAVE_KEY = 'gta-comedy-v1';
const FLIGHT_S = 0.75;
const MAX_TOMATOES = 3;

interface Flying { mesh: THREE.Object3D; t: number; from: THREE.Vector3; to: THREE.Vector3 }

const REACT_SOUND: Partial<Record<CrowdReaction, string>> = {
  groan: 'crowd-groan', boo: 'crowd-boo', cough: 'crowd-cough', sigh: 'crowd-sigh', 'pity-clap': 'pity-clap',
  cricket: 'cricket', walkout: 'crowd-cough',
};

function loadPlayed(): number {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as { played?: number };
    return typeof v.played === 'number' && v.played >= 0 ? v.played : 0;
  } catch { return 0; }
}
function savePlayed(n: number): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ played: n })); } catch { /* storage off */ }
}

export function installComedy(deps: WorkDeps): WorkJobRuntime {
  registerWorkSounds();
  let built = false;
  let show: Show | null = null;
  let ui: StageUi | null = null;
  let played = 0;
  let flying: Flying[] = [];
  let inClub = 0; // seconds inside the club (dev hook)
  let devFired = false;
  const dev = typeof location !== 'undefined' && new URLSearchParams(location.search).has('comedyset');
  const emote = (id: string): void => { window.dispatchEvent(new CustomEvent('gta:emote', { detail: id })); };
  const stage = (): [number, number] => interiorToWorld(COMEDY_CLUB_ID, CLUB.stage.x, CLUB.stage.z);

  function throwTomato(seat: number): void {
    if (flying.length >= MAX_TOMATOES) return;
    const s = CLUB.seats[seat % CLUB.seats.length];
    const [wx, wz] = interiorToWorld(COMEDY_CLUB_ID, s.x, s.z);
    const [sx, sz] = stage();
    const mesh = getPrefab('comedy-tomato') ? buildPrefab('comedy-tomato') : new THREE.Group();
    const from = new THREE.Vector3(wx, 1.0, wz);
    mesh.position.copy(from);
    deps.scene.add(mesh);
    flying.push({ mesh, t: 0, from, to: new THREE.Vector3(sx, 1.6, sz) });
    play2d('tomato-whoosh');
  }

  function stepTomatoes(dt: number): void {
    for (const f of flying.slice()) {
      f.t += dt / FLIGHT_S;
      const k = Math.min(1, f.t);
      f.mesh.position.lerpVectors(f.from, f.to, k);
      f.mesh.position.y += 4 * 1.2 * k * (1 - k);
      f.mesh.rotation.x += dt * 14;
      f.mesh.rotation.z += dt * 9;
      if (f.t >= 1) {
        deps.scene.remove(f.mesh);
        flying = flying.filter((x) => x !== f);
        play2d('tomato-splat');
        ui?.splat();
        emote('flinch');
      }
    }
  }

  function handle(e: ShowEvent): void {
    if (!ui) return;
    switch (e.t) {
      case 'intro': ui.line('MIREILLE', e.text, 3.5); break;
      case 'line':
        ui.line('YOU', e.text, e.s);
        if (e.anim) emote(e.anim);
        break;
      case 'react': {
        ui.reaction(e.kind);
        const snd = REACT_SOUND[e.kind];
        if (snd) play2d(snd);
        if (e.kind === 'walkout') play2d('door-creak');
        break;
      }
      case 'heckle': ui.heckle(e.who.name, e.text); break;
      case 'tomato': throwTomato(e.seat); break;
      case 'doubled': ui.line('YOU', e.text, 3); emote('point'); break;
      case 'closer': ui.line('YOU', e.text, 3); emote('bow'); break;
      case 'end': endSet(false); break;
    }
  }

  function endSet(quit: boolean): void {
    const s = show;
    if (!s) return;
    show = null;
    for (const f of flying) deps.scene.remove(f.mesh);
    flying = [];
    ui?.close();
    ui = null;
    deps.showroom(null);
    const [ax, az] = interiorToWorld(COMEDY_CLUB_ID, CLUB.after.x, CLUB.after.z);
    deps.teleport(ax, az, CLUB.after.yaw);
    if (quit) {
      finishShift(deps, 'comedy', { units: [], quote: 'Mireille: "Even they noticed you leave."' });
      return;
    }
    const stars = s.stars();
    const tom = s.tomatoes();
    const dd = s.doubleDowns();
    finishShift(deps, 'comedy', {
      units: [{ stars }],
      extra: { sets: 1, tomatoes: tom, doubleDowns: dd },
      bonus: tom * TOMATO_HAZARD_PAY,
      bonusNote: 'Hazard pay (tomatoes)',
      quote: 'Mireille: "' + VERDICTS[stars - 1] + '"',
    });
    savePlayed(played + 1);
    deps.increment(WORK_ACHIEVEMENTS.comedian);
    if (tom > 0) deps.increment(WORK_ACHIEVEMENTS.tomatoes, tom);
    if (dd >= 5) deps.unlock(WORK_ACHIEVEMENTS.doubleDown);
  }

  function start(): void {
    if (show) return;
    const why = deps.blocked();
    if (why) { deps.hud.toast(why); return; }
    played = loadPlayed();
    const set = setFor(workLevel('comedy'), played);
    if (!set) { deps.hud.toast("Mireille: 'No material, no stage.'"); return; }
    show = createShow(set, { heckles: HECKLES, hecklers: HECKLERS, doubleDownLines: DOUBLE_DOWN_LINES, seed: Date.now() & 0xffff });
    const [sx, sz] = stage();
    deps.teleport(sx, sz, CLUB.stage.yaw);
    deps.showroom({ x: sx, y: 0.4, z: sz, radius: 1.3, fixedYaw: Math.PI, fixedPitch: 0.1, distance: 5 });
    ui = openStageUi(deps.ui, {
      title: set.title,
      onDoubleDown() { if (show?.doubleDown()) play2d('comedy-rimshot'); },
      onLeave() { endSet(true); },
    });
  }

  window.addEventListener(COMEDY_START_EVENT, start);

  return {
    update(dt: number): void {
      // D30: no pistol on stage (activityMode.ts holsters while a set runs).
      setActivityOn('comedy', show !== null);
      if (!built) { built = true; buildClubStreet(deps.scene, deps.world); }
      if (dev && !devFired) {
        inClub = currentInterior() === COMEDY_CLUB_ID ? inClub + dt : 0;
        if (inClub >= 3) { devFired = true; window.dispatchEvent(new CustomEvent(COMEDY_START_EVENT)); }
      }
      if (!show || !ui) return;
      if (currentInterior() !== COMEDY_CLUB_ID || deps.blocked()) { endSet(true); return; }
      for (const e of show.step(dt)) {
        handle(e);
        if (!show) return;
      }
      ui.meter(show.cringe());
      ui.setDoubleDown(show.canDoubleDown());
      stepTomatoes(dt);
    },
    isOpen: () => show !== null,
    blips: () => [{ x: CLUB_DOOR.x, z: CLUB_DOOR.z, color: WORK_JOBS.comedy.color, label: '🎤 Le Petit Groan (comedian)' }],
  };
}
