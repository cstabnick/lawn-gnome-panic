// Dedicated Campfire Cooking UI with 10 meals and a live Heat/Timing Bar minigame.
import type { Bus } from '../game/bus';
import type { CampSystem, InventorySystem, NeedsSystem, PlayerState } from '../game/types';
import { cookCampfireMeal, type CookQuality } from '../game/useItem';
import { CAMPFIRE_MEALS, type CampfireMeal } from '../items/recipes';

export interface CookingPanel {
  root: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

const CSS = `
#dayg-cook{position:fixed;inset:0;z-index:57;display:none;flex-direction:column;background:var(--dg-bg);color:var(--dg-text);
  font:14px var(--dg-font);pointer-events:auto;backdrop-filter:blur(6px);overflow-y:auto;
  padding:calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))}
#dayg-cook.dck-open{display:flex}
#dayg-cook .dck-wrap{max-width:720px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:12px}
#dayg-cook .dck-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border);padding-bottom:8px}
#dayg-cook .dck-btn{min-height:44px;min-width:44px;padding:8px 14px;border-radius:8px;border:1px solid var(--dg-border);
  background:var(--dg-surface-2);color:var(--dg-text);font:600 13px var(--dg-font);cursor:pointer;touch-action:manipulation}
#dayg-cook .dck-btn:hover:not(:disabled){background:var(--dg-surface-hover);border-color:var(--dg-accent)}
#dayg-cook .dck-btn:disabled{opacity:0.45;cursor:not-allowed}
#dayg-cook .dck-primary{background:#5d4623;border-color:#e8c35a;color:#fff7de}
#dayg-cook .dck-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
#dayg-cook .dck-card{background:var(--dg-surface);border:1px solid var(--dg-border);border-radius:var(--dg-radius);padding:12px;display:flex;flex-direction:column;gap:6px}
#dayg-cook .dck-bar-wrap{padding:12px;border-radius:10px;background:var(--dg-surface-2);border:1px solid var(--dg-accent);display:flex;flex-direction:column;gap:10px}
#dayg-cook .dck-bar{position:relative;height:28px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);
  background:linear-gradient(90deg,#9e342b 0%,#9e342b 25%,#4f7d3a 25%,#4f7d3a 42%,#e8c35a 42%,#e8c35a 58%,#4f7d3a 58%,#4f7d3a 75%,#9e342b 75%,#9e342b 100%)}
#dayg-cook .dck-needle{position:absolute;top:-2px;bottom:-2px;width:6px;margin-left:-3px;background:#ffffff;border:1px solid #111;border-radius:3px;box-shadow:0 0 8px rgba(255,255,255,0.85)}
#dayg-cook-btn{position:absolute;top:calc(72px + env(safe-area-inset-top));right:calc(186px + env(safe-area-inset-right));z-index:50;
  min-height:44px;min-width:44px;padding:0 10px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);
  color:var(--dg-text);font:13px var(--dg-font);cursor:pointer;touch-action:manipulation;pointer-events:auto}`;

function canCookReason(
  meal: CampfireMeal,
  deps: { inv: InventorySystem; camp: CampSystem; getPlayer: () => PlayerState },
): string | null {
  if (meal.needsFire && !deps.camp.nearFire(deps.getPlayer().pos)) return 'Needs a lit campfire nearby';
  for (const inp of meal.inputs) {
    if (deps.inv.countTag(inp.tag) < inp.count) return `Needs ${inp.count}× ${inp.tag}`;
  }
  if (meal.water > 0 && deps.inv.cleanWater() < meal.water) return `Needs ${meal.water} L clean water`;
  return null;
}

function evalZone(posPct: number): { quality: CookQuality; label: string } {
  if (posPct >= 42 && posPct <= 58) return { quality: 'perfect', label: 'Perfect (+35% bonus)' };
  if (posPct >= 25 && posPct <= 75) return { quality: 'good', label: 'Good' };
  return { quality: 'charred', label: 'Charred (half effect)' };
}

export function createCookingPanel(
  ui: HTMLElement,
  deps: {
    inv: InventorySystem;
    needs: NeedsSystem;
    camp: CampSystem;
    getPlayer: () => PlayerState;
    bus: Bus;
    onToast: (t: string) => void;
  },
): CookingPanel {
  if (!document.getElementById('dayg-cook-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-cook-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'dayg-cook';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Campfire Cooking');
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const openBtn = document.createElement('button');
  openBtn.id = 'dayg-cook-btn';
  openBtn.type = 'button';
  openBtn.textContent = 'Cook';
  openBtn.title = 'Campfire Cooking';
  openBtn.addEventListener('mousedown', (e) => e.stopPropagation());
  openBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  ui.appendChild(openBtn);
  ui.appendChild(root);

  let openFlag = false;
  let activeMeal: CampfireMeal | null = null;
  let needlePos = 50;
  let needleDir = 1;
  let lastTs = 0;
  let rafId = 0;
  let needleEl: HTMLElement | null = null;
  let lastResult: string | null = null;

  function stopAnim(): void {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    lastTs = 0;
  }

  function stepNeedle(ts: number): void {
    if (!openFlag || !activeMeal) { stopAnim(); return; }
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    needlePos += needleDir * dt * 115;
    if (needlePos >= 100) { needlePos = 100; needleDir = -1; }
    else if (needlePos <= 0) { needlePos = 0; needleDir = 1; }
    if (needleEl) needleEl.style.left = `${needlePos.toFixed(1)}%`;
    rafId = requestAnimationFrame(stepNeedle);
  }

  function startMinigame(meal: CampfireMeal): void {
    activeMeal = meal;
    needlePos = 10;
    needleDir = 1;
    lastResult = null;
    render();
    stopAnim();
    rafId = requestAnimationFrame(stepNeedle);
  }

  function pullOffFire(): void {
    if (!activeMeal) return;
    const meal = activeMeal;
    const { quality, label } = evalZone(needlePos);
    stopAnim();
    activeMeal = null;
    const res = cookCampfireMeal(deps, meal, quality);
    if (res.ok) {
      lastResult = `${label} — ${meal.name}: +${res.foodGain} Food, +${res.warmGain} Warmth, +${res.calmGain} Calm`;
      deps.onToast(lastResult);
    } else {
      lastResult = res.why ?? 'Could not cook.';
      deps.onToast(lastResult);
    }
    render();
  }

  function open(): void { openFlag = true; root.classList.add('dck-open'); render(); }
  function close(): void {
    openFlag = false;
    activeMeal = null;
    stopAnim();
    root.classList.remove('dck-open');
  }
  function toggle(): void { if (openFlag) close(); else open(); }

  window.addEventListener('keydown', (e) => {
    if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); }
  });

  function render(): void {
    if (!openFlag) return;
    root.replaceChildren();
    needleEl = null;

    const wrap = document.createElement('div');
    wrap.className = 'dck-wrap';

    const head = document.createElement('div');
    head.className = 'dck-head';
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0;font:700 20px var(--dg-font);color:var(--dg-accent)';
    title.textContent = 'Campfire Cooking';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dck-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    head.append(title, closeBtn);
    wrap.append(head);

    const near = deps.camp.nearFire(deps.getPlayer().pos);
    const status = document.createElement('div');
    status.style.cssText = `padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:${near ? 'var(--dg-ok,#8ec07c)' : 'var(--dg-danger,#e07a5f)'};font-weight:600`;
    status.textContent = near
      ? `Campfire lit nearby · Clean Water: ${deps.inv.cleanWater().toFixed(2)} L`
      : 'No lit campfire nearby — light a fire first to cook.';
    wrap.append(status);

    if (lastResult) {
      const resBox = document.createElement('div');
      resBox.style.cssText = 'padding:8px 12px;border-radius:8px;background:rgba(232,195,90,0.12);border:1px solid var(--dg-accent);font-weight:600';
      resBox.textContent = lastResult;
      wrap.append(resBox);
    }

    if (activeMeal) {
      const box = document.createElement('div');
      box.className = 'dck-bar-wrap';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-weight:700;font-size:15px';
      lbl.textContent = `Cooking: ${activeMeal.name} — Pull off in the gold sweet spot for +35%!`;
      const bar = document.createElement('div');
      bar.className = 'dck-bar';
      const needle = document.createElement('div');
      needle.className = 'dck-needle';
      needle.style.left = `${needlePos.toFixed(1)}%`;
      needleEl = needle;
      bar.append(needle);

      const legend = document.createElement('div');
      legend.style.cssText = 'font-size:12px;opacity:0.85;display:flex;justify-content:space-between';
      legend.innerHTML = '<span>Red: Charred (0.5×)</span><span style="color:#e8c35a;font-weight:700">Gold: Perfect (+35%)</span><span>Green: Good (1×)</span>';

      const pullRow = document.createElement('div');
      pullRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
      const pullBtn = document.createElement('button');
      pullBtn.type = 'button';
      pullBtn.className = 'dck-btn dck-primary';
      pullBtn.style.flex = '1 1 180px';
      pullBtn.textContent = 'Pull Off Fire';
      pullBtn.addEventListener('click', (e) => { e.stopPropagation(); pullOffFire(); });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'dck-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', (e) => { e.stopPropagation(); stopAnim(); activeMeal = null; render(); });

      pullRow.append(pullBtn, cancelBtn);
      box.append(lbl, bar, legend, pullRow);
      wrap.append(box);
    }

    const grid = document.createElement('div');
    grid.className = 'dck-grid';
    for (const meal of CAMPFIRE_MEALS) {
      const why = canCookReason(meal, deps);
      const card = document.createElement('div');
      card.className = 'dck-card';

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-weight:700;font-size:15px';
      nameEl.textContent = meal.name;

      const sumEl = document.createElement('div');
      sumEl.style.cssText = 'font-size:12px;opacity:0.8';
      sumEl.textContent = meal.summary;

      const reqParts = meal.inputs.map((i) => `${i.count}× ${i.tag}`);
      if (meal.water > 0) reqParts.push(`${meal.water} L water`);
      const reqEl = document.createElement('div');
      reqEl.style.cssText = 'font-size:12px;color:var(--dg-muted)';
      reqEl.textContent = `Requires: ${reqParts.join(' · ')}`;

      const gainEl = document.createElement('div');
      gainEl.style.cssText = 'font-size:12px;color:var(--dg-accent)';
      gainEl.textContent = `+${meal.food} Food · +${meal.warmth} Warmth · +${meal.calm} Calm`;

      const cookBtn = document.createElement('button');
      cookBtn.type = 'button';
      cookBtn.className = 'dck-btn';
      cookBtn.disabled = why !== null || activeMeal !== null;
      cookBtn.textContent = why ? why : 'Cook';
      cookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!canCookReason(meal, deps)) startMinigame(meal);
      });

      card.append(nameEl, sumEl, reqEl, gainEl, cookBtn);
      grid.append(card);
    }

    wrap.append(grid);
    root.append(wrap);
  }

  return {
    root,
    open,
    close,
    toggle,
    isOpen: () => openFlag,
  };
}
