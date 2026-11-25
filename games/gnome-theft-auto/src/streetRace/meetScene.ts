// E26: one street-race meet in the world: its props, signs, vignettes, organiser, bookie, flag-dropper, residents, crowd,
// lights and sound, from the data in meets.ts (where) and cast.ts (who). Built the way rutbottom/index.ts builds its bowl:
// static props in one buildStaticCells call, colliders pushed to world.boxes, people as ambient gnomes.
import * as THREE from 'three';
import { buildPrefab, getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { createAmbientGnomes, type AmbientGnomeDef } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import { buildSignText } from '../pardonlin/town';
import type { PlanSign } from '../pardonlin/plan';
import { playAt } from '../sound';
import { heightAt } from '../terrain';
import type { Area, AreaDeps } from '../dirtCountry/types';
import type { Box, World } from '../types';
import type { MeetCast, MeetSpot, StreetMeet } from './types';

/** Colliders of vignette props wider than this (m) get a box; smaller props are decoration only. */
const COLLIDER_MIN_WIDTH = 0.8;
/** Gap taken off each side of a collider, so two colliders never share a face. */
const COLLIDER_INSET = 0.05;
/** Murmur and rev reach: spectators are only heard within this many metres of the centre. */
const HEAR_DIST = 70;
const MURMUR_EVERY = 2.5;

/** The crowd's cheers, said when the player walks past (one per spectator, by index). */
const CHEERS = [
  'Go on, my son! Go on, my lovely pair of ankles!',
  'That was not a corner. That was a suggestion, and you ignored it.',
  'Ten acorns says the lowrider sheds a hubcap by the bend.',
  'Is it a race? I thought it was a bring-a-ladder.',
  'My nan could go faster, and she is in a wheelchair. Well, a pram.',
  'Wave the flag, Wick! Wave it at somebody!',
];

/** A local point (dx, dz) of something at (ax, az) turned by yaw (world = (x + dx cos + dz sin, z - dx sin + dz cos)). */
function local(ax: number, az: number, yaw: number, dx: number, dz: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [ax + dx * c + dz * s, az - dx * s + dz * c];
}

/** The collider over a prefab placed at (x, z) facing yaw, or null when it is narrower than COLLIDER_MIN_WIDTH. */
function footprintBox(id: string, scale: number, x: number, z: number, yaw: number): Box | null {
  const b = new THREE.Box3().setFromObject(buildPrefab(id, { scale }));
  if (Math.max(b.max.x - b.min.x, b.max.z - b.min.z) <= COLLIDER_MIN_WIDTH) return null;
  const corners = [
    [b.min.x, b.min.z], [b.max.x, b.min.z], [b.min.x, b.max.z], [b.max.x, b.max.z],
  ].map(([lx, lz]) => local(x, z, yaw, lx, lz));
  const xs = corners.map((c) => c[0]), zs = corners.map((c) => c[1]);
  return {
    minX: Math.min(...xs) + COLLIDER_INSET,
    maxX: Math.max(...xs) - COLLIDER_INSET,
    minZ: Math.min(...zs) + COLLIDER_INSET,
    maxZ: Math.max(...zs) - COLLIDER_INSET,
    h: heightAt(x, z) + b.max.y,
  };
}

/** A spectator's gnome: a cheer and a look-around, from the crowd's looks. */
function spectator(meet: StreetMeet, cast: MeetCast, i: number, spot: MeetSpot): AmbientGnomeDef {
  const looks = cast.crowdLooks;
  return {
    id: `${meet.id}-spectator-${i}`,
    name: 'Spectator',
    x: spot.x,
    z: spot.z,
    yaw: spot.yaw,
    look: looks[i % looks.length],
    bubble: CHEERS[i % CHEERS.length],
    idle: 'look-around',
  };
}

const personDef = (p: { id: string; name: string; look: Partial<AmbientGnomeDef['look']>; bubble: string; idle?: AmbientGnomeDef['idle'] }, spot: MeetSpot): AmbientGnomeDef =>
  ({ id: p.id, name: p.name, x: spot.x, z: spot.z, yaw: spot.yaw, look: p.look, bubble: p.bubble, idle: p.idle });

export function buildMeet(scene: THREE.Scene, world: World, meet: StreetMeet, cast: MeetCast, deps: AreaDeps): Area {
  void deps;
  const boxes = world.boxes;
  const centre = meet.centre;

  // ---- Static props: vignettes, dressing, night lamps (one merged batch; colliders for the wide vignette props) -----------
  const placed: StaticPrefabPlacement[] = [];
  const place = (id: string, x: number, z: number, yaw: number, scale = 1): boolean => {
    if (!getPrefab(id)) {
      console.warn(`[streetRace] meet ${meet.id}: unknown prefab "${id}"`);
      return false;
    }
    placed.push({ id, x, y: heightAt(x, z), z, yaw, scale });
    return true;
  };

  cast.vignettes.forEach((v, vi) => {
    const anchor = meet.vignettes[vi];
    if (!anchor) return;
    for (const p of v.props) {
      const [x, z] = local(anchor.x, anchor.z, anchor.yaw, p.dx, p.dz);
      const yaw = anchor.yaw + (p.yaw ?? 0);
      const scale = p.scale ?? 1;
      if (!place(p.id, x, z, yaw, scale)) continue;
      const box = footprintBox(p.id, scale, x, z, yaw);
      if (box) boxes.push(box);
    }
  });

  // Dressing: cones along the flagger's kerb line (lateral to its facing), a tyre stack beside the bookie.
  for (const dx of [-4.5, -1.5, 1.5, 4.5]) {
    const [x, z] = local(meet.flagger.x, meet.flagger.z, meet.flagger.yaw, dx, 0.6);
    place('site-cone', x, z, meet.flagger.yaw);
  }
  {
    const [x, z] = local(meet.bookie.x, meet.bookie.z, meet.bookie.yaw, 2.2, 0);
    place('tyre-pile', x, z, meet.bookie.yaw);
  }
  if (meet.night) {
    const { x, z, hw, hd } = meet.area;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      place('street-lamp', x + sx * (hw - 1.5), z + sz * (hd - 1.5), 0);
    }
  }
  scene.add(buildStaticCells(placed, { lights: false, name: `meet-${meet.id}` }));

  // Signs: one per sign spot, text from the cast (a sub line under the headline), facing the anchor's yaw.
  const signs: PlanSign[] = [];
  cast.signs.forEach((s, i) => {
    const spot = meet.signs[i];
    if (!spot) return;
    signs.push({ kind: 'poster', text: s.sub ? `${s.text}\n${s.sub}` : s.text, x: spot.x, z: spot.z, yaw: spot.yaw });
  });
  if (signs.length) scene.add(buildSignText(signs));

  // ---- People: organiser, bookie, flagger, residents (always), crowd (a night group after dark for night meets) ---------
  const regulars: AmbientGnomeDef[] = [
    personDef(cast.organiser, meet.organiser),
    personDef(cast.bookie, meet.bookie),
    personDef(cast.flagger, meet.flagger),
    ...meet.residents.flatMap((spot, i) => {
      const r = cast.residents[i];
      return r ? [personDef(r, spot)] : [];
    }),
  ];
  const crowd = meet.crowd.map((spot, i) => spectator(meet, cast, i, spot));
  const dayCrowd = meet.night ? crowd.slice(0, Math.ceil(crowd.length / 3)) : crowd;
  const nightCrowd = meet.night ? crowd.slice(dayCrowd.length) : [];
  const always = createAmbientGnomes(scene, [...regulars, ...dayCrowd]);
  // The after-dark crowd is built the first time it is needed, so by day it is not in the scene at all (the ambient
  // gnome API has no hide), then updated from then on.
  let night: { update(dt: number, px: number, pz: number): void } | null = null;

  // ---- Sound -------------------------------------------------------------------------------------------------------------
  let murmurT = 0;

  return {
    update(dt, px, pz, nightLevel) {
      always.update(dt, px, pz);
      if (nightCrowd.length && nightLevel > 0.5) {
        if (!night) night = createAmbientGnomes(scene, nightCrowd);
        night.update(dt, px, pz);
      }
      const dist = Math.hypot(px - centre.x, pz - centre.z);
      murmurT -= dt;
      if (dist < HEAR_DIST && murmurT <= 0) {
        murmurT = MURMUR_EVERY;
        playAt('crowd-murmur', centre, { maxDist: HEAR_DIST, gain: meet.night ? 1.1 : 0.6 });
      }
    },
    blips: () => [{ x: centre.x, z: centre.z, color: '#ff3d7f', kind: 'speedway', label: meet.name }],
  };
}
