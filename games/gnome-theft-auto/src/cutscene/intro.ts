// The first-time intro flyover as a camera-only world-stage SceneScript: across Turfton and the biomes, then down
// behind the player at the spawn. introTour.ts plays it; intro.test.ts checks every shot.
import { heightAt } from '../terrain';
import type { SceneScript, Step, Vec3 } from './script';

const FOV = 56;

/** Camera waypoints (world coordinates): each leg flies from one to the next. The last one is set per spawn. */
const CAM: Vec3[] = [
  [45, 120, -160],
  [28, 120, -10],
  [-75, 120, 70],
  [40, 120, 165],
];
/** What the camera looks at: each leg pans from one to the next. */
const LOOK: Vec3[] = [
  [0, 90, -20],
  [45, 90, -25],
  [-90, 90, 80],
  [0, 90, 40],
];
/** Seconds and captions per leg. */
const LEGS: { s: number; caption: string }[] = [
  { s: 4.0, caption: 'WELCOME TO TURFTON — EVERY BLADE OF GRASS IS SPONSORED' },
  { s: 3.8, caption: 'MOWERS ARE FOR BORROWING. THE HAT WATCH IS WATCHING.' },
  { s: 3.8, caption: 'FIVE BIOMES. ZERO PERMITS. ONE GOLDEN ACORN.' },
  { s: 4.5, caption: 'MEET PIP POTSWORTH ACROSS THE STREET' },
];

/** Behind the spawn point (6.5 m, 3.2 m up), looking at the gnome's head. */
export function introScript(spawn: { x: number; z: number; yaw: number }): SceneScript {
  const ground = heightAt(spawn.x, spawn.z);
  const backX = spawn.x - Math.sin(spawn.yaw) * 6.5;
  const backZ = spawn.z - Math.cos(spawn.yaw) * 6.5;
  const endCam: Vec3 = [backX, heightAt(backX, backZ) + 3.2, backZ];
  const endLook: Vec3 = [spawn.x, ground + 1, spawn.z];

  const cams = [...CAM, endCam];
  const looks = [...LOOK, endLook];
  const steps: Step[] = [];
  LEGS.forEach((leg, i) => {
    steps.push({ do: 'caption', text: leg.caption });
    steps.push({
      do: 'cam',
      wait: true,
      shot: { kind: 'dolly', from: cams[i], to: cams[i + 1], look: looks[i], lookTo: looks[i + 1], s: leg.s, fov: FOV },
    });
  });
  return { id: 'intro', stage: { kind: 'world' }, steps };
}
