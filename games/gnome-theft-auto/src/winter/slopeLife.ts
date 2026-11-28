// Winter sports (FX12, G4#7 / G4#10): Snowdrop Slope's life: ambient skiers and sledders on autopilot, the lodge's
// warm night light and chimney smoke, a lantern on the tow base. hill.ts buildSnowdropSlope calls it once and steps it.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { gnomeState, makeGnome } from '../gnomes';
import { litWindow, prefabBox } from '../homes/pieces';
import { heightAt } from '../terrain';
import { LODGE, NURSERY_RUN, TEA_TRAY_RUN, TOW, WOOL_RUN } from './types';

export interface SlopeLife {
  /** Every frame (hill.ts update): t = seconds since start, px, pz = the player. */
  update(dt: number, t: number, px: number, pz: number): void;
}

const SLOPE = { x: -350, z: -1150 };
const ACTIVE_R = 300;
const SMOKE_R = 250;
const LIGHT_R = 120;
const LANTERN_R = 60;
const RIDER_HIDE_R = 15;
const SPEED = 9;
const SITE = { minX: -460, maxX: -240, minZ: -1350, maxZ: -1000 };

interface Rider {
  group: THREE.Group;
  model: ReturnType<typeof makeGnome>;
  sitting: boolean;
  z0: number;
  z1: number;
  x: (z: number) => number;
  /** Seconds into the cycle (negative = waiting at the top). */
  clock: number;
  pause: number;
}

/** The lodge's local frame in the world: local (lx, ly, lz) -> world, as the piece placement does (yaw, scale). */
function lodgeFrame(): (lx: number, ly: number, lz: number) => THREE.Vector3 {
  let s = 1;
  if (getPrefab('woolly-sock-lodge')) {
    const b = prefabBox('woolly-sock-lodge');
    const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    s = longest > 0 ? LODGE.size / longest : 1;
  }
  const c = Math.cos(LODGE.yaw), sn = Math.sin(LODGE.yaw);
  const gy = heightAt(LODGE.x, LODGE.z);
  return (lx, ly, lz) => new THREE.Vector3(LODGE.x + (lx * c + lz * sn) * s, gy + ly * s, LODGE.z + (-lx * sn + lz * c) * s);
}

function puffTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const cx = cv.getContext('2d');
  if (!cx) return null;
  const gr = cx.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(235,238,242,0.85)');
  gr.addColorStop(0.6, 'rgba(215,220,226,0.35)');
  gr.addColorStop(1, 'rgba(210,215,222,0)');
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

/** Builds the slope's life into `parent` (hill.ts passes its 'snowdrop-slope' group). */
export function buildSlopeLife(parent: THREE.Object3D): SlopeLife {
  const life = new THREE.Group();
  life.name = 'slope-life';
  parent.add(life);
  const at = lodgeFrame();

  // ---- Ambient riders -----------------------------------------------------------------------------------------------
  const look = (hat: number, shirt: number) => ({
    hat, shirt, pants: 0x3b3a4a, skin: 0xf1c27d, boots: 0x222222, beard: null, hair: null,
    freckles: false, dress: false, glasses: false, bowlCut: null,
  });
  const wool = WOOL_RUN, tea = TEA_TRAY_RUN, nur = NURSERY_RUN;
  // Each skier threads its run's gates (read at build time), smoothed between them.
  const through = (run: typeof wool, dx: number) => {
    const pts = [[run.start.z, run.start.x], ...run.gates.map((g) => [g.z, g.x]), [run.finish.z, run.finish.x]].sort((p, q) => p[0] - q[0]);
    return (z: number): number => {
      if (z <= pts[0][0]) return pts[0][1] + dx;
      for (let i = 1; i < pts.length; i++) {
        if (z <= pts[i][0]) {
          const f = (z - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1);
          const e = f * f * (3 - 2 * f);
          return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * e + dx;
        }
      }
      return pts[pts.length - 1][1] + dx;
    };
  };
  const woolX = through(wool, 0);
  const nurX = through(nur, 0);
  const teaX = (z: number): number => tea.start.x + 4 * Math.sin((z + 1250) / 22);
  const defs: { ride: string; sitting: boolean; hat: number; shirt: number; z0: number; z1: number; x: (z: number) => number; pause: number }[] = [
    { ride: 'snow-skis', sitting: false, hat: 0x2ec4b6, shirt: 0xe63946, z0: wool.start.z, z1: wool.finish.z, x: woolX, pause: 6 },
    { ride: 'snow-skis', sitting: false, hat: 0xff9f1c, shirt: 0x457b9d, z0: nur.start.z + 5, z1: nur.finish.z, x: nurX, pause: 11 },
    { ride: 'tea-tray-sled', sitting: true, hat: 0xc0392b, shirt: 0xffd60a, z0: tea.start.z, z1: tea.finish.z, x: teaX, pause: 9 },
  ];
  const riders: Rider[] = defs.map((d, i) => {
    const group = new THREE.Group();
    group.name = 'slope-rider';
    if (getPrefab(d.ride)) {
      const ride = buildPrefab(d.ride, { lights: false });
      group.add(ride);
    }
    const model = makeGnome(group, look(d.hat, d.shirt));
    group.visible = false;
    life.add(group);
    return { group, model, sitting: d.sitting, z0: d.z0, z1: d.z1, x: d.x, clock: -(2 + i * 5), pause: d.pause };
  });

  // ---- Night: lit windows on every side, one shared warm light ----------------------------------------------------
  const panes: THREE.Mesh[] = [];
  const pane = (lx: number, ly: number, lz: number, yawLocal: number, w: number, h: number): void => {
    const p = at(lx, ly, lz);
    // 0.03 m proud of the wall along its outward normal (world).
    const yaw = LODGE.yaw + yawLocal;
    p.x += Math.sin(yaw) * 0.03;
    p.z += Math.cos(yaw) * 0.03;
    const m = litWindow(p.x, p.y, p.z, yaw, w, h);
    life.add(m);
    panes.push(m);
  };
  const half = Math.PI / 2;
  // Sides (the +x and -x walls of the prefab, 4.8 m out) and the back (-z, 3.3 m back).
  for (const lz of [-1.5, 1.5]) {
    pane(4.84, 1.5, lz, half, 1.0, 0.7);
    pane(-4.84, 1.5, lz, -half, 1.0, 0.7);
  }
  for (const lx of [-3, 0, 3]) pane(lx, 1.5, -3.34, Math.PI, 1.0, 0.7);
  const nightF = (): number => {
    const m = panes[0]?.material as THREE.MeshBasicMaterial | undefined;
    return m ? Math.min(1, Math.max(0, (m.color.r - 0.23) / 0.77)) : 0;
  };

  const light = new THREE.PointLight(0xffb25a, 0, 14, 1.5);
  light.visible = false;
  life.add(light);
  const porch = at(0, 2.3, 4.4);
  porch.y = Math.max(porch.y, heightAt(porch.x, porch.z) + 2.4);

  // The tow-base lantern: its own emissive part glows; the shared light moves over when the player is near.
  const lanternAt = { x: TOW.base.x - 2.2, z: TOW.base.z + 2.2 };
  if (getPrefab('camp-lantern-post')) {
    const lantern = buildPrefab('camp-lantern-post');
    lantern.position.set(lanternAt.x, heightAt(lanternAt.x, lanternAt.z), lanternAt.z);
    life.add(lantern);
  }
  const lanternY = heightAt(lanternAt.x, lanternAt.z) + 1.5;

  // ---- Chimney smoke --------------------------------------------------------------------------------------------------
  const chimney = at(3.0, 5.35, -1.2);
  const tex = puffTexture();
  const puffs: THREE.Sprite[] = [];
  const PUFFS = 6, LIFE = 6;
  for (let i = 0; i < PUFFS; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 });
    const sp = new THREE.Sprite(mat);
    sp.visible = false;
    life.add(sp);
    puffs.push(sp);
  }

  return {
    update(dt, t, px, pz) {
      const near = Math.hypot(px - SLOPE.x, pz - SLOPE.z) < ACTIVE_R;

      // Smoke.
      const smoke = Math.hypot(px - LODGE.x, pz - LODGE.z) < SMOKE_R;
      puffs.forEach((sp, i) => {
        sp.visible = smoke;
        if (!smoke) return;
        const k = ((t / LIFE + i / PUFFS) % 1);
        const drift = k * 3.2;
        sp.position.set(chimney.x - drift * 0.6 + Math.sin(t * 0.7 + i) * 0.3 * k, chimney.y + k * 4.5, chimney.z + drift * 0.15);
        const sc = 0.7 + k * 2.2;
        sp.scale.set(sc, sc, 1);
        (sp.material as THREE.SpriteMaterial).opacity = 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k * 0.4);
      });

      // Night light: the porch, else the tow-base lantern, never both.
      const n = nightF();
      const dp = Math.hypot(px - LODGE.x, pz - LODGE.z), dl = Math.hypot(px - lanternAt.x, pz - lanternAt.z);
      if (n > 0.3 && dp < LIGHT_R) {
        light.position.copy(porch);
        light.distance = 14;
        light.intensity = 5 * n * (0.94 + 0.06 * Math.sin(t * 7.3));
        light.visible = true;
      } else if (n > 0.3 && dl < LANTERN_R) {
        light.position.set(lanternAt.x, lanternY, lanternAt.z);
        light.distance = 9;
        light.intensity = 2.5 * n * (0.94 + 0.06 * Math.sin(t * 5.1));
        light.visible = true;
      } else {
        light.visible = false;
      }

      // Riders.
      if (!near) { for (const r of riders) r.group.visible = false; return; }
      for (const r of riders) {
        r.clock += dt;
        const len = Math.abs(r.z1 - r.z0);
        const dur = len / SPEED;
        if (r.clock > dur + 0.5) r.clock = -r.pause;
        if (r.clock < 0) { r.group.visible = false; continue; }
        const z = r.z0 + Math.min(1, r.clock / dur) * (r.z1 - r.z0);
        const x = Math.min(SITE.maxX, Math.max(SITE.minX, r.x(z)));
        const z2 = z + 1;
        const yaw = Math.atan2(r.x(z2) - x, 1);
        const fade = Math.min(1, r.clock / 0.8, Math.max(0, (dur - r.clock) / 1.2));
        const y = heightAt(x, z);
        r.group.position.set(x, y, z);
        r.group.rotation.y = yaw;
        r.group.scale.setScalar(Math.max(0.001, fade));
        const hidden = Math.hypot(px - x, pz - z) < RIDER_HIDE_R;
        r.group.visible = !hidden && fade > 0.01;
        // The gnome stands on (or sits above) its ride in group-local space; the group carries the position and yaw.
        r.model.update(gnomeState(0, r.sitting ? 0.12 : 0.05, 0, 0, SPEED, r.sitting), dt);
        r.model.object.position.set(0, r.sitting ? 0.12 : 0.05, 0);
        r.model.object.rotation.y = 0;
      }
    },
  };
}
