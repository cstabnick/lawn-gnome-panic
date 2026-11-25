// The bag sheet (E08, L33): two tabs. Bag: every item held, with Use and a quick-slot star. Crumbs & Co.: snacks and
// fun items for sale, delivered straight into the bag. DOM only; every action goes through deps.
import { prefabIconElement } from '@lawn/prefabs';
import { ITEMS, STACK_MAX, type Inventory, type ItemDef } from '../inventory';
import { KEYS, isTyping } from '../keys';

export type BagTab = 'bag' | 'shop';

export interface BagUiDeps {
  inventory: Inventory;
  acorns(): number;
  /** Use one of id. Error sentence ("You are not cracked."), or null when it was used. */
  useItem(id: string): string | null;
  /** Buy one of id at Crumbs & Co. Error sentence, or null when it is in the bag. */
  buy(id: string): string | null;
  /** Sheet opened (true) or closed (false). */
  onOpenChange?(open: boolean): void;
}

export interface BagUi {
  open(tab?: BagTab): void;
  close(): void;
  isOpen(): boolean;
  refresh(): void;
}

const CSS = `
#gta-bag{position:fixed;inset:0;pointer-events:none;z-index:36;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-bag button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-bag .gta-bag-backdrop{
  position:fixed;inset:0;display:none;align-items:flex-end;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:auto;box-sizing:border-box;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
}
#gta-bag .gta-bag-backdrop.open{display:flex;}
#gta-bag .gta-bag-modal{
  width:min(100%,560px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:10px;
}
#gta-bag .gta-bag-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-bag .gta-bag-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-bag .gta-bag-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-bag .gta-bag-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;flex:none;
}
#gta-bag .gta-bag-tabs{display:flex;gap:8px;flex-wrap:wrap;}
#gta-bag .gta-bag-tab{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.06);color:#f4f6f8;font-size:14px;font-weight:800;
}
#gta-bag .gta-bag-tab[aria-pressed="true"]{border-color:#ffd23f;background:rgba(255,210,63,0.2);color:#ffd23f;}
#gta-bag .gta-bag-row{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);box-sizing:border-box;
}
#gta-bag .gta-bag-icon{flex:none;width:40px;height:40px;display:flex;align-items:center;justify-content:center;}
#gta-bag .gta-bag-info{flex:1 1 160px;min-width:0;}
#gta-bag .gta-bag-name{font-size:15px;font-weight:800;}
#gta-bag .gta-bag-meta{font-size:12px;opacity:0.8;margin-top:2px;}
#gta-bag .gta-bag-blurb{font-size:12px;opacity:0.85;margin-top:2px;}
#gta-bag .gta-bag-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
#gta-bag .gta-bag-btn{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #ffd23f;
  background:rgba(255,210,63,0.16);color:#ffd23f;font-size:14px;font-weight:800;
}
#gta-bag .gta-bag-btn:disabled{opacity:0.5;cursor:default;}
#gta-bag .gta-bag-star{
  min-width:44px;min-height:44px;padding:0;border-radius:10px;border:2px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.06);color:#ffd23f;font-size:20px;
}
#gta-bag .gta-bag-empty{font-size:14px;opacity:0.8;padding:12px 4px;}
#gta-bag .gta-bag-msg{font-size:13px;color:#ffb3a0;min-height:18px;}
`;

function emojiFor(def: ItemDef): string {
  if (def.kind === 'snack') return '🍎';
  if (def.kind === 'fun') return '🎉';
  return '🔧';
}

export function createBagUi(ui: HTMLElement, deps: BagUiDeps): BagUi {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-bag';

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-bag-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-bag-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Bag');

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  ui.appendChild(root);

  let isOpen = false;
  let tab: BagTab = 'bag';
  let message = '';

  // Touches and clicks on the sheet must not reach the game underneath.
  modal.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `gta-bag-btn ${cls}`.trim();
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function iconFor(def: ItemDef): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'gta-bag-icon';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.appendChild(prefabIconElement(def.prefab, emojiFor(def), 40));
    return wrap;
  }

  function textLine(cls: string, text: string): HTMLElement {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    return el;
  }

  function bagRow(def: ItemDef, count: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'gta-bag-row';
    row.appendChild(iconFor(def));

    const info = document.createElement('div');
    info.className = 'gta-bag-info';
    info.appendChild(textLine('gta-bag-name', `${def.name} ×${count}`));
    info.appendChild(textLine('gta-bag-blurb', def.blurb));
    if (def.kind === 'snack' && def.heal !== undefined) {
      info.appendChild(textLine('gta-bag-meta', `+${Math.round(def.heal * 100)} %`));
    }
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'gta-bag-actions';
    actions.appendChild(button('Use', '', () => {
      message = deps.useItem(def.id) ?? '';
      render();
    }));

    const quickOn = deps.inventory.quick() === def.id;
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'gta-bag-star';
    star.textContent = quickOn ? '★' : '☆';
    star.setAttribute('aria-label', 'Quick-use slot');
    star.setAttribute('aria-pressed', quickOn ? 'true' : 'false');
    star.addEventListener('click', () => {
      deps.inventory.setQuick(quickOn ? null : def.id);
      render();
    });
    actions.appendChild(star);
    row.appendChild(actions);
    return row;
  }

  function shopRow(def: ItemDef): HTMLElement {
    const price = def.price ?? 0;
    const held = deps.inventory.count(def.id);
    const row = document.createElement('div');
    row.className = 'gta-bag-row';
    row.appendChild(iconFor(def));

    const info = document.createElement('div');
    info.className = 'gta-bag-info';
    info.appendChild(textLine('gta-bag-name', def.name));
    info.appendChild(textLine('gta-bag-meta', `${price} 🌰 · held ${held}`));
    info.appendChild(textLine('gta-bag-blurb', def.blurb));
    row.appendChild(info);

    const full = held >= STACK_MAX;
    const broke = !full && deps.acorns() < price;
    const label = full ? 'Bag full' : broke ? 'Not enough' : 'Buy';
    const buy = button(label, '', () => {
      message = deps.buy(def.id) ?? '';
      render();
    });
    buy.disabled = full || broke;
    const actions = document.createElement('div');
    actions.className = 'gta-bag-actions';
    actions.appendChild(buy);
    row.appendChild(actions);
    return row;
  }

  function tabButton(id: BagTab, label: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gta-bag-tab';
    b.textContent = label;
    b.setAttribute('aria-pressed', tab === id ? 'true' : 'false');
    b.addEventListener('click', () => {
      tab = id;
      message = '';
      render();
    });
    return b;
  }

  function render(): void {
    if (!isOpen) return;
    modal.replaceChildren();

    const held = deps.inventory.list();
    const total = held.reduce((sum, e) => sum + e.count, 0);

    const head = document.createElement('div');
    head.className = 'gta-bag-head';
    const titles = document.createElement('div');
    const h = document.createElement('h2');
    h.className = 'gta-bag-title';
    h.textContent = 'Bag';
    titles.appendChild(h);
    titles.appendChild(textLine('gta-bag-sub', `${total} items · ${deps.acorns()} 🌰`));
    head.appendChild(titles);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gta-bag-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => close());
    head.appendChild(closeBtn);
    modal.appendChild(head);

    const tabs = document.createElement('div');
    tabs.className = 'gta-bag-tabs';
    tabs.appendChild(tabButton('bag', '🎒 Bag'));
    tabs.appendChild(tabButton('shop', '🍪 Crumbs & Co.'));
    modal.appendChild(tabs);

    if (tab === 'bag') {
      if (held.length === 0) {
        modal.appendChild(textLine('gta-bag-empty',
          'Your bag is empty. Crumbs & Co. delivers, and snacks turn up in the parks.'));
      } else {
        for (const e of held) modal.appendChild(bagRow(e.def, e.count));
      }
    } else {
      for (const def of ITEMS) {
        if (def.price === undefined) continue;
        modal.appendChild(shopRow(def));
      }
    }

    const msg = document.createElement('div');
    msg.className = 'gta-bag-msg';
    msg.setAttribute('role', 'status');
    msg.textContent = message;
    modal.appendChild(msg);
  }

  function open(next: BagTab = 'bag'): void {
    tab = next;
    message = '';
    if (!isOpen) {
      isOpen = true;
      backdrop.classList.add('open');
      deps.onOpenChange?.(true);
    }
    render();
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    message = '';
    backdrop.classList.remove('open');
    modal.replaceChildren();
    deps.onOpenChange?.(false);
  }

  function onKey(e: KeyboardEvent): void {
    if (!isOpen) return;
    if (e.code !== KEYS.close || isTyping(e)) return;
    e.stopImmediatePropagation();
    close();
  }

  window.addEventListener('keydown', onKey);
  deps.inventory.onChange(() => {
    if (isOpen) render();
  });

  return {
    open,
    close,
    isOpen: () => isOpen,
    refresh: () => render(),
  };
}
