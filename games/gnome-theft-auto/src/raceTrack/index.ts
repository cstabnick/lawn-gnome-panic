// The Lost & Found Speedway in the running game: the surfaces, the dressing (barriers, grandstands, gantry, lights, the
// Speedway Pay 'n' Glaze), the crowd, the free-roam lap timer and its map markers. The races themselves are quests
// (quests/races.ts, run by quests/objectivesRace.ts). Lore: docs/lore/entries/apocrypha/lost-and-found-speedway.md.
import type * as THREE from 'three';
import type { Blip, Hud, Vehicle, World } from '../types';
import { createCrowd } from './crowd';
import { createLapTimer } from './lapTimer';
import { raceActive, startLights } from './state';
import { SPEEDWAY_GLAZE, TRACK, sampleAt } from './track';
import { buildTrackDressing } from './trackDressing';
import { buildTrackSurface } from './trackMesh';

/**
 * A lap under this many seconds earns the Hot Lap achievement. track.test.ts's racing driver laps a stock Zero-Turn in
 * about 54 s with the default (sim) handling and 38 s in Arcade: 48 s takes a committed lap in the sim.
 */
export const HOT_LAP_SECONDS = 48;

export interface RaceTrackDeps {
  hud: Hud;
  unlock(id: string): void;
  play(sfx: 'steal' | 'whistle'): void;
}

export interface RaceTrack {
  update(dt: number, v: Vehicle | null, px: number, pz: number, night: number): void;
  blips(): Blip[];
}

const fmt = (t: number): string => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return m > 0 ? `${m}:${s.toFixed(2).padStart(5, '0')}` : s.toFixed(2);
};

export function createRaceTrack(scene: THREE.Scene, world: World, ui: HTMLElement, deps: RaceTrackDeps): RaceTrack {
  buildTrackSurface(scene);
  const dressing = buildTrackDressing(scene, world.boxes);
  const crowd = createCrowd(scene, dressing.decks);
  const lapTimer = createLapTimer(ui, (info) => {
    deps.unlock('gta-speedway-lap');
    if (info.time < HOT_LAP_SECONDS) deps.unlock('gta-speedway-hotlap');
    if (info.personalBest) {
      deps.hud.callout?.('NEW BEST LAP', `${fmt(info.time)} · ${info.kind}`);
      deps.play('steal');
    } else {
      deps.hud.toast(`Lap ${fmt(info.time)} (best ${fmt(info.overallBest)})`, 3500);
    }
  });
  const start = sampleAt(0);
  const markers: Blip[] = [
    { x: start.x, z: start.z - TRACK.barrierOffset - 6, color: '#ffffff', kind: 'speedway', label: TRACK.name },
    { x: SPEEDWAY_GLAZE.bay.x, z: SPEEDWAY_GLAZE.bay.z, color: '#ff3b9a', kind: 'glaze', label: "Pay 'n' Glaze" },
  ];

  return {
    update(dt, v, px, pz, night) {
      lapTimer.update(dt, v);
      const fast = !!v && Math.abs(v.speed) > 14;
      const excitement = raceActive() ? 0.9 : fast ? 0.55 : 0.12;
      crowd.update(dt, px, pz, excitement);
      dressing.update(dt, px, pz, night, startLights());
    },
    blips: () => markers,
  };
}
