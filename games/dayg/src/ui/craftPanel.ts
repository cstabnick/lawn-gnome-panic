// Dedicated DayZ-style Survival Crafting & Blueprints panel (KeyK or Craft button).
import type { BodySystem, InventorySystem } from '../game/types';
import type { ItemId, WorldState } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';

export interface CraftBlueprint {
  id: string;
  name: string;
  desc: string;
  acornCost: number;
  tagNeed?: { tag: 'TINDER' | 'FUEL' | 'FOOD' | 'SALT' | 'GLAZE'; count: number };
  outputItem?: ItemId;
  effect?: 'heal' | 'repair-held' | 'ration-bundle';
}

export const BLUEPRINTS: readonly CraftBlueprint[] = [
  { id: 'bp-bandage', name: 'Improvised Bandage', desc: 'Clears infection & mends 1 crack level on all parts.', acornCost: 5, effect: 'heal' },
  { id: 'bp-repair', name: 'Scrap Repair Kit', desc: 'Restores your currently held weapon/tool to 100% condition.', acornCost: 10, effect: 'repair-held' },
  { id: 'bp-club', name: 'Spiked Acorn Club', desc: 'Crafts a heavy melee club for knocking back Hatless.', acornCost: 15, outputItem: 'acorn-club' },
  { id: 'bp-shiv', name: 'Thorn Shiv', desc: 'Crafts a fast, light thorn dagger.', acornCost: 12, outputItem: 'thorn-dagger' },
  { id: 'bp-torch', name: 'Pitch Torch', desc: 'Crafts a burning torch for night visibility & warmth.', acornCost: 8, tagNeed: { tag: 'TINDER', count: 1 }, outputItem: 'torch' },
  { id: 'bp-rope', name: 'Braided Rope Coil', desc: 'Crafts a 15 gm climbing rope coil.', acornCost: 15, outputItem: 'rope-coil' },
  { id: 'bp-glaze', name: 'Glaze Patch Pot', desc: 'Crafts a ceramic glaze pot for sealing deep cracks.', acornCost: 18, outputItem: 'glaze-pot' },
  { id: 'bp-rations', name: 'Field Ration Bundle', desc: 'Packs a seed-cake & clean spigot water bottle.', acornCost: 12, effect: 'ration-bundle' },
];

export interface CraftPanel {
  root: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

const CSS = `
#dayg-craft{position:fixed;inset:0;z-index:57;display:none;flex-direction:column;background:var(--dg-bg);color:var(--dg-text);
  font:14px var(--dg-font);pointer-events:auto;backdrop-filter:blur(6px);overflow-y:auto;
  padding:calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))}
#dayg-craft.dk-open{display:flex}
#dayg-craft .dk-wrap{max-width:720px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:12px}
#dayg-craft .dk-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border);padding-bottom:8px}
#dayg-craft .dk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
#dayg-craft .dk-card{background:var(--dg-surface);border:1px solid var(--dg-border);border-radius:var(--dg-radius);padding:12px;display:flex;flex-direction:column;gap:6px}
#dayg-craft .dk-btn{min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);
  background:var(--dg-surface-2);color:var(--dg-text);font:600 13px var(--dg-font);cursor:pointer;touch-action:manipulation}
#dayg-craft .dk-btn:hover:not(:disabled){background:var(--dg-surface-hover);border-color:var(--dg-accent)}
#dayg-craft .dk-btn:disabled{opacity:.45;cursor:not-allowed}`;

export function createCraftPanel(ui: HTMLElement, deps: {
  inv: InventorySystem;
  body: BodySystem;
  world: WorldState;
  isGodMode: () => boolean;
  onToast: (t: string) => void;
}): CraftPanel {
  if (!document.getElementById('dayg-craft-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-craft-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'dayg-craft';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Survival Crafting');
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  ui.appendChild(root);

  let openFlag = false;
  function open(): void { openFlag = true; root.classList.add('dk-open'); render(); }
  function close(): void { openFlag = false; root.classList.remove('dk-open'); }
  function toggle(): void { if (openFlag) close(); else open(); }
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.code === 'KeyK' && !e.repeat) { toggle(); e.preventDefault(); }
    else if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); }
  });

  function render(): void {
    if (!openFlag) return;
    const rec = deps.world.players[LOCAL_PLAYER];
    const acorns = rec?.acorns ?? 0;
    const god = deps.isGodMode();

    root.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'dk-wrap';

    const head = document.createElement('div');
    head.className = 'dk-head';
    const title = document.createElement('div');
    title.innerHTML = `<div style="font:700 20px var(--dg-font);color:var(--dg-accent)">Survival Crafting</div>` +
      `<div style="font-size:12px;color:var(--dg-muted)">Acorns: ${acorns} · Craft gear, bandages, tools & rations anywhere</div>`;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dk-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    head.append(title, closeBtn);
    wrap.append(head);

    const grid = document.createElement('div');
    grid.className = 'dk-grid';
    for (const bp of BLUEPRINTS) {
      const hasTag = !bp.tagNeed || deps.inv.countTag(bp.tagNeed.tag) >= bp.tagNeed.count;
      const canAfford = god || (acorns >= bp.acornCost && hasTag);
      const card = document.createElement('div');
      card.className = 'dk-card';
      card.innerHTML = `<div style="font-weight:700;font-size:15px">${bp.name}</div>` +
        `<div style="font-size:12px;color:var(--dg-muted)">${bp.desc}</div>` +
        `<div style="font-size:12px">Cost: ${god ? 'Free' : `${bp.acornCost} acorns${bp.tagNeed ? ` + ${bp.tagNeed.count} ${bp.tagNeed.tag}` : ''}`}</div>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dk-btn';
      btn.disabled = !canAfford;
      btn.textContent = canAfford ? `Craft ${bp.name}` : 'Missing Materials / Acorns';
      btn.addEventListener('click', () => {
        if (!god) {
          if (bp.tagNeed && !deps.inv.consumeTag(bp.tagNeed.tag, bp.tagNeed.count)) {
            deps.onToast(`Need ${bp.tagNeed.count} ${bp.tagNeed.tag}.`);
            return;
          }
          if (rec) rec.acorns -= bp.acornCost;
        }
        if (bp.outputItem) {
          deps.inv.add({ def: bp.outputItem, count: 1, condition: 1 });
        } else if (bp.effect === 'heal') {
          deps.body.state.infection = null;
          for (const k of Object.keys(deps.body.state.cracks) as (keyof typeof deps.body.state.cracks)[]) {
            if (deps.body.state.cracks[k] > 0) deps.body.state.cracks[k]--;
          }
        } else if (bp.effect === 'repair-held') {
          const h = deps.inv.held();
          if (h) h.condition = 1;
        } else if (bp.effect === 'ration-bundle') {
          deps.inv.add({ def: 'seed-cake', count: 1, condition: 1 });
          deps.inv.add({ def: 'spigot-water', count: 1, condition: 1 });
        }
        deps.onToast(`🔨 Crafted ${bp.name}!`);
        render();
      });
      card.append(btn);
      grid.append(card);
    }
    wrap.append(grid);
    root.append(wrap);
  }

  return { root, open, close, toggle, isOpen: () => openFlag };
}
