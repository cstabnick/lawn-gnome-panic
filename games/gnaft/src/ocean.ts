// Water plane, waves, horizon and drifting clouds. All art is built from three.js primitives.
import * as THREE from 'three';
import { COLORS, type Ctx, type System } from './config';
import { raftVelocity } from './rules';

const WATER_SIZE = 400;
const WATER_SEGMENTS = 160;
/** Wave amplitude near the raft (must stay well below RAFT_TOP = 0.3). */
const AMP_NEAR = 0.08;
/** Wave amplitude far from the raft. */
const AMP_FAR = 0.35;
const AMP_NEAR_RADIUS = 12;
const AMP_FAR_RADIUS = 30;

const HORIZON_RADIUS = 2900;
const HORIZON_Y = -0.6;

const CLOUD_COUNT = 14;
const CLOUD_RANGE = 500;
const CLOUD_Y_MIN = 70;
const CLOUD_Y_MAX = 110;
const WIND_X = 0.5;
const WIND_Z = 0.2;
const CLOUD_DRIFT_FACTOR = 0.3;

function amplitudeAt(r: number): number {
  if (r <= AMP_NEAR_RADIUS) return AMP_NEAR;
  if (r >= AMP_FAR_RADIUS) return AMP_FAR;
  const k = (r - AMP_NEAR_RADIUS) / (AMP_FAR_RADIUS - AMP_NEAR_RADIUS);
  return AMP_NEAR + (AMP_FAR - AMP_NEAR) * k;
}

/** Wraps a coordinate into [-CLOUD_RANGE, CLOUD_RANGE] by jumping to the opposite side. */
function wrapCoord(v: number): number {
  if (v > CLOUD_RANGE) return v - 2 * CLOUD_RANGE;
  if (v < -CLOUD_RANGE) return v + 2 * CLOUD_RANGE;
  return v;
}

function makeCloud(): THREE.Group {
  const group = new THREE.Group();
  const puffs = 3 + Math.floor(Math.random() * 3);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  for (let k = 0; k < puffs; k++) {
    const r = 6 + Math.random() * 6;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat);
    puff.scale.y = 0.45;
    puff.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 12);
    puff.castShadow = false;
    group.add(puff);
  }
  group.position.set(
    (Math.random() * 2 - 1) * CLOUD_RANGE,
    CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN),
    (Math.random() * 2 - 1) * CLOUD_RANGE,
  );
  return group;
}

export function createOcean(ctx: Ctx): System {
  const { scene, state } = ctx;
  let t = 0;

  // Water surface.
  const waterGeo = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_SEGMENTS, WATER_SEGMENTS);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: COLORS.water,
    roughness: 0.35,
    metalness: 0.1,
    flatShading: true,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.receiveShadow = true;
  scene.add(water);
  const waterPos = waterGeo.attributes.position as THREE.BufferAttribute;
  const baseX = new Float32Array(waterPos.count);
  const baseZ = new Float32Array(waterPos.count);
  for (let k = 0; k < waterPos.count; k++) {
    baseX[k] = waterPos.getX(k);
    baseZ[k] = waterPos.getZ(k);
  }

  // Horizon: a flat disc far below the water so the sea reaches the far plane.
  const horizonGeo = new THREE.CircleGeometry(HORIZON_RADIUS, 64);
  horizonGeo.rotateX(-Math.PI / 2);
  const horizon = new THREE.Mesh(
    horizonGeo,
    new THREE.MeshStandardMaterial({ color: COLORS.waterDeep, roughness: 0.35, metalness: 0.1 }),
  );
  horizon.position.y = HORIZON_Y;
  scene.add(horizon);

  // Clouds.
  const clouds: THREE.Group[] = [];
  for (let k = 0; k < CLOUD_COUNT; k++) {
    const cloud = makeCloud();
    scene.add(cloud);
    clouds.push(cloud);
  }

  return {
    update(dt: number) {
      t += dt;

      // Waves: sum of three sines in sea coordinates, so the pattern scrolls past as the raft sails.
      const sx = state.sea.x;
      const sz = state.sea.z;
      for (let k = 0; k < waterPos.count; k++) {
        const x = baseX[k];
        const z = baseZ[k];
        const wx = x + sx;
        const wz = z + sz;
        const amp = amplitudeAt(Math.hypot(x, z));
        const s =
          0.5 * Math.sin(wx * 0.35 + t * 1.1) +
          0.3 * Math.sin(wz * 0.45 + t * 0.9) +
          0.2 * Math.sin((wx + wz) * 0.25 - t * 1.4);
        waterPos.setY(k, amp * s);
      }
      waterPos.needsUpdate = true;
      waterGeo.computeVertexNormals();

      // Clouds drift against the raft's motion plus a slow wind, and wrap at the edge.
      const v = raftVelocity(state);
      const dx = (-v.x * CLOUD_DRIFT_FACTOR + WIND_X) * dt;
      const dz = (-v.z * CLOUD_DRIFT_FACTOR + WIND_Z) * dt;
      for (const cloud of clouds) {
        cloud.position.x = wrapCoord(cloud.position.x + dx);
        cloud.position.z = wrapCoord(cloud.position.z + dz);
      }
    },
  };
}
