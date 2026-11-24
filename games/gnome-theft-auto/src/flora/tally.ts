// The small "✂ N mowed" pill on the HUD: shown for a moment after each mow. Never takes touches; sits above the safe-area
// bottom, above the vehicle name. It lives in its own wrapper inside the shared #ui element, which this module never restyles or hides.
export interface MowTally {
  /** Show the running total for a moment. */
  show(total: number): void;
  update(dt: number): void;
  dispose(): void;
}

const SHOW_SECONDS = 2.5;

export function createMowTally(ui: HTMLElement): MowTally {
  const wrap = document.createElement('div');
  const el = document.createElement('div');
  el.id = 'gta-mow-tally';
  el.style.cssText = [
    'position: fixed',
    'bottom: calc(env(safe-area-inset-bottom, 0px) + 84px)',
    'left: 50%',
    'transform: translateX(-50%)',
    'pointer-events: none',
    'z-index: 30',
    'font: 700 13px system-ui, sans-serif',
    'color: #eaf7c9',
    'background: rgba(24, 40, 14, .72)',
    'border-radius: 12px',
    'padding: 4px 10px',
    'opacity: 0',
    'transition: opacity .25s',
    'white-space: nowrap',
  ].join(';');
  wrap.appendChild(el);
  ui.appendChild(wrap);

  let lastTotal = -1;
  let timer = 0;
  let visible = false;

  return {
    show(total) {
      if (total !== lastTotal) {
        lastTotal = total;
        el.textContent = `✂ ${total} mowed`;
      }
      visible = true;
      el.style.opacity = '1';
      timer = SHOW_SECONDS;
    },
    update(dt) {
      if (timer <= 0) return;
      timer -= dt;
      if (timer <= 0) {
        timer = 0;
        if (visible) {
          visible = false;
          el.style.opacity = '0';
        }
      }
    },
    dispose() {
      wrap.remove();
    },
  };
}
