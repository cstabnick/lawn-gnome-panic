// The old-school HUD: chat log, HP/MP/level orbs, hitsplats, overhead HP bars, banners,
// region name, death overlay, hover text and the right-click option menu.
import * as THREE from 'three';
import { bus } from '../events';
import { PLAYER_ID, UI, type Entity, type Rank } from '../config';
import { ENEMIES, ZONES } from '../content';
import { SKILLS } from '../data/core';
import { resource } from '../abilities';
import { allEntities } from '../entities';
import { xpToNext } from '../progression';
import { player } from '../player';
import { regionNameAt } from '../world';
import { maxHp, maxMp, state } from '../state';
import { updateHotbar } from './hotbar';
import { EDGE, TOUCH, chatLogHeight, compact, fromBottom, hotbarHeight, onLayout } from './layout';

export interface MenuOption {
  /** e.g. "Attack Feral gnome (level 3)". The first option is the left-click default. */
  label: string;
  onSelect: () => void;
}

// ---------------------------------------------------------------- module state

let hudEl: HTMLDivElement;
let hoverEl: HTMLDivElement;
let chatEl: HTMLDivElement;
let hpFill: HTMLDivElement;
let hpText: HTMLDivElement;
let mpFill: HTMLDivElement;
let mpText: HTMLDivElement;
let levelText: HTMLDivElement;
let regionEl: HTMLDivElement;
let bannerCol: HTMLDivElement;
let deathEl: HTMLDivElement;
let menuEl: HTMLDivElement;
let menuOpen = false;

/** Floating hitsplats and heal text. `at` is the world point; they rise and fade over 1 s. */
interface Splat { el: HTMLDivElement; at: THREE.Vector3; age: number; dx: number; dy: number }
const splats: Splat[] = [];

/** Banners in the top-centre column; each fades out when its life runs out. */
interface Banner { el: HTMLDivElement; life: number; total: number }
const banners: Banner[] = [];

/** Overhead HP bars, keyed by entity id (PLAYER_ID for the player). */
const bars = new Map<number, { wrap: HTMLDivElement; fill: HTMLDivElement; name: HTMLDivElement | null }>();
let playerBarTimer = 0;

let xpWrap: HTMLDivElement;
let xpFill: HTMLDivElement;
let resWrap: HTMLDivElement;
let resFill: HTMLDivElement;
let bossWrap: HTMLDivElement;
let bossName: HTMLDivElement;
let bossFill: HTMLDivElement;
let bossHp: HTMLDivElement;
let phaseEl: HTMLDivElement;
let zoneEl: HTMLDivElement;
let phaseTimer = 0;
let zoneTimer = 0;
/** Entity id -> seconds left on a poisoned status (used to colour untyped hitsplats purple). */
const poisoned = new Map<number, number>();

let lastRegion: string | null = null;
let regionTimer = 0;
let deathTimer = 0;

const REGION_SECONDS = 3;
const SPLAT_SECONDS = 1;
const RISE_PX = 24;
const CHAT_LINES = 60;
const BANNER_SECONDS = 3;
const PHASE_SECONDS = 4;
const RESOURCE_COLOURS = { grit: '#8b5a2b', focus: '#5cb85c', mana: UI.mana } as const;
const RESOURCE_NAMES = { grit: 'Grit', focus: 'Focus', mana: 'Mana' } as const;

/** Hitsplat colour per damage type. */
const SPLAT_COLOURS: Record<string, string> = {
  slash: '#c8102e', crush: '#c8102e', pierce: '#c8102e',
  sun: '#ff7a1a', rain: '#2f7fd8', bloom: '#36d636',
};
const POISON_COLOUR = '#8a2be2';
const CRIT_COLOUR = UI.gold;

/** Overhead name colour per enemy rank. */
const RANK_COLOURS: Record<Rank, string> = {
  trivial: '#9a9a9a', normal: '#ffffff', elite: UI.gold, miniboss: '#ff8c1a',
  boss: '#ff3b3b', worldboss: '#ff3b3b', final: '#ff3b3b',
};
const BOSS_RANKS: readonly Rank[] = ['boss', 'worldboss', 'final'];

// ---------------------------------------------------------------- helpers

function make<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement | null, tag: K, css: Partial<CSSStyleDeclaration> = {}, text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

/** Verb in white, the rest of the text in gold (RuneScape style). */
function twoTone(parent: HTMLElement, text: string): void {
  const space = text.indexOf(' ');
  const verb = space < 0 ? text : text.slice(0, space);
  const rest = space < 0 ? '' : text.slice(space);
  make(parent, 'span', { color: UI.textWhite }, verb);
  if (rest) make(parent, 'span', { color: UI.gold }, rest);
}

/** Projects a world point to CSS pixels; null when it is behind the camera. */
function toScreen(world: THREE.Vector3, camera: THREE.Camera): { x: number; y: number } | null {
  const v = world.clone().project(camera);
  if (v.z > 1) return null;
  return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight };
}

function placeAt(el: HTMLElement, x: number, y: number, anchorX: string, anchorY: string): void {
  el.style.display = '';
  el.style.transform = `translate(calc(${anchorX} + ${x}px), calc(${anchorY} + ${y}px))`;
}

/** Desktop: chat log bottom-left. Compact: just above the hotbar, which owns the bottom edge (layout.ts). */
function sizeChat(): void {
  chatEl.style.left = EDGE.left;
  if (compact()) {
    chatEl.style.width = 'min(360px, calc(100vw - 16px))';
    chatEl.style.height = `${chatLogHeight()}px`;
    chatEl.style.bottom = fromBottom(hotbarHeight() + 6);
    chatEl.style.fontSize = '12px';
    chatEl.style.padding = '4px 6px';
  } else {
    chatEl.style.width = '420px';
    chatEl.style.height = '150px';
    chatEl.style.bottom = EDGE.bottom;
    chatEl.style.fontSize = '13px';
    chatEl.style.padding = '6px';
  }
  zoneEl.style.fontSize = compact() ? '32px' : '44px';
  regionEl.style.fontSize = compact() ? '22px' : '30px';
}

/** Colour of a hitsplat: crits are gold; otherwise by damage type, with poison (untyped) purple. */
function splatColour(e: { target: number; damageType?: string; spell?: boolean; crit?: boolean }): string {
  if (e.crit) return CRIT_COLOUR;
  if (e.damageType && SPLAT_COLOURS[e.damageType]) return SPLAT_COLOURS[e.damageType];
  if ((poisoned.get(e.target) ?? 0) > 0) return POISON_COLOUR;
  return e.spell ? '#ff7a1a' : '#c8102e';
}

function addSplat(
  at: THREE.Vector3, text: string, color: string, textColor: string, circle: boolean, crit = false,
): void {
  const size = crit ? 39 : 26;
  const el = make(hudEl, 'div', {
    position: 'absolute', left: '0', top: '0', pointerEvents: 'none',
    color: textColor, fontWeight: 'bold', fontSize: circle ? (crit ? '18px' : '14px') : '20px',
    textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap',
    ...(circle
      ? {
          width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: color,
          lineHeight: `${size}px`, textAlign: 'center', boxSizing: 'border-box',
        }
      : {}),
  }, text);
  const world = at.clone().add(new THREE.Vector3(0, 1.7, 0));
  // A few random pixels so several splats at once do not stack exactly.
  const dx = (Math.random() - 0.5) * 16;
  const dy = (Math.random() - 0.5) * 8;
  splats.push({ el, at: world, age: 0, dx, dy });
}

function addBanner(text: string, css: Partial<CSSStyleDeclaration>, seconds: number): void {
  const el = make(bannerCol, 'div', {
    textAlign: 'center', whiteSpace: 'nowrap', textShadow: '2px 2px 0 #000', ...css,
  }, text);
  banners.push({ el, life: seconds, total: seconds });
}

// ---------------------------------------------------------------- context menu

function hideMenu(): void {
  if (!menuOpen) return;
  menuOpen = false;
  menuEl.style.display = 'none';
}

// ---------------------------------------------------------------- public API

export function createHud(root: HTMLElement): void {
  hudEl = make(root, 'div', {
    position: 'absolute', inset: '0', pointerEvents: 'none', fontFamily: UI.font,
  });
  hudEl.id = 'hud';

  // Hover text, top-left.
  hoverEl = make(hudEl, 'div', {
    position: 'absolute', left: '8px', top: '8px', fontWeight: 'bold', fontSize: '15px',
    textShadow: '1px 1px 0 #000', display: 'none', whiteSpace: 'nowrap',
  });

  // Chat log, bottom-left.
  chatEl = make(hudEl, 'div', {
    position: 'absolute', left: '8px', bottom: '8px', background: UI.panelBg,
    border: `2px solid ${UI.border}`, color: UI.text, fontSize: '13px', padding: '6px',
    boxSizing: 'border-box', overflowY: 'auto', pointerEvents: 'auto',
  });

  // Orbs, top-right: HP, MP, level.
  const orbRow = make(hudEl, 'div', {
    position: 'absolute', right: '8px', top: '8px', display: 'flex', gap: '8px',
  });

  // XP bar and class resource bar, under the orbs (the orb row is 184 px wide).
  xpWrap = make(hudEl, 'div', {
    position: 'absolute', right: '8px', top: '68px', width: '184px', height: '6px',
    background: '#1a150f', border: `1px solid ${UI.borderLight}`, boxSizing: 'border-box', pointerEvents: 'auto',
  });
  xpWrap.title = 'XP';
  xpFill = make(xpWrap, 'div', { height: '100%', width: '0%', background: UI.gold });
  resWrap = make(hudEl, 'div', {
    position: 'absolute', right: '8px', top: '80px', width: '184px', height: '6px', display: 'none',
    background: '#1a150f', border: `1px solid ${UI.borderLight}`, boxSizing: 'border-box', pointerEvents: 'auto',
  });
  resFill = make(resWrap, 'div', { height: '100%', width: '0%' });

  // Boss bar, top-centre, with the phase text under it.
  bossWrap = make(hudEl, 'div', {
    position: 'absolute', left: '50%', top: '8px', width: '360px', transform: 'translateX(-50%)',
    display: 'none', textAlign: 'center', textShadow: '1px 1px 0 #000',
  });
  bossName = make(bossWrap, 'div', { color: UI.gold, fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' });
  const bossTrack = make(bossWrap, 'div', {
    position: 'relative', height: '14px', marginTop: '2px', background: '#3a1010',
    border: `2px solid ${UI.border}`, boxSizing: 'border-box',
  });
  bossFill = make(bossTrack, 'div', { height: '100%', width: '100%', background: UI.bad });
  bossHp = make(bossTrack, 'div', {
    position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: UI.textWhite, fontSize: '11px', fontWeight: 'bold',
  });
  phaseEl = make(hudEl, 'div', {
    position: 'absolute', left: '50%', top: '44px', transform: 'translateX(-50%)', display: 'none',
    color: UI.text, fontSize: '15px', fontStyle: 'italic', textShadow: '1px 1px 0 #000',
    whiteSpace: 'nowrap', textAlign: 'center',
  });

  // Zone banner: big gold serif name in the upper middle, fades over 3 s.
  zoneEl = make(hudEl, 'div', {
    position: 'absolute', left: '0', right: '0', top: '30%', textAlign: 'center',
    color: UI.gold, fontFamily: 'Georgia, serif', fontSize: '44px', textShadow: '2px 2px 0 #000',
    opacity: '0', whiteSpace: 'nowrap',
  });
  const orb = (border: string) => {
    const circle = make(orbRow, 'div', {
      width: '56px', height: '56px', borderRadius: '50%', position: 'relative', overflow: 'hidden',
      background: '#1a150f', border: `2px solid ${border}`, boxSizing: 'border-box',
    });
    const fill = make(circle, 'div', {
      position: 'absolute', left: '0', right: '0', bottom: '0', height: '100%',
    });
    const text = make(circle, 'div', {
      position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: UI.textWhite, fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 0 #000',
      textAlign: 'center',
    });
    return { fill, text };
  };
  const hp = orb(UI.borderLight);
  hpFill = hp.fill; hpFill.style.background = UI.bad; hpText = hp.text;
  const mp = orb(UI.borderLight);
  mpFill = mp.fill; mpFill.style.background = UI.mana; mpText = mp.text;
  const lv = make(orbRow, 'div', {
    width: '56px', height: '56px', borderRadius: '50%', background: '#1a150f',
    border: `2px solid ${UI.gold}`, boxSizing: 'border-box', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: UI.gold, fontSize: '12px',
    fontWeight: 'bold', textShadow: '1px 1px 0 #000',
  });
  levelText = lv;

  // Region name, top-centre.
  regionEl = make(hudEl, 'div', {
    position: 'absolute', left: '0', right: '0', top: '60px', textAlign: 'center',
    color: UI.gold, fontFamily: 'Georgia, serif', fontSize: '30px',
    textShadow: '2px 2px 0 #000', opacity: '0', whiteSpace: 'nowrap',
  });

  onLayout(sizeChat);

  // Banners, top-centre column (level-up and skill-up stack vertically).
  bannerCol = make(hudEl, 'div', {
    position: 'absolute', left: '0', right: '0', top: '100px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '4px',
  });

  // Death overlay.
  deathEl = make(hudEl, 'div', {
    position: 'absolute', inset: '0', background: 'rgba(80, 0, 0, 0.45)', display: 'none',
    alignItems: 'center', justifyContent: 'center', color: UI.textWhite, fontSize: '36px',
    fontWeight: 'bold', textShadow: '2px 2px 0 #000',
  }, 'Oh dear, you are dead!');

  // Right-click menu: above everything.
  menuEl = make(hudEl, 'div', {
    position: 'absolute', left: '0', top: '0', display: 'none', minWidth: '160px',
    background: UI.panelBg, border: `2px solid ${UI.border}`, pointerEvents: 'auto',
    zIndex: '1000', boxSizing: 'border-box', fontSize: '13px',
  });

  // Hide the menu when the pointer goes down outside it.
  window.addEventListener('pointerdown', (e) => {
    if (menuOpen && !menuEl.contains(e.target as Node)) hideMenu();
  }, true);
  // Hide it when the pointer strays more than 24 px away (RuneScape style).
  window.addEventListener('pointermove', (e) => {
    if (!menuOpen) return;
    const r = menuEl.getBoundingClientRect();
    const m = 24;
    if (e.clientX < r.left - m || e.clientX > r.right + m || e.clientY < r.top - m || e.clientY > r.bottom + m) {
      hideMenu();
    }
  });

  // Events.
  bus.on('message', ({ text, color }) => {
    make(chatEl, 'div', { color: color ?? UI.text, lineHeight: '1.3' }, text);
    while (chatEl.childElementCount > CHAT_LINES) chatEl.removeChild(chatEl.firstElementChild!);
    chatEl.scrollTop = chatEl.scrollHeight;
  });

  bus.on('hit', (e) => {
    if (e.target === PLAYER_ID) playerBarTimer = 6;
    const colour = splatColour(e);
    if (e.crit) addSplat(e.at, `${e.damage}!`, colour, '#1a150f', true, true);
    else addSplat(e.at, String(e.damage), colour, UI.textWhite, true);
  });

  bus.on('status', (e) => {
    if (e.status === 'poisoned') poisoned.set(e.target, e.seconds);
  });

  bus.on('zone-changed', (e) => {
    zoneEl.textContent = ZONES[e.zone]?.name ?? e.zone;
    zoneTimer = BANNER_SECONDS;
  });

  bus.on('boss-phase', (e) => {
    phaseEl.textContent = e.text;
    phaseTimer = PHASE_SECONDS;
  });

  bus.on('miss', (e) => {
    addSplat(e.at, '0', '#1e5bc6', UI.textWhite, true);
  });

  bus.on('heal', (e) => {
    addSplat(player.position, `+${e.amount}`, UI.good, UI.good, false);
  });

  bus.on('level-up', (e) => {
    addBanner(`Level up! You are now level ${e.level}.`, { color: UI.gold, fontSize: '26px', fontFamily: UI.font }, 3.5);
  });

  bus.on('skill-up', (e) => {
    const name = SKILLS.find((s) => s.id === e.skill)?.name ?? e.skill;
    addBanner(`${name} increased to ${e.level}`, { color: UI.good, fontSize: '18px', fontFamily: UI.font }, 2.5);
  });

  bus.on('player-died', () => {
    deathTimer = 3;
    deathEl.style.display = 'flex';
  });
}

export function updateHud(dt: number, camera: THREE.Camera): void {
  // Orbs.
  const hpMax = maxHp();
  const mpMax = maxMp();
  hpFill.style.height = `${Math.max(0, Math.min(1, state.hp / hpMax)) * 100}%`;
  mpFill.style.height = `${Math.max(0, Math.min(1, state.mp / mpMax)) * 100}%`;
  hpText.textContent = `${Math.round(state.hp)}/${hpMax}`;
  mpText.textContent = `${Math.round(state.mp)}/${mpMax}`;
  levelText.textContent = `Lv ${state.level}`;

  // XP bar and class resource bar (the resource bar is hidden while classless).
  const need = xpToNext(state.level);
  xpFill.style.width = `${Math.max(0, Math.min(1, state.xp / need)) * 100}%`;
  xpWrap.title = `XP ${Math.floor(state.xp)} / ${need}`;
  if (state.classId === null) {
    resWrap.style.display = 'none';
  } else {
    const res = resource();
    resWrap.style.display = '';
    resFill.style.background = RESOURCE_COLOURS[res.kind];
    resFill.style.width = `${Math.max(0, Math.min(1, res.value / res.max)) * 100}%`;
    resWrap.title = `${RESOURCE_NAMES[res.kind]} ${Math.round(res.value)} / ${res.max}`;
  }

  // Boss bar: the first live boss-rank enemy in combat. Phase text stays 4 s after each phase change.
  let boss: Entity | undefined;
  for (const e of allEntities()) {
    if (e.kind === 'enemy' && !e.dead && e.inCombat && BOSS_RANKS.includes(ENEMIES[e.defId]?.rank as Rank)) {
      boss = e;
      break;
    }
  }
  if (boss) {
    bossWrap.style.display = '';
    bossName.textContent = boss.name;
    bossFill.style.width = `${Math.max(0, Math.min(1, boss.hp / boss.maxHp)) * 100}%`;
    bossHp.textContent = `${Math.max(0, Math.round(boss.hp))} / ${boss.maxHp}`;
  } else {
    bossWrap.style.display = 'none';
  }
  if (phaseTimer > 0) {
    phaseTimer = Math.max(0, phaseTimer - dt);
    phaseEl.style.display = '';
    phaseEl.style.top = boss ? '44px' : '8px';
    phaseEl.style.opacity = String(Math.min(1, phaseTimer / 0.5));
    if (phaseTimer === 0) phaseEl.style.display = 'none';
  } else {
    phaseEl.style.display = 'none';
  }

  // Zone banner: starts fully opaque and fades linearly over its 3 s.
  if (zoneTimer > 0) {
    zoneTimer = Math.max(0, zoneTimer - dt);
    zoneEl.style.opacity = String(Math.max(0, Math.min(1, zoneTimer / BANNER_SECONDS)));
  } else {
    zoneEl.style.opacity = '0';
  }

  // Poison timers for untyped hitsplats.
  for (const [id, left] of poisoned) {
    const next = left - dt;
    if (next <= 0) poisoned.delete(id);
    else poisoned.set(id, next);
  }

  // Region name: fades in and out when the player enters a new place.
  const region = regionNameAt(player.position.x, player.position.z);
  if (lastRegion !== null && region !== lastRegion) regionTimer = REGION_SECONDS;
  lastRegion = region;
  if (regionTimer > 0) {
    regionTimer = Math.max(0, regionTimer - dt);
    const t = REGION_SECONDS - regionTimer;
    regionEl.textContent = region;
    regionEl.style.opacity = String(Math.max(0, Math.min(1, t / 0.5, (REGION_SECONDS - t) / 0.8)));
  } else {
    regionEl.style.opacity = '0';
  }

  // Banners: fade in briefly, hold, fade out, then remove.
  for (let i = banners.length - 1; i >= 0; i--) {
    const b = banners[i];
    b.life -= dt;
    if (b.life <= 0) {
      b.el.remove();
      banners.splice(i, 1);
      continue;
    }
    const t = b.total - b.life;
    b.el.style.opacity = String(Math.max(0, Math.min(1, t / 0.2, b.life / 0.6)));
  }

  // Death overlay.
  if (deathTimer > 0) {
    deathTimer -= dt;
    if (deathTimer <= 0) deathEl.style.display = 'none';
  }

  // Hitsplats and heal text: rise and fade over 1 s, then removed.
  for (let i = splats.length - 1; i >= 0; i--) {
    const s = splats[i];
    s.age += dt;
    if (s.age >= SPLAT_SECONDS) {
      s.el.remove();
      splats.splice(i, 1);
      continue;
    }
    const p = toScreen(s.at, camera);
    if (!p) { s.el.style.display = 'none'; continue; }
    const rise = (s.age / SPLAT_SECONDS) * RISE_PX;
    placeAt(s.el, p.x + s.dx, p.y + s.dy - rise, '-50%', '-50%');
    s.el.style.opacity = String(1 - s.age / SPLAT_SECONDS);
  }

  // Overhead HP bars: enemies hit in the last 6 s, and the player for 6 s after any hit on them.
  playerBarTimer = Math.max(0, playerBarTimer - dt);
  const used = new Set<number>();

  /** `label` (enemies only) is the nameplate above the bar, coloured by rank. */
  const showBar = (id: number, hp: number, max: number, world: THREE.Vector3, label?: { text: string; colour: string }) => {
    const p = toScreen(world, camera);
    let bar = bars.get(id);
    if (!bar) {
      const wrap = make(hudEl, 'div', {
        position: 'absolute', left: '0', top: '0', width: '40px', height: '5px',
        background: UI.bad, border: `1px solid ${UI.border}`, boxSizing: 'border-box', pointerEvents: 'none',
      });
      const fill = make(wrap, 'div', { height: '100%', background: UI.good });
      const name = label
        ? make(wrap, 'div', {
            position: 'absolute', left: '50%', bottom: '100%', transform: 'translate(-50%, -3px)',
            whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 'bold', textShadow: '1px 1px 0 #000',
          })
        : null;
      bar = { wrap, fill, name };
      bars.set(id, bar);
    }
    if (label && bar.name) {
      bar.name.textContent = label.text;
      bar.name.style.color = label.colour;
    }
    used.add(id);
    if (!p) { bar.wrap.style.display = 'none'; return; }
    bar.fill.style.width = `${Math.max(0, Math.min(1, hp / max)) * 100}%`;
    placeAt(bar.wrap, p.x, p.y, '-50%', '-100%');
  };

  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || e.dead || e.sinceHit >= 6) continue;
    const def = ENEMIES[e.defId];
    const scale = def?.scale ?? 1;
    const world = e.position.clone().add(new THREE.Vector3(0, 1.6 * scale + 0.6, 0));
    const colour = RANK_COLOURS[def?.rank ?? 'normal'];
    showBar(e.id, e.hp, e.maxHp, world, { text: e.name, colour });
  }
  if (playerBarTimer > 0) {
    const world = player.position.clone().add(new THREE.Vector3(0, 2.0, 0));
    showBar(PLAYER_ID, state.hp, hpMax, world);
  }
  for (const [id, bar] of bars) {
    if (!used.has(id)) bar.wrap.style.display = 'none';
  }

  updateHotbar();
}

/** Top-left mouse-over text (RuneScape style); null hides it. */
export function setHoverText(text: string | null): void {
  hoverEl.innerHTML = '';
  if (text === null) {
    hoverEl.style.display = 'none';
    return;
  }
  twoTone(hoverEl, text);
  hoverEl.style.display = '';
}

/** Opens a right-click menu at screen (x, y) in CSS pixels. */
export function showContextMenu(x: number, y: number, options: MenuOption[]): void {
  menuEl.innerHTML = '';

  make(menuEl, 'div', {
    background: UI.panelBgDark, color: UI.textDim, padding: '4px 8px', fontWeight: 'bold',
    borderBottom: `1px solid ${UI.borderLight}`,
  }, 'Choose Option');

  for (const opt of options) {
    const row = make(menuEl, 'div', {
      padding: TOUCH ? '10px 12px' : '4px 8px', color: UI.text, cursor: 'pointer', whiteSpace: 'nowrap',
    });
    twoTone(row, opt.label);
    row.addEventListener('mouseenter', () => { row.style.background = 'rgba(90, 76, 58, 0.96)'; });
    row.addEventListener('mouseleave', () => { row.style.background = ''; });
    row.addEventListener('click', () => {
      hideMenu();
      opt.onSelect();
    });
  }

  menuEl.style.display = 'block';
  menuOpen = true;

  // Keep the menu inside the viewport.
  const w = menuEl.offsetWidth;
  const h = menuEl.offsetHeight;
  const left = Math.max(0, Math.min(x, innerWidth - w - 2));
  const top = Math.max(0, Math.min(y, innerHeight - h - 2));
  menuEl.style.left = `${left}px`;
  menuEl.style.top = `${top}px`;
}

export function hideContextMenu(): void {
  hideMenu();
}
