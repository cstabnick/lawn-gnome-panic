// Pebblewick's counter sheet (DOM): one fixed, centred panel for Twine's General, The Dry Spoon or Ratchet's Mower &
// Dew. Phone-friendly: every button is at least 44 px, nothing needs hover, Escape or the close button dismisses it.
// Modelled on fishing/shopUi.ts. The rows come from the caller (shops.ts), so this file knows nothing about the economy.
import { prefabIconElement } from '@lawn/prefabs';
import { KEYS } from '../keys';
import { ensureGlyphStyle, fillHintHtml } from '../ui/glyphs';
import { currentGlyphSet } from '../ui/inputSource';

export interface SheetRow {
  id: string;
  name: string;
  blurb: string;
  price: number;
  icon: string;
  emoji: string;
  enabled: boolean;
  /** Why the row is greyed out (Owned, Not enough Acorns, ...). */
  note?: string;
}

export interface ShopSheetCallbacks {
  title(): string;
  keeper(): string;
  rows(): SheetRow[];
  buy(id: string): void;
  onClose(): void;
}

export interface ShopSheet {
  open(): void;
  close(): void;
  isOpen(): boolean;
  refresh(): void;
}

const ROOT_ID = 'gta-pw-shop';
const STYLE_ID = 'gta-pw-shop-style';

const CSS = `
#gta-pw-shop{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;box-sizing:border-box;width:min(520px,calc(100vw - 32px));max-height:calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch;padding:14px;background:#e9d3a8;color:#3b2a1a;border:2px solid #9a6b3c;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.5);font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:auto;}
#gta-pw-shop *{box-sizing:border-box;}
#gta-pw-shop .pw-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
#gta-pw-shop .pw-title{margin:0;font-size:20px;color:#7a3e12;}
#gta-pw-shop .pw-keeper{font-size:12px;opacity:0.85;margin-top:2px;}
#gta-pw-shop .pw-btn{min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:1px solid #7a3e12;background:#c98f5e;color:#2b1a0c;font:inherit;font-weight:600;cursor:pointer;touch-action:manipulation;}
#gta-pw-shop .pw-btn:disabled{opacity:0.5;cursor:not-allowed;}
#gta-pw-shop .pw-close{padding:0;font-size:18px;}
#gta-pw-shop .pw-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 0;border-bottom:1px solid rgba(90,55,25,0.25);}
#gta-pw-shop .pw-info{flex:1;min-width:0;}
#gta-pw-shop .pw-name{font-weight:700;overflow-wrap:anywhere;}
#gta-pw-shop .pw-blurb{font-style:italic;font-size:13px;opacity:0.9;}
#gta-pw-shop .pw-note{font-size:12px;color:#8a3a10;}
#gta-pw-shop .pw-actions{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
#gta-pw-shop .pw-foot{margin-top:10px;padding-top:8px;border-top:1px solid rgba(90,55,25,0.25);font-size:12px;color:#3b2a1a;opacity:0.7;text-align:center;overflow:hidden;text-overflow:ellipsis;}
`;

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function createShopSheet(ui: HTMLElement, cb: ShopSheetCallbacks): ShopSheet {
  injectStyle();
  ensureGlyphStyle();
  let opened = false;

  const root = el('div');
  root.id = ROOT_ID;
  root.style.display = 'none';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');

  const head = el('div', 'pw-head');
  const titleWrap = el('div');
  const title = el('h2', 'pw-title');
  const keeper = el('div', 'pw-keeper');
  titleWrap.append(title, keeper);
  const closeBtn = el('button', 'pw-btn pw-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close shop');
  head.append(titleWrap, closeBtn);

  const body = el('div', 'pw-body');
  const foot = el('div', 'pw-foot');
  root.append(head, body, foot);
  ui.appendChild(root);

  // Modal for input: pointer and touch must not reach the game behind the sheet.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function render(): void {
    title.textContent = cb.title();
    keeper.textContent = cb.keeper();
    body.innerHTML = '';
    for (const row of cb.rows()) {
      const r = el('div', 'pw-row');
      r.appendChild(prefabIconElement(row.icon, row.emoji, 32));
      const info = el('div', 'pw-info');
      info.append(el('div', 'pw-name', row.name), el('div', 'pw-blurb', row.blurb));
      r.appendChild(info);

      const actions = el('div', 'pw-actions');
      if (row.note) actions.appendChild(el('span', 'pw-note', row.note));
      const buy = el('button', 'pw-btn', `Buy (${row.price} 🌰)`);
      buy.type = 'button';
      buy.disabled = !row.enabled;
      buy.addEventListener('click', () => {
        if (buy.disabled) return;
        cb.buy(row.id);
        if (opened) render();
      });
      actions.appendChild(buy);
      r.appendChild(actions);
      body.appendChild(r);
    }
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === KEYS.close && opened) close();
  }

  function refreshFoot(): void {
    foot.style.display = currentGlyphSet() === 'touch' ? 'none' : '';
    foot.innerHTML = fillHintHtml('{close} Close');
  }

  function open(): void {
    if (!opened) {
      opened = true;
      window.addEventListener('keydown', onKeydown);
    }
    root.style.display = '';
    if (document.pointerLockElement) document.exitPointerLock();
    refreshFoot();
    render();
  }

  function close(): void {
    if (!opened) return;
    opened = false;
    window.removeEventListener('keydown', onKeydown);
    root.style.display = 'none';
    body.innerHTML = '';
    cb.onClose();
  }

  closeBtn.addEventListener('click', () => close());

  return {
    open,
    close,
    isOpen: () => opened,
    refresh() {
      if (opened) render();
    },
  };
}
