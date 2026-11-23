// First-time load Lakitu-style flying intro cutscene across Turfton and its surrounding biomes,
// descending smoothly behind the player gnome at SPAWN. The flight is a camera-only SceneScript (cutscene/intro.ts)
// played on the cutscene timeline, so every shot is checked by intro.test.ts. Skipped if already seen or when demo
// URL flags are set.
import * as THREE from 'three';
import { SPAWN } from './config';
import { heightAt } from './terrain';
import { introScript } from './cutscene/intro';
import { compile, sampleFrame } from './cutscene/timeline';
import type { Timeline } from './cutscene/script';

const SEEN_KEY = 'gta-intro-seen-v1';

const CSS = `
#gta-intro{position:fixed;inset:0;z-index:50;display:none;pointer-events:none;font-family:system-ui,sans-serif;color:#fff;}
#gta-intro.on{display:block;}
#gta-intro .bar{position:absolute;left:0;right:0;height:min(9vh,56px);background:#000;}
#gta-intro .bar.top{top:0;}
#gta-intro .bar.bot{bottom:0;}
#gta-intro .cap{position:absolute;left:50%;bottom:calc(min(9vh,56px) + 18px);transform:translateX(-50%);padding:8px 18px;border-radius:999px;background:rgba(10,12,16,.78);border:1.5px solid rgba(255,210,63,.7);font-size:clamp(12px,2.8vw,16px);font-weight:800;letter-spacing:.08em;text-align:center;max-width:88vw;color:#ffd23f;}
#gta-intro .skip{position:absolute;right:calc(env(safe-area-inset-right) + 18px);top:calc(env(safe-area-inset-top) + min(9vh,56px) + 14px);min-width:112px;min-height:44px;padding:0 16px;border-radius:999px;border:2px solid rgba(255,255,255,.75);background:rgba(16,18,24,.82);color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;pointer-events:auto;touch-action:manipulation;}
`;

export function createIntroTour(
  ui: HTMLElement,
  hooks: { setUiVisible(v: boolean): void; onDone(): void; spawn?: { x: number; z: number; yaw: number } },
): {
  readonly active: boolean;
  startIfFirstTime(params: URLSearchParams): void;
  update(dt: number, camera: THREE.PerspectiveCamera, target: { x: number; y: number; z: number; yaw: number }): void;
  skip(): void;
} {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-intro';
  root.innerHTML = '<div class="bar top"></div><div class="bar bot"></div><div class="cap"></div><button type="button" class="skip">Skip Intro ▶▶</button>';
  ui.appendChild(root);

  const cap = root.querySelector('.cap') as HTMLElement;
  const skipBtn = root.querySelector('.skip') as HTMLButtonElement;

  let isActive = false;
  let clock = 0;
  let savedFov = 62;
  let fovCaptured = false;
  let tl: Timeline | null = null;
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const env = { ground: heightAt };

  function finish(): void {
    if (!isActive) return;
    isActive = false;
    tl = null;
    root.classList.remove('on');
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    hooks.setUiVisible(true);
    hooks.onDone();
  }

  skipBtn.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
  window.addEventListener('keydown', (e) => {
    if (isActive && (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      finish();
    }
  });

  return {
    get active() { return isActive; },

    startIfFirstTime(params: URLSearchParams) {
      if (params.has('mount') || params.has('herd') || params.has('pileup') || params.has('no-intro')
        || params.has('cutscene') || params.has('cutscenecheck')) return;
      try {
        if (localStorage.getItem(SEEN_KEY) === '1') return;
      } catch {
        return;
      }
      if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
      tl = compile(introScript(hooks.spawn ?? SPAWN));
      isActive = true;
      clock = 0;
      fovCaptured = false;
      root.classList.add('on');
      hooks.setUiVisible(false);
    },

    update(dt, camera, _target) {
      if (!isActive || !tl) return;
      if (!fovCaptured) {
        savedFov = camera.fov;
        fovCaptured = true;
      }
      clock += dt;
      if (clock >= tl.duration) {
        camera.fov = savedFov;
        camera.updateProjectionMatrix();
        finish();
        return;
      }
      const frame = sampleFrame(tl, clock, env);
      pos.set(frame.camera.pos[0], frame.camera.pos[1], frame.camera.pos[2]);
      look.set(frame.camera.look[0], frame.camera.look[1], frame.camera.look[2]);
      cap.textContent = frame.caption ?? '';
      camera.fov = frame.camera.fov;
      camera.updateProjectionMatrix();
      camera.position.copy(pos);
      camera.lookAt(look);
    },

    skip() {
      finish();
    },
  };
}
