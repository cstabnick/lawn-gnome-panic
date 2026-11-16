// Gnome movement, jumping, swimming, collision with the raft and the third-person mouse-look camera.
import * as THREE from 'three';
import { CHARACTERS, FISHING, KEYS, RAFT_TOP, SWIM, TILE_SIZE, TOOLS, TUNING, type Ctx, type System } from './config';
import { createGnomeModel } from './gnome';
import { getMyGnome } from '@lawn/gnome';
import { islandAt, notify, raftVelocity, surfaceY, tileAt, wallBlocks } from './rules';
import { sfx } from './audio';

/** Pitch limits in radians (slightly below flat, up to looking down steeply). */
const PITCH_MIN = -0.15;
const PITCH_MAX = 1.2;
/** How fast the gnome turns to face its walking direction (per second, exponential). */
const TURN_RATE = 12;
/** Collision probe: a step is checked this far ahead of the gnome. */
const WALL_MARGIN = 0.3;
/** Height difference up to which a grounded gnome steps up or down onto a floor. */
const STEP_HEIGHT = 0.3;
/** Interval between swimming splashes while moving through the water. */
const SWIM_SFX_INTERVAL = 0.5;
/** Height the gnome is raised by while sitting on the riding mower. */
const RIDING_SEAT_Y = 0.55;
/** Camera: look-at point above the feet, and the lowest the camera may go. */
const CAMERA_TARGET_HEIGHT = 1.2;
const CAMERA_MIN_Y = 0.5;
/** Title screen orbit around the raft. */
const TITLE_CENTER_X = 1;
const TITLE_CENTER_Z = 1;
const TITLE_RADIUS = 12;
const TITLE_HEIGHT = 6;
const TITLE_SPEED = 0.1;
const TITLE_LOOK_Y = 0.5;
/** Camera zoom: how fast the distance catches up with the wheel target (per second, exponential). */
const ZOOM_RATE = 10;
const ZOOM_WHEEL_STEP = 0.01;
/** Grass puffs under the feet while running. */
const PUFF_MAX = 40;
const PUFF_INTERVAL = 0.12;
const PUFF_LIFE = 0.4;
const PUFF_RISE = 0.3;
const PUFF_SIZE = 0.06;
const PUFF_PER_STEP = 3;
const PUFF_RUN_SPEED = 3;
const PUFF_SPREAD = 0.3;
const PUFF_GRASS = 0x5fae3c;
const PUFF_SAND = 0xe8d29a;

interface Puff {
  mesh: THREE.Mesh;
  active: boolean;
  age: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

export function createPlayer(ctx: Ctx): System {
  const { camera, input } = ctx;
  const model = createGnomeModel(getMyGnome()?.look ?? CHARACTERS.gnorman.look);
  ctx.scene.add(model.object);

  let yaw = 0;
  let pitch = 0.35;
  let elapsed = 0;
  let zoomTarget: number = TUNING.cameraDistance;
  let distance: number = TUNING.cameraDistance;
  let puffTimer = 0;
  let swimSfxTimer = 0;

  // Pooled grass puff meshes: each step takes PUFF_PER_STEP of them, and they are hidden when done.
  const puffGeo = new THREE.BoxGeometry(PUFF_SIZE, PUFF_SIZE, PUFF_SIZE);
  const grassMat = new THREE.MeshStandardMaterial({ color: PUFF_GRASS });
  const sandMat = new THREE.MeshStandardMaterial({ color: PUFF_SAND });
  const puffs: Puff[] = [];
  for (let i = 0; i < PUFF_MAX; i++) {
    const mesh = new THREE.Mesh(puffGeo, grassMat);
    mesh.visible = false;
    ctx.scene.add(mesh);
    puffs.push({ mesh, active: false, age: 0, baseX: 0, baseY: 0, baseZ: 0 });
  }

  const spawnPuffs = (x: number, y: number, z: number, mat: THREE.Material): void => {
    for (let k = 0; k < PUFF_PER_STEP; k++) {
      const puff = puffs.find((q) => !q.active);
      if (!puff) return;
      puff.active = true;
      puff.age = 0;
      puff.baseX = x + (Math.random() - 0.5) * PUFF_SPREAD;
      puff.baseY = y;
      puff.baseZ = z + (Math.random() - 0.5) * PUFF_SPREAD;
      puff.mesh.material = mat;
      puff.mesh.visible = true;
    }
  };

  const updatePuffs = (dt: number): void => {
    for (const puff of puffs) {
      if (!puff.active) continue;
      puff.age += dt;
      if (puff.age >= PUFF_LIFE) {
        puff.active = false;
        puff.mesh.visible = false;
        continue;
      }
      const t = puff.age / PUFF_LIFE;
      puff.mesh.position.set(puff.baseX, puff.baseY + PUFF_RISE * t, puff.baseZ);
      puff.mesh.scale.setScalar(1 - t);
    }
  };

  return {
    update(dt: number) {
      const s = ctx.state;
      const p = s.player;
      const moving = s.mode === 'play' || s.mode === 'build';
      const rv = raftVelocity(s);
      elapsed += dt;

      // Mouse wheel zoom (not in telescope mode), smoothed toward the target distance.
      if (s.mode === 'play' || s.mode === 'build' || s.mode === 'craft') {
        const next = zoomTarget + input.wheel() * ZOOM_WHEEL_STEP;
        zoomTarget = Math.min(TUNING.zoomMax, Math.max(TUNING.zoomMin, next));
      }
      distance += (zoomTarget - distance) * (1 - Math.exp(-ZOOM_RATE * dt));

      if (s.mode === 'title') {
        const a = elapsed * TITLE_SPEED;
        camera.position.set(
          TITLE_CENTER_X + Math.cos(a) * TITLE_RADIUS,
          TITLE_HEIGHT,
          TITLE_CENTER_Z + Math.sin(a) * TITLE_RADIUS,
        );
        camera.lookAt(TITLE_CENTER_X, TITLE_LOOK_Y, TITLE_CENTER_Z);
      }

      // Normalised walking direction from the keys, relative to the camera (zero when not walking).
      let dx = 0;
      let dz = 0;

      if (moving) {
        // Mouse look only while the pointer is locked.
        if (input.locked()) {
          const { dx: lookX, dy } = input.look();
          yaw -= lookX * TUNING.mouseSensitivity;
          pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch + dy * TUNING.mouseSensitivity));
        }

        // Walking direction relative to the camera. Right is (-cos yaw, 0, sin yaw), which is the
        // camera's screen-right when looking along forward (sin yaw, 0, cos yaw).
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        const rx = -Math.cos(yaw);
        const rz = Math.sin(yaw);
        const fwd = (input.down(KEYS.forward) ? 1 : 0) - (input.down(KEYS.back) ? 1 : 0);
        const side = (input.down(KEYS.right) ? 1 : 0) - (input.down(KEYS.left) ? 1 : 0);
        const ix = fx * fwd + rx * side;
        const iz = fz * fwd + rz * side;
        const len = Math.hypot(ix, iz);
        if (len > 0) {
          dx = ix / len;
          dz = iz / len;
        }

        // Swimming: normal walking speed without sprint or tool bonus.
        const sprint = input.down(KEYS.sprint) || input.down('ShiftRight') ? TUNING.sprintMult : 1;
        const speed = p.swimming ? SWIM.speed : TUNING.moveSpeed * TOOLS[s.equipped].speedMult * sprint;
        p.velocity.x = dx * speed;
        p.velocity.z = dz * speed;

        // Turn toward the walking direction along the shortest angle.
        if (len > 0) {
          const target = Math.atan2(dx, dz);
          const diff = Math.atan2(Math.sin(target - p.facing), Math.cos(target - p.facing));
          p.facing += diff * Math.min(1, TURN_RATE * dt);
        }

        // Move one axis at a time; a step is rejected when a shed wall blocks it.
        const nx = p.position.x + p.velocity.x * dt;
        if (!wallBlocks(s, p.position.x, p.position.z, nx, p.position.z, WALL_MARGIN, p.position.y)) {
          p.position.x = nx;
        } else {
          p.velocity.x = 0;
        }
        const nz = p.position.z + p.velocity.z * dt;
        if (!wallBlocks(s, p.position.x, p.position.z, p.position.x, nz, WALL_MARGIN, p.position.y)) {
          p.position.z = nz;
        } else {
          p.velocity.z = 0;
        }

        if (!p.swimming && input.pressed(KEYS.jump) && p.jumpsUsed < 2) {
          p.velocity.y = TUNING.jumpSpeed;
          p.jumpsUsed++;
          p.grounded = false;
        }
      } else {
        // Title, telescope and craft: no walking.
        p.velocity.x = 0;
        p.velocity.z = 0;
      }

      // Islands move past the raft, so a gnome standing on island ground is carried with them.
      if (
        !p.swimming &&
        s.mode !== 'title' &&
        tileAt(s, p.position.x, p.position.z) === undefined &&
        islandAt(s, p.position.x, p.position.z) !== null
      ) {
        p.position.x -= rv.x * dt;
        p.position.z -= rv.z * dt;
      }

      // Swimming: drift with the water, bob, climb out, rescue.
      if (p.swimming) {
        if (dx !== 0 || dz !== 0) {
          swimSfxTimer += dt;
          if (swimSfxTimer >= SWIM_SFX_INTERVAL) {
            swimSfxTimer -= SWIM_SFX_INTERVAL;
            sfx('swim');
          }
        } else {
          swimSfxTimer = 0;
        }

        // The water carries the gnome: the current, minus the raft's own motion.
        p.position.x += (FISHING.current.x - rv.x) * SWIM.driftMult * dt;
        p.position.z += (FISHING.current.z - rv.z) * SWIM.driftMult * dt;
        p.position.y = SWIM.feetY + Math.sin(elapsed * 2) * SWIM.bob;

        // Climb out onto ground just ahead in the swim direction, or onto ground that drifted under the gnome.
        const ax = p.position.x + dx * SWIM.climbReach;
        const az = p.position.z + dz * SWIM.climbReach;
        const aheadY = dx !== 0 || dz !== 0 ? surfaceY(s, ax, az) : null;
        const underY = surfaceY(s, p.position.x, p.position.z);
        let climbY: number | null = null;
        if (aheadY !== null && !wallBlocks(s, p.position.x, p.position.z, ax, az, WALL_MARGIN, p.position.y)) {
          p.position.x = ax;
          p.position.z = az;
          climbY = aheadY;
        } else if (underY !== null) {
          climbY = underY;
        }
        if (climbY !== null) {
          p.position.y = climbY;
          p.velocity.y = 0;
          p.swimming = false;
          p.grounded = true;
          p.jumpsUsed = 0;
          sfx('swim');
        }

        // Too far out and nothing under the gnome: hauled back to the nearest raft tile.
        if (
          p.swimming &&
          Math.hypot(p.position.x, p.position.z) > SWIM.rescueDistance &&
          surfaceY(s, p.position.x, p.position.z) === null
        ) {
          let best: { x: number; z: number; y: number } | null = null;
          let bestD = Infinity;
          for (const t of s.tiles.values()) {
            const cx = t.i * TILE_SIZE;
            const cz = t.j * TILE_SIZE;
            const d = Math.hypot(cx, cz);
            if (d < bestD) {
              bestD = d;
              best = { x: cx, z: cz, y: surfaceY(s, cx, cz) ?? RAFT_TOP };
            }
          }
          if (best) {
            p.position.set(best.x, best.y, best.z);
            p.velocity.x = 0;
            p.velocity.z = 0;
            p.velocity.y = 0;
            p.swimming = false;
            p.grounded = true;
            p.jumpsUsed = 0;
            notify(s, 'You grabbed the safety rope and hauled yourself back aboard.');
          }
        }
      }

      // Ground and gravity. Not applied while swimming: the water code above owns the feet then.
      if (!p.swimming) {
        if (p.grounded) {
          const g = surfaceY(s, p.position.x, p.position.z);
          if (g === null) {
            // Walked or drifted off the edge: start falling.
            p.grounded = false;
            p.velocity.y = 0;
          } else if (moving && Math.abs(g - p.position.y) < STEP_HEIGHT) {
            // Step up onto (or down from) a nearby floor.
            p.position.y = g;
          }
        }
        if (!p.grounded) {
          p.velocity.y -= TUNING.gravity * dt;
          p.position.y += p.velocity.y * dt;
          const g = surfaceY(s, p.position.x, p.position.z);
          if (p.velocity.y <= 0 && g !== null && p.position.y <= g) {
            // Landed on ground.
            p.position.y = g;
            p.velocity.y = 0;
            p.grounded = true;
            p.jumpsUsed = 0;
          } else if (p.velocity.y <= 0 && g === null && p.position.y <= SWIM.feetY) {
            // Fell into the sea.
            p.swimming = true;
            p.velocity.y = 0;
            p.grounded = true;
            p.jumpsUsed = 0;
            sfx('splash');
          }
        }
      }

      // Grass puffs while running on the raft or on an island (sand). None while swimming.
      const runSpeed = Math.hypot(p.velocity.x, p.velocity.z);
      if (moving && p.grounded && !p.swimming && runSpeed > PUFF_RUN_SPEED) {
        puffTimer += dt;
        if (puffTimer >= PUFF_INTERVAL) {
          puffTimer -= PUFF_INTERVAL;
          const onTile = tileAt(s, p.position.x, p.position.z) !== undefined;
          spawnPuffs(p.position.x, p.position.y, p.position.z, onTile ? grassMat : sandMat);
        }
      } else {
        puffTimer = 0;
      }
      updatePuffs(dt);

      // Camera: third-person orbit round the gnome. Telescope mode drives the camera itself.
      if (moving || s.mode === 'craft') {
        const target = new THREE.Vector3(p.position.x, p.position.y + CAMERA_TARGET_HEIGHT, p.position.z);
        const cp = Math.cos(pitch);
        const dist = distance;
        camera.position.set(
          target.x + -Math.sin(yaw) * cp * dist,
          target.y + Math.sin(pitch) * dist,
          target.z + -Math.cos(yaw) * cp * dist,
        );
        if (camera.position.y < CAMERA_MIN_Y) camera.position.y = CAMERA_MIN_Y;
        camera.lookAt(target);
      }

      model.update(p, dt);
      model.object.visible = s.mode !== 'telescope';
      if (s.equipped === 'riding' && !p.swimming) model.object.position.y += RIDING_SEAT_Y;
    },
  };
}
