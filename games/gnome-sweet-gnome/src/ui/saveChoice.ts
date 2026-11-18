// "Two saves found" screen: this browser and the player's account both progressed since they last synced, so the
// player picks the save to keep (the other one is replaced). Shown over the page, before the game starts.
import { COLORS, FONT } from '../config';
import type { SaveInfo } from '@lawn/cloudsave';

/** COLORS.panel as CSS. */
const PANEL_CSS = '#4a2f63';

/** Creates a styled element. Text is always set with textContent. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Resolves 'local' or 'remote' when the player picks one. The overlay is removed after the choice. */
export function chooseSave(root: HTMLElement, local: SaveInfo, remote: SaveInfo): Promise<'local' | 'remote'> {
  return new Promise((resolve) => {
    const overlay = el(
      'div',
      'position:absolute;inset:0;pointer-events:auto;z-index:600;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;padding:16px;box-sizing:border-box;text-align:center;' +
        `background:${COLORS.backgroundCss};`,
    );
    overlay.setAttribute('data-testid', 'save-choice');

    const h1 = el(
      'h1',
      `margin:0 0 16px;font-family:Georgia, serif;font-weight:normal;font-size:32px;color:${COLORS.accent};`,
      'Two saves found',
    );

    const text = el(
      'p',
      `margin:0 0 24px;max-width:520px;font-family:${FONT};font-size:16px;line-height:1.5;color:${COLORS.text};`,
      'This browser and your account both have progress since they last synced. Pick the one to keep; the other is replaced.',
    );

    const buttons = el('div', 'display:flex;flex-direction:column;align-items:stretch;gap:12px;width:100%;max-width:420px;');
    let done = false;

    const choiceButton = (choice: 'local' | 'remote', label: string, detail: string, testId: string): HTMLButtonElement => {
      const b = el(
        'button',
        'display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;min-height:56px;box-sizing:border-box;' +
          `padding:12px 20px;cursor:pointer;pointer-events:auto;background:${PANEL_CSS};` +
          `border:2px solid ${COLORS.buttonEdge};color:${COLORS.text};font-family:${FONT};`,
      );
      b.setAttribute('data-testid', testId);

      const title = el('span', 'font-size:20px;', label);
      const sub = el('span', `font-size:14px;color:${COLORS.buttonEdge};overflow-wrap:anywhere;`, detail);
      b.append(title, sub);

      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        overlay.remove();
        resolve(choice);
      });
      return b;
    };

    const remoteDetail = remote.summary + (remote.updatedAt ? ' · saved ' + new Date(remote.updatedAt).toLocaleString() : '');

    buttons.append(
      choiceButton('local', 'This browser', local.summary, 'choose-local'),
      choiceButton('remote', 'Your account', remoteDetail, 'choose-remote'),
    );

    overlay.append(h1, text, buttons);
    root.append(overlay);
  });
}
