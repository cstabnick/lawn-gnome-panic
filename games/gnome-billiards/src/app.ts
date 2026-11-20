// Gnome Billiards: the game controller. It ties the table physics, the 8-ball rules, Big Lou, the online link, the
// three.js scene and the screens together. Shots run in fixed physics steps, so every browser plays the same shot the same way.
//
// A shot takes two strokes of the pointer:
//   1. Line up: press and drag on the table. The cue's line follows the pointer. Let go to lock the line.
//   2. Strike: press anywhere and pull back along the line (the harder you pull, the more power), then swipe forward
//      through the ball and let go. A swipe that wanders sideways throws the aim off; a short or sideways swipe is a
//      cancelled stroke that costs nothing.
import { getMyGnome, GNORMAN_LOOK, resolveLook, type GnomeLook } from '@lawn/gnome';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { createBilliardsAchievements } from './achievements';
import { chooseCpuShot, cpuPlaceSpot } from './cpu';
import { CPU_NAME, CPU_THINK_S, CUE_BALL, MAX_SHOT_SPEED, PULL_MAX, SETTLE_LIMIT_S, SUB_DT } from './config';
import { createHud, type Hud, type SeatView } from './hud';
import { openOnline, type BilMsg, type OnlineLink } from './net';
import { beginShot, canPlaceCue, copyBalls, isMoving, setCue, stepOnce, type Ball, type Table } from './physics';
import { applyVerdict, judge, newMatch, type Match, type Verdict } from './rules';
import { BilliardsScene } from './scene';
import { sfx } from './sfx';

type Mode = 'cpu' | 'local' | 'online';
interface Seat {
  name: string;
  look: GnomeLook;
}

/** A pull of at least this much (table units) counts as a stroke; less is just a tap. */
const MIN_PULL = 0.02;
/** The forward swipe after the pull must carry the pointer at least this far through the ball. */
const MIN_FORWARD = 0.04;
/** The most a sideways swipe can throw the aim off, in radians. */
const MAX_MISS_ANGLE = 0.2;

const CPU_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a };
const PASS_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x2e8a5a, beard: null, freckles: true };

export function startApp(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ui = document.getElementById('ui') as HTMLElement;
  const scene = new BilliardsScene(canvas);
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
  let placing: { x: number; y: number } | null = null;
  let online: OnlineLink | null = null;
  let searching = false;
  let menuStatus = '';
  let acc = 0;
  let last = performance.now();

  // The two-stroke shot. 'line' = lining up (dragging the aim); 'strike' = the aim is locked, waiting for the pull.
  let stage: 'line' | 'strike' = 'line';
  /** Unit shot direction in table units, locked or being lined up. */
  let dir = { dx: 1, dy: 0 };
  let lining: { lastX: number; lastY: number } | null = null;
  /** A strike in progress: where the press began, the furthest pull so far, and where that pull point was. */
  let stroke: { sx: number; sy: number; maxPull: number; pullX: number; pullY: number; nowPull: number } | null = null;

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
    if (canAct()) {
      if (m.ballInHand) hint = 'Drag the cue ball onto the cloth.';
      else if (stage === 'line') hint = 'Drag on the table to line up the shot, then let go.';
      else hint = 'Pull back along the line, then swipe forward through the ball.';
    }
    hud.setMessage([note, hint].filter(Boolean).join('  ·  '));
  }

  function showMenu(): void {
    started = false;
    table = null;
    placing = null;
    lining = null;
    stroke = null;
    hud.setPower(null);
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
    placing = null;
    lining = null;
    stroke = null;
    stage = 'line';
    dir = { dx: 1, dy: 0 };
    note = `${seats[0].name} breaks.`;
    scene.setSeats(seats.map((s) => s.look));
    hud.hideMenu();
    hud.hideOver();
    refreshHud();
  }

  // ------------------------------------------------------------ shots

  /** Strikes the cue ball (already placed, if it was in hand) and starts the animation. */
  function fire(vx: number, vy: number): void {
    shooter = m.turn;
    before = copyBalls(m.balls);
    if (mode === 'online' && shooter === me && online) {
      online.send({ k: 'shot', vx, vy, cx: placedAt?.x, cy: placedAt?.y });
    }
    placedAt = null;
    table = beginShot(m.balls, vx, vy);
    acc = 0;
    stroke = null;
    stage = 'line';
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
    const sts: Seat[] = sorted.map((p, i) => ({
      name: i === slot ? myName() : p.name,
      look: resolveLook(p) ?? { ...GNORMAN_LOOK, hat: p.color },
    }));
    searching = false;
    menuStatus = '';
    startGame('online', sts, slot, seed);
    mode = 'online';
    me = slot;
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
        hud.setPower(null);
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
      if (mode === 'online') {
        online?.leave();
        online = null;
      }
      searching = false;
      menuStatus = '';
      showMenu();
    },
    onRematch: () => {
      if (mode === 'online') return;
      startGame(mode, seats, 0, seedNow());
    },
    onSound: () => {
      sfx.toggle();
      refreshHud();
      if (!started) hud.setBar(!sfx.isMuted(), false);
    },
  });

  // ------------------------------------------------------------ input (pointer: mouse, touch and pen alike)

  function fit(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    scene.resize(innerWidth, innerHeight, dpr);
  }
  window.addEventListener('resize', fit);
  fit();

  const cueNow = (): Ball | undefined => m.balls.find((b) => b.id === CUE_BALL);

  canvas.addEventListener('pointerdown', (e) => {
    if (!canAct()) return;
    const p = scene.pointToTable(e.clientX, e.clientY);
    if (!p) return;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = p;
    if (m.ballInHand) {
      placing = { x, y };
    } else if (stage === 'line') {
      lining = { lastX: x, lastY: y };
      aimAt(x, y);
    } else {
      stroke = { sx: x, sy: y, maxPull: 0, pullX: x, pullY: y, nowPull: 0 };
    }
    refreshHud();
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = scene.pointToTable(e.clientX, e.clientY);
    if (!p) return;
    const [x, y] = p;
    if (placing) {
      placing = { x, y };
    } else if (lining) {
      aimAt(x, y);
    } else if (stroke) {
      // Pulling back is moving against the shot line: a positive pull.
      const pull = (x - stroke.sx) * -dir.dx + (y - stroke.sy) * -dir.dy;
      stroke.nowPull = pull;
      if (pull > stroke.maxPull) {
        stroke.maxPull = pull;
        stroke.pullX = x;
        stroke.pullY = y;
      }
    }
  });

  /** Lining up: the shot leaves the cue ball away from the pointer, so the line runs from the pointer through the cue. */
  function aimAt(x: number, y: number): void {
    const cue = cueNow();
    if (!cue) return;
    const dx = cue.x - x;
    const dy = cue.y - y;
    const len = Math.hypot(dx, dy);
    if (len < 0.02) return;
    dir = { dx: dx / len, dy: dy / len };
  }

  const release = (e: PointerEvent): void => {
    const p = scene.pointToTable(e.clientX, e.clientY);
    const [x, y] = p ?? [NaN, NaN];
    if (placing) {
      const spot = { x, y };
      placing = null;
      if (canAct() && canPlaceCue(m.balls, spot.x, spot.y)) {
        setCue(m.balls, spot.x, spot.y);
        m.ballInHand = false;
        placedAt = spot;
      }
    } else if (lining) {
      lining = null;
      stage = 'strike';
    } else if (stroke) {
      const s = stroke;
      stroke = null;
      const cue = cueNow();
      if (!cue || !canAct() || s.maxPull < MIN_PULL) {
        // A tap: no stroke. It sends you back to lining up, so you can re-aim.
        stage = 'line';
      } else {
        // How far the swipe carried forward through the ball from the furthest pull.
        const fwd = (x - s.pullX) * dir.dx + (y - s.pullY) * dir.dy;
        if (fwd >= MIN_FORWARD) {
          // Sideways drift between the pull and the release bends the shot. Small on purpose: it is skill, not luck.
          const lateral = (x - s.pullX) * -dir.dy + (y - s.pullY) * dir.dx;
          const miss = Math.max(-MAX_MISS_ANGLE, Math.min(MAX_MISS_ANGLE, lateral / Math.max(0.05, fwd)));
          const c = Math.cos(miss);
          const sn = Math.sin(miss);
          const ux = dir.dx * c - dir.dy * sn;
          const uy = dir.dx * sn + dir.dy * c;
          const power = Math.min(1, s.maxPull / PULL_MAX);
          fire(ux * power * MAX_SHOT_SPEED, uy * power * MAX_SHOT_SPEED);
        }
        // A short or sideways swipe is a cancelled stroke: nothing happens, the line is still locked.
      }
    }
    hud.setPower(null);
    refreshHud();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    placing = null;
    lining = null;
    stroke = null;
    hud.setPower(null);
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

    // The live pull for the power meter and the stick.
    let pullRatio = 0;
    if (stroke && canAct()) {
      pullRatio = Math.max(0, Math.min(1, stroke.nowPull / PULL_MAX));
      hud.setPower(pullRatio);
    }
    const aimView = canAct() && started ? { dx: dir.dx, dy: dir.dy, pull: pullRatio, stroking: !!stroke } : null;
    const placingView = placing ? { x: placing.x, y: placing.y, ok: canPlaceCue(m.balls, placing.x, placing.y) } : null;
    scene.update(
      {
        balls: table ? table.balls : m.balls,
        aim: aimView,
        placing: placingView,
        activeSeat: table || !started || m.winner !== null ? -1 : m.turn,
      },
      dt,
    );
    requestAnimationFrame(frame);
  }

  // #cpu starts a match against Big Lou at once (for demos and screenshots); otherwise the menu opens.
  if (/[#&]cpu\b/.test(location.hash)) startGame('cpu', [{ name: myName(), look: myLook() }, { name: CPU_NAME, look: CPU_LOOK }], 0, 7);
  else showMenu();
  requestAnimationFrame(frame);
}

startApp();
