// Kiln-Shield vehicle cover at runtime (E08, L15): a phone app listing the player's vehicles with Insure buttons and
// insured write-offs with Reclaim buttons. A reclaimed vehicle comes back to its garage at full health (call it in
// with the Sling-Lift). Subscribes to the Lock-Up's write-offs to file them with ownership.ts.
import { VEHICLES } from '../config';
import { ECON_ACH } from '../econAchievements';
import { KEYS } from '../keys';
import type { Economy } from '../economy';
import type { Ownership } from '../ownership';
import type { Phone } from '../phone/phone';
import type { Sfx } from '../types';
import type { Lockup } from './runtime';
import type { StorageKind, StoredVehicle } from './types';

export interface InsuranceDeps {
  /** The shared #ui element. */
  ui: HTMLElement;
  hud: { toast(text: string, ms?: number): void };
  phone: Phone;
  economy: Pick<Economy, 'state'>;
  ownership: Ownership;
  lockup: Pick<Lockup, 'list' | 'addSnapshot' | 'free' | 'onWrittenOff'>;
  play(sfx: Sfx): void;
  achievements: { unlock(id: string): unknown };
  /** Why the phone app cannot open now, or null. */
  blocked(): string | null;
  /** The value of a vehicle for its policy: ownership.boughtFor(uid) ?? dealerPrice(kind, variant) ?? UNLISTED_VALUE. */
  valueOf(rec: StoredVehicle): number;
}

export interface Insurance {
  update(dt: number): void;
  isOpen(): boolean;
  /** Reclaim the wreck uid into its garage. Error sentence, or null when it is back. */
  reclaim(uid: string): string | null;
}

const PLACE: Record<StorageKind, string> = {
  ground: 'the Lock-Up',
  air: 'Hangar Two',
  water: 'the Mossbank Boathouse',
};

const ROOT_ID = 'gta-kiln-shield';
const STYLE_ID = 'gta-ks-style';

const CSS = `
#gta-kiln-shield{position:fixed;inset:0;pointer-events:none;z-index:36;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-kiln-shield button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-kiln-shield .gta-ks-backdrop{
  position:fixed;inset:0;display:none;align-items:flex-end;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:auto;box-sizing:border-box;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
}
#gta-kiln-shield .gta-ks-backdrop.open{display:flex;}
#gta-kiln-shield .gta-ks-modal{
  width:min(100%,560px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:10px;
}
#gta-kiln-shield .gta-ks-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-kiln-shield .gta-ks-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-kiln-shield .gta-ks-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-kiln-shield .gta-ks-section{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;opacity:0.85;margin-top:6px;}
#gta-kiln-shield .gta-ks-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;flex:none;
}
#gta-kiln-shield .gta-ks-row{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);box-sizing:border-box;
}
#gta-kiln-shield .gta-ks-info{flex:1 1 160px;min-width:0;}
#gta-kiln-shield .gta-ks-name{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-kiln-shield .gta-ks-meta{font-size:12px;opacity:0.8;margin-top:2px;}
#gta-kiln-shield .gta-ks-covered{font-size:13px;font-weight:800;color:#7bd67b;min-height:44px;display:flex;align-items:center;}
#gta-kiln-shield .gta-ks-btn{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #ffd23f;
  background:rgba(255,210,63,0.16);color:#ffd23f;font-size:14px;font-weight:800;
}
#gta-kiln-shield .gta-ks-btn:disabled{opacity:0.5;cursor:default;border-color:rgba(255,255,255,0.3);color:#f4f6f8;background:rgba(255,255,255,0.06);}
#gta-kiln-shield .gta-ks-reason{font-size:12px;opacity:0.85;}
#gta-kiln-shield .gta-ks-msg{font-size:13px;color:#ffb3a0;min-height:18px;}
#gta-kiln-shield .gta-ks-empty{font-size:13px;opacity:0.7;}
`;

function storageKindOf(rec: StoredVehicle): StorageKind {
  const spec = VEHICLES[rec.kind];
  return spec.flies ? 'air' : spec.boat ? 'water' : 'ground';
}

export function createInsurance(deps: InsuranceDeps): Insurance {
  const { ownership, lockup, hud, achievements, play } = deps;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = ROOT_ID;

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-ks-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-ks-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Kiln-Shield');

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  deps.ui.appendChild(root);

  // Touches on the sheet must not start the stick, camera drag or pointer lock underneath.
  backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  let isOpen = false;
  let message = '';
  let renderTimer = 0;
  let pruneTimer = 0;

  function button(label: string, cls: string, onClick: () => void, disabled = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `gta-ks-btn ${cls}`.trim();
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function text(tag: string, cls: string, value: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = value;
    return el;
  }

  function reclaimReason(wreck: StoredVehicle): { reason: string | null; deductible: number } {
    const v = ownership.policy(wreck.uid)?.value ?? deps.valueOf(wreck);
    const d = ownership.deductibleFor(v);
    const wait = ownership.reclaimWait(wreck.uid);
    if (wait > 0) return { reason: `Ready in ${Math.ceil(wait)} s`, deductible: d };
    const kind = storageKindOf(wreck);
    if (lockup.free(kind) === 0) return { reason: `${PLACE[kind]} is full`, deductible: d };
    if (deps.economy.state().acorns < d) return { reason: 'Not enough Acorns', deductible: d };
    return { reason: null, deductible: d };
  }

  function claimRow(wreck: StoredVehicle): HTMLElement {
    const row = document.createElement('div');
    row.className = 'gta-ks-row';
    const info = document.createElement('div');
    info.className = 'gta-ks-info';
    const v = ownership.policy(wreck.uid)?.value ?? deps.valueOf(wreck);
    const { reason, deductible } = reclaimReason(wreck);
    info.appendChild(text('div', 'gta-ks-name', wreck.name));
    info.appendChild(text('div', 'gta-ks-meta', `value ${v} · deductible ${deductible} 🌰`));
    if (reason) info.appendChild(text('div', 'gta-ks-reason', reason));
    row.appendChild(info);
    row.appendChild(button('Reclaim', '', () => {
      const err = reclaim(wreck.uid);
      if (err) message = err;
      render();
    }, reason !== null));
    return row;
  }

  function vehicleRow(rec: StoredVehicle): HTMLElement {
    const row = document.createElement('div');
    row.className = 'gta-ks-row';
    const info = document.createElement('div');
    info.className = 'gta-ks-info';
    info.appendChild(text('div', 'gta-ks-name', rec.name));
    info.appendChild(text('div', 'gta-ks-meta', PLACE[storageKindOf(rec)]));
    row.appendChild(info);
    if (ownership.insured(rec.uid)) {
      row.appendChild(text('div', 'gta-ks-covered', 'Covered'));
      return row;
    }
    const fee = ownership.feeFor(deps.valueOf(rec));
    row.appendChild(button(`Insure · ${fee} 🌰`, '', () => {
      const r = ownership.insure(rec.uid, deps.valueOf(rec));
      if (!r.ok) {
        message = r.error;
      } else {
        message = '';
        play('door');
        hud.toast(`Kiln-Shield: your ${rec.name} is covered.`);
      }
      render();
    }));
    return row;
  }

  function section(title: string): HTMLElement {
    return text('div', 'gta-ks-section', title);
  }

  function render(): void {
    if (!isOpen) return;
    modal.replaceChildren();

    const head = document.createElement('div');
    head.className = 'gta-ks-head';
    const titles = document.createElement('div');
    titles.appendChild(text('h2', 'gta-ks-title', 'Kiln-Shield'));
    titles.appendChild(text('div', 'gta-ks-sub', 'Vehicle cover. We pay out. Mostly.'));
    head.appendChild(titles);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gta-ks-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => close());
    head.appendChild(closeBtn);
    modal.appendChild(head);

    const wrecks = ownership.wrecks();
    if (wrecks.length > 0) {
      modal.appendChild(section('Claims'));
      for (const w of wrecks) modal.appendChild(claimRow(w));
    }

    modal.appendChild(section('Your vehicles'));
    const list = lockup.list();
    if (list.length === 0) {
      modal.appendChild(text('div', 'gta-ks-empty', 'Nothing in your garages to cover yet.'));
    } else {
      for (const rec of list) modal.appendChild(vehicleRow(rec));
    }

    modal.appendChild(text('div', 'gta-ks-msg', message));
  }

  function reclaim(uid: string): string | null {
    const wreck = ownership.wrecks().find((w) => w.uid === uid);
    if (!wreck) return 'No such claim.';
    const kind = storageKindOf(wreck);
    const place = PLACE[kind];
    if (lockup.free(kind) === 0) return `${place} is full. Make room first.`;
    const r = ownership.reclaim(uid);
    if (!r.ok) return r.error;
    const { uid: _u, storedAt: _s, ...snap } = r.rec;
    const rec2 = lockup.addSnapshot({ ...snap, hp: 1 });
    if (!rec2) return 'No room.';
    ownership.rekey(uid, rec2.uid);
    achievements.unlock(ECON_ACH.reclaim);
    play('door');
    hud.toast(`Kiln-Shield: claim APPROVED (for once). Your ${r.rec.name} is back in ${place}.`);
    return null;
  }

  function onKey(e: KeyboardEvent): void {
    if (!isOpen) return;
    if (e.code !== KEYS.close) return;
    e.stopImmediatePropagation();
    close();
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    message = '';
    backdrop.classList.add('open');
    render();
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('open');
    modal.replaceChildren();
  }

  window.addEventListener('keydown', onKey);

  deps.lockup.onWrittenOff((rec) => {
    if (deps.ownership.fileWreck(rec)) {
      const v = deps.ownership.policy(rec.uid)?.value ?? deps.valueOf(rec);
      deps.hud.toast(
        `Kiln-Shield: your ${rec.name} is covered. Reclaim it on the phone for ${deps.ownership.deductibleFor(v)} Acorns.`,
        5000,
      );
    }
  });

  deps.phone.addApp({
    id: 'kiln-shield',
    label: 'Kiln-Shield',
    icon: '🛡',
    detail: () => {
      const insured = lockup.list().filter((r) => ownership.insured(r.uid)).length;
      return `${insured} covered · ${ownership.wrecks().length} claims`;
    },
    run() {
      const blocked = deps.blocked();
      if (blocked) {
        hud.toast(blocked);
        return;
      }
      open();
    },
  });

  return {
    update(dt: number) {
      renderTimer += dt;
      if (renderTimer >= 1) {
        renderTimer = 0;
        render();
      }

      pruneTimer += dt;
      if (pruneTimer >= 5) {
        pruneTimer = 0;
        const live = new Set<string>([
          ...lockup.list().map((r) => r.uid),
          ...ownership.wrecks().map((w) => w.uid),
        ]);
        for (const uid of ownership.policyUids()) {
          if (!live.has(uid)) ownership.forget(uid);
        }
      }
    },
    isOpen: () => isOpen,
    reclaim,
  };
}
