// Tuft hunting: the small hunt HUD (DOM): game-bag count and one hint line (fresh tracks, a quarry down and how long
// it stays down, a wary animal). Shown only while it has something to say. The journal is a More menu action.
// Styled inline (no stylesheet of its own) so it stays independent of the lodge sheet.
import { registerAction } from '../ui/actions';

export interface HuntHudState {
  /** Show the panel at all (licensed, or something in the bag, or a hint to show). */
  visible: boolean;
  bag: number;
  bagSize: number;
  licensed: boolean;
  /** One short line, or null. */
  hint: string | null;
}

export interface HuntHud {
  update(s: HuntHudState): void;
  /** Hide everything (cutscenes, shop open). */
  setHidden(hidden: boolean): void;
}

const PANEL = 'rgba(43,27,14,0.88)';
const SHOWN = 'flex';

export function createHuntHud(ui: HTMLElement, onJournal: () => void): HuntHud {
  const box = document.createElement('div');
  box.id = 'gta-hunt-hud';
  box.style.cssText = [
    'position:fixed',
    'top:calc(env(safe-area-inset-top) + 210px)',
    'left:calc(env(safe-area-inset-left) + 12px)',
    'z-index:40',
    'display:none',
    'flex-direction:column',
    'align-items:flex-start',
    'gap:4px',
    'pointer-events:none',
    'font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif',
    'color:#f3e9d2',
  ].join(';') + ';';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:6px;';

  const pill = document.createElement('div');
  pill.style.cssText = `padding:6px 12px;border-radius:999px;background:${PANEL};border:1px solid #7a9a3a;white-space:nowrap;`;

  // The hunting journal is a More menu action (not a button on the HUD).
  registerAction('huntJournal', { run: onJournal });

  row.append(pill);

  const hintEl = document.createElement('div');
  hintEl.style.cssText = 'max-width:240px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.55);font-weight:400;font-size:12px;';

  box.append(row, hintEl);
  ui.appendChild(box);

  let visible = false;
  let hidden = false;
  let lastPill: string | null = null;
  let lastHint: string | null | undefined = undefined;

  function applyDisplay(): void {
    const disp = visible && !hidden ? SHOWN : 'none';
    if (box.style.display !== disp) box.style.display = disp;
  }

  return {
    update(s: HuntHudState): void {
      visible = s.visible;
      applyDisplay();
      const pillText = !s.licensed && s.bag === 0 ? 'No license' : `🎒 ${s.bag}/${s.bagSize}`;
      if (pillText !== lastPill) {
        lastPill = pillText;
        pill.textContent = pillText;
      }
      if (s.hint !== lastHint) {
        lastHint = s.hint;
        if (s.hint) {
          hintEl.textContent = s.hint;
          hintEl.style.display = '';
        } else {
          hintEl.style.display = 'none';
        }
      }
    },
    setHidden(h: boolean): void {
      hidden = h;
      applyDisplay();
    },
  };
}
