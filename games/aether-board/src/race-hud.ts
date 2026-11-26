// The race HUD (free ride, DOM): the run clock, which run of the mountain you are on, your best, and the finish banner
// at the gate. pointer-events: none throughout; writes to the DOM only when a value changed (this runs every frame).
import { PALETTE } from './config';
import { formatTime, type RaceFinish } from './race';

export interface RaceHud {
  /** Every frame. riding: hide it on the title / pause card. run: 1-based run you are on, of runs. */
  update(riding: boolean, time: number, best: number | null, run: number, runs: number): void;
  /** The finish banner, for a few seconds. */
  finish(r: RaceFinish): void;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const C = { ink: hex(PALETTE.ink), pink: hex(PALETTE.pink), cyan: hex(PALETTE.cyan), lime: hex(PALETTE.lime), yellow: hex(PALETTE.yellow) };

const CSS = `
#ab-race{position:fixed;inset:0;pointer-events:none;overflow:hidden;display:none;font-family:"Arial Black",Impact,system-ui,sans-serif;color:#fff}
#ab-race.on{display:block}
#ab-race *{box-sizing:border-box;pointer-events:none}
#ab-race .rc-top{position:fixed;top:calc(env(safe-area-inset-top) + 10px);left:50%;transform:translateX(-50%);text-align:center;white-space:nowrap}
#ab-race .rc-clock{display:inline-block;font-size:clamp(26px,4vw,40px);line-height:1;font-style:italic;font-variant-numeric:tabular-nums;transform:skewX(-10deg);text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink}}
#ab-race .rc-sub{margin-top:6px;font-family:system-ui,sans-serif;font-weight:800;font-size:clamp(12px,1.6vw,15px);color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
#ab-race .rc-bar{width:min(220px,50vw);height:8px;margin:5px auto 0;background:rgba(23,7,46,.6);border:2px solid ${C.ink};transform:skewX(-10deg);overflow:hidden}
#ab-race .rc-fill{height:100%;width:0;background:linear-gradient(90deg,${C.cyan},${C.lime})}
#ab-race .rc-done{position:fixed;top:22%;left:50%;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;opacity:0;transition:opacity .35s}
#ab-race .rc-done.show{opacity:1}
#ab-race .rc-big{display:inline-block;font-size:clamp(34px,8vw,84px);line-height:1;font-style:italic;text-transform:uppercase;transform:skewX(-10deg);color:${C.yellow};text-shadow:4px 4px 0 ${C.ink},8px 8px 0 ${C.pink}}
#ab-race .rc-line{margin-top:8px;font-size:clamp(16px,2.6vw,26px);font-style:italic;text-shadow:3px 3px 0 ${C.ink}}
#ab-race .rc-new{color:${C.lime}}
@media (max-width:600px),(max-height:500px){#ab-race .rc-top{top:calc(env(safe-area-inset-top) + 64px);left:calc(env(safe-area-inset-left) + 16px);transform:none;text-align:left}#ab-race .rc-bar{margin:5px 0 0}}
@media (max-height:500px){#ab-race .rc-done{top:30%}#ab-race .rc-bar{display:none}}
`;

export function createRaceHud(ui: HTMLElement): RaceHud {
  if (!document.getElementById('ab-race-style')) {
    const style = document.createElement('style');
    style.id = 'ab-race-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const root = document.createElement('div');
  root.id = 'ab-race';
  root.innerHTML = `<div class="rc-top"><div class="rc-clock">0:00.00</div><div class="rc-bar"><div class="rc-fill"></div></div><div class="rc-sub"></div></div>
<div class="rc-done"><div class="rc-big">Finish!</div><div class="rc-line"></div></div>`;
  ui.appendChild(root);
  const clock = root.querySelector('.rc-clock') as HTMLElement;
  const sub = root.querySelector('.rc-sub') as HTMLElement;
  const fill = root.querySelector('.rc-fill') as HTMLElement;
  const done = root.querySelector('.rc-done') as HTMLElement;
  const line = root.querySelector('.rc-line') as HTMLElement;
  let shown = false;
  let lastClock = '';
  let lastSub = '';
  let lastFill = '';
  let hideAt = 0;

  return {
    update(riding, time, best, run, runs) {
      if (riding !== shown) {
        shown = riding;
        root.classList.toggle('on', riding);
      }
      if (!riding) return;
      const c = formatTime(time);
      if (c !== lastClock) clock.textContent = lastClock = c;
      const s = `RUN ${run}/${runs}${best !== null ? ` · BEST ${formatTime(best)}` : ''}`;
      if (s !== lastSub) sub.textContent = lastSub = s;
      const f = `${Math.round((100 * (run - 1)) / Math.max(1, runs - 1))}%`;
      if (f !== lastFill) fill.style.width = lastFill = f;
      if (hideAt && performance.now() > hideAt) {
        hideAt = 0;
        done.classList.remove('show');
      }
    },
    finish(r) {
      const diff = r.prevBest === null ? '' : ` (${r.newBest ? '−' : '+'}${Math.abs(r.time - r.prevBest).toFixed(2)})`;
      line.innerHTML = `${formatTime(r.time)}${diff}${r.newBest ? ' · <span class="rc-new">NEW BEST</span>' : ''}${r.bails === 0 ? ' · CLEAN' : ''}`;
      done.classList.add('show');
      hideAt = performance.now() + 4500;
    },
  };
}
