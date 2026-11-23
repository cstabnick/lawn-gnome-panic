// The item-card grid shared by the Gnomecino Prize Counter and the Gnome Market: a live balance, one card per item,
// two-tap buying, and a repair pass that re-unlocks the achievement of anything already owned.
import { prefabIconElement } from '@lawn/prefabs';
import { buyItem, getAcorns, getChips, onOakcountChange, owns } from '@lawn/oakcount';
import { onShopBuy } from '../achievements';
import type { NpcDef } from '../config';
import type { Panel, PanelCtx } from '../panel';
import type { ShopItem } from './catalog';

export interface ShopOptions {
  items: readonly ShopItem[];
  currency: 'acorns' | 'chips';
  /** The NpcDef id of the shopkeeper who speaks the thank-you lines. */
  keeperId: string;
  /** Thank-you lines, used in turn after each purchase. */
  thanks: string[];
  /** Small text under the balance. */
  hint: string;
}

const STYLE_ID = 'cg-shop-style';
const CSS = `
.cgs-balance{margin:6px 0 2px;font-size:18px;font-weight:700;}
.cgs-hint{margin:0 0 10px;font-size:13px;color:#5a4632;}
.cgs-grid{display:grid;grid-template-columns:1fr;gap:10px;}
@media (min-width:560px){.cgs-grid{grid-template-columns:1fr 1fr;}}
.cgs-card{position:relative;display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;background:#fffaf0;border:1px solid #d9c7a4;box-sizing:border-box;}
.cgs-icon{flex:none;width:56px;height:56px;display:flex;align-items:center;justify-content:center;}
.cgs-emoji{font-size:40px;line-height:56px;text-align:center;}
.cgs-info{flex:1;min-width:0;}
.cgs-name{font-weight:700;font-size:15px;line-height:1.25;}
.cgs-slot{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#7a5a36;}
.cgs-blurb{margin:2px 0 4px;font-size:13px;line-height:1.3;color:#5a4632;}
.cgs-price{font-size:14px;font-weight:600;}
.cgs-buy{flex:none;white-space:nowrap;}
.cgs-placard{border:2px dashed #7a5a36;background:transparent;}
.cgs-ribbon{position:absolute;top:6px;right:6px;padding:2px 6px;border-radius:6px;background:#7a5a36;color:#fff;font-size:10px;font-weight:700;letter-spacing:.05em;}
.cgs-soon-head{margin:16px 0 8px;font-size:16px;}
`;

const SLOT_WORD: Record<string, string> = { head: 'Head', neck: 'Neck', back: 'Back', hand: 'Hand' };
const CONFIRM_MS = 4000;

/** The word shown for an equipment slot ("Head", "Neck", "Back", "Hand"). */
export function slotWord(slot: string): string {
  return SLOT_WORD[slot] ?? slot.charAt(0).toUpperCase() + slot.slice(1);
}

/** A DOM element with a class and optional text. */
export function makeEl(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Renders the balance, the hint and the item cards into panel.body. Returns an unsubscribe to call when the panel
 * closes.
 */
export function renderShop(ctx: PanelCtx, panel: Panel, opts: ShopOptions): () => void {
  injectStyle();
  const sym = opts.currency === 'acorns' ? '🌰' : '🪙';
  const balance = (): number => (opts.currency === 'acorns' ? getAcorns() : getChips());

  const root = document.createElement('div');
  const balLine = makeEl('p', 'cgs-balance');
  const hint = makeEl('p', 'cgs-hint', opts.hint);
  const grid = makeEl('div', 'cgs-grid');
  root.append(balLine, hint, grid);
  panel.body.appendChild(root);

  let closed = false;
  let armedId: string | null = null;
  let armTimer: number | undefined;
  let thankIdx = 0;

  const disarm = (): void => {
    armedId = null;
    if (armTimer !== undefined) {
      clearTimeout(armTimer);
      armTimer = undefined;
    }
  };

  const onTap = async (item: ShopItem): Promise<void> => {
    if (closed) return;
    if (armedId !== item.id) {
      disarm();
      armedId = item.id;
      armTimer = window.setTimeout(() => {
        disarm();
        render();
      }, CONFIRM_MS);
      render();
      return;
    }
    disarm();
    if (!buyItem(item.id, item.price, opts.currency)) {
      ctx.system(`You could not buy the ${item.name} just now.`);
      render();
      return;
    }
    await onShopBuy(item.achievementId);
    if (closed) return;
    if (opts.thanks.length > 0) {
      ctx.npcSay(opts.keeperId as NpcDef['id'], opts.thanks[thankIdx % opts.thanks.length]);
      thankIdx++;
    }
    ctx.system(`You bought the ${item.name}! Wear it in the dressing room on Acorn Row or in the Gnome Creator.`);
    render();
  };

  const card = (item: ShopItem, bal: number): HTMLElement => {
    const el = makeEl('div', 'cgs-card');
    const icon = makeEl('div', 'cgs-icon');
    icon.appendChild(prefabIconElement(item.prefabId, '🎁', 56));
    const info = makeEl('div', 'cgs-info');
    info.append(
      makeEl('div', 'cgs-name', item.name),
      makeEl('div', 'cgs-slot', slotWord(item.slot)),
      makeEl('div', 'cgs-blurb', item.blurb),
      makeEl('div', 'cgs-price', `${sym} ${fmt(item.price)}`),
    );
    const btn = document.createElement('button');
    btn.className = 'cgp-btn cgs-buy';
    btn.type = 'button';
    if (owns(item.id)) {
      btn.textContent = 'Owned ✓';
      btn.disabled = true;
    } else if (bal < item.price) {
      btn.textContent = `Need ${fmt(item.price - bal)} more`;
      btn.disabled = true;
    } else if (armedId === item.id) {
      btn.textContent = 'Tap again to buy';
    } else {
      btn.textContent = 'Buy';
    }
    btn.addEventListener('click', () => void onTap(item));
    el.append(icon, info, btn);
    return el;
  };

  const render = (): void => {
    if (closed) return;
    const bal = balance();
    balLine.textContent = `${sym} ${fmt(bal)}`;
    grid.replaceChildren(...opts.items.map((item) => card(item, bal)));
  };

  // Repairs a purchase whose achievement did not save: re-unlocking is a no-op when it is already unlocked.
  for (const item of opts.items) {
    if (owns(item.id)) void onShopBuy(item.achievementId);
  }

  const unsub = onOakcountChange(() => render());
  render();

  return () => {
    closed = true;
    disarm();
    unsub();
  };
}
