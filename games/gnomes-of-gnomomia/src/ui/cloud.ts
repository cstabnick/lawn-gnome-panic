// Cloud-save conflict screen: this browser and the player's account both changed since they last synced,
// so the player picks the save to keep (the other one is replaced).
import { UI } from '../config';
import type { SaveInfo } from '../cloudSave';

/** Creates a styled element. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Shows the two saves over the page; resolves 'local' or 'remote' when the player picks one. */
export function chooseSave(root: HTMLElement, local: SaveInfo, remote: SaveInfo): Promise<'local' | 'remote'> {
  return new Promise((resolve) => {
    const overlay = el(
      'div',
      'position:absolute;inset:0;pointer-events:auto;z-index:600;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;padding:16px;box-sizing:border-box;text-align:center;' +
        'background:radial-gradient(ellipse at center, rgba(20,15,8,0.25), rgba(20,15,8,0.8));',
    );
    overlay.setAttribute('data-testid', 'save-choice');

    const h1 = el(
      'h1',
      `margin:0 0 16px;font-family:Georgia, serif;font-weight:normal;font-size:36px;color:${UI.gold};` +
        'text-shadow:3px 3px 0 #3a2a10, 0 0 24px rgba(0,0,0,0.6);',
      'Two saves found',
    );

    const text = el(
      'p',
      `margin:0 0 28px;max-width:520px;font-family:${UI.font};font-size:16px;line-height:1.6;color:${UI.text};`,
      'This browser and your account both have progress since they last synced. Pick the one to keep; the other is replaced.',
    );

    const buttons = el('div', 'display:flex;flex-direction:column;align-items:stretch;gap:12px;width:100%;max-width:420px;');
    let done = false;

    const choiceButton = (
      choice: 'local' | 'remote',
      label: string,
      detail: string,
      testId: string,
    ): HTMLButtonElement => {
      const b = el(
        'button',
        `display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;min-height:56px;box-sizing:border-box;` +
          `padding:12px 20px;cursor:pointer;pointer-events:auto;background:${UI.panelBg};` +
          `border:2px solid ${UI.borderLight};color:${UI.text};font-family:${UI.font};`,
      );
      b.setAttribute('data-testid', testId);

      const title = el('span', 'font-size:20px;', label);
      const sub = el('span', `font-size:14px;color:${UI.textDim};overflow-wrap:anywhere;`, detail);
      b.append(title, sub);

      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        overlay.remove();
        resolve(choice);
      });
      return b;
    };

    const localDetail = local.summary;
    const remoteDetail =
      remote.summary + (remote.updatedAt ? ' · saved ' + new Date(remote.updatedAt).toLocaleString() : '');

    buttons.append(
      choiceButton('local', 'This browser', localDetail, 'choose-local'),
      choiceButton('remote', 'Your account', remoteDetail, 'choose-remote'),
    );

    overlay.append(h1, text, buttons);
    root.append(overlay);
  });
}
