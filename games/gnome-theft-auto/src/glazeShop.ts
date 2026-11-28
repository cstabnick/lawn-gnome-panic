// The Pay 'n' Glaze shop: a full-screen showroom UI (tabs of panels, live price, Buy / Reset / Done) that dresses the player's vehicle as they browse.
import { defaultLoadout, loadoutCost, loadoutCostLines, normalizeLoadout, sameLoadout, type Loadout } from '@lawn/glaze';
import { GLAZE_CSS, type Panel, type PanelCtx } from './glazeUi';
import { glazePanelsFor } from './glazePanels';
import { clientOrderFor, type ClientOrder } from './glazeClient';
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
  /** The player's own vehicle (lockup uid, E08): its own look, which the shop edits instead of the per-model loadout.
   *  Null / absent = a stock vehicle, dressed in the per-model loadout as before. */
  ownLook?(v: Vehicle): Loadout | null;
  /** A purchase on v: return true when the look was kept on the vehicle alone (an owned vehicle), so the per-model
   *  loadout is left alone. False / absent = save it as the per-model loadout as before. */
  keepOwnLook?(v: Vehicle, look: Loadout): boolean;
}

export interface GlazeShop {
  /** Open on a ground vehicle (the one the player drives in the bay). Previews the owned loadout, or the vehicle's current look. */
  open(v: Vehicle): void;
  /** Close without buying: restore the owned loadout on the vehicle. */
  close(): void;
  isOpen(): boolean;
}

const STYLE_ID = 'gta-glaze-style';
const CLIENT_STYLE_ID = 'gta-glaze-client-css';
const QUICK_RESPRAY_PRICE = 90;

// Client mode (a mechanic work order): a pink WORK ORDER ribbon on the head.
const CLIENT_CSS = `
.gz-frame.gz-client .gz-head { box-shadow: inset 0 -3px 0 #ff5fa2; }
.gz-frame.gz-client .gz-title::after {
  content: 'WORK ORDER'; margin-left: 8px; padding: 2px 6px; border-radius: 4px; vertical-align: middle;
  font-size: 10px; letter-spacing: 0.06em; background: #ff5fa2; color: #fff;
}`;

function injectStyle(): void {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = GLAZE_CSS;
    document.head.appendChild(style);
  }
  if (!document.getElementById(CLIENT_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = CLIENT_STYLE_ID;
    style.textContent = CLIENT_CSS;
    document.head.appendChild(style);
  }
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

  // Tabs: the panel tabs are rebuilt on every open (glazePanelsFor(kind)); the Handling tab stays last.
  const tabsEl = document.createElement('div');
  tabsEl.className = 'gz-tabs';
  let tabButtons: HTMLButtonElement[] = [];
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
    panels: Panel[];
    built: Map<string, { el: HTMLElement; panel: Panel }>;
    active: number;
    /** Set in client mode (a work order); null for the player's own shopping. */
    client: ClientOrder | null;
    /** Client mode: the look was handed back (so close() does not cancel the order). */
    handed: boolean;
  }
  let current: OpenState | null = null;

  // Live preview scheduler: slider input only updates the draft; the vehicle is dressed at most once per animation frame.
  let pendingLook: OpenState | null = null;
  let lookFrame: number | null = null;

  function scheduleLook(st: OpenState): void {
    if (typeof requestAnimationFrame !== 'function') {
      deps.setLook(st.v, st.draft);
      return;
    }
    pendingLook = st;
    if (lookFrame !== null) return;
    lookFrame = requestAnimationFrame(() => {
      lookFrame = null;
      const p = pendingLook;
      pendingLook = null;
      if (p && current === p) deps.setLook(p.v, p.draft);
    });
  }

  /** Run a pending setLook now and cancel its frame. Call before anything that sets the look itself. */
  function flushLook(): void {
    if (lookFrame !== null) {
      cancelAnimationFrame(lookFrame);
      lookFrame = null;
    }
    const p = pendingLook;
    pendingLook = null;
    if (p && current === p) deps.setLook(p.v, p.draft);
  }

  function refreshPrice(): void {
    if (!current) return;
    const cost = loadoutCost(current.owned, current.draft);
    const order = current.client;
    if (order) {
      const over = cost > order.budget ? ' · OVER BUDGET' : '';
      priceEl.textContent = `Parts ${cost} 🌰 of ${order.budget} 🌰 budget${over}`;
    } else {
      priceEl.textContent = `Total ${cost} 🌰 (you have ${deps.acorns()})`;
    }
    const lines = loadoutCostLines(current.owned, current.draft);
    priceLines.textContent = lines.length === 0
      ? 'Nothing to pay for yet.'
      : lines.map((l) => `${l.label} ${l.price} 🌰`).join(' · ');
    priceWrap.title = lines.map((l) => `${l.label}: ${l.price} 🌰`).join('\n');
    // Client mode: handing back is always allowed (it just scores badly).
    buyBtn.disabled = order ? false : cost === 0 || cost > deps.acorns();
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
    scheduleLook(current);
    refreshAll();
  }

  function makeCtx(st: OpenState): PanelCtx {
    return {
      kind: st.v.kind,
      draft: () => st.draft,
      owned: () => st.owned,
      patch,
      acorns: deps.acorns,
      vehicle: () => st.v,
      spend: (amount, reason) => deps.spend(amount, reason),
      toast: (text) => hud.toast(text),
    };
  }

  function buildTabs(panels: readonly Panel[]): void {
    for (const b of tabButtons) b.remove();
    tabButtons = [];
    panels.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gz-tab';
      btn.textContent = `${p.icon} ${p.label}`;
      btn.addEventListener('click', () => showPanel(i));
      tabButtons.push(btn);
      tabsEl.insertBefore(btn, handlingBtn);
    });
  }

  function showPanel(index: number): void {
    const st = current;
    if (!st || index < 0 || index >= st.panels.length) return;
    st.active = index;
    st.panels.forEach((panel, i) => {
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
    st.built.get(st.panels[index].id)?.panel.refresh?.();
    refreshPrice();
  }

  function onKeydown(e: KeyboardEvent): void {
    const st = current;
    if (!st) return;
    if (e.code === 'Escape') {
      close();
      return;
    }
    if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;
    if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
    const n = st.panels.length;
    if (n === 0) return;
    const step = e.code === 'ArrowRight' ? 1 : -1;
    e.preventDefault();
    showPanel((st.active + step + n) % n);
  }

  /** Client mode swaps the head text and buttons; the normal shop restores them (the shop is reused). */
  function applyClientChrome(order: ClientOrder | null): void {
    frame.classList.toggle('gz-client', !!order);
    title.textContent = order ? 'Work order: ' + order.title : "Pay 'n' Glaze";
    slogan.textContent = order ? '"' + order.brief + '"' : 'New Coat. Who Dis?';
    quickBtn.style.display = order ? 'none' : '';
    handlingBtn.style.display = order ? 'none' : '';
    buyBtn.textContent = order ? 'Hand back the keys' : 'Buy';
  }

  function open(v: Vehicle): void {
    if (current) close();
    const order = clientOrderFor(v);
    const owned = order
      ? normalizeLoadout(order.start)
      : normalizeLoadout(deps.ownLook?.(v) ?? ownedLoadout(v.kind) ?? v.look ?? defaultLoadout(v.tint));
    // Client mode: no Repair tab (players do not pay for repairs on a client's car).
    const panels = glazePanelsFor(v.kind).filter((p) => !order || p.id !== 'repair');
    const st: OpenState = {
      v, owned, draft: normalizeLoadout(owned), panels, built: new Map(), active: 0, client: order, handed: false,
    };
    current = st;
    applyClientChrome(order);
    bodyEl.innerHTML = '';
    buildTabs(panels);
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
    flushLook();
    window.removeEventListener('keydown', onKeydown);
    deps.setLook(st.v, st.owned);
    frame.style.display = 'none';
    bodyEl.innerHTML = '';
    current = null;
    deps.showroom(null);
    // Closed without handing back: the job stays open.
    if (st.client && !st.handed) st.client.cancel?.();
  }

  closeBtn.addEventListener('click', () => close());

  quickBtn.addEventListener('click', () => {
    if (!current) return;
    flushLook();
    deps.quickRespray(current.v);
    refreshPrice();
  });

  resetBtn.addEventListener('click', () => {
    flushLook();
    if (!current) return;
    current.draft = normalizeLoadout(current.owned);
    deps.setLook(current.v, current.draft);
    deps.play('door');
    refreshAll();
  });

  buyBtn.addEventListener('click', () => {
    flushLook();
    const st = current;
    if (!st) return;
    const cost = loadoutCost(st.owned, st.draft);
    const order = st.client;
    if (order) {
      // Hand back the keys: the new look stays on the car, nothing is charged or saved as the player's loadout.
      const look = normalizeLoadout(st.draft);
      st.owned = look;
      st.handed = true;
      deps.play('door');
      close();
      order.finish(look, cost);
      return;
    }
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
    if (!deps.keepOwnLook?.(st.v, st.draft)) saveOwnedLoadout(st.v.kind, st.draft);
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
