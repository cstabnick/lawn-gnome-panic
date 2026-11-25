// Rooftop life (E05, L75): notices landings and roof visits and unlocks the rooftop achievements.
import type { Hud, Player } from '../types';
import { rooftopAt } from './rooftops';

export interface RoofLifeDeps {
  player: Player;
  hud: Hud;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
}

export interface RoofLife {
  /** Every frame, after the player and vehicles moved. */
  update(dt: number): void;
}

const VISITED_KEY = 'gta-roofs-visited-v1';
/** Check at most this often (seconds). */
const CHECK_EVERY = 0.25;
/** Roofs lower than this are not "rooftops" (ground-level pads and low slabs). */
const MIN_ROOF_Y = 3;

function loadVisited(): Set<string> {
  try {
    const raw = globalThis.localStorage?.getItem(VISITED_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveVisited(visited: Set<string>): void {
  try {
    globalThis.localStorage?.setItem(VISITED_KEY, JSON.stringify([...visited]));
  } catch {
    // Storage blocked or missing (tests): the set still lives for this session.
  }
}

export function createRoofLife(deps: RoofLifeDeps): RoofLife {
  const { player, hud } = deps;
  const visited = loadVisited();
  const landed = new Set<string>();
  let acc = 0;

  function checkLanding(): void {
    const v = player.vehicle;
    if (!v || !v.spec.air || v.driver !== 'player' || !v.air || v.air.airborne) return;
    if (Math.abs(v.speed) >= 3) return;
    const roof = rooftopAt(v.x, v.z, v.y, 0.8);
    if (!roof || roof.y <= MIN_ROOF_Y || landed.has(roof.id)) return;
    landed.add(roof.id);
    deps.unlock('gta-roof-rat');
    hud.toast(`Touched down on ${roof.name ?? 'a rooftop'}.`);
  }

  function checkOnFoot(): void {
    if (player.vehicle || player.airborne) return;
    const roof = rooftopAt(player.x, player.z, player.y, 0.6);
    if (!roof || roof.y <= MIN_ROOF_Y || visited.has(roof.id)) return;
    visited.add(roof.id);
    saveVisited(visited);
    deps.increment('gta-rooftop-run', 1);
    if (roof.name) hud.toast(`Rooftop: ${roof.name}`);
  }

  return {
    update(dt: number) {
      acc += dt;
      if (acc < CHECK_EVERY) return;
      acc = 0;
      checkLanding();
      checkOnFoot();
    },
  };
}
