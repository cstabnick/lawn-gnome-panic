// The golfer, the playing partner and the mower golf cart. Parked beside the ball between shots,
// swinging with the meter, and riding the cart to the next spot during 'drive'.
// Online: every player is their own gnome (with a name tag). Lobby and Together ride a convoy of 4-seat carts;
// Gnome w/ Friends draws my own cart and gnome only (remotes.ts draws the others).
import * as THREE from 'three';
import { getMyGnome } from '@lawn/gnome';
import { CART_COLORS, CONSUMABLES, GOLFER_LOOK, HOLES, PARTNER_LOOK, lookWithHat, type Ctx, type GameState, type Golfer, type OnlineView, type System } from './config';
import { createCartModel, type CartModel } from './cartModel';
import { createZ33Model } from './z33Model';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';
import { cartCount, cartPose, convoySeats, mowerPose } from './round';

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

/** Online name tags: height above the feet, and the sprite size (yards). */
const TAG_HEIGHT = 2.0;
const TAG_W = 1.6;
const TAG_H = 0.4;

interface Actor {
  model: GnomeModel;
  ps: PlayerState;
}

/** A golf water can and club host: anything that can sip from a can. */
interface Sipper {
  model: GnomeModel;
  can: THREE.Object3D;
}

/** One online player's gnome: model, club (shown while playing), golf water can, and name tag. */
interface OnlineGnome extends Actor, Sipper {
  id: number;
  club: THREE.Object3D;
  tag: NameTag;
}

interface NameTag {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  tex: THREE.CanvasTexture;
  g2d: CanvasRenderingContext2D | null;
  /** What the canvas currently shows; the canvas is only redrawn when this changes. */
  key: string;
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

/** Add or remove an object from the scene (no-op when it is already in that state). */
function attach(obj: THREE.Object3D, on: boolean, scene: THREE.Scene): void {
  if (on && !obj.parent) scene.add(obj);
  else if (!on && obj.parent) scene.remove(obj);
}

function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** An empty name tag sprite. paintNameTag fills it. */
function makeNameTag(): NameTag {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, sizeAttenuation: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(TAG_W, TAG_H, 1);
  return { sprite, mat, tex, g2d: canvas.getContext('2d'), key: '' };
}

/** Draws `name` in the golfer's colour on a dark rounded backing (redrawn only when the text or colour changes). */
function paintNameTag(t: NameTag, name: string, color: number, arrow: boolean): void {
  const key = `${arrow ? 1 : 0}|${color}|${name}`;
  if (key === t.key) return;
  t.key = key;
  const g = t.g2d;
  if (!g) return;
  g.clearRect(0, 0, 512, 128);
  g.fillStyle = 'rgba(0,0,0,0.55)';
  roundRectPath(g, 4, 12, 504, 104, 36);
  g.fill();
  const text = (arrow ? '▶ ' : '') + name;
  let size = 56;
  g.font = `bold ${size}px sans-serif`;
  while (g.measureText(text).width > 480 && size > 20) {
    size -= 4;
    g.font = `bold ${size}px sans-serif`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  g.fillText(text, 256, 66);
  t.tex.needsUpdate = true;
}

export function createParty(ctx: Ctx): System {
  const golfer: Actor = { model: createGnomeModel(getMyGnome()?.look ?? GOLFER_LOOK), ps: makePlayerState() };
  const partner: Actor = { model: createGnomeModel(PARTNER_LOOK), ps: makePlayerState() };
  // Both rides are built up front; state.ride (the 350z title cheat) picks which one is shown.
  const mowerCart = createCartModel();
  const z33 = createZ33Model();
  let cart = mowerCart;

  // Golf club in the golfer's right hand: the shaft continues the arm down, the head sits at its end.
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.5 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  const makeClub = (): THREE.Group => {
    const club = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, CLUB_SHAFT), shaftMat);
    shaft.position.set(0, HAND_Y - CLUB_SHAFT / 2, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), headMat);
    head.position.set(0, HAND_Y - CLUB_SHAFT - 0.025, 0);
    shaft.castShadow = true;
    head.castShadow = true;
    club.add(shaft, head);
    return club;
  };
  golfer.model.arms.right.add(makeClub());

  ctx.scene.add(golfer.model.object, partner.model.object, mowerCart.group, z33.group);

  // Cigarillo in the golfer's mouth, lit while state.smokeShots > 0. Online it moves to the gnome that is playing.
  const cig = makeCigarillo();
  golfer.model.rig.add(cig.group);
  let cigHost: GnomeModel = golfer.model;
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

  // ---- Online ----------------------------------------------------------------------------
  /** One gnome per online golfer, keyed by golfer id. */
  const gnomes = new Map<number, OnlineGnome>();
  /** Convoy carts (4 seats, colour per cart index). Built as needed. */
  const convoy: CartModel[] = [];
  /** Race mode: my own 2-seat cart, in my colour. */
  let raceCart: { cart: CartModel; color: number } | null = null;

  const convoyCart = (k: number): CartModel => {
    while (convoy.length <= k) {
      convoy.push(createCartModel({ seats: 4, color: CART_COLORS[convoy.length % CART_COLORS.length] }));
    }
    return convoy[k];
  };
  const raceCartFor = (color: number): CartModel => {
    if (!raceCart || raceCart.color !== color) {
      if (raceCart) attach(raceCart.cart.group, false, ctx.scene);
      raceCart = { cart: createCartModel({ color }), color };
    }
    return raceCart.cart;
  };

  const makeOnlineGnome = (g: Golfer): OnlineGnome => {
    const model = createGnomeModel(lookWithHat(g.color, g.look));
    const club = makeClub();
    model.arms.right.add(club);
    const can = makeCan();
    can.position.set(0, -0.34, 0.04);
    model.arms.left.add(can);
    return { id: g.id, model, ps: makePlayerState(), can, club, tag: makeNameTag() };
  };
  const gnomeFor = (g: Golfer): OnlineGnome => {
    let e = gnomes.get(g.id);
    if (!e) {
      e = makeOnlineGnome(g);
      gnomes.set(g.id, e);
    }
    return e;
  };
  const dropGnome = (id: number): void => {
    const e = gnomes.get(id);
    if (!e) return;
    attach(e.model.object, false, ctx.scene);
    attach(e.tag.sprite, false, ctx.scene);
    e.tag.tex.dispose();
    e.tag.mat.dispose();
    gnomes.delete(id);
  };
  /** Solo, or the match is over: nothing online stays on screen. */
  const dropAllOnline = (): void => {
    for (const id of [...gnomes.keys()]) dropGnome(id);
    for (const c of convoy) attach(c.group, false, ctx.scene);
    if (raceCart) attach(raceCart.cart.group, false, ctx.scene);
  };

  /** Position a cart at its pose for this frame (so its seats can be converted to world space). */
  const poseCart = (c: CartModel, p: { x: number; y: number; z: number; facing: number; speed: number }, riding: boolean, dt: number): void => {
    c.group.position.set(p.x, p.y, p.z);
    c.group.rotation.y = p.facing;
    c.animate(dt, riding ? p.speed : 0);
    c.group.updateMatrixWorld(true);
  };
  /** A gnome standing at state.party.golfer and swinging (or celebrating a good hole), like the solo golfer. */
  const poseStanding = (e: OnlineGnome, s: GameState, swing: number, dt: number): void => {
    const g = s.party.golfer;
    const celebrate = s.phase === 'holed' && s.strokes <= HOLES[s.holeIndex].par - 1;
    if (celebrate) {
      const bounce = Math.abs(Math.sin(s.time * 8)) * 0.15;
      place(e, g.x, g.y + bounce, g.z, g.facing, dt);
      arms(e.model, -2.6, 0);
      e.model.rig.rotation.y = 0;
    } else {
      place(e, g.x, g.y, g.z, g.facing, dt);
      arms(e.model, -0.7, swing);
      e.model.rig.rotation.y = swing * 0.25;
    }
  };
  /** A gnome seated on seat `seat` of a cart posed at `p`. Seat 0 holds the wheel. */
  const poseSeated = (e: OnlineGnome, cart: CartModel, p: { facing: number }, seat: number, dt: number): void => {
    const sp = cart.seats[seat].clone();
    cart.group.localToWorld(sp);
    place(e, sp.x, sp.y, sp.z, p.facing + cart.seatFacing[seat], dt);
    arms(e.model, seat === 0 ? WHEEL_ARM : 0, 0);
    e.model.rig.rotation.y = 0;
  };

  /** Online frame: carts, gnomes, clubs, name tags. Returns the gnome playing the hole (or null). */
  const updateOnline = (dt: number, s: GameState, o: OnlineView, riding: boolean, swing: number): OnlineGnome | null => {
    const race = o.started && o.format === 'race';
    // The player whose turn it is: the host's pick in Together, me in Gnome w/ Friends (once started).
    const playing = o.started ? (race ? o.me : o.turn) : null;
    // Standing = the playing player, not riding. Everyone else is seated.
    const standing = playing !== null && !riding ? playing : null;
    const roster = o.golfers.filter((g) => !g.left && (!race || g.id === o.me));

    const keep = new Set(roster.map((g) => g.id));
    for (const id of [...gnomes.keys()]) if (!keep.has(id)) dropGnome(id);

    // Carts.
    let raceModel: CartModel | null = null;
    if (race) {
      for (const c of convoy) attach(c.group, false, ctx.scene);
      const me = roster[0];
      if (me) {
        raceModel = raceCartFor(me.color);
        attach(raceModel.group, true, ctx.scene);
        poseCart(raceModel, mowerPose(s), riding, dt);
      } else if (raceCart) {
        attach(raceCart.cart.group, false, ctx.scene);
      }
    } else {
      if (raceCart) attach(raceCart.cart.group, false, ctx.scene);
      const n = cartCount(s);
      for (let k = 0; k < n; k++) {
        const c = convoyCart(k);
        attach(c.group, true, ctx.scene);
        poseCart(c, cartPose(s, k), riding, dt);
      }
      for (let k = n; k < convoy.length; k++) attach(convoy[k].group, false, ctx.scene);
    }

    // Who sits where (together and lobby).
    const seatOf = new Map<number, { cart: number; seat: number }>();
    if (!race) for (const e of convoySeats(s)) seatOf.set(e.golfer.id, { cart: e.cart, seat: e.seat });

    let host: OnlineGnome | null = null;
    for (const g of roster) {
      const e = gnomeFor(g);
      attach(e.model.object, true, ctx.scene);
      attach(e.tag.sprite, true, ctx.scene);
      const isPlaying = g.id === playing;
      if (isPlaying) host = e;
      e.club.visible = isPlaying;

      if (g.id === standing) {
        poseStanding(e, s, swing, dt);
      } else if (race) {
        if (raceModel) poseSeated(e, raceModel, mowerPose(s), 0, dt);
      } else {
        const at = seatOf.get(g.id);
        if (at) poseSeated(e, convoy[at.cart], cartPose(s, at.cart), at.seat, dt);
      }

      // Disc mode: the playing gnome is what gets thrown (disc.ts draws him), so hide him unless he rides.
      e.model.object.visible = !(isPlaying && s.mode === 'disc' && !riding);
      e.tag.sprite.visible = e.model.object.visible;
      e.tag.sprite.position.set(e.ps.position.x, e.ps.position.y + TAG_HEIGHT, e.ps.position.z);
      paintNameTag(e.tag, g.name, g.color, !race && g.id === o.turn);
    }
    return host;
  };

  let prevPhase: GameState['phase'] = 'title';
  let angle = 0; // golfer's swing angle last frame
  let flightFrom = 0; // angle at the start of the follow-through

  return {
    update(dt: number): void {
      const s = ctx.state;
      const o = s.online;
      const riding = s.phase === 'drive';

      cart = s.ride === '350z' ? z33 : mowerCart;

      if (s.phase === 'flight' && prevPhase !== 'flight') flightFrom = angle;

      let host: Sipper | null;
      if (o) {
        // Online: the solo golfer, partner and cart stay hidden; every online gnome is drawn by updateOnline.
        mowerCart.group.visible = false;
        z33.group.visible = false;
        partner.model.object.visible = false;
        golfer.model.object.visible = false;
        angle = riding ? 0 : swingAngle(s, flightFrom);
        host = updateOnline(dt, s, o, riding, angle);
      } else {
        dropAllOnline();
        mowerCart.group.visible = cart === mowerCart;
        z33.group.visible = cart === z33;
        partner.model.object.visible = true;
        host = { model: golfer.model, can: canG };

        // Cart: parked at state.party.mower, or moving during 'drive' (mowerPose handles both).
        const pose = mowerPose(s);
        cart.group.position.set(pose.x, pose.y, pose.z);
        cart.group.rotation.y = pose.facing;
        cart.animate(dt, riding ? pose.speed : 0);
        cart.group.updateMatrixWorld(true);

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
      }

      // Cigarillo: lit while it has shots left. Tip breathes, flares every FLARE_EVERY seconds, puffs smoke.
      // It rides in the mouth of whoever is playing (the solo golfer, or the online gnome whose turn it is).
      if (host && host.model !== cigHost) {
        host.model.rig.add(cig.group);
        cigHost = host.model;
      }
      const smoking = host !== null && s.smokeShots > 0;
      cig.group.visible = smoking;
      if (smoking) {
        cigHost.object.updateMatrixWorld(true);
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
          cigHost.rig.localToWorld(mouthWorld);
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
      // Online, only the playing gnome sips (with the same timing as the golfer).
      const drinking = s.phase === 'aim';
      const golferU = drinking && s.drinkTime >= 0 ? s.drinkTime / CONSUMABLES.drinkSeconds : -1;
      if (o) {
        for (const e of gnomes.values()) sip(e.model, e.can, e.model === host?.model ? golferU : -1);
      } else {
        const partnerU =
          drinking && s.drinkTime >= PARTNER_DRINK_DELAY
            ? (s.drinkTime - PARTNER_DRINK_DELAY) / (CONSUMABLES.drinkSeconds - PARTNER_DRINK_DELAY)
            : -1;
        sip(golfer.model, canG, golferU);
        sip(partner.model, canP, partnerU);
      }

      // Gnome Disc: the golfer is the thing being thrown (disc.ts draws him); he only rides the mower here.
      if (!o) golfer.model.object.visible = s.mode !== 'disc' || riding;

      prevPhase = s.phase;
    },
  };
}
