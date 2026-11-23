// Build-mode panel, a child of #ui. DOM only: it shows a BuildUiState and calls the handlers.
// Every control is a 44 px+ touch target; the root ignores pointers so the touch controls and look-drag still work.
import type { PieceKind } from './types';
import { BASE_DOM } from './config';
import { prefabIconElement } from '@lawn/prefabs';

export interface BuildUiState {
  mode: 'off' | 'claim' | 'build';
  canBuild: boolean;
  claim: { ok: boolean; why: string | null } | null;
  pieces: { kind: PieceKind; name: string; prefab: string; cost: string; affordable: boolean }[];
  selected: PieceKind | null;
  target: { name: string; hp: number; maxHp: number; repair: string | null; canRepair: boolean; canDismantle: boolean; action: { label: string; enabled: boolean } | null } | null;
  status: string | null;
  baseHp: { hp: number; maxHp: number } | null;
}
export interface BuildUiHandlers { toggle(): void; select(kind: PieceKind): void; place(): void; repair(): void; dismantle(): void; targetAction(): void; claim(): void; abandon(): void; exit(): void }
export interface BuildUi { root: HTMLElement; update(s: BuildUiState): void; setVisible(on: boolean): void }

const CSS = `
#${BASE_DOM.build} { position: absolute; inset: 0; pointer-events: none; z-index: 21; font: 12px/1.2 system-ui, sans-serif; color: #fff; }
#${BASE_DOM.build} button { font: inherit; color: #fff; box-sizing: border-box; touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
#${BASE_DOM.build} button:disabled { opacity: .45; }
#${BASE_DOM.build} .dbu-anchor { position: absolute; right: calc(env(safe-area-inset-right, 0px) + 12px); bottom: calc(env(safe-area-inset-bottom, 0px) + 276px); }
#${BASE_DOM.build} .dbu-build { width: 64px; height: 64px; border-radius: 50%; pointer-events: auto; font: 700 13px/1 system-ui, sans-serif; background: rgba(20,28,20,.75); border: 2px solid rgba(255,255,255,.6); }
/* Portrait: right of the move stick zone (left 45%), above the prompt and busy bar (bottom 276 / 340), 2 per row. */
#${BASE_DOM.build} .dbu-actions { position: absolute; left: calc(45% + 8px); right: calc(env(safe-area-inset-right, 0px) + 12px); bottom: calc(env(safe-area-inset-bottom, 0px) + 392px); display: flex; flex-direction: row; flex-wrap: wrap; justify-content: flex-end; align-items: flex-end; gap: 8px; pointer-events: auto; }
#${BASE_DOM.build} .dbu-act { min-width: 56px; height: 56px; padding: 0 8px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font: 700 12px/1.1 system-ui, sans-serif; text-align: center; background: rgba(20,28,20,.75); border: 2px solid rgba(255,255,255,.55); }
#${BASE_DOM.build} .dbu-act:active:not(:disabled) { filter: brightness(1.3); }
#${BASE_DOM.build} .dbu-act.dbu-place { min-width: 64px; height: 64px; background: rgba(255,213,79,.92); color: #222; border-color: #fff3c4; }
#${BASE_DOM.build} .dbu-key { font: 600 11px/1 system-ui, sans-serif; opacity: .9; }
#${BASE_DOM.build} .dbu-strip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 72px); left: calc(env(safe-area-inset-left, 0px) + 12px); right: calc(env(safe-area-inset-right, 0px) + 72px); display: flex; flex-direction: row; gap: 6px; overflow-x: auto; overflow-y: hidden; touch-action: pan-x; pointer-events: auto; scrollbar-width: none; padding-bottom: 2px; }
#${BASE_DOM.build} .dbu-strip::-webkit-scrollbar { display: none; }
#${BASE_DOM.build} .dbu-card { position: relative; flex: 0 0 72px; width: 72px; height: 80px; padding: 4px 2px; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; overflow: hidden; background: rgba(20,28,20,.78); border: 2px solid rgba(255,255,255,.35); }
#${BASE_DOM.build} .dbu-card.dbu-sel { border-color: #ffd54f; box-shadow: 0 0 10px 2px rgba(255,213,79,.6); }
#${BASE_DOM.build} .dbu-card.dbu-poor { opacity: .5; }
#${BASE_DOM.build} .dbu-card .dbu-idx { position: absolute; top: 1px; left: 4px; font: 700 11px/1 system-ui, sans-serif; opacity: .9; }
#${BASE_DOM.build} .dbu-card .dbu-name { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 700 11px/1.1 system-ui, sans-serif; }
#${BASE_DOM.build} .dbu-card .dbu-cost { font: 11px/1.2 system-ui, sans-serif; text-align: center; opacity: .85; }
#${BASE_DOM.build} .dbu-card.dbu-abandon { justify-content: center; font: 700 11px/1.1 system-ui, sans-serif; background: rgba(90,30,30,.8); }
#${BASE_DOM.build} .dbu-status { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 152px); left: calc(env(safe-area-inset-left, 0px) + 12px); max-width: 60%; padding: 8px 10px; border-radius: 10px; background: rgba(20,28,20,.72); pointer-events: none; }
#${BASE_DOM.build} .dbu-status-line { font-size: 12px; }
#${BASE_DOM.build} .dbu-status-line + .dbu-status-line { margin-top: 4px; }
#${BASE_DOM.build} .dbu-hp { height: 6px; margin-top: 6px; border-radius: 3px; background: rgba(255,255,255,.2); overflow: hidden; }
#${BASE_DOM.build} .dbu-hp > i { display: block; height: 100%; background: #7bd389; }
#${BASE_DOM.build} .dbu-claim { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 152px); left: calc(env(safe-area-inset-left, 0px) + 12px); right: calc(env(safe-area-inset-right, 0px) + 12px); margin: 0 auto; max-width: 320px; padding: 14px; box-sizing: border-box; border-radius: 14px; background: rgba(20,28,20,.92); pointer-events: auto; }
#${BASE_DOM.build} .dbu-claim-title { font: 700 16px/1.2 system-ui, sans-serif; }
#${BASE_DOM.build} .dbu-claim-why { margin-top: 6px; font-size: 13px; opacity: .9; }
#${BASE_DOM.build} .dbu-row { display: flex; gap: 8px; margin-top: 12px; }
#${BASE_DOM.build} .dbu-row > .dbu-act { flex: 1 1 0; }
@media (max-height: 500px) {
  #${BASE_DOM.build} .dbu-anchor { right: calc(env(safe-area-inset-right, 0px) + 236px); bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); }
  #${BASE_DOM.build} .dbu-strip { right: calc(env(safe-area-inset-right, 0px) + 236px); }
  /* Landscape: a 2-row grid between the stick zone (left 45%) and the touch block (right 236 px), bottom 12 px, under the context prompt (120 px). */
  #${BASE_DOM.build} .dbu-actions { left: calc(45% + 4px); right: calc(env(safe-area-inset-right, 0px) + 236px); bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); gap: 6px; }
  #${BASE_DOM.build} .dbu-act { width: 50px; min-width: 50px; height: 48px; padding: 0 2px; border-width: 1px; font-size: 11px; overflow-wrap: anywhere; }
  #${BASE_DOM.build} .dbu-act.dbu-place { width: 50px; min-width: 50px; height: 48px; }
}
`;

function injectStyle(): void {
  if (document.getElementById('dayg-build-style')) return;
  const style = document.createElement('style');
  style.id = 'dayg-build-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function actBtn(label: string, hint: string | null, onClick: () => void, disabled: boolean, cls = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `dbu-act ${cls}`.trim();
  b.append(label);
  if (hint) b.append(el('span', 'dbu-key', hint));
  b.setAttribute('aria-label', label);
  b.disabled = disabled;
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  b.addEventListener('click', onClick);
  return b;
}

export function createBuildUi(ui: HTMLElement, h: BuildUiHandlers): BuildUi {
  injectStyle();
  const root = document.createElement('div');
  root.id = BASE_DOM.build;
  root.hidden = true;
  root.style.display = 'none';

  const buildBtn = document.createElement('button');
  buildBtn.type = 'button';
  buildBtn.className = 'dbu-build dbu-anchor';
  buildBtn.textContent = 'BUILD';
  buildBtn.setAttribute('aria-label', 'Build');
  buildBtn.style.display = 'none';
  buildBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  buildBtn.addEventListener('click', () => h.toggle());

  const strip = el('div', 'dbu-strip');
  const actions = el('div', 'dbu-actions dbu-anchor');
  const status = el('div', 'dbu-status');
  const claimEl = el('div', 'dbu-claim');
  root.append(buildBtn, strip, actions, status, claimEl);
  ui.appendChild(root);

  // Each section re-renders only when its own key changes.
  const last: Record<'strip' | 'actions' | 'status' | 'claim', string> = { strip: '', actions: '', status: '', claim: '' };
  const section = (name: keyof typeof last, value: unknown, draw: () => void): void => {
    const k = JSON.stringify(value);
    if (k === last[name]) return;
    last[name] = k;
    draw();
  };

  const renderStrip = (s: BuildUiState): void => {
    strip.replaceChildren();
    if (s.mode !== 'build') return;
    s.pieces.forEach((p, i) => {
      const cls = `dbu-card${s.selected === p.kind ? ' dbu-sel' : ''}${p.affordable ? '' : ' dbu-poor'}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.title = `${p.name}: ${p.cost}`;
      b.setAttribute('aria-label', `${p.name}, ${p.cost}`);
      b.append(
        el('span', 'dbu-idx', String(i + 1)),
        prefabIconElement(p.prefab, '▦', 24),
        el('span', 'dbu-name', p.name),
        el('span', 'dbu-cost', p.cost),
      );
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', () => h.select(p.kind));
      strip.appendChild(b);
    });
    const ab = document.createElement('button');
    ab.type = 'button';
    ab.className = 'dbu-card dbu-abandon';
    ab.textContent = 'ABANDON';
    ab.setAttribute('aria-label', 'Abandon base');
    ab.addEventListener('pointerdown', (e) => e.stopPropagation());
    ab.addEventListener('click', () => h.abandon());
    strip.appendChild(ab);
  };

  const renderActions = (s: BuildUiState): void => {
    actions.replaceChildren();
    if (s.mode !== 'build') return;
    const t = s.target;
    actions.append(
      actBtn('EXIT', 'Esc', () => h.exit(), false),
      actBtn('TAKE DOWN', 'X', () => h.dismantle(), !t?.canDismantle),
      actBtn('REPAIR', 'G', () => h.repair(), !t?.canRepair),
    );
    if (t?.action) actions.append(actBtn(t.action.label, null, () => h.targetAction(), !t.action.enabled));
    actions.append(actBtn('PLACE', 'F', () => h.place(), false, 'dbu-place'));
  };

  const renderStatus = (s: BuildUiState): void => {
    status.replaceChildren();
    if (s.mode !== 'build') return;
    if (s.status) status.append(el('div', 'dbu-status-line', s.status));
    if (s.target) {
      const t = s.target;
      const line = `${t.name} ${t.hp}/${t.maxHp}${t.repair ? `, repair: ${t.repair}` : ''}`;
      status.append(el('div', 'dbu-status-line', line));
    }
    if (s.baseHp) {
      const bar = el('div', 'dbu-hp');
      const fill = document.createElement('i');
      const pct = s.baseHp.maxHp > 0 ? Math.max(0, Math.min(1, s.baseHp.hp / s.baseHp.maxHp)) : 0;
      fill.style.width = `${(pct * 100).toFixed(1)}%`;
      bar.append(fill);
      bar.setAttribute('role', 'meter');
      bar.setAttribute('aria-label', 'Base HP');
      bar.setAttribute('aria-valuenow', String(s.baseHp.hp));
      bar.setAttribute('aria-valuemax', String(s.baseHp.maxHp));
      status.append(bar);
    }
  };

  const renderClaim = (s: BuildUiState): void => {
    claimEl.replaceChildren();
    if (s.mode !== 'claim') return;
    const c = s.claim;
    claimEl.append(el('div', 'dbu-claim-title', 'Claim this plot?'));
    if (c && !c.ok && c.why) claimEl.append(el('div', 'dbu-claim-why', c.why));
    const row = el('div', 'dbu-row');
    row.append(
      actBtn('CLAIM', null, () => h.claim(), !c?.ok),
      actBtn('EXIT', null, () => h.exit(), false),
    );
    claimEl.append(row);
  };

  return {
    root,
    update(s: BuildUiState): void {
      buildBtn.style.display = s.mode === 'off' && s.canBuild ? '' : 'none';
      const building = s.mode === 'build';
      strip.style.display = building ? '' : 'none';
      actions.style.display = building ? '' : 'none';
      status.style.display = building && (s.status || s.target || s.baseHp) ? '' : 'none';
      claimEl.style.display = s.mode === 'claim' ? '' : 'none';
      section('strip', [s.mode, s.pieces, s.selected], () => renderStrip(s));
      section('actions', [s.mode, s.target], () => renderActions(s));
      section('status', [s.mode, s.status, s.target, s.baseHp], () => renderStatus(s));
      section('claim', [s.mode, s.claim], () => renderClaim(s));
    },
    setVisible(on: boolean): void {
      root.hidden = !on;
      root.style.display = on ? '' : 'none';
    },
  };
}
