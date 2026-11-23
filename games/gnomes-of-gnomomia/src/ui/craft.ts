// Reforging panel at a reforging anvil.
import { bus } from '../events';
import { player } from '../player';
import { ITEMS, OBJECTS } from '../content';
import { UI, type Rarity } from '../config';
import { itemIcon } from '../itemArt';
import { craft, craftCheck, isCraftStation, recipesAt } from '../crafting';
import type { RecipeDef } from '../raidTypes';

/** Item name colours by rarity (as in ui/shop.ts). */
const RARITY_COLOR: Record<Rarity, string> = {
  plain: '#ffffff',
  sprouted: '#7bd96b',
  blooming: '#6fb7ff',
  heirloom: '#c58cff',
  kilnfired: '#ff9e3d',
};

/** Walking further than this from the anvil closes the panel. */
const ANVIL_RANGE = 6;

let win: HTMLDivElement | null = null;
let titleEl: HTMLDivElement | null = null;
let listEl: HTMLDivElement | null = null;
/** The anvil whose panel is open, or null when closed. */
let openStation: string | null = null;
let distanceTimer: number | null = null;

/** Builds the hidden reforging window and wires it to the anvils. */
export function createCraftUi(root: HTMLElement): void {
  win = document.createElement('div');
  Object.assign(win.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(440px, 94vw)',
    boxSizing: 'border-box',
    padding: '12px',
    background: UI.panelBg,
    border: `2px solid ${UI.border}`,
    color: UI.text,
    fontFamily: UI.font,
    pointerEvents: 'auto',
    display: 'none',
  });

  const top = document.createElement('div');
  Object.assign(top.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
  titleEl = document.createElement('div');
  Object.assign(titleEl.style, { color: UI.gold, fontSize: '16px', fontWeight: 'bold' });
  const closeBtn = document.createElement('div');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, {
    minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box', color: UI.textDim, cursor: 'pointer', fontSize: '18px',
  });
  closeBtn.addEventListener('click', () => closeCraft());
  top.append(titleEl, closeBtn);
  win.appendChild(top);

  listEl = document.createElement('div');
  Object.assign(listEl.style, { display: 'flex', flexDirection: 'column', gap: '6px' });
  win.appendChild(listEl);

  root.appendChild(win);

  bus.on('interacted', ({ objectId }) => {
    if (isCraftStation(objectId)) openCraft(objectId);
  });
  bus.on('changed', () => {
    if (openStation !== null) render();
  });
  bus.on('zone-changed', () => closeCraft());
}

/** Shows the recipes of a reforging anvil (an OBJECTS id). */
export function openCraft(stationId: string): void {
  if (!win || !titleEl) return;
  openStation = stationId;
  titleEl.textContent = OBJECTS[stationId]?.name ?? 'Reforging';
  win.style.display = 'block';
  render();
  if (distanceTimer === null) distanceTimer = window.setInterval(checkDistance, 500);
}

export function closeCraft(): void {
  openStation = null;
  if (win) win.style.display = 'none';
  if (distanceTimer !== null) {
    window.clearInterval(distanceTimer);
    distanceTimer = null;
  }
}

function checkDistance(): void {
  if (openStation === null) return;
  const anvil = OBJECTS[openStation];
  if (!anvil) {
    closeCraft();
    return;
  }
  const d = Math.hypot(anvil.x - player.position.x, anvil.z - player.position.z);
  if (d > ANVIL_RANGE) closeCraft();
}

/** Rebuilds the recipe rows from the current state. */
function render(): void {
  if (openStation === null || !listEl) return;
  listEl.replaceChildren();
  const recipes = recipesAt(openStation);
  if (recipes.length === 0) {
    const none = document.createElement('div');
    none.textContent = 'Nothing to reforge here. Bring horn-marked gear from a horn call.';
    Object.assign(none.style, { color: UI.textDim, padding: '6px 0' });
    listEl.appendChild(none);
    return;
  }
  for (const recipe of recipes) listEl.appendChild(recipeRow(recipe));
}

function recipeRow(recipe: RecipeDef): HTMLDivElement {
  const item = ITEMS[recipe.makes];
  const check = craftCheck(recipe);

  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    padding: '6px',
    background: UI.panelBgDark,
    border: `1px solid ${UI.borderLight}`,
  });

  if (item) row.appendChild(itemIcon(item, 30));

  const info = document.createElement('div');
  Object.assign(info.style, { flex: '1 1 160px', minWidth: '0', fontSize: '12px' });
  const name = document.createElement('div');
  name.textContent = item?.name ?? recipe.makes;
  Object.assign(name.style, { color: RARITY_COLOR[item?.rarity ?? 'plain'], fontWeight: 'bold' });
  const needs = document.createElement('div');
  needs.textContent = needsLine(recipe);
  Object.assign(needs.style, { color: UI.textDim });
  info.append(name, needs);
  if (!check.ok && check.why) {
    const why = document.createElement('div');
    why.textContent = check.why;
    why.style.color = UI.bad;
    info.appendChild(why);
  }
  row.appendChild(info);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Reforge';
  Object.assign(btn.style, {
    minWidth: '96px',
    minHeight: '44px',
    padding: '0 10px',
    boxSizing: 'border-box',
    background: UI.panelBg,
    border: `1px solid ${UI.borderLight}`,
    color: UI.gold,
    fontFamily: UI.font,
    fontSize: '14px',
    cursor: 'pointer',
    opacity: check.ok ? '1' : '0.5',
  });
  btn.addEventListener('click', () => {
    craft(recipe.id);
    render();
  });
  row.appendChild(btn);

  return row;
}

/** "Needs: 2 x Warden Cloak, Hood + 40 coins". */
function needsLine(recipe: RecipeDef): string {
  const parts = recipe.needs.map((n) => `${n.count > 1 ? `${n.count} x ` : ''}${ITEMS[n.item]?.name ?? n.item}`);
  if (recipe.gold > 0) parts.push(`${recipe.gold} coins`);
  return `Needs: ${parts.join(' + ') || 'nothing'}`;
}
