// The Gnomecino Prize Counter (Fennel Brassbell): cosmetics for chips, and six "Coming soon" placards.
import { openPanel, type PanelCtx } from '../panel';
import { PRIZE_COMING_SOON, PRIZE_ITEMS, type ComingSoonItem } from './catalog';
import { makeEl, renderShop, slotWord } from './shopGrid';

function placard(p: ComingSoonItem): HTMLElement {
  const card = makeEl('div', 'cgs-card cgs-placard');
  const icon = makeEl('div', 'cgs-icon cgs-emoji', p.icon);
  const info = makeEl('div', 'cgs-info');
  info.append(
    makeEl('div', 'cgs-name', p.name),
    makeEl('div', 'cgs-slot', slotWord(p.slot)),
    makeEl('div', 'cgs-blurb', p.blurb),
  );
  card.append(icon, info, makeEl('span', 'cgs-ribbon', 'COMING SOON'));
  return card;
}

/** Opens the prize counter panel. */
export function openPrizeCounter(ctx: PanelCtx): void {
  let unsub: () => void = () => {};
  const panel = openPanel(ctx.ui, {
    title: 'Prize Counter',
    subtitle: "Fennel Brassbell: 'Chips for prizes, dear. The house loves a winner who spends.'",
    onClose: () => unsub(),
  });
  unsub = renderShop(ctx, panel, {
    items: PRIZE_ITEMS,
    currency: 'chips',
    keeperId: 'fennel-brassbell',
    thanks: [
      'Lovely pick, dear. The house approves.',
      'Wear that out loud. Nobody here is shy.',
      'A winner who spends. My favourite kind.',
    ],
    hint: 'Get chips from the Cashier next door: 1 acorn = 10 chips.',
  });

  const soon = makeEl('h3', 'cgs-soon-head', 'Coming soon');
  const grid = makeEl('div', 'cgs-grid');
  for (const p of PRIZE_COMING_SOON) grid.appendChild(placard(p));
  panel.body.append(soon, grid);
}
