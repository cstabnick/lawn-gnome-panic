// Blackjack Sprint: 4 gnomes play 3 simultaneous hands against the dealer. Most chips wins.
// Reuses gnome-blackjack's own rules (cards.ts, table.ts) and 3D table (scene.ts).
import * as THREE from 'three';
import type { MinigameDef, MinigameView, PadState, SeatIndex, SeatInfo, ViewCtx } from '@lawn/party';
import { soleWinner } from '@lawn/party';
import { activeHand, canDouble as seatCanDouble, handTotal, isBlackjack, roundDelta, seatDone } from '../cards';
import { CPU_ORDER } from '../characters';
import { START_CHIPS, type Action, type Card, type Seat, type TableState } from '../config';
import { createTableView } from '../scene';
import { applySimultaneousAction, cpuDecision, dealSimultaneousHand, newTable, tickSimultaneous } from '../table';

const TOTAL_HANDS = 3;
const ANTE = 20;
const DEAL_S = 1.0;
const PLAY_S = 10;
const DEALER_GAP_S = 0.55;
const PAYOUT_S = 2.0;

interface S {
  table: TableState;
  handNum: number;
  totalHands: number;
  lastActs: number[];
  cpuNextAt: number[];
  done: boolean;
}

interface I {
  act: Action;
  seq: number;
}

/** Keeps the 208-card shoe off S so snapshots stay well under the 2 KB party limit. */
const shoes = new WeakMap<TableState, Card[]>();

function withShoe<T>(st: TableState, fn: () => T): T {
  st.shoe = shoes.get(st) ?? [];
  try {
    return fn();
  } finally {
    shoes.set(st, st.shoe);
    st.shoe = [];
  }
}

function seatChips(s: Seat | null): number {
  if (!s) return 0;
  // If time expires mid-hand before payout, count un-settled chips still on the felt.
  const pending = s.hands.reduce((n, h) => n + (h.result === null ? h.bet : 0), 0);
  return s.chips + pending;
}

function placeByScore(scores: readonly number[]): number[] {
  return scores.map((sc) => scores.filter((other) => other > sc).length);
}

function makePartySeats(seats: readonly SeatInfo[]): (Seat | null)[] {
  return seats.map((info, k) => ({
    id: info.cpu ? -(k + 1) : k + 1,
    name: info.name,
    cpu: info.cpu,
    character: CPU_ORDER[k % CPU_ORDER.length],
    color: info.color,
    chips: START_CHIPS,
    bet: 0,
    ready: false,
    hands: [],
    active: 0,
    voice: 100,
  }));
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'bj-sprint',
    title: 'Blackjack Sprint',
    game: 'gnome-blackjack',
    goal: 'Play 3 simultaneous hands against the dealer and finish with the most chips.',
    controls: 'Hit (W/↑), Stand (S/↓), or Double (D/→) — or tap the buttons.',
    maxSeconds: 60,
  },

  init(seats, rng) {
    const table = newTable((rng() * 0xffffffff) >>> 0);
    table.seats = makePartySeats(seats);
    withShoe(table, () => dealSimultaneousHand(table, ANTE));
    return {
      table,
      handNum: 1,
      totalHands: TOTAL_HANDS,
      lastActs: seats.map(() => 0),
      cpuNextAt: seats.map((_, k) => DEAL_S + 0.5 + k * 0.2),
      done: false,
    };
  },

  step(s, inputs, dt, rng) {
    if (s.done) return;
    withShoe(s.table, () => {
      const prevPhase = s.table.phase;

      for (let k = 0; k < s.table.seats.length; k++) {
        const inp = inputs[k];
        if (!inp || inp.seq <= s.lastActs[k]) continue;
        s.lastActs[k] = inp.seq;
        if (s.table.phase === 'playing') {
          applySimultaneousAction(s.table, k, inp.act);
          if (!seatDone(s.table.seats[k])) {
            s.cpuNextAt[k] = s.table.t + 0.65 + rng() * 0.55;
          }
        }
      }

      tickSimultaneous(s.table, dt, { dealS: DEAL_S, playS: PLAY_S, dealerGapS: DEALER_GAP_S });

      if (prevPhase !== 'playing' && s.table.phase === 'playing') {
        for (let k = 0; k < s.table.seats.length; k++) {
          s.cpuNextAt[k] = s.table.t + 0.45 + rng() * 0.7;
        }
      }

      if (s.table.phase === 'payout' && s.table.phaseT >= PAYOUT_S) {
        if (s.handNum >= s.totalHands) {
          s.done = true;
        } else {
          s.handNum++;
          dealSimultaneousHand(s.table, ANTE);
        }
      }
    });
  },

  cpu(s, seat: SeatIndex) {
    if (s.table.phase !== 'playing' || seatDone(s.table.seats[seat]) || s.table.t < s.cpuNextAt[seat]) {
      return { act: 'stand', seq: s.lastActs[seat] };
    }
    return { act: cpuDecision(s.table, seat), seq: s.lastActs[seat] + 1 };
  },

  result(s, timeUp) {
    if (!timeUp && !s.done) return null;
    return placeByScore(s.table.seats.map(seatChips));
  },

  report(s, places, seats) {
    const scores = s.table.seats.map(seatChips);
    const w = soleWinner(places);
    const headline = w === null ? undefined : `${seats[w].name} won with ${scores[w]} chips!`;
    return {
      headline,
      stats: [
        { key: 'chips', label: 'Chips', format: 'int', better: 'higher' },
        { key: 'net', label: 'Net', format: 'int', better: 'higher' },
      ],
      values: scores.map((chips) => ({ chips, net: chips - START_CHIPS })),
      notes: scores.map((chips) => {
        if (chips <= 0) return 'Busted out';
        const diff = chips - START_CHIPS;
        if (diff > 0) return `+${diff} chips`;
        if (diff === 0) return 'Broke even';
        return `${diff} chips`;
      }),
    };
  },

  createView(ctx: ViewCtx): MinigameView<S, I> {
    const { scene, camera, ui, seats, mySeat } = ctx;
    const view = createTableView(scene, { seatCount: seats.length, looks: seats.map((s) => s.look) });
    camera.position.set(0, 3.05, 3.35);
    camera.lookAt(0, 0.42, -0.75);

    const hud = document.createElement('div');
    hud.style.cssText =
      'position:absolute;inset:0;pointer-events:none;font:600 14px system-ui,sans-serif;color:#f5ebd8;' +
      'text-shadow:0 2px 4px rgba(0,0,0,0.85);display:flex;flex-direction:column;justify-content:space-between;padding:12px;';
    ui.appendChild(hud);

    const topBar = document.createElement('div');
    topBar.style.cssText =
      'align-self:center;background:rgba(18,12,8,0.82);border:1px solid #5b4530;border-radius:12px;' +
      'padding:8px 16px;font-size:15px;letter-spacing:0.2px;';
    hud.appendChild(topBar);

    const seatsRow = document.createElement('div');
    seatsRow.style.cssText =
      'display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:auto;margin-bottom:8px;';
    hud.appendChild(seatsRow);

    const cards = seats.map((info) => {
      const el = document.createElement('div');
      el.style.cssText =
        'background:rgba(18,12,8,0.84);border:2px solid #5b4530;border-radius:10px;padding:6px 10px;' +
        'min-width:118px;text-align:center;';
      const hex = `#${info.color.toString(16).padStart(6, '0')}`;
      el.innerHTML =
        `<div style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700">` +
        `<span style="width:10px;height:10px;border-radius:50%;background:${hex};display:inline-block"></span>` +
        `<span>${info.name}</span></div>` +
        `<div class="bj-chips" style="color:#ffd466;font-size:13px;margin-top:2px"></div>` +
        `<div class="bj-hand" style="font-size:13px;margin-top:2px"></div>`;
      seatsRow.appendChild(el);
      return {
        el,
        chips: el.querySelector('.bj-chips') as HTMLElement,
        hand: el.querySelector('.bj-hand') as HTMLElement,
      };
    });

    let seq = 0;
    let pendingAct: Action = 'stand';
    let lastAck = 0;
    let hitBtn: HTMLButtonElement | null = null;
    let standBtn: HTMLButtonElement | null = null;
    let doubleBtn: HTMLButtonElement | null = null;
    let prevPadDir = '';
    let keyHit = false;

    const trigger = (act: Action) => {
      if (mySeat === null || seq > lastAck) return;
      pendingAct = act;
      seq++;
    };

    if (mySeat !== null) {
      const btnBar = document.createElement('div');
      btnBar.style.cssText = 'display:flex;justify-content:center;gap:10px;pointer-events:auto;padding-bottom:6px;';
      const mkBtn = (label: string, bg: string, act: Action): HTMLButtonElement => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText =
          `min-width:96px;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);` +
          `background:${bg};color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.4);`;
        b.addEventListener('click', () => trigger(act));
        btnBar.appendChild(b);
        return b;
      };
      hitBtn = mkBtn('Hit (W)', '#1f7a44', 'hit');
      standBtn = mkBtn('Stand (S)', '#8a5a18', 'stand');
      doubleBtn = mkBtn('Double (D)', '#2c5b9e', 'double');
      hud.appendChild(btnBar);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyH') keyHit = true;
    };
    window.addEventListener('keydown', onKeyDown);

    return {
      render(s, dt) {
        view.sync(s.table, dt);
        if (mySeat !== null) lastAck = s.lastActs[mySeat] ?? 0;

        const dtDealer = s.table.holeHidden ? '?' : String(handTotal(s.table.dealer).total);
        const phaseText =
          s.table.phase === 'dealing' ? 'Dealing…'
          : s.table.phase === 'playing' ? `Your move · ${Math.ceil(s.table.timer)}s`
          : s.table.phase === 'dealer' ? 'Dealer’s turn…'
          : 'Hand settled';
        topBar.textContent = `Hand ${s.handNum}/${s.totalHands} · Dealer: ${dtDealer} · ${phaseText}`;

        s.table.seats.forEach((seat, k) => {
          const card = cards[k];
          if (!card || !seat) return;
          card.chips.textContent = `${seat.chips} chips`;
          const h = activeHand(seat);
          if (!h) {
            card.hand.textContent = 'Sitting out';
            card.el.style.borderColor = '#5b4530';
            return;
          }
          const tot = handTotal(h.cards);
          if (seat.hands.length > 1 && seat.hands.every((x) => x.result)) {
            const d = roundDelta(seat);
            card.hand.textContent = `Split ${seat.hands.length} hands (${d > 0 ? `+${d}` : d})`;
            card.el.style.borderColor = d > 0 ? '#4cd964' : d < 0 ? '#ff453a' : '#d4a84b';
          } else if (h.result) {
            const sign = h.delta > 0 ? `+${h.delta}` : String(h.delta);
            const label =
              h.result === 'blackjack' ? `Blackjack! (${sign})`
              : h.result === 'win' ? `Win (${sign})`
              : h.result === 'push' ? 'Push (0)'
              : h.result === 'bust' ? `Bust (${sign})`
              : `Lose (${sign})`;
            card.hand.textContent = `${tot.total} · ${label}`;
            card.el.style.borderColor = h.delta > 0 ? '#4cd964' : h.delta < 0 ? '#ff453a' : '#d4a84b';
          } else if (!h.split && isBlackjack(h.cards)) {
            card.hand.textContent = 'Blackjack!';
            card.el.style.borderColor = '#ffd466';
          } else if (tot.total > 21) {
            card.hand.textContent = `${tot.total} · Bust`;
            card.el.style.borderColor = '#ff453a';
          } else {
            card.hand.textContent = `${tot.soft ? 'Soft ' : ''}${tot.total}${h.done ? ' · Stood' : ''}`;
            card.el.style.borderColor = k === mySeat ? '#ffffff' : '#5b4530';
          }
        });

        if (mySeat !== null && hitBtn && standBtn && doubleBtn) {
          const mySeatState = s.table.seats[mySeat];
          const canAct = s.table.phase === 'playing' && !seatDone(mySeatState) && seq <= lastAck;
          const canDouble = canAct && seatCanDouble(mySeatState);
          hitBtn.disabled = !canAct;
          standBtn.disabled = !canAct;
          doubleBtn.disabled = !canDouble;
          hitBtn.style.opacity = canAct ? '1' : '0.45';
          standBtn.style.opacity = canAct ? '1' : '0.45';
          doubleBtn.style.opacity = canDouble ? '1' : '0.45';
        }
      },

      input(pad: Readonly<PadState>, s: Readonly<S>): I {
        if (mySeat !== null) {
          lastAck = s.lastActs[mySeat] ?? 0;
          const mySeatState = s.table.seats[mySeat];
          const canAct = s.table.phase === 'playing' && !seatDone(mySeatState);

          let dir = '';
          if (keyHit) dir = 'hit';
          else if (pad.y > 0.5) dir = 'hit';
          else if (pad.y < -0.5) dir = 'stand';
          else if (pad.x > 0.5) dir = 'double';
          keyHit = false;

          if (canAct && dir && dir !== prevPadDir) {
            if (dir !== 'double' || seatCanDouble(mySeatState)) {
              trigger(dir as Action);
            }
          }
          prevPadDir = dir;
        }
        return { act: pendingAct, seq };
      },

      dispose() {
        window.removeEventListener('keydown', onKeyDown);
      },
    };
  },
};

export default def;
