// E24 comedy: the captions overlay and the Double Down button. DOM only, appended to #ui. The root ignores pointers and
// only the buttons take them, so the 3D stage behind keeps its own input.
import type { CrowdReaction, StageUi, StageUiOpts } from './types';

const ROOT_ID = 'gta-stage-ui';
const STYLE_ID = 'gta-stage-ui-css';
const CSS = `
#gta-stage-ui{position:fixed;inset:0;z-index:38;pointer-events:none;font-family:system-ui,sans-serif;color:#fff;overflow:hidden;}
#gta-stage-ui button{pointer-events:auto;touch-action:manipulation;cursor:pointer;font-family:system-ui,sans-serif;}
#gta-stage-ui button:focus-visible{outline:3px solid #7cf0ff;outline-offset:2px;}
#gta-stage-ui .su-top{position:absolute;top:calc(env(safe-area-inset-top) + 8px);left:calc(env(safe-area-inset-left) + 10px);right:calc(env(safe-area-inset-right) + 10px);display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
#gta-stage-ui .su-head{flex:1 1 180px;min-width:0;font-size:12px;font-weight:700;letter-spacing:.3px;text-shadow:0 1px 3px rgba(0,0,0,.85);}
#gta-stage-ui .su-meter{flex:0 1 200px;min-width:150px;display:flex;align-items:center;gap:6px;}
#gta-stage-ui .su-meter.su-hot{animation:su-wobble .35s ease-in-out infinite alternate;}
#gta-stage-ui .su-meter-label{font-size:11px;font-weight:800;letter-spacing:1px;text-shadow:0 1px 3px rgba(0,0,0,.85);}
#gta-stage-ui .su-meter-bar{flex:1;height:10px;border-radius:5px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.35);overflow:hidden;}
#gta-stage-ui .su-meter-fill{height:100%;width:0;background:hsl(120 80% 50%);transition:width .3s ease,background .3s ease;}
#gta-stage-ui .su-walk{margin-left:auto;min-width:44px;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(27,31,36,.92);color:#fff;font:700 14px system-ui,sans-serif;}
#gta-stage-ui .su-heckles{position:absolute;top:calc(env(safe-area-inset-top) + 100px);left:calc(env(safe-area-inset-left) + 8px);right:calc(env(safe-area-inset-right) + 8px);display:flex;flex-direction:column;gap:8px;}
#gta-stage-ui .su-heckle{max-width:min(260px,70vw);box-sizing:border-box;padding:8px 12px;border-radius:14px;background:#fff;color:#1b1f24;font-size:14px;line-height:1.3;box-shadow:0 4px 12px rgba(0,0,0,.35);transition:opacity .4s ease;}
#gta-stage-ui .su-heckle b{font-weight:800;color:#b3261e;}
#gta-stage-ui .su-heckle.su-from-left{align-self:flex-start;animation:su-in-left .3s ease-out;}
#gta-stage-ui .su-heckle.su-from-right{align-self:flex-end;animation:su-in-right .3s ease-out;}
#gta-stage-ui .su-heckle.su-out{opacity:0;}
#gta-stage-ui .su-react{position:absolute;left:0;right:0;top:46%;text-align:center;font-style:italic;font-size:18px;font-weight:600;text-shadow:0 2px 4px rgba(0,0,0,.9);padding:0 16px;animation:su-fade .2s ease-out;}
#gta-stage-ui .su-splat{position:absolute;top:22%;width:132px;height:132px;margin-left:-66px;pointer-events:none;transform-origin:50% 50%;animation:su-splat 1.5s ease-in forwards;}
#gta-stage-ui .su-bottom{position:absolute;left:calc(env(safe-area-inset-left) + 10px);right:calc(env(safe-area-inset-right) + 10px);bottom:calc(env(safe-area-inset-bottom) + 10px);display:flex;flex-direction:column;align-items:center;gap:8px;}
#gta-stage-ui .su-sub{box-sizing:border-box;width:min(560px,92vw);max-width:100%;padding:10px 14px;border-radius:14px;background:rgba(20,22,26,.9);border:2px solid rgba(255,255,255,.25);font-size:16px;line-height:1.35;box-shadow:0 6px 18px rgba(0,0,0,.4);}
#gta-stage-ui .su-speaker{display:block;font-variant:small-caps;font-weight:800;letter-spacing:.6px;font-size:13px;color:#ffd23f;margin-bottom:2px;}
#gta-stage-ui .su-text{min-height:1.35em;overflow-wrap:anywhere;}
#gta-stage-ui .su-row{box-sizing:border-box;width:min(560px,92vw);display:flex;justify-content:flex-end;}
#gta-stage-ui .su-dd{min-height:56px;padding:0 18px;border-radius:16px;border:2px solid #fff;background:#ff5a3c;color:#fff;font:800 17px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4);}
#gta-stage-ui .su-dd:disabled{background:#4a4f57;color:rgba(255,255,255,.55);border-color:rgba(255,255,255,.2);cursor:not-allowed;box-shadow:none;}
#gta-stage-ui .su-dd.su-dd-on{animation:su-pulse 1.1s ease-in-out infinite;}
@keyframes su-wobble{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}
@keyframes su-in-left{from{transform:translateX(-120%);opacity:0}to{transform:none;opacity:1}}
@keyframes su-in-right{from{transform:translateX(120%);opacity:0}to{transform:none;opacity:1}}
@keyframes su-fade{from{opacity:0}to{opacity:1}}
@keyframes su-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes su-splat{0%{transform:translateY(0) rotate(var(--rot,0deg));opacity:1}70%{opacity:.85}100%{transform:translateY(60px) rotate(var(--rot,0deg));opacity:0}}
`;

// The words of each stage direction (the caption wraps them in italics).
const REACTION_WORDS: Record<CrowdReaction, string> = {
  silence: 'silence',
  cricket: 'a cricket, somewhere',
  cough: 'one cough',
  groan: 'a long groan',
  sigh: 'the room sighs',
  boo: 'booing',
  heckle: 'a voice from the dark',
  tomato: 'a tomato',
  walkout: 'a chair scrapes. Someone leaves.',
  'pity-clap': 'one person claps. Then stops.',
};

const NOOP: StageUi = {
  line() {}, heckle() {}, reaction() {}, meter() {}, setDoubleDown() {}, splat() {}, close() {},
};

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

export function openStageUi(ui: HTMLElement, opts: StageUiOpts): StageUi {
  if (typeof document === 'undefined') return NOOP;

  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.getElementById(ROOT_ID)?.remove();

  const h = (tag: string, cls = '', text = ''): HTMLElement => {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text) d.textContent = text;
    return d;
  };
  const btn = (cls: string, text: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    return b;
  };

  let closed = false;
  const timers = new Set<number>();
  const unbind: Array<() => void> = [];
  const later = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };

  const root = h('div');
  root.id = ROOT_ID;

  // Top: the title, the cringe meter and Walk off.
  const top = h('div', 'su-top');
  const head = h('div', 'su-head', `Tonight at Le Petit Groan: ${opts.title}`);
  const meterWrap = h('div', 'su-meter');
  const meterBar = h('div', 'su-meter-bar');
  const meterFill = h('div', 'su-meter-fill');
  meterBar.appendChild(meterFill);
  meterWrap.append(h('span', 'su-meter-label', 'CRINGE'), meterBar);
  const walk = btn('su-walk', 'Walk off');
  const onWalk = (): void => { if (!closed) opts.onLeave(); };
  const onWalkDown = (e: Event): void => e.stopPropagation();
  walk.addEventListener('click', onWalk);
  walk.addEventListener('pointerdown', onWalkDown);
  unbind.push(() => walk.removeEventListener('click', onWalk), () => walk.removeEventListener('pointerdown', onWalkDown));
  top.append(head, meterWrap, walk);

  // Heckle bubbles, at most two.
  const heckles = h('div', 'su-heckles');
  let side = 0;

  // Subtitle box and the Double Down button.
  const bottom = h('div', 'su-bottom');
  const sub = h('div', 'su-sub');
  sub.hidden = true;
  const speaker = h('span', 'su-speaker');
  const text = h('div', 'su-text');
  sub.append(speaker, text);
  const row = h('div', 'su-row');
  const dd = btn('su-dd', '🎤 Double down');
  dd.disabled = true;
  const onDd = (): void => { if (!closed && !dd.disabled) opts.onDoubleDown(); };
  const onDdDown = (e: Event): void => e.stopPropagation();
  dd.addEventListener('click', onDd);
  dd.addEventListener('pointerdown', onDdDown);
  unbind.push(() => dd.removeEventListener('click', onDd), () => dd.removeEventListener('pointerdown', onDdDown));
  row.appendChild(dd);
  bottom.append(sub, row);

  root.append(top, heckles, bottom);
  ui.appendChild(root);

  // Typed subtitle: the whole line lands by 70% of s.
  let typing = 0;
  const stopTyping = (): void => {
    if (typing) window.clearTimeout(typing);
    typing = 0;
  };

  let reactEl: HTMLElement | null = null;

  // Space or D fires Double Down, Escape walks off. A focused button handles Space itself, so skip it there.
  const onKey = (e: KeyboardEvent): void => {
    if (closed || e.repeat) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      onWalk();
      return;
    }
    if (e.code === 'Space' && e.target instanceof HTMLButtonElement) return;
    if ((e.code === 'Space' || e.code === 'KeyD') && !dd.disabled) {
      e.preventDefault();
      opts.onDoubleDown();
    }
  };
  window.addEventListener('keydown', onKey);

  const api: StageUi = {
    line(who, words, s) {
      if (closed) return;
      stopTyping();
      speaker.textContent = who;
      sub.hidden = false;
      text.textContent = '';
      const total = words.length;
      if (total === 0) return;
      const step = Math.max(0, (s * 700) / total);
      let i = 0;
      const tick = (): void => {
        i++;
        text.textContent = words.slice(0, i);
        typing = i < total ? window.setTimeout(tick, step) : 0;
      };
      typing = window.setTimeout(tick, step);
    },

    heckle(name, words) {
      if (closed) return;
      while (heckles.children.length >= 2) heckles.firstElementChild?.remove();
      const b = h('div', `su-heckle ${side++ % 2 ? 'su-from-right' : 'su-from-left'}`);
      b.append(h('b', '', name), document.createTextNode(` ${words}`));
      heckles.appendChild(b);
      later(() => {
        b.classList.add('su-out');
        later(() => b.remove(), 400);
      }, 2500);
    },

    reaction(kind) {
      if (closed) return;
      reactEl?.remove();
      const el = h('div', 'su-react', REACTION_WORDS[kind]);
      el.style.fontStyle = 'italic';
      root.insertBefore(el, bottom);
      reactEl = el;
      later(() => {
        if (reactEl === el) reactEl = null;
        el.remove();
      }, 1800);
    },

    meter(cringe) {
      if (closed) return;
      const v = Number.isFinite(cringe) ? Math.max(0, Math.min(100, Math.round(cringe))) : 0;
      meterFill.style.width = `${v}%`;
      meterFill.style.background = `hsl(${120 - (120 * v) / 100} 80% 50%)`;
      meterWrap.classList.toggle('su-hot', v > 80);
    },

    setDoubleDown(on) {
      if (closed) return;
      dd.disabled = !on;
      dd.classList.toggle('su-dd-on', on);
    },

    splat() {
      if (closed) return;
      const el = h('div', 'su-splat');
      el.style.left = `${rnd(33, 67)}%`;
      el.style.setProperty('--rot', `${rnd(-30, 30).toFixed(1)}deg`);
      const seeds = [0, 1, 2, 3].map(() =>
        `radial-gradient(circle at ${rnd(20, 80).toFixed(0)}% ${rnd(20, 80).toFixed(0)}%, #c8261b 0 ${rnd(6, 12).toFixed(0)}%, transparent ${rnd(13, 16).toFixed(0)}%)`);
      el.style.backgroundImage = [...seeds,
        'radial-gradient(circle at 50% 50%, #e0352a 0 34%, #9e1410 35% 42%, transparent 43%)'].join(',');
      root.insertBefore(el, bottom);
      later(() => el.remove(), 1500);
    },

    close() {
      if (closed) return;
      closed = true;
      window.removeEventListener('keydown', onKey);
      for (const undo of unbind) undo();
      unbind.length = 0;
      stopTyping();
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      reactEl = null;
      root.remove();
    },
  };
  return api;
}
