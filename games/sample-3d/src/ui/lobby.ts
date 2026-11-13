import type { CharacterId } from '../config';
import type { GameMode, LobbyCallbacks, LobbyUI, MetaSave, MetaUpgradeDef } from '../config';
import type { VisualMode } from '../config';
import { CHARACTERS, CHARACTER_ORDER, LOCKED_CHARACTER_NAMES, META_UPGRADES, SOLO_LEVELS, TUNING, upgradeCost } from '../config';
import { checkName, NAME_MAX } from '../net/textFilter';

/** The lobby's modes: the two game modes, plus ONLINE (matchmaking, not a local run). */
type LobbyMode = GameMode | 'online';

const CSS = `
.lb-root {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  font-family: 'Arial Black', Impact, system-ui, sans-serif; color: #fff;
  background: linear-gradient(90deg, rgba(40,10,90,.65), transparent 30%, transparent 62%, rgba(40,10,90,.75));
}
.lb-top {
  position: absolute; left: 0; right: 0; top: 0; height: 56px; box-sizing: border-box;
  display: flex; align-items: center; padding: 0 24px; gap: 16px;
  background: rgba(10,4,30,.6); pointer-events: none;
}
.lb-logo { color: #ffd54a; font-size: 26px; line-height: 1; text-shadow: 0 3px 0 #000; white-space: nowrap; }
.lb-tag { font-size: 10px; color: #d8c8ff; letter-spacing: 1px; margin-top: 4px; white-space: nowrap; }
.lb-nav { flex: 1; display: flex; justify-content: center; gap: 22px; }
.lb-tab {
  background: none; border: none; color: #e6dcff; font: inherit; font-size: 14px;
  padding: 18px 4px; cursor: pointer; pointer-events: auto; text-transform: uppercase;
}
.lb-gh { display: flex; align-items: center; color: #e6dcff; pointer-events: auto; opacity: .85; }
.lb-gh:hover { color: #fff; opacity: 1; }
.lb-privacy { color: #e6dcff; opacity: .7; font-size: 10px; letter-spacing: 1px; pointer-events: auto; text-decoration: none; white-space: nowrap; }
.lb-privacy:hover { opacity: 1; text-decoration: underline; }
.lb-gh svg { width: 24px; height: 24px; fill: currentColor; filter: drop-shadow(0 2px 0 #000); }
.lb-tab.on { color: #fff; text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 10px; }
.lb-acorns {
  background: #ffb300; color: #2a1400; border-radius: 999px; padding: 6px 14px;
  font-size: 15px; white-space: nowrap;
}
.lb-h {
  font-size: 20px; font-style: italic; text-transform: uppercase; margin: 0 0 8px;
  text-shadow: 0 3px 0 #000, 0 0 14px rgba(0,0,0,.7);
}
.lb-sub { font-size: 12px; font-style: italic; color: #d8c8ff; margin-bottom: 12px; text-shadow: 0 2px 0 #000; }
.lb-chars {
  position: absolute; top: 80px; left: 24px; width: 230px; box-sizing: border-box;
  max-height: calc(100vh - 220px); overflow-y: auto; pointer-events: auto; padding: 12px 10px 12px 12px;
  background: rgba(14, 6, 40, .55); border: 1px solid rgba(255,255,255,.15); border-radius: 12px;
}
.lb-card {
  position: relative; box-sizing: border-box; padding: 10px; margin-bottom: 10px; border-radius: 10px;
  background: rgba(20,8,50,.8); border: 3px solid transparent; pointer-events: auto;
}
.lb-card.sel {
  background: linear-gradient(rgba(20,8,50,.9), rgba(20,8,50,.9)) padding-box,
              linear-gradient(135deg, #ffe14d, #ff9800) border-box;
}
.lb-card.locked { background: rgba(30,30,40,.8); filter: grayscale(1) brightness(.6); cursor: pointer; }
.lb-card.pick { cursor: pointer; }
.lb-card.pick:hover { filter: brightness(1.25); }
.lb-sel-tag {
  display: none; position: absolute; top: 6px; right: 6px; font-size: 9px; letter-spacing: 1px;
  background: #ffd54a; color: #2a1400; padding: 2px 6px; border-radius: 4px;
}
.lb-card.sel .lb-sel-tag { display: block; }
.lb-swatches { display: flex; gap: 6px; margin-top: 8px; }
.lb-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(255,255,255,.8); }
.lb-name { font-size: 16px; text-transform: uppercase; text-shadow: 0 2px 0 #000; }
.lb-rarity { font-size: 11px; color: #ffd54a; letter-spacing: 1px; margin-top: 4px; }
.lb-flavour { font-size: 12px; font-style: italic; color: #cbbdf0; margin-top: 6px; }
.lb-q { font-size: 52px; text-align: center; opacity: .5; line-height: 1.2; }
.lb-soon { font-size: 12px; letter-spacing: 2px; text-align: center; }
.lb-shop {
  position: absolute; top: 80px; right: 24px; width: 360px; box-sizing: border-box;
  /* Ends above the party / mode / PLAY cluster in the bottom-right corner, so they never overlap. */
  bottom: 330px; overflow-y: auto; pointer-events: auto; padding: 12px 10px 12px 12px;
  background: rgba(14, 6, 40, .55); border: 1px solid rgba(255,255,255,.15); border-radius: 12px;
}
.lb-side-panel { background: rgba(14, 6, 40, .55); border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 10px; }
@media (min-width: 761px) and (max-height: 820px) {
  .lb-party { display: none; }
  .lb-shop { bottom: 240px; }
}
.lb-row {
  box-sizing: border-box; padding: 12px; margin-bottom: 10px; border-radius: 10px;
  background: rgba(15,6,40,.82); border: 1px solid rgba(180,140,255,.35);
}
.lb-row.flash { animation: lb-flash .9s ease-out; }
@keyframes lb-flash {
  0% { background: rgba(255,213,74,.45); box-shadow: 0 0 0 2px #ffd54a, 0 0 24px #ffd54a; }
  100% { background: rgba(15,6,40,.82); box-shadow: none; }
}
.lb-rn { font-size: 16px; text-transform: uppercase; text-shadow: 0 2px 0 #000; }
.lb-rb { font-size: 12px; font-style: italic; color: #cbbdf0; margin-top: 2px; }
.lb-re { font-size: 13px; color: #9fe7ff; margin-top: 4px; }
.lb-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px; }
.lb-pips { display: flex; gap: 4px; }
.lb-pip {
  display: inline-block; width: 14px; height: 14px; box-sizing: border-box;
  border: 2px solid #b89cff; border-radius: 2px;
}
.lb-pip.on { background: #ffd54a; border-color: #ffd54a; }
.lb-buy {
  font: inherit; font-weight: bold; font-size: 14px; padding: 8px 12px; border: none; border-radius: 6px;
  background: linear-gradient(#ffe14d, #ffb300); color: #2a1400; cursor: pointer; pointer-events: auto;
  white-space: nowrap;
}
.lb-buy:disabled { background: #555; color: #999; cursor: not-allowed; opacity: .6; }
.lb-stats {
  position: absolute; left: 24px; bottom: 24px; font-size: 13px; letter-spacing: 1px;
  text-shadow: 0 2px 0 #000; max-width: 560px;
}
.lb-tip { margin-top: 6px; font-family: system-ui, sans-serif; font-style: italic; font-size: 14px; color: #ffd9a0; }
.lb-play {
  position: absolute; right: 24px; bottom: 24px; width: 300px; height: 96px; box-sizing: border-box;
  border: none; border-radius: 10px; padding: 0; cursor: pointer; pointer-events: auto;
  background: linear-gradient(#ffe14d, #ffb300); color: #2a1400; font: inherit;
  transform: skew(-8deg); transition: transform .12s;
  box-shadow: 0 6px 0 #8a5a00, 0 0 24px rgba(255,200,60,.5);
}
.lb-play:hover { transform: skew(-8deg) scale(1.05); }
.lb-play-main { font-size: 54px; font-style: italic; line-height: 1; }
.lb-play-sub { font-size: 12px; letter-spacing: 1px; margin-top: 2px; }
.lb-toast {
  position: absolute; top: 72px; left: 50%; transform: translateX(-50%); opacity: 0;
  transition: opacity .25s; pointer-events: none; white-space: nowrap;
  background: rgba(0,0,0,.8); color: #fff; padding: 10px 18px; border-radius: 6px; font-size: 15px;
}
.lb-toast.on { opacity: 1; }
.lb-vm { margin-top: 14px; pointer-events: auto; }
.lb-seg { display: flex; gap: 6px; }
.lb-seg-btn {
  flex: 1; font: inherit; font-size: 13px; padding: 8px 4px; border-radius: 6px; cursor: pointer;
  pointer-events: auto; background: rgba(20,8,50,.8); color: #e6dcff;
  border: 2px solid rgba(255,255,255,.6);
}
.lb-seg-btn:hover { filter: brightness(1.25); }
.lb-seg-btn.on { background: #ffd54f; color: #2a1400; border-color: #ffd54f; }
.lb-vm-cap { margin-top: 8px; font-size: 12px; font-style: italic; color: #ffd9a0; text-shadow: 0 2px 0 #000; min-height: 1.2em; }
.lb-side {
  position: absolute; right: 24px; bottom: 132px; width: 300px; box-sizing: border-box; pointer-events: none;
}
.lb-party { pointer-events: auto; margin-bottom: 14px; }
.lb-slots { display: flex; gap: 6px; }
.lb-slot {
  flex: 1; min-width: 0; box-sizing: border-box; font: inherit; font-size: 12px; padding: 8px 4px;
  border-radius: 6px; text-align: center; background: rgba(20,8,50,.8); color: #e6dcff;
  border: 2px solid rgba(255,255,255,.6);
}
.lb-slot.empty { pointer-events: auto; cursor: pointer; font-size: 20px; }
.lb-slot.empty:hover { filter: brightness(1.25); }
.lb-mode { display: flex; gap: 6px; pointer-events: auto; }
.lb-mode-cell { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.lb-mode-btn {
  font: inherit; font-size: 13px; padding: 10px 4px; border-radius: 6px; cursor: pointer;
  pointer-events: auto; background: rgba(20,8,50,.8); color: #e6dcff;
  border: 2px solid rgba(255,255,255,.6);
}
.lb-mode-btn:hover { filter: brightness(1.25); }
.lb-mode-btn.on { background: #ffd54f; color: #2a1400; border-color: #ffd54f; }
.lb-mode-cap { margin-top: 4px; font-size: 11px; font-style: italic; color: #ffd9a0; text-align: center; text-shadow: 0 2px 0 #000; }
.lb-mode-btn.locked, .lb-mode-btn.locked:hover {
  background: rgba(20,8,50,.5); color: #8f88aa; border-color: rgba(255,255,255,.25);
  filter: grayscale(1); cursor: not-allowed;
}
.lb-level-wrap { margin-bottom: 8px; pointer-events: auto; }
.lb-level-cap {
  margin-top: 4px; font-size: 11px; font-style: italic; color: #ffd9a0; text-align: center; text-shadow: 0 2px 0 #000;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lb-mode-btn:disabled { cursor: not-allowed; opacity: .6; }
.lb-mode-btn:disabled:hover { filter: none; }
.lb-code-wrap { margin-bottom: 8px; pointer-events: auto; }
.lb-code {
  display: block; box-sizing: border-box; width: 100%; font: inherit; font-size: 14px; letter-spacing: 2px;
  text-transform: uppercase; padding: 9px 10px; border-radius: 6px; pointer-events: auto;
  background: rgba(20,8,50,.8); color: #fff; border: 2px solid rgba(255,255,255,.6);
}
.lb-code::placeholder { color: #8f88aa; letter-spacing: 1px; font-size: 12px; text-transform: none; }
.lb-code:focus { outline: none; border-color: #ffd54f; }
.lb-code:disabled { opacity: .6; }

.lb-nick { text-transform: none; letter-spacing: 0; margin-bottom: 6px; }
.lb-nick::placeholder { letter-spacing: 1px; }
.lb-code.bad { border-color: #ff5252; }
.lb-match {
  box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 10px;
  padding: 10px 12px; border-radius: 12px; background: rgba(10,4,30,.85); border: 1px solid rgba(255,255,255,.2);
  font-size: 15px; font-weight: bold; color: #fff; text-shadow: 0 2px 0 #000;
}
.lb-match-dot {
  flex: none; width: 10px; height: 10px; border-radius: 50%; background: #ffd54a;
  animation: lb-pulse 1s ease-in-out infinite;
}
@keyframes lb-pulse {
  0%, 100% { opacity: .25; transform: scale(.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.lb-match-text { flex: 1; min-width: 0; line-height: 1.25; overflow-wrap: anywhere; }
.lb-match-cancel {
  flex: none; font: inherit; font-size: 12px; padding: 7px 10px; border: none; border-radius: 6px;
  background: linear-gradient(#ffe14d, #ffb300); color: #2a1400; cursor: pointer; pointer-events: auto;
}
.lb-play:disabled, .lb-play:disabled:hover { filter: grayscale(.7) brightness(.8); transform: skew(-8deg); cursor: not-allowed; }
@media (max-width: 760px) {
  .lb-nav { display: none; }
  .lb-chars {
    top: 64px; left: 8px; right: 8px; width: auto; height: auto; max-height: none;
    display: flex; flex-direction: row; align-items: flex-start; gap: 8px;
    overflow-x: auto; overflow-y: hidden; padding-right: 0; padding-bottom: 4px;
  }
  .lb-chars > .lb-h { flex: none; width: 110px; margin: 0; }
  .lb-chars > .lb-card { flex: none; width: 140px; margin-bottom: 0; }
  .lb-chars > .lb-vm { flex: none; width: 240px; margin-top: 0; }
  .lb-shop {
    top: auto; left: 8px; right: 8px; bottom: 240px; width: auto;
    max-height: 28vh; overflow-y: auto;
  }
  .lb-stats { display: none; }
  .lb-side { left: 8px; right: 8px; bottom: 90px; width: auto; }
  .lb-play { left: 8px; right: 8px; bottom: 8px; width: auto; height: 72px; }
  .lb-play-main { font-size: 40px; }
}
@media (max-height: 480px) {
  .lb-chars > .lb-card { display: none; }
  .lb-shop { top: 64px; bottom: auto; max-height: calc(100vh - 160px); }
  .lb-side { left: 12px; right: auto; bottom: 12px; top: auto; width: 300px; }
  .lb-chars { max-height: 40vh; }
  .lb-play { height: 64px; }
}
`;

const TIPS = [
  'Tip: Dying is part of the gameplay loop. Embrace it.',
  'Tip: Permadeath means your gnome dies. Permanently. Until the next run.',
  'Tip: Upgrades persist between runs. That makes it a roguelite. Please do not email us.',
  'Tip: Hold Shift to sprint. Gnomes can sprint. Briefly.',
  'Tip: The combine arrives at 4:00. It is not here to help.',
  'Tip: Push reel mowers have no engine. They run on spite.',
  'Tip: You can jump over mowers. You cannot jump over a combine. Combines are tall.',
  'Tip: Every run is randomly generated. We call it procedural for marketing.',
];

const NAV = ['PLAY', 'LOCKER', 'ITEM SHOP', 'BATTLE PASS', 'CAREER'];
const TIP_INTERVAL_MS = 6000;
const TOAST_MS = 1800;

interface ShopRow {
  def: MetaUpgradeDef;
  row: HTMLDivElement;
  pips: HTMLSpanElement[];
  btn: HTMLButtonElement;
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** A small colour dot for the character card's swatch row. */
function swatch(color: number): HTMLSpanElement {
  const dot = h('span', 'lb-dot');
  dot.style.background = `#${color.toString(16).padStart(6, '0')}`;
  return dot;
}

function injectStyle(): void {
  if (document.getElementById('lb-style')) return;
  const style = h('style');
  style.id = 'lb-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function createLobbyUI(root: HTMLElement, cb: LobbyCallbacks): LobbyUI {
  injectStyle();

  const screen = h('div', 'lb-root');
  screen.style.display = 'none';
  root.appendChild(screen);

  // Toast
  const toast = h('div', 'lb-toast');
  let toastTimer = 0;
  function showToast(msg: string): void {
    toast.textContent = msg;
    toast.classList.add('on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('on'), TOAST_MS);
  }

  // Top bar
  const top = h('div', 'lb-top');
  const brand = h('div');
  brand.append(h('div', 'lb-logo', 'LAWN GNOME PANIC'), h('div', 'lb-tag', 'SEASON 1: THE LAWN REMEMBERS'));
  const nav = h('div', 'lb-nav');
  for (const name of NAV) {
    const tab = h('button', name === 'PLAY' ? 'lb-tab on' : 'lb-tab', name);
    tab.onclick = () => {
      if (name !== 'PLAY') showToast('Coming soon. Probably.');
    };
    nav.appendChild(tab);
  }
  const acorns = h('div', 'lb-acorns');
  const gh = h('a', 'lb-gh');
  gh.href = 'https://github.com/cstabnick/lawn-gnome-panic';
  gh.target = '_blank';
  gh.rel = 'noopener';
  gh.title = 'Source code on GitHub';
  gh.setAttribute('aria-label', 'Source code on GitHub');
  gh.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  gh.addEventListener('pointerdown', (e) => e.stopPropagation());
  const privacy = h('a', 'lb-privacy', 'PRIVACY');
  privacy.href = 'https://github.com/cstabnick/lawn-gnome-panic/blob/main/PRIVACY.md';
  privacy.target = '_blank';
  privacy.rel = 'noopener';
  privacy.title = 'What the game collects (anonymous reports, no names or chat)';
  privacy.addEventListener('pointerdown', (e) => e.stopPropagation());
  top.append(brand, nav, acorns, privacy, gh);

  // Character column
  const chars = h('div', 'lb-chars');
  chars.appendChild(h('div', 'lb-h', 'CHOOSE YOUR GNOME'));
  const charCards = new Map<CharacterId, HTMLDivElement>();
  for (const id of CHARACTER_ORDER) {
    const def = CHARACTERS[id];
    const card = h('div', 'lb-card pick');
    const swatches = h('div', 'lb-swatches');
    swatches.appendChild(swatch(def.look.hat));
    if (def.look.hair) swatches.appendChild(swatch(def.look.hair.color));
    card.append(
      h('div', 'lb-sel-tag', 'SELECTED'),
      h('div', 'lb-name', def.name),
      h('div', 'lb-rarity', def.rarity),
      h('div', 'lb-flavour', def.flavour),
      swatches,
    );
    card.onclick = () => cb.onSelectCharacter(id);
    charCards.set(id, card);
    chars.appendChild(card);
  }
  for (const name of LOCKED_CHARACTER_NAMES) {
    const card = h('div', 'lb-card locked');
    card.append(h('div', 'lb-q', '?'), h('div', 'lb-name', name), h('div', 'lb-soon', 'COMING SOON'));
    card.onclick = () => showToast('COMING SOON™. This is a roguelike, not a promise.');
    chars.appendChild(card);
  }

  // Visual mode toggle (feature flags)
  const VISUAL_MODES: { mode: VisualMode; label: string }[] = [
    { mode: 'off', label: 'OFF' },
    { mode: 'rtx', label: 'RTX ON' },
    { mode: 'crt', label: 'CRT' },
    { mode: 'lite', label: 'LITE' },
  ];
  const VISUAL_CAPTIONS: Record<VisualMode, string> = {
    off: 'As the gnome intended.',
    rtx: 'Ray-traced* (*not ray-traced). Now 400% blurrier.',
    crt: "Like grandma's TV. Scanlines at no extra charge.",
    lite: 'For phones from the before times. Fewer pixels, no shadows, same gnome.',
  };
  const vm = h('div', 'lb-vm');
  const seg = h('div', 'lb-seg');
  const vmButtons = new Map<VisualMode, HTMLButtonElement>();
  for (const { mode, label } of VISUAL_MODES) {
    const btn = h('button', 'lb-seg-btn', label);
    btn.onclick = () => cb.onVisualMode(mode);
    vmButtons.set(mode, btn);
    seg.appendChild(btn);
  }
  const vmCaption = h('div', 'lb-vm-cap');
  vm.append(h('div', 'lb-h', 'VISUAL MODE'), h('div', 'lb-sub', '(feature flags)'), seg, vmCaption);
  chars.appendChild(vm);

  function applyVisualMode(mode: VisualMode): void {
    for (const [m, btn] of vmButtons) btn.classList.toggle('on', m === mode);
    vmCaption.textContent = VISUAL_CAPTIONS[mode];
  }
  applyVisualMode('off');

  // Shop column
  const shop = h('div', 'lb-shop');
  shop.append(
    h('div', 'lb-h', 'PRIMITIVE POWERS'),
    h('div', 'lb-sub', 'Spend acorns. Get stronger. Die anyway.'),
  );
  const rows: ShopRow[] = META_UPGRADES.map((def) => {
    const row = h('div', 'lb-row');
    const pipsWrap = h('div', 'lb-pips');
    const pips: HTMLSpanElement[] = [];
    for (let i = 0; i < def.maxLevel; i++) {
      const pip = h('span', 'lb-pip');
      pips.push(pip);
      pipsWrap.appendChild(pip);
    }
    const btn = h('button', 'lb-buy');
    btn.onclick = () => cb.onBuy(def.id);
    const foot = h('div', 'lb-foot');
    foot.append(pipsWrap, btn);
    row.append(h('div', 'lb-rn', def.name), h('div', 'lb-rb', def.blurb), h('div', 'lb-re', def.effect), foot);
    shop.appendChild(row);
    return { def, row, pips, btn };
  });

  // Run stats and rotating tip
  const stats = h('div', 'lb-stats');
  const statsLine = h('div');
  const tip = h('div', 'lb-tip');
  stats.append(statsLine, tip);

  // Play button
  const play = h('button', 'lb-play');
  const playSub = h('div', 'lb-play-sub');
  play.append(h('div', 'lb-play-main', 'PLAY'), playSub);
  play.onclick = () => startPlay();

  // Party panel (fake, foreshadows multiplayer) and game mode selector, stacked above PLAY
  let mode: LobbyMode = 'solo';
  let runCount = 0;
  const side = h('div', 'lb-side lb-side-panel');
  const party = h('div', 'lb-party');
  party.append(h('div', 'lb-h', 'PARTY 1/4'));
  const slots = h('div', 'lb-slots');
  const partySlot = h('div', 'lb-slot');
  slots.append(partySlot);
  for (let i = 0; i < 3; i++) {
    const empty = h('button', 'lb-slot empty', '+');
    empty.type = 'button';
    empty.onclick = () => showToast('Inviting friends: COMING SOON. For now, the bots are your friends.');
    slots.appendChild(empty);
  }
  party.append(slots);

  /** Marks the chosen card (gold border + SELECTED tag) and names the party slot. */
  function applyCharacter(id: CharacterId): void {
    for (const [cid, card] of charCards) card.classList.toggle('sel', cid === id);
    partySlot.textContent = `${CHARACTERS[id].name} (you)`;
  }
  applyCharacter(CHARACTER_ORDER[0]);

  const modeRow = h('div', 'lb-mode');
  const modeBtns = new Map<LobbyMode, HTMLButtonElement>();
  const MODE_OPTIONS: { mode: LobbyMode; label: string; caption: string }[] = [
    { mode: 'solo', label: 'SOLO', caption: '' },
    { mode: 'royale', label: 'BATTLE ROYALE', caption: `vs ${TUNING.royaleBots} bots` },
    { mode: 'online', label: 'ONLINE', caption: 'up to 20 humans' },
  ];
  for (const opt of MODE_OPTIONS) {
    const cell = h('div', 'lb-mode-cell');
    const btn = h('button', 'lb-mode-btn', opt.label);
    btn.type = 'button';
    btn.onclick = () => setMode(opt.mode);
    modeBtns.set(opt.mode, btn);
    cell.append(btn, h('div', 'lb-mode-cap', opt.caption));
    modeRow.appendChild(cell);
  }
  // Solo level picker, directly above the mode row (shown in SOLO only)
  let level = 1;                          // 1-based solo level
  let unlocked = 1;                       // solo levels the save has unlocked
  let seenUnlocked: number | null = null; // levelsUnlocked at the last render
  const levelWrap = h('div', 'lb-level-wrap');
  const levelRow = h('div', 'lb-mode');
  const levelBtns: HTMLButtonElement[] = [];
  SOLO_LEVELS.forEach((_def, i) => {
    const cell = h('div', 'lb-mode-cell');
    const btn = h('button', 'lb-mode-btn', `LV ${i + 1}`);
    btn.type = 'button';
    btn.onclick = () => {
      if (i + 1 > unlocked) {
        showToast(`Beat Level ${i} to unlock.`);
        return;
      }
      setLevel(i + 1);
    };
    levelBtns.push(btn);
    cell.appendChild(btn);
    levelRow.appendChild(cell);
  });
  const levelCap = h('div', 'lb-level-cap');
  levelWrap.append(levelRow, levelCap);

  function applyLevels(): void {
    levelBtns.forEach((btn, i) => {
      const locked = i + 1 > unlocked;
      btn.classList.toggle('locked', locked);
      btn.classList.toggle('on', !locked && i + 1 === level);
      btn.textContent = `${locked ? '\u{1F512} ' : ''}LV ${i + 1}`;
    });
    const def = SOLO_LEVELS[level - 1];
    const name = def.name.slice(def.name.indexOf(':') + 2);
    levelCap.textContent = `${name} · Boss: ${def.bossCount} combine${def.bossCount === 1 ? '' : 's'}`;
  }

  function setLevel(n: number): void {
    level = n;
    applyLevels();
    updatePlaySub();
  }

  /** Re-reads the unlock count. A newly unlocked level is selected; a selection that is now locked falls back to the highest unlocked. */
  function syncLevels(save: MetaSave): void {
    const count = Math.min(Math.max(save.levelsUnlocked, 1), SOLO_LEVELS.length);
    const prev = seenUnlocked;
    seenUnlocked = count;
    unlocked = count;
    if (prev !== null && count > prev) level = count;
    if (level > unlocked) level = unlocked;
    applyLevels();
  }

  // Room code row, ONLINE only (between the level picker and the mode row)
  let searching = false;
  const codeWrap = h('div', 'lb-code-wrap');
  // Display name, checked on every edit. Only good names reach onSetName; the value is not rewritten while typing.
  const nameInput = h('input', 'lb-code lb-nick');
  nameInput.type = 'text';
  nameInput.placeholder = 'YOUR NAME';
  nameInput.maxLength = NAME_MAX;
  nameInput.autocomplete = 'off';
  nameInput.spellcheck = false;
  nameInput.oninput = () => {
    const c = checkName(nameInput.value);
    if (c.ok) {
      nameInput.classList.remove('bad');
      nameInput.title = '';
      cb.onSetName(c.name);
    } else {
      nameInput.classList.add('bad');
      nameInput.title = c.reason;
    }
  };
  nameInput.onkeydown = (e) => {
    e.stopPropagation(); // typing must not trigger game keys
    if (e.key === 'Enter') {
      e.preventDefault();
      startPlay();
    }
  };
  const codeInput = h('input', 'lb-code');
  codeInput.type = 'text';
  codeInput.placeholder = 'ROOM CODE (optional)';
  codeInput.maxLength = 8;
  codeInput.autocomplete = 'off';
  codeInput.spellcheck = false;
  codeInput.oninput = () => {
    const clean = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean !== codeInput.value) codeInput.value = clean;
    updatePlaySub();
  };
  codeInput.onkeydown = (e) => {
    e.stopPropagation(); // typing must not trigger game keys
    if (e.key === 'Enter') {
      e.preventDefault();
      startPlay();
    }
  };
  codeWrap.append(nameInput, codeInput);
  codeWrap.style.display = 'none';

  // Matchmaking status, shown at the bottom of the panel (just above PLAY) while searching in ONLINE
  const matchBox = h('div', 'lb-match');
  const matchText = h('span', 'lb-match-text');
  const matchCancel = h('button', 'lb-match-cancel', 'CANCEL');
  matchCancel.type = 'button';
  matchCancel.onclick = () => cb.onLeaveMatch();
  matchBox.append(h('span', 'lb-match-dot'), matchText, matchCancel);
  matchBox.style.display = 'none';

  side.append(party, levelWrap, codeWrap, modeRow, matchBox);

  /** The play button and Enter: ONLINE starts matchmaking; the other modes start a run. */
  function startPlay(): void {
    if (searching) return;
    const m = mode;
    if (m === 'online') {
      const c = checkName(nameInput.value);
      if (!c.ok) {
        showToast(c.reason);
        nameInput.classList.add('bad');
        return;
      }
      const code = codeInput.value;
      if (code.length > 0 && code.length < 4) {
        showToast('Room codes are 4-8 letters or digits.');
        return;
      }
      cb.onFindMatch(code.length > 0 ? code : null);
      return;
    }
    cb.onPlay(m, level);
  }

  /** Searching: show the status box and turn off play, the mode buttons and the code input. */
  function setSearching(text: string | null): void {
    searching = text !== null;
    if (text !== null) matchText.textContent = text;
    matchBox.style.display = searching ? '' : 'none';
    play.disabled = searching;
    codeInput.disabled = searching;
    nameInput.disabled = searching;
    for (const btn of modeBtns.values()) btn.disabled = searching;
    requestAnimationFrame(fitShop);
  }

  function updatePlaySub(): void {
    if (mode === 'online') {
      const code = codeInput.value;
      playSub.textContent = `RUN #${runCount + 1} · ONLINE ROYALE · ${code ? 'ROOM ' + code : 'PUBLIC MATCHMAKING'}`;
      return;
    }
    playSub.textContent = mode === 'royale'
      ? `RUN #${runCount + 1} · BATTLE ROYALE · ${TUNING.royaleBots + 1} GNOMES`
      : `RUN #${runCount + 1} · SOLO · LEVEL ${level}`;
  }

  // The shop ends just above the party/level/mode panel, whatever its height: fixed offsets kept
  // overlapping every time that panel grew. Phone layouts position both in CSS instead.
  const fitShop = (): void => {
    if (window.innerWidth <= 760 || window.innerHeight <= 480) {
      shop.style.bottom = '';
      return;
    }
    const top = side.getBoundingClientRect().top;
    if (top > 0) shop.style.bottom = `${Math.ceil(window.innerHeight - top + 12)}px`;
  };
  window.addEventListener('resize', fitShop);

  function setMode(next: LobbyMode): void {
    mode = next;
    for (const [m, btn] of modeBtns) btn.classList.toggle('on', m === mode);
    levelWrap.style.display = mode === 'solo' ? '' : 'none';
    codeWrap.style.display = mode === 'online' ? '' : 'none';
    requestAnimationFrame(fitShop);
    updatePlaySub();
  }
  setMode('solo');

  screen.append(top, chars, shop, stats, side, play, toast);

  let visible = false;
  let tipIdx = Math.floor(Math.random() * TIPS.length);
  let tipTimer = 0;
  let lastLevels: Record<string, number> | null = null;

  function render(save: MetaSave, flash: boolean): void {
    acorns.textContent = `\u{1F330} ${save.acorns}`;
    const next: Record<string, number> = {};
    for (const r of rows) {
      const level = save.upgrades[r.def.id];
      r.pips.forEach((pip, i) => pip.classList.toggle('on', i < level));
      if (level >= r.def.maxLevel) {
        r.btn.textContent = 'MAXED';
        r.btn.disabled = true;
      } else {
        const cost = upgradeCost(r.def, level);
        r.btn.textContent = `\u{1F330} ${cost}`;
        r.btn.disabled = save.acorns < cost;
      }
      const prev = lastLevels?.[r.def.id];
      if (flash && prev !== undefined && level > prev) {
        r.row.classList.remove('flash');
        void r.row.offsetWidth; // restart the animation
        r.row.classList.add('flash');
      }
      next[r.def.id] = level;
    }
    lastLevels = next;

    statsLine.textContent =
      `RUNS ${save.runs} · BEST ${fmtTime(save.bestTimeS)} · ` +
      `COMBINES DEFEATED ${save.bossKills} · LIFETIME ACORNS ${save.totalAcornsEarned}`;
    syncLevels(save);
    runCount = save.runs;
    updatePlaySub();
  }

  window.addEventListener('keydown', (e) => {
    if (!visible || searching || e.key !== 'Enter') return;
    e.preventDefault();
    startPlay();
  });

  return {
    setMatchStatus(text: string | null) {
      setSearching(text);
    },
    setCharacter(id: CharacterId) {
      applyCharacter(id);
    },
    setVisualMode(mode: VisualMode) {
      applyVisualMode(mode);
    },
    show(save: MetaSave) {
      render(save, false);
      nameInput.value = save.name;
      nameInput.classList.remove('bad');
      tip.textContent = TIPS[tipIdx];
      visible = true;
      matchBox.style.display = searching ? '' : 'none';
      screen.style.display = '';
      requestAnimationFrame(fitShop);
      window.clearInterval(tipTimer);
      tipTimer = window.setInterval(() => {
        tipIdx = (tipIdx + 1) % TIPS.length;
        tip.textContent = TIPS[tipIdx];
      }, TIP_INTERVAL_MS);
    },
    refresh(save: MetaSave) {
      render(save, true);
    },
    hide() {
      visible = false;
      matchBox.style.display = 'none';
      screen.style.display = 'none';
      window.clearInterval(tipTimer);
      tipTimer = 0;
    },
  };
}
