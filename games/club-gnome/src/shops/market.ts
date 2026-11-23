// The Gnome Market (Marjoram Crate): gear for acorns.
import { openPanel, type PanelCtx } from '../panel';
import { MARKET_ITEMS } from './catalog';
import { renderShop } from './shopGrid';

/** Opens the market panel. */
export function openMarket(ctx: PanelCtx): void {
  let unsub: () => void = () => {};
  const panel = openPanel(ctx.ui, {
    title: 'Gnome Market',
    subtitle: "Marjoram Crate: 'Fresh in today. Well, this week.'",
    onClose: () => unsub(),
  });
  unsub = renderShop(ctx, panel, {
    items: MARKET_ITEMS,
    currency: 'acorns',
    keeperId: 'marjoram-crate',
    thanks: [
      'Sold! Wear it in good health.',
      'Good taste. Don\'t let it get muddy.',
      'Another happy gnome. Come back soon.',
    ],
    hint: 'Try things on in the dressing room at the back.',
  });
}
