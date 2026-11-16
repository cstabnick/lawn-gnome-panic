import type { VolumeChannel, VolumeStore } from './store';

export interface VolumePanelOptions {
  /** Optional heading text above the sliders. Pass '' or omit for no heading. */
  title?: string;
  /** Optional custom class added to the panel root element. */
  className?: string;
  /** Optional CSS overrides for `--vol-accent`, `--vol-bg`, `--vol-border`, `--vol-text`. */
  theme?: Partial<Record<'accent' | 'bg' | 'border' | 'text', string>>;
}

export interface VolumePanel {
  readonly element: HTMLElement;
  destroy(): void;
}

export interface VolumeButtonOptions extends VolumePanelOptions {
  /** Optional class name for the trigger button (e.g. a game's own HUD button class). */
  buttonClassName?: string;
  /** Optional keyboard shortcut hint shown on the button if using default styling. */
  shortcutHint?: string;
}

export interface VolumeButton {
  readonly element: HTMLElement;
  readonly button: HTMLButtonElement;
  show(): void;
  hide(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const STYLE_ID = 'arcade-volume-style';

const CSS = `
.av-panel {
  --vol-accent: #ffd54f;
  --vol-bg: rgba(16, 16, 40, 0.94);
  --vol-border: rgba(255, 255, 255, 0.22);
  --vol-text: #ffffff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid var(--vol-border);
  background: var(--vol-bg);
  color: var(--vol-text);
  font-family: system-ui, -apple-system, sans-serif;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
}
.av-title {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--vol-accent);
}
.av-row {
  display: grid;
  grid-template-columns: 28px 66px minmax(110px, 1fr) 40px;
  align-items: center;
  gap: 8px;
}
.av-mute {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--vol-text);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.av-mute:hover {
  background: rgba(255, 255, 255, 0.18);
}
.av-mute.is-muted {
  opacity: 0.55;
}
.av-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.av-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  accent-color: var(--vol-accent);
}
.av-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--vol-accent);
  border: 2px solid #111;
  cursor: pointer;
}
.av-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--vol-accent);
  border: 2px solid #111;
  cursor: pointer;
}
.av-slider.is-muted {
  opacity: 0.45;
}
.av-val {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  opacity: 0.9;
}
.av-wrap {
  position: relative;
  display: inline-block;
  pointer-events: auto;
}
.av-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  pointer-events: auto;
}
.av-trigger:hover {
  background: rgba(0, 0, 0, 0.65);
}
.av-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  min-width: 270px;
  display: none;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.av-popover.is-open {
  display: flex;
}
@media (max-width: 480px) {
  .av-row {
    grid-template-columns: 26px 58px minmax(90px, 1fr) 36px;
    gap: 6px;
  }
  .av-popover {
    min-width: 240px;
  }
}
`;

const CHANNELS: readonly { key: VolumeChannel; label: string; icon: string }[] = [
  { key: 'master', label: 'Master', icon: '🔊' },
  { key: 'sounds', label: 'Sounds', icon: '🔔' },
  { key: 'music', label: 'Music', icon: '🎵' },
];

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function stopGameInput(el: HTMLElement): void {
  for (const ev of ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'] as const) {
    el.addEventListener(ev, (e) => e.stopPropagation());
  }
}

function applyTheme(el: HTMLElement, theme?: VolumePanelOptions['theme']): void {
  if (!theme) return;
  if (theme.accent) el.style.setProperty('--vol-accent', theme.accent);
  if (theme.bg) el.style.setProperty('--vol-bg', theme.bg);
  if (theme.border) el.style.setProperty('--vol-border', theme.border);
  if (theme.text) el.style.setProperty('--vol-text', theme.text);
}

/**
 * Renders an inline volume control panel with Master, Sounds, and Music sliders.
 * Subscribes to `store` and stays synced across multiple instances.
 */
export function createVolumePanel(
  parent: HTMLElement,
  store: VolumeStore,
  options: VolumePanelOptions = {},
): VolumePanel {
  injectStyle();

  const root = document.createElement('div');
  root.className = options.className ? `av-panel ${options.className}` : 'av-panel';
  applyTheme(root, options.theme);
  stopGameInput(root);

  if (options.title) {
    const heading = document.createElement('div');
    heading.className = 'av-title';
    heading.textContent = options.title;
    root.appendChild(heading);
  }

  const controls = new Map<
    VolumeChannel,
    { muteBtn: HTMLButtonElement; slider: HTMLInputElement; readout: HTMLSpanElement; icon: string }
  >();

  for (const ch of CHANNELS) {
    const row = document.createElement('div');
    row.className = 'av-row';

    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.className = 'av-mute';
    muteBtn.title = `Mute / unmute ${ch.label.toLowerCase()}`;
    muteBtn.setAttribute('aria-label', `Toggle ${ch.label} mute`);
    muteBtn.addEventListener('click', () => {
      store.toggleMute(ch.key);
    });

    const label = document.createElement('span');
    label.className = 'av-label';
    label.textContent = ch.label;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'av-slider';
    slider.min = '0';
    slider.max = '100';
    slider.step = '1';
    slider.setAttribute('aria-label', `${ch.label} volume`);
    slider.addEventListener('input', () => {
      store.set(ch.key, Number(slider.value) / 100);
    });

    const readout = document.createElement('span');
    readout.className = 'av-val';

    row.append(muteBtn, label, slider, readout);
    root.appendChild(row);
    controls.set(ch.key, { muteBtn, slider, readout, icon: ch.icon });
  }

  function render(): void {
    for (const ch of CHANNELS) {
      const ctrl = controls.get(ch.key);
      if (!ctrl) continue;
      const val = store.get(ch.key);
      const muted = store.isMuted(ch.key);
      const pct = Math.round(val * 100);
      ctrl.slider.value = String(pct);
      ctrl.slider.classList.toggle('is-muted', muted);
      ctrl.muteBtn.classList.toggle('is-muted', muted);
      ctrl.muteBtn.textContent = muted ? '🔇' : ctrl.icon;
      ctrl.muteBtn.setAttribute('aria-pressed', String(muted));
      ctrl.readout.textContent = muted ? 'OFF' : `${pct}%`;
    }
  }

  render();
  const unsubscribe = store.subscribe(render);
  parent.appendChild(root);

  return {
    element: root,
    destroy(): void {
      unsubscribe();
      root.remove();
    },
  };
}

/**
 * Renders a compact volume button that toggles a floating Master / Sounds / Music popover.
 */
export function createVolumeButton(
  parent: HTMLElement,
  store: VolumeStore,
  options: VolumeButtonOptions = {},
): VolumeButton {
  injectStyle();

  const wrap = document.createElement('div');
  wrap.className = 'av-wrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = options.buttonClassName ?? 'av-trigger';
  btn.title = 'Volume settings';
  btn.setAttribute('aria-label', 'Volume settings');
  btn.setAttribute('aria-expanded', 'false');

  const panel = createVolumePanel(wrap, store, {
    title: options.title ?? 'Volume',
    className: options.className ? `av-popover ${options.className}` : 'av-popover',
    theme: options.theme,
  });

  let openState = false;

  function renderBtn(): void {
    const allSilent = store.isMuted('master') || (store.isMuted('sounds') && store.isMuted('music'));
    const icon = allSilent ? '🔇' : '🔊';
    if (options.buttonClassName) {
      const hint = options.shortcutHint ? `<span class="vb-key">${options.shortcutHint}</span>` : '';
      btn.innerHTML = `<span class="vb-icon">${icon}</span><span class="vb-label">VOL</span>${hint}`;
    } else {
      btn.textContent = `${icon} Volume`;
    }
  }

  function setOpen(next: boolean): void {
    openState = next;
    panel.element.classList.toggle('is-open', next);
    btn.setAttribute('aria-expanded', String(next));
  }

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!openState);
  });
  btn.addEventListener('click', (e) => e.stopPropagation());

  const onDocPointerDown = (e: PointerEvent): void => {
    if (!openState) return;
    if (!wrap.contains(e.target as Node)) setOpen(false);
  };
  const onDocKeyDown = (e: KeyboardEvent): void => {
    if (openState && e.code === 'Escape') {
      setOpen(false);
    }
  };

  window.addEventListener('pointerdown', onDocPointerDown);
  window.addEventListener('keydown', onDocKeyDown);
  const unsubscribe = store.subscribe(renderBtn);
  renderBtn();

  wrap.insertBefore(btn, panel.element);
  parent.appendChild(wrap);

  return {
    element: wrap,
    button: btn,
    show() { wrap.style.display = 'inline-block'; },
    hide() { setOpen(false); wrap.style.display = 'none'; },
    open() { setOpen(true); },
    close() { setOpen(false); },
    isOpen() { return openState; },
    destroy() {
      unsubscribe();
      window.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onDocKeyDown);
      panel.destroy();
      wrap.remove();
    },
  };
}
