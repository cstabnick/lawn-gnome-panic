// Title screen: a dim overlay over the running village, with Continue and New Game.
import { UI } from '../config';

/** Creates a styled element. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Shows the title over the running world; resolves 'continue' or 'new' when the player picks. */
export function showTitle(root: HTMLElement, hasSave: boolean): Promise<'continue' | 'new'> {
  return new Promise((resolve) => {
    const overlay = el(
      'div',
      'position:absolute;inset:0;pointer-events:auto;z-index:500;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;padding:16px;box-sizing:border-box;text-align:center;' +
        'background:radial-gradient(ellipse at center, rgba(20,15,8,0.25), rgba(20,15,8,0.8));' +
        'transition:opacity 0.4s ease;',
    );

    // Title size: 64 px, or 40 px on narrow screens.
    const style = document.createElement('style');
    style.textContent = '.gg-title-h1{font-size:64px}@media (max-width:640px){.gg-title-h1{font-size:40px}}';
    overlay.append(style);

    const h1 = el(
      'h1',
      `margin:0 0 8px;font-family:Georgia, serif;font-weight:normal;color:${UI.gold};` +
        'text-shadow:3px 3px 0 #3a2a10, 0 0 24px rgba(0,0,0,0.6);',
      'Gnomes of Gnomomia',
    );
    h1.className = 'gg-title-h1';

    const subtitle = el(
      'p',
      `margin:0 0 36px;font-family:${UI.font};font-style:italic;font-size:18px;color:${UI.textDim};`,
      'An old-school gnome role-playing game',
    );

    const buttons = el('div', 'display:flex;flex-direction:column;align-items:center;gap:12px;');
    let done = false;

    const finish = (choice: 'continue' | 'new'): void => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey);
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 400);
      resolve(choice);
    };

    const button = (label: string, choice: 'continue' | 'new'): HTMLButtonElement => {
      const b = el(
        'button',
        `min-width:220px;padding:10px 28px;cursor:pointer;pointer-events:auto;background:${UI.panelBg};` +
          `border:2px solid ${UI.borderLight};color:${UI.text};font-family:${UI.font};font-size:18px;`,
        label,
      );
      b.addEventListener('mouseenter', () => (b.style.filter = 'brightness(1.3)'));
      b.addEventListener('mouseleave', () => (b.style.filter = ''));
      b.addEventListener('click', () => finish(choice));
      return b;
    };

    if (hasSave) buttons.append(button('Continue', 'continue'));
    buttons.append(button('New Game', 'new'));

    const controls = el(
      'p',
      `margin:28px 0 0;max-width:720px;font-family:${UI.font};font-size:14px;line-height:1.6;color:${UI.textDim};`,
      'Click to walk · Click a foe to fight · Right-click for options · Arrows / middle-drag turn the camera · ' +
        'Wheel zooms · 1 Flare · 2 Mend · I E C J B panels · M mute',
    );

    // Enter picks the first button.
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') finish(hasSave ? 'continue' : 'new');
    };
    window.addEventListener('keydown', onKey);

    overlay.append(h1, subtitle, buttons, controls);
    root.append(overlay);
  });
}
