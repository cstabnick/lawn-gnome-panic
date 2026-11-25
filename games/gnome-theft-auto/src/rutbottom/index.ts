// The Rutbottom Dirt Bowl in the running game (E14): track surface, barriers, starter's tower, pits, signs, story
// vignettes, Marshal Clary Mudguard and the bowl's sounds. Track geometry: raceTrack/defs/rutbottom.ts; the layout
// itself (what stands where) is plan.ts.
import * as THREE from 'three';
import { buildPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import { createAmbientGnomes } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import { homeOf, registerHome } from '../homes/data';
import { createCrowd } from '../raceTrack/crowd';
import { raceActive } from '../raceTrack/state';
import { TRACKS } from '../raceTrack/tracks';
import type { Deck } from '../raceTrack/track';
import { buildDirtTrackSurface } from '../raceTrack/trackMesh';
import { buildSignText } from '../pardonlin/town';
import { playAt } from '../sound';
import { inSite } from '../sites';
import { drapedRibbon } from '../terrainMesh';
import { heightAt } from '../terrain';
import type { Blip, Box, World } from '../types';
import type { Area, AreaDeps } from '../dirtCountry/types';
import { buildBowlPlan } from './plan';
import { STARTER_TOWER } from './spots';

/** A deck in a prefab's own coordinates: surface height y, x and z ranges (front = +z). */
interface LocalDeck { y: number; x0: number; x1: number; z0: number; z1: number }

/** The Sneaker Grandstand's decks, as its prefab is built (packages/prefabs/src/catalog/gta-race-track.ts). */
const SNEAKER_DECKS: readonly LocalDeck[] = [
  { y: 1, x0: -10, x1: 10, z0: 9.5, z1: 11 },
  { y: 2, x0: -10, x1: 10, z0: 8, z1: 9.5 },
  { y: 3, x0: -10, x1: 10, z0: 6.5, z1: 8 },
  { y: 4, x0: -10, x1: 10, z0: 5, z1: 6.5 },
];

const T = TRACKS.rutbottom;
const SITE = 'dirt-track';

/** A local point (x, z) of something at (px, pz) turned by yaw, in world coordinates (three.js rotation.y). */
function local(px: number, pz: number, yaw: number, x: number, z: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [px + x * c + z * s, pz - x * s + z * c];
}

const boxOf = (x: number, z: number, hw: number, hd: number, h: number): Box =>
  ({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, h: heightAt(x, z) + h });

/** m:ss.s */
const fmt = (t: number): string => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};

export function createRutbottom(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  buildDirtTrackSurface(scene, T, { prefix: 'rutbottom' });
  const plan = buildBowlPlan();
  const boxes = world.boxes;

  // ---- Everything static, merged into cells; colliders from the plan ----------------------------------------------------
  const placed: StaticPrefabPlacement[] = [];
  for (const p of [...plan.barriers, ...plan.props]) {
    placed.push({ id: p.id, x: p.x, y: heightAt(p.x, p.z) + (p.y ?? 0), z: p.z, yaw: p.yaw ?? 0, rot: p.rot, scale: p.scale, tint: p.tint, trim: p.trim });
    const so = p.solid;
    if (!so) continue;
    if ('r' in so) boxes.push({ minX: p.x - so.r, maxX: p.x + so.r, minZ: p.z - so.r, maxZ: p.z + so.r, h: heightAt(p.x, p.z) + so.h, shape: 'round' });
    else boxes.push(boxOf(p.x, p.z, so.w / 2, so.d / 2, so.h));
  }
  for (const c of plan.colliders) boxes.push(boxOf(c.x, c.z, c.hw, c.hd, c.h));

  // Grandstands: the prefab, a few colliders over its footprint (apart, so no two share a face), and decks for the crowd.
  const decks: Deck[] = [];
  for (const st of plan.stands) {
    const ground = heightAt(st.x, st.z);
    placed.push({ id: st.id, x: st.x, y: ground, z: st.z, yaw: st.yaw, scale: st.scale });
    for (const d of SNEAKER_DECKS) {
      const [x, z] = local(st.x, st.z, st.yaw, ((d.x0 + d.x1) / 2) * st.scale, ((d.z0 + d.z1) / 2) * st.scale);
      decks.push({ x, z, y: ground + d.y * st.scale, yaw: st.yaw, w: (d.x1 - d.x0) * st.scale, d: (d.z1 - d.z0) * st.scale });
    }
    const b = new THREE.Box3().setFromObject(buildPrefab(st.id, { scale: st.scale }));
    const hw = (b.max.x - b.min.x) / 2, hd = (b.max.z - b.min.z) / 2, cz = (b.max.z + b.min.z) / 2;
    for (let x = -hw + 1.5; x <= hw - 1.5 + 1e-6; x += 3) {
      for (let z = -hd + 1.5; z <= hd - 1.5 + 1e-6; z += 3) {
        const [wx, wz] = local(st.x, st.z, st.yaw, x, z + cz);
        boxes.push(boxOf(wx, wz, 1.4, 1.4, b.max.y));
      }
    }
  }
  scene.add(buildStaticCells(placed, { lights: false, name: 'rutbottom' }));
  scene.add(buildSignText(plan.signs));

  // The pit lane: a dirt ribbon on the area layer (above the run-off tint, below the road), draped on the ground.
  {
    const geo = drapedRibbon(plan.lane, 6, 0.02);
    const mesh = new THREE.Mesh(geo, flatLayer(new THREE.MeshStandardMaterial({ color: 0x7d6446, roughness: 1 }), LAYER.area));
    mesh.name = 'rutbottom-pit-lane';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Clary's home: the foot of the starter's ladder, on the tower's south side (the tower faces north).
  const clary = homeOf('clary');
  if (clary) registerHome({ ...clary, door: [STARTER_TOWER.x, STARTER_TOWER.z + 2.6, 0] });

  const gnomes = createAmbientGnomes(scene, plan.residents);
  const crowd = createCrowd(scene, decks);

  // ---- Sound and the free-roam lap timer --------------------------------------------------------------------------------------
  const tracker = T.tracker();
  let best = Infinity, laps = 0;
  let lastX = NaN, lastZ = NaN, murmurT = 0, cheerCool = 0;
  const nearestDeck = (px: number, pz: number): { x: number; z: number; d: number } | null => {
    let out: { x: number; z: number; d: number } | null = null;
    for (const d of decks) {
      const dist = Math.hypot(d.x - px, d.z - pz);
      if (!out || dist < out.d) out = { x: d.x, z: d.z, d: dist };
    }
    return out;
  };
  const markers: Blip[] = [{ x: 1200, z: -650, color: '#9a7a52', kind: 'speedway', label: 'Rutbottom Dirt Bowl' }];

  return {
    update(dt, px, pz, night) {
      void night;
      gnomes.update(dt, px, pz);
      // Speed from how far the player moved: a vehicle going past the stands flat out earns a cheer.
      const speed = dt > 0 && Number.isFinite(lastX) ? Math.hypot(px - lastX, pz - lastZ) / dt : 0;
      lastX = px; lastZ = pz;
      const fast = speed > 14 && speed < 90;
      cheerCool = Math.max(0, cheerCool - dt);
      murmurT -= dt;
      const near = inSite(SITE, px, pz, 90);
      const deck = near ? nearestDeck(px, pz) : null;
      if (deck && murmurT <= 0) {
        murmurT = 2.2;
        if (deck.d < 90) playAt('crowd-murmur', deck, { maxDist: 90, gain: raceActive() ? 1.3 : 0.8 });
      }
      if (deck && fast && deck.d < 30 && cheerCool <= 0) {
        cheerCool = 5;
        playAt('crowd-cheer', deck, { gain: 0.9, maxDist: 140 });
      }
      crowd.update(dt, px, pz, raceActive() ? 0.9 : fast ? 0.55 : 0.12);

      // The lap timer: only inside the site, and never while a race is running.
      if (!inSite(SITE, px, pz) || raceActive()) {
        if (tracker.next >= 0 || tracker.laps > 0) tracker.reset();
        return;
      }
      if (tracker.update(dt, px, pz) === 'lap') {
        const t = tracker.lapTime;
        best = Math.min(best, t);
        deps.toast(`Rutbottom lap ${fmt(t)} (best ${fmt(best)})`, 3500);
        if (++laps === 1) deps.toast('Clary: "Go on, then. Again."', 3500);
      }
    },
    blips: () => markers,
  };
}
