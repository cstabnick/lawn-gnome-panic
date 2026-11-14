// The golfer, the playing partner and the mower golf cart. Parked beside the ball between shots,
// swinging with the meter, and riding the cart to the next spot during 'drive'.
import * as THREE from 'three';
import { CONSUMABLES, GOLFER_LOOK, HOLES, PARTNER_LOOK, type Ctx, type GameState, type System } from './config';
import { createCartModel } from './cartModel';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';
import { mowerPose } from './round';

/** Swing angles (radians). Negative = backswing, positive = follow-through. */
const SWING_TOP = 2.4;
const FOLLOW_THROUGH = 2.2;
const SWEEP_SECONDS = 0.25;
/** The putter swings a short pendulum: every swing angle is scaled by this. */
const PUTTER_SCALE = 0.25;
/** Club held in the right hand: the hand is at local y = HAND_Y in the arm pivot. */
const HAND_Y = -0.32;
const CLUB_SHAFT = 0.62;
/** Seated gnomes hold the wheel with both arms. */
const WHEEL_ARM = -1.2;

/** Cigarillo: lit end and smoke. */
const SMOKE_POOL = 14;
const SMOKE_EVERY = 0.35; // seconds between puffs while smoking
const SMOKE_LIFE = 3;
const SMOKE_RISE = 0.35; // yd/s
const SMOKE_WIND = 0.04; // yd/s per mph of wind
const FLARE_EVERY = 4; // seconds between the bigger exhaled puffs
const GLOW_DIM = 0xff4a00;
const GLOW_BRIGHT = 0xffb040;

/** Golf water sip: arm angles (radians) and head tilt. */
const DRINK_ARM_X = -1.75; // with DRINK_ARM_Z the hand ends at the middle of the face, just in front of the beard
const DRINK_ARM_Z = -1.0;
const DRINK_TILT = -0.12;
/** The partner starts this many seconds after the golfer. */
const PARTNER_DRINK_DELAY = 0.4;

interface Actor {
  model: GnomeModel;
  ps: PlayerState;
}

function makePlayerState(): PlayerState {
  return {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Put a gnome at a standing position (no walking) and advance its model one frame. */
function place(a: Actor, x: number, y: number, z: number, facing: number, dt: number): void {
  a.ps.position.set(x, y, z);
  a.ps.velocity.set(0, 0, 0);
  a.ps.facing = facing;
  a.ps.grounded = true;
  a.model.update(a.ps, dt);
}

/** Set both arm pivots (rotation x and z; y stays 0). Done after model.update so it wins. */
function arms(model: GnomeModel, lx: number, lz: number, rx: number = lx, rz: number = lz): void {
  model.arms.left.rotation.set(lx, 0, lz);
  model.arms.right.rotation.set(rx, 0, rz);
}

/** Swing angle for the golfer's body this frame. `flightFrom` is the angle the follow-through sweeps from. */
function swingAngle(s: GameState, flightFrom: number): number {
  const k = s.club === 'PT' ? PUTTER_SCALE : 1;
  switch (s.phase) {
    case 'aim':
      return 0.08 * Math.sin(s.time * 3);
    case 'swing': {
      const { stage, marker, power } = s.swing;
      if (stage === 'power') return -SWING_TOP * Math.min(1.1, Math.max(0, marker)) * k;
      if (stage === 'accuracy') {
        const r = power > 0 ? clamp(marker / power, 0, 1) : 0;
        return -SWING_TOP * power * r * k;
      }
      return 0;
    }
    case 'flight': {
      const target = FOLLOW_THROUGH * k;
      if (s.phaseTime >= SWEEP_SECONDS) return target;
      return flightFrom + (target - flightFrom) * (s.phaseTime / SWEEP_SECONDS);
    }
    case 'result':
      return FOLLOW_THROUGH * k;
    default:
      return 0;
  }
}

interface Puff {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  /** Seconds since spawn; >= SMOKE_LIFE when the puff is free for reuse. */
  age: number;
  /** Scale at birth and at the end of its life. */
  s0: number;
  s1: number;
}

/** A golf water can, origin at its centre: silver body, printed blue band, darker lid. */
function makeCan(): THREE.Group {
  const can = new THREE.Group();
  const silver = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.6 });
  const band = new THREE.MeshStandardMaterial({ color: 0x2a6fd6, roughness: 0.5 });
  const lid = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 14), silver);
  body.castShadow = true;
  const printed = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.06, 14), band);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.004, 14), lid);
  top.position.y = 0.06;
  can.add(body, printed, top);
  can.visible = false;
  return can;
}

/** The lit cigarillo, built in the golfer's rig space. `tip` is the glowing end, `mouth` where it enters the mouth. */
function makeCigarillo(): { group: THREE.Group; tip: THREE.Mesh; tipMat: THREE.MeshBasicMaterial; mouth: THREE.Vector3 } {
  const group = new THREE.Group();
  const mouth = new THREE.Vector3(0.04, 0.74, 0.16);
  const far = new THREE.Vector3(0.09, 0.71, 0.3);
  const axis = far.clone().sub(mouth).normalize();
  const orient = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
  const brown = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4a84b, roughness: 0.3, metalness: 0.6 });

  // Cylinder +y points from the mouth end (wider) out to the lit end (thinner).
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.16, 8), brown);
  body.position.copy(mouth).addScaledVector(axis, 0.08);
  body.quaternion.copy(orient);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.012, 8), gold);
  band.position.copy(mouth).addScaledVector(axis, 0.025);
  band.quaternion.copy(orient);

  const tipMat = new THREE.MeshBasicMaterial({ color: GLOW_DIM });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), tipMat);
  tip.position.copy(far);

  group.add(body, band, tip);
  return { group, tip, tipMat, mouth };
}

/** Soft round white dot for the smoke sprites. */
function makePuffTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

/**
 * Golf water sip for one gnome. `u` is the progress through the sip (0..1); any other value means not drinking.
 * Raise the can (left arm, from the normal pose towards the mouth), hold with the head tilted back, lower.
 * Runs after the gnome's arms are posed for the frame, so it overrides the left arm.
 */
function sip(model: GnomeModel, can: THREE.Object3D, u: number): void {
  const drinking = u >= 0 && u < 1;
  can.visible = drinking;
  model.rig.rotation.x = 0;
  if (!drinking) return;
  let lift: number;
  let tilt = false;
  if (u < 0.25) {
    lift = u / 0.25;
  } else if (u < 0.75) {
    lift = 1;
    tilt = true;
  } else {
    lift = 1 - (u - 0.75) / 0.25;
  }
  const arm = model.arms.left;
  arm.rotation.x = arm.rotation.x + (DRINK_ARM_X - arm.rotation.x) * lift;
  arm.rotation.z = arm.rotation.z + (DRINK_ARM_Z - arm.rotation.z) * lift;
  if (tilt) model.rig.rotation.x = DRINK_TILT;
}

export function createParty(ctx: Ctx): System {
  const golfer: Actor = { model: createGnomeModel(GOLFER_LOOK), ps: makePlayerState() };
  const partner: Actor = { model: createGnomeModel(PARTNER_LOOK), ps: makePlayerState() };
  const cart = createCartModel();

  // Golf club in the golfer's right hand: the shaft continues the arm down, the head sits at its end.
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.5 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, CLUB_SHAFT), shaftMat);
  shaft.position.set(0, HAND_Y - CLUB_SHAFT / 2, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), headMat);
  head.position.set(0, HAND_Y - CLUB_SHAFT - 0.025, 0);
  shaft.castShadow = true;
  head.castShadow = true;
  golfer.model.arms.right.add(shaft, head);

  ctx.scene.add(golfer.model.object, partner.model.object, cart.group);

  // Cigarillo in the golfer's mouth, lit while state.smokeShots > 0.
  const cig = makeCigarillo();
  golfer.model.rig.add(cig.group);
  const glowDim = new THREE.Color(GLOW_DIM);
  const glowBright = new THREE.Color(GLOW_BRIGHT);

  // Smoke: a pool of sprite puffs, reused oldest-first.
  const puffTex = makePuffTexture();
  const puffs: Puff[] = [];
  for (let i = 0; i < SMOKE_POOL; i++) {
    const mat = new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    ctx.scene.add(sprite);
    puffs.push({ sprite, mat, age: SMOKE_LIFE, s0: 0, s1: 0 });
  }
  const spawnPuff = (pos: THREE.Vector3, s0: number, s1: number): void => {
    let pick = puffs[0];
    for (const p of puffs) {
      if (p.age >= SMOKE_LIFE) {
        pick = p;
        break;
      }
      if (p.age > pick.age) pick = p;
    }
    pick.age = 0;
    pick.s0 = s0;
    pick.s1 = s1;
    pick.sprite.position.copy(pos);
    pick.sprite.visible = true;
  };
  const updatePuffs = (dt: number, s: GameState): void => {
    const drift = s.wind.mph * SMOKE_WIND;
    const wx = Math.sin(s.wind.yaw) * drift;
    const wz = Math.cos(s.wind.yaw) * drift;
    for (const p of puffs) {
      if (p.age >= SMOKE_LIFE) {
        p.sprite.visible = false;
        continue;
      }
      p.age += dt;
      if (p.age >= SMOKE_LIFE) {
        p.sprite.visible = false;
        p.mat.opacity = 0;
        continue;
      }
      const t = p.age / SMOKE_LIFE;
      p.sprite.position.x += wx * dt;
      p.sprite.position.y += SMOKE_RISE * dt;
      p.sprite.position.z += wz * dt;
      p.sprite.scale.setScalar(p.s0 + (p.s1 - p.s0) * t);
      p.mat.opacity = 0.35 * Math.min(1, p.age / 0.3) * (1 - t);
    }
  };
  let emitT = 0; // seconds since the last puff
  let flareT = 0; // seconds since the last exhaled flare
  let sinceFlare = 99; // seconds since the last flare, for the tip's brightness
  const tipWorld = new THREE.Vector3();
  const mouthWorld = new THREE.Vector3();

  // Golf water cans, one in each gnome's left hand (hidden except while drinking).
  const canG = makeCan();
  canG.position.set(0, -0.34, 0.04);
  golfer.model.arms.left.add(canG);
  const canP = makeCan();
  canP.position.set(0, -0.34, 0.04);
  partner.model.arms.left.add(canP);

  let prevPhase: GameState['phase'] = 'title';
  let angle = 0; // golfer's swing angle last frame
  let flightFrom = 0; // angle at the start of the follow-through

  return {
    update(dt: number): void {
      const s = ctx.state;
      const pose = mowerPose(s);
      const riding = s.phase === 'drive';

      // Cart: parked at state.party.mower, or moving during 'drive' (mowerPose handles both).
      cart.group.position.set(pose.x, pose.y, pose.z);
      cart.group.rotation.y = pose.facing;
      cart.animate(dt, riding ? pose.speed : 0);
      cart.group.updateMatrixWorld(true);

      if (s.phase === 'flight' && prevPhase !== 'flight') flightFrom = angle;

      // Golfer
      if (riding) {
        angle = 0;
        const seat = cart.group.localToWorld(cart.seats[0].clone());
        place(golfer, seat.x, seat.y, seat.z, pose.facing, dt);
        arms(golfer.model, WHEEL_ARM, 0);
        golfer.model.rig.rotation.y = 0;
      } else {
        angle = swingAngle(s, flightFrom);
        const g = s.party.golfer;
        const celebrate = s.phase === 'holed' && s.strokes <= HOLES[s.holeIndex].par - 1;
        if (celebrate) {
          const bounce = Math.abs(Math.sin(s.time * 8)) * 0.15;
          place(golfer, g.x, g.y + bounce, g.z, g.facing, dt);
          arms(golfer.model, -2.6, 0);
          golfer.model.rig.rotation.y = 0;
        } else {
          place(golfer, g.x, g.y, g.z, g.facing, dt);
          arms(golfer.model, -0.7, angle);
          golfer.model.rig.rotation.y = angle * 0.25;
        }
      }

      // Partner: rides the cart while driving, otherwise stands beside the ball (claps on a hole).
      if (riding) {
        const seat = cart.group.localToWorld(cart.seats[1].clone());
        place(partner, seat.x, seat.y, seat.z, pose.facing, dt);
        arms(partner.model, WHEEL_ARM, 0);
        partner.model.rig.rotation.y = 0;
      } else {
        const p = s.party.partner;
        place(partner, p.x, p.y, p.z, p.facing, dt);
        if (s.phase === 'holed') {
          const w = 0.3 * (Math.sin(2 * Math.PI * 8 * s.time) >= 0 ? 1 : -1);
          arms(partner.model, -1.4, w, -1.4, -w);
        } else {
          arms(partner.model, 0, 0);
        }
        partner.model.rig.rotation.y = 0;
      }

      // Cigarillo: lit while it has shots left. Tip breathes, flares every FLARE_EVERY seconds, puffs smoke.
      const smoking = s.smokeShots > 0;
      cig.group.visible = smoking;
      if (smoking) {
        golfer.model.object.updateMatrixWorld(true);
        const breathe = 0.5 + 0.5 * Math.sin(s.time * 1.6);
        const flare = Math.max(0, 1 - sinceFlare / 0.6);
        cig.tipMat.color.lerpColors(glowDim, glowBright, clamp(0.4 * breathe + 0.6 * flare, 0, 1));

        emitT += dt;
        flareT += dt;
        sinceFlare += dt;
        if (emitT >= SMOKE_EVERY) {
          emitT -= SMOKE_EVERY;
          cig.tip.getWorldPosition(tipWorld);
          spawnPuff(tipWorld, 0.06, 0.45);
        }
        if (flareT >= FLARE_EVERY) {
          flareT -= FLARE_EVERY;
          sinceFlare = 0;
          mouthWorld.copy(cig.mouth);
          golfer.model.rig.localToWorld(mouthWorld);
          for (let i = 0; i < 3; i++) {
            spawnPuff(mouthWorld.clone().add(new THREE.Vector3((i - 1) * 0.02, 0, 0)), 0.15, 0.45);
          }
        }
      } else {
        emitT = 0;
        flareT = 0;
      }
      updatePuffs(dt, s);

      // Golf water: the golfer sips first, the partner PARTNER_DRINK_DELAY seconds later over the rest of the sip.
      const drinking = s.phase === 'aim';
      const golferU = drinking && s.drinkTime >= 0 ? s.drinkTime / CONSUMABLES.drinkSeconds : -1;
      const partnerU =
        drinking && s.drinkTime >= PARTNER_DRINK_DELAY
          ? (s.drinkTime - PARTNER_DRINK_DELAY) / (CONSUMABLES.drinkSeconds - PARTNER_DRINK_DELAY)
          : -1;
      sip(golfer.model, canG, golferU);
      sip(partner.model, canP, partnerU);

      prevPhase = s.phase;
    },
  };
}
