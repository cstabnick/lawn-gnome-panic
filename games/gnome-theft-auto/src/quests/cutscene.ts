// The silent cutscene: a staged room far from the map (nobody speaks; icons, poses and wanted posters do the talking).
// It is built from a CutsceneRequest (the room and the targets), so any quest that has targets gets one for free.
// The player calls play(), then update(dt, camera) every frame while `active`; everything else is internal.
import * as THREE from 'three';
import { buildHeld, buildPrefab } from '@lawn/prefabs';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { gnomeState, makeGnome } from '../gnomes';

export interface CutsceneRequest {
  room: 'mulch-club';
  /** One wanted poster per target, in the order shown. */
  targets: { name: string; look: GnomeLook }[];
}

type V3 = [number, number, number];
/** A camera move: from -> to over `dur` seconds, always looking at `look`; `act` is what the actors do; `icon` the bubble. */
interface Shot { dur: number; from: V3; to: V3; look: V3; act?: 'lean' | 'posters' | 'point'; icon?: string }

export interface Cutscene {
  /** True while the cutscene owns the camera and the game should not run. */
  active: boolean;
  play(req: CutsceneRequest, onDone: () => void): void;
  /** Advance the cutscene (and its fade after it ends); aims the camera while `active`. Safe to call every frame. */
  update(dt: number, camera: THREE.PerspectiveCamera): void;
  skip(): void;
}

/** The stage is built here, far outside the map. */
const ORIGIN = new THREE.Vector3(3000, 0, 3000);
const DARK = 0x0a0608;
const BOSS_LOOK: GnomeLook = {
  hat: 0x141414, shirt: 0xf4f1e6, pants: 0xf4f1e6, skin: 0xf1c27d, boots: 0x000000, beard: 0x9a9a9a,
  hair: null, freckles: false, dress: false, glasses: true, bowlCut: null,
};
const GUARD_LOOK: GnomeLook = {
  hat: 0x222226, shirt: 0x1c1c22, pants: 0x15151a, skin: 0xe0ac69, boots: 0x000000, beard: null,
  hair: null, freckles: false, dress: false, glasses: true, bowlCut: null,
};

const FADE = 0.7;
/** The boss's armchair stands on a dais so he looks over the desk. */
const DAIS = 0.3;
const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp3 = (a: V3, b: V3, t: number, out: THREE.Vector3): THREE.Vector3 =>
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t).add(ORIGIN);

/** Shots for a contract: establish the room, the boss, the posters going down one by one, then the point. */
function contractShots(targets: number): Shot[] {
  const posterTime = 1.2 * targets + 0.8;
  return [
    { dur: 3.4, from: [0, 1.8, 6], to: [0, 1.5, 3.4], look: [0, 1.35, -3.4] },
    { dur: 3.0, from: [1.6, 1.2, -0.2], to: [0.7, 1.5, -1.2], look: [0, 1.65, -3.3], act: 'lean' },
    { dur: posterTime, from: [0, 2.6, -0.4], to: [0, 1.9, -1.0], look: [0, 0.8, -1.8], act: 'posters', icon: '🎯' },
    { dur: 3.0, from: [-1.3, 1.3, -0.8], to: [-0.5, 1.6, -1.5], look: [0, 1.65, -3.3], act: 'point', icon: '💰' },
  ];
}

/** A wanted poster picture for a target: paper, the face, the hat and beard in its colours, a red cross. */
function posterTexture(look: GnomeLook, name: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 168;
  const g = cv.getContext('2d');
  if (g) {
    const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    g.fillStyle = '#e6d6a2';
    g.fillRect(0, 0, 128, 168);
    g.strokeStyle = '#7a5a2a';
    g.lineWidth = 5;
    g.strokeRect(5, 5, 118, 158);
    g.fillStyle = '#5a2a14';
    g.font = '700 15px system-ui,sans-serif';
    g.textAlign = 'center';
    g.fillText('WANTED', 64, 26);
    if (look.beard !== null) {
      g.fillStyle = css(look.beard);
      g.beginPath(); g.ellipse(64, 104, 26, 30, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = css(look.skin);
    g.beginPath(); g.ellipse(64, 84, 22, 24, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = css(look.hat);
    g.beginPath(); g.moveTo(36, 72); g.lineTo(92, 72); g.lineTo(64, 30); g.closePath(); g.fill();
    g.fillStyle = '#222';
    if (look.glasses) { g.fillRect(48, 80, 14, 7); g.fillRect(66, 80, 14, 7); g.fillRect(62, 82, 4, 2); }
    else { g.beginPath(); g.arc(55, 84, 2.5, 0, Math.PI * 2); g.arc(73, 84, 2.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#5a2a14';
    g.font = '700 11px system-ui,sans-serif';
    g.fillText(name.toUpperCase(), 64, 152, 110);
    g.strokeStyle = 'rgba(200,30,30,0.9)';
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(28, 52); g.lineTo(100, 130); g.moveTo(100, 52); g.lineTo(28, 130); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Build `id`, scale it so its widest side (or height) is `size`, stand it on the floor, return it with its top height. */
function fit(id: string, size: number, by: 'w' | 'h'): { obj: THREE.Group; top: number } {
  const obj = buildPrefab(id, { lights: false });
  const bb = new THREE.Box3().setFromObject(obj);
  const dim = by === 'h' ? bb.max.y - bb.min.y : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  const k = dim > 0 ? size / dim : 1;
  obj.scale.setScalar(k);
  return { obj, top: (bb.max.y - bb.min.y) * k };
}

export function createCutscene(scene: THREE.Scene, ui: HTMLElement, hooks: { setUiVisible(v: boolean): void }): Cutscene {
  // ---- Overlay: letterbox bars, fade, icon bubble, skip button --------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;pointer-events:auto;font-family:system-ui,sans-serif;';
  const bar = (top: boolean): HTMLDivElement => {
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;left:0;right:0;${top ? 'top' : 'bottom'}:0;height:12vh;background:#000;`;
    return b;
  };
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:1;';
  const icon = document.createElement('div');
  icon.style.cssText = 'position:absolute;left:50%;bottom:16vh;transform:translateX(-50%);font-size:min(22vw,120px);line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,.7));display:none;';
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.textContent = 'Skip ▶';
  skipBtn.style.cssText = 'position:absolute;right:max(18px,env(safe-area-inset-right));bottom:calc(12vh + 12px);min-width:88px;min-height:44px;padding:8px 16px;border-radius:999px;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.55);color:#fff;font:700 14px system-ui,sans-serif;';
  overlay.append(bar(true), bar(false), icon, skipBtn, fade);
  ui.append(overlay);

  // ---- Staging state ----------------------------------------------------------------------------------------------
  let stage: THREE.Group | null = null;
  const lightsSaved: { l: THREE.Light; i: number }[] = [];
  let savedBg: THREE.Scene['background'] = null;
  let savedFog: THREE.Scene['fog'] = null;
  let savedFov = 60;
  let shots: Shot[] = [];
  let phase: 'off' | 'in' | 'play' | 'out' | 'after' = 'off';
  let phaseT = 0;
  let shotIdx = 0;
  let shotT = 0;
  let onDone: (() => void) | null = null;
  let boss: GnomeModel | null = null;
  let guards: GnomeModel[] = [];
  let posters: { mesh: THREE.Mesh; rest: THREE.Vector3; at: number }[] = [];
  let clock = 0;
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  function build(req: CutsceneRequest): void {
    const g = new THREE.Group();
    g.position.copy(ORIGIN);
    // Room: floor, three walls and a ceiling, dark wood and oxblood.
    const mat = (c: number): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: number): void => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
      m.position.set(x, y, z);
      m.receiveShadow = true;
      g.add(m);
    };
    box(14, 0.1, 13, 0, -0.05, 0, 0x2a1810);        // floor
    box(14, 4.2, 0.2, 0, 2.1, -6.6, 0x4a1218);      // back wall
    box(0.2, 4.2, 13, -7.1, 2.1, 0, 0x3c0f14);      // left wall
    box(0.2, 4.2, 13, 7.1, 2.1, 0, 0x3c0f14);       // right wall
    box(14, 0.2, 13, 0, 4.3, 0, 0x1a0a0c);          // ceiling
    box(14, 0.12, 0.2, 0, 0.3, -6.45, 0xc9a227);    // gold skirting
    const rug = fit('rug', 6, 'w');
    rug.obj.position.set(0, 0.01, -1.2);
    g.add(rug.obj);
    const shelf = fit('bookshelf', 2.6, 'w');
    shelf.obj.position.set(-4.2, 0, -6.2);
    g.add(shelf.obj);
    const shelf2 = fit('bookshelf', 2.6, 'w');
    shelf2.obj.position.set(4.2, 0, -6.2);
    g.add(shelf2.obj);
    const lamp = fit('lamp', 1.5, 'h');
    lamp.obj.position.set(-4.6, 0, -5.4);
    g.add(lamp.obj);
    // The desk, and the boss's armchair behind it.
    const desk = fit('table', 2.6, 'w');
    desk.obj.position.set(0, 0, -1.9);
    g.add(desk.obj);
    const chair = fit('armchair', 1.7, 'w');
    chair.obj.position.set(0, DAIS, -3.5);
    box(3, DAIS, 2.2, 0, DAIS / 2, -3.5, 0x2a1c14); // dais
    g.add(chair.obj);
    // Lights: a warm lamp on the desk and a spot on the boss.
    const lampLight = new THREE.PointLight(0xffc27a, 14, 16, 1.6);
    lampLight.position.set(-2.4, 1.8, -1.8);
    g.add(lampLight);
    const spot = new THREE.SpotLight(0xffe2b0, 32, 14, 0.5, 0.6, 1.4);
    spot.position.set(0, 4, -1.5);
    spot.target.position.set(0, 1, -3.5);
    g.add(spot, spot.target);
    // The cast: the boss in the armchair, a bodyguard either side with a pistol.
    boss = makeGnome(g, BOSS_LOOK);
    boss.object.scale.setScalar(1.6);
    guards = [GUARD_LOOK, GUARD_LOOK].map((look) => {
      const m = makeGnome(g, look);
      m.object.scale.setScalar(1.15);
      const held = buildHeld('gta-pistol');
      held.position.set(0, -0.32, 0.02);
      held.rotation.x = Math.PI;
      m.arms.right.add(held);
      return m;
    });
    // Wanted posters: they land on the desk one by one during the posters shot.
    posters = req.targets.map((t, i) => {
      const n = req.targets.length;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.65),
        new THREE.MeshBasicMaterial({ map: posterTexture(t.look, t.name), side: THREE.DoubleSide, transparent: true }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      const x = (i - (n - 1) / 2) * 0.62;
      const rest = new THREE.Vector3(x, desk.top + 0.02, -1.8 + (i % 2) * 0.05);
      mesh.position.copy(rest);
      g.add(mesh);
      return { mesh, rest, at: 0.6 + i * 1.2 };
    });
    scene.add(g);
    stage = g;
    seatY = DAIS + chair.top * 0.32;
  }
  let seatY = 0.5;

  /** Pose and animate everyone for this frame. */
  function animate(dt: number, shot: Shot, t: number): void {
    if (!boss) return;
    clock += dt;
    boss.update(gnomeState(0, seatY, -3.5, 0, 0, true), dt);
    guards.forEach((m, i) => m.update(gnomeState(i === 0 ? -2.4 : 2.4, 0, -3.1, i === 0 ? 0.6 : -0.6, 0), dt));
    if (shot.act === 'lean') {
      boss.arms.right.rotation.set(-0.7 - Math.sin(clock * 4) * 0.05, 0, 0.3);
    } else if (shot.act === 'posters') {
      boss.arms.right.rotation.set(-1.2, 0, 0.25 + Math.sin(clock * 3) * 0.03);
    } else if (shot.act === 'point') {
      // Right arm out straight at the camera, a little jab now and then.
      boss.arms.right.rotation.set(-1.55 - Math.max(0, Math.sin(clock * 5)) * 0.15, 0, 0);
      guards[0].arms.left.rotation.set(-0.3, 0, 0);
    }
    for (const p of posters) {
      const show = shot.act === 'posters' ? t >= p.at : shotIdx > 2;
      p.mesh.visible = show;
      if (!show) continue;
      const u = shot.act === 'posters' ? Math.min(1, (t - p.at) / 0.35) : 1;
      p.mesh.position.set(p.rest.x, p.rest.y + (1 - u * u) * 1.2, p.rest.z);
      p.mesh.rotation.z = (1 - u) * 0.9 + (p.rest.x * 0.15);
    }
  }

  function setLights(dim: boolean): void {
    if (dim) {
      scene.traverse((o) => {
        const l = o as THREE.Light;
        if (l.isLight && !stage?.getObjectById(l.id)) { lightsSaved.push({ l, i: l.intensity }); l.intensity *= 0.3; }
      });
    } else {
      for (const s of lightsSaved) s.l.intensity = s.i;
      lightsSaved.length = 0;
    }
  }

  function begin(req: CutsceneRequest): void {
    build(req);
    setLights(true);
    savedBg = scene.background;
    savedFog = scene.fog;
    scene.background = new THREE.Color(DARK);
    scene.fog = new THREE.Fog(DARK, 14, 40);
    shots = contractShots(req.targets.length);
    shotIdx = 0;
    shotT = 0;
    clock = 0;
  }

  function cleanup(): void {
    if (stage) {
      scene.remove(stage);
      stage = null;
    }
    boss = null;
    guards = [];
    posters = [];
    setLights(false);
    scene.background = savedBg;
    scene.fog = savedFog;
  }

  skipBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); cs.skip(); });

  const cs: Cutscene = {
    active: false,

    play(req, done) {
      if (cs.active || phase !== 'off') return;
      cs.active = true;
      onDone = done;
      hooks.setUiVisible(false);
      overlay.style.display = 'block';
      fade.style.opacity = '1';
      icon.style.display = 'none';
      begin(req);
      phase = 'in';
      phaseT = 0;
    },

    skip() {
      if (cs.active && (phase === 'in' || phase === 'play')) {
        phase = 'out';
        phaseT = 0;
        icon.style.display = 'none';
      }
    },

    update(dt, camera) {
      if (phase === 'off') return;
      phaseT += dt;
      if (phase === 'in') {
        fade.style.opacity = String(Math.max(0, 1 - phaseT / FADE));
        if (phaseT >= FADE) { phase = 'play'; phaseT = 0; savedFov = camera.fov; }
      }
      if (phase === 'in' || phase === 'play') {
        const shot = shots[shotIdx];
        if (phase === 'play') shotT += dt;
        else shotT = 0;
        const u = Math.min(1, shotT / shot.dur);
        lerp3(shot.from, shot.to, smooth(u), tmpPos);
        tmpLook.set(shot.look[0], shot.look[1], shot.look[2]).add(ORIGIN);
        camera.fov = 52;
        camera.updateProjectionMatrix();
        camera.position.copy(tmpPos);
        camera.lookAt(tmpLook);
        animate(dt, shot, shotT);
        if (shot.icon && phase === 'play') {
          icon.textContent = shot.icon;
          icon.style.display = 'block';
          icon.style.transform = `translateX(-50%) scale(${0.6 + 0.4 * smooth(Math.min(1, shotT / 0.4))})`;
        } else icon.style.display = 'none';
        if (phase === 'play' && shotT >= shot.dur) {
          shotIdx++;
          shotT = 0;
          if (shotIdx >= shots.length) { phase = 'out'; phaseT = 0; icon.style.display = 'none'; shotIdx = shots.length - 1; }
        }
      } else if (phase === 'out') {
        const shot = shots[Math.min(shotIdx, shots.length - 1)];
        animate(dt, shot, shot.dur);
        fade.style.opacity = String(Math.min(1, phaseT / FADE));
        if (phaseT >= FADE) {
          cleanup();
          camera.fov = savedFov;
          camera.updateProjectionMatrix();
          const d = onDone;
          onDone = null;
          d?.();
          phase = 'after';
          phaseT = 0;
          cs.active = false;
          hooks.setUiVisible(true);
        }
      } else if (phase === 'after') {
        fade.style.opacity = String(Math.max(0, 1 - phaseT / FADE));
        if (phaseT >= FADE) {
          overlay.style.display = 'none';
          phase = 'off';
        }
      }
    },
  };
  return cs;
}
