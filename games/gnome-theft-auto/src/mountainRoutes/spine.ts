// E33: the Spine Cut's dressing: the Keyhole arch, signs, vignettes and residents (issue D3). The plan is data
// (spinePlan.ts); this turns it into meshes, colliders and the gorge's wind and crows.
import type * as THREE from 'three';
import { getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { createAmbientGnomes } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import { buildSignText } from '../pardonlin/town';
import { propFootprint } from '../pardonlin/plan';
import { boundsOf } from '../pardonlin/layout';
import { playAt } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, Box, World } from '../types';
import { SPINE_CUT_SPOTS } from './defs/spineCut';
import type { Area, MountainDeps } from './deps';
import { spinePlan } from './spinePlan';

const GORGE_RANGE = 40;

export function createSpineCutDressing(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  void deps;
  const plan = spinePlan();
  const k = SPINE_CUT_SPOTS.keyhole;
  const placements: StaticPrefabPlacement[] = [];
  const boxes: Box[] = world.boxes;

  for (const p of plan.props) {
    if (!getPrefab(p.id)) continue;
    // The arch stands on the road bed: its pillars bite into the gorge walls on either side.
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
  scene.add(buildStaticCells(placements, { lights: false, name: 'e33-spine-cut' }));
  if (plan.signs.length && typeof document !== 'undefined') {
    const text = buildSignText(plan.signs);
    text.name = 'e33-spine-cut-sign-text';
    scene.add(text);
  }

  const people = createAmbientGnomes(scene, plan.residents);
  let wind = 3;
  let crow = 14;
  const blip: Blip = { x: k.x, z: k.z, color: '#8a7a66', label: 'The Keyhole' };

  return {
    update(dt, px, pz) {
      people.update(dt, px, pz);
      const d = Math.hypot(px - k.x, pz - k.z);
      if (d > GORGE_RANGE) return;
      wind -= dt;
      if (wind <= 0) {
        playAt('wind-gust', k);
        wind = 6 + Math.random() * 6;
      }
      crow -= dt;
      if (crow <= 0) {
        playAt('crow', { x: k.x, z: k.z });
        crow = 14 + Math.random() * 16;
      }
    },
    blips: () => [blip],
  };
}
