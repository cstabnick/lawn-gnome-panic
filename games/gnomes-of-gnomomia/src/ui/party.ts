// Party UI: the 👥 dock button, the party frame (members with HP bars), the party panel (members, Wayfarers nearby,
// gnomes online nearby) and the invite prompt. Reads src/party/party.ts; never touches #ui itself, only its own
// container (#party-ui) appended to it.
import { UI } from '../config';
import { CLASSES } from '../data/classes';
import { PERSONALITIES } from '../companionLogic';
import { localCompanions } from '../companions';
import { player } from '../player';
import { mmoStatus, remotePlayers, type RemotePlayer } from '../net/mmo';
import { PARTY } from '../party/partyLogic';
import {
  acceptInvite, declineInvite, dismissHelper, hireHelper, invitePlayer, inParty, isPartyLeader, isPartyPeer, kickPlayer,
  leaveParty, onPartyChange, partyHelperIds, partyMembers, pendingInvite, type PartyMember,
} from '../party/party';
import { EDGE, TOUCH, compact, dock, dockBottom, dockButton, onLayout } from './layout';

/** Nearby lists in the panel refresh at most this often while it is open (ms). */
const NEARBY_REFRESH_MS = 1000;

let root: HTMLDivElement | null = null;
let button: HTMLButtonElement;
let frame: HTMLDivElement;
let panel: HTMLDivElement;
let partyBox: HTMLDivElement;
let wayBox: HTMLDivElement;
let onlineBox: HTMLDivElement;
let invite: HTMLDivElement;
let inviteText: HTMLDivElement;
let inviteCount: HTMLDivElement;

let panelOpen = false;
let nearbyAt = -Infinity;
let frameKey = '';
interface FrameRow { fill: HTMLDivElement | null; name: HTMLSpanElement; dead: HTMLSpanElement }
let frameRows: FrameRow[] = [];
let inviteShownPid: string | null = null;
let inviteShownSecs = -1;
let buttonGold = false;

function el<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement | null, tag: K, css: Partial<CSSStyleDeclaration> = {}, text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (text) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

/** A button in the panel's style: 44 px on touch, a small one with a mouse. */
function btn(parent: HTMLElement, label: string, onClick: () => void, accent = false): HTMLButtonElement {
  const b = el(parent, 'button', {
    font: 'inherit', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', touchAction: 'manipulation',
    boxSizing: 'border-box', flex: '0 0 auto', background: UI.panelBgDark, color: accent ? UI.gold : UI.text,
    border: `1px solid ${UI.borderLight}`, padding: TOUCH ? '6px 10px' : '1px 6px',
    minHeight: TOUCH ? '44px' : '', minWidth: TOUCH ? '44px' : '',
  }, label);
  b.type = 'button';
  b.onclick = onClick;
  return b;
}

function heading(parent: HTMLElement, text: string): HTMLDivElement {
  return el(parent, 'div', { color: UI.gold, fontWeight: 'bold', fontSize: '11px', marginTop: '6px' }, text);
}

function line(parent: HTMLElement): HTMLDivElement {
  return el(parent, 'div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px', minWidth: '0',
  });
}

function dist2D(x: number, z: number): number {
  return Math.hypot(x - player.position.x, z - player.position.z);
}

/** Puts the frame, panel and invite prompt just under the dock. Called on layout changes and when shown. */
function positionAll(): void {
  const top = `${dockBottom() + 4}px`;
  frame.style.left = EDGE.left;
  frame.style.top = top;
  frame.style.width = compact() ? '150px' : '170px';
  frame.style.fontSize = compact() ? '11px' : '12px';
  panel.style.top = top;
  invite.style.top = top;
}

function setPanelOpen(open: boolean): void {
  panelOpen = open;
  button.setAttribute('aria-expanded', String(open));
  panel.style.display = open ? '' : 'none';
  if (open) {
    positionAll();
    refreshPanel();
  }
}

function renderFrame(members: readonly PartyMember[], key: string): void {
  frameKey = key;
  frame.replaceChildren();
  frameRows = [];
  for (const m of members) {
    const row = el(frame, 'div', { marginBottom: '3px' });
    const top = el(row, 'div', {
      display: 'flex', alignItems: 'baseline', gap: '4px', minWidth: '0', whiteSpace: 'nowrap', overflow: 'hidden',
    });
    if (m.leader) el(top, 'span', {}, '👑');
    const name = el(top, 'span', { overflow: 'hidden', textOverflow: 'ellipsis', minWidth: '0' }, m.name);
    el(top, 'span', { color: UI.textDim, fontSize: '11px' }, `Lv ${m.level}`);
    const dead = el(top, 'span', { color: UI.bad });
    let fill: HTMLDivElement | null = null;
    if (m.hpMax > 0) {
      const bar = el(row, 'div', {
        height: '4px', marginTop: '2px', boxSizing: 'border-box', background: UI.panelBgDark, border: `1px solid ${UI.borderLight}`,
      });
      fill = el(bar, 'div', { height: '100%', width: '0%', background: UI.good });
    }
    frameRows.push({ fill, name, dead });
  }
  positionAll();
}

/** Per frame: the HP bars and dead marks follow the members (the list itself is only rebuilt when it changes). */
function updateFrameHp(members: readonly PartyMember[]): void {
  for (let i = 0; i < frameRows.length && i < members.length; i++) {
    const row = frameRows[i];
    const m = members[i];
    row.name.style.color = m.dead ? UI.textDim : UI.text;
    row.dead.textContent = m.dead ? ' ☠' : '';
    if (row.fill && m.hpMax > 0) {
      const pct = Math.max(0, Math.min(1, m.hp / m.hpMax));
      row.fill.style.width = `${pct * 100}%`;
      row.fill.style.background = pct < 0.3 ? UI.bad : UI.good;
    }
  }
}

/** The "Your party" section: rebuilt on party changes and when the panel opens. */
function renderPartySection(): void {
  partyBox.replaceChildren();
  heading(partyBox, 'Your party');
  const others = partyMembers().filter((m) => m.kind !== 'self');
  for (const m of others) {
    const row = line(partyBox);
    const label = el(row, 'span', { flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' });
    if (m.leader) label.textContent = '👑 ';
    label.append(m.name);
    if (m.kind === 'npc') el(label, 'span', { color: UI.textDim, fontSize: '11px' }, ' Wayfarer');
    if (m.kind === 'peer-npc') el(label, 'span', { color: UI.textDim, fontSize: '11px' }, ' Wayfarer (leader\'s)');
    if (m.kind === 'npc') {
      const id = m.id;
      btn(row, 'Dismiss', () => {
        dismissHelper(id);
        refreshPanel();
      });
    } else if (m.kind === 'player' && isPartyLeader()) {
      const id = m.id;
      btn(row, 'Remove', () => {
        kickPlayer(id);
        refreshPanel();
      });
    }
  }
  if (others.length === 0) el(partyBox, 'div', { color: UI.textDim, marginTop: '4px' }, 'Nobody yet. Ask a Wayfarer along, or invite a gnome.');
  if (inParty()) {
    const row = line(partyBox);
    btn(row, 'Leave party', () => {
      leaveParty();
      refreshPanel();
    });
  }
}

/** The "Wayfarers nearby" section: alive Wayfarers close by who are not in the party yet. */
function renderWayfarerSection(): void {
  wayBox.replaceChildren();
  heading(wayBox, 'Wayfarers nearby');
  const inParty = new Set(partyHelperIds());
  const near = localCompanions().filter(
    (c) => !c.dead && !inParty.has(c.id) && dist2D(c.position.x, c.position.z) <= PARTY.inviteRange,
  );
  for (const c of near) {
    const row = line(wayBox);
    const label = el(row, 'span', { flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' });
    const cls = c.classId ? ` ${CLASSES[c.classId].name}` : '';
    label.textContent = `${c.name} · Lv ${c.level}${cls} · ${PERSONALITIES[c.personality].label}`;
    const id = c.id;
    btn(row, 'Ask along', () => {
      hireHelper(id);
      refreshPanel();
    });
  }
  if (near.length === 0) el(wayBox, 'div', { color: UI.textDim, marginTop: '4px' }, 'No Wayfarers close by.');
}

/** The "Gnomes online nearby" section: only while online. */
function renderOnlineSection(): void {
  onlineBox.replaceChildren();
  if (mmoStatus() !== 'online') {
    onlineBox.style.display = 'none';
    return;
  }
  onlineBox.style.display = '';
  heading(onlineBox, 'Gnomes online nearby');
  const near: RemotePlayer[] = [...remotePlayers()].filter((r) => r.model && !isPartyPeer(r.id));
  for (const r of near) {
    const row = line(onlineBox);
    el(row, 'span', { color: cssColor(r.color), flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' }, r.name);
    const id = r.id;
    btn(row, 'Invite', () => {
      invitePlayer(id);
      refreshPanel();
    });
  }
  if (near.length === 0) el(onlineBox, 'div', { color: UI.textDim, marginTop: '4px' }, 'No other gnomes close by.');
}

function renderNearby(): void {
  renderWayfarerSection();
  renderOnlineSection();
  nearbyAt = performance.now();
}

/** Redraws every section of the open panel now. */
function refreshPanel(): void {
  if (!panelOpen) return;
  renderPartySection();
  renderNearby();
}

function updateInvite(): void {
  const inv = pendingInvite();
  if (!inv) {
    invite.style.display = 'none';
    inviteShownPid = null;
    return;
  }
  if (inv.pid !== inviteShownPid) {
    inviteShownPid = inv.pid;
    inviteShownSecs = -1;
    inviteText.textContent = `${inv.fromName} invites you to their party.`;
  }
  const secs = Math.max(0, Math.ceil((inv.expiresAt - performance.now()) / 1000));
  if (secs !== inviteShownSecs) {
    inviteShownSecs = secs;
    inviteCount.textContent = `Answer within ${secs}s`;
  }
  if (invite.style.display !== '') {
    invite.style.display = '';
    positionAll();
  }
}

/** Builds the 👥 dock button, the party frame, the party panel and the invite prompt inside `parent` (#ui). */
export function createPartyUi(parent: HTMLElement): void {
  if (root) return;
  root = el(parent, 'div', { position: 'absolute', inset: '0', pointerEvents: 'none', fontFamily: UI.font });
  root.id = 'party-ui';

  button = dockButton(dock(parent), '👥', 'Party');
  button.id = 'party-button';
  button.setAttribute('aria-expanded', 'false');
  if (TOUCH) {
    button.style.width = '44px';
    button.style.minHeight = '44px';
  }
  button.onclick = () => setPanelOpen(!panelOpen);

  frame = el(root, 'div', {
    position: 'absolute', pointerEvents: 'none', zIndex: '4', boxSizing: 'border-box', padding: '4px 6px',
    background: UI.panelBg, border: `2px solid ${UI.border}`, color: UI.text, lineHeight: '1.4', display: 'none',
  });
  frame.id = 'party-frame';

  panel = el(root, 'div', {
    position: 'absolute', left: EDGE.left, display: 'none', pointerEvents: 'auto', zIndex: '7', width: '280px',
    maxWidth: 'calc(100vw - 16px)', maxHeight: '55vh', overflowY: 'auto', boxSizing: 'border-box', padding: '6px 8px',
    background: UI.panelBg, border: `2px solid ${UI.border}`, color: UI.text, fontSize: '12px', lineHeight: '1.5',
  });
  panel.id = 'party-panel';

  const head = el(panel, 'div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' });
  el(head, 'span', { color: UI.gold, fontWeight: 'bold', fontSize: '13px' }, 'Party');
  const close = btn(head, '✕', () => setPanelOpen(false));
  close.setAttribute('aria-label', 'Close party panel');
  close.style.minWidth = TOUCH ? '44px' : '22px';
  close.style.minHeight = TOUCH ? '44px' : '22px';

  partyBox = el(panel, 'div');
  wayBox = el(panel, 'div');
  onlineBox = el(panel, 'div');
  el(panel, 'div', { color: UI.textDim, fontSize: '11px', marginTop: '8px' },
    'Party chat: /p <text>. Wayfarers in your party follow you and join your fights. Kills near your party are shared.');

  invite = el(root, 'div', {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'none', pointerEvents: 'auto', zIndex: '8',
    width: '260px', maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box', padding: '6px 8px',
    background: UI.panelBg, border: `2px solid ${UI.gold}`, color: UI.text, fontSize: '12px', lineHeight: '1.5',
  });
  invite.id = 'party-invite';
  inviteText = el(invite, 'div', { fontWeight: 'bold' });
  inviteCount = el(invite, 'div', { color: UI.textDim, fontSize: '11px' });
  const answers = el(invite, 'div', { display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' });
  btn(answers, 'Join', () => acceptInvite(), true);
  btn(answers, 'No thanks', () => declineInvite());

  onLayout(positionAll);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) setPanelOpen(false);
  });
  onPartyChange(() => refreshPanel());
}

/** Per frame and cheap: HP bars, frame visibility, the 👥 button's gold border, the invite prompt and countdown. */
export function updatePartyUi(): void {
  if (!root) return;
  const members = partyMembers();
  const key = members.map((m) => `${m.kind}:${m.id}:${m.name}:${m.leader ? 1 : 0}:${m.level}`).join('|');
  if (key !== frameKey) renderFrame(members, key);
  updateFrameHp(members);
  frame.style.display = members.length > 0 && !panelOpen ? '' : 'none';

  if (panelOpen && performance.now() - nearbyAt >= NEARBY_REFRESH_MS) renderNearby();

  const gold = pendingInvite() !== null;
  if (gold !== buttonGold) {
    buttonGold = gold;
    button.style.border = `2px solid ${gold ? UI.gold : UI.border}`;
  }
  updateInvite();
}
