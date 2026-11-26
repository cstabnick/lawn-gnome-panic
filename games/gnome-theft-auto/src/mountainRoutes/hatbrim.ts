// E33: the Hatband and the Brim Walk dressing: bollard gates, the stile, cairns, Pate's Bothy, the World's Edge lookout, the
// Summit Register, vignettes and residents (issue D2). The plan is data (hatbrimPlan.ts); this turns it into meshes,
// colliders, the register's interact spot and the wind and goats.
import type * as THREE from 'three';
import { getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { createAmbientGnomes } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import { addInteractSpot } from '../interactables';
import { buildSignText } from '../pardonlin/town';
import { propFootprint } from '../pardonlin/plan';
import { boundsOf } from '../pardonlin/layout';
import { playAt } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, Box, World } from '../types';
import { HATBAND_SPOTS } from './defs/hatband';
import { BRIM_WALK_SPOTS } from './defs/brimWalk';
import type { Area, MountainDeps } from './deps';
import { REGISTER_LINES, hatbrimPlan } from './hatbrimPlan';

const WIND_RANGE = 50;
const GOAT_RANGE = 80;

export function createHatbrimDressing(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  const plan = hatbrimPlan();
  const placements: StaticPrefabPlacement[] = [];
  const boxes: Box[] = world.boxes;

  for (const p of plan.props) {
    if (!getPrefab(p.id)) continue;
    const ground = heightAt(p.x, p.z);
    placements.push({ id: p.id, x: p.x, y: ground + (p.y ?? 0), z: p.z, yaw: p.yaw ?? 0, rot: p.rot, scale: p.scale, tint: p.tint, trim: p.trim });
    const f = propFootprint(p);
    if (f && p.solid) {
      const r = boundsOf(f);
      boxes.push('r' in p.solid ? { ...r, h: ground + p.solid.h, shape: 'round' } : { ...r, h: ground + p.solid.h });
    }
  }
  for (const s of plan.solids) {
    const g = heightAt(s.x, s.z);
    boxes.push({ minX: s.x - s.r, maxX: s.x + s.r, minZ: s.z - s.r, maxZ: s.z + s.r, h: g + s.h, shape: 'round' });
  }
  scene.add(buildStaticCells(placements, { lights: false, name: 'e33-hatbrim' }));
  if (plan.signs.length && typeof document !== 'undefined') {
    const text = buildSignText(plan.signs);
    text.name = 'e33-hatbrim-sign-text';
    scene.add(text);
  }

  const people = createAmbientGnomes(scene, plan.residents);

  // The Summit Register: sign it, unlock the achievement, read what the last gnome wrote.
  const summit = BRIM_WALK_SPOTS.summit;
  let lastLine = -1;
  addInteractSpot({
    x: summit.x, z: summit.z, y: heightAt(summit.x, summit.z),
    prompt: 'Sign the Summit Register',
    run(_player, { hud }) {
      deps.unlock('gta-summit-register');
      let i = Math.floor(Math.random() * REGISTER_LINES.length);
      if (i === lastLine) i = (i + 1) % REGISTER_LINES.length;
      lastLine = i;
      hud.toast(REGISTER_LINES[i], 5000);
      return true;
    },
  });

  const edge = HATBAND_SPOTS.worldsEdge;
  const scree = HATBAND_SPOTS.scree;
  let wind = 2;
  let goat = 8 + Math.random() * 10;
  const blip: Blip = { x: summit.x, z: summit.z, color: '#e8e2d0', label: 'The Bobble' };

  return {
    update(dt, px, pz) {
      people.update(dt, px, pz);
      const dSummit = Math.hypot(px - summit.x, pz - summit.z);
      const dEdge = Math.hypot(px - edge.x, pz - edge.z);
      if (dSummit < WIND_RANGE || dEdge < WIND_RANGE) {
        wind -= dt;
        if (wind <= 0) {
          playAt('wind-gust', dSummit < dEdge ? summit : edge);
          wind = 5 + Math.random() * 5;
        }
      }
      if (Math.hypot(px - scree.x, pz - scree.z) < GOAT_RANGE) {
        goat -= dt;
        if (goat <= 0) {
          playAt('goat-bleat', scree);
          goat = 15 + Math.random() * 15;
        }
      }
    },
    blips: () => [blip],
  };
}
