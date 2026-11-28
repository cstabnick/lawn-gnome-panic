// The DOM interface over the table: seats, pot, seat-anchored speech bubbles, fine-aim controls, message line,
// emotes + quips, menu, challenge selector, power meter, and game-over card. Lives inside #bil-root appended to #ui.
import type { GnomeLook } from '@lawn/gnome';
import { COARSE_NUDGE_RAD, FINE_NUDGE_RAD } from './aim';
import { PLAYER_QUIPS } from './banter';
import { CHALLENGES } from './challenges';
import { CPU_PROFILES, type CpuTier } from './cpu';
import { GAME_MODE_META, type GameMode } from './rules';
import { maxWager, wagerPayout, wagerPreset } from './wager';

export interface SeatView {
  name: string;
  look: GnomeLook;
  sub: string;
  active: boolean;
  /** The seat's balls/points pips. */
  pips?: { group: 'solid' | 'stripe' | null; potted: number; total?: number };
}

const PIP_COLOR = { solid: '#f2c94c', stripe: '#5b9bf0' } as const;

function pipsHtml(p: NonNullable<SeatView['pips']>): string {
  const color = p.group ? PIP_COLOR[p.group] : '#7ed957';
  const total = p.total ?? 7;
  let out = '';
  for (let i = 0; i < total; i++) {
    const on = i < p.potted;
    out += `<span class="pip${on ? ' on' : ''}" style="${on ? `background:${color};` : ''}"></span>`;
  }
  return `<div class="pips" aria-label="${p.potted} of ${total}">${out}</div>`;
}

export interface MenuView {
  status: string;
  searching: boolean;
  gameMode: GameMode;
  cpuTier: CpuTier;
  chips: number;
  wager: number;
  completedChallenges: number;
  totalChallenges: number;
}

export interface EmoteButton {
  id: string;
  label: string;
  icon: string;
}

export interface HudHandlers {
  onCpu(): void;
  onLocal(): void;
  onSpectate(): void;
  onOnline(): void;
  onRoom(code: string): void;
  onCancelSearch(): void;
  onMenu(): void;
  onRematch(): void;
  onRetry(): void;
  onNextChallenge(): void;
  onDoubleOrNothing(): void;
  onSound(): void;
  onCamera(): void;
  onReaim(): void;
  onFineToggle(): void;
  onNudge(rad: number): void;
  onEmote(id: string): void;
  onQuip(id: string): void;
  onSelectGameMode(mode: GameMode): void;
  onSelectCpuTier(tier: CpuTier): void;
  onWagerChange(amount: number): void;
  onClaimFreeChips(): void;
  onOpenChallenges(): void;
  onStartChallenge(id: string): void;
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const hex = (n: number): string => '#' + (n & 0xffffff).toString(16).padStart(6, '0');

export function gnomeFaceHtml(look: GnomeLook): string {
  const beard = look.beard !== null ? hex(look.beard) : 'transparent';
  return (
    `<span class="bil-face" aria-hidden="true">` +
    `<span class="hat" style="background:${hex(look.hat)}"></span>` +
    `<span class="brim" style="background:${hex(look.hat)}"></span>` +
    `<span class="skin" style="background:${hex(look.skin)}"></span>` +
    `<span class="beard" style="background:${beard}"></span>` +
    `</span>`
  );
}

const GAME_MODES: GameMode[] = ['8ball', '9ball', 'straight', '6ball', 'bank'];
const CPU_TIERS: CpuTier[] = ['casual', 'regular', 'shark', 'cracked'];

export function createHud(ui: HTMLElement, h: HudHandlers) {
  const root = document.createElement('div');
  root.id = 'bil-root';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  ui.appendChild(root);

  let nudgeTimer: number | null = null;
  const stopNudge = (): void => {
    if (nudgeTimer !== null) {
      window.clearInterval(nudgeTimer);
      nudgeTimer = null;
    }
  };

  root.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'nudge' && el.dataset.rad !== undefined) {
      const rad = Number(el.dataset.rad);
      h.onNudge(rad);
      stopNudge();
      nudgeTimer = window.setInterval(() => h.onNudge(rad), 75);
    }
  });
  window.addEventListener('pointerup', stopNudge);
  window.addEventListener('pointercancel', stopNudge);

  root.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.id === 'bil-wager-slider') {
      h.onWagerChange(Number(el.value));
    }
  });

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'cpu') h.onCpu();
    else if (act === 'local') h.onLocal();
    else if (act === 'spectate') h.onSpectate();
    else if (act === 'online') h.onOnline();
    else if (act === 'room') {
      const input = root.querySelector<HTMLInputElement>('#bil-room');
      h.onRoom((input?.value ?? '').trim().toUpperCase());
    } else if (act === 'cancel') h.onCancelSearch();
    else if (act === 'menu') h.onMenu();
    else if (act === 'rematch') h.onRematch();
    else if (act === 'retry') h.onRetry();
    else if (act === 'next-challenge') h.onNextChallenge();
    else if (act === 'double-wager') h.onDoubleOrNothing();
    else if (act === 'sound') h.onSound();
    else if (act === 'camera') h.onCamera();
    else if (act === 'reaim') h.onReaim();
    else if (act === 'fine') h.onFineToggle();
    else if (act === 'emotes') toggleEmotes();
    else if (act === 'emote' && el.dataset.id) {
      toggleEmotes(false);
      h.onEmote(el.dataset.id);
    } else if (act === 'quip' && el.dataset.id) {
      toggleEmotes(false);
      h.onQuip(el.dataset.id);
    } else if (act === 'gmode' && el.dataset.mode) {
      h.onSelectGameMode(el.dataset.mode as GameMode);
    } else if (act === 'ctier' && el.dataset.tier) {
      h.onSelectCpuTier(el.dataset.tier as CpuTier);
    } else if (act === 'wager-val' && el.dataset.val !== undefined) {
      h.onWagerChange(Number(el.dataset.val));
    } else if (act === 'claim-chips') {
      h.onClaimFreeChips();
    } else if (act === 'challenges') {
      h.onOpenChallenges();
    } else if (act === 'start-chal' && el.dataset.id) {
      h.onStartChallenge(el.dataset.id);
    }
  });

  const top = document.createElement('div');
  top.className = 'bil-top';
  const potEl = document.createElement('div');
  potEl.className = 'bil-pot';
  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bil-bubble';
  const power = document.createElement('div');
  power.className = 'bil-power';
  power.innerHTML = '<i></i>';
  const fineRow = document.createElement('div');
  fineRow.className = 'bil-fine-row';
  const emotes = document.createElement('div');
  emotes.className = 'bil-emotes';
  const msg = document.createElement('div');
  msg.className = 'bil-msg';
  const bar = document.createElement('div');
  bar.className = 'bil-bar';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  root.append(top, potEl, bubbleEl, power, fineRow, emotes, msg, bar, overlay);

  let menuOpen = false;
  let overOpen = false;
  let emotesOpen = false;
  let emoteCount = 0;
  let bubbleTimer: number | null = null;

  function toggleEmotes(open: boolean = !emotesOpen): void {
    emotesOpen = open && emoteCount > 0;
    emotes.style.display = emotesOpen ? 'flex' : 'none';
  }

  return {
    setSeats(seats: SeatView[]): void {
      top.innerHTML = seats
        .map(
          (s) =>
            `<div class="bil-seat${s.active ? ' active' : ''}">${gnomeFaceHtml(s.look)}` +
            `<div style="min-width:0;flex:1"><div class="nm">${esc(s.name)}</div><div class="sub">${esc(s.sub)}</div>` +
            (s.pips ? pipsHtml(s.pips) : '') +
            `</div></div>`,
        )
        .join('');
    },
    setPot(text: string | null): void {
      if (!text) {
        potEl.style.display = 'none';
        return;
      }
      potEl.textContent = text;
      potEl.style.display = 'block';
    },
    showBubble(speaker: string, text: string, accent = '#ffd54f', side?: 'left' | 'right'): void {
      if (bubbleTimer !== null) window.clearTimeout(bubbleTimer);
      bubbleEl.className = `bil-bubble${side ? ` ${side}` : ''}`;
      bubbleEl.style.borderColor = accent;
      bubbleEl.innerHTML = `<div class="sp" style="color:${esc(accent)}">${esc(speaker)}</div><div>"${esc(text)}"</div>`;
      bubbleEl.style.display = 'block';
      bubbleTimer = window.setTimeout(() => {
        bubbleEl.style.display = 'none';
        bubbleTimer = null;
      }, 4200);
    },
    hideBubble(): void {
      if (bubbleTimer !== null) {
        window.clearTimeout(bubbleTimer);
        bubbleTimer = null;
      }
      bubbleEl.style.display = 'none';
    },
    setPower(p: number | null): void {
      if (p === null) {
        power.style.display = 'none';
        return;
      }
      power.style.display = 'block';
      (power.firstElementChild as HTMLElement).style.width = `${Math.round(p * 100)}%`;
    },
    setFineControls(visible: boolean, fineOn: boolean): void {
      if (!visible) {
        fineRow.style.display = 'none';
        fineRow.innerHTML = '';
        return;
      }
      fineRow.style.display = 'flex';
      fineRow.innerHTML =
        `<button class="bil-btn" data-act="nudge" data-rad="${-COARSE_NUDGE_RAD}" aria-label="Quick nudge left" style="pointer-events:auto">◀◀</button>` +
        `<button class="bil-btn" data-act="nudge" data-rad="${-FINE_NUDGE_RAD}" aria-label="Fine nudge left" style="pointer-events:auto">◀</button>` +
        `<div class="bil-fine-pill">${fineOn ? '🎯 Fine 0.1°' : 'Nudge 0.1°/0.5°'}</div>` +
        `<button class="bil-btn" data-act="nudge" data-rad="${FINE_NUDGE_RAD}" aria-label="Fine nudge right" style="pointer-events:auto">▶</button>` +
        `<button class="bil-btn" data-act="nudge" data-rad="${COARSE_NUDGE_RAD}" aria-label="Quick nudge right" style="pointer-events:auto">▶▶</button>`;
    },
    setEmotes(list: EmoteButton[], includeQuips = false): void {
      const emoteHtml = list
        .map(
          (e) =>
            `<button class="bil-btn bil-emote" data-act="emote" data-id="${esc(e.id)}" title="${esc(e.label)}" style="pointer-events:auto">${esc(e.icon)} ${esc(e.label)}</button>`,
        )
        .join('');
      const quipHtml = includeQuips
        ? `<div class="bil-quips">` +
          PLAYER_QUIPS.map(
            (q) => `<button class="bil-btn bil-quip" data-act="quip" data-id="${esc(q.id)}" style="pointer-events:auto">${esc(q.label)}</button>`,
          ).join('') +
          `</div>`
        : '';
      emotes.innerHTML = emoteHtml + quipHtml;
      emoteCount = list.length + (includeQuips ? PLAYER_QUIPS.length : 0);
      toggleEmotes(emotesOpen);
    },
    setMessage(text: string): void {
      msg.textContent = text;
    },
    setBar(
      soundOn: boolean,
      inGame: boolean,
      camLabel: string | null = null,
      emoteButton = false,
      reaimButton = false,
      fineButton = false,
      fineOn = false,
      retryButton = false,
    ): void {
      bar.innerHTML =
        `<button class="bil-btn" data-act="sound" style="pointer-events:auto">${soundOn ? '🔊' : '🔇'}</button>` +
        (emoteButton ? `<button class="bil-btn" data-act="emotes" aria-label="Emotes and Table Talk" style="pointer-events:auto">😀</button>` : ``) +
        (fineButton
          ? `<button class="bil-btn${fineOn ? ' active' : ''}" data-act="fine" style="pointer-events:auto">🎯 Fine</button>`
          : ``) +
        (reaimButton ? `<button class="bil-btn" data-act="reaim" style="pointer-events:auto">↺ Re-aim</button>` : ``) +
        (retryButton ? `<button class="bil-btn" data-act="retry" style="pointer-events:auto">↺ Retry</button>` : ``) +
        (camLabel ? `<button class="bil-btn" data-act="camera" style="pointer-events:auto">${esc(camLabel)}</button>` : ``) +
        (inGame ? `<button class="bil-btn" data-act="menu" style="pointer-events:auto">☰ Menu</button>` : ``);
    },
    /** Updates the wager slider label, presets, and CPU play button in place without rebuilding the menu DOM. */
    updateWager(wager: number, chips: number, mult: number, cpuName: string): void {
      const slider = overlay.querySelector<HTMLInputElement>('#bil-wager-slider');
      const cap = maxWager(chips);
      if (slider) {
        slider.max = String(cap);
        slider.value = String(wager);
        slider.disabled = cap === 0;
      }
      const payout = wagerPayout(wager, mult);
      const txt = overlay.querySelector<HTMLElement>('#bil-wager-text');
      if (txt) txt.textContent = wager > 0 ? `Bet ${wager} → +${payout.profit}` : 'Friendly (0)';
      const cpuBtn = overlay.querySelector<HTMLElement>('[data-act="cpu"]');
      if (cpuBtn) cpuBtn.textContent = `Play vs ${cpuName}${wager > 0 ? ` (🪙 ${wager})` : ''}`;
      overlay.querySelectorAll<HTMLElement>('[data-act="wager-val"]').forEach((btn) => {
        const v = Number(btn.dataset.val);
        btn.classList.toggle('on', (v === 0 && wager === 0) || (v > 0 && v === wager));
      });
    },
    showMenu(v: MenuView): void {
      menuOpen = true;
      overOpen = false;
      const cpu = CPU_PROFILES[v.cpuTier];
      const cap = maxWager(v.chips);
      const payout = wagerPayout(v.wager, cpu.wagerMult);
      const p10 = wagerPreset(v.chips, 0.1);
      const p25 = wagerPreset(v.chips, 0.25);
      const p50 = wagerPreset(v.chips, 0.5);

      overlay.innerHTML =
        `<div class="bil-overlay" style="pointer-events:auto"><div class="bil-card">` +
        `<h1>Gnome Billiards</h1>` +
        `<p>${esc(GAME_MODE_META[v.gameMode].desc)}</p>` +
        `<div class="bil-sec"><div class="bil-sec-title"><span>Game Mode</span><span>${esc(GAME_MODE_META[v.gameMode].label)}</span></div>` +
        `<div class="bil-pills five">` +
        GAME_MODES.map(
          (gm) =>
            `<button class="bil-pill${v.gameMode === gm ? ' on' : ''}" data-act="gmode" data-mode="${gm}">${esc(GAME_MODE_META[gm].short)}</button>`,
        ).join('') +
        `</div></div>` +
        `<div class="bil-sec"><div class="bil-sec-title"><span>CPU Opponent</span><span>${esc(cpu.title)}</span></div>` +
        `<div class="bil-pills">` +
        CPU_TIERS.map((t) => {
          const p = CPU_PROFILES[t];
          return `<button class="bil-pill${t === 'cracked' ? ' cracked' : ''}${v.cpuTier === t ? ' on' : ''}" data-act="ctier" data-tier="${t}"><span>${esc(p.name)}</span><small>${esc(p.badge)}</small></button>`;
        }).join('') +
        `</div></div>` +
        `<div class="bil-sec"><div class="bil-sec-title"><span>Wager (up to 50%)</span><span>🪙 ${v.chips} chips${v.chips < 100 ? ' <button class="bil-btn" data-act="claim-chips" style="min-height:28px;padding:0 8px;font-size:11px;margin-left:4px">+100 Free</button>' : ''}</span></div>` +
        `<div class="bil-wager-row"><input id="bil-wager-slider" type="range" min="0" max="${cap}" value="${v.wager}" ${cap === 0 ? 'disabled' : ''} />` +
        `<span id="bil-wager-text" style="min-width:110px;text-align:right;font-size:12px;font-weight:700">${v.wager > 0 ? `Bet ${v.wager} → +${payout.profit}` : 'Friendly (0)'}</span></div>` +
        `<div class="bil-wager-presets">` +
        `<button class="bil-pill${v.wager === 0 ? ' on' : ''}" data-act="wager-val" data-val="0">Free</button>` +
        `<button class="bil-pill${v.wager > 0 && v.wager === p10 ? ' on' : ''}" data-act="wager-val" data-val="${p10}" ${cap === 0 ? 'disabled' : ''}>10%</button>` +
        `<button class="bil-pill${v.wager > 0 && v.wager === p25 ? ' on' : ''}" data-act="wager-val" data-val="${p25}" ${cap === 0 ? 'disabled' : ''}>25%</button>` +
        `<button class="bil-pill${v.wager > 0 && v.wager === p50 ? ' on' : ''}" data-act="wager-val" data-val="${p50}" ${cap === 0 ? 'disabled' : ''}>50%</button>` +
        `</div></div>` +
        `<div class="row" style="margin-top:12px">` +
        `<button class="bil-btn primary" data-act="cpu">Play vs ${esc(cpu.name)}${v.wager > 0 ? ` (🪙 ${v.wager})` : ''}</button>` +
        `<button class="bil-btn" data-act="challenges">🏆 Challenge Mode (${v.completedChallenges}/${v.totalChallenges})</button>` +
        `<button class="bil-btn" data-act="local">Pass and Play</button>` +
        `<button class="bil-btn" data-act="spectate">Spectate CPUs</button>` +
        (v.searching
          ? `<button class="bil-btn" data-act="cancel">Stop looking</button>`
          : `<button class="bil-btn" data-act="online">Online Match (8-Ball)</button>`) +
        `</div>` +
        `<div class="row inline" style="margin-top:10px"><input id="bil-room" maxlength="8" placeholder="Room code" autocomplete="off" />` +
        `<button class="bil-btn" data-act="room">Join</button></div>` +
        `<div class="bil-status">${esc(v.status)}</div>` +
        `</div></div>`;
    },
    showChallenges(completed: ReadonlySet<string>): void {
      menuOpen = true;
      overOpen = false;
      overlay.innerHTML =
        `<div class="bil-overlay" style="pointer-events:auto"><div class="bil-card">` +
        `<h1>🏆 Challenge Mode</h1>` +
        `<p>Clear trick shots and run-outs within par shots. First-time clears award Gnomecino chips!</p>` +
        `<div class="bil-chal-list">` +
        CHALLENGES.map((c) => {
          const done = completed.has(c.id);
          return (
            `<button class="bil-chal-item${done ? ' done' : ''}" data-act="start-chal" data-id="${esc(c.id)}">` +
            `<div><div class="ttl">${done ? '✅ ' : ''}${esc(c.title)}</div>` +
            `<div class="dsc">${esc(c.description)}</div></div>` +
            `<div style="text-align:right"><div class="tag">${esc(c.difficulty)}</div>` +
            `<div style="font-size:11px;margin-top:4px;color:#ffd54f">${c.parShots} shot${c.parShots > 1 ? 's' : ''} · +${c.chipReward}🪙</div></div>` +
            `</button>`
          );
        }).join('') +
        `</div>` +
        `<div class="row" style="margin-top:12px"><button class="bil-btn" data-act="menu">Back to Menu</button></div>` +
        `</div></div>`;
    },
    hideMenu(): void {
      if (!menuOpen) return;
      menuOpen = false;
      overlay.innerHTML = '';
    },
    showOver(text: string, canRematch: boolean, subtext?: string, nextLabel?: string, doubleLabel?: string): void {
      overOpen = true;
      overlay.innerHTML =
        `<div class="bil-overlay" style="pointer-events:auto"><div class="bil-card">` +
        `<h1>${esc(text)}</h1>` +
        (subtext ? `<p>${esc(subtext)}</p>` : '') +
        `<div class="row">` +
        (nextLabel ? `<button class="bil-btn primary" data-act="next-challenge">${esc(nextLabel)}</button>` : '') +
        (doubleLabel ? `<button class="bil-btn primary" data-act="double-wager">${esc(doubleLabel)}</button>` : '') +
        (canRematch ? `<button class="bil-btn${nextLabel || doubleLabel ? '' : ' primary'}" data-act="rematch">Rack 'em again</button>` : '') +
        `<button class="bil-btn" data-act="menu">Back to the menu</button>` +
        `</div></div></div>`;
    },
    hideOver(): void {
      if (!overOpen) return;
      overOpen = false;
      overlay.innerHTML = '';
    },
    get menuOpen(): boolean {
      return menuOpen;
    },
  };
}

export type Hud = ReturnType<typeof createHud>;
