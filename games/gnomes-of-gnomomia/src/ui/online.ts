// Online UI: the status pill (top-left), the list of gnomes in the world, the chat line (Enter) and the name plates over
// other players. Reads src/net/mmo.ts; never touches #ui itself, only its own container.
import * as THREE from 'three';
import { UI, WORLD } from '../config';
import { ZONES } from '../content';
import { CLASSES } from '../data/classes';
import { say } from '../events';
import { player } from '../player';
import { state } from '../state';
import {
  goOffline, goOnline, mmoStatus, myOnlineName, onMmoChange, remotePlayers, sendChat, setName, type RemotePlayer,
} from '../net/mmo';

let root: HTMLDivElement;
let pill: HTMLButtonElement;
let who: HTMLDivElement;
let chatInput: HTMLInputElement;
let plateLayer: HTMLDivElement;
const plates = new Map<number, { el: HTMLDivElement; label: HTMLDivElement; fill: HTMLDivElement }>();
const v = new THREE.Vector3();
/** Gnomes drawn near me at the last pill refresh; the pill is redrawn when this changes. */
let shownNear = -1;

/** Gnomes with a model: the ones drawn, i.e. within WORLD.remoteViewRadius of me. */
function nearCount(): number {
  let n = 0;
  for (const r of remotePlayers()) if (r.model) n++;
  return n;
}

const HELP = 'Chat: Enter, type, Enter. Commands: /name <new name>, /who, /offline, /online.';

function make<K extends keyof HTMLElementTagNameMap>(parent: HTMLElement, tag: K, css: Partial<CSSStyleDeclaration>, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}

function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function describe(r: RemotePlayer): string {
  if (!r.card) return '';
  const cls = r.card.classId ? CLASSES[r.card.classId].name : 'Gnome';
  return `Lv ${r.card.level} ${cls}`;
}

function zoneName(r: RemotePlayer): string {
  return r.zone ? ZONES[r.zone].name : 'somewhere';
}

function sizeChatInput(): void {
  chatInput.style.width = innerWidth < 700 ? 'calc(100vw - 16px)' : '420px';
}

function refresh(): void {
  const s = mmoStatus();
  const all = [...remotePlayers()];
  shownNear = nearCount();
  let dot = '#888';
  let text = 'Offline';
  if (s === 'unavailable') text = 'Offline build';
  else if (s === 'connecting') {
    dot = UI.gold;
    text = 'Joining the world...';
  } else if (s === 'retrying') {
    dot = UI.bad;
    text = 'Reconnecting...';
  } else if (s === 'online') {
    dot = UI.good;
    text = `${shownNear} near · ${all.length + 1} online`;
  }
  pill.innerHTML = '';
  make(pill, 'span', { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: dot, marginRight: '6px' });
  pill.append(text);

  // The who list: me first, then everyone by zone.
  who.innerHTML = '';
  if (s !== 'online') {
    make(who, 'div', { color: UI.textDim }, s === 'unavailable' ? 'This build has no world server.' : 'Not in the world.');
    const btn = make(who, 'button', btnCss(), s === 'offline' ? 'Go online' : 'Go offline');
    btn.onclick = () => (s === 'offline' ? goOnline() : goOffline());
    if (s === 'unavailable') btn.style.display = 'none';
  } else {
    make(who, 'div', { color: UI.textWhite, fontWeight: 'bold' }, `${myOnlineName()} (you) · ${ZONES[state.zone].name}`);
    const sorted = all.sort((a, b) => Number(b.zone === state.zone) - Number(a.zone === state.zone) || a.name.localeCompare(b.name));
    for (const r of sorted) {
      const row = make(who, 'div', { color: cssColor(r.color) }, r.name);
      make(row, 'span', { color: UI.textDim }, ` ${describe(r)} · ${zoneName(r)}`);
    }
    const btn = make(who, 'button', btnCss(), 'Go offline');
    btn.onclick = () => goOffline();
  }
  make(who, 'div', { color: UI.textDim, fontSize: '11px', marginTop: '6px', whiteSpace: 'normal' }, HELP);
}

function btnCss(): Partial<CSSStyleDeclaration> {
  return {
    marginTop: '6px', font: 'inherit', fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', cursor: 'pointer',
    background: UI.panelBgDark, color: UI.text, border: `1px solid ${UI.borderLight}`,
  };
}

function command(line: string): void {
  const [cmd, ...rest] = line.slice(1).split(/\s+/);
  const arg = rest.join(' ').trim();
  switch (cmd.toLowerCase()) {
    case 'name': {
      if (!arg) {
        say(`Your name is ${myOnlineName()}. Type /name <new name> to change it.`, UI.textDim);
        return;
      }
      const err = setName(arg);
      say(err ? `That name won't do: ${err}` : `You are now known as ${myOnlineName()}.`, err ? UI.bad : UI.good);
      return;
    }
    case 'who': {
      const all = [...remotePlayers()];
      say(`${all.length + 1} gnome${all.length === 0 ? '' : 's'} online: ${[`${myOnlineName()} (you)`, ...all.map((r) => `${r.name} (${zoneName(r)})`)].join(', ')}`, UI.textDim);
      return;
    }
    case 'offline':
      goOffline();
      return;
    case 'online':
      goOnline();
      return;
    default:
      say(HELP, UI.textDim);
  }
}

function openChat(): void {
  chatInput.style.display = '';
  chatInput.focus();
}

function closeChat(): void {
  chatInput.value = '';
  chatInput.style.display = 'none';
  chatInput.blur();
}

export function createOnlineUi(parent: HTMLElement): void {
  root = make(parent, 'div', { position: 'absolute', inset: '0', pointerEvents: 'none', fontFamily: UI.font });
  root.id = 'online';

  plateLayer = make(root, 'div', { position: 'absolute', inset: '0', overflow: 'hidden' });

  pill = make(root, 'button', {
    position: 'absolute', left: '8px', top: '32px', pointerEvents: 'auto', cursor: 'pointer', font: 'inherit',
    fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', background: UI.panelBg, color: UI.text,
    border: `2px solid ${UI.border}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  });
  pill.id = 'online-pill';
  pill.title = 'Who is online';
  who = make(root, 'div', {
    position: 'absolute', left: '8px', top: '60px', pointerEvents: 'auto', display: 'none', maxHeight: '45vh',
    overflowY: 'auto', width: '260px', maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box', padding: '6px 8px',
    background: UI.panelBg, border: `2px solid ${UI.border}`, color: UI.text, fontSize: '12px', lineHeight: '1.5',
  });
  pill.onclick = () => {
    who.style.display = who.style.display === 'none' ? '' : 'none';
  };

  chatInput = make(root, 'input', {
    position: 'absolute', left: '8px', bottom: '8px', display: 'none', pointerEvents: 'auto', boxSizing: 'border-box',
    font: 'inherit', fontSize: '13px', padding: '5px 6px', background: UI.panelBgDark, color: UI.textWhite,
    border: `2px solid ${UI.gold}`, outline: 'none',
  });
  chatInput.maxLength = 120;
  chatInput.placeholder = 'Say something (Enter to send, Esc to cancel)';
  sizeChatInput();
  window.addEventListener('resize', sizeChatInput);
  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const text = chatInput.value.trim();
      closeChat();
      if (text.startsWith('/')) command(text);
      else if (text) sendChat(text);
    } else if (e.key === 'Escape') {
      closeChat();
    }
  });
  chatInput.addEventListener('blur', () => {
    if (chatInput.value.trim() === '') chatInput.style.display = 'none';
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    openChat();
  });
  // Touch screens have no Enter key: a long-press on the pill opens the chat line.
  pill.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openChat();
  });

  onMmoChange(refresh);
  refresh();
}

/** Per frame: name plates over the gnomes near me, and the pill's "near" count when it changes. */
export function updateOnlineUi(camera: THREE.Camera): void {
  if (mmoStatus() === 'online' && nearCount() !== shownNear) refresh();
  const seen = new Set<number>();
  const w = innerWidth;
  const h = innerHeight;
  for (const r of remotePlayers()) {
    if (!r.model) continue;
    if (Math.hypot(r.position.x - player.position.x, r.position.z - player.position.z) > WORLD.plateRadius) continue;
    v.copy(r.position);
    v.y += 2.3;
    v.project(camera);
    if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) continue;
    seen.add(r.id);
    let plate = plates.get(r.id);
    if (!plate) {
      const el = make(plateLayer, 'div', {
        position: 'absolute', left: '0', top: '0', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '12px',
        fontWeight: 'bold', textShadow: '1px 1px 0 #000, -1px 1px 0 #000',
      });
      const label = make(el, 'div', {});
      const track = make(el, 'div', { width: '40px', height: '4px', margin: '1px auto 0', background: '#3a1010', border: '1px solid #000' });
      const fill = make(track, 'div', { height: '100%', background: UI.good });
      plate = { el, label, fill };
      plates.set(r.id, plate);
    }
    plate.label.style.color = cssColor(r.color);
    const desc = describe(r);
    const text = desc ? `${r.name} · ${desc}` : r.name;
    if (plate.label.textContent !== text) plate.label.textContent = text;
    plate.fill.style.width = r.card ? `${Math.max(0, Math.min(1, r.card.hp / r.card.hpMax)) * 100}%` : '100%';
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    plate.el.style.display = '';
    plate.el.style.transform = `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`;
  }
  for (const [id, plate] of plates) {
    if (seen.has(id)) continue;
    if (![...remotePlayers()].some((r) => r.id === id)) {
      plate.el.remove();
      plates.delete(id);
    } else {
      plate.el.style.display = 'none';
    }
  }
}

