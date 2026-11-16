// playMinigame: a game plays its own slice alone (games/<game>/#minigame), against 3 CPUs, no party, no server.
import * as THREE from 'three';
import { createPad, type Pad } from './pad';
import { type Runner, startMinigame } from './runner';
import { defaultSeats } from './seats';
import { formatStat, type MinigameReport } from './report';
import type { AnyMinigame, SeatInfo } from './types';

export interface PlayOpts {
  canvas: HTMLCanvasElement;
  /** The game's #ui element: append your own div to it, never restyle it. */
  ui: HTMLElement;
  /** Default: defaultSeats() (me + 3 CPUs). */
  seats?: SeatInfo[];
  /** Default true: after the result card, play again with a new seed. */
  loop?: boolean;
  onDone?(places: number[], report: MinigameReport): void;
}

const RESULT_S = 3;
const MAX_DT = 0.1;
const ORDINALS = ['1st', '2nd', '3rd', '4th'];

function isTextField(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}

export function playMinigame(def: AnyMinigame, o: PlayOpts): { stop(): void } {
  const seats = o.seats ?? defaultSeats();
  const loop = o.loop ?? true;

  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
  const pad: Pad = createPad(o.canvas);

  // Our own div inside the game's #ui; the runner's overlay goes inside it.
  const mount = document.createElement('div');
  mount.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  o.ui.appendChild(mount);

  let scene = new THREE.Scene();
  let runner: Runner | null = null;
  let card: HTMLElement | null = null;
  let resultTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let raf = 0;
  let last = performance.now();

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  // Phones: a touch must not scroll or zoom the page (inputs excepted).
  const cancelTouch = (e: Event) => {
    if (!isTextField(e.target)) e.preventDefault();
  };

  function showResult(report: MinigameReport): void {
    card?.remove();
    card = document.createElement('div');
    card.style.cssText =
      'position:absolute;left:0;right:0;top:18%;text-align:center;font:800 min(7vw,40px) system-ui;color:#fff;text-shadow:0 2px 6px #000;pointer-events:none';
    const head = document.createElement('div');
    head.textContent = report.headline;
    head.style.cssText = 'color:#ffd54f;margin-bottom:8px';
    card.appendChild(head);
    if (report.win.how) {
      const how = document.createElement('div');
      how.textContent = report.win.how;
      how.style.cssText = 'font-size:min(4.5vw,22px);font-weight:600;margin-bottom:10px';
      card.appendChild(how);
    }
    const main = report.stats[0];
    for (const row of report.rows) {
      const line = document.createElement('div');
      const score = main ? `  ${formatStat(main, row.values[main.key])}` : '';
      line.textContent = `${ORDINALS[row.place] ?? `${row.place + 1}th`} ${row.name}${score}`;
      line.style.color = `#${row.color.toString(16).padStart(6, '0')}`;
      card.appendChild(line);
    }
    mount.appendChild(card);
  }

  function startRound(): void {
    if (stopped) return;
    scene = new THREE.Scene();
    runner = startMinigame({
      def,
      scene,
      camera,
      renderer,
      uiParent: mount,
      seats,
      mySeat: 0,
      isHost: true,
      seed: Date.now() & 0x7fffffff,
      pad: () => pad.read(),
      sendSnapshot: null,
      sendInput: null,
      onDone(places, report) {
        o.onDone?.(places, report);
        showResult(report);
        // Dispose outside the runner's own update call: the round ends after the result card.
        resultTimer = setTimeout(() => {
          resultTimer = null;
          if (!loop || stopped) return;
          card?.remove();
          card = null;
          runner?.dispose();
          runner = null;
          startRound();
        }, RESULT_S * 1000);
      },
    });
  }

  function frame(): void {
    if (stopped) return;
    const now = performance.now();
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    runner?.update(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('touchstart', cancelTouch, { passive: false });
  window.addEventListener('touchend', cancelTouch, { passive: false });
  startRound();
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      if (resultTimer !== null) clearTimeout(resultTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('touchstart', cancelTouch);
      window.removeEventListener('touchend', cancelTouch);
      runner?.dispose();
      runner = null;
      card?.remove();
      card = null;
      pad.dispose();
      renderer.dispose();
      mount.remove();
    },
  };
}
