// The DOM interface over the table: the player seats, the message line, the menu, and the game-over card.
// Everything lives in the shared #ui element; this module appends its own container and never restyles #ui.
import type { GnomeLook } from '@lawn/gnome';

export interface SeatView {
  name: string;
  look: GnomeLook;
  sub: string;
  active: boolean;
}

export interface MenuView {
  status: string;
  searching: boolean;
}

export interface HudHandlers {
  onCpu(): void;
  onLocal(): void;
  onOnline(): void;
  onRoom(code: string): void;
  onCancelSearch(): void;
  onMenu(): void;
  onRematch(): void;
  onSound(): void;
}

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const hex = (n: number): string => '#' + (n & 0xffffff).toString(16).padStart(6, '0');

/** A small gnome face (hat, brim, skin, beard) in CSS, from a gnome look. */
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

export function createHud(ui: HTMLElement, h: HudHandlers) {
  const root = document.createElement('div');
  root.id = 'bil-root';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  ui.appendChild(root);

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'cpu') h.onCpu();
    else if (act === 'local') h.onLocal();
    else if (act === 'online') h.onOnline();
    else if (act === 'room') {
      const input = root.querySelector<HTMLInputElement>('#bil-room');
      h.onRoom((input?.value ?? '').trim().toUpperCase());
    } else if (act === 'cancel') h.onCancelSearch();
    else if (act === 'menu') h.onMenu();
    else if (act === 'rematch') h.onRematch();
    else if (act === 'sound') h.onSound();
  });

  const top = document.createElement('div');
  top.className = 'bil-top';
  const power = document.createElement('div');
  power.className = 'bil-power';
  power.innerHTML = '<i></i>';
  const msg = document.createElement('div');
  msg.className = 'bil-msg';
  const bar = document.createElement('div');
  bar.className = 'bil-bar';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  root.append(top, power, msg, bar, overlay);

  let menuOpen = false;
  let overOpen = false;

  return {
    /** Seats along the top: each one a gnome face, a name, and a line (group, balls left). */
    setSeats(seats: SeatView[]): void {
      top.innerHTML = seats
        .map(
          (s) =>
            `<div class="bil-seat${s.active ? ' active' : ''}">${gnomeFaceHtml(s.look)}` +
            `<div style="min-width:0"><div class="nm">${esc(s.name)}</div><div class="sub">${esc(s.sub)}</div></div></div>`,
        )
        .join('');
    },
    /** The pull while striking (0..1), or null to hide the meter. */
    setPower(p: number | null): void {
      if (p === null) {
        power.style.display = 'none';
        return;
      }
      power.style.display = 'block';
      (power.firstElementChild as HTMLElement).style.width = `${Math.round(p * 100)}%`;
    },
    setMessage(text: string): void {
      msg.textContent = text;
    },
    setBar(soundOn: boolean, inGame: boolean): void {
      bar.innerHTML =
        `<button class="bil-btn" data-act="sound" style="pointer-events:auto">${soundOn ? '🔊' : '🔇'}</button>` +
        (inGame ? `<button class="bil-btn" data-act="menu" style="pointer-events:auto">☰ Menu</button>` : `<span></span>`);
    },
    showMenu(v: MenuView): void {
      menuOpen = true;
      overlay.innerHTML =
        `<div class="bil-overlay" style="pointer-events:auto"><div class="bil-card">` +
        `<h1>Gnome Billiards</h1>` +
        `<p>Eight-ball on the Gnomecino pool table. Drag back from the cue ball to shoot; the harder you pull, the harder it hits.</p>` +
        `<div class="row">` +
        `<button class="bil-btn primary" data-act="cpu">Play Big Lou (CPU)</button>` +
        `<button class="bil-btn" data-act="local">Pass and play (two on one device)</button>` +
        (v.searching
          ? `<button class="bil-btn" data-act="cancel">Stop looking</button>`
          : `<button class="bil-btn" data-act="online">Find an online opponent</button>`) +
        `</div>` +
        `<div class="row inline" style="margin-top:12px"><input id="bil-room" maxlength="8" placeholder="Room code" autocomplete="off" />` +
        `<button class="bil-btn" data-act="room">Join</button></div>` +
        `<div class="bil-status">${esc(v.status)}</div>` +
        `</div></div>`;
    },
    hideMenu(): void {
      if (!menuOpen) return;
      menuOpen = false;
      overlay.innerHTML = '';
    },
    showOver(text: string, canRematch: boolean): void {
      overOpen = true;
      overlay.innerHTML =
        `<div class="bil-overlay" style="pointer-events:auto"><div class="bil-card">` +
        `<h1>${esc(text)}</h1>` +
        `<div class="row">` +
        (canRematch ? `<button class="bil-btn primary" data-act="rematch">Rack 'em again</button>` : '') +
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
