// Multi-tab save liveness. There are no accounts yet: a "save" is one localStorage key shared by every tab of this
// browser. Each store re-reads its key before writing (so it never clobbers another tab's change), merges what it can,
// takes the latest write where it cannot, and calls watchKey so it hears about writes from other tabs.

/**
 * Calls `onChange(newValue)` when ANOTHER tab writes `key` (the browser's `storage` event never fires in the writing
 * tab). `newValue` is null when the key was removed. Returns an unsubscribe. A no-op outside a browser.
 */
export function watchKey(key: string, onChange: (newValue: string | null) => void): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const handler = (e: StorageEvent): void => {
    // key === null means storage.clear(): treat it as a change of every key.
    if (e.key !== null && e.key !== key) return;
    onChange(e.key === null ? null : e.newValue);
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

const STYLE_ID = 'ls-notice-style';
const STACK_ID = 'ls-notice-stack';

const CSS = `
#${STACK_ID}{position:fixed;left:0;right:0;bottom:max(16px,env(safe-area-inset-bottom));z-index:9998;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;padding:0 16px}
.ls-notice{max-width:360px;padding:10px 14px;border-radius:10px;background:rgba(18,28,20,.92);border:2px solid #7ed6a0;color:#fff;font:14px system-ui,-apple-system,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.45);opacity:0;transform:translateY(12px);transition:opacity 220ms,transform 220ms}
.ls-notice.show{opacity:1;transform:none}
`;

/** Shows a short, self-dismissing notice (e.g. "Your gnome was changed in another tab."). Never throws. */
export function showSyncNotice(message: string, ms = 5000): void {
  if (typeof document === 'undefined') return;
  try {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    let stack = document.getElementById(STACK_ID);
    if (!stack) {
      stack = document.createElement('div');
      stack.id = STACK_ID;
      // Own container in #ui when the game has one (never restyle #ui itself); body otherwise.
      (document.getElementById('ui') ?? document.body).appendChild(stack);
    }
    // One notice per message at a time: a burst of writes must not stack identical toasts.
    for (const el of Array.from(stack.children)) if (el.textContent === message) el.remove();
    const el = document.createElement('div');
    el.className = 'ls-notice';
    el.setAttribute('role', 'status');
    el.textContent = message;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, ms);
  } catch {
    // A notice is a courtesy; never break the game for it.
  }
}
