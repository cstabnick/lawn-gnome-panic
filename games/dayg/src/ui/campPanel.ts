// Player Camp, Security Defenses (Mk I-III Upgrades & Repair), Crew Production & NPC Hiring Panel.
import type { PlayerState } from '../game/types';
import type { WorldState } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';
import { NAMED_SURVIVORS, loadStoryState, saveStoryState, setSurvivorStatus } from '../sim/survivorStories';
import {
  DEFENSE_CATALOG,
  addCampDefense,
  collectCampProduction,
  dismissCampNpc,
  establishCamp,
  evaluateDemands,
  hireCampNpc,
  loadCampState,
  reassignNpcRole,
  repairAllDefenses,
  saveCampState,
  upgradeDefense,
  type CampRole,
  type CampState,
} from '../base/campSecurity';

export interface CampPanel {
  root: HTMLElement;
  state: CampState;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

const CSS = `
#dayg-camp{position:fixed;inset:0;z-index:56;display:none;flex-direction:column;background:var(--dg-bg);color:var(--dg-text);
  font:14px var(--dg-font);pointer-events:auto;backdrop-filter:blur(6px);overflow-y:auto;
  padding:calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))}
#dayg-camp.dc-open{display:flex}
#dayg-camp .dc-wrap{max-width:740px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:12px}
#dayg-camp .dc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border);padding-bottom:8px}
#dayg-camp .dc-card{background:var(--dg-surface);border:1px solid var(--dg-border);border-radius:var(--dg-radius);padding:12px;display:flex;flex-direction:column;gap:8px}
#dayg-camp .dc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
#dayg-camp .dc-btn{min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:var(--dg-text);font:13px var(--dg-font);cursor:pointer;touch-action:manipulation}
#dayg-camp .dc-btn:hover:not(:disabled){background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#dayg-camp .dc-btn:disabled{opacity:.45;cursor:default}
#dayg-camp input,#dayg-camp select{min-height:44px;padding:6px 10px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:var(--dg-text);font:14px var(--dg-font)}
#dayg-camp-btn{position:absolute;top:calc(72px + env(safe-area-inset-top));right:calc(130px + env(safe-area-inset-right));z-index:50;
  min-height:44px;min-width:44px;padding:0 10px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);
  color:var(--dg-text);font:13px var(--dg-font);cursor:pointer;touch-action:manipulation;pointer-events:auto}`;

export function createCampPanel(ui: HTMLElement, deps: {
  world: WorldState;
  getPlayer: () => PlayerState;
  isGodMode: () => boolean;
  onSync: (camp: CampState) => void;
  onToast: (t: string) => void;
}): CampPanel {
  if (!document.getElementById('dayg-camp-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-camp-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const state = loadCampState();
  deps.onSync(state);

  const root = document.createElement('div');
  root.id = 'dayg-camp';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Camp and Crew');
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const openBtn = document.createElement('button');
  openBtn.id = 'dayg-camp-btn';
  openBtn.type = 'button';
  openBtn.textContent = 'Camp';
  openBtn.addEventListener('mousedown', (e) => e.stopPropagation());
  openBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  ui.appendChild(openBtn);
  ui.appendChild(root);

  let openFlag = false;
  function open(): void { openFlag = true; root.classList.add('dc-open'); render(); }
  function close(): void { openFlag = false; root.classList.remove('dc-open'); }
  function toggle(): void { if (openFlag) close(); else open(); }
  window.addEventListener('keydown', (e) => { if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); } });

  function render(): void {
    if (!openFlag) return;
    root.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'dc-wrap';

    const head = document.createElement('div');
    head.className = 'dc-head';
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0;font:700 20px var(--dg-font);color:var(--dg-accent)';
    title.textContent = 'Camp & Crew';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dc-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    head.append(title, closeBtn);
    wrap.append(head);

    const rec = deps.world.players[LOCAL_PLAYER];
    const acorns = rec?.acorns ?? 0;
    const ev = evaluateDemands(state);

    // Status & Production Card
    const statusCard = document.createElement('div');
    statusCard.className = 'dc-card';
    const secLine = document.createElement('div');
    secLine.innerHTML = `<strong>${state.established ? state.name : 'No Camp Established'}</strong> · Security Score: <strong style="color:var(--dg-accent)">${ev.security}</strong> · Acorns: <strong>${acorns}</strong>`;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    const nameIn = document.createElement('input');
    nameIn.value = state.name;
    nameIn.placeholder = 'Camp name';
    nameIn.style.flex = '1 1 180px';
    const estBtn = document.createElement('button');
    estBtn.type = 'button';
    estBtn.className = 'dc-btn';
    estBtn.textContent = state.established ? 'Move Camp Here' : 'Establish Camp Here';
    estBtn.addEventListener('click', () => {
      const p = deps.getPlayer();
      establishCamp(state, nameIn.value, { x: p.pos.x, y: p.pos.y, z: p.pos.z }, p.region);
      saveCampState(state);
      deps.onSync(state);
      deps.onToast(`⛺ Camp "${state.name}" established!`);
      render();
    });
    const collectBtn = document.createElement('button');
    collectBtn.type = 'button';
    collectBtn.className = 'dc-btn';
    const pendAc = Math.floor(state.pendingAcorns ?? 0);
    const pendRa = Math.floor(state.pendingRations ?? 0);
    collectBtn.textContent = `Collect (${pendAc} ac · ${pendRa} rations)`;
    collectBtn.disabled = pendAc === 0 && pendRa === 0;
    collectBtn.addEventListener('click', () => {
      const got = collectCampProduction(state);
      if (rec) rec.acorns += got.acorns;
      saveCampState(state);
      deps.onToast(`Collected ${got.acorns} acorns & ${got.rations} camp rations!`);
      render();
    });
    row.append(nameIn, estBtn, collectBtn);
    statusCard.append(secLine, row);
    for (const w of ev.warnings) {
      const warn = document.createElement('div');
      warn.style.cssText = 'font-size:12px;color:var(--dg-warn)';
      warn.textContent = `⚠ ${w}`;
      statusCard.append(warn);
    }
    wrap.append(statusCard);

    // Built Defenses (Upgrades & Repair)
    if (state.defenses.length > 0) {
      const builtCard = document.createElement('div');
      builtCard.className = 'dc-card';
      const bHead = document.createElement('div');
      bHead.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap';
      bHead.innerHTML = `<span style="font-weight:700;color:var(--dg-accent)">Built Defenses (${state.defenses.length})</span>`;
      const repBtn = document.createElement('button');
      repBtn.type = 'button';
      repBtn.className = 'dc-btn';
      repBtn.textContent = 'Repair All';
      repBtn.addEventListener('click', () => {
        const n = repairAllDefenses(state);
        saveCampState(state);
        deps.onToast(n > 0 ? `Repaired ${n} defense(s).` : 'All defenses at full HP.');
        render();
      });
      bHead.append(repBtn);
      builtCard.append(bHead);

      const bGrid = document.createElement('div');
      bGrid.className = 'dc-grid';
      for (const d of state.defenses) {
        const cat = DEFENSE_CATALOG.find((x) => x.kind === d.kind);
        const tier = d.tier ?? 1;
        const box = document.createElement('div');
        box.style.cssText = 'padding:8px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);display:flex;flex-direction:column;gap:6px';
        box.innerHTML = `<div style="font-weight:700">${cat?.name ?? d.kind} <span style="color:var(--dg-accent)">Mk ${tier}</span></div>` +
          `<div style="font-size:12px;color:var(--dg-muted)">HP: ${Math.round(d.hp)}/${d.maxHp}</div>`;
        if (tier < 3) {
          const upCost = Math.round((cat?.costAcorns ?? 25) * (tier === 1 ? 0.8 : 1.2));
          const upBtn = document.createElement('button');
          upBtn.type = 'button';
          upBtn.className = 'dc-btn';
          upBtn.textContent = `Upgrade Mk ${tier + 1} (${deps.isGodMode() ? 'Free' : `${upCost} ac`})`;
          upBtn.addEventListener('click', () => {
            if (!deps.isGodMode() && (!rec || rec.acorns < upCost)) {
              deps.onToast(`Need ${upCost} acorns.`);
              return;
            }
            const res = upgradeDefense(state, d.id);
            if (!res.ok) return;
            if (!deps.isGodMode() && rec) rec.acorns -= res.cost;
            saveCampState(state);
            deps.onSync(state);
            deps.onToast(`Upgraded ${cat?.name ?? d.kind} to Mk ${res.tier}!`);
            render();
          });
          box.append(upBtn);
        }
        bGrid.append(box);
      }
      builtCard.append(bGrid);
      wrap.append(builtCard);
    }

    // Build Security Defenses
    const defCard = document.createElement('div');
    defCard.className = 'dc-card';
    const defH = document.createElement('div');
    defH.style.cssText = 'font-weight:700;color:var(--dg-accent)';
    defH.textContent = 'Construct New Defenses & Turrets';
    const defGrid = document.createElement('div');
    defGrid.className = 'dc-grid';
    for (const d of DEFENSE_CATALOG) {
      const item = document.createElement('div');
      item.style.cssText = 'padding:8px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);display:flex;flex-direction:column;gap:6px';
      item.innerHTML = `<div style="font-weight:700">${d.name}</div><div style="font-size:12px;color:var(--dg-muted)">${d.desc}</div><div style="font-size:12px">+${d.securityValue} Security · ${d.costAcorns} acorns</div>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dc-btn';
      btn.textContent = `Place Here (${deps.isGodMode() ? 'Free' : `${d.costAcorns} ac`})`;
      btn.addEventListener('click', () => {
        if (!state.established) { deps.onToast('Establish a camp first!'); return; }
        if (!deps.isGodMode() && (!rec || rec.acorns < d.costAcorns)) {
          deps.onToast(`Need ${d.costAcorns} acorns.`);
          return;
        }
        if (!deps.isGodMode() && rec) rec.acorns -= d.costAcorns;
        const p = deps.getPlayer();
        const x = p.pos.x + Math.sin(p.facing) * 2.2;
        const z = p.pos.z + Math.cos(p.facing) * 2.2;
        addCampDefense(state, d.kind, { x, y: p.pos.y, z });
        saveCampState(state);
        deps.onSync(state);
        deps.onToast(`Built ${d.name} (+${d.securityValue} Security)`);
        render();
      });
      item.append(btn);
      defGrid.append(item);
    }
    defCard.append(defH, defGrid);
    wrap.append(defCard);

    // Hire Survivors
    const hireCard = document.createElement('div');
    hireCard.className = 'dc-card';
    const hireH = document.createElement('div');
    hireH.style.cssText = 'font-weight:700;color:var(--dg-accent)';
    hireH.textContent = `Camp Crew & Hiring (${state.hired.length} hired)`;
    const hireGrid = document.createElement('div');
    hireGrid.className = 'dc-grid';
    for (const s of NAMED_SURVIVORS) {
      const hired = state.hired.find((h) => h.survivorId === s.id);
      const card = document.createElement('div');
      card.style.cssText = 'padding:8px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);display:flex;flex-direction:column;gap:6px';
      card.innerHTML = `<div style="font-weight:700">${s.name}</div><div style="font-size:12px;color:var(--dg-muted)">${s.role} · ${s.blurb}</div>`;
      if (hired) {
        const badge = document.createElement('div');
        badge.style.cssText = 'font-size:12px;font-weight:700;color:var(--dg-ok)';
        badge.textContent = `✓ ${hired.role} · Morale ${hired.morale}% (Needs Sec ≥ ${hired.minSecurity})`;
        const sel = document.createElement('select');
        for (const r of ['guard', 'scavenger', 'cook', 'mechanic'] as CampRole[]) {
          const opt = document.createElement('option');
          opt.value = r;
          opt.textContent = `Reassign: ${r}`;
          opt.selected = r === hired.role;
          sel.append(opt);
        }
        sel.addEventListener('change', () => {
          reassignNpcRole(state, s.id, sel.value as CampRole);
          saveCampState(state);
          deps.onSync(state);
          render();
        });
        const disBtn = document.createElement('button');
        disBtn.type = 'button';
        disBtn.className = 'dc-btn';
        disBtn.textContent = 'Dismiss';
        disBtn.addEventListener('click', () => {
          dismissCampNpc(state, s.id);
          saveCampState(state);
          deps.onSync(state);
          render();
        });
        card.append(badge, sel, disBtn);
      } else {
        const sel = document.createElement('select');
        for (const r of ['guard', 'scavenger', 'cook', 'mechanic'] as CampRole[]) {
          const opt = document.createElement('option');
          opt.value = r;
          opt.textContent = `${r} (Sec ≥ ${r === 'guard' ? 15 : 25})`;
          sel.append(opt);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dc-btn';
        btn.textContent = 'Hire to Camp';
        btn.addEventListener('click', () => {
          const res = hireCampNpc(state, s.id, s.name, sel.value as CampRole);
          if (!res.ok) { deps.onToast(res.error ?? 'Cannot hire'); return; }
          saveCampState(state);
          const st = loadStoryState();
          setSurvivorStatus(st, s.id, 'recruited', state.region ?? s.home);
          saveStoryState(st);
          deps.onSync(state);
          deps.onToast(`🤝 Hired ${s.name} as ${sel.value}!`);
          render();
        });
        card.append(sel, btn);
      }
      hireGrid.append(card);
    }
    hireCard.append(hireH, hireGrid);
    wrap.append(hireCard);

    root.append(wrap);
  }

  return { root, state, open, close, toggle, isOpen: () => openFlag };
}
