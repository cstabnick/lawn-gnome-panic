// The 🌰 acorns · 🪙 chips pill under the map name. Kept in step with the Oakcount.
import { getAcorns, getChips, onOakcountChange } from '@lawn/oakcount';

const STYLE_ID = 'cg-wallet-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.cg-wallet {
  background: rgba(20, 20, 28, 0.72);
  color: #fff;
  border-radius: 14px;
  padding: 6px 12px;
  font-weight: 700;
  min-height: 32px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
.cg-wallet.cg-wallet-pulse {
  animation: cg-wallet-pulse 0.4s ease-out;
}
@keyframes cg-wallet-pulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .cg-wallet.cg-wallet-pulse { animation: none; }
}`;
  document.head.appendChild(style);
}

/** Mounts the wallet pill through addTopControl and keeps it in step with the Oakcount. */
export function createWalletHud(addTopControl: (el: HTMLElement) => void): void {
  ensureStyle();
  const pill = document.createElement('div');
  pill.className = 'cg-wallet';
  pill.setAttribute('role', 'status');

  let shownAcorns = getAcorns();
  const render = (): void => {
    const acorns = getAcorns();
    const chips = getChips();
    const text = `🌰 ${acorns.toLocaleString('en-US')} · 🪙 ${chips.toLocaleString('en-US')}`;
    pill.textContent = text;
    pill.setAttribute('aria-label', `Oakcount: ${acorns.toLocaleString('en-US')} acorns, ${chips.toLocaleString('en-US')} chips`);
    if (acorns > shownAcorns) {
      pill.classList.remove('cg-wallet-pulse');
      // Force a reflow so the animation restarts on each gain.
      void pill.offsetWidth;
      pill.classList.add('cg-wallet-pulse');
    }
    shownAcorns = acorns;
  };

  render();
  addTopControl(pill);
  onOakcountChange(render);
}
