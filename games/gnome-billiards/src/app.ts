// Gnome Billiards: the game controller. It ties the table physics, the 8-ball rules, Big Lou, the online link, the
// canvas input and the DOM screens together. Shots run in fixed physics steps, so every browser plays the same shot the same way.
import { getMyGnome, GNORMAN_LOOK, resolveLook, type GnomeLook } from '@lawn/gnome';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { createBilliardsAchievements } from './achievements';
import { chooseCpuShot, cpuPlaceSpot } from './cpu';
import { CPU_NAME, CPU_THINK_S, CUE_BALL, MAX_SHOT_SPEED, PULL_MAX, SETTLE_LIMIT_S, SUB_DT } from './config';
import { createHud, type Hud, type SeatView } from './hud';
import { beginShot, canPlaceCue, copyBalls, isMoving, setCue, stepOnce, type Ball, type Table } from './physics';
import { drawFrame, fitView, toTable, type View } from './render';
import { applyVerdict, judge, newMatch, type Match, type Verdict } from './rules';
import { openOnline, type BilMsg, type OnlineLink } from './net';
import { sfx } from './sfx';

type Mode = 'cpu' | 'local' | 'online';
interface Seat {
  name: string;
  look: GnomeLook;
}

const CPU_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a };
const PASS_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x2e8a5a, beard: null, freckles: true };
const TOP_PAD = 76;
const BOTTOM_PAD = 104;

export function startApp(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ui = document.getElementById('ui') as HTMLElement;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('2D canvas is not available');
  const ctx: CanvasRenderingContext2D = g;

  const achievements = createBilliardsAchievements(ui);

  let mode: Mode = 'cpu';
  let seats: Seat[] = [];
  /** My slot: the human at this screen (online: my seat; vs CPU: slot 0). Pass and play has no single owner. */
  let me = 0;
  let m: Match = newMatch(1);
  let started = false;
  let table: Table | null = null;
  let shooter = 0;
  let before: Ball[] = [];
  let pendingSync: Match | null = null;
  let reported = false;
  let note = '';
  let cpuClock = -1;
  let placedAt: { x: number; y: number } | null = null;
  let aim: { px: number; py: number } | null = null;
  let placing: { x: number; y: number } | null = null;
  let online: OnlineLink | null = null;
  let searching = false;
  let menuStatus = '';
  let acc = 0;
  let last = performance.now();
  let view: View = fitView(innerWidth, innerHeight, TOP_PAD, BOTTOM_PAD);
  let dpr = 1;

  const myName = (): string => getMyGnome()?.name ?? 'You';
  const myLook = (): GnomeLook => getMyGnome()?.look ?? GNORMAN_LOOK;
  const seedNow = (): number => Math.floor(Math.random() * 2147483647) + 1;
  const isHuman = (slot: number): boolean => (mode === 'cpu' ? slot === 0 : mode === 'local' ? true : slot === me);

  function canAct(): boolean {
    if (!started || table !== null || m.winner !== null) return false;
    if (mode === 'local') return true;
    if (mode === 'cpu') return m.turn === 0;
    return m.turn === me;
  }

  function groupLabel(slot: number): string {
    const grp = m.groups[slot];
    if (!grp) return 'Open table';
    const left = m.balls.filter((b) => !b.pocketed && b.id !== CUE_BALL && (grp === 'solid' ? b.id <= 7 : b.id >= 9)).length;
    return `${grp === 'solid' ? 'Solids' : 'Stripes'} · ${left} left`;
  }

  function refreshHud(): void {
    if (!started) {
      hud.setBar(!sfx.isMuted(), false);
      return;
    }
    const views: SeatView[] = seats.map((s, i) => ({
      name: s.name,
      look: s.look,
      sub: groupLabel(i),
      active: m.winner === null && m.turn === i,
    }));
    hud.setSeats(views);
    hud.setBar(!sfx.isMuted(), true);
    let hint = '';
    if (canAct()) hint = m.ballInHand ? 'Drag the cue ball onto the cloth.' : 'Drag back from the cue ball to shoot.';
    hud.setMessage([note, hint].filter(Boolean).join('  ·  '));
  }

  function showMenu(): void {
    started = false;
    table = null;
    placing = null;
    aim = null;
    hud.setBar(!sfx.isMuted(), false);
    hud.setMessage('');
    hud.setSeats([]);
    hud.hideOver();
    hud.showMenu({ status: menuStatus, searching });
  }

  function startGame(newMode: Mode, sts: Seat[], meSlot: number, seed: number): void {
    mode = newMode;
    seats = sts;
    me = meSlot;
    m = newMatch(seed, 0);
    started = true;
    table = null;
    pendingSync = null;
    reported = false;
    cpuClock = -1;
    placedAt = null;
    aim = null;
    placing = null;
    note = `${seats[0].name} breaks.`;
    hud.hideMenu();
    hud.hideOver();
    refreshHud();
  }

  // ------------------------------------------------------------ shots

  /** Strikes the cue ball (already placed, if it was in hand) and starts the animation. */
  function fire(vx: number, vy: number): void {
    shooter = m.turn;
    before = copyBalls(m.balls);
    if (online && shooter === me && mode === 'online') {
      const cx = placedAt?.x;
      const cy = placedAt?.y;
      online.send({ k: 'shot', vx, vy, cx, cy });
    }
    placedAt = null;
    table = beginShot(m.balls, vx, vy);
    acc = 0;
    sfx.clack(Math.min(1, Math.hypot(vx, vy) / MAX_SHOT_SPEED));
    refreshHud();
  }

  /** The table has come to rest: judge the shot, update the match, and tell the other browser (online). */
  function finishShot(): void {
    const t = table;
    if (!t) return;
    table = null;
    const isBreak = m.shots === 0;
    const v: Verdict = judge(before, t.events, m.groups, shooter);
    applyVerdict(m, t.balls, v);
    report(v, isBreak);
    if (mode === 'online' && shooter === me && online) online.send({ k: 'sync', match: snapshot(m) });
    if (pendingSync) {
      const incoming = pendingSync;
      pendingSync = null;
      adopt(incoming);
    } else {
      afterResult();
    }
  }

  function report(v: Verdict, isBreak: boolean): void {
    const who = seats[shooter].name;
    const next = seats[v.nextTurn]?.name ?? '';
    if (v.potted.length > 0) sfx.pocket();
    if (v.foul) sfx.foul();
    if (isHuman(shooter)) {
      if (v.potted.length > 0) achievements.firstPot();
      if (isBreak && v.potted.length >= 3) achievements.breakThree();
      if (v.scratch) achievements.scratch();
    }
    if (v.winner !== null) {
      note = v.winner === shooter ? `${who} sinks the 8 ball!` : `${who} sinks the 8 ball too early.`;
    } else if (v.foul) {
      note = `Foul (${v.reasons.join(', ')}). ${next} places the cue ball.`;
    } else if (v.continues) {
      note = `${who} pots ${v.ownPotted}. Go again!`;
    } else if (v.potted.length > 0) {
      note = `${who} pots ${v.potted.length}. ${next}'s shot.`;
    } else {
      note = `No pot. ${next}'s shot.`;
    }
  }

  function snapshot(src: Match): Match {
    return JSON.parse(JSON.stringify(src)) as Match;
  }

  /** Takes the other browser's table as the truth (the online shooter's settled result). */
  function adopt(incoming: Match): void {
    m = snapshot(incoming);
    afterResult();
  }

  function afterResult(): void {
    if (m.winner !== null && !reported) {
      reported = true;
      gameOver();
    }
    refreshHud();
  }

  function gameOver(): void {
    const w = m.winner ?? 0;
    achievements.gameDone();
    let text: string;
    if (mode === 'cpu') {
      text = w === 0 ? 'You sank the 8 ball!' : `${CPU_NAME} sinks the 8 ball.`;
      if (w === 0) achievements.cpuWin();
    } else if (mode === 'online') {
      text = w === me ? 'You sank the 8 ball!' : `${seats[w].name} sinks the 8 ball.`;
      if (w === me) achievements.onlineWin();
    } else {
      text = `${seats[w].name} sinks the 8 ball!`;
    }
    const youWon = mode === 'local' ? true : w === (mode === 'cpu' ? 0 : me);
    if (youWon) sfx.win();
    else sfx.lose();
    hud.showOver(text, mode !== 'online');
  }

  /** Big Lou's turn: a short pause, then a shot. */
  function cpuTakeShot(): void {
    if (m.ballInHand) {
      const spot = cpuPlaceSpot(m.balls, Math.random);
      setCue(m.balls, spot.x, spot.y);
      m.ballInHand = false;
    }
    const cue = m.balls.find((b) => b.id === CUE_BALL);
    if (!cue) return;
    const s = chooseCpuShot(m.balls, cue.x, cue.y, m.groups[1], Math.random);
    fire(s.vx, s.vy);
  }

  // ------------------------------------------------------------ online

  function onRemote(msg: BilMsg): void {
    if (msg.k === 'sync') {
      if (table) pendingSync = msg.match;
      else adopt(msg.match);
      return;
    }
    if (table || m.winner !== null || m.turn === me) return;
    if (msg.cx !== undefined && msg.cy !== undefined) {
      setCue(m.balls, msg.cx, msg.cy);
      m.ballInHand = false;
    }
    fire(msg.vx, msg.vy);
  }

  function startOnline(players: PlayerInfo[], you: number, seed: number): void {
    const sorted = [...players].sort((a, b) => a.id - b.id);
    const slot = Math.max(0, sorted.findIndex((p) => p.id === you));
    const sts: Seat[] = sorted.map((p) => ({
      name: p.name,
      look: resolveLook(p) ?? { ...GNORMAN_LOOK, hat: p.color },
    }));
    searching = false;
    menuStatus = '';
    startGame('online', sts, slot, seed);
    mode = 'online';
    me = slot;
    seats = sts.map((s, i) => (i === slot ? { ...s, name: myName() } : s));
    note = `${seats[0].name} breaks.`;
    refreshHud();
  }

  function openLink(): OnlineLink {
    online?.leave();
    const link = openOnline({
      onStatus: (text) => {
        menuStatus = text;
        if (!started) showMenu();
      },
      onMatch: (players, you, seed) => startOnline(players, you, seed),
      onMsg: (msg) => onRemote(msg),
      onGone: (reason) => {
        searching = false;
        if (!started) {
          menuStatus = reason;
          showMenu();
          return;
        }
        table = null;
        started = false;
        hud.setMessage('');
        hud.showOver(reason, false);
      },
    });
    online = link;
    return link;
  }

  // ------------------------------------------------------------ the screens

  const hud: Hud = createHud(ui, {
    onCpu: () => {
      online?.leave();
      online = null;
      startGame('cpu', [{ name: myName(), look: myLook() }, { name: CPU_NAME, look: CPU_LOOK }], 0, seedNow());
    },
    onLocal: () => {
      online?.leave();
      online = null;
      startGame('local', [{ name: myName(), look: myLook() }, { name: 'Gnome Two', look: PASS_LOOK }], 0, seedNow());
    },
    onOnline: () => {
      searching = true;
      menuStatus = 'Looking for an opponent…';
      openLink().queue(null);
      showMenu();
    },
    onRoom: (code) => {
      if (!/^[A-Z0-9]{4,8}$/.test(code)) {
        menuStatus = 'A room code is 4 to 8 letters or numbers.';
        showMenu();
        return;
      }
      searching = true;
      menuStatus = `Joining room ${code}…`;
      openLink().queue(code);
      showMenu();
    },
    onCancelSearch: () => {
      online?.leave();
      online = null;
      searching = false;
      menuStatus = 'Stopped looking.';
      showMenu();
    },
    onMenu: () => {
      if (mode === 'online' && started) online?.leave();
      if (mode === 'online') online = null;
      searching = false;
      menuStatus = '';
      showMenu();
    },
    onRematch: () => {
      if (mode === 'online') return;
      if (mode === 'cpu') startGame('cpu', seats, 0, seedNow());
      else startGame('local', seats, 0, seedNow());
    },
    onSound: () => {
      sfx.toggle();
      refreshHud();
      if (!started) hud.setBar(!sfx.isMuted(), false);
    },
  });

  // ------------------------------------------------------------ canvas

  function fit(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    view = fitView(innerWidth, innerHeight, TOP_PAD, BOTTOM_PAD);
  }
  window.addEventListener('resize', fit);
  fit();

  function pt(e: PointerEvent): [number, number] {
    const r = canvas.getBoundingClientRect();
    return toTable(view, e.clientX - r.left, e.clientY - r.top);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!canAct()) return;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = pt(e);
    if (m.ballInHand) placing = { x, y };
    else aim = { px: x, py: y };
    refreshHud();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!placing && !aim) return;
    const [x, y] = pt(e);
    if (placing) placing = { x, y };
    else if (aim) aim = { px: x, py: y };
  });
  const release = (e: PointerEvent): void => {
    const [x, y] = pt(e);
    if (placing) {
      const spot = { x, y };
      placing = null;
      if (canAct() && canPlaceCue(m.balls, spot.x, spot.y)) {
        setCue(m.balls, spot.x, spot.y);
        m.ballInHand = false;
        placedAt = spot;
      }
    } else if (aim) {
      const a = { px: x, py: y };
      aim = null;
      const cue = m.balls.find((b) => b.id === CUE_BALL);
      if (cue && canAct()) {
        const dx = cue.x - a.px;
        const dy = cue.y - a.py;
        const len = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(1, len / PULL_MAX);
        if (len > 1e-6 && power >= 0.04) {
          const speed = power * MAX_SHOT_SPEED;
          fire((dx / len) * speed, (dy / len) * speed);
        }
      }
    }
    refreshHud();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    placing = null;
    aim = null;
    refreshHud();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      sfx.toggle();
      refreshHud();
    } else if (e.key === 'Escape' && started && !hud.menuOpen) {
      showMenu();
    }
  });

  // ------------------------------------------------------------ frame loop

  const maxSteps = Math.round(SETTLE_LIMIT_S / SUB_DT);

  function frame(now: number): void {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (table) {
      acc += dt;
      let guard = 0;
      while (table && acc >= SUB_DT && guard < 40) {
        stepOnce(table);
        acc -= SUB_DT;
        guard++;
        if (!isMoving(table) || table.steps >= maxSteps) {
          finishShot();
          break;
        }
      }
    } else {
      acc = 0;
    }

    if (started && !table && m.winner === null && mode === 'cpu' && m.turn === 1) {
      if (cpuClock < 0) cpuClock = CPU_THINK_S;
      cpuClock -= dt;
      if (cpuClock <= 0) {
        cpuClock = -1;
        cpuTakeShot();
      }
    } else {
      cpuClock = -1;
    }

    const balls = table ? table.balls : m.balls;
    const cue = m.balls.find((b) => b.id === CUE_BALL);
    let aimView: { px: number; py: number; power: number } | null = null;
    if (aim && cue && canAct()) {
      const power = Math.min(1, Math.hypot(cue.x - aim.px, cue.y - aim.py) / PULL_MAX);
      aimView = { px: aim.px, py: aim.py, power };
    }
    const placingView = placing ? { x: placing.x, y: placing.y, ok: canPlaceCue(m.balls, placing.x, placing.y) } : null;
    drawFrame(ctx, view, {
      balls,
      aim: aimView,
      placing: placingView,
      cueActive: canAct(),
      cueMissing: started && m.ballInHand && (!cue || cue.pocketed) && !placing,
      width: innerWidth,
      height: innerHeight,
      dpr,
    });
    requestAnimationFrame(frame);
  }

  // #cpu starts a match against Big Lou at once (for demos and screenshots); otherwise the menu opens.
  if (/[#&]cpu\b/.test(location.hash)) startGame('cpu', [{ name: myName(), look: myLook() }, { name: CPU_NAME, look: CPU_LOOK }], 0, 7);
  else showMenu();
  requestAnimationFrame(frame);
}

startApp();
