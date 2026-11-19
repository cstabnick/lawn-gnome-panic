import { DEFAULTS, FLUID_PRESETS, Params, SCENES, SLIDERS, SceneId } from './config';

export interface UiHooks {
  params: Params;
  toggles: { autoPour: boolean; shake: boolean };
  onScene(id: SceneId): void;
  onReset(): void;
  onPause(): boolean; // returns new paused state
}

export interface Ui {
  setHud(lines: string[]): void;
  setScene(id: SceneId): void;
  setCapacity(n: number): void;
}

const css = `
#wf-panel{position:absolute;left:12px;top:12px;width:290px;max-height:calc(100vh - 24px);overflow:auto;pointer-events:auto;
  background:rgba(14,22,32,.86);border:1px solid #2c4054;border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.35}
#wf-panel h1{font-size:14px;margin:0 0 6px}
#wf-panel .row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
#wf-panel button{background:#1d3248;color:#e8f1f8;border:1px solid #38546f;border-radius:5px;padding:4px 8px;font:inherit;cursor:pointer}
#wf-panel button.on{background:#0a78b3;border-color:#38bdf8}
#wf-panel button:hover{border-color:#8fd3f7}
#wf-panel .blurb{color:#9fb7ca;margin:4px 0 8px}
#wf-panel label{display:block;margin-top:7px}
#wf-panel .lh{display:flex;justify-content:space-between}
#wf-panel .note{color:#7f99ad;font-size:11px}
#wf-panel input[type=range]{width:100%;margin:2px 0}
#wf-hud{position:absolute;right:12px;top:12px;pointer-events:none;background:rgba(14,22,32,.7);border-radius:8px;padding:8px 10px;
  font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre}
#wf-help{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);color:#9fb7ca;font-size:11px;pointer-events:none}
`;

function el(tag: string, cls?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function button(text: string, fn: () => void): HTMLButtonElement {
  const b = el('button') as HTMLButtonElement;
  b.textContent = text;
  b.onclick = fn;
  return b;
}

function note(text: string): HTMLElement {
  const e = el('div', 'note');
  e.textContent = text;
  return e;
}

export function buildUi(hooks: UiHooks): Ui {
  const root = document.getElementById('ui') as HTMLElement;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const panel = el('div');
  panel.id = 'wf-panel';
  const hud = el('div');
  hud.id = 'wf-hud';
  const help = el('div');
  help.id = 'wf-help';
  help.textContent = 'drag: orbit · right-drag / shift-drag: pan · wheel: zoom · space: pause · R: reset';
  root.append(panel, hud, help);

  let scene: SceneId = 0;
  let capacity = 0;
  const sliderEls = new Map<string, { row: HTMLElement; input: HTMLInputElement; out: HTMLElement }>();

  const h1 = el('h1');
  h1.textContent = 'Water flow demo';
  const sceneRow = el('div', 'row');
  const sceneBtns: HTMLButtonElement[] = SCENES.map((s) => {
    const b = button(s.name, () => hooks.onScene(s.id));
    sceneRow.appendChild(b);
    return b;
  });
  const blurb = el('div', 'blurb');

  const fluidRow = el('div', 'row');
  for (const f of FLUID_PRESETS) {
    fluidRow.appendChild(
      button(f.name, () => {
        Object.assign(hooks.params, f.values);
        refreshSliders();
      }),
    );
  }

  const actRow = el('div', 'row');
  const pauseBtn = button('Pause (space)', () => {
    pauseBtn.classList.toggle('on', hooks.onPause());
  });
  actRow.append(button('Reset (R)', () => hooks.onReset()), pauseBtn);

  const togRow = el('div', 'row');
  const autoBtn = button('Auto pour', () => {
    hooks.toggles.autoPour = !hooks.toggles.autoPour;
    autoBtn.classList.toggle('on', hooks.toggles.autoPour);
  });
  const shakeBtn = button('Shake cup', () => {
    hooks.toggles.shake = !hooks.toggles.shake;
    shakeBtn.classList.toggle('on', hooks.toggles.shake);
  });
  togRow.append(autoBtn, shakeBtn);

  panel.append(h1, sceneRow, blurb, note('Fluid'), fluidRow, actRow, togRow);

  for (const d of SLIDERS) {
    const row = el('label');
    const lh = el('div', 'lh');
    const name = el('span');
    name.textContent = d.label;
    const out = el('span');
    lh.append(name, out);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(d.min);
    input.max = String(d.max);
    input.step = String(d.step);
    input.oninput = () => {
      hooks.params[d.key] = Number(input.value);
      show(d.key);
    };
    row.append(lh, input);
    if (d.note) row.appendChild(note(d.note));
    panel.appendChild(row);
    sliderEls.set(d.key, { row, input, out });
  }

  const dflt = el('div', 'row');
  dflt.appendChild(
    button('Defaults', () => {
      Object.assign(hooks.params, DEFAULTS);
      refreshSliders();
    }),
  );
  panel.appendChild(dflt);

  function show(key: string): void {
    const d = SLIDERS.find((s) => s.key === key)!;
    const e = sliderEls.get(key)!;
    const v = hooks.params[d.key];
    e.input.value = String(v);
    const digits = d.step < 0.001 ? 4 : d.step < 0.01 ? 3 : d.step < 1 ? 2 : 0;
    e.out.textContent = (key === 'particles' && capacity > 0 && v > capacity ? `${capacity} (cap)` : v.toFixed(digits)) + d.unit;
  }
  function refreshSliders(): void {
    const controls = SCENES[scene].controls;
    for (const d of SLIDERS) {
      show(d.key);
      sliderEls.get(d.key)!.row.style.display = !d.needs || controls.includes(d.needs) ? '' : 'none';
    }
    sceneBtns.forEach((b, i) => b.classList.toggle('on', i === scene));
    blurb.textContent = SCENES[scene].blurb;
    togRow.style.display = controls.includes('cup') ? '' : 'none';
  }
  refreshSliders();

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      pauseBtn.click();
    } else if (e.code === 'KeyR') hooks.onReset();
  });

  return {
    setHud: (lines) => {
      hud.textContent = lines.join('\n');
    },
    setScene: (id) => {
      scene = id;
      refreshSliders();
    },
    setCapacity: (n) => {
      capacity = n;
      show('particles');
    },
  };
}
