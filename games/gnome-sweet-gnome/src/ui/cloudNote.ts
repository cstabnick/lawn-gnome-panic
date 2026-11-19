// Cloud save note, the same one Gnomes of Gnomomia shows: a line on the title screen (synced, or a sign-in link).
// A DOM element in its own container under #ui.
import { accountsEnabled } from '@lawn/platform/session';
import type { CloudStatus } from '@lawn/cloudsave';
import { COLORS, FONT } from '../config';

const BOX_CSS =
  'position:absolute;left:0;right:0;display:flex;justify-content:center;pointer-events:none;' +
  'padding:0 16px;box-sizing:border-box;text-align:center;';

/** What the title line says for a status, or null for nothing. Exported for tests. */
export function cloudNoteText(status: CloudStatus, accounts: boolean): { text: string; link: boolean } | null {
  if (status === 'synced') return { text: '☁ Your save syncs to your account', link: false };
  if (status === 'off' && accounts) return { text: 'Sign in to keep your save on every device', link: true };
  return null;
}

/** Shows the title-screen line near the bottom of the screen. Returns a function that removes it. */
export function showCloudNote(root: HTMLElement, status: CloudStatus): () => void {
  const note = cloudNoteText(status, accountsEnabled());
  if (!note) return () => {};
  const box = document.createElement('div');
  box.style.cssText = BOX_CSS + 'bottom:calc(env(safe-area-inset-bottom) + 12px);';
  box.setAttribute('data-testid', 'cloud-note');
  let line: HTMLElement;
  if (note.link) {
    const a = document.createElement('a');
    a.href = '../me/';
    a.target = '_self';
    a.style.cssText =
      `display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;box-sizing:border-box;pointer-events:auto;` +
      `font-family:${FONT};font-size:15px;color:${COLORS.accent};`;
    // Taps on the link must not also start the game underneath.
    a.addEventListener('pointerdown', (e) => e.stopPropagation());
    line = a;
  } else {
    line = document.createElement('p');
    line.style.cssText = `margin:0;padding:8px 0;font-family:${FONT};font-size:14px;color:${COLORS.text};opacity:0.8;`;
  }
  line.textContent = note.text;
  box.append(line);
  root.append(box);
  return () => box.remove();
}
