// Gnomey Bird (L94): a small flap-through-the-gaps game on the Gnomlet. Rules live in gnomeyBirdSim.ts.
import { getMyGnome } from '@lawn/gnome';
import { registerGnomletApp } from '../registry';
import { KEYS } from '../../keys';
import { notifySaveChanged } from '../../saveHook';
import { GB, newGame, flap, step, type GbState } from './gnomeyBirdSim';

export interface GnomeyBirdDeps {
  /** Unlocks an achievement (app.ts passes the game's tracker). */
  unlock(id: string): void;
}

const SAVE_KEY = 'gta-gnomeybird-v1';
let best = readBest();

function readBest(): number {
  try {
    const n = Number((JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as { best?: number }).best);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch { return 0; }
}

function writeBest(n: number): void {
  best = n;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ best: n })); } catch { /* storage blocked */ }
  notifySaveChanged();
}

const css = (n: number): string => '#' + (n & 0xffffff).toString(16).padStart(6, '0');

interface Puff { x: number; y: number; age: number }

/** Registers the Gnomey Bird app on the Gnomlet (app.ts calls this once, right after createGnomlet). */
export function registerGnomeyBird(deps: GnomeyBirdDeps): void {
  registerGnomletApp({
    id: 'gnomey-bird',
    label: 'Gnomey Bird',
    icon: '🐦',
    group: 'fun',
    order: 30,
    detail: () => (best ? `Best ${best}` : 'Flap through the hedges'),
    open: (root) => {
      best = readBest();
      const look = getMyGnome()?.look;
      const hat = look ? css(look.hat) : '#d93636';
      const coat = look ? css(look.shirt) : '#2f64c9';
      const skin = look ? css(look.skin) : '#f1c27d';
      const beard = look ? css(look.beard ?? 0xf4f4f4) : '#f4f4f4';

      root.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px;box-sizing:border-box;';
      const info = document.createElement('div');
      info.style.cssText = 'font:600 15px system-ui,sans-serif;color:#fff;';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'border-radius:12px;display:block;';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Flap';
      btn.setAttribute('data-gnl-touch', 'none');
      btn.style.cssText =
        'min-height:56px;width:min(100%,320px);font:700 20px system-ui,sans-serif;border-radius:14px;border:0;background:#3c8b4a;color:#fff;cursor:pointer;';
      root.append(btn, info, canvas);
      // Flap is the first focusable element so pad A and Enter click it; the layout puts it under the canvas.
      btn.style.order = '3';
      info.style.order = '1';
      canvas.style.order = '2';
      const ctx = canvas.getContext('2d')!;

      let s: GbState = newGame((Math.random() * 1e9) | 0);
      let overAt = 0;
      let unlocked = false;
      let lastPointer = -1e9;
      const puffs: Puff[] = [];
      let raf = 0;
      let prev = 0;
      let scale = 1;
      let cw = 0;

      const doFlap = (): void => {
        if (s.over) {
          if (performance.now() - overAt < 600) return;
          s = newGame((Math.random() * 1e9) | 0);
          unlocked = false;
        }
        flap(s);
        puffs.push({ x: GB.gnomeX - 10, y: s.y + 14, age: 0 });
      };
      const onPointer = (e: Event): void => {
        e.preventDefault();
        lastPointer = performance.now();
        doFlap();
      };
      const onClick = (): void => {
        if (performance.now() - lastPointer < 400) return;
        doFlap();
      };
      const onKey = (e: KeyboardEvent): void => {
        if (e.code !== KEYS.jump) return;
        e.preventDefault();
        if (!e.repeat) doFlap();
      };
      canvas.addEventListener('pointerdown', onPointer);
      btn.addEventListener('pointerdown', onPointer);
      btn.addEventListener('click', onClick);
      window.addEventListener('keydown', onKey);

      const fit = (): void => {
        const w = root.clientWidth - 16;
        // The root is as tall as its content, so size against the screen that holds it.
        const h = (root.parentElement?.clientHeight || root.clientHeight) - 16 - 56 - 24 - 16;
        if (w <= 0) return;
        const wCss = Math.max(160, Math.min(w, h > 0 ? h * (GB.width / GB.height) : w, GB.width * 1.6));
        const hCss = wCss * (GB.height / GB.width);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (Math.abs(wCss - cw) < 0.5 && canvas.width === Math.round(wCss * dpr)) return;
        cw = wCss;
        canvas.style.width = wCss + 'px';
        canvas.style.height = hCss + 'px';
        canvas.width = Math.round(wCss * dpr);
        canvas.height = Math.round(hCss * dpr);
        scale = canvas.width / GB.width;
      };

      const hedge = (x: number, y: number, w: number, h: number, seed: number): void => {
        ctx.fillStyle = '#1f5a2b';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();
        ctx.fillStyle = '#3f8f45';
        for (let i = 0; i < 9; i++) {
          const px = x + 6 + ((i * 37 + seed * 11) % Math.max(1, w - 12));
          const py = y + 6 + ((i * 53 + seed * 7) % Math.max(1, h - 12));
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, 7);
          ctx.fill();
        }
        if (h > 40) {
          ctx.fillStyle = '#b4472f';
          ctx.beginPath();
          ctx.arc(x + 14 + (seed % 3) * 12, y + h * 0.4, 3.5, 0, 7);
          ctx.fill();
        }
      };

      const draw = (): void => {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        const sky = ctx.createLinearGradient(0, 0, 0, GB.height);
        sky.addColorStop(0, '#3a3a7a');
        sky.addColorStop(0.6, '#c0668a');
        sky.addColorStop(1, '#f0a868');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, GB.width, GB.height);
        const top = GB.height - GB.groundH;
        for (const g of s.gaps) {
          const x = g.x - GB.hedgeW / 2;
          const seed = Math.round(g.gapY);
          hedge(x, -10, GB.hedgeW, g.gapY - GB.gapH / 2 + 10, seed);
          hedge(x, g.gapY + GB.gapH / 2, GB.hedgeW, top - (g.gapY + GB.gapH / 2) + 10, seed + 3);
        }
        // Lawn strip, scrolling stripes.
        ctx.fillStyle = '#4c9a3c';
        ctx.fillRect(0, top, GB.width, GB.groundH);
        ctx.fillStyle = '#5eb04a';
        const off = s.t * GB.speed;
        for (let x = -((off % 40) + 40); x < GB.width; x += 40) ctx.fillRect(x, top, 20, GB.groundH);
        ctx.fillStyle = '#2f6e2c';
        ctx.fillRect(0, top, GB.width, 4);
        // Flap puffs.
        for (const p of puffs) {
          ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.8 - p.age * 2)})`;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(p.x - p.age * 40 - i * 6, p.y + i * 3 + p.age * 20, 4 - i, 0, 7);
            ctx.fill();
          }
        }
        // The gnome.
        const tilt = Math.max(-0.5, Math.min(0.8, s.vy / 700));
        ctx.save();
        ctx.translate(GB.gnomeX, s.y);
        ctx.rotate(tilt);
        const r = GB.gnomeR;
        ctx.fillStyle = hat;
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.5);
        ctx.lineTo(r * 0.2, -r * 2.5);
        ctx.lineTo(r * 0.95, -r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.arc(0, r * 0.2, r, 0, 7);
        ctx.fill();
        ctx.fillStyle = beard;
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.lineTo(r * 0.7, 0);
        ctx.lineTo(0, r * 1.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(r * 0.1, -r * 0.15, r * 0.4, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.25, 1.6, 0, 7);
        ctx.fill();
        ctx.restore();
        // Score.
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.font = '800 44px system-ui,sans-serif';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1a1a2a';
        ctx.strokeText(String(s.score), GB.width / 2, 70);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(s.score), GB.width / 2, 70);
        if (!s.started || s.over) {
          ctx.font = '700 20px system-ui,sans-serif';
          ctx.lineWidth = 5;
          const msg = s.over ? 'Tap to try again' : 'Tap to flap';
          ctx.strokeText(msg, GB.width / 2, GB.height / 2 + 60);
          ctx.fillText(msg, GB.width / 2, GB.height / 2 + 60);
        }
      };

      const frame = (now: number): void => {
        raf = requestAnimationFrame(frame);
        const dt = prev ? (now - prev) / 1000 : 0;
        prev = now;
        fit();
        if (cw <= 0) return;
        const wasOver = s.over;
        step(s, dt);
        for (const p of puffs) p.age += dt;
        while (puffs.length && puffs[0].age > 0.4) puffs.shift();
        if (!unlocked && s.score >= 10) {
          unlocked = true;
          deps.unlock('gta-flappy-gnome');
        }
        if (s.over && !wasOver) {
          overAt = performance.now();
          if (s.score > best) writeBest(s.score);
        }
        info.textContent = `Best: ${best}`;
        draw();
      };
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onPointer);
        btn.removeEventListener('pointerdown', onPointer);
        btn.removeEventListener('click', onClick);
        window.removeEventListener('keydown', onKey);
        root.style.cssText = '';
      };
    },
  });
}
