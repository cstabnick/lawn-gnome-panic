// The dealership showroom sheet (E08, L29): a bottom sheet of vehicle cards for one dealership, with a Kiln-Shield
// cover toggle and a Buy button per card. DOM only; every action goes through deps.
import { prefabIconElement } from '@lawn/prefabs';
import { KEYS } from '../keys';
import type { DealerDef } from './config';

export interface DealerCard {
  /** DealerStock.id */
  id: string;
  name: string;
  /** @lawn/prefabs id for the 56 px thumbnail (VEHICLES[kind].prefab). */
  prefab: string;
  price: number;
  blurb: string;
  /** Why it cannot be bought now ("Not enough Acorns", "Lock-Up full"), or null. */
  note: string | null;
}

export interface DealerUiDeps {
  cards(dealer: DealerDef): DealerCard[];
  acorns(): number;
  /** Kiln-Shield fee for a vehicle of this price. */
  insuranceFee(price: number): number;
  /** Buy stockId (and insure it when `insure`). Error sentence, or null when it went through (the sheet closes). */
  buy(dealer: DealerDef, stockId: string, insure: boolean): string | null;
  /** Sheet opened (true) or closed (false): the game holds its controls meanwhile. */
  onOpenChange?(open: boolean): void;
}

export interface DealerUi {
  open(dealer: DealerDef): void;
  close(): void;
  isOpen(): boolean;
  /** Re-render if open (the wallet changed). */
  refresh(): void;
}

const CSS = `
#gta-dealer{position:fixed;inset:0;pointer-events:none;z-index:36;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-dealer button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-dealer .gta-dealer-backdrop{
  position:fixed;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:none;box-sizing:border-box;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
}
#gta-dealer .gta-dealer-backdrop.open{display:flex;pointer-events:auto;}
#gta-dealer .gta-dealer-modal{
  width:min(100%,560px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:10px;
}
@media (max-height:500px){#gta-dealer .gta-dealer-modal{max-height:92vh;}}
#gta-dealer .gta-dealer-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-dealer .gta-dealer-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-dealer .gta-dealer-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-dealer .gta-dealer-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;flex:none;
}
#gta-dealer .gta-dealer-btn{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #ffd23f;
  background:rgba(255,210,63,0.16);color:#ffd23f;font-size:14px;font-weight:800;box-sizing:border-box;
}
#gta-dealer .gta-dealer-btn:disabled{opacity:0.5;cursor:default;}
#gta-dealer .gta-dealer-toggle{width:100%;}
#gta-dealer .gta-dealer-toggle[aria-pressed="true"]{background:#ffd23f;color:#181c20;}
#gta-dealer .gta-dealer-cover{font-size:12px;opacity:0.8;}
#gta-dealer .gta-dealer-msg{font-size:13px;color:#ffb3a0;min-height:18px;}
#gta-dealer .gta-dealer-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
#gta-dealer .gta-dealer-card{
  display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:10px;min-width:0;box-sizing:border-box;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);
}
#gta-dealer .gta-dealer-thumb{display:flex;justify-content:center;align-items:center;height:56px;}
#gta-dealer .gta-dealer-name{font-size:14px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-dealer .gta-dealer-price{font-size:14px;font-weight:700;color:#ffd23f;}
#gta-dealer .gta-dealer-fee{font-size:12px;opacity:0.85;}
#gta-dealer .gta-dealer-blurb{font-size:12px;opacity:0.8;}
#gta-dealer .gta-dealer-cardnote{font-size:12px;color:#ffb3a0;}
#gta-dealer .gta-dealer-card .gta-dealer-btn{width:100%;margin-top:auto;}
`;

export function createDealerUi(ui: HTMLElement, deps: DealerUiDeps): DealerUi {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-dealer';

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-dealer-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-dealer-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  ui.appendChild(root);

  let isOpen = false;
  let dealer: DealerDef | null = null;
  let coverOn = false;
  let message = '';

  // Touches and clicks on the sheet must not reach the game underneath (stick, camera drag, pointer lock).
  backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  function el(tag: string, cls?: string): HTMLElement {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function cardEl(card: DealerCard): HTMLElement {
    const c = el('div', 'gta-dealer-card');

    const thumb = el('div', 'gta-dealer-thumb');
    thumb.appendChild(prefabIconElement(card.prefab, '🚜', 56));
    c.appendChild(thumb);

    const name = el('div', 'gta-dealer-name');
    name.textContent = card.name;
    c.appendChild(name);

    const price = el('div', 'gta-dealer-price');
    price.textContent = `${card.price} 🌰`;
    c.appendChild(price);

    if (coverOn) {
      const fee = el('div', 'gta-dealer-fee');
      fee.textContent = `+ ${deps.insuranceFee(card.price)} cover`;
      c.appendChild(fee);
    }

    const blurb = el('div', 'gta-dealer-blurb');
    blurb.textContent = card.blurb;
    c.appendChild(blurb);

    if (card.note) {
      const note = el('div', 'gta-dealer-cardnote');
      note.textContent = card.note;
      c.appendChild(note);
    }

    const buy = el('button', 'gta-dealer-btn') as HTMLButtonElement;
    buy.type = 'button';
    buy.textContent = 'Buy';
    if (card.note) {
      buy.disabled = true;
    } else {
      buy.addEventListener('click', () => {
        if (!dealer) return;
        const err = deps.buy(dealer, card.id, coverOn);
        if (err) {
          message = err;
          render();
        } else {
          close();
        }
      });
    }
    c.appendChild(buy);
    return c;
  }

  function render(): void {
    if (!isOpen || !dealer) return;
    const d = dealer;
    modal.replaceChildren();

    const head = el('div', 'gta-dealer-head');
    const titles = el('div');
    const h = el('h2', 'gta-dealer-title');
    h.textContent = d.name;
    titles.appendChild(h);
    const sub = el('div', 'gta-dealer-sub');
    sub.textContent = `${d.keeper} · You have ${deps.acorns()} 🌰`;
    titles.appendChild(sub);
    head.appendChild(titles);

    const closeBtn = el('button', 'gta-dealer-close') as HTMLButtonElement;
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => close());
    head.appendChild(closeBtn);
    modal.appendChild(head);

    const toggle = el('button', 'gta-dealer-btn gta-dealer-toggle') as HTMLButtonElement;
    toggle.type = 'button';
    toggle.setAttribute('aria-pressed', coverOn ? 'true' : 'false');
    toggle.textContent = `🛡 Kiln-Shield cover: ${coverOn ? 'on' : 'off'}`;
    toggle.addEventListener('click', () => {
      coverOn = !coverOn;
      message = '';
      render();
    });
    modal.appendChild(toggle);

    const coverNote = el('div', 'gta-dealer-cover');
    coverNote.textContent = 'Cover lets you reclaim a written-off vehicle for 25 % of its price.';
    modal.appendChild(coverNote);

    const msg = el('div', 'gta-dealer-msg');
    msg.setAttribute('role', 'status');
    msg.textContent = message;
    modal.appendChild(msg);

    const grid = el('div', 'gta-dealer-grid');
    for (const card of deps.cards(d)) grid.appendChild(cardEl(card));
    modal.appendChild(grid);
  }

  function onKey(e: KeyboardEvent): void {
    if (!isOpen) return;
    if (e.code !== KEYS.close) return;
    e.stopImmediatePropagation();
    close();
  }

  function open(d: DealerDef): void {
    const was = isOpen;
    dealer = d;
    coverOn = false;
    message = '';
    isOpen = true;
    backdrop.classList.add('open');
    render();
    if (!was) deps.onOpenChange?.(true);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('open');
    modal.replaceChildren();
    deps.onOpenChange?.(false);
  }

  window.addEventListener('keydown', onKey);

  return {
    open,
    close,
    isOpen: () => isOpen,
    refresh: () => render(),
  };
}
