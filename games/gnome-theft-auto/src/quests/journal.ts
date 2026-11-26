// Quest Journal: J key overlay (and the More menu's 'journal' action) showing Active, Open, Later and Completed quests,
// with Abandon and Restart Step recovery controls, and the perk (perks.ts) each side quest unlocks. Open quests pin their giver as the map waypoint. Appended to #ui,
// never mutating #ui itself.
import { placeName } from '../city/places';
import { KEYS } from '../keys';
import { perkActive, perkForQuest } from '../perks';
import { registerAction } from '../ui/actions';
import { fillHint } from '../ui/glyphs';
import type { Hud } from '../types';
import { isPaced, sidePacing } from './pacing';
import { isQuestAvailable, type Quests } from './quests';
import { storyItems } from './storyMarks';
import type { QuestDef } from './types';
import { MAIN_COLOR, sideColor, unlockRule } from './unlocks';

const CSS = `
#gta-journal{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);background:rgba(8,10,14,.76);font-family:system-ui,sans-serif;color:#fff;pointer-events:auto;}
#gta-journal.open{display:flex;}
#gta-journal .j-card{width:min(94vw,520px);max-height:84dvh;display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:rgba(20,22,28,.96);border:2px solid rgba(255,210,63,.65);box-shadow:0 12px 36px rgba(0,0,0,.6);box-sizing:border-box;}
#gta-journal .j-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-journal .j-title{font-size:18px;font-weight:800;color:#ffd23f;letter-spacing:.04em;}
#gta-journal .j-close{width:44px;height:44px;border-radius:10px;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:20px;cursor:pointer;}
#gta-journal .j-tabs{display:flex;gap:6px;}
#gta-journal .j-tab{flex:1 1 0;min-width:0;min-height:44px;padding:0 3px;border-radius:10px;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font:700 11px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;}
#gta-journal .j-tab[data-tab="available"]{flex-grow:1.5;}
#gta-journal .j-tab[data-tab="later"]{flex-grow:1.1;}
#gta-journal .j-tab[data-tab="done"]{flex-grow:1.7;}
#gta-journal .j-tab[data-tab="items"]{flex-grow:1;}
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

type Tab = 'active' | 'available' | 'later' | 'done' | 'items';
type Snap = ReturnType<Quests['getJournal']>;

/** The Story or Side tag for a quest: '★ Ch.N' in the story gold, '? Side' in the colour of the giver who offers it. */
function tagHtml(q: QuestDef): string {
  if (q.chapter !== undefined) return `<span style="color:${MAIN_COLOR}">★ Ch.${q.chapter}</span>`;
  return `<span style="color:${sideColor(q.giver)}">? Side</span>`;
}

export function createQuestJournal(ui: HTMLElement, quests: Quests, hud: Hud): { isOpen(): boolean; toggle(): void; close(): void } {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

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
        <button type="button" class="j-tab" data-tab="later">Later</button>
        <button type="button" class="j-tab" data-tab="done">Completed</button>
        <button type="button" class="j-tab" data-tab="items">Items</button>
      </div>
      <div class="j-body"></div>
    </div>
  `;
  ui.append(overlay);

  const body = overlay.querySelector('.j-body') as HTMLElement;
  const closeBtn = overlay.querySelector('.j-close') as HTMLButtonElement;
  const tabBtns = [...overlay.querySelectorAll<HTMLButtonElement>('.j-tab')];
  let tab: Tab = 'active';
  let open = false;

  const stripTags = (s: string): string => s.replace(/\{\{|\}\}/g, '');
  /** The side-quest perk line (perks.ts): what finishing it unlocks, or whether it is on once done. */
  const perkHtml = (q: QuestDef, done: boolean): string => {
    const p = perkForQuest(q.id);
    if (!p) return '';
    const state = done ? (perkActive(p.id) ? '' : ' (off)') : '';
    return `<div class="j-item-sub">🎁 ${done ? 'Perk' : 'Unlocks'}: <b>${p.name}</b>${state}: ${p.text}</div>`;
  };

  /** One takeable quest: tap to pin its giver as the waypoint and close. Used by the Open and Later tabs. */
  function offerButton(q: QuestDef, snap: Snap): HTMLButtonElement {
    const g = snap.givers[q.giver];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-item';
    const pinnedHere = snap.pinned === q.giver;
    b.innerHTML = `
      <div class="j-item-title"><span>${q.title}</span><span>${tagHtml(q)} · 🌰 ${q.rewardAcorns ?? 250}</span></div>
      <div class="j-item-sub">Giver: ${g ? `${g.name} · ${placeName(g.x, g.z)}` : q.giver} (${Math.round(g?.x ?? 0)}, ${Math.round(g?.z ?? 0)})${pinnedHere ? ' · 📍 Waypoint' : ''}</div>
      ${perkHtml(q, false)}
    `;
    b.addEventListener('click', () => {
      quests.pinGiver(q.giver);
      close();
      hud.toast(`Waypoint set: ${g?.name ?? q.giver}. Follow the dotted route on the map.`, 4500);
    });
    return b;
  }

  function render(): void {
    const snap = quests.getJournal();
    body.innerHTML = '';

    const pace = sidePacing(snap.saves, snap.quests);
    const offeredSet = new Set(pace.offered);
    const availAll = snap.quests.filter((q) => isQuestAvailable(q, snap.saves));
    const storyAvail = availAll.filter((q) => q.chapter !== undefined);
    const sideAvail = availAll.filter((q) => q.chapter === undefined && (!isPaced(q.id) || offeredSet.has(q.id)));
    const sideOrder = [
      ...pace.offered.map((id) => sideAvail.find((q) => q.id === id)).filter((q): q is QuestDef => !!q),
      ...sideAvail.filter((q) => !offeredSet.has(q.id)),
    ];
    const avail = [...storyAvail, ...sideOrder];
    const later = pace.later.map((id) => snap.quests.find((q) => q.id === id)).filter((q): q is QuestDef => !!q);
    const doneList = snap.quests.filter((q) => snap.saves[q.id]?.state === 'done');
    const labels: Record<Tab, string> = {
      active: 'Active',
      available: `Open ${avail.length}`,
      later: `Later ${later.length}`,
      done: `Done ${doneList.length}/${snap.quests.length}`,
      items: 'Items',
    };
    for (const tb of tabBtns) {
      const key = tb.dataset.tab as Tab;
      tb.classList.toggle('on', key === tab);
      tb.textContent = labels[key] ?? tb.textContent;
      tb.title = tb.textContent ?? '';
    }

    if (tab === 'active') {
      const q = snap.activeId ? snap.quests.find((x) => x.id === snap.activeId) : null;
      if (!q) {
        body.innerHTML = '<div class="j-empty">No active quest. Walk up to any glowing marker on the map or check the Available tab.</div>';
        return;
      }
      const g = snap.givers[q.giver];
      const box = document.createElement('div');
      box.className = 'j-item';
      box.innerHTML = `
        <div class="j-item-title"><span>${q.title}</span><span>${tagHtml(q)} · 🌰 ${q.rewardAcorns ?? 250}</span></div>
        <div class="j-item-sub">From: ${g ? `${g.name} · ${placeName(g.x, g.z)}` : q.giver} · Step ${snap.activeStep + 1} of ${q.objectives.length}</div>
        ${perkHtml(q, false)}
        ${snap.activeLines.map((l) => `<div class="j-item-sub">• ${fillHint(stripTags(l))}</div>`).join('')}
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
      if (pace.later.length > 0) {
        const line = document.createElement('div');
        line.className = 'j-item-sub';
        line.textContent = `Side jobs on offer: ${sideOrder.length}/${pace.cap}. More wait on the Later shelf.`;
        body.appendChild(line);
      }
      if (snap.pinned) {
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'j-act';
        clear.textContent = 'Clear waypoint';
        clear.addEventListener('click', () => { quests.pinGiver(null); render(); });
        body.appendChild(clear);
      }
      if (avail.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'j-empty';
        empty.textContent = 'Nothing on offer right now. Keep playing the story to open more.';
        body.appendChild(empty);
      }
      for (const q of avail) body.appendChild(offerButton(q, snap));
      const coming: string[] = [];
      for (const id of pace.upcoming) {
        const q = snap.quests.find((x) => x.id === id);
        const rule = unlockRule(id);
        if (!q || !rule) continue;
        const after = snap.quests.find((x) => x.id === rule.after);
        coming.push(`<div class="j-item-sub">• ${q.title} · after "${after?.title ?? rule.after}"</div>`);
      }
      if (coming.length > 0) {
        const box = document.createElement('div');
        box.className = 'j-item';
        box.innerHTML = `<div class="j-item-title"><span>Coming up</span></div>${coming.join('')}`;
        body.appendChild(box);
      }
      return;
    }

    if (tab === 'later') {
      const intro = document.createElement('div');
      intro.className = 'j-item-sub';
      intro.textContent = 'Still open. Their givers will take you on any time; tap one to set a waypoint.';
      body.appendChild(intro);
      if (later.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'j-empty';
        empty.textContent = 'Nothing on the shelf.';
        body.appendChild(empty);
        return;
      }
      for (const q of later) body.appendChild(offerButton(q, snap));
      return;
    }

    if (tab === 'items') {
      const items = storyItems((id) => snap.saves[id]?.state === 'done');
      if (items.length === 0) {
        body.innerHTML = '<div class="j-empty">No story items yet.</div>';
        return;
      }
      for (const it of items) {
        const box = document.createElement('div');
        box.className = 'j-item';
        box.innerHTML = `<div class="j-item-title"><span>${it.title}</span></div><div class="j-item-sub">${it.text}</div>`;
        body.appendChild(box);
      }
      return;
    }

    if (doneList.length === 0) {
      body.innerHTML = '<div class="j-empty">No quests completed yet.</div>';
      return;
    }
    for (const q of doneList) {
      const box = document.createElement('div');
      box.className = 'j-item';
      box.innerHTML = `
        <div class="j-item-title"><span>✓ ${q.title}</span><span>${tagHtml(q)}</span></div>
        <div class="j-item-sub">${q.doneText}</div>
        ${perkHtml(q, true)}
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

  overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
  body.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  closeBtn.addEventListener('click', () => close());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  for (const tb of tabBtns) {
    tb.addEventListener('click', () => {
      tab = (tb.dataset.tab as Tab) ?? 'active';
      render();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === KEYS.journal && !e.repeat) toggle();
    else if (e.code === KEYS.close && open) close();
  });
  registerAction('journal', { run: toggle });

  return { isOpen: () => open, toggle, close };
}
