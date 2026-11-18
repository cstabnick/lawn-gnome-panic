// Little particle bursts (hearts, bubbles, zzz...) as pooled sprites. At most MAX_LIVE are alive at once.
import * as THREE from 'three';

export type FxKind = 'heart' | 'bubble' | 'sparkle' | 'zzz' | 'dust' | 'crumb' | 'splash' | 'note' | 'woof';

export interface Fx {
  /** Burst `count` particles of kind at world position pos. */
  spawn(kind: FxKind, pos: THREE.Vector3, count?: number): void;
  update(dt: number): void;
}

const MAX_LIVE = 200;
/** Particles that hit the lawn bounce here (the lawn is y = 0). */
const FLOOR_Y = 0.05;

interface KindCfg {
  life: number;
  size: number;
  gravity: number;
  /** Random horizontal speed, +/- this value on x and z. */
  spread: number;
  /** Random upward speed range. */
  rise: [number, number];
  draw(ctx: CanvasRenderingContext2D): void;
}

const CFG: Record<FxKind, KindCfg> = {
  heart: {
    life: 1.2, size: 0.7, gravity: 0, spread: 0, rise: [1.2, 1.2],
    draw(ctx) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(64, 112);
      ctx.bezierCurveTo(8, 76, 4, 38, 32, 26);
      ctx.bezierCurveTo(48, 19, 60, 30, 64, 42);
      ctx.bezierCurveTo(68, 30, 80, 19, 96, 26);
      ctx.bezierCurveTo(124, 38, 120, 76, 64, 112);
      ctx.closePath();
      ctx.fill();
    },
  },
  bubble: {
    life: 1.5, size: 0.5, gravity: 0, spread: 0.25, rise: [0.5, 0.8],
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(64, 64, 54, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(46, 46, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
    },
  },
  sparkle: {
    life: 0.8, size: 0.6, gravity: 9, spread: 2.2, rise: [2.5, 3.5],
    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(64, 4);
      ctx.quadraticCurveTo(70, 58, 124, 64);
      ctx.quadraticCurveTo(70, 70, 64, 124);
      ctx.quadraticCurveTo(58, 70, 4, 64);
      ctx.quadraticCurveTo(58, 58, 64, 4);
      ctx.closePath();
      ctx.fillStyle = '#facc15';
      ctx.fill();
    },
  },
  zzz: {
    life: 2, size: 0.5, gravity: 0, spread: 0.5, rise: [0.7, 0.9],
    draw(ctx) {
      ctx.font = 'bold 92px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#334155';
      ctx.fillText('Z', 64, 70);
    },
  },
  dust: {
    life: 0.6, size: 0.5, gravity: 0, spread: 1.4, rise: [0, 0],
    draw(ctx) {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      g.addColorStop(0, 'rgba(210, 180, 140, 0.95)');
      g.addColorStop(1, 'rgba(210, 180, 140, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    },
  },
  crumb: {
    life: 0.7, size: 0.25, gravity: 14, spread: 1.0, rise: [3, 4],
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(64, 64, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#92400e';
      ctx.fill();
    },
  },
  splash: {
    life: 0.9, size: 0.25, gravity: 12, spread: 2.5, rise: [3, 5],
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(64, 64, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#7dd3fc';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(56, 56, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    },
  },
  woof: {
    life: 0.9, size: 1.4, gravity: 0, spread: 0.2, rise: [0.6, 0.9],
    draw(ctx) {
      // A white speech burst with a bold orange WOOF!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 5;
      ctx.beginPath();
      const n = 14;
      for (let i = 0; i <= n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const r = i % 2 ? 44 : 60;
        const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * 0.62;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = '900 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ea580c';
      ctx.fillText('WOOF!', 64, 66);
    },
  },
  note: {
    life: 1.2, size: 0.7, gravity: 0, spread: 0.15, rise: [0.9, 1.1],
    draw(ctx) {
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111111';
      ctx.fillText('♪', 64, 68);
    },
  },
};

interface Particle {
  kind: FxKind;
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  vel: THREE.Vector3;
  age: number;
  seed: number;
}

function makeTexture(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFx(scene: THREE.Scene): Fx {
  const textures = {} as Record<FxKind, THREE.CanvasTexture>;
  const free = {} as Record<FxKind, Particle[]>;
  for (const kind of Object.keys(CFG) as FxKind[]) free[kind] = [];
  const live: Particle[] = []; // oldest first

  const textureFor = (kind: FxKind): THREE.CanvasTexture => {
    let tex = textures[kind];
    if (!tex) {
      tex = makeTexture(CFG[kind].draw);
      textures[kind] = tex;
    }
    return tex;
  };

  const make = (kind: FxKind): Particle => {
    // WOOF! bubbles draw over the dog's own head.
    const mat = new THREE.SpriteMaterial({ map: textureFor(kind), transparent: true, depthWrite: false, depthTest: kind !== 'woof' });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    return { kind, sprite, mat, vel: new THREE.Vector3(), age: 0, seed: 0 };
  };

  /** Hide a particle and return it to its kind's pool. The caller removes it from `live`. */
  const recycle = (p: Particle) => {
    p.sprite.visible = false;
    free[p.kind].push(p);
  };

  return {
    spawn(kind, pos, count = 1) {
      const cfg = CFG[kind];
      for (let i = 0; i < count; i++) {
        while (live.length >= MAX_LIVE) {
          const oldest = live.shift();
          if (oldest) recycle(oldest);
        }
        const p = free[kind].pop() ?? make(kind);
        p.age = 0;
        p.seed = Math.random() * Math.PI * 2;
        p.sprite.position.set(
          pos.x + (Math.random() * 2 - 1) * 0.25,
          pos.y + Math.random() * 0.1,
          pos.z + (Math.random() * 2 - 1) * 0.25,
        );
        p.vel.set(
          (Math.random() * 2 - 1) * cfg.spread,
          cfg.rise[0] + Math.random() * (cfg.rise[1] - cfg.rise[0]),
          (Math.random() * 2 - 1) * cfg.spread,
        );
        p.mat.opacity = 1;
        p.sprite.scale.set(cfg.size, cfg.size, 1);
        p.sprite.visible = true;
        live.push(p);
      }
    },

    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i];
        const cfg = CFG[p.kind];
        p.age += dt;
        if (p.age >= cfg.life) {
          recycle(p);
          live.splice(i, 1);
          continue;
        }
        const k = p.age / cfg.life; // 0 at spawn, 1 at death

        if (p.kind === 'heart') p.vel.x = Math.sin(p.age * 7 + p.seed) * 0.6; // wobble
        p.vel.y -= cfg.gravity * dt;
        const pos = p.sprite.position;
        pos.addScaledVector(p.vel, dt);
        if (pos.y < FLOOR_Y) {
          pos.y = FLOOR_Y;
          p.vel.y = -p.vel.y * 0.3;
          p.vel.x *= 0.6;
          p.vel.z *= 0.6;
        }

        let size = cfg.size;
        let opacity = 1 - k;
        if (p.kind === 'bubble') {
          // Drift, then pop: swell and vanish over the last 15% of its life.
          const pop = k > 0.85 ? (k - 0.85) / 0.15 : 0;
          size = cfg.size * (1 + 0.5 * pop);
          opacity = pop > 0 ? 1 - pop : 0.85;
        } else if (p.kind === 'zzz') {
          size = cfg.size * (0.6 + 0.6 * k);
        } else if (p.kind === 'dust') {
          size = cfg.size * (1 + 1.8 * k);
        } else if (p.kind === 'woof') {
          // Pop in big, settle, fade at the end.
          size = cfg.size * (k < 0.15 ? 0.5 + (k / 0.15) * 0.7 : 1.2 - 0.2 * Math.min(1, (k - 0.15) * 3));
          opacity = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        } else if (p.kind === 'sparkle') {
          size = cfg.size * (1 - 0.5 * k);
        }
        p.sprite.scale.set(size, size, 1);
        p.mat.opacity = opacity;
      }
    },
  };
}
