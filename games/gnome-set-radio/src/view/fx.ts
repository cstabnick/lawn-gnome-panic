import * as THREE from 'three';
import type { SkaterState } from '../sim/skater';

export interface GsrFx {
  update(s: SkaterState, dt: number): void;
  burst(x: number, y: number, z: number, colorHex: string, count?: number): void;
  ring(x: number, y: number, z: number, colorHex: string): void;
  flash(colorHex: string, peak?: number, dur?: number): void;
  dispose(): void;
}

const STREAKS = 80;
const PARTS = 400;
const RINGS = 6;
const RING_TIME = 0.45;
const BOX = 18;

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const clampBox = (v: number): number => Math.max(-BOX + 1, Math.min(BOX - 1, v));

export function createFx(scene: THREE.Scene, ui: HTMLElement): GsrFx {
  const vFwd = new THREE.Vector3(0, 0, 1);
  const vLast = new THREE.Vector3();
  let primed = false;
  let vigOpacity = 0;
  let ringNext = 0;
  let pNext = 0;

  const C_CYAN = new THREE.Color('#00e5ff');
  const C_PINK = new THREE.Color('#ff4ecd');
  const C_GOLD = new THREE.Color('#ffd740');
  const C_LIME = new THREE.Color('#69f0ae');
  const LINE_COLS = ['#ffffff', '#ff4ecd', '#00e5ff', '#ffd740'];

  // DOM: speed lines canvas + vignette + flash inside #gsr-ui
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:2;';
  ui.appendChild(box);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%;';
  box.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const sizeCanvas = (): void => {
    canvas.width = Math.max(1, Math.ceil(window.innerWidth / 2));
    canvas.height = Math.max(1, Math.ceil(window.innerHeight / 2));
  };
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const flashEl = document.createElement('div');
  flashEl.style.cssText = 'position:absolute; inset:0; opacity:0; background:#00e5ff;';
  box.appendChild(flashEl);
  let flashT = 0;
  let flashDur = 0.25;
  let flashPeak = 0;
  let flashOn = false;

  const vignette = document.createElement('div');
  vignette.style.cssText =
    'position:absolute; inset:0; opacity:0; background:radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(255,78,205,0.68) 86%, rgba(0,229,255,0.85) 100%);';
  box.appendChild(vignette);

  // 3D Wind streaks
  const sHead = new Float32Array(STREAKS * 3);
  const sPos = new Float32Array(STREAKS * 6);
  const sAttr = new THREE.BufferAttribute(sPos, 3);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', sAttr);
  const sMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const streaks = new THREE.LineSegments(sGeo, sMat);
  streaks.frustumCulled = false;
  scene.add(streaks);

  // 3D Pooled Particles
  const pPos = new Float32Array(PARTS * 3);
  const pVel = new Float32Array(PARTS * 3);
  const pBase = new Float32Array(PARTS * 3);
  const pCol = new Float32Array(PARTS * 3);
  const pGrav = new Float32Array(PARTS);
  const pLife = new Float32Array(PARTS);
  const pMax = new Float32Array(PARTS);
  const pAttr = new THREE.BufferAttribute(pPos, 3);
  const cAttr = new THREE.BufferAttribute(pCol, 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', pAttr);
  pGeo.setAttribute('color', cAttr);
  const pMat = new THREE.PointsMaterial({
    size: 0.34,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  // 3D Additive Shockwave Rings
  const ringGeo = new THREE.RingGeometry(0.55, 0.9, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; age: number }[] = [];
  for (let i = 0; i < RINGS; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: C_CYAN,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    rings.push({ mesh, mat, age: -1 });
  }

  const respawnStreak = (i: number, cx: number, cy: number, cz: number): void => {
    const o = i * 3;
    const ahead = rnd(0, 14);
    sHead[o] = cx + clampBox(vFwd.x * ahead + rnd(-6, 6));
    sHead[o + 1] = cy + clampBox(vFwd.y * ahead + rnd(-4, 6));
    sHead[o + 2] = cz + clampBox(vFwd.z * ahead + rnd(-6, 6));
  };

  const emit = (x: number, y: number, z: number, vx: number, vy: number, vz: number, grav: number, life: number, c: THREE.Color): void => {
    const i = pNext;
    pNext = (pNext + 1) % PARTS;
    const o = i * 3;
    pPos[o] = x; pPos[o + 1] = y; pPos[o + 2] = z;
    pVel[o] = vx; pVel[o + 1] = vy; pVel[o + 2] = vz;
    pBase[o] = c.r; pBase[o + 1] = c.g; pBase[o + 2] = c.b;
    pGrav[i] = grav; pLife[i] = life; pMax[i] = life;
  };

  const drawSpeedLines = (speed: number, boosting: boolean, grinding: boolean): void => {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    let n = 0;
    if (speed >= 14) n = Math.round(58 * clamp01((speed - 14) / 16));
    if (boosting || grinding) n += 26;
    if (n === 0) return;

    const cx = w / 2;
    const cy = h / 2;
    const hd = Math.sqrt(w * w + h * h) / 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const r0 = rnd(0.76, 1.1);
      const re = Math.max(r0 - rnd(0.14, 0.36), 0.38);
      const sx = cx + dx * r0 * hd;
      const sy = cy + dy * r0 * hd;
      const tx = cx + dx * re * hd;
      const ty = cy + dy * re * hd;
      const wd = rnd(1.4, 2.9);
      ctx.globalAlpha = rnd(0.22, 0.56);
      ctx.fillStyle = boosting || grinding ? LINE_COLS[1 + (i % 3)]! : LINE_COLS[0]!;
      ctx.beginPath();
      ctx.moveTo(sx - dy * wd, sy + dx * wd);
      ctx.lineTo(tx, ty);
      ctx.lineTo(sx + dy * wd, sy - dx * wd);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  return {
    burst(x, y, z, colorHex, count = 20) {
      const col = new THREE.Color(colorHex);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rnd(-0.2, 0.2);
        const s = rnd(3, 8);
        emit(x, y + 0.25, z, Math.cos(a) * s, rnd(2, 6), Math.sin(a) * s, 12, rnd(0.35, 0.65), i % 2 === 0 ? col : C_GOLD);
      }
    },
    ring(x, y, z, colorHex) {
      const r = rings[ringNext]!;
      ringNext = (ringNext + 1) % RINGS;
      r.age = 0;
      r.mesh.visible = true;
      r.mesh.position.set(x, y + 0.08, z);
      r.mesh.scale.setScalar(1);
      r.mat.color.set(colorHex);
      r.mat.opacity = 1;
    },
    flash(colorHex, peak = 0.24, dur = 0.22) {
      flashEl.style.background = colorHex;
      flashPeak = peak;
      flashDur = dur;
      flashT = 0;
      flashOn = true;
    },
    update(s, dt) {
      const speed = Math.hypot(s.vx, s.vy, s.vz);
      if (speed > 0.1) vFwd.set(s.vx / speed, s.vy / speed, s.vz / speed);

      if (!primed || Math.hypot(s.x - vLast.x, s.y - vLast.y, s.z - vLast.z) > 10) {
        primed = true;
        for (let i = 0; i < STREAKS; i++) respawnStreak(i, s.x, s.y + 1, s.z);
      }
      vLast.set(s.x, s.y, s.z);

      // Update 3D wind streaks
      const len = Math.min(5, speed * 0.1);
      const k = dt * 0.65;
      for (let i = 0; i < STREAKS; i++) {
        const o = i * 3;
        sHead[o] -= s.vx * k;
        sHead[o + 1] -= s.vy * k;
        sHead[o + 2] -= s.vz * k;
        if (Math.abs(sHead[o] - s.x) > BOX || Math.abs(sHead[o + 1] - (s.y + 1)) > BOX || Math.abs(sHead[o + 2] - s.z) > BOX) {
          respawnStreak(i, s.x, s.y + 1, s.z);
        }
        const hx = sHead[o], hy = sHead[o + 1], hz = sHead[o + 2];
        const v = i * 6;
        sPos[v] = hx; sPos[v + 1] = hy; sPos[v + 2] = hz;
        sPos[v + 3] = hx - vFwd.x * len; sPos[v + 4] = hy - vFwd.y * len; sPos[v + 5] = hz - vFwd.z * len;
      }
      sAttr.needsUpdate = true;
      sMat.opacity = clamp01((speed - 11) / 14) * 0.72;

      // Grind sparks
      if (s.grinding) {
        for (let i = 0; i < 4; i++) {
          emit(s.x, s.y + 0.08, s.z, -vFwd.x * rnd(2, 5) + rnd(-1.5, 1.5), rnd(2, 5), -vFwd.z * rnd(2, 5) + rnd(-1.5, 1.5), 14, rnd(0.22, 0.38), i & 1 ? C_CYAN : C_GOLD);
        }
      }
      // Boost trail
      if (s.boosting) {
        for (let i = 0; i < 3; i++) {
          emit(s.x - vFwd.x * 0.5 + rnd(-0.2, 0.2), s.y + 0.4 + rnd(-0.15, 0.15), s.z - vFwd.z * 0.5 + rnd(-0.2, 0.2), rnd(-0.5, 0.5), rnd(0.2, 0.8), rnd(-0.5, 0.5), 0, 0.36, i & 1 ? C_PINK : C_CYAN);
        }
      }
      // Carve sparks when sliding hard or braking
      if (s.grounded && !s.grinding && ((Math.abs(s.carveSlip) > 0.22 && speed > 7) || (s.braking && speed > 2))) {
        emit(s.x, s.y + 0.06, s.z, rnd(-1.5, 1.5), rnd(1.2, 3), rnd(-1.5, 1.5), 10, 0.3, s.braking ? C_GOLD : C_LIME);
      }
      // Breakdance Aether Air-Freeze aura sparks
      if (s.danceMove === 'airfreeze') {
        const a = Math.random() * Math.PI * 2;
        emit(s.x + Math.cos(a) * 0.9, s.y + 0.65, s.z + Math.sin(a) * 0.9, 0, rnd(1.0, 2.4), 0, -1, 0.38, Math.random() > 0.5 ? C_CYAN : C_PINK);
      }

      // Step particles
      const drag = Math.max(0, 1 - 1.2 * dt);
      for (let i = 0; i < PARTS; i++) {
        const o = i * 3;
        if (pLife[i] > 0) {
          pLife[i] -= dt;
          pVel[o] *= drag;
          pVel[o + 1] = pVel[o + 1] * drag - pGrav[i] * dt;
          pVel[o + 2] *= drag;
          pPos[o] += pVel[o] * dt;
          pPos[o + 1] += pVel[o + 1] * dt;
          pPos[o + 2] += pVel[o + 2] * dt;
          const fade = pLife[i] > 0 ? pLife[i] / pMax[i] : 0;
          pCol[o] = pBase[o] * fade;
          pCol[o + 1] = pBase[o + 1] * fade;
          pCol[o + 2] = pBase[o + 2] * fade;
        } else {
          pCol[o] = 0; pCol[o + 1] = 0; pCol[o + 2] = 0;
        }
      }
      pAttr.needsUpdate = true;
      cAttr.needsUpdate = true;

      // Step rings
      for (const r of rings) {
        if (r.age < 0) continue;
        r.age += dt;
        const t = r.age / RING_TIME;
        if (t >= 1) {
          r.age = -1;
          r.mesh.visible = false;
        } else {
          r.mesh.scale.setScalar(1 + 4.8 * t);
          r.mat.opacity = 1 - t;
        }
      }

      // Step flash & vignette
      if (flashOn) {
        flashT += dt;
        if (flashT >= flashDur) {
          flashOn = false;
          flashEl.style.opacity = '0';
        } else {
          flashEl.style.opacity = String(flashPeak * (1 - flashT / flashDur));
        }
      }
      const vigTarget = s.boosting || s.grinding ? 0.45 : 0;
      vigOpacity += (vigTarget - vigOpacity) * Math.min(1, dt * 6);
      vignette.style.opacity = String(vigOpacity);

      drawSpeedLines(speed, s.boosting, s.grinding);
    },
    dispose() {
      window.removeEventListener('resize', sizeCanvas);
      box.remove();
      sGeo.dispose(); sMat.dispose();
      pGeo.dispose(); pMat.dispose();
      ringGeo.dispose();
      for (const r of rings) r.mat.dispose();
    },
  };
}
