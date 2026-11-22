// Quest Journal: 44px top-right button + J key overlay showing Active, Available, and Completed quests,
// with Abandon and Restart Step recovery controls. Appended to #ui, never mutating #ui itself.
import type { Hud } from '../types';
import { isQuestAvailable, type Quests } from './quests';

const CSS = `
#gta-journal-btn{position:fixed;right:calc(env(safe-area-inset-right) + 158px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(20,20,20,.55);color:#fff;font-size:20px;line-height:1;padding:0;cursor:pointer;pointer-events:auto;touch-action:manipulation;}
#gta-journal{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);background:rgba(8,10,14,.76);font-family:system-ui,sans-serif;color:#fff;pointer-events:auto;}
#gta-journal.open{display:flex;}
#gta-journal .j-card{width:min(94vw,520px);max-height:84dvh;display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:rgba(20,22,28,.96);border:2px solid rgba(255,210,63,.65);box-shadow:0 12px 36px rgba(0,0,0,.6);box-sizing:border-box;}
#gta-journal .j-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-journal .j-title{font-size:18px;font-weight:800;color:#ffd23f;letter-spacing:.04em;}
#gta-journal .j-close{width:44px;height:44px;border-radius:10px;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:20px;cursor:pointer;}
#gta-journal .j-tabs{display:flex;gap:6px;}
#gta-journal .j-tab{flex:1;min-height:44px;border-radius:10px;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;}
#gta-journal .j-tab.on{border-color:#ffd23f;background:rgba(255,210,63,.2);color:#ffd23f;}
#gta-journal .j-body{overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px;}
#gta-journal .j-item{padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);text-align:left;color:#fff;font-family:inherit;}
#gta-journal button.j-item{cursor:pointer;min-height:44px;}
#gta-journal .j-item-title{font-size:14px;font-weight:800;color:#ffd23f;display:flex;justify-content:space-between;gap:8px;}
#gta-journal .j-item-sub{font-size:12px;opacity:.85;margin-top:3px;line-height:1.35;}
#gta-journal .j-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}
#gta-journal .j-act{min-height:44px;padding:0 14px;border-radius:10px;border:1.5px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;}
#gta-journal .j-act.warn{border-color:#ff5c5c;color:#ffb4b4;background:rgba(255,60,60,.16);}
#gta-journal .j-empty{padding:18px 8px;text-align:center;font-size:13px;opacity:.75;}
`;

export function createQuestJournal(ui: HTMLElement, quests: Quests, hud: Hud): { isOpen(): boolean; toggle(): void; close(): void } {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'gta-journal-btn';
  btn.setAttribute('aria-label', 'Quest Journal (J)');
  btn.title = 'Quest Journal (J)';
  btn.textContent = '📜';

  const overlay = document.createElement('div');
  overlay.id = 'gta-journal';
  overlay.innerHTML = `
    <div class="j-card">
      <div class="j-head">
        <span class="j-title">Quest Journal</span>
        <button type="button" class="j-close" aria-label="Close Quest Journal">✕</button>
      </div>
      <div class="j-tabs">
        <button type="button" class="j-tab on" data-tab="active">Active</button>
        <button type="button" class="j-tab" data-tab="available">Available</button>
        <button type="button" class="j-tab" data-tab="done">Completed</button>
      </div>
      <div class="j-body"></div>
    </div>
  `;
  ui.append(btn, overlay);

  const body = overlay.querySelector('.j-body') as HTMLElement;
  const closeBtn = overlay.querySelector('.j-close') as HTMLButtonElement;
  const tabBtns = [...overlay.querySelectorAll<HTMLButtonElement>('.j-tab')];
  let tab: 'active' | 'available' | 'done' = 'active';
  let open = false;

  const stripTags = (s: string): string => s.replace(/\{\{|\}\}/g, '');

  function render(): void {
    const snap = quests.getJournal();
    body.innerHTML = '';
    for (const tb of tabBtns) tb.classList.toggle('on', tb.dataset.tab === tab);

    const doneCount = Object.values(snap.saves).filter((s) => s.state === 'done').length;
    const doneTab = tabBtns.find((b) => b.dataset.tab === 'done');
    if (doneTab) doneTab.textContent = `Completed (${doneCount}/${snap.quests.length})`;

    if (tab === 'active') {
      const q = snap.activeId ? snap.quests.find((x) => x.id === snap.activeId) : null;
      if (!q) {
        body.innerHTML = '<div class="j-empty">No active quest. Walk up to any glowing marker on the map or check the Available tab.</div>';
        return;
      }
      const g = snap.givers[q.giver];
      const box = document.createElement('div');
      box.className = 'j-item';
      const chapter = q.chapter ? `Ch.${q.chapter}` : 'Side';
      box.innerHTML = `
        <div class="j-item-title"><span>${q.title}</span><span>${chapter} · 🌰 ${q.rewardAcorns ?? 250}</span></div>
        <div class="j-item-sub">From: ${g?.name ?? q.giver} · Step ${snap.activeStep + 1} of ${q.objectives.length}</div>
        ${snap.activeLines.map((l) => `<div class="j-item-sub">• ${stripTags(l)}</div>`).join('')}
      `;
      const actions = document.createElement('div');
      actions.className = 'j-actions';
      const restart = document.createElement('button');
      restart.type = 'button';
      restart.className = 'j-act';
      restart.textContent = '↺ Restart Step';
      restart.addEventListener('click', () => { quests.restartActive(); render(); });
      const abandon = document.createElement('button');
      abandon.type = 'button';
      abandon.className = 'j-act warn';
      abandon.textContent = '✕ Abandon Quest';
      abandon.addEventListener('click', () => { quests.abandonActive(); render(); });
      actions.append(restart, abandon);
      box.appendChild(actions);
      body.appendChild(box);
      return;
    }

    if (tab === 'available') {
      const avail = snap.quests.filter((q) => isQuestAvailable(q, snap.saves));
      if (avail.length === 0) {
        body.innerHTML = '<div class="j-empty">All available contracts completed!</div>';
        return;
      }
      for (const q of avail) {
        const g = snap.givers[q.giver];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'j-item';
        const tag = q.chapter ? `Ch.${q.chapter}` : 'Side';
        b.innerHTML = `
          <div class="j-item-title"><span>${q.title}</span><span>${tag} · 🌰 ${q.rewardAcorns ?? 250}</span></div>
          <div class="j-item-sub">Giver: ${g?.name ?? q.giver} (${Math.round(g?.x ?? 0)}, ${Math.round(g?.z ?? 0)})</div>
        `;
        b.addEventListener('click', () => {
          close();
          hud.toast(`Head to ${g?.name ?? q.giver} at (${Math.round(g?.x ?? 0)}, ${Math.round(g?.z ?? 0)}).`, 4500);
        });
        body.appendChild(b);
      }
      return;
    }

    const doneList = snap.quests.filter((q) => snap.saves[q.id]?.state === 'done');
    if (doneList.length === 0) {
      body.innerHTML = '<div class="j-empty">No quests completed yet.</div>';
      return;
    }
    for (const q of doneList) {
      const box = document.createElement('div');
      box.className = 'j-item';
      box.innerHTML = `
        <div class="j-item-title"><span>✓ ${q.title}</span><span>${q.chapter ? `Ch.${q.chapter}` : 'Side'}</span></div>
        <div class="j-item-sub">${q.doneText}</div>
      `;
      body.appendChild(box);
    }
  }

  function setOpen(next: boolean): void {
    open = next;
    overlay.classList.toggle('open', open);
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      render();
    }
  }

  function close(): void {
    if (open) setOpen(false);
  }

  function toggle(): void {
    setOpen(!open);
  }

  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
  body.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  closeBtn.addEventListener('click', () => close());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  for (const tb of tabBtns) {
    tb.addEventListener('click', () => {
      tab = (tb.dataset.tab as typeof tab) ?? 'active';
      render();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyJ' && !e.repeat) toggle();
    else if (e.code === 'Escape' && open) close();
  });

  return { isOpen: () => open, toggle, close };
}
