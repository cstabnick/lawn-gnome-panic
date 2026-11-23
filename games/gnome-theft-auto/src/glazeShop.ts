// The Pay 'n' Glaze shop: a full-screen showroom UI (tabs of panels, live price, Buy / Reset / Done) that dresses the player's vehicle as they browse.
// STUB: the shop issue fills createGlazeShop; the shape is final. garages.ts creates it and calls open/close.
import { defaultLoadout, loadoutCost, loadoutCostLines, normalizeLoadout, sameLoadout, type Loadout } from '@lawn/glaze';
import { GLAZE_CSS, type Panel, type PanelCtx } from './glazeUi';
import { paintPanel } from './glazePanelPaint';
import { wheelsPanel } from './glazePanelWheels';
import { lightsPanel } from './glazePanelLights';
import { bodyPanel } from './glazePanelBody';
import { trimPanel } from './glazePanelTrim';
import { ownedLoadout, saveOwnedLoadout } from './glazeStore';
import type { Hud, Sfx, Vehicle, VehicleKind } from './types';

export interface GlazeShopDeps {
  /** Dress a vehicle in a loadout live (vehicles.ts setVehicleLook). */
  setLook(v: Vehicle, look: Loadout): void;
  /** Take Acorns from the wallet; false when the player cannot pay. */
  spend(amount: number, reason: string): boolean;
  acorns(): number;
  play(sfx: Sfx): void;
  /** The shop opened on `v` or closed (null). */
  showroom(v: Vehicle | null): void;
  /** The old Pay 'n' Glaze bay service, now a button in the shop: repair, clear heat, a fresh coat (garages.ts keeps the logic and the 50 acorn price). */
  quickRespray(v: Vehicle): void;
  /** A purchase went through (after the wallet was charged and the loadout saved): lets the game unlock achievements and refresh the driving model. `spent` is this order's price. */
  onPurchase(info: { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }): void;
  /** Open the old handling modal (garages.ts) for this vehicle's model, from the shop's Handling tab. */
  openHandling(v: Vehicle): void;
}

export interface GlazeShop {
  /** Open on a ground vehicle (the one the player drives in the bay). Previews the owned loadout, or the vehicle's current look. */
  open(v: Vehicle): void;
  /** Close without buying: restore the owned loadout on the vehicle. */
  close(): void;
  isOpen(): boolean;
}

const PANELS: readonly Panel[] = [paintPanel, wheelsPanel, lightsPanel, bodyPanel, trimPanel];
const STYLE_ID = 'gta-glaze-style';
const QUICK_RESPRAY_PRICE = 50;

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GLAZE_CSS;
  document.head.appendChild(style);
}

export function createGlazeShop(ui: HTMLElement, hud: Hud, deps: GlazeShopDeps): GlazeShop {
  injectStyle();

  const root = document.createElement('div');
  root.id = 'gta-glaze';

  const frame = document.createElement('div');
  frame.className = 'gz-frame';
  frame.style.display = 'none';
  frame.setAttribute('role', 'dialog');
  frame.setAttribute('aria-modal', 'true');
  frame.setAttribute('aria-label', "Pay 'n' Glaze showroom");

  // Head
  const head = document.createElement('div');
  head.className = 'gz-head';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'gz-title';
  title.textContent = "Pay 'n' Glaze";
  const slogan = document.createElement('div');
  slogan.style.cssText = 'font-size:12px;opacity:0.78;margin-top:2px;';
  slogan.textContent = 'New Coat. Who Dis?';
  titleWrap.append(title, slogan);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gz-btn gz-btn-ghost';
  closeBtn.setAttribute('aria-label', "Close Pay 'n' Glaze");
  closeBtn.textContent = '✕';
  head.append(titleWrap, closeBtn);

  // Tabs
  const tabsEl = document.createElement('div');
  tabsEl.className = 'gz-tabs';
  const tabButtons: HTMLButtonElement[] = [];
  PANELS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-tab';
    btn.textContent = `${p.icon} ${p.label}`;
    btn.addEventListener('click', () => showPanel(i));
    tabButtons.push(btn);
    tabsEl.appendChild(btn);
  });
  const handlingBtn = document.createElement('button');
  handlingBtn.type = 'button';
  handlingBtn.className = 'gz-tab';
  handlingBtn.textContent = '🔧 Handling';
  handlingBtn.addEventListener('click', () => {
    if (current) deps.openHandling(current.v);
  });
  tabsEl.appendChild(handlingBtn);

  // Body and foot
  const bodyEl = document.createElement('div');
  bodyEl.className = 'gz-body';

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
  const quickBtn = document.createElement('button');
  quickBtn.type = 'button';
  quickBtn.className = 'gz-btn gz-btn-ghost';
  quickBtn.textContent = `Quick Respray (${QUICK_RESPRAY_PRICE} 🌰)`;
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'gz-btn gz-btn-ghost';
  resetBtn.textContent = 'Reset';
  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'gz-btn gz-btn-buy';
  buyBtn.textContent = 'Buy';
  btnRow.append(quickBtn, resetBtn, buyBtn);
  foot.append(priceWrap, btnRow);

  frame.append(head, tabsEl, bodyEl, foot);
  root.appendChild(frame);
  ui.appendChild(root);

  // The shop is modal for input: pointer and touch must not reach the game behind it.
  frame.addEventListener('pointerdown', (e) => e.stopPropagation());
  frame.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  interface OpenState {
    v: Vehicle;
    owned: Loadout;
    draft: Loadout;
    built: Map<string, { el: HTMLElement; panel: Panel }>;
    active: number;
  }
  let current: OpenState | null = null;

  function refreshPrice(): void {
    if (!current) return;
    const cost = loadoutCost(current.owned, current.draft);
    priceEl.textContent = `Total ${cost} 🌰 (you have ${deps.acorns()})`;
    const lines = loadoutCostLines(current.owned, current.draft);
    priceLines.textContent = lines.length === 0
      ? 'Nothing to pay for yet.'
      : lines.map((l) => `${l.label} ${l.price} 🌰`).join(' · ');
    priceWrap.title = lines.map((l) => `${l.label}: ${l.price} 🌰`).join('\n');
    buyBtn.disabled = cost === 0 || cost > deps.acorns();
  }

  function refreshPanels(): void {
    if (!current) return;
    for (const { panel } of current.built.values()) panel.refresh?.();
  }

  function refreshAll(): void {
    refreshPrice();
    refreshPanels();
  }

  function patch(p: Partial<Loadout>): void {
    if (!current) return;
    current.draft = normalizeLoadout({ ...current.draft, ...p });
    deps.setLook(current.v, current.draft);
    refreshAll();
  }

  function makeCtx(st: OpenState): PanelCtx {
    return {
      kind: st.v.kind,
      draft: () => st.draft,
      owned: () => st.owned,
      patch,
      acorns: deps.acorns,
    };
  }

  function showPanel(index: number): void {
    const st = current;
    if (!st) return;
    st.active = index;
    PANELS.forEach((panel, i) => {
      let entry = st.built.get(panel.id);
      if (!entry) {
        entry = { el: panel.build(makeCtx(st)), panel };
        entry.el.style.display = 'none';
        st.built.set(panel.id, entry);
        bodyEl.appendChild(entry.el);
      }
      entry.el.style.display = i === index ? '' : 'none';
      tabButtons[i].classList.toggle('active', i === index);
      tabButtons[i].setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    handlingBtn.classList.remove('active');
    st.built.get(PANELS[index].id)?.panel.refresh?.();
    refreshPrice();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === 'Escape' && current) close();
  }

  function open(v: Vehicle): void {
    if (current) close();
    const owned = normalizeLoadout(ownedLoadout(v.kind) ?? v.look ?? defaultLoadout(v.tint));
    const st: OpenState = { v, owned, draft: normalizeLoadout(owned), built: new Map(), active: 0 };
    current = st;
    bodyEl.innerHTML = '';
    deps.setLook(v, st.draft);
    frame.style.display = '';
    deps.showroom(v);
    if (document.pointerLockElement) document.exitPointerLock();
    window.addEventListener('keydown', onKeydown);
    showPanel(0);
    refreshPrice();
  }

  function close(): void {
    const st = current;
    if (!st) return;
    window.removeEventListener('keydown', onKeydown);
    deps.setLook(st.v, st.owned);
    frame.style.display = 'none';
    bodyEl.innerHTML = '';
    current = null;
    deps.showroom(null);
  }

  closeBtn.addEventListener('click', () => close());

  quickBtn.addEventListener('click', () => {
    if (!current) return;
    deps.quickRespray(current.v);
    refreshPrice();
  });

  resetBtn.addEventListener('click', () => {
    if (!current) return;
    current.draft = normalizeLoadout(current.owned);
    deps.setLook(current.v, current.draft);
    deps.play('door');
    refreshAll();
  });

  buyBtn.addEventListener('click', () => {
    const st = current;
    if (!st) return;
    const cost = loadoutCost(st.owned, st.draft);
    if (cost <= 0) {
      refreshPrice();
      return;
    }
    if (!deps.spend(cost, "Pay 'n' Glaze")) {
      hud.toast("Pay 'n' Glaze: not enough Acorns.");
      deps.play('alarm');
      return;
    }
    const before = st.owned;
    const changed = !sameLoadout(before, st.draft);
    saveOwnedLoadout(st.v.kind, st.draft);
    st.owned = normalizeLoadout(st.draft);
    deps.play('door');
    hud.toast(changed ? "PAY 'N' GLAZE: New coat. Who dis?" : 'Nothing to change.');
    refreshAll();
    deps.onPurchase({ kind: st.v.kind, before, after: st.owned, spent: cost });
  });

  return {
    open,
    close,
    isOpen: () => current !== null,
  };
}
