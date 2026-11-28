import { getShopItemForArea, SHOP_ITEMS, type ShopCosmeticItem } from '../data/shop';
import type { ProgressState } from '../game/events';
import type { GsrLevelId } from '../levels/loader';

export interface ShopModalHandle {
  open(areaId: GsrLevelId, progress: ProgressState): void;
  close(): void;
  isOpen(): boolean;
}

export function createShopModal(
  container: HTMLElement,
  opts: {
    onBuy: (item: ShopCosmeticItem) => void;
    onEquip: (item: ShopCosmeticItem | null, category: 'trail' | 'ride') => void;
  },
): ShopModalHandle {
  const modal = document.createElement('div');
  modal.id = 'gsr-shop-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:55; display:none; align-items:center; justify-content:center;
    background:rgba(10,4,22,0.88); padding:max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
    pointer-events:auto; font-family:system-ui,sans-serif;
  `;
  container.appendChild(modal);

  let openState = false;
  let currentArea: GsrLevelId = 'velvet-keys';
  let currentProgress: ProgressState | null = null;

  function render(): void {
    if (!currentProgress) return;
    const p = currentProgress;
    const featured = getShopItemForArea(currentArea);
    const tier9Cleared = p.completedAreas.includes('zero-hz-zenith');

    const renderItemCard = (item: ShopCosmeticItem, highlight = false) => {
      const owned = p.ownedCosmetics.includes(item.id) || (item.requiresTier9Clear && tier9Cleared);
      const equipped =
        (item.category === 'trail' && p.equippedTrail === item.id) ||
        (item.category === 'ride' && p.equippedRide === item.id);
      const lockedTier9 = !!item.requiresTier9Clear && !tier9Cleared;
      const canAfford = p.tokens >= item.cost;

      let btnHtml = '';
      if (equipped) {
        btnHtml = `<button class="gsr-shop-btn" data-act="unequip" data-cat="${item.category}" style="min-height:44px;padding:6px 12px;border-radius:10px;border:2px solid #ffd740;background:#ffd740;color:#120624;font-weight:900;cursor:pointer;">✓ Equipped (Unequip)</button>`;
      } else if (owned) {
        btnHtml = `<button class="gsr-shop-btn" data-act="equip" data-id="${item.id}" style="min-height:44px;padding:6px 12px;border-radius:10px;border:2px solid #00e5ff;background:#00e5ff;color:#120624;font-weight:900;cursor:pointer;">Equip</button>`;
      } else if (lockedTier9) {
        btnHtml = `<button disabled style="min-height:44px;padding:6px 12px;border-radius:10px;border:2px solid #554275;background:#1a0d30;color:#9e8bb8;font-weight:800;">🔒 Beat Tier 9 Boss</button>`;
      } else {
        btnHtml = `<button class="gsr-shop-btn" data-act="buy" data-id="${item.id}" ${canAfford ? '' : 'disabled'} style="min-height:44px;padding:6px 12px;border-radius:10px;border:2px solid ${canAfford ? '#69f0ae' : '#554275'};background:${canAfford ? '#69f0ae' : '#1a0d30'};color:${canAfford ? '#120624' : '#9e8bb8'};font-weight:900;cursor:${canAfford ? 'pointer' : 'not-allowed'};">Buy · ${item.cost} 🪙</button>`;
      }

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:${highlight ? 'rgba(255,78,205,0.14)' : 'rgba(255,255,255,0.05)'};border:2px solid ${highlight ? item.color : '#3a275e'};">
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${item.color};box-shadow:0 0 8px ${item.color};"></span>
              <span style="font-weight:900;color:#fff;font-size:14px;">${item.name}</span>
              <span style="font-size:10px;font-weight:800;color:#00e5ff;text-transform:uppercase;">${item.category}</span>
            </div>
            <div style="font-size:12px;color:#d6c8eb;margin-top:2px;">${item.description}</div>
          </div>
          ${btnHtml}
        </div>
      `;
    };

    modal.innerHTML = `
      <div style="width:min(540px, 96vw);max-height:88vh;display:flex;flex-direction:column;gap:10px;background:#180b2e;border:3px solid #00e5ff;border-radius:16px;padding:16px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.85);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <div>
            <div style="font-size:11px;font-weight:900;color:#00e5ff;letter-spacing:1px;">ARCHIPELAGO GEAR SHOP</div>
            <div style="font-size:20px;font-weight:900;color:#ffd740;">🪙 ${p.tokens.toLocaleString()} TOKENS</div>
          </div>
          <button id="gsr-shop-close" style="min-height:44px;min-width:44px;padding:8px 14px;border-radius:10px;border:2px solid #ff4ecd;background:#241145;color:#fff;font-weight:900;cursor:pointer;">✕ Close</button>
        </div>
        <div style="font-size:12px;font-weight:800;color:#ff4ecd;letter-spacing:0.5px;">THIS WORLD'S SPECIAL</div>
        ${renderItemCard(featured, true)}
        <div style="font-size:12px;font-weight:800;color:#69f0ae;letter-spacing:0.5px;margin-top:4px;">ALL WORLD COSMETICS & WARDROBE</div>
        <div style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px;max-height:44vh;">
          ${SHOP_ITEMS.filter((it) => it.id !== featured.id).map((it) => renderItemCard(it, false)).join('')}
        </div>
      </div>
    `;

    modal.querySelector('#gsr-shop-close')?.addEventListener('click', () => close());
    modal.querySelectorAll<HTMLButtonElement>('.gsr-shop-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'unequip') {
          const cat = btn.dataset.cat as 'trail' | 'ride';
          opts.onEquip(null, cat);
          render();
          return;
        }
        const item = SHOP_ITEMS.find((i) => i.id === btn.dataset.id);
        if (!item) return;
        if (act === 'buy') opts.onBuy(item);
        else if (act === 'equip') opts.onEquip(item, item.category);
        render();
      });
    });
  }

  function open(areaId: GsrLevelId, progress: ProgressState): void {
    currentArea = areaId;
    currentProgress = progress;
    openState = true;
    modal.style.display = 'flex';
    render();
  }

  function close(): void {
    openState = false;
    modal.style.display = 'none';
  }

  return {
    open,
    close,
    isOpen: () => openState,
  };
}
