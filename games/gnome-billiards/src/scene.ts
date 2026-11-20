// Gnome Billiards in three.js: the room, the table, the balls, the cue stick and aim line, the walking gnomes (with their
// emotes), and the camera: a third-person follow of your gnome, a lock on the whole table, or an orbit for spectators.
// Physics is in table units (x along the table, y across it); the scene maps them onto the floor (table centred on 0).
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { createEmotePlayer, type EmotePlayer } from '@lawn/emotes';
import { aimLine, backRoom } from './aim';
import { BALL_R, CUE_BALL, PULL_MAX, RAIL, TABLE_H, TABLE_W } from './config';
import { newWalker, type Walker } from './gnomes';
import { POCKETS, type Ball } from './physics';

/** The top of the cloth. The gnome is about one unit tall, so the table stands at gnome height. */
const Y0 = 0.75;
/** Height of a ball's centre when it sits on the cloth. */
const TOP = Y0 + BALL_R;
/** Where the gnomes start, on the short ends of the table, facing it. */
export const SEAT_X = TABLE_W / 2 + RAIL + 0.36;
/** The longest a cue stick is drawn (table units). */
const STICK_LEN = 0.9;
/**
 * The cue's pitch: its tip sits on the ball's centre line, and the butt rises. Rails top out at Y0 + 0.04; the stick's
 * axis must clear that by its own radius (0.011) and a margin, so it needs to rise about CUE_CLEAR_RISE over the tip.
 */
const CUE_CLEAR_RISE = Y0 + 0.065 - TOP;
const CUE_MIN_PITCH = 0.07;
const CUE_MAX_PITCH = 0.5;
/** The third-person camera stands this far behind the gnome, and this high. */
const FOLLOW_BACK = 1.6;
const FOLLOW_HEIGHT = 1.9;

const BALL_COLOURS: Record<number, string> = {
  1: '#f2c230', 2: '#2b5fd6', 3: '#d8332b', 4: '#6a2fb0', 5: '#f0742b', 6: '#2e8f3e', 7: '#7a2222', 8: '#111111',
};

export type CameraMode = 'table' | 'follow' | 'orbit';

export interface SceneFrame {
  balls: readonly Ball[];
  /** The shot being lined up: its direction in table units (unit length) and how far the cue is pulled, 0..1. */
  aim: { dx: number; dy: number; pull: number } | null;
  /** Ball in hand: the spot under the pointer and whether it is legal. */
  placing: { x: number; y: number; ok: boolean } | null;
  /** Whose shot it is (0 or 1), or -1 while the table is moving. */
  activeSeat: number;
}

interface Actor {
  model: GnomeModel;
  emote: EmotePlayer;
  walker: Walker;
  state: PlayerState;
}

/** Table units to world (floor) units. The table is centred on the origin with its long side along x. */
export function toWorld(x: number, y: number): [number, number] {
  return [x - TABLE_W / 2, y - TABLE_H / 2];
}

function ballTexture(id: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas is not available');
  const colour = id === CUE_BALL ? '#f7f5ee' : id === 8 ? '#111111' : BALL_COLOURS[id > 8 ? id - 8 : id];
  g.fillStyle = id > 8 ? '#f7f5ee' : colour;
  g.fillRect(0, 0, 512, 256);
  if (id > 8) {
    g.fillStyle = colour;
    g.fillRect(0, 64, 512, 128);
  }
  if (id !== CUE_BALL) {
    for (const cx of [128, 384]) {
      g.fillStyle = '#f7f5ee';
      g.beginPath();
      g.arc(cx, 128, 46, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#111111';
      g.font = 'bold 60px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(id), cx, 136);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BilliardsScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP);
  private readonly floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly hit = new THREE.Vector3();
  private readonly balls = new Map<number, THREE.Mesh>();
  private readonly prev = new Map<number, { x: number; z: number }>();
  private readonly ballGeo = new THREE.SphereGeometry(BALL_R, 28, 18);
  private readonly cueStick: THREE.Mesh;
  private readonly aimMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.03, gapSize: 0.025, transparent: true, opacity: 0.8 });
  private readonly aimGeo = new THREE.BufferGeometry();
  private readonly aimObj: THREE.Line;
  private readonly ghost: THREE.Mesh;
  private readonly placeMat: THREE.MeshStandardMaterial;
  private readonly placeMesh: THREE.Mesh;
  private actors: (Actor | null)[] = [null, null];
  private readonly gnomeRoot = new THREE.Group();
  private readonly tableFit = { y: 0, z: 0, dist: 3 };
  private camMode: CameraMode = 'table';
  private followSeat = 0;
  private readonly camPos = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3(0, Y0, 0);
  private camReady = false;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(0x1b1020, 1);
    this.scene.background = new THREE.Color(0x1b1020);
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a1a30, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(1.5, 4, 2.5);
    this.scene.add(sun);
    const lamp = new THREE.PointLight(0xffd9a0, 1.2, 8, 1.4);
    lamp.position.set(0, 2.4, 0);
    this.scene.add(lamp);

    this.buildRoom();
    this.buildTable();
    this.scene.add(this.gnomeRoot);

    this.cueStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.0055, STICK_LEN, 12),
      new THREE.MeshStandardMaterial({ color: 0xd9b77a, roughness: 0.45 }),
    );
    this.cueStick.visible = false;
    this.scene.add(this.cueStick);

    this.aimObj = new THREE.Line(this.aimGeo, this.aimMat);
    this.aimObj.visible = false;
    this.scene.add(this.aimObj);

    this.ghost = new THREE.Mesh(this.ballGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.3 }));
    this.ghost.visible = false;
    this.scene.add(this.ghost);

    this.placeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.3 });
    this.placeMesh = new THREE.Mesh(this.ballGeo, this.placeMat);
    this.placeMesh.visible = false;
    this.scene.add(this.placeMesh);

    for (let id = 0; id <= 15; id++) {
      const mat = new THREE.MeshStandardMaterial({ map: ballTexture(id), roughness: 0.22, metalness: 0 });
      const mesh = new THREE.Mesh(this.ballGeo, mat);
      mesh.visible = false;
      this.balls.set(id, mesh);
      this.scene.add(mesh);
    }
  }

  // ------------------------------------------------------------ building

  private buildRoom(): void {
    // The Gnomecino floor: a dark carpet, like the casino's.
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ color: 0x4a1a2c, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  private box(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material): void {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    this.scene.add(m);
  }

  private buildTable(): void {
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5530, roughness: 0.55 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x5e3d22, roughness: 0.6 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1f7a3c, roughness: 0.95 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x0f4a25, roughness: 0.6 });
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x050405, roughness: 1 });
    const diamond = new THREE.MeshStandardMaterial({ color: 0xf4e3b0, roughness: 0.4, metalness: 0.3 });

    const outerW = TABLE_W + 2 * RAIL;
    const outerD = TABLE_H + 2 * RAIL;
    // Apron and legs under the rails.
    this.box(outerW - 0.08, 0.14, outerD - 0.08, 0, Y0 - 0.07, 0, woodDark);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        this.box(0.09, Y0 - 0.14, 0.09, sx * (outerW / 2 - 0.12), (Y0 - 0.14) / 2, sz * (outerD / 2 - 0.12), woodDark);
      }
    }
    // Cloth.
    this.box(TABLE_W, 0.01, TABLE_H, 0, Y0 - 0.004, 0, cloth);
    // Rails: four wooden boxes around the cloth, top a little above it.
    const railH = 0.05;
    this.box(outerW, railH, RAIL, 0, Y0 + railH / 2 - 0.01, TABLE_H / 2 + RAIL / 2, wood);
    this.box(outerW, railH, RAIL, 0, Y0 + railH / 2 - 0.01, -(TABLE_H / 2 + RAIL / 2), wood);
    this.box(RAIL, railH, TABLE_H, TABLE_W / 2 + RAIL / 2, Y0 + railH / 2 - 0.01, 0, wood);
    this.box(RAIL, railH, TABLE_H, -(TABLE_W / 2 + RAIL / 2), Y0 + railH / 2 - 0.01, 0, wood);
    // Diamonds (sights) on the rails.
    for (const f of [0.25, 0.5, 0.75]) {
      for (const [x, z] of [
        [TABLE_W * f - TABLE_W / 2, TABLE_H / 2 + RAIL / 2],
        [TABLE_W * f - TABLE_W / 2, -(TABLE_H / 2 + RAIL / 2)],
      ] as const) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), diamond);
        d.position.set(x, Y0 + railH + 0.002, z);
        this.scene.add(d);
      }
      const yz = TABLE_H * f - TABLE_H / 2;
      for (const x of [TABLE_W / 2 + RAIL / 2, -(TABLE_W / 2 + RAIL / 2)]) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), diamond);
        d.position.set(x, Y0 + railH + 0.002, yz);
        this.scene.add(d);
      }
    }
    // Cushions: black-green rubber along each edge, broken where the pockets are.
    const gap = 0.07;
    // pockets: the pocket positions along the edge, corners included (so the cushion stops short of each one).
    const edgeSegments = (pockets: number[]): [number, number][] => {
      const segs: [number, number][] = [];
      let a = 0;
      for (const p of pockets) {
        const b = p - gap;
        if (b - a > 0.02) segs.push([a, b]);
        a = p + gap;
      }
      return segs;
    };
    const cushion = 0.03;
    for (const [a, b] of edgeSegments([0, TABLE_W / 2, TABLE_W])) {
      for (const z of [TABLE_H / 2, -TABLE_H / 2]) {
        this.box(b - a, cushion, 0.02, (a + b) / 2 - TABLE_W / 2, Y0 + cushion / 2, z, rubber);
      }
    }
    for (const [a, b] of edgeSegments([0, TABLE_H])) {
      for (const x of [TABLE_W / 2, -TABLE_W / 2]) {
        this.box(0.02, cushion, b - a, x, Y0 + cushion / 2, (a + b) / 2 - TABLE_H / 2, rubber);
      }
    }
    // Pockets: dark discs flush with the cloth.
    for (const p of POCKETS) {
      const [wx, wz] = toWorld(p.x, p.y);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.012, 24), pocketMat);
      disc.position.set(wx, Y0 + 0.002, wz);
      this.scene.add(disc);
    }
  }

  // ------------------------------------------------------------ the gnomes

  /** Builds the two gnomes from their looks (seat 0 at -x, seat 1 at +x), each wearing its own gear. */
  setSeats(looks: GnomeLook[]): void {
    for (const a of this.actors) if (a) this.gnomeRoot.remove(a.model.object);
    this.gnomeRoot.clear();
    this.actors = [0, 1].map((i) => {
      const look = looks[i];
      if (!look) return null;
      const model = createGnomeModel(look);
      const walker = newWalker((i === 0 ? -1 : 1) * SEAT_X, 0);
      this.gnomeRoot.add(model.object);
      const state: PlayerState = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        facing: walker.yaw,
        grounded: true,
        jumpsUsed: 0,
      };
      return { model, emote: createEmotePlayer(model), walker, state };
    });
  }

  /** A seat's walker (its floor position and path), or null when that seat has no gnome. */
  walker(seat: number): Walker | null {
    return this.actors[seat]?.walker ?? null;
  }

  /** Plays an emote on a seat's gnome. False for an unknown emote or an empty seat. */
  playEmote(seat: number, id: string): boolean {
    return this.actors[seat]?.emote.play(id) ?? false;
  }

  // ------------------------------------------------------------ camera

  setCamera(mode: CameraMode, seat: number): void {
    this.camMode = mode;
    this.followSeat = seat;
  }

  // ------------------------------------------------------------ pointer

  private pick(clientX: number, clientY: number, plane: THREE.Plane): THREE.Vector3 | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.ray.ray.intersectPlane(plane, this.hit) ? this.hit : null;
  }

  /** The table point (table units) under a screen position, on the cloth plane; null when the ray misses it. */
  pointToTable(clientX: number, clientY: number): [number, number] | null {
    const p = this.pick(clientX, clientY, this.tablePlane);
    return p ? [p.x + TABLE_W / 2, p.z + TABLE_H / 2] : null;
  }

  /** The floor point (world units, table centred on 0) under a screen position; null when the ray misses the floor. */
  pointToFloor(clientX: number, clientY: number): { x: number; z: number } | null {
    const p = this.pick(clientX, clientY, this.floorPlane);
    return p ? { x: p.x, z: p.z } : null;
  }

  resize(w: number, h: number, dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // The table camera fits the table and both gnomes: wide enough for the seats, tall enough for the cushions.
    const vfov = (36 * Math.PI) / 180;
    const tv = Math.tan(vfov / 2);
    const th = tv * this.camera.aspect;
    const halfW = SEAT_X + 0.4;
    const dist = Math.max(halfW / th, 0.9 / tv) * 1.1;
    const elev = (50 * Math.PI) / 180;
    this.tableFit.dist = dist;
    this.tableFit.y = Y0 + dist * Math.sin(elev);
    this.tableFit.z = dist * Math.cos(elev);
    this.camera.fov = 36;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ the frame

  private updateCamera(dt: number): void {
    const follow = this.actors[this.followSeat];
    let want: THREE.Vector3;
    if (this.camMode === 'follow' && follow) {
      const w = follow.walker;
      const len = Math.hypot(w.x, w.z) || 1;
      // Behind the gnome, as seen from the table: the camera sits on the far side of it, looking back at the cloth.
      want = new THREE.Vector3(w.x + (w.x / len) * FOLLOW_BACK, FOLLOW_HEIGHT, w.z + (w.z / len) * FOLLOW_BACK);
      this.camLook.set(0, Y0 + 0.05, 0);
    } else if (this.camMode === 'orbit') {
      const a = this.time * 0.15;
      const R = this.tableFit.dist * 0.95;
      want = new THREE.Vector3(Math.cos(a) * R, Y0 + R * 0.55, Math.sin(a) * R);
      this.camLook.set(0, Y0, 0);
    } else {
      want = new THREE.Vector3(0, this.tableFit.y, this.tableFit.z);
      this.camLook.set(0, Y0, 0);
    }
    if (!this.camReady) {
      this.camPos.copy(want);
      this.camReady = true;
    } else {
      // Smooth moves between modes and as the gnome walks; orbit moves on its own, so it is not smoothed.
      const k = this.camMode === 'orbit' ? 1 : Math.min(1, dt * 5);
      this.camPos.lerp(want, k);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  update(f: SceneFrame, dt: number): void {
    this.time += dt;

    // Balls: place them, roll them, hide the pocketed ones.
    for (const b of f.balls) {
      const mesh = this.balls.get(b.id);
      if (!mesh) continue;
      mesh.visible = !b.pocketed;
      const [wx, wz] = toWorld(b.x, b.y);
      const last = this.prev.get(b.id);
      mesh.position.set(wx, TOP, wz);
      if (last) {
        const dx = wx - last.x;
        const dz = wz - last.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1e-6) {
          // Rolling without slipping: spin about the axis across the direction of travel.
          mesh.rotateOnWorldAxis(new THREE.Vector3(dz / dist, 0, -dx / dist), dist / BALL_R);
        }
      }
      this.prev.set(b.id, { x: wx, z: wz });
    }

    // The cue stick and the aim line, while a shot is being lined up.
    const cue = f.balls.find((b) => b.id === CUE_BALL);
    const showAim = !!f.aim && !!cue && !cue.pocketed && f.activeSeat >= 0;
    this.cueStick.visible = showAim;
    this.aimObj.visible = showAim;
    this.ghost.visible = false;
    if (showAim && f.aim && cue) {
      const { dx, dy, pull } = f.aim;
      const line = aimLine(f.balls, cue.x, cue.y, dx, dy);
      const [sx, sz] = toWorld(cue.x, cue.y);
      const [ex, ez] = toWorld(line.ex, line.ey);
      this.aimGeo.setFromPoints([new THREE.Vector3(sx, TOP, sz), new THREE.Vector3(ex, TOP, ez)]);
      this.aimObj.computeLineDistances();
      if (line.contact) {
        const [gx, gz] = toWorld(line.contact.x, line.contact.y);
        this.ghost.position.set(gx, TOP, gz);
        this.ghost.visible = true;
      }
      // The stick: its tip sits behind the ball, pulled back by the power, and points along the shot. Its butt stops
      // where the cloth stops (the cushion, or a ball behind), so it never clips through a rail or a ball.
      const butt = -dx;
      const buttZ = -dy;
      const tipBack = BALL_R * 1.6 + pull * PULL_MAX;
      const room = backRoom(f.balls, cue.x, cue.y, butt, buttZ);
      const len = Math.max(0, Math.min(STICK_LEN, room - tipBack - 0.01));
      const tipX = sx - dx * tipBack;
      const tipZ = sz - dy * tipBack;
      // The tip meets the ball on its centre line, and the butt rises so the stick clears the rail tops: a cue angled
      // into the ball, not a flat bar through the cushions. `len` is the horizontal reach, so the room check still holds.
      const pitch = Math.min(CUE_MAX_PITCH, Math.max(CUE_MIN_PITCH, Math.atan2(CUE_CLEAR_RISE, Math.max(len, 0.04))));
      const reach = len / Math.cos(pitch);
      const axis = new THREE.Vector3(butt * Math.cos(pitch), Math.sin(pitch), buttZ * Math.cos(pitch));
      this.cueStick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      this.cueStick.scale.set(1, reach / STICK_LEN, 1);
      this.cueStick.position.set(tipX + axis.x * (reach / 2), TOP + axis.y * (reach / 2), tipZ + axis.z * (reach / 2));
      this.cueStick.visible = len > 0.02;
    }

    // Ball in hand: a ghost ball under the pointer, red where it is not legal.
    if (f.placing) {
      const [px, pz] = toWorld(f.placing.x, f.placing.y);
      this.placeMesh.position.set(px, TOP, pz);
      this.placeMat.color.set(f.placing.ok ? 0xffffff : 0xff5050);
      this.placeMesh.visible = true;
    } else {
      this.placeMesh.visible = false;
    }

    // The gnomes: walk, emote, and lean on the rail when it is their shot.
    for (let i = 0; i < 2; i++) {
      const a = this.actors[i];
      if (!a) continue;
      const w = a.walker;
      a.state.position.set(w.x, 0, w.z);
      a.state.velocity.set(w.vx, 0, w.vz);
      a.state.facing = w.yaw;
      a.model.object.position.set(w.x, 0, w.z);
      a.model.object.rotation.y = w.yaw;
      a.model.update(a.state, dt);
      a.emote.update(dt, w.moving);
      if (!a.emote.current && !w.moving) {
        const lean = f.activeSeat === i ? -1.25 + Math.sin(this.time * 2) * 0.05 : -0.5;
        a.model.arms.left.rotation.x = lean;
        a.model.arms.right.rotation.x = lean;
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

