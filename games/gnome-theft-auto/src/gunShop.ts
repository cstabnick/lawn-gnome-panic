// The Ammu-Gnation shop sheet: pick a weapon, browse its mod slots, see the stats change, test-fire, then Buy & Fit.
// Full-screen like the Pay 'n' Glaze sheet (reuses its CSS and widgets from glazeUi.ts). Reads and writes gunModStore.ts.
import { prefabIconElement } from '@lawn/prefabs';
import { BRANDS } from './brands';
import { GUNS, GUN_ORDER } from './config';
import { GLAZE_CSS, optionGrid, sectionLabel } from './glazeUi';
import {
  AIM, MOD_SLOTS, SLOT_ICONS, SLOT_NAMES, getMod, loadoutCost, loadoutIds, moddedGun, modsFor, slotsFor,
  type GunLoadout, type ModdedGun, type ModSlot,
} from './gunMods';
import { buyMods, fitLoadout, fittedLoadout, ownedMods } from './gunModStore';
import type { GunKind, Hud, Sfx } from './types';

export interface GunFit {
  gun: GunKind;
  /** Mod ids bought by this order (empty when only re-fitting owned mods). */
  bought: string[];
  /** Acorns this order cost. */
  spent: number;
  /** What is fitted on the gun now. */
  loadout: GunLoadout;
}

export interface GunShopDeps {
  acorns(): number;
  /** Take Acorns from the wallet; false when the player cannot pay. */
  spend(amount: number, reason: string): boolean;
  play(sfx: Sfx): void;
  /** Show this gun wearing these mods on the display (called on open and after every change in the sheet). */
  preview(gun: GunKind, loadout: GunLoadout): void;
  /** Play one shot of this gun as these mods would make it sound. */
  testFire(gun: GunKind, loadout: GunLoadout): void;
  /** An order went through: the wallet was charged and gunModStore saved (buyMods + fitLoadout). */
  onFit(info: GunFit): void;
  /** The sheet closed (Done, the close button or Escape). */
  onClose(): void;
}

export interface GunShop {
  /** Open on a weapon (its tab selected, its fitted loadout as the draft). */
  open(gun: GunKind): void;
  /** Close without buying: the draft is dropped. Calls deps.onClose. */
  close(): void;
  isOpen(): boolean;
}

const STYLE_ID = 'gta-ammu-style';
const ROOT_ID = 'gta-ammu';

/** Overrides on top of the glaze sheet CSS (which is re-scoped under #gta-ammu). */
const AMMU_CSS = `
#gta-ammu .gz-tab.active,#gta-ammu .gz-btn-buy{background:#ff7a1a;color:#1a1008;border-color:#ff7a1a;}
#gta-ammu .gz-title{color:#ff7a1a;}
#gta-ammu .am-stats{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:12px;margin-bottom:8px;}
#gta-ammu .am-row{display:flex;justify-content:space-between;align-items:baseline;gap:6px;min-width:0;}
#gta-ammu .am-lab{opacity:0.8;white-space:nowrap;}
#gta-ammu .am-val{white-space:nowrap;}
#gta-ammu .am-up{color:#7be08a;margin-left:4px;}
#gta-ammu .am-down{color:#ff7a7a;margin-left:4px;}
`;

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GLAZE_CSS.split('#gta-glaze').join('#gta-ammu') + AMMU_CSS;
  document.head.appendChild(style);
}

const SOUND_NAMES: Record<string, string> = {
  stock: 'Stock', suppressed: 'Suppressed', heavy: 'Heavy', kazoo: 'Kazoo', squeak: 'Squeaky duck',
};

interface StatRow {
  label: string;
  /** The number an arrow compares; null = no arrow (the row is text only). */
  val: ((m: ModdedGun) => number) | null;
  text(m: ModdedGun): string;
  /** True when a bigger number is better (else smaller is better). */
  upBetter: boolean;
}

const STAT_ROWS: readonly StatRow[] = [
  { label: 'Damage', val: (m) => m.damage, text: (m) => `x${m.damage.toFixed(2)}`, upBetter: true },
  { label: 'Fire rate', val: (m) => m.rate, text: (m) => `${m.rate.toFixed(1)}/s`, upBetter: true },
  { label: 'Accuracy', val: (m) => m.spread, text: (m) => `±${(m.spread * 57.3).toFixed(2)}°`, upBetter: false },
  { label: 'Range', val: (m) => m.range, text: (m) => `${Math.round(m.range)} m`, upBetter: true },
  { label: 'Magazine', val: (m) => m.mag, text: (m) => `${m.mag}`, upBetter: true },
  { label: 'Reload', val: (m) => m.reload, text: (m) => `${m.reload.toFixed(2)} s`, upBetter: false },
  { label: 'Recoil', val: (m) => m.recoil, text: (m) => m.recoil.toFixed(3), upBetter: false },
  { label: 'Aim zoom', val: (m) => AIM.zoom * m.zoom, text: (m) => `x${(AIM.zoom * m.zoom).toFixed(1)}`, upBetter: true },
  { label: 'Sound', val: null, text: (m) => SOUND_NAMES[m.sound] ?? m.sound, upBetter: true },
];

/** The thumbnail on a mod card: its prefab, or a colour chip for a finish. Null for Stock. */
function thumbFor(id: string, slot: ModSlot): HTMLElement | null {
  if (id === 'none') return null;
  const mod = getMod(id);
  if (!mod) return null;
  if (mod.prefab) return prefabIconElement(mod.prefab, SLOT_ICONS[slot], 40);
  if (mod.finish) {
    const chip = document.createElement('span');
    chip.style.cssText = `display:inline-block;width:40px;height:40px;border-radius:8px;background:#${mod.finish.color.toString(16).padStart(6, '0')};`;
    return chip;
  }
  return null;
}

export function createGunShop(ui: HTMLElement, hud: Hud, deps: GunShopDeps): GunShop {
  injectStyle();

  let opened = false;
  let gun: GunKind = GUN_ORDER[0];
  let draft: GunLoadout = {};

  const root = document.createElement('div');
  root.id = ROOT_ID;

  const frame = document.createElement('div');
  frame.className = 'gz-frame';
  frame.style.display = 'none';
  frame.setAttribute('role', 'dialog');
  frame.setAttribute('aria-modal', 'true');
  frame.setAttribute('aria-label', 'Ammu-Gnation gun shop');

  // Head
  const head = document.createElement('div');
  head.className = 'gz-head';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'gz-title';
  title.textContent = 'Ammu-Gnation';
  const slogan = document.createElement('div');
  slogan.style.cssText = 'font-size:12px;opacity:0.78;margin-top:2px;';
  slogan.textContent = BRANDS['ammu-gnation'].slogan;
  titleWrap.append(title, slogan);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gz-btn gz-btn-ghost';
  closeBtn.setAttribute('aria-label', 'Close Ammu-Gnation');
  closeBtn.textContent = '✕';
  head.append(titleWrap, closeBtn);

  // Weapon tabs
  const tabsEl = document.createElement('div');
  tabsEl.className = 'gz-tabs';
  const tabButtons: { kind: GunKind; btn: HTMLButtonElement }[] = [];
  for (const k of GUN_ORDER) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-tab';
    btn.append(prefabIconElement(GUNS[k].prefab, '🔫', 22), GUNS[k].name);
    btn.addEventListener('click', () => selectGun(k));
    tabButtons.push({ kind: k, btn });
    tabsEl.appendChild(btn);
  }

  // Body
  const bodyEl = document.createElement('div');
  bodyEl.className = 'gz-body';
  let statsEl: HTMLElement = document.createElement('div');

  // Foot
  const foot = document.createElement('div');
  foot.className = 'gz-foot';
  const priceEl = document.createElement('div');
  priceEl.className = 'gz-price';
  const priceLines = document.createElement('div');
  priceLines.className = 'gz-price-lines';
  priceLines.style.cssText = 'flex:0 0 100%;font-size:11px;opacity:0.74;line-height:1.3;';
  const priceWrap = document.createElement('div');
  priceWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;min-width:0;';
  priceWrap.append(priceEl, priceLines);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;';
  const testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.className = 'gz-btn gz-btn-ghost';
  testBtn.textContent = '🔊 Test fire';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'gz-btn gz-btn-ghost';
  resetBtn.textContent = 'Reset';
  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'gz-btn gz-btn-buy';
  buyBtn.textContent = 'Buy & Fit';
  btnRow.append(testBtn, resetBtn, buyBtn);
  foot.append(priceWrap, btnRow);

  frame.append(head, tabsEl, bodyEl, foot);
  root.appendChild(frame);
  ui.appendChild(root);

  // The sheet is modal for input: pointer and touch must not reach the game behind it.
  frame.addEventListener('pointerdown', (e) => e.stopPropagation());
  frame.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function markTabs(): void {
    for (const t of tabButtons) {
      const on = t.kind === gun;
      t.btn.classList.toggle('active', on);
      t.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  /** Stock -> draft for every stat row, with a green up or red down arrow when the draft is better or worse. */
  function renderStats(): void {
    const stock = moddedGun(gun, {});
    const now = moddedGun(gun, draft);
    statsEl.innerHTML = '';
    for (const r of STAT_ROWS) {
      const row = document.createElement('div');
      row.className = 'am-row';
      const lab = document.createElement('span');
      lab.className = 'am-lab';
      lab.textContent = r.label;
      const val = document.createElement('span');
      val.className = 'am-val';
      val.textContent = `${r.text(stock)} -> ${r.text(now)}`;
      row.append(lab, val);
      if (r.val) {
        const s = r.val(stock);
        const d = r.val(now);
        if (Math.abs(d - s) > 1e-9) {
          const better = r.upBetter ? d > s : d < s;
          const arrow = document.createElement('span');
          arrow.className = better ? 'am-up' : 'am-down';
          arrow.textContent = better ? '▲' : '▼';
          val.appendChild(arrow);
        }
      }
      statsEl.appendChild(row);
    }
  }

  function refreshPrice(): void {
    if (!opened) return;
    const owned = ownedMods(gun);
    const cost = loadoutCost(owned, draft);
    const acorns = deps.acorns();
    priceEl.textContent = `Total ${cost} 🌰 (you have ${acorns})`;
    const lines = loadoutIds(draft)
      .filter((id) => !owned.has(id))
      .map((id) => {
        const m = getMod(id);
        return m ? `${m.name} ${m.price} 🌰` : '';
      })
      .filter((s) => s !== '');
    priceLines.textContent = lines.length === 0 ? 'Nothing to pay for yet.' : lines.join(' · ');

    const fitted = fittedLoadout(gun);
    const same = MOD_SLOTS.every((s) => (draft[s] ?? '') === (fitted[s] ?? ''));
    buyBtn.textContent = cost > 0 ? 'Buy & Fit' : 'Fit';
    buyBtn.disabled = same || cost > acorns;
  }

  /** Rebuild the stats and one card row per slot for the selected gun. */
  function buildBody(): void {
    bodyEl.innerHTML = '';
    bodyEl.appendChild(sectionLabel('Stats'));
    statsEl = document.createElement('div');
    statsEl.className = 'am-stats';
    bodyEl.appendChild(statsEl);

    const owned = ownedMods(gun);
    const fitted = fittedLoadout(gun);
    for (const slot of slotsFor(gun)) {
      bodyEl.appendChild(sectionLabel(`${SLOT_ICONS[slot]} ${SLOT_NAMES[slot]}`));
      const items = [
        { id: 'none', name: 'Stock', blurb: 'Nothing bolted on.', price: 0 },
        ...modsFor(gun, slot).map((m) => ({ id: m.id, name: m.name, blurb: m.blurb, price: m.price })),
      ];
      const grid = optionGrid<string>({
        items,
        value: draft[slot] ?? 'none',
        onPick(id) {
          if (id === 'none') delete draft[slot];
          else draft[slot] = id;
          renderStats();
          refreshPrice();
          deps.preview(gun, { ...draft });
        },
        thumb: (id) => thumbFor(id, slot),
      });
      // Owned and fitted marks go on the price line of each card (same order as items).
      const prices = grid.el.querySelectorAll<HTMLElement>('.gz-card-price');
      items.forEach((it, i) => {
        const span = prices[i];
        if (it.id === 'none' || !span) return;
        if (fitted[slot] === it.id) span.textContent = 'Fitted';
        else if (owned.has(it.id)) span.textContent = 'Owned';
      });
      bodyEl.appendChild(grid.el);
    }
    renderStats();
  }

  /** Select a weapon: its fitted loadout becomes the draft, and the display shows it. */
  function selectGun(g: GunKind): void {
    gun = g;
    draft = fittedLoadout(g);
    markTabs();
    buildBody();
    deps.preview(g, { ...draft });
    refreshPrice();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === 'Escape' && opened) close();
  }

  function open(g: GunKind): void {
    if (opened) close();
    opened = true;
    frame.style.display = '';
    selectGun(g);
    if (document.pointerLockElement) document.exitPointerLock();
    window.addEventListener('keydown', onKeydown);
  }

  function close(): void {
    if (!opened) return;
    opened = false;
    window.removeEventListener('keydown', onKeydown);
    frame.style.display = 'none';
    bodyEl.innerHTML = '';
    draft = {};
    deps.onClose();
  }

  closeBtn.addEventListener('click', () => close());

  testBtn.addEventListener('click', () => {
    if (!opened) return;
    deps.testFire(gun, { ...draft });
  });

  resetBtn.addEventListener('click', () => {
    if (!opened) return;
    draft = fittedLoadout(gun);
    buildBody();
    deps.preview(gun, { ...draft });
    refreshPrice();
  });

  buyBtn.addEventListener('click', () => {
    if (!opened) return;
    const owned = ownedMods(gun);
    const cost = loadoutCost(owned, draft);
    if (cost > 0 && !deps.spend(cost, 'Ammu-Gnation')) {
      hud.toast('Ammu-Gnation: not enough Acorns.');
      deps.play('alarm');
      return;
    }
    // Work out what is new before buying (buyMods adds to the owned set in place).
    const bought = loadoutIds(draft).filter((id) => !owned.has(id));
    buyMods(gun, bought);
    fitLoadout(gun, draft);
    deps.play('reload');
    hud.toast(bought.length > 0 ? 'AMMU-GNATION: Bolted on.' : 'Fitted.');
    buildBody();
    refreshPrice();
    deps.onFit({ gun, bought, spent: cost, loadout: fittedLoadout(gun) });
  });

  return {
    open,
    close,
    isOpen: () => opened,
  };
}
