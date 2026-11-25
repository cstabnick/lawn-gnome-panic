// E26: the "Race Club" Gnomlet app, the race-mode picker: every registered track with its best time, a solo time trial
// on any of them, and online races (host a lobby, join one, start it). Pure helpers (fmtTime, trackRows) run in node.
import { registerGnomletApp, type GnomletCtx } from '../gnomlet/registry';
import { isStreetTrack, TRACK_IDS, TRACKS, type TrackId } from '../raceTrack/tracks';
import type { VehicleKind } from '../types';
import type { RacingStore } from './save';
import type { RaceLobby, RaceNet, RaceSession } from './types';

export const RACE_APP_ID = 'race-club';

export interface RaceAppCtx {
  session: RaceSession;
  store: RacingStore;
  net(): RaceNet | null;
  /** The ground vehicle kind the player drives now, or null on foot / in a boat or aircraft. */
  drivingKind(): VehicleKind | null;
  toast(text: string): void;
}

/** m:ss.s for a time in seconds, or an em dash for none. */
export function fmtTime(s: number | null | undefined): string {
  if (s === null || s === undefined || !Number.isFinite(s) || s < 0) return '—';
  const tenths = Math.round(s * 10);
  const m = Math.floor(tenths / 600);
  const rest = tenths - m * 600;
  return `${m}:${String(Math.floor(rest / 10)).padStart(2, '0')}.${rest % 10}`;
}

export interface TrackRow {
  id: TrackId;
  name: string;
  street: boolean;
  closed: boolean;
  laps: number;
  best: number | null;
}

/** One row per registered track: street routes first, then the rest, each in registry order. */
export function trackRows(store: Pick<RacingStore, 'data'>): TrackRow[] {
  const best = store.data().best;
  const rows: TrackRow[] = TRACK_IDS.map((id) => {
    const t = TRACKS[id];
    return { id, name: t.name, street: isStreetTrack(id), closed: t.closed, laps: t.closed ? 2 : 1, best: best[id] ?? null };
  });
  return rows.sort((a, b) => Number(b.street) - Number(a.street));
}

const CARD_CSS = 'display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid currentColor;border-radius:8px;'
  + 'box-sizing:border-box;width:100%;';
const BUTTON_CSS = 'min-height:44px;padding:0 12px;font-size:15px;cursor:pointer;max-width:100%;';
const LINE_CSS = 'margin:0;overflow-wrap:anywhere;';
const BOX_CSS = 'display:flex;flex-direction:column;gap:10px;padding:12px;font-size:15px;color:inherit;width:100%;'
  + 'box-sizing:border-box;overflow-y:auto;';

function el(tag: keyof HTMLElementTagNameMap, text?: string, css?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (css) e.style.cssText = css;
  return e;
}

function button(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', label, BUTTON_CSS) as HTMLButtonElement;
  b.type = 'button';
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function line(text: string, parent: HTMLElement): void {
  parent.appendChild(el('p', text, LINE_CSS));
}

/** Register the Race Club Gnomlet app. */
export function registerRaceClubApp(ctx: RaceAppCtx): void {
  registerGnomletApp({
    id: RACE_APP_ID,
    label: 'Race Club',
    icon: '🏁',
    group: 'fun',
    order: 20,
    detail: () => `${Object.keys(ctx.store.data().best).length} best times`,
    badge: () => ctx.net()?.lobbies().length || null,
    open: (root: HTMLElement, tablet: GnomletCtx) => {
      const box = el('div', undefined, BOX_CSS);
      root.appendChild(box);
      const status = el('p', '', `${LINE_CSS}min-height:1.2em;`);
      let done = false;

      const vehicle = (): VehicleKind => ctx.drivingKind() ?? 'lowrider';
      const finish = (why: string | null): void => {
        if (why === null) {
          done = true;
          tablet.close();
        } else {
          status.textContent = why;
        }
      };

      // Racing now: only this, with a quit.
      const racing = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;');
      racing.appendChild(el('h3', 'Racing now', 'margin:0;font-size:18px;'));
      racing.appendChild(button('Quit race', () => ctx.session.stop('quit')));

      // Time trial.
      const trial = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;');
      trial.appendChild(el('h3', 'Time trial', 'margin:0;font-size:18px;'));
      line('The Club drives you to the grid.', trial);
      for (const row of trackRows(ctx.store)) {
        const card = el('div', undefined, CARD_CSS);
        const head = el('p', undefined, `${LINE_CSS}font-weight:bold;`);
        head.textContent = `${row.name} · ${row.street ? 'Street' : 'Track'}`;
        card.appendChild(head);
        line(`Best: ${fmtTime(row.best)}`, card);
        line(`Laps: ${row.laps}`, card);
        card.appendChild(button('Time trial', () => finish(ctx.session.start({
          kind: 'trial', trackId: row.id, vehicle: vehicle(), laps: row.laps,
        }))));
        trial.appendChild(card);
      }

      // Online race: the track picker persists across redraws so a choice is not lost.
      const online = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;');
      const picker = el('select', undefined, 'min-height:44px;font-size:15px;max-width:100%;') as HTMLSelectElement;
      for (const row of trackRows(ctx.store)) {
        const opt = el('option', row.name) as HTMLOptionElement;
        opt.value = row.id;
        picker.appendChild(opt);
      }
      const paintOnline = (): void => {
        online.replaceChildren();
        online.appendChild(el('h3', 'Online race', 'margin:0;font-size:18px;'));
        const net = ctx.net();
        if (!net || !net.online()) {
          line('Online races need another player in your room.', online);
          return;
        }
        const mine = net.mine();
        if (!mine) {
          const card = el('div', undefined, CARD_CSS);
          card.appendChild(el('p', 'Track', LINE_CSS));
          card.appendChild(picker);
          card.appendChild(button('Host a race', () => {
            const id = picker.value as TrackId;
            const laps = TRACKS[id].closed ? 2 : 1;
            net.host(id, laps, vehicle());
            ctx.toast('Lobby opened.');
          }));
          online.appendChild(card);
          const open = net.lobbies();
          if (open.length === 0) line('No open lobbies yet.', online);
          for (const l of open) online.appendChild(lobbyCard(l));
          return;
        }
        const lobby = el('div', undefined, CARD_CSS);
        lobby.appendChild(el('p', `${TRACKS[mine.trackId].name}, ${mine.laps} lap${mine.laps === 1 ? '' : 's'}`,
          `${LINE_CSS}font-weight:bold;`));
        lobby.appendChild(el('p', `In the lobby (${mine.members.length}):`, LINE_CSS));
        for (const m of mine.members) {
          const tag = m.id === mine.hostId ? ' (host)' : '';
          lobby.appendChild(el('p', `${m.name}${tag}`, LINE_CSS));
        }
        const isHost = mine.hostId === net.myId();
        if (isHost) {
          const enough = mine.members.length >= 2;
          lobby.appendChild(button(enough ? 'Start' : 'Start (needs 2 or more)', () => {
            net.go();
            finish(ctx.session.start({ kind: 'online', trackId: mine.trackId, vehicle: vehicle(), laps: mine.laps }));
          }, !enough));
        }
        lobby.appendChild(button('Leave', () => net.leave()));
        online.appendChild(lobby);
      };
      const lobbyCard = (l: RaceLobby): HTMLElement => {
        const card = el('div', undefined, CARD_CSS);
        card.appendChild(el('p', `${l.hostName}'s race`, `${LINE_CSS}font-weight:bold;`));
        line(`${TRACKS[l.trackId].name} · ${l.members.length} in the lobby`, card);
        card.appendChild(button('Join', () => ctx.net()?.join(l.hostId)));
        return card;
      };

      const footer = el('p', 'Pickup races and wagers: see the bookies at the street-race meets (map: chequered flags).',
        `${LINE_CSS}font-size:13px;opacity:0.8;`);

      box.append(racing, trial, online, footer, status);

      let wasActive = false;
      let wasStarted = false;
      const sync = (): void => {
        if (done) return;
        const active = ctx.session.active() !== null;
        racing.style.display = active ? '' : 'none';
        trial.style.display = active ? 'none' : '';
        online.style.display = active ? 'none' : '';
        footer.style.display = active ? 'none' : '';
        if (active !== wasActive) {
          wasActive = active;
          status.textContent = '';
        }
        if (active) return;
        // Joiners: when the host says go while this app is open, the race starts here.
        const net = ctx.net();
        const started = net?.started() ?? false;
        const mine = net?.mine() ?? null;
        if (started && !wasStarted && mine) {
          wasStarted = started;
          finish(ctx.session.start({ kind: 'online', trackId: mine.trackId, vehicle: vehicle(), laps: mine.laps }));
          return;
        }
        wasStarted = started;
        paintOnline();
      };
      sync();
      const timer = setInterval(sync, 500);

      return () => {
        clearInterval(timer);
        box.remove();
      };
    },
  });
}
