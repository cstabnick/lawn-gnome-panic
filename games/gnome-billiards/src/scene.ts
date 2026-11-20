// Gnome Billiards in three.js: the table, the balls, the cue stick and aim line, and the two gnomes that lean on the
// ends of the table. Physics is in table units (x along the table, y across it); the scene maps them onto the floor.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { aimLine } from './aim';
import { BALL_R, CUE_BALL, PULL_MAX, RAIL, TABLE_H, TABLE_W } from './config';
import { POCKETS, type Ball } from './physics';

/** The top of the cloth. The gnome is about one unit tall, so the table stands at gnome height. */
const Y0 = 0.75;
/** Height of a ball's centre when it sits on the cloth. */
const TOP = Y0 + BALL_R;
/** Where the gnomes stand, on the short ends of the table, facing it. */
const SEAT_X = TABLE_W / 2 + RAIL + 0.36;

const BALL_COLOURS: Record<number, string> = {
  1: '#f2c230', 2: '#2b5fd6', 3: '#d8332b', 4: '#6a2fb0', 5: '#f0742b', 6: '#2e8f3e', 7: '#7a2222', 8: '#111111',
};

export interface SceneFrame {
  balls: readonly Ball[];
  /** The shot being lined up: its direction in table units (unit length) and how far the cue is pulled, 0..1. */
  aim: { dx: number; dy: number; pull: number; stroking: boolean } | null;
  /** Ball in hand: the spot under the pointer and whether it is legal. */
  placing: { x: number; y: number; ok: boolean } | null;
  /** Whose shot it is (0 or 1), or -1 while the table is moving. */
  activeSeat: number;
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
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.05, 50);
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP);
  private readonly hit = new THREE.Vector3();
  private readonly balls = new Map<number, THREE.Mesh>();
  private readonly prev = new Map<number, { x: number; z: number }>();
  private readonly ballGeo = new THREE.SphereGeometry(BALL_R, 28, 18);
  private readonly cueStick: THREE.Mesh;
  private readonly aimMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.03, gapSize: 0.025, transparent: true, opacity: 0.8 });
  private readonly aimGeo = new THREE.BufferGeometry();
  private readonly aimObj: THREE.Line;
  private readonly ghost: THREE.Mesh;
  private readonly ghostMat: THREE.MeshStandardMaterial;
  private readonly placeMat: THREE.MeshStandardMaterial;
  private readonly placeMesh: THREE.Mesh;
  private gnomes: (GnomeModel | null)[] = [null, null];
  private readonly gnomeRoot = new THREE.Group();
  private readonly gnomePose: PlayerState = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
  };
  private readonly time = { t: 0 };

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

    this.cueStick = this.buildCue();
    this.scene.add(this.cueStick);

    this.aimObj = new THREE.Line(this.aimGeo, this.aimMat);
    this.aimObj.visible = false;
    this.scene.add(this.aimObj);

    this.ghostMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.3 });
    this.ghost = new THREE.Mesh(this.ballGeo, this.ghostMat);
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

  private box(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = this.scene): void {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
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

  private buildCue(): THREE.Mesh {
    const shaft = new THREE.CylinderGeometry(0.011, 0.0055, 0.9, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd9b77a, roughness: 0.45 });
    const mesh = new THREE.Mesh(shaft, mat);
    mesh.visible = false;
    return mesh;
  }

  // ------------------------------------------------------------ the gnomes at the ends

  /** Builds the two gnomes from their looks (seat 0 at -x, seat 1 at +x), each wearing its own gear. */
  setSeats(looks: GnomeLook[]): void {
    for (const g of this.gnomes) if (g) this.gnomeRoot.remove(g.object);
    this.gnomeRoot.clear();
    this.gnomes = [0, 1].map((i) => {
      const look = looks[i];
      if (!look) return null;
      const model = createGnomeModel(look);
      const side = i === 0 ? -1 : 1;
      model.object.position.set(side * SEAT_X, 0, 0);
      // The gnome faces the table: +z is the model's front, so yaw turns it toward the centre.
      model.object.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2;
      this.gnomeRoot.add(model.object);
      return model;
    });
  }

  // ------------------------------------------------------------ the frame

  /** The table point under a screen position (table units), or null when the pointer is off the table plane. */
  pointToTable(clientX: number, clientY: number): [number, number] | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    if (!this.ray.ray.intersectPlane(this.plane, this.hit)) return null;
    return [this.hit.x + TABLE_W / 2, this.hit.z + TABLE_H / 2];
  }

  resize(w: number, h: number, dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Fit the table and both gnomes: wide enough for the seats, tall enough for the cushions.
    const vfov = (36 * Math.PI) / 180;
    const tv = Math.tan(vfov / 2);
    const th = tv * this.camera.aspect;
    const halfW = SEAT_X + 0.4;
    const dist = Math.max(halfW / th, 0.9 / tv) * 1.1;
    const elev = (50 * Math.PI) / 180;
    this.camera.fov = 36;
    this.camera.position.set(0, Y0 + dist * Math.sin(elev), dist * Math.cos(elev));
    this.camera.lookAt(0, Y0, 0);
    this.camera.updateProjectionMatrix();
  }

  update(f: SceneFrame, dt: number): void {
    this.time.t += dt;
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
      // The stick: its tip sits behind the ball, pulled back by the power, and points along the shot.
      const back = PULL_MAX * pull + BALL_R * 1.6;
      const tipX = sx - dx * back;
      const tipZ = sz - dy * back;
      const axis = new THREE.Vector3(-dx, 0, -dy);
      this.cueStick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      this.cueStick.position.set(tipX + axis.x * 0.45, TOP, tipZ + axis.z * 0.45);
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

    // The gnomes: idle, arms on the rail when it is their shot.
    for (let i = 0; i < 2; i++) {
      const g = this.gnomes[i];
      if (!g) continue;
      this.gnomePose.position.set(g.object.position.x, 0, 0);
      this.gnomePose.facing = i === 0 ? Math.PI / 2 : -Math.PI / 2;
      g.update(this.gnomePose, dt);
      const lean = f.activeSeat === i ? -1.25 + Math.sin(this.time.t * 2) * 0.05 : -0.5;
      if (g.arms) {
        g.arms.left.rotation.x = lean;
        g.arms.right.rotation.x = lean;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
