// Hedgeworth Links at runtime (batch 3 E15): builds the yard, course, buildings and life, and runs a round of golf.
// STUB (issue B1 fills in the round, the Kicked Board, carts, prompts and achievements). app.ts installs it like winter.
import type * as THREE from 'three';
import type { JobsDeps } from '../jobs/types';
import type { Blip, InputState } from '../types';
import { buildHedgeworthBuildings, defineClubhouseInterior, registerHedgeworthHomes } from './clubhouse';
import { registerGolfApp } from './golfApp';
import { buildCourseGround } from './greens';
import { buildHedgeworthLife } from './life';
import { createGolfStore } from './save';
import { registerGolfSounds } from './sounds';
import type { Golf, GolfApi, GolfStore } from './types';
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
  let t = 0;

  const api: GolfApi = {
    startRound: () => 'Not yet.',
    quitRound() {},
    inRound: () => false,
    boardBroken: () => store.data().boardBroken,
    breakBoard() {},
    onHole: () => () => {},
    store: () => store,
  };
  current = api;
  defineClubhouseInterior({ store: () => store, startRound: (h) => api.startRound(h), toast: (s) => deps.hud.toast(s, 3000) });
  registerGolfApp({ store: () => store, api: () => current, toast: (s) => deps.hud.toast(s, 3000) });

  return {
    update(dt: number, _inp: InputState) {
      t += dt;
      yard.update(dt, t);
      life.update(dt, t, deps.player.x, deps.player.z);
    },
    prompt: () => null,
    interact: () => false,
    blips: (): Blip[] => [],
    addressing: () => false,
    applyCamera: () => false,
    api,
    debug: () => ({ store: store.data() }),
  };
}
