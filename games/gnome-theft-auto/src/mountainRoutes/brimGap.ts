// E33: the Brim Gap Road's dressing: hairpin signs, the Top Hat café and lookout at Brim Gap, vignettes and residents along
// the road (issue D1). The plan is data (brimGapPlan.ts); this turns it into meshes, colliders, sign text, residents and the
// gap's clink of cups and gusts of wind.
import type * as THREE from 'three';
import { getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { createAmbientGnomes } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import { boundsOf } from '../pardonlin/layout';
import { propFootprint } from '../pardonlin/plan';
import { buildSignText } from '../pardonlin/town';
import { playAt } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, Box, World } from '../types';
import { BRIM_GAP_SPOTS } from './defs/brimGapRoad';
import { brimGapPlan } from './brimGapPlan';
import type { Area, MountainDeps } from './deps';

const CLINK_RANGE = 30;
const WIND_RANGE = 60;
/** The sign kinds that stand on a kit prefab (the text is drawn on its face by buildSignText). */
const SIGN_PREFAB = { menu: 'euro-chalkboard-sign', poster: 'euro-poster-board', street: 'euro-street-sign' } as const;

export function createBrimGapDressing(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  void deps;
  const plan = brimGapPlan();
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
    const ground = heightAt(s.x, s.z);
    if ('r' in s) boxes.push({ minX: s.x - s.r, maxX: s.x + s.r, minZ: s.z - s.r, maxZ: s.z + s.r, h: ground + s.h, shape: 'round' });
    else boxes.push({ ...boundsOf({ x: s.x, z: s.z, w: s.w, d: s.d, yaw: s.yaw }), h: ground + s.h });
  }
  for (const s of plan.signs) {
    if (s.kind !== 'menu' && s.kind !== 'poster' && s.kind !== 'street') continue;
    const id = SIGN_PREFAB[s.kind];
    if (!getPrefab(id)) continue;
    placements.push({ id, x: s.x, y: heightAt(s.x, s.z), z: s.z, yaw: s.yaw });
  }
  scene.add(buildStaticCells(placements, { lights: false, name: 'e33-brim-gap' }));
  if (plan.signs.length && typeof document !== 'undefined') {
    const text = buildSignText(plan.signs);
    text.name = 'e33-brim-gap-sign-text';
    scene.add(text);
  }

  const people = createAmbientGnomes(scene, plan.residents);
  const cafe = BRIM_GAP_SPOTS.cafe;
  const blip: Blip = { x: cafe.x, z: cafe.z, color: '#7a3b2e', label: 'The Top Hat' };
  let clink = 3;
  let wind = 5;

  return {
    update(dt, px, pz) {
      people.update(dt, px, pz);
      const d = Math.hypot(px - cafe.x, pz - cafe.z);
      if (d > WIND_RANGE) return;
      wind -= dt;
      if (wind <= 0) {
        playAt('wind-gust', cafe);
        wind = 6 + Math.random() * 6;
      }
      if (d > CLINK_RANGE) return;
      clink -= dt;
      if (clink <= 0) {
        playAt('cafe-clink', cafe);
        clink = 4 + Math.random() * 3;
      }
    },
    blips: () => [blip],
  };
}
