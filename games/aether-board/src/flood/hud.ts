// Flood Run's HUD (DOM): surf meter, clock, cannon / geyser warning chip, blast flash. Hidden unless riding.
// Everything is pointer-events: none. Writes to the DOM only when a value changed (this runs every frame).
import { PALETTE } from '../config';
import type { FloodStats } from './types';

export interface FloodHud {
  /** Call every frame. `riding`: the rider is in the run (hide on the title card). `clock`: seconds of Flood Run so far. */
  update(stats: FloodStats, riding: boolean, clock: number): void;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const C = {
  ink: hex(PALETTE.ink), pink: hex(PALETTE.pink), cyan: hex(PALETTE.cyan), lime: hex(PALETTE.lime),
  yellow: hex(PALETTE.yellow), red: '#ff2d4b', amber: '#ff9f1c',
};

const CSS = `
#ab-flood-hud{position:fixed;inset:0;pointer-events:none;overflow:hidden;display:none;font-family:"Arial Black",Impact,system-ui,sans-serif;color:#fff}
#ab-flood-hud.on{display:block}
#ab-flood-hud *{box-sizing:border-box;pointer-events:none}
#ab-flood-hud .fh-surf{position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:50%;transform:translateX(-50%);width:min(240px,60vw);text-align:center}
#ab-flood-hud .fh-label{display:inline-block;font-size:18px;line-height:1;font-style:italic;text-transform:uppercase;opacity:.6;color:#fff;text-shadow:2px 2px 0 ${C.ink};transform:skewX(-10deg)}
#ab-flood-hud .fh-label.lit{color:${C.cyan};opacity:1}
#ab-flood-hud .fh-bar{height:12px;margin-top:4px;background:rgba(23,7,46,.6);border:2px solid ${C.ink};transform:skewX(-10deg);overflow:hidden}
#ab-flood-hud .fh-fill{height:100%;width:0;background:linear-gradient(90deg,${C.cyan},${C.lime})}
#ab-flood-hud .fh-sub{margin-top:4px;font-family:system-ui,sans-serif;font-weight:700;font-size:14px;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
#ab-flood-hud .fh-clock{position:fixed;top:calc(env(safe-area-inset-top) + 100px);left:calc(env(safe-area-inset-left) + 16px);font-size:clamp(22px,3vw,30px);line-height:1;color:#fff;text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink}}
#ab-flood-hud .fh-warn{position:fixed;top:calc(env(safe-area-inset-top) + 86px);left:50%;transform:translateX(-50%);display:none;align-items:center;gap:8px;padding:5px 10px;font-size:16px;line-height:1;white-space:nowrap;color:#fff;background:rgba(23,7,46,.8);border:2px solid ${C.ink};box-shadow:3px 3px 0 ${C.pink}}
#ab-flood-hud .fh-warn.on{display:flex}
#ab-flood-hud .fh-warn.wind{color:${C.amber};border-color:${C.amber}}
#ab-flood-hud .fh-warn.fire{color:${C.red};border-color:${C.red};animation:fh-flash .25s steps(2,start) infinite}
#ab-flood-hud .fh-arrow{display:inline-block;font-size:20px;line-height:1}
#ab-flood-hud .fh-flash{position:fixed;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 50%,#fff 0%,#e0f7ff 35%,#7dd3fc 100%)}
@keyframes fh-flash{50%{opacity:.35}}
@media (max-width:600px){#ab-flood-hud .fh-clock{top:calc(env(safe-area-inset-top) + 92px)}}
@media (max-height:500px){#ab-flood-hud .fh-warn{top:calc(env(safe-area-inset-top) + 76px)}#ab-flood-hud .fh-clock{top:calc(env(safe-area-inset-top) + 74px)}}
`;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function createFloodHud(ui: HTMLElement): FloodHud {
  if (!document.getElementById('ab-flood-style')) {
    const style = document.createElement('style');
    style.id = 'ab-flood-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const root = document.createElement('div');
  root.id = 'ab-flood-hud';
  ui.appendChild(root);

  // Top centre: surf meter.
  const surf = document.createElement('div');
  surf.className = 'fh-surf';
  const surfLabel = document.createElement('div');
  surfLabel.className = 'fh-label';
  surfLabel.textContent = 'SURF';
  const bar = document.createElement('div');
  bar.className = 'fh-bar';
  const fill = document.createElement('div');
  fill.className = 'fh-fill';
  bar.appendChild(fill);
  const surfSub = document.createElement('div');
  surfSub.className = 'fh-sub';
  surf.append(surfLabel, bar, surfSub);
  root.appendChild(surf);

  // Top left: clock.
  const clockEl = document.createElement('div');
  clockEl.className = 'fh-clock';
  clockEl.textContent = '0:00';
  root.appendChild(clockEl);

  // Below the meter: cannon / geyser warning.
  const warn = document.createElement('div');
  warn.className = 'fh-warn';
  const arrow = document.createElement('span');
  arrow.className = 'fh-arrow';
  arrow.textContent = '↑';
  const warnTxt = document.createElement('span');
  warn.append(arrow, warnTxt);
  root.appendChild(warn);

  // Full screen blast flash (last, so it sits over everything).
  const flash = document.createElement('div');
  flash.className = 'fh-flash';
  root.appendChild(flash);

  // Last value written per property; a write happens only when the value changes.
  const memo = new Map<string, string>();
  function put(key: string, v: string, apply: () => void): void {
    if (memo.get(key) === v) return;
    memo.set(key, v);
    apply();
  }

  return {
    update(stats: FloodStats, riding: boolean, clock: number): void {
      put('on', riding ? '1' : '0', () => root.classList.toggle('on', riding));
      if (!riding) return;

      // Surf meter.
      const bonusPct = (clamp01(stats.bonus) * 100).toFixed(1);
      put('bonus', bonusPct, () => { fill.style.width = `${bonusPct}%`; });
      put('lit', stats.surfing ? '1' : '0', () => surfLabel.classList.toggle('lit', stats.surfing));
      const sub = `${stats.surfT.toFixed(1)}s  +${Math.round(stats.surfPoints)}`;
      put('sub', sub, () => { surfSub.textContent = sub; });

      // Clock as m:ss.
      const sec = Math.max(0, Math.floor(clock));
      const clk = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
      put('clock', clk, () => { clockEl.textContent = clk; });

      // Warning chip.
      const w = stats.warn;
      put('warn', w === null ? 'none' : w.fire ? 'fire' : 'wind', () => {
        warn.classList.toggle('on', w !== null);
        warn.classList.toggle('wind', w !== null && !w.fire);
        warn.classList.toggle('fire', w !== null && w.fire);
      });
      if (w) {
        const wText = `${w.kind === 'cannon' ? 'CANNON' : 'GEYSER'} ${Math.round(w.dist)} m`;
        put('warnText', wText, () => { warnTxt.textContent = wText; });
        const deg = ((-w.bearing * 180) / Math.PI).toFixed(0);
        put('warnRot', deg, () => { arrow.style.transform = `rotate(${deg}deg)`; });
      }

      // Blast flash: bright on the blast, gone 0.5 s later.
      const fo = (Math.max(0, 1 - stats.sinceBlast / 0.5) * 0.55).toFixed(3);
      put('flash', fo, () => { flash.style.opacity = fo; });
    },
  };
}
