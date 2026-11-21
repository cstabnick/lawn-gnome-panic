// The DOM interface over the 3D town: the clock, the place name, the action button, the speech box and toasts.
// Everything is appended under the shared #ui element. Nothing here touches three.js or localStorage.

export interface HudActions {
  onUse(): void;          // the big action button (talk / give / forage) for the thing in range
  onBag(): void;
  onFriends(): void;
}

export interface Hud {
  setClock(label: string, hour: number): void;   // top bar: "Mon 07:00", and a sun/moon hint from the hour
  setPlace(text: string): void;                  // "At the Crumb & Crock"
  setUse(label: string | null, enabled: boolean): void;  // the action button; null hides it
  toast(text: string): void;                     // a short line that fades (achievement-style)
  /** A speech box at the bottom. Tapping it calls onClose, then hides it. */
  dialog(speaker: string, text: string, onClose?: () => void): void;
  /** Hides the speech box without calling its onClose. */
  closeDialog(): void;
  isDialogOpen(): boolean;
}

const STYLE_ID = 'pc-hud-style';
const TOAST_MS = 2500;
const MAX_TOASTS = 4;

const CSS = `
.pc-hud { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; color: #1f3a1a; }
.pc-hud [hidden] { display: none !important; }
.pc-hud button { pointer-events: auto; }
.pc-top {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  left: calc(env(safe-area-inset-left, 0px) + 12px);
  max-width: 70vw;
  background: rgba(244, 236, 216, 0.92);
  border-radius: 12px;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  font-size: 15px;
}
.pc-clock { font-size: 16px; font-weight: 700; }
.pc-place { font-size: 14px; margin-top: 2px; }
.pc-toasts {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 84px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
}
.pc-toast {
  background: #1f3a1a;
  color: #f4ecd8;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  max-width: 100%;
  animation: pc-toast-fade ${TOAST_MS}ms ease-out forwards;
}
@keyframes pc-toast-fade {
  0% { opacity: 0; }
  8% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
.pc-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding:
    0
    calc(12px + env(safe-area-inset-right, 0px))
    calc(12px + env(safe-area-inset-bottom, 0px))
    calc(12px + env(safe-area-inset-left, 0px));
}
.pc-dialog {
  align-self: center;
  width: 100%;
  max-width: 560px;
  max-height: 40vh;
  overflow: auto;
  background: #f4ecd8;
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  pointer-events: auto;
}
.pc-speaker { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
.pc-text { font-size: 16px; line-height: 1.4; }
.pc-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.pc-use {
  min-height: 48px;
  min-width: 120px;
  max-width: 60vw;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: #7a4f2a;
  color: #f4ecd8;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
.pc-use:hover { filter: brightness(1.08); }
.pc-use.pc-off { background: #9a8f7a; color: #3d3a33; opacity: 0.7; cursor: default; }
.pc-side { display: flex; gap: 8px; margin-left: auto; }
.pc-round {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #7a4f2a;
  background: #f4ecd8;
  font-size: 22px;
  line-height: 1;
  padding: 0;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
.pc-round:hover { filter: brightness(1.05); }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function roundButton(icon: string, label: string, onTap: () => void): HTMLButtonElement {
  const btn = el('button', 'pc-round', icon);
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.addEventListener('click', onTap);
  return btn;
}

/** Sun, moon or sunrise for the hour: moon before 6 and from 20, sunrise 6 to 8, sun otherwise. */
function clockIcon(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h < 6 || h >= 20) return '🌙';
  if (h < 8) return '🌅';
  return '☀️';
}

export function createHud(ui: HTMLElement, actions: HudActions): Hud {
  ensureStyle();

  const root = el('div', 'pc-hud');

  // Top bar: clock and place.
  const top = el('div', 'pc-top');
  const clockLine = el('div', 'pc-clock');
  const clockIconEl = el('span', 'pc-clock-icon', '☀️');
  const clockText = el('span', 'pc-clock-text', '');
  clockLine.append(clockIconEl, ' ', clockText);
  const placeLine = el('div', 'pc-place', '');
  top.append(clockLine, placeLine);

  // Toasts: newest on top.
  const toasts = el('div', 'pc-toasts');
  toasts.setAttribute('role', 'status');
  toasts.setAttribute('aria-live', 'polite');

  // Bottom: speech box above the action row.
  const bottom = el('div', 'pc-bottom');

  const dialogBox = el('div', 'pc-dialog');
  dialogBox.setAttribute('aria-live', 'polite');
  dialogBox.hidden = true;
  const dialogSpeaker = el('div', 'pc-speaker', '');
  const dialogText = el('div', 'pc-text', '');
  dialogBox.append(dialogSpeaker, dialogText);

  const row = el('div', 'pc-row');
  const useBtn = el('button', 'pc-use', '');
  useBtn.type = 'button';
  useBtn.hidden = true;
  useBtn.addEventListener('click', () => {
    if (!useBtn.disabled) actions.onUse();
  });

  const side = el('div', 'pc-side');
  side.append(
    roundButton('🎒', 'Bag', () => actions.onBag()),
    roundButton('📒', 'Friends', () => actions.onFriends()),
  );
  row.append(useBtn, side);
  bottom.append(dialogBox, row);

  root.append(top, toasts, bottom);
  ui.appendChild(root);

  let useLabel: string | null = null;
  let useEnabled = false;
  let dialogOpen = false;
  let dialogClose: (() => void) | undefined;
  // Bumped on every dialog() and closeDialog(), so an onClose that opens a new box is not hidden by the old tap.
  let dialogGen = 0;

  function renderUse(): void {
    if (useLabel === null || dialogOpen) {
      useBtn.hidden = true;
      return;
    }
    useBtn.hidden = false;
    useBtn.textContent = useLabel;
    useBtn.setAttribute('aria-label', useLabel);
    useBtn.disabled = !useEnabled;
    useBtn.classList.toggle('pc-off', !useEnabled);
  }

  function hideDialog(): void {
    dialogOpen = false;
    dialogClose = undefined;
    dialogBox.hidden = true;
    renderUse();
  }

  dialogBox.addEventListener('click', () => {
    const gen = dialogGen;
    const cb = dialogClose;
    cb?.();
    // Hide only if onClose did not open another box.
    if (gen === dialogGen) {
      dialogGen++;
      hideDialog();
    }
  });

  return {
    setClock(label: string, hour: number): void {
      clockText.textContent = label;
      clockIconEl.textContent = clockIcon(hour);
    },

    setPlace(text: string): void {
      placeLine.textContent = text;
    },

    setUse(label: string | null, enabled: boolean): void {
      useLabel = label;
      useEnabled = enabled;
      renderUse();
    },

    toast(text: string): void {
      const item = el('div', 'pc-toast', text);
      toasts.prepend(item);
      while (toasts.children.length > MAX_TOASTS) toasts.lastElementChild?.remove();
      setTimeout(() => item.remove(), TOAST_MS);
    },

    dialog(speaker: string, text: string, onClose?: () => void): void {
      dialogGen++;
      dialogClose = onClose;
      dialogSpeaker.textContent = speaker;
      dialogText.textContent = text;
      dialogOpen = true;
      dialogBox.hidden = false;
      renderUse();
    },

    closeDialog(): void {
      dialogGen++;
      hideDialog();
    },

    isDialogOpen(): boolean {
      return dialogOpen;
    },
  };
}
