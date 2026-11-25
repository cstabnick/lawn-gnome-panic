// The Wingwright's Slipway: a bottom sheet that paints and tunes the boat or aircraft the player sits in, while it is stopped.
// Opened by its own 44 px button, the L key (KEYS.craftShop) or the 'gta:craft-shop' window event (gamepad D-pad up).
import { defaultLoadout, normalizeLoadout, type Loadout } from '@lawn/glaze';
import { GLAZE_CSS, type Panel, type PanelCtx } from '../glazeUi';
import { glazePanelsFor } from '../glazePanels';
import { isCraftKind, ownedLoadout, saveOwnedLoadout } from '../glazeStore';
import { isTyping, KEYS } from '../keys';
import { aboveGround } from '../terrain';
import { registerAction } from '../ui/actions';
import { dockButton } from '../ui/dock';
import { ensureGlyphStyle, fillHintHtml } from '../ui/glyphs';
import { currentGlyphSet } from '../ui/inputSource';
import type { Hud, Sfx, Vehicle, VehicleKind } from '../types';
import type { CraftStat } from './model';
import { CRAFT_PAINT_PRICE, CRAFT_PANEL_IDS, getTuneDraft, registerCraftPanels, setTuneDraft } from './craftPanels';
import { getCraftTune, saveCraftTune } from './craftTuneStore';
import { NO_TUNE, tuneCost } from './tuning';

export interface CraftShopDeps {
  /** Dress a vehicle in a look live (vehicles.ts setVehicleLook re-tints a craft's prefab). */
  setLook(v: Vehicle, look: Loadout): void;
  /** Take Acorns; false when the player cannot pay. */
  spend(amount: number, reason: string): boolean;
  acorns(): number;
  play(sfx: Sfx): void;
  /** A purchase went through (wallet charged, look and tune saved). */
  onPurchase(info: { kind: VehicleKind; spent: number; painted: boolean; tuned: boolean }): void;
}

export interface CraftShop {
  /** Every frame, with the vehicle the player drives (or null): shows the button when the shop can open, closes the sheet when it no longer can. */
  update(v: Vehicle | null): void;
  open(v: Vehicle): void;
  /** Close without buying: the vehicle goes back to its owned paint. */
  close(): void;
  isOpen(): boolean;
}

/** True when the Slipway can open on `v`: a craft kind (glazeStore isCraftKind), driven by the player, not wrecked, stopped and down. */
export function canOpenCraftShop(v: Vehicle | null): boolean {
  return !!v && v.driver === 'player' && isCraftKind(v.kind) && !v.exploded && !v.sunk &&
    Math.abs(v.speed) < 1.5 &&
    (v.air ? !v.air.airborne : (!v.spec.flies || aboveGround(v.x, v.y, v.z) < 0.3));
}

const GLAZE_STYLE_ID = 'gta-glaze-style';
const CRAFT_STYLE_ID = 'gta-craft-shop-style';

/** The Glaze widget styles are scoped under #gta-glaze; the same rules under #gta-craft-shop style the Slipway's own tree. */
const CRAFT_CSS = `
#gta-craft-shop .gta-craft-fab{
  min-width:44px;min-height:44px;padding:8px 16px;border-radius:12px;border:2px solid #ffd23f;background:#181c20;
  color:#ffd23f;font:800 14px system-ui,-apple-system,sans-serif;pointer-events:auto;cursor:pointer;touch-action:manipulation;
}
#gta-craft-shop .gta-craft-fab:focus-visible,#gta-craft-shop .gta-craft-sheet button:focus-visible{outline:3px solid #ffd23f;outline-offset:2px;}
#gta-craft-shop .gta-craft-sheet{
  position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,560px);max-height:70vh;box-sizing:border-box;
  display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;
  background:#181c20;border:2px solid rgba(255,255,255,0.22);border-bottom:none;border-radius:16px 16px 0 0;
  box-shadow:0 -10px 30px rgba(0,0,0,0.55);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);
  font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;
}
#gta-craft-shop .gta-craft-sheet button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-craft-shop .gta-craft-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-craft-shop .craft-pip{font-size:16px;color:#ffd23f;margin-right:2px;}
#gta-craft-shop .craft-pip.owned{color:#7be08a;}
#gta-craft-shop .craft-tune-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
#gta-craft-shop .craft-foot{padding:6px 14px 10px;font-size:12px;text-align:center;opacity:0.7;overflow:hidden;text-overflow:ellipsis;}
`;

function injectStyles(): void {
  ensureGlyphStyle();
  if (!document.getElementById(GLAZE_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = GLAZE_STYLE_ID;
    style.textContent = GLAZE_CSS;
    document.head.appendChild(style);
  }
  if (!document.getElementById(CRAFT_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = CRAFT_STYLE_ID;
    style.textContent = GLAZE_CSS.split('#gta-glaze').join('#gta-craft-shop') + CRAFT_CSS;
    document.head.appendChild(style);
  }
}

interface OpenState {
  v: Vehicle;
  owned: Loadout;
  draft: Loadout;
  panels: Panel[];
  built: Map<string, { el: HTMLElement; panel: Panel }>;
  tabs: HTMLButtonElement[];
}

export function createCraftShop(ui: HTMLElement, hud: Hud, deps: CraftShopDeps): CraftShop {
  registerCraftPanels();
  injectStyles();

  const root = document.createElement('div');
  root.id = 'gta-craft-shop';

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'gta-craft-fab';
  fab.textContent = '🛠 Slipway';
  fab.setAttribute('aria-label', "Open the Wingwright's Slipway");
  fab.style.display = 'none';

  const sheet = document.createElement('div');
  sheet.className = 'gta-craft-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', "Wingwright's Slipway");
  sheet.style.display = 'none';

  const head = document.createElement('div');
  head.className = 'gz-head';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'gz-title';
  title.textContent = "Wingwright's Slipway";
  const subtitle = document.createElement('div');
  subtitle.className = 'gta-craft-sub';
  titleWrap.append(title, subtitle);
  head.appendChild(titleWrap);

  const tabsEl = document.createElement('div');
  tabsEl.className = 'gz-tabs';
  const bodyEl = document.createElement('div');
  bodyEl.className = 'gz-body';

  const foot = document.createElement('div');
  foot.className = 'gz-foot';
  const priceEl = document.createElement('div');
  priceEl.className = 'gz-price';
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gz-btn gz-btn-ghost';
  closeBtn.textContent = 'Close';
  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'gz-btn gz-btn-buy';
  buyBtn.textContent = 'Buy';
  btnRow.append(closeBtn, buyBtn);
  foot.append(priceEl, btnRow);

  const hintEl = document.createElement('div');
  hintEl.className = 'craft-foot';

  sheet.append(head, tabsEl, bodyEl, foot, hintEl);
  root.append(sheet);
  ui.appendChild(root);
  dockButton(fab, 'craftShop');

  // The shop is modal for input: pointer and touch must not reach the game behind it.
  sheet.addEventListener('pointerdown', (e) => e.stopPropagation());
  sheet.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  let current: OpenState | null = null;
  /** The vehicle the player is in right now (from update), so the keys and the gamepad event can open the sheet. */
  let driven: Vehicle | null = null;

  function totalOf(st: OpenState): number {
    return (st.draft.paint !== st.owned.paint ? CRAFT_PAINT_PRICE : 0) + tuneCost(getCraftTune(st.v.kind), getTuneDraft());
  }

  function refreshPrice(): void {
    if (!current) return;
    const total = totalOf(current);
    priceEl.textContent = total > 0 ? `Total: ${total} 🌰` : 'Nothing to pay';
    buyBtn.disabled = total === 0 || total > deps.acorns();
  }

  function refreshAll(): void {
    if (!current) return;
    refreshPrice();
    for (const { panel } of current.built.values()) panel.refresh?.();
  }

  function makeCtx(st: OpenState): PanelCtx {
    return {
      kind: st.v.kind,
      draft: () => st.draft,
      owned: () => st.owned,
      patch(p: Partial<Loadout>): void {
        if (current !== st) return;
        const prev = st.draft;
        st.draft = normalizeLoadout({ ...st.draft, ...p });
        if (st.draft.paint !== prev.paint) deps.setLook(st.v, st.draft);
        refreshAll();
      },
      acorns: () => deps.acorns(),
      vehicle: () => st.v,
      spend: (amount, reason) => deps.spend(amount, reason),
      toast: (text) => hud.toast(text),
    };
  }

  function showTab(st: OpenState, index: number): void {
    st.panels.forEach((panel, i) => {
      const entry = st.built.get(panel.id);
      if (entry) entry.el.style.display = i === index ? '' : 'none';
      st.tabs[i].classList.toggle('active', i === index);
      st.tabs[i].setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    st.built.get(st.panels[index]?.id ?? '')?.panel.refresh?.();
  }

  /** Hide the sheet and forget the open state (no look change: the caller decides). */
  function hide(): void {
    current = null;
    sheet.style.display = 'none';
    bodyEl.innerHTML = '';
    tabsEl.innerHTML = '';
  }

  function open(v: Vehicle): void {
    if (current) close();
    const owned = normalizeLoadout(ownedLoadout(v.kind) ?? v.look ?? defaultLoadout(v.tint));
    const st: OpenState = {
      v,
      owned,
      draft: { ...owned },
      panels: glazePanelsFor(v.kind).filter((p) => CRAFT_PANEL_IDS.includes(p.id)),
      built: new Map(),
      tabs: [],
    };
    current = st;
    setTuneDraft(getCraftTune(v.kind));
    subtitle.textContent = v.spec.name;
    bodyEl.innerHTML = '';
    tabsEl.innerHTML = '';
    const ctx = makeCtx(st);
    st.panels.forEach((panel, i) => {
      const el = panel.build(ctx);
      el.style.display = 'none';
      bodyEl.appendChild(el);
      st.built.set(panel.id, { el, panel });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gz-tab';
      btn.textContent = `${panel.icon} ${panel.label}`;
      btn.addEventListener('click', () => showTab(st, i));
      tabsEl.appendChild(btn);
      st.tabs.push(btn);
    });
    fab.style.display = 'none';
    sheet.style.display = '';
    hintEl.style.display = currentGlyphSet() === 'touch' ? 'none' : '';
    hintEl.innerHTML = fillHintHtml('{close} Close');
    showTab(st, 0);
    refreshPrice();
  }

  function close(): void {
    const st = current;
    if (!st) return;
    if (st.draft.paint !== st.owned.paint) deps.setLook(st.v, st.owned);
    hide();
  }

  closeBtn.addEventListener('click', () => close());

  buyBtn.addEventListener('click', () => {
    const st = current;
    if (!st) return;
    const total = totalOf(st);
    if (total <= 0) {
      refreshPrice();
      return;
    }
    if (!deps.spend(total, "Wingwright's Slipway")) {
      hud.toast('Not enough Acorns.');
      return;
    }
    const painted = st.draft.paint !== st.owned.paint;
    if (painted) saveOwnedLoadout(st.v.kind, st.draft);
    const stored = getCraftTune(st.v.kind);
    const wanted = getTuneDraft();
    const tuned = (Object.keys(NO_TUNE) as CraftStat[]).some((id) => wanted[id] !== stored[id]);
    if (tuned) saveCraftTune(st.v.kind, wanted);
    deps.play('shutter');
    hud.toast('Slipway: all done.');
    deps.onPurchase({ kind: st.v.kind, spent: total, painted, tuned });
    st.owned = normalizeLoadout(st.draft);
    hide();
  });

  function toggle(): void {
    if (current) {
      close();
      return;
    }
    if (canOpenCraftShop(driven)) open(driven as Vehicle);
  }

  fab.addEventListener('click', () => toggle());
  registerAction('craftShop', {
    run: () => toggle(),
    available: () => fab.style.display !== 'none',
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (e.code === KEYS.craftShop) {
      toggle();
    } else if (e.code === KEYS.close && current) {
      close();
    }
  });
  window.addEventListener('gta:craft-shop', () => toggle());

  return {
    update(v: Vehicle | null): void {
      driven = v;
      if (current && (v !== current.v || !canOpenCraftShop(v))) close();
      const show = !current && canOpenCraftShop(v);
      const want = show ? '' : 'none';
      if (fab.style.display !== want) fab.style.display = want;
    },
    open,
    close,
    isOpen: () => current !== null,
  };
}
