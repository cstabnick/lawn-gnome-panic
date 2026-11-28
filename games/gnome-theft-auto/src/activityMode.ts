// Activity mode (R1 FX03, decisions D30 and G8#1): one place that knows when the player is busy with an activity.
//  - Holster: `activityHidesGun()` is true during golf, a comedy set, the court, the skateboard, a winter ride, every
//    workplace shift or panel (chef, Gnomazon, the bin lift, the hose ...) and inside the PEACEFUL_INTERIORS. app.ts
//    reads it in its hideGun block (gun hidden, arms relaxed, no firing) and tells input.ts (combat buttons hidden).
//  - Touch: an activity asks for a touch layout with `setTouchActivity(key, { stick, buttons })`; input.ts hides the
//    whole button cluster except the buttons named, and the keyboard hint bar and the vehicle key card hide with it.
//  - HUD slot: an activity panel (shift panel, golf strip, court score, skate pill) gets the class ACTIVITY_SLOT_CLASS:
//    top centre on wide screens, full width under the top button row on a portrait phone. While one shows, the HUD
//    toasts move below it (registerActivityPanel), so a panel never covers a toast.
// Pure state plus a little DOM (no import-time DOM work), so tests can drive it.

/** Interiors where the gnome is at home or a guest: no gun, no combat buttons (D30). */
export const PEACEFUL_INTERIORS: readonly string[] = [
  'flat-3b', // Flat 3B, the player's flat (home/types.ts FLAT_ID)
  'townhouse-404', // homes/interiors.ts
  'diggs-bungalow', // homes/interiors.ts
  'bodega', // interiors/showcase/bodega.ts
  'double-pot-sales', // the Thorne Even-Estates sales floor (interiors/showcase/doublePot.ts)
  'pl-cafe-pardon', // Café Pardon (pardonlin/interiors.ts)
  'hedgeworth-clubhouse', // golf/types.ts CLUBHOUSE_INTERIOR
  'moleman-burrow', // societies/config.ts SOCIETY_INTERIORS.moleman
  'flock-tent', // societies/config.ts SOCIETY_INTERIORS.tent
];

/** Who can switch the activity mode on. Each key is set by its own module; several can be on at once. */
export type ActivityKey =
  | 'golf' | 'comedy' | 'court' | 'skate' | 'winter' | 'chef' | 'gnomazon' | 'lift' | 'hose' | 'farm' | 'shift' | 'workplace';

/** A button of input.ts's touch cluster that an activity keeps (everything else is hidden while the activity runs). */
export type ActivityButton = 'enter' | 'jump' | 'down' | 'horn' | 'boost' | 'radio' | 'banger' | 'swap' | 'reload' | 'aim' | 'fire';

/** The touch layout an activity wants: the move stick on or off, and the cluster buttons it keeps. */
export interface TouchActivity {
  stick: boolean;
  buttons: ActivityButton[];
}

const on = new Set<ActivityKey>();
let interiorSource: () => string | null = () => null;

/** Mark an activity as running (or not). Cheap to call every frame. */
export function setActivityOn(key: ActivityKey, active: boolean): void {
  if (active) on.add(key);
  else on.delete(key);
}

export function activityOn(key: ActivityKey): boolean {
  return on.has(key);
}

/** app.ts passes interiors' currentInterior once, so the predicate can see where the player is. */
export function setInteriorSource(fn: () => string | null): void {
  interiorSource = fn;
}

export function inPeacefulInterior(id: string | null = interiorSource()): boolean {
  return id !== null && PEACEFUL_INTERIORS.includes(id);
}

/** True while the gun must be put away: any activity on, or the player is in a peaceful interior (D30). */
export function activityHidesGun(): boolean {
  return on.size > 0 || inPeacefulInterior();
}

// ---- Touch layout ------------------------------------------------------------------------------------------------

const touch = new Map<string, TouchActivity>();
const touchListeners = new Set<(t: TouchActivity | null) => void>();

/** The merged touch layout of every activity that asked for one (stick if any wants it, the union of buttons), or null. */
export function currentTouchActivity(): TouchActivity | null {
  if (touch.size === 0) return null;
  let stick = false;
  const buttons = new Set<ActivityButton>();
  for (const t of touch.values()) {
    stick ||= t.stick;
    for (const b of t.buttons) buttons.add(b);
  }
  return { stick, buttons: [...buttons] };
}

function same(a: TouchActivity | undefined, b: TouchActivity | null): boolean {
  if (!a || !b) return !a && !b;
  return a.stick === b.stick && a.buttons.length === b.buttons.length && a.buttons.every((x, i) => x === b.buttons[i]);
}

/**
 * Ask for (or, with null, give back) an activity's touch layout. Cheap to call every frame: listeners only hear a change.
 * `key` is the activity's own name ('golf', 'court', 'skate', 'winter', 'hose', 'lift', ...).
 */
export function setTouchActivity(key: string, t: TouchActivity | null): void {
  if (same(touch.get(key), t)) return;
  if (t) touch.set(key, { stick: t.stick, buttons: [...t.buttons] });
  else touch.delete(key);
  const now = currentTouchActivity();
  if (typeof document !== 'undefined' && document.body) {
    if (now) document.body.dataset.activity = '1';
    else delete document.body.dataset.activity;
  }
  for (const cb of touchListeners) cb(now);
}

/** input.ts listens here. Returns an unsubscribe. */
export function onTouchActivityChange(cb: (t: TouchActivity | null) => void): () => void {
  touchListeners.add(cb);
  return () => touchListeners.delete(cb);
}

// ---- HUD slot ----------------------------------------------------------------------------------------------------

/** Give an activity panel's root this class: it is placed in the activity slot (see ACTIVITY_CSS). */
export const ACTIVITY_SLOT_CLASS = 'gta-act-slot';

/**
 * The slot: top centre between the acorn panel and the minimap on wide screens; on a portrait phone, full width under
 * the Gnomlet button row (the top ~170 px are the acorn panel, the minimap and the button row). While a panel in the
 * slot shows, `body[data-act-panel]` is set and `--gta-act-bottom` holds its bottom edge, and the HUD toasts sit below it.
 * The keyboard hint bar (`.gta-vhint`, the vehicle key card) and the birding telescope button hide in activity mode,
 * and the weapon block hides while the gun is holstered (`body[data-holster]`).
 */
const ACTIVITY_CSS = `
.${ACTIVITY_SLOT_CLASS}{position:fixed;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);
  width:max(220px,min(380px,calc(100vw - 440px)));box-sizing:border-box;z-index:35;}
@media (max-width:600px) and (min-height:501px){
  .${ACTIVITY_SLOT_CLASS}{top:calc(env(safe-area-inset-top) + 172px);left:calc(env(safe-area-inset-left) + 10px);
    right:calc(env(safe-area-inset-right) + 10px);width:auto;transform:none;}
}
@media (max-height:500px){
  .${ACTIVITY_SLOT_CLASS}{top:calc(env(safe-area-inset-top) + 6px);width:max(220px,min(340px,calc(100vw - 420px)));}
}
body[data-act-panel] #gta-hud .gta-toasts{top:calc(var(--gta-act-bottom, 0px) + 8px)!important;}
body[data-activity] #gta-hud .gta-vhint{display:none!important;}
body[data-activity] #gta-birding-ui button, body[data-activity] #gta-dock{display:none!important;}
body[data-holster] #gta-hud .gta-gunblock, body[data-holster] #gta-hud .gta-vhint{display:none!important;}
body[data-act-start] #gta-hud .gta-biome{display:none!important;}
body[data-act-panel] #la-toast-stack, body[data-workpanel] #la-toast-stack{top:auto!important;bottom:calc(env(safe-area-inset-bottom) + 12px)!important;left:calc(env(safe-area-inset-left) + 12px)!important;right:auto!important;transform:none!important;}
`;

let cssDone = false;
/** Inject the slot CSS once (called by registerActivityPanel and input.ts). */
export function ensureActivityCss(): void {
  if (cssDone || typeof document === 'undefined' || !document.head) return;
  cssDone = true;
  const s = document.createElement('style');
  s.id = 'gta-activity-css';
  s.textContent = ACTIVITY_CSS;
  document.head.appendChild(s);
}

const panels = new Set<HTMLElement>();
let panelRaf = 0;

function visible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
}

function measurePanels(): void {
  panelRaf = 0;
  if (!document.body) return;
  let bottom = -1;
  for (const el of panels) if (visible(el)) bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
  const body = document.body;
  if (bottom >= 0) {
    body.dataset.actPanel = '1';
    body.style.setProperty('--gta-act-bottom', `${Math.round(bottom)}px`);
  } else if (body.dataset.actPanel) {
    delete body.dataset.actPanel;
    body.style.removeProperty('--gta-act-bottom');
  }
  if (panels.size > 0) panelRaf = requestAnimationFrame(measurePanels);
}

/**
 * Put `el` in the activity slot (adds ACTIVITY_SLOT_CLASS) and keep the toasts below it while it is visible.
 * The panel shows and hides itself as before (display); returns an unregister for dispose().
 */
export function registerActivityPanel(el: HTMLElement): () => void {
  ensureActivityCss();
  el.classList?.add(ACTIVITY_SLOT_CLASS);
  panels.add(el);
  if (!panelRaf && typeof requestAnimationFrame === 'function') panelRaf = requestAnimationFrame(measurePanels);
  return () => {
    panels.delete(el);
    el.classList?.remove(ACTIVITY_SLOT_CLASS);
  };
}

let startTimer = 0;
/** An activity or shift just started: hide the region banner ("Entering Mossy Wood") for `ms` so it does not stack. */
export function quietRegionBanner(ms = 8000): void {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.dataset.actStart = '1';
  clearTimeout(startTimer);
  startTimer = window.setTimeout(() => { delete document.body.dataset.actStart; }, ms);
}

/** Test hook: forget every flag, touch layout and the interior source. */
export function resetActivityMode(): void {
  on.clear();
  touch.clear();
  interiorSource = () => null;
}
