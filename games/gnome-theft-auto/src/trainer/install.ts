// The Save Trainer's only always-loaded part: the ways to open it. Everything else (panel, sections, their imports) is a
// lazy chunk loaded on first open, so a closed trainer costs nothing (no DOM, no per-frame work).
// Open it: F9 or ` (keys.ts), Options > Save Trainer (window event 'gta:trainer'), the floating button under ?debug, or
// ?trainer[=<tab id>] at start.
import { isTyping, KEYS } from '../keys';
import type { TrainerCtx } from './types';

type PanelModule = typeof import('./panel');
let ctxRef: TrainerCtx | null = null;
let loading: Promise<PanelModule> | null = null;

function load(): Promise<PanelModule> {
  loading ??= (async () => {
    const panel = await import('./panel');
    const sections = await import('./sections');
    sections.registerBuiltInSections();
    return panel;
  })();
  return loading;
}

/** Open (or close) the trainer, on `tab` when given. */
export async function toggleTrainer(tab?: string): Promise<void> {
  if (!ctxRef) return;
  const m = await load();
  m.toggleTrainer(ctxRef, tab);
}

/** Open the trainer on `tab` (a section id) or the last tab. */
export async function openTrainer(tab?: string): Promise<void> {
  if (!ctxRef) return;
  const m = await load();
  m.openTrainerPanel(ctxRef, tab);
}

/** app.ts calls this once, after every system it lists exists. */
export function installTrainer(ctx: TrainerCtx): void {
  ctxRef = ctx;
  window.addEventListener('gta:trainer', (e) => {
    const tab = (e as CustomEvent<{ tab?: string } | undefined>).detail?.tab;
    void toggleTrainer(tab);
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat || isTyping(e)) return;
    if (e.code === KEYS.trainer || e.code === KEYS.trainerAlt) {
      e.preventDefault();
      void toggleTrainer();
    }
  });
  const params = new URLSearchParams(location.search);
  if (params.has('debug')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'gta-trainer-fab';
    b.setAttribute('aria-label', 'Save Trainer');
    b.textContent = '🛠';
    b.style.cssText = 'position:fixed;z-index:30;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 60px);width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,210,63,.8);background:rgba(20,20,20,.55);color:#fff;font-size:20px;line-height:1;padding:0;pointer-events:auto;touch-action:manipulation;';
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', () => void toggleTrainer());
    ctx.ui.appendChild(b);
  }
  if (params.has('trainer')) {
    const tab = params.get('trainer') || undefined;
    window.setTimeout(() => void openTrainer(tab), 1500);
  }
}
