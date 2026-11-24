// Vehicle Modding Garage UI: 6 slots (Engine/Belt/Oil/Wheels/Exhaust/Bumper), Repair/Refuel, Franken-Build hints & Stash.
import {
  MOD_SLOTS,
  VEHICLE_DEFS,
  evaluateVehicle,
  getPart,
  refuelVehicle,
  repairVehicle,
  saveVehicleStore,
  type PartSlot,
  type VehicleInstance,
  type VehicleStore,
} from '../vehicles/model';

export interface VehiclePanel {
  root: HTMLElement;
  open(v: VehicleInstance): void;
  close(): void;
  isOpen(): boolean;
}

const SLOT_LABEL: Record<PartSlot, string> = {
  engine: 'Engine (Req)',
  belt: 'Drive Belt (Req)',
  oil: 'Oil / Fuel (Req)',
  wheels: 'Wheels (Req)',
  exhaust: 'Exhaust (Mod)',
  bumper: 'Bumper / Plow (Mod)',
};

const CSS = `
#dayg-vehicle{position:fixed;inset:0;z-index:58;display:none;align-items:center;justify-content:center;
  background:rgba(10,14,10,0.82);backdrop-filter:blur(6px);pointer-events:auto;padding:12px;box-sizing:border-box;
  color:var(--dg-text);font:14px var(--dg-font)}
#dayg-vehicle.dv-open{display:flex}
#dayg-vehicle .dv-card{width:min(620px,96vw);max-height:92dvh;overflow-y:auto;background:var(--dg-surface);
  border:1px solid var(--dg-border-strong);border-radius:var(--dg-radius);box-shadow:var(--dg-shadow);padding:16px;display:flex;flex-direction:column;gap:12px}
#dayg-vehicle .dv-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border);padding-bottom:8px}
#dayg-vehicle .dv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
#dayg-vehicle .dv-slot{padding:10px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);display:flex;flex-direction:column;gap:6px}
#dayg-vehicle .dv-btn{min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);
  background:var(--dg-surface-2);color:var(--dg-text);font:13px var(--dg-font);cursor:pointer;touch-action:manipulation}
#dayg-vehicle .dv-btn:hover:not(:disabled){background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#dayg-vehicle .dv-btn:disabled{opacity:.45;cursor:default}
#dayg-vehicle select{min-height:44px;flex:1 1 150px;padding:6px 8px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:var(--dg-text);font:13px var(--dg-font)}`;

export function createVehiclePanel(ui: HTMLElement, deps: {
  store: VehicleStore;
  onRebuild: (id: string) => void;
  onDrive: (id: string) => boolean;
}): VehiclePanel {
  if (!document.getElementById('dayg-vehicle-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-vehicle-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'dayg-vehicle';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Vehicle Modding Garage');
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  ui.appendChild(root);

  let current: VehicleInstance | null = null;
  let openFlag = false;

  function open(v: VehicleInstance): void {
    current = v;
    openFlag = true;
    root.classList.add('dv-open');
    render();
  }
  function close(): void {
    openFlag = false;
    current = null;
    root.classList.remove('dv-open');
  }
  window.addEventListener('keydown', (e) => { if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); } });

  function render(): void {
    if (!openFlag || !current) return;
    const v = current;
    const def = VEHICLE_DEFS[v.kind];
    const st = evaluateVehicle(v);

    root.replaceChildren();
    const card = document.createElement('div');
    card.className = 'dv-card';

    const head = document.createElement('div');
    head.className = 'dv-head';
    const title = document.createElement('div');
    title.innerHTML = `<div style="font:700 18px var(--dg-font);color:var(--dg-accent)">${def.name}</div><div style="font-size:12px;color:var(--dg-muted)">${def.desc} · Stash: ${deps.store.stash.length} parts</div>`;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dv-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    head.append(title, closeBtn);
    card.append(head);

    // Stats, Health/Fuel & Synergies
    const statsBox = document.createElement('div');
    statsBox.style.cssText = 'padding:10px;border-radius:8px;background:rgba(0,0,0,0.22);font-size:13px;display:flex;flex-direction:column;gap:6px';
    statsBox.innerHTML =
      `<div><strong>Top Speed:</strong> ${st.topSpeed} gm/s · <strong>Accel:</strong> ${st.accel} · <strong>Handling:</strong> ${st.handling} · <strong>Noise:</strong> ${st.noise} · <strong>Ram:</strong> ${st.ramDamage}</div>` +
      `<div style="font-size:12px;color:var(--dg-muted)">HP: ${v.hp ?? 100}/${v.maxHp ?? 100} · Fuel: ${v.fuel ?? 100}% · Tip: Try a Cast-Iron V8 in a small frame or Spiked Plow + V8!</div>`;
    const maintRow = document.createElement('div');
    maintRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    const repBtn = document.createElement('button');
    repBtn.type = 'button';
    repBtn.className = 'dv-btn';
    repBtn.textContent = 'Repair Chassis';
    repBtn.addEventListener('click', () => { repairVehicle(v); saveVehicleStore(deps.store); render(); });
    const fuelBtn = document.createElement('button');
    fuelBtn.type = 'button';
    fuelBtn.className = 'dv-btn';
    fuelBtn.textContent = 'Refuel';
    fuelBtn.addEventListener('click', () => { refuelVehicle(v); saveVehicleStore(deps.store); render(); });
    maintRow.append(repBtn, fuelBtn);
    statsBox.append(maintRow);

    if (!st.runnable) {
      const m = document.createElement('div');
      m.style.color = 'var(--dg-danger)';
      m.textContent = `⚠ Missing required parts: ${st.missing.join(', ')}`;
      statsBox.append(m);
    }
    for (const s of st.synergies) {
      const el = document.createElement('div');
      el.style.color = 'var(--dg-accent)';
      el.textContent = s;
      statsBox.append(el);
    }
    for (const p of st.penalties) {
      const el = document.createElement('div');
      el.style.color = 'var(--dg-warn)';
      el.textContent = `⚠ ${p}`;
      statsBox.append(el);
    }
    card.append(statsBox);

    // 6 Modding Slots
    const grid = document.createElement('div');
    grid.className = 'dv-grid';
    for (const slot of MOD_SLOTS) {
      const installed = getPart(v.parts[slot]);
      const box = document.createElement('div');
      box.className = 'dv-slot';
      box.innerHTML = `<div style="font-weight:700">${SLOT_LABEL[slot]}: <span style="color:${installed ? 'var(--dg-ok)' : 'var(--dg-muted)'}">${installed ? installed.name : 'Empty'}</span></div>` +
        (installed ? `<div style="font-size:12px;color:var(--dg-muted)">${installed.desc}</div>` : '');

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
      if (installed) {
        const stripBtn = document.createElement('button');
        stripBtn.type = 'button';
        stripBtn.className = 'dv-btn';
        stripBtn.textContent = 'Strip';
        stripBtn.addEventListener('click', () => {
          deps.store.stash.push(installed.id);
          delete v.parts[slot];
          saveVehicleStore(deps.store);
          deps.onRebuild(v.id);
          render();
        });
        row.append(stripBtn);
      }

      const matching = [...new Set(deps.store.stash)].filter((id) => getPart(id)?.slot === slot);
      if (matching.length > 0) {
        const sel = document.createElement('select');
        for (const id of matching) {
          const p = getPart(id)!;
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = `${p.name} (${p.size})`;
          sel.append(opt);
        }
        const fitBtn = document.createElement('button');
        fitBtn.type = 'button';
        fitBtn.className = 'dv-btn';
        fitBtn.textContent = 'Install';
        fitBtn.addEventListener('click', () => {
          const pick = sel.value;
          const idx = deps.store.stash.indexOf(pick);
          if (idx < 0) return;
          deps.store.stash.splice(idx, 1);
          if (installed) deps.store.stash.push(installed.id);
          v.parts[slot] = pick;
          saveVehicleStore(deps.store);
          deps.onRebuild(v.id);
          render();
        });
        row.append(sel, fitBtn);
      }
      box.append(row);
      grid.append(box);
    }
    card.append(grid);

    const driveBtn = document.createElement('button');
    driveBtn.type = 'button';
    driveBtn.className = 'dv-btn';
    driveBtn.style.cssText = 'background:#4a5a36;font-weight:700';
    driveBtn.disabled = !st.runnable;
    driveBtn.textContent = st.runnable ? `Drive ${def.name}` : 'Install all 4 required parts to drive';
    driveBtn.addEventListener('click', () => {
      if (deps.onDrive(v.id)) close();
    });
    card.append(driveBtn);

    root.append(card);
  }

  return { root, open, close, isOpen: () => openFlag };
}
