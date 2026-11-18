// The blackjack table: pure rules over TableState (config.ts). Only the host runs these. No DOM, no Math.random.
import {
  BET_S, BUBBLE_S, CPU_THINK_MAX_S, CPU_THINK_MIN_S, DEAL_S, DEALER_DOWN_MAX_S, DEALER_DOWN_MIN_S, DEALER_GAP_S,
  IDLE_MAX_S, IDLE_MIN_S, LOOK_PITCH_MAX, LOOK_YAW_MAX, MAX_BET, MIN_BET, PAYOUT_S, RESHUFFLE_AT, SEAT_COUNT, START_CHIPS, TIME_LOW_S, TURN_S,
  VOICE_MAX_HZ, VOICE_MIN_HZ,
  type Action, type Card, type Hand, type HandResult, type Seat, type TableEvent, type TableInput, type TableState,
} from './config';
import { CHARACTERS, CPU_ORDER } from './characters';
import { activeHand, canDouble, canSplit, handTotal, isBlackjack, newShoe, rand, seatDone, stakedChips } from './cards';

/** Tables made by newTable that have not yet run their first 'betting' entry (no events could be returned then). */
const needsEntry = new WeakSet<TableState>();

export function newTable(seed: number): TableState {
  const st: TableState = {
    t: 0, phase: 'betting', phaseT: 0, turn: -1, timer: BET_S,
    seats: Array.from({ length: SEAT_COUNT }, () => null),
    dealer: [], holeHidden: true, shoe: [], seed: seed >>> 0, musicSeed: (seed ^ 0x9e3779b9) >>> 0,
    round: 1, bubbles: [], nextBubbleId: 1, idleIn: IDLE_MIN_S, cpuIn: 0, lowSent: false, dealerShot: null,
  };
  st.cpuIn = thinkTime(st);
  needsEntry.add(st);
  return st;
}

// ---------------------------------------------------------------- helpers

function thinkTime(st: TableState): number {
  return CPU_THINK_MIN_S + rand(st) * (CPU_THINK_MAX_S - CPU_THINK_MIN_S);
}

function idleTime(st: TableState): number {
  return IDLE_MIN_S + rand(st) * (IDLE_MAX_S - IDLE_MIN_S);
}

/** Blackjack value of one card for the CPU's up-card check: ace 11, faces 10. */
function cardValue(c: Card | undefined): number {
  if (!c) return 10;
  if (c.r === 1) return 11;
  return c.r >= 10 ? 10 : c.r;
}

/** Takes the top card; refills the shoe first when it runs low (or is empty after a host change). */
function draw(st: TableState): Card {
  if (st.shoe.length < RESHUFFLE_AT) st.shoe = newShoe(st);
  return st.shoe.pop() as Card;
}

function cpuSeat(charId: string): Seat {
  const c = CHARACTERS[charId];
  return {
    id: -(1 + CPU_ORDER.indexOf(charId)), name: c.name, cpu: true, character: charId, color: c.color,
    chips: START_CHIPS, bet: 0, ready: false, hands: [], active: 0, voice: c.voice,
  };
}

function setPhase(st: TableState, phase: TableState['phase']): void {
  st.phase = phase;
  st.phaseT = 0;
}

/** A bet clamped to MIN_BET..min(MAX_BET, chips), rounded to an integer. */
function clampBet(st: TableState, seat: Seat, amount: number): number {
  const n = Math.round(Number.isFinite(amount) ? amount : MIN_BET);
  const hi = Math.min(MAX_BET, seat.chips);
  return Math.min(hi, Math.max(MIN_BET, n));
}

// ---------------------------------------------------------------- seats

export function fillCpus(st: TableState): TableEvent[] {
  const ev: TableEvent[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    if (st.seats[i]) continue;
    const seated = new Set<string>();
    for (const s of st.seats) if (s && s.cpu) seated.add(s.character);
    const charId = CPU_ORDER.find((c) => !seated.has(c));
    if (!charId) break;
    st.seats[i] = cpuSeat(charId);
    ev.push({ e: 'join', seat: i });
  }
  return ev;
}

export function seatHuman(st: TableState, id: number, name: string, character: string, color: number, chips = START_CHIPS, userId?: string): { seat: number; events: TableEvent[] } {
  const existing = st.seats.findIndex((s) => s !== null && s.id === id);
  if (existing >= 0) {
    (st.seats[existing] as Seat).name = name;
    return { seat: existing, events: [] };
  }
  const events: TableEvent[] = [];
  let seat = st.seats.findIndex((s) => s === null);
  if (seat < 0) {
    // Replace the highest-index CPU, if any.
    for (let i = SEAT_COUNT - 1; i >= 0; i--) {
      if (st.seats[i]?.cpu) { seat = i; break; }
    }
    if (seat < 0) return { seat: -1, events: [] };
  }
  const wasTurn = st.phase === 'playing' && st.turn === seat;
  if (st.seats[seat]) events.push({ e: 'leave', seat });
  st.seats[seat] = {
    id, name, cpu: false, character, ...(userId ? { userId } : {}), color, chips, bet: 0, ready: false, hands: [], active: 0,
    voice: VOICE_MIN_HZ + ((Math.abs(id) * 37) % (VOICE_MAX_HZ - VOICE_MIN_HZ)),
  };
  events.push({ e: 'join', seat });
  if (wasTurn) {
    st.turn = -1;
    advanceTurn(st, events);
  }
  return { seat, events };
}

export function removeHuman(st: TableState, id: number): TableEvent[] {
  const seat = st.seats.findIndex((s) => s !== null && !s.cpu && s.id === id);
  if (seat < 0) return [];
  const events: TableEvent[] = [{ e: 'leave', seat }];
  const wasTurn = st.phase === 'playing' && st.turn === seat;
  st.seats[seat] = null;
  if (wasTurn) {
    st.turn = -1;
    advanceTurn(st, events);
  }
  events.push(...fillCpus(st));
  return events;
}

export function mySeatIndex(st: TableState, id: number): number { return st.seats.findIndex((s) => s !== null && s.id === id); }

// ---------------------------------------------------------------- input

export function applyInput(st: TableState, seat: number, input: TableInput): TableEvent[] {
  const s = st.seats[seat];
  if (!s || s.cpu) return [];
  if (input.k === 'bet') {
    if (st.phase === 'betting' && !s.ready) s.bet = clampBet(st, s, input.amount);
    return [];
  }
  if (input.k === 'ready') {
    if (st.phase !== 'betting' || s.ready) return [];
    if (s.bet === 0) s.bet = clampBet(st, s, MIN_BET);
    s.ready = true;
    return [];
  }
  if (input.k === 'act') {
    if (st.phase !== 'playing' || st.turn !== seat) return [];
    const ev: TableEvent[] = [];
    act(st, seat, input.a, ev);
    return ev;
  }
  if (input.k === 'look') {
    const clamp = (v: number, m: number) => (Number.isFinite(v) ? Math.max(-m, Math.min(m, v)) : 0);
    const yaw = clamp(input.yaw, LOOK_YAW_MAX);
    const pitch = clamp(input.pitch, LOOK_PITCH_MAX);
    s.look = yaw === 0 && pitch === 0 ? null : [Math.round(yaw * 100) / 100, Math.round(pitch * 100) / 100];
    return [];
  }
  if (input.k === 'shoot') {
    if (st.dealerShot) return [];
    const downS = DEALER_DOWN_MIN_S + rand(st) * (DEALER_DOWN_MAX_S - DEALER_DOWN_MIN_S);
    st.dealerShot = { by: seat, at: st.t, until: st.t + downS, rose: false };
    return [{ e: 'dealerShot', seat }];
  }
  return [];
}

// ---------------------------------------------------------------- bubbles, snapshot

export function addBubble(st: TableState, seat: number, text: string): void {
  const t = text.trim().slice(0, 80);
  if (!t) return;
  st.bubbles = st.bubbles.filter((b) => b.seat !== seat);
  st.bubbles.push({ id: st.nextBubbleId++, seat, text: t, at: st.t });
  st.idleIn = idleTime(st);
}

export function snapshot(st: TableState): TableState {
  const copy = JSON.parse(JSON.stringify(st)) as TableState;
  copy.shoe = [];
  return copy;
}

// ---------------------------------------------------------------- CPU play

export function cpuDecision(st: TableState, seat: number): Action {
  const s = st.seats[seat];
  const cpu = s ? CHARACTERS[s.character] : undefined;
  const hand = activeHand(s);
  if (!s || !hand || hand.done) return 'stand';
  const style = cpu?.style ?? 'normal';
  const t = handTotal(hand.cards).total;
  const up = cardValue(st.dealer[0]);
  const dbl = canDouble(s);
  const upLow = up >= 2 && up <= 6;
  // Pairs: everyone splits aces and eights; the reckless split anything but fives and tens;
  // the normal split 2s, 3s, 6s, 7s and 9s against a low dealer card.
  if (canSplit(s)) {
    const r = Math.min(10, hand.cards[0].r);
    if (r === 1 || r === 8) return 'split';
    if (style === 'reckless' && r !== 5 && r !== 10) return 'split';
    if (style === 'normal' && [2, 3, 6, 7, 9].includes(r) && upLow) return 'split';
  }

  if (style === 'reckless') {
    if (dbl && t >= 9 && t <= 11) return 'double';
    if (t < 18) return 'hit';
    return 'stand';
  }
  if (style === 'normal') {
    if (dbl && (t === 10 || t === 11) && up < 10) return 'double';
    const soft = handTotal(hand.cards).soft;
    if (soft && t <= 17) return 'hit';
    if (t < 12) return 'hit';
    if (upLow) return t >= 13 ? 'stand' : 'hit';
    return t >= 17 ? 'stand' : 'hit';
  }
  // cautious: never doubles
  if (upLow) return t >= 12 ? 'stand' : 'hit';
  return t >= 15 ? 'stand' : 'hit';
}

// ---------------------------------------------------------------- actions

/** A fresh, unplayed hand. */
function newHand(bet: number, split = false): Hand {
  return { cards: [], bet, done: false, doubled: false, split, result: null, delta: 0 };
}

/** Runs one action for the seat's active hand. Returns false when it is not allowed (nothing changes). */
function act(st: TableState, seat: number, a: string, ev: TableEvent[], simultaneous = false): boolean {
  const s = st.seats[seat];
  const h = activeHand(s);
  if (!s || !h || h.done) return false;

  if (a === 'hit') {
    h.cards.push(draw(st));
    const total = handTotal(h.cards).total;
    ev.push({ e: 'hit', seat, total });
    if (total > 21) {
      h.done = true;
      ev.push({ e: 'bust', seat, total });
    } else if (total === 21) {
      h.done = true;
      ev.push({ e: 'stand', seat, total });
    }
  } else if (a === 'stand') {
    h.done = true;
    ev.push({ e: 'stand', seat, total: handTotal(h.cards).total });
  } else if (a === 'double') {
    if (!canDouble(s)) return false;
    s.chips -= h.bet;
    h.bet *= 2;
    h.doubled = true;
    h.cards.push(draw(st));
    h.done = true;
    const total = handTotal(h.cards).total;
    ev.push({ e: 'double', seat });
    if (total > 21) ev.push({ e: 'bust', seat, total });
  } else if (a === 'split') {
    if (!canSplit(s)) return false;
    s.chips -= h.bet;
    const second = newHand(h.bet, true);
    second.cards.push(h.cards.pop() as Card);
    h.split = true;
    s.hands.splice(s.active + 1, 0, second);
    h.cards.push(draw(st));
    second.cards.push(draw(st));
    ev.push({ e: 'split', seat });
    // Split aces get one card each; any hand that lands on 21 stands by itself.
    const aces = h.cards[0].r === 1;
    for (const x of [h, second]) if (aces || handTotal(x.cards).total === 21) x.done = true;
  } else {
    return false;
  }
  s.bet = stakedChips(s);
  nextHand(st, seat, ev, simultaneous);
  return true;
}

/** After an action: stay on the active hand if it is still open, else move to the seat's next open hand, else the next seat. */
function nextHand(st: TableState, seat: number, ev: TableEvent[], simultaneous: boolean): void {
  const s = st.seats[seat] as Seat;
  if (seatDone(s)) {
    if (simultaneous) advanceSimultaneous(st, ev);
    else advanceTurn(st, ev);
    return;
  }
  if (s.hands[s.active].done) s.active = s.hands.findIndex((x) => !x.done);
  if (!simultaneous) {
    st.timer = TURN_S;
    st.lowSent = false;
    st.cpuIn = thinkTime(st);
  }
}

/** In simultaneous mode, the dealer plays as soon as every active hand is done. */
function advanceSimultaneous(st: TableState, ev: TableEvent[]): void {
  if (st.seats.every(seatDone)) enterDealer(st, ev);
}

/** Makes the next undone hand's seat the turn; with none left, the dealer plays. */
function advanceTurn(st: TableState, ev: TableEvent[]): void {
  const next = st.seats.findIndex((s) => !seatDone(s));
  if (next < 0) {
    enterDealer(st, ev);
    return;
  }
  setPhase(st, 'playing');
  st.turn = next;
  const ns = st.seats[next] as Seat;
  ns.active = ns.hands.findIndex((h) => !h.done);
  st.timer = TURN_S;
  st.lowSent = false;
  st.cpuIn = thinkTime(st);
  ev.push({ e: 'turn', seat: next });
}

// ---------------------------------------------------------------- phases

function enterBetting(st: TableState, ev: TableEvent[]): void {
  setPhase(st, 'betting');
  for (const s of st.seats) {
    if (!s) continue;
    s.bet = 0;
    s.ready = false;
    s.hands = [];
    s.active = 0;
  }
  st.dealer = [];
  st.holeHidden = true;
  st.turn = -1;
  st.timer = BET_S;
  st.cpuIn = thinkTime(st);
  ev.push({ e: 'roundStart' });
  for (let i = 0; i < st.seats.length; i++) {
    const s = st.seats[i];
    if (s && s.chips < MIN_BET) {
      s.chips = START_CHIPS;
      ev.push({ e: 'broke', seat: i });
    }
  }
}

function enterDealing(st: TableState, ev: TableEvent[]): void {
  setPhase(st, 'dealing');
  let any = false;
  for (const s of st.seats) {
    if (!s || s.bet <= 0) continue;
    any = true;
    s.chips -= s.bet;
    s.hands = [newHand(s.bet)];
    s.active = 0;
  }
  if (!any) {
    enterPayout(st, ev);
    return;
  }
  for (let pass = 0; pass < 2; pass++) {
    for (const s of st.seats) if (s && s.hands.length > 0) s.hands[0].cards.push(draw(st));
    st.dealer.push(draw(st));
  }
  ev.push({ e: 'deal' });
  for (let i = 0; i < st.seats.length; i++) {
    const h = st.seats[i]?.hands[0];
    if (h && isBlackjack(h.cards)) {
      h.done = true;
      ev.push({ e: 'blackjack', seat: i });
    }
  }
}

function enterPlaying(st: TableState, ev: TableEvent[]): void {
  advanceTurn(st, ev);
}

function enterDealer(st: TableState, ev: TableEvent[]): void {
  setPhase(st, 'dealer');
  st.holeHidden = false;
  st.turn = -1;
  st.timer = 0;
  st.cpuIn = DEALER_GAP_S;
  ev.push({ e: 'dealerReveal', total: handTotal(st.dealer).total });
  const allBusted = st.seats.every((s) => !s || s.hands.every((h) => handTotal(h.cards).total > 21));
  if (allBusted) enterPayout(st, ev);
}

function enterPayout(st: TableState, ev: TableEvent[]): void {
  setPhase(st, 'payout');
  st.turn = -1;
  st.timer = 0;
  const dealerTotal = handTotal(st.dealer).total;
  const dealerBj = isBlackjack(st.dealer);
  for (let i = 0; i < st.seats.length; i++) {
    const s = st.seats[i];
    if (!s) continue;
    for (let j = 0; j < s.hands.length; j++) {
    const h = s.hands[j];
    const pt = handTotal(h.cards).total;
    const pBj = !h.split && isBlackjack(h.cards);
    let result: HandResult;
    let delta: number;
    if (pt > 21) {
      result = 'bust';
      delta = -h.bet;
    } else if (pBj && !dealerBj) {
      result = 'blackjack';
      delta = Math.floor(h.bet * 1.5);
      s.chips += h.bet + delta;
    } else if (dealerBj && !pBj) {
      result = 'lose';
      delta = -h.bet;
    } else if (pBj && dealerBj) {
      result = 'push';
      delta = 0;
      s.chips += h.bet;
    } else if (dealerTotal > 21 || pt > dealerTotal) {
      result = 'win';
      delta = h.bet;
      s.chips += 2 * h.bet;
    } else if (pt === dealerTotal) {
      result = 'push';
      delta = 0;
      s.chips += h.bet;
    } else {
      result = 'lose';
      delta = -h.bet;
    }
    h.result = result;
    h.delta = delta;
    ev.push({ e: 'result', seat: i, hand: j, result, delta });
    }
  }
}

// ---------------------------------------------------------------- clock

export function tickTable(st: TableState, dt: number): TableEvent[] {
  const ev: TableEvent[] = [];
  if (needsEntry.has(st)) {
    needsEntry.delete(st);
    enterBetting(st, ev);
  }
  st.t += dt;
  st.bubbles = st.bubbles.filter((b) => st.t - b.at <= BUBBLE_S);
  if (st.dealerShot) {
    if (!st.dealerShot.rose && st.t >= st.dealerShot.until) {
      st.dealerShot.rose = true;
      ev.push({ e: 'dealerRise' });
    }
    if (st.t >= st.dealerShot.until + 0.8) st.dealerShot = null;
    return ev;
  }
  st.phaseT += dt;
  st.idleIn -= dt;
  if (st.idleIn <= 0) {
    ev.push({ e: 'idle' });
    st.idleIn = idleTime(st);
  }

  switch (st.phase) {
    case 'betting': {
      st.timer -= dt;
      st.cpuIn -= dt;
      if (st.cpuIn <= 0) {
        for (const s of st.seats) {
          if (s && s.cpu && !s.ready) {
            s.bet = clampBet(st, s, CHARACTERS[s.character]?.bet ?? MIN_BET);
            s.ready = true;
            st.cpuIn = thinkTime(st) / 2;
            break;
          }
        }
      }
      const allReady = st.seats.every((s) => !s || s.ready);
      if (allReady || st.timer <= 0) enterDealing(st, ev);
      break;
    }
    case 'dealing':
      if (st.phaseT >= DEAL_S) {
        if (isBlackjack(st.dealer)) {
          st.holeHidden = false;
          ev.push({ e: 'dealerBlackjack' });
          enterPayout(st, ev);
        } else {
          enterPlaying(st, ev);
        }
      }
      break;
    case 'playing': {
      const seat = st.turn;
      const s = seat >= 0 ? st.seats[seat] : null;
      if (!s || seatDone(s)) {
        advanceTurn(st, ev);
        break;
      }
      st.timer -= dt;
      if (s.cpu) {
        st.cpuIn -= dt;
        if (st.cpuIn <= 0) {
          const a = cpuDecision(st, seat);
          if (!act(st, seat, a, ev)) act(st, seat, 'stand', ev);
        }
        break;
      }
      if (st.timer <= TIME_LOW_S && !st.lowSent) {
        st.lowSent = true;
        ev.push({ e: 'timeLow', seat });
      }
      if (st.timer <= 0) {
        // Out of time: every hand still open stands, so an idle split player does not stall the table.
        ev.push({ e: 'timeout', seat });
        while (st.turn === seat && !seatDone(s)) act(st, seat, 'stand', ev);
      }
      break;
    }
    case 'dealer': {
      st.cpuIn -= dt;
      if (st.cpuIn > 0) break;
      const total = handTotal(st.dealer).total;
      if (total < 17) {
        st.dealer.push(draw(st));
        st.cpuIn = DEALER_GAP_S;
        break;
      }
      if (total > 21) ev.push({ e: 'dealerBust', total });
      enterPayout(st, ev);
      break;
    }
    case 'payout':
      if (st.phaseT >= PAYOUT_S) {
        st.round++;
        enterBetting(st, ev);
      }
      break;
  }
  return ev;
}

// ---------------------------------------------------------------- simultaneous mode (party slice)

/** Deals one hand to all seats with chips using a fixed ante, skipping the betting phase. */
export function dealSimultaneousHand(st: TableState, ante: number): TableEvent[] {
  needsEntry.delete(st);
  const ev: TableEvent[] = [{ e: 'roundStart' }];
  st.dealer = [];
  st.holeHidden = true;
  st.turn = -1;
  st.timer = 0;
  for (const s of st.seats) {
    if (!s) continue;
    const bet = Math.min(ante, s.chips);
    s.bet = bet;
    s.ready = bet > 0;
    s.hands = [];
    s.active = 0;
  }
  enterDealing(st, ev);
  return ev;
}

/** Applies a player action in simultaneous 'playing' phase (any seat whose hand is not done may act). */
export function applySimultaneousAction(st: TableState, seat: number, a: Action): TableEvent[] {
  if (st.phase !== 'playing') return [];
  const ev: TableEvent[] = [];
  act(st, seat, a, ev, true);
  return ev;
}

/** Advances a simultaneous-turn table by dt. Caller handles 'payout' -> next hand or finish. */
export function tickSimultaneous(
  st: TableState,
  dt: number,
  opts: { dealS?: number; playS?: number; dealerGapS?: number } = {},
): TableEvent[] {
  const dealS = opts.dealS ?? DEAL_S;
  const playS = opts.playS ?? TURN_S;
  const dealerGapS = opts.dealerGapS ?? DEALER_GAP_S;
  const ev: TableEvent[] = [];
  st.t += dt;
  st.phaseT += dt;

  switch (st.phase) {
    case 'dealing':
      if (st.phaseT >= dealS) {
        if (isBlackjack(st.dealer)) {
          st.holeHidden = false;
          ev.push({ e: 'dealerBlackjack' });
          enterPayout(st, ev);
        } else if (st.seats.every(seatDone)) {
          enterDealer(st, ev);
        } else {
          setPhase(st, 'playing');
          st.turn = -1;
          st.timer = playS;
        }
      }
      break;
    case 'playing':
      st.timer = Math.max(0, st.timer - dt);
      if (st.timer <= 0) {
        for (let i = 0; i < st.seats.length; i++) {
          const s = st.seats[i];
          if (seatDone(s)) continue;
          ev.push({ e: 'timeout', seat: i });
          while (!seatDone(s) && st.phase === 'playing') act(st, i, 'stand', ev, true);
        }
      }
      break;
    case 'dealer': {
      st.cpuIn -= dt;
      if (st.cpuIn > 0) break;
      const total = handTotal(st.dealer).total;
      if (total < 17) {
        st.dealer.push(draw(st));
        st.cpuIn = dealerGapS;
        break;
      }
      if (total > 21) ev.push({ e: 'dealerBust', total });
      enterPayout(st, ev);
      break;
    }
    case 'payout':
      break;
  }
  return ev;
}
