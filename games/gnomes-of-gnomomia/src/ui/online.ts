// Online UI: the status pill and chat button (top-left dock), the list of gnomes in the world, the chat composer (Enter
// or 💬), the name plates over other players, and speech bubbles over whoever just spoke (me included). Reads
// src/net/mmo.ts; never touches #ui itself, only its own container.
import * as THREE from 'three';
import { UI } from '../config';
import { ZONES } from '../content';
import { CLASSES } from '../data/classes';
import { say } from '../events';
import { player } from '../player';
import { state } from '../state';
import {
  chatBubble, goOffline, goOnline, mmoStatus, myOnlineId, myOnlineName, onMmoChange, remotePlayers, sendChat, setName,
  type ChatBubble, type RemotePlayer,
} from '../net/mmo';
import { EDGE, TOUCH, compact, dock, dockBottom, dockButton } from './layout';

let root: HTMLDivElement;
let pill: HTMLButtonElement;
let who: HTMLDivElement;
let composer: HTMLDivElement;
let chatInput: HTMLInputElement;
let chatBtn: HTMLButtonElement;
let plateLayer: HTMLDivElement;

interface Bubble { el: HTMLDivElement; text: HTMLDivElement; shown: string }
const plates = new Map<number, { el: HTMLDivElement; label: HTMLDivElement; fill: HTMLDivElement; bubble: Bubble }>();
/** My own bubble, in a holder of its own (I have no name plate). */
let myHolder: HTMLDivElement;
let myBubble: Bubble;
const v = new THREE.Vector3();

const HELP = `Chat: ${TOUCH ? 'tap 💬' : 'Enter or 💬'}, type, send. Commands: /name <new name>, /who, /offline, /online.`;
/** One-tap lines under the chat line, handy on a phone keyboard. */
const QUICK = ['Hi!', 'Help!', 'Follow me', 'Group up?', 'Thanks!', 'On my way', 'gg'];
/** A bubble fades out over its last this many ms. */
const BUBBLE_FADE_MS = 600;

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

function refresh(): void {
  const s = mmoStatus();
  const all = [...remotePlayers()];
  const here = all.filter((r) => r.zone === state.zone).length;
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
    text = `${here} here · ${all.length + 1} online`;
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
    marginTop: '6px', font: 'inherit', fontSize: '12px', fontWeight: 'bold', padding: TOUCH ? '6px 12px' : '3px 10px',
    cursor: 'pointer', background: UI.panelBgDark, color: UI.text, border: `1px solid ${UI.borderLight}`,
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

// ---------------------------------------------------------------- composer

/** Desktop: over the chat log, bottom-left. Touch or compact: under the dock, where a phone keyboard cannot cover it. */
function placeComposer(): void {
  const atTop = TOUCH || compact();
  composer.style.left = EDGE.left;
  composer.style.width = atTop ? 'min(420px, calc(100vw - 16px))' : '420px';
  composer.style.top = atTop ? `${dockBottom() + 6}px` : '';
  composer.style.bottom = atTop ? '' : EDGE.bottom;
  // At the bottom the quick lines sit above the field, at the top below it.
  composer.style.flexDirection = atTop ? 'column' : 'column-reverse';
}

function chatOpen(): boolean {
  return composer.style.display !== 'none';
}

function openChat(): void {
  who.style.display = 'none';
  placeComposer();
  composer.style.display = 'flex';
  chatBtn.style.borderColor = UI.gold;
  chatInput.focus();
}

function closeChat(): void {
  chatInput.value = '';
  composer.style.display = 'none';
  chatBtn.style.borderColor = UI.border;
  chatInput.blur();
}

function submit(raw: string): void {
  const text = raw.trim();
  closeChat();
  if (text.startsWith('/')) command(text);
  else if (text) sendChat(text);
}

/** Buttons inside the composer must not take focus from the field (its blur closes an empty composer). */
function keepFocus(el: HTMLElement): void {
  el.addEventListener('pointerdown', (e) => e.preventDefault());
}

function buildComposer(): void {
  composer = make(root, 'div', {
    position: 'absolute', display: 'none', gap: '4px', pointerEvents: 'auto', boxSizing: 'border-box', zIndex: '6',
  });
  composer.id = 'chat-composer';

  const form = make(composer, 'form', { display: 'flex', gap: '4px', margin: '0' });
  chatInput = make(form, 'input', {
    flex: '1 1 auto', minWidth: '0', boxSizing: 'border-box', fontFamily: UI.font,
    // 16 px stops iOS zooming the page when the field takes focus.
    fontSize: TOUCH ? '16px' : '13px', padding: TOUCH ? '8px' : '5px 6px', background: UI.panelBgDark,
    color: UI.textWhite, border: `2px solid ${UI.gold}`, outline: 'none', borderRadius: '0',
  });
  chatInput.id = 'chat-input';
  chatInput.maxLength = 120;
  chatInput.enterKeyHint = 'send';
  chatInput.autocomplete = 'off';
  chatInput.placeholder = TOUCH ? 'Say something...' : 'Say something (Enter to send, Esc to cancel)';
  const send = make(form, 'button', {
    flex: '0 0 auto', fontFamily: UI.font, fontWeight: 'bold', fontSize: TOUCH ? '15px' : '13px',
    padding: TOUCH ? '0 14px' : '0 10px', cursor: 'pointer', background: UI.borderLight, color: UI.textWhite,
    border: `2px solid ${UI.gold}`, touchAction: 'manipulation',
  }, 'Send');
  send.type = 'submit';
  keepFocus(send);
  // A form submit is the one Enter every phone keyboard sends.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(chatInput.value);
  });

  const quick = make(composer, 'div', { display: 'flex', flexWrap: 'wrap', gap: '4px' });
  for (const line of QUICK) {
    const chip = make(quick, 'button', {
      fontFamily: UI.font, fontSize: TOUCH ? '13px' : '11px', padding: TOUCH ? '6px 10px' : '2px 8px',
      cursor: 'pointer', background: UI.panelBg, color: UI.text, border: `1px solid ${UI.borderLight}`,
      borderRadius: '10px', touchAction: 'manipulation',
    }, line);
    chip.type = 'button';
    keepFocus(chip);
    chip.onclick = () => submit(line);
  }

  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') closeChat();
  });
  chatInput.addEventListener('blur', () => {
    // A phone closing its keyboard blurs the field: an empty composer closes with it.
    setTimeout(() => {
      if (document.activeElement !== chatInput && chatInput.value.trim() === '') closeChat();
    }, 0);
  });
  window.addEventListener('resize', () => {
    if (chatOpen()) placeComposer();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    openChat();
  });
}

// ---------------------------------------------------------------- speech bubbles

/** A white speech bubble with a tail, hidden until someone speaks. */
function makeBubble(parent: HTMLElement): Bubble {
  const el = make(parent, 'div', {
    display: 'none', position: 'relative', margin: '0 auto 7px', width: 'max-content', maxWidth: '200px',
    padding: '3px 8px', borderRadius: '9px', background: 'rgba(255, 252, 240, 0.95)', border: '1px solid #3a2e20',
    color: '#2a2016', fontSize: '12px', fontWeight: 'bold', textShadow: 'none', whiteSpace: 'normal',
    overflowWrap: 'anywhere', lineHeight: '1.25', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
  });
  el.className = 'chat-bubble';
  const text = make(el, 'div', {});
  // The tail: a small square turned 45 degrees, its top half hidden under the bubble.
  make(el, 'div', {
    position: 'absolute', left: '50%', bottom: '-5px', width: '8px', height: '8px', marginLeft: '-4px',
    background: 'rgba(255, 252, 240, 0.95)', borderRight: '1px solid #3a2e20', borderBottom: '1px solid #3a2e20',
    transform: 'rotate(45deg)',
  });
  return { el, text, shown: '' };
}

/** Shows a player's current line in b (or hides b), fading out at the end. Text only ever goes in as textContent. */
function drawBubble(b: Bubble, line: ChatBubble | null): void {
  if (!line) {
    if (b.el.style.display !== 'none') b.el.style.display = 'none';
    return;
  }
  const key = `${line.at}|${line.text}`;
  if (b.shown !== key) {
    b.shown = key;
    b.text.textContent = line.text;
  }
  b.el.style.display = '';
  b.el.style.opacity = String(Math.max(0, Math.min(1, (line.until - performance.now()) / BUBBLE_FADE_MS)));
}

// ---------------------------------------------------------------- public API

export function createOnlineUi(parent: HTMLElement): void {
  root = make(parent, 'div', { position: 'absolute', inset: '0', pointerEvents: 'none', fontFamily: UI.font });
  root.id = 'online';

  plateLayer = make(root, 'div', { position: 'absolute', inset: '0', overflow: 'hidden' });
  myHolder = make(plateLayer, 'div', { position: 'absolute', left: '0', top: '0', display: 'none' });
  myBubble = makeBubble(myHolder);

  // The pill leads the dock, then the chat button, then the bag button panels.ts added.
  const row = dock(parent);
  pill = document.createElement('button');
  Object.assign(pill.style, {
    pointerEvents: 'auto', cursor: 'pointer', fontFamily: UI.font, fontSize: TOUCH ? '13px' : '12px',
    fontWeight: 'bold', padding: TOUCH ? '4px 10px' : '3px 10px', background: UI.panelBg, color: UI.text,
    border: `2px solid ${UI.border}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
    touchAction: 'manipulation',
  } satisfies Partial<CSSStyleDeclaration>);
  pill.id = 'online-pill';
  pill.title = 'Who is online';
  row.prepend(pill);
  chatBtn = dockButton(row, '💬', 'Chat (Enter)');
  chatBtn.id = 'chat-button';
  pill.after(chatBtn);

  who = make(root, 'div', {
    position: 'absolute', left: EDGE.left, top: '60px', pointerEvents: 'auto', display: 'none', maxHeight: '45vh',
    overflowY: 'auto', width: '260px', maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box', padding: '6px 8px',
    background: UI.panelBg, border: `2px solid ${UI.border}`, color: UI.text, fontSize: '12px', lineHeight: '1.5',
  });
  pill.onclick = () => {
    who.style.top = `${dockBottom() + 4}px`;
    who.style.display = who.style.display === 'none' ? '' : 'none';
  };

  buildComposer();
  keepFocus(chatBtn);
  chatBtn.onclick = () => (chatOpen() ? closeChat() : openChat());

  onMmoChange(refresh);
  refresh();
}

/** Projects a world point to CSS pixels, or null when it is behind the camera or well off screen. */
function screenAt(camera: THREE.Camera, w: number, h: number): { x: number; y: number } | null {
  v.project(camera);
  if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) return null;
  return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
}

/** Per frame: name plates and speech bubbles over the gnomes in my zone, and my own bubble. */
export function updateOnlineUi(camera: THREE.Camera): void {
  const seen = new Set<number>();
  const w = innerWidth;
  const h = innerHeight;

  // My own last line, just above my HP bar.
  const mine = myOnlineId() >= 0 ? chatBubble(myOnlineId()) : null;
  v.copy(player.position);
  v.y += 2.4;
  const at = mine ? screenAt(camera, w, h) : null;
  if (mine && at) {
    drawBubble(myBubble, mine);
    myHolder.style.display = '';
    myHolder.style.transform = `translate(calc(-50% + ${at.x}px), calc(-100% + ${at.y}px))`;
  } else if (myHolder.style.display !== 'none') {
    myHolder.style.display = 'none';
  }

  for (const r of remotePlayers()) {
    if (!r.model) continue;
    v.copy(r.position);
    v.y += 2.3;
    const p = screenAt(camera, w, h);
    if (!p) continue;
    seen.add(r.id);
    let plate = plates.get(r.id);
    if (!plate) {
      const el = make(plateLayer, 'div', {
        position: 'absolute', left: '0', top: '0', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '12px',
        fontWeight: 'bold', textShadow: '1px 1px 0 #000, -1px 1px 0 #000',
      });
      // The bubble stacks above the name, so it never covers it.
      const bubble = makeBubble(el);
      const label = make(el, 'div', {});
      const track = make(el, 'div', { width: '40px', height: '4px', margin: '1px auto 0', background: '#3a1010', border: '1px solid #000' });
      const fill = make(track, 'div', { height: '100%', background: UI.good });
      plate = { el, label, fill, bubble };
      plates.set(r.id, plate);
    }
    plate.label.style.color = cssColor(r.color);
    const desc = describe(r);
    const text = desc ? `${r.name} · ${desc}` : r.name;
    if (plate.label.textContent !== text) plate.label.textContent = text;
    plate.fill.style.width = r.card ? `${Math.max(0, Math.min(1, r.card.hp / r.card.hpMax)) * 100}%` : '100%';
    drawBubble(plate.bubble, chatBubble(r.id));
    plate.el.style.display = '';
    plate.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-100% + ${p.y}px))`;
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
