import type { GiftId, Resident, ResidentId, Save } from './config';
import { FRIEND_MIN_POINTS, GIFTS, GIFT_IDS, MAX_POINTS } from './config';
import { bagCount } from './friendship';

export interface FriendRow { resident: Resident; points: number; level: string; where: string; }  // where = "At the Crumb & Crock until 13:00"

export interface Panels {
  openFriends(rows: FriendRow[], onPick: (id: ResidentId) => void): void;
  openBag(save: Save, onPick?: (item: GiftId) => void): void;       // with onPick, the list is a gift picker
  openResident(r: Resident, row: FriendRow, actions: { talk: () => void; give: () => void; canGive: boolean; canTalk: boolean }): void;
  close(): void;
  isOpen(): boolean;
}

const STYLE_ID = 'pc-panel-style';

const CSS = `
.pc-panel {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 50;
  box-sizing: border-box; max-height: 80vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  background: #f4ecd8; color: #1f3a1a; font-family: system-ui, sans-serif;
  border-radius: 16px 16px 0 0; box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.25); pointer-events: auto;
}
@media (min-width: 700px) {
  .pc-panel {
    left: 50%; right: auto; top: 50%; bottom: auto; transform: translate(-50%, -50%);
    width: 480px; max-width: calc(100% - 32px); border-radius: 14px;
  }
}
.pc-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.pc-title { flex: 1; margin: 0; font-size: 20px; color: #1f3a1a; }
.pc-close {
  width: 44px; height: 44px; min-width: 44px; border: 0; border-radius: 10px; background: transparent;
  color: #1f3a1a; font: inherit; font-size: 20px; cursor: pointer;
}
.pc-sub { margin: 0 0 8px; color: #7a4f2a; font-weight: 600; }
.pc-text { margin: 0 0 8px; line-height: 1.4; }
.pc-muted { margin: 0 0 8px; color: #5a4a36; font-size: 14px; }
.pc-list { display: flex; flex-direction: column; gap: 8px; }
.pc-row {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px; box-sizing: border-box;
  padding: 8px 10px; border: 1px solid #c9b48a; border-radius: 10px; background: #fbf6e9;
  color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.pc-row[disabled] { cursor: default; }
.pc-row-body { flex: 1; min-width: 0; }
.pc-row-name { font-weight: 700; }
.pc-row-meta { font-size: 13px; color: #5a4a36; }
.pc-row-where { font-size: 13px; color: #5a4a36; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-count { font-weight: 700; color: #7a4f2a; white-space: nowrap; }
.pc-icon { font-size: 22px; width: 32px; text-align: center; }
.pc-avatar {
  width: 36px; height: 36px; min-width: 36px; border-radius: 50%; background: #7a4f2a; color: #f4ecd8;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.pc-bar { height: 8px; border-radius: 4px; background: #e2d5b5; overflow: hidden; margin: 4px 0 8px; }
.pc-bar-fill { height: 100%; background: #7a4f2a; border-radius: 4px; }
.pc-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.pc-btn {
  flex: 1 1 140px; min-height: 44px; padding: 0 16px; border: 0; border-radius: 10px;
  background: #7a4f2a; color: #f4ecd8; font: inherit; font-weight: 600; cursor: pointer;
}
.pc-btn[disabled] { background: #b9a886; color: #f4ecd8; cursor: not-allowed; }
`;

function injectStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}

function make<K extends keyof HTMLElementTagNameMap>(
  doc: Document, tag: K, cls?: string, text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function bar(doc: Document, points: number): HTMLElement {
  const wrap = make(doc, 'div', 'pc-bar');
  wrap.setAttribute('role', 'progressbar');
  wrap.setAttribute('aria-valuemin', '0');
  wrap.setAttribute('aria-valuemax', String(MAX_POINTS));
  wrap.setAttribute('aria-valuenow', String(points));
  const fill = make(doc, 'div', 'pc-bar-fill');
  const pct = Math.max(0, Math.min(100, (points / MAX_POINTS) * 100));
  fill.style.width = `${pct}%`;
  wrap.appendChild(fill);
  return wrap;
}

export function createPanels(ui: HTMLElement): Panels {
  const doc = ui.ownerDocument;
  injectStyle(doc);

  const container = make(doc, 'div', 'pc-panel');
  container.setAttribute('role', 'dialog');
  container.style.display = 'none';
  ui.appendChild(container);

  let open = false;

  function close(): void {
    container.replaceChildren();
    container.style.display = 'none';
    container.removeAttribute('aria-label');
    open = false;
  }

  function show(title: string, body: Node[]): void {
    container.replaceChildren();
    container.setAttribute('aria-label', title);

    const head = make(doc, 'div', 'pc-head');
    head.appendChild(make(doc, 'h2', 'pc-title', title));
    const closeBtn = make(doc, 'button', 'pc-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => close());
    head.appendChild(closeBtn);

    container.append(head, ...body);
    container.style.display = 'block';
    open = true;
  }

  function rowButton(onClick: (() => void) | null): HTMLElement {
    if (onClick) {
      const b = make(doc, 'button', 'pc-row');
      b.type = 'button';
      b.addEventListener('click', () => onClick());
      return b;
    }
    return make(doc, 'div', 'pc-row');
  }

  function openFriends(rows: FriendRow[], onPick: (id: ResidentId) => void): void {
    const sorted = rows.slice().sort((a, b) => {
      const fa = a.points >= FRIEND_MIN_POINTS ? 0 : 1;
      const fb = b.points >= FRIEND_MIN_POINTS ? 0 : 1;
      if (fa !== fb) return fa - fb;
      if (a.points !== b.points) return b.points - a.points;
      return a.resident.name.localeCompare(b.resident.name);
    });

    const list = make(doc, 'div', 'pc-list');
    for (const row of sorted) {
      const b = rowButton(() => onPick(row.resident.id));
      b.setAttribute('aria-label', `${row.resident.name}, ${row.level}`);
      const avatar = make(doc, 'div', 'pc-avatar', row.resident.name.charAt(0));
      avatar.setAttribute('aria-hidden', 'true');
      const body = make(doc, 'div', 'pc-row-body');
      body.appendChild(make(doc, 'div', 'pc-row-name', row.resident.name));
      body.appendChild(make(doc, 'div', 'pc-row-meta', `${row.resident.role} · ${row.level}`));
      body.appendChild(bar(doc, row.points));
      body.appendChild(make(doc, 'div', 'pc-row-where', row.where));
      b.append(avatar, body);
      list.appendChild(b);
    }
    show('Friends', [list]);
  }

  function openBag(save: Save, onPick?: (item: GiftId) => void): void {
    const title = onPick ? 'Give a gift' : 'Bag';
    const items = GIFT_IDS.filter((id) => bagCount(save, id) > 0);
    if (items.length === 0) {
      show(title, [make(doc, 'p', 'pc-text', 'Nothing in the bag yet. Forage the green for gifts.')]);
      return;
    }
    const list = make(doc, 'div', 'pc-list');
    for (const id of items) {
      const b = rowButton(onPick ? () => onPick(id) : null);
      const icon = make(doc, 'span', 'pc-icon', GIFTS[id].icon);
      icon.setAttribute('aria-hidden', 'true');
      const label = make(doc, 'div', 'pc-row-body', GIFTS[id].label);
      label.classList.add('pc-row-name');
      const count = make(doc, 'span', 'pc-count', `×${bagCount(save, id)}`);
      b.append(icon, label, count);
      list.appendChild(b);
    }
    show(title, [list]);
  }

  function openResident(
    r: Resident,
    row: FriendRow,
    actions: { talk: () => void; give: () => void; canGive: boolean; canTalk: boolean },
  ): void {
    const body: Node[] = [
      make(doc, 'p', 'pc-sub', r.role),
      make(doc, 'p', 'pc-text', r.blurb),
      make(doc, 'p', 'pc-muted', `${row.level} · ${row.points} / ${MAX_POINTS}`),
      bar(doc, row.points),
      make(doc, 'p', 'pc-muted', row.where),
    ];

    const actionRow = make(doc, 'div', 'pc-actions');
    const talk = make(doc, 'button', 'pc-btn', 'Talk');
    talk.type = 'button';
    talk.disabled = !actions.canTalk;
    talk.addEventListener('click', () => actions.talk());
    const give = make(doc, 'button', 'pc-btn', 'Give a gift');
    give.type = 'button';
    give.disabled = !actions.canGive;
    give.addEventListener('click', () => actions.give());
    actionRow.append(talk, give);
    body.push(actionRow);

    show(r.name, body);
  }

  return {
    openFriends,
    openBag,
    openResident,
    close,
    isOpen: () => open,
  };
}
