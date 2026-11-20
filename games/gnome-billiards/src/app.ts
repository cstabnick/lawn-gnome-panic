// Gnome Billiards: the game controller. It ties the table physics, the 8-ball rules, Big Lou, the online link, the
// three.js scene and the screens together. Shots run in fixed physics steps, so every browser plays the same shot the same way.
//
// Controls:
//   - Tap the floor (outside the table) to walk your gnome there. Gnomes keep clear of the rails.
//   - A shot takes two strokes on the table: line up with a drag (let go to lock the line), then pull back along the
//     line and swipe forward through the ball. A short or sideways swipe is a cancelled stroke; drift bends the shot.
//   - Emote buttons play an emote on your gnome. The camera button switches between following your gnome in third
//     person and locking onto the whole table. Spectating watches two CPU gnomes play, with an orbit camera.
import { getMyGnome, GNORMAN_LOOK, resolveLook, type GnomeLook } from '@lawn/gnome';
import { DEFAULT_LOADOUT, getEmote, isEmoteId, loadMyEmotes } from '@lawn/emotes';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { aimLine, backRoom } from './aim';
import { createBilliardsAchievements } from './achievements';
import { chooseCpuShot, cpuPlaceSpot } from './cpu';
import { BALL_R, CPU_NAME, CPU_THINK_S, CUE_BALL, MAX_SHOT_SPEED, PULL_MAX, SETTLE_LIMIT_S, SUB_DT, TABLE_H, TABLE_W } from './config';
import { createHud, type EmoteButton, type Hud, type SeatView } from './hud';
import { isIdle, RAIL_HX, RAIL_HZ, separateWalkers, stepWalker, walkTo, type Walker } from './gnomes';
import { openOnline, type BilMsg, type OnlineLink } from './net';
import { beginShot, canPlaceCue, copyBalls, isMoving, setCue, stepOnce, type Ball, type Table } from './physics';
import { applyVerdict, judge, newMatch, type Match, type Verdict } from './rules';
import { BilliardsScene, SEAT_X, type CameraMode } from './scene';
import { sfx } from './sfx';
import { initPoolMusic } from './music';

type Mode = 'cpu' | 'local' | 'online' | 'spectate';
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
/** How often my gnome's place is sent to the other player while it walks (ms). */
const POSE_EVERY_MS = 120;
/** How long a spectated CPU shot waits, once the gnome is in place (seconds). */
const SPECTATE_THINK_S = 0.7;

const CPU_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a };
const PASS_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x2e8a5a, beard: null, freckles: true };
const SPECTATE_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x8a3ab0, shirt: 0x2a6a4a, beard: 0xd8d8d8 };

const CAM_NAMES: Record<CameraMode, string> = { follow: 'Follow', table: 'Table', orbit: 'Orbit' };

/** Whether a table point (table units) lies over the table with its rails. */
function overTable(x: number, y: number): boolean {
  return Math.abs(x - TABLE_W / 2) <= RAIL_HX && Math.abs(y - TABLE_H / 2) <= RAIL_HZ;
}

export function startApp(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ui = document.getElementById('ui') as HTMLElement;
  const scene = new BilliardsScene(canvas);
  const music = initPoolMusic();
  music.setOn(!sfx.isMuted());
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
  let clock = 0;

  // The two-stroke shot. 'line' = lining up; 'strike' = the aim is locked, waiting for the pull.
  let stage: 'line' | 'strike' = 'line';
  /** Unit shot direction in table units, locked or being lined up. */
  let dir = { dx: 1, dy: 0 };
  let lining = false;
  /** A strike in progress: where the press began, the furthest pull so far, and where that pull point was. */
  let stroke: { sx: number; sy: number; maxPull: number; pullX: number; pullY: number; nowPull: number } | null = null;

  // Camera: the modes you cycle through (spectating starts with the orbit).
  let camIdx = 0;
  let camModes: CameraMode[] = ['follow', 'table'];

  // Emotes: my loadout (unlocked ones), with the free ones until it loads.
  let emoteIds: string[] = [...DEFAULT_LOADOUT];

  /** The other player's gnome, as last reported over the network (online). */
  let remotePose: { x: number; z: number; yaw: number } | null = null;
  let poseSentAt = 0;
  let wasMoving = false;
  /** Countdown to a CPU gnome's next wander, per seat. */
  const wanderT = [1, 1];

  const myName = (): string => getMyGnome()?.name ?? 'You';
  const myLook = (): GnomeLook => getMyGnome()?.look ?? GNORMAN_LOOK;
  const seedNow = (): number => Math.floor(Math.random() * 2147483647) + 1;
  const isHuman = (slot: number): boolean => (mode === 'cpu' ? slot === 0 : mode === 'local' ? true : mode === 'online' ? slot === me : false);

  /** The seat whose gnome I walk and emote: the shooter in pass and play, my seat otherwise (none when spectating). */
  function walkSeat(): number {
    if (!started || mode === 'spectate') return -1;
    return mode === 'local' ? m.turn : me;
  }

  function canAct(): boolean {
    if (!started || table !== null || m.winner !== null || mode === 'spectate') return false;
    if (mode === 'local') return true;
    if (mode === 'cpu') return m.turn === 0;
    return m.turn === me;
  }

  /** Big Lou's (or the spectated) turn: the CPU takes the shot once its gnome is in place. */
  function isCpuTurn(): boolean {
    return started && table === null && m.winner === null && (mode === 'spectate' || (mode === 'cpu' && m.turn === 1));
  }

  /** How many of this slot's seven balls are down (pocketed), and its group. */
  function scoreOf(slot: number): { group: 'solid' | 'stripe' | null; potted: number } {
    const grp = m.groups[slot] ?? null;
    if (!grp) return { group: null, potted: 0 };
    const potted = m.balls.filter((b) => b.pocketed && b.id !== CUE_BALL && (grp === 'solid' ? b.id <= 7 : b.id >= 9)).length;
    return { group: grp, potted };
  }

  function groupLabel(slot: number): string {
    const { group, potted } = scoreOf(slot);
    if (!group) return 'Open table: first to pocket decides';
    return `${group === 'solid' ? 'Solids' : 'Stripes'} · ${potted} of 7 down`;
  }

  function currentCam(): CameraMode {
    return camModes[camIdx % camModes.length];
  }

  function emoteButtons(): EmoteButton[] {
    return emoteIds.map((id) => getEmote(id)).filter((e): e is NonNullable<ReturnType<typeof getEmote>> => !!e)
      .map((e) => ({ id: e.id, label: e.label, icon: e.icon }));
  }

  function refreshHud(): void {
    if (!started) {
      hud.setBar(!sfx.isMuted(), false, null);
      hud.setEmotes([]);
      return;
    }
    const views: SeatView[] = seats.map((s, i) => ({
      name: s.name,
      look: s.look,
      sub: mode === 'spectate' ? (i === 0 ? 'Big Lou' : 'Watching') : groupLabel(i),
      active: m.winner === null && m.turn === i,
      pips: scoreOf(i),
    }));
    hud.setSeats(views);
    hud.setBar(!sfx.isMuted(), true, `Camera: ${CAM_NAMES[currentCam()]}`, mode !== 'spectate');
    hud.setEmotes(mode === 'spectate' ? [] : emoteButtons());
    let hint = '';
    if (canAct()) {
      if (m.ballInHand) hint = 'Drag the cue ball onto the cloth.';
      else if (stage === 'line') hint = 'Drag on the table to line up the shot, then let go. Tap the floor to walk.';
      else hint = 'Pull back along the line, then swipe forward through the ball.';
    } else if (mode === 'spectate') {
      hint = 'Spectating. Tap Camera to change the view.';
    }
    hud.setMessage([note, hint].filter(Boolean).join('  ·  '));
  }

  function showMenu(): void {
    started = false;
    table = null;
    placing = null;
    lining = false;
    stroke = null;
    hud.setPower(null);
    hud.setBar(!sfx.isMuted(), false, null);
    hud.setEmotes([]);
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
    lining = false;
    stroke = null;
    stage = 'line';
    dir = { dx: 1, dy: 0 };
    remotePose = null;
    wasMoving = false;
    wanderT[0] = 1;
    wanderT[1] = 1;
    camModes = mode === 'spectate' ? ['orbit', 'table', 'follow'] : ['follow', 'table'];
    camIdx = 0;
    note = `${seats[0].name} breaks.`;
    scene.setSeats(seats.map((s) => s.look));
    hud.hideMenu();
    hud.hideOver();
    refreshHud();
  }

  // ------------------------------------------------------------ shots

  /** The longest pull the cue can make from here: the stick must not pass a rail or a ball behind. */
  function pullCap(): number {
    const cue = m.balls.find((b) => b.id === CUE_BALL);
    if (!cue) return 0;
    const room = backRoom(m.balls, cue.x, cue.y, -dir.dx, -dir.dy);
    return Math.max(0, Math.min(PULL_MAX, room - BALL_R * 1.6 - 0.05));
  }

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
    if (mode !== 'spectate') achievements.gameDone();
    let text: string;
    if (mode === 'spectate') {
      text = `${seats[w].name} sinks the 8 ball.`;
    } else if (mode === 'cpu') {
      text = w === 0 ? 'You sank the 8 ball!' : `${CPU_NAME} sinks the 8 ball.`;
      if (w === 0) achievements.cpuWin();
    } else if (mode === 'online') {
      text = w === me ? 'You sank the 8 ball!' : `${seats[w].name} sinks the 8 ball.`;
      if (w === me) achievements.onlineWin();
    } else {
      text = `${seats[w].name} sinks the 8 ball!`;
    }
    const youWon = mode === 'local' ? true : mode === 'spectate' ? true : w === (mode === 'cpu' ? 0 : me);
    if (youWon) sfx.win();
    else sfx.lose();
    hud.showOver(text, mode !== 'online');
  }

  /** A CPU gnome's shot: the cue ball placed if it was in hand, then the shot Big Lou picks. */
  function cpuTakeShot(): void {
    if (m.ballInHand) {
      const spot = cpuPlaceSpot(m.balls, Math.random);
      setCue(m.balls, spot.x, spot.y);
      m.ballInHand = false;
    }
    const cue = m.balls.find((b) => b.id === CUE_BALL);
    if (!cue) return;
    const s = chooseCpuShot(m.balls, cue.x, cue.y, m.groups[m.turn], Math.random);
    fire(s.vx, s.vy);
  }

  // ------------------------------------------------------------ online

  function onRemote(msg: BilMsg): void {
    if (msg.k === 'pose') {
      if (Number.isFinite(msg.x) && Number.isFinite(msg.z) && Number.isFinite(msg.yaw)) {
        remotePose = { x: msg.x, z: msg.z, yaw: msg.yaw };
      }
      return;
    }
    if (msg.k === 'emote') {
      if (isEmoteId(msg.id)) scene.playEmote(1 - me, msg.id);
      return;
    }
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
        hud.setEmotes([]);
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
    onSpectate: () => {
      online?.leave();
      online = null;
      startGame('spectate', [{ name: CPU_NAME, look: CPU_LOOK }, { name: 'Gnome Two', look: SPECTATE_LOOK }], 0, seedNow());
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
      music.setOn(!sfx.isMuted());
      refreshHud();
      if (!started) hud.setBar(!sfx.isMuted(), false, null);
    },
    onCamera: () => {
      camIdx = (camIdx + 1) % camModes.length;
      refreshHud();
    },
    onEmote: (id) => playMyEmote(id),
  });

  // ------------------------------------------------------------ canvas input: a tap on the floor walks, the table shoots

  function fit(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    scene.resize(innerWidth, innerHeight, dpr);
  }
  window.addEventListener('resize', fit);
  fit();

  const cueNow = (): Ball | undefined => m.balls.find((b) => b.id === CUE_BALL);

  /** Plays an emote on my gnome (the walking seat), and tells the other player online. */
  function playMyEmote(id: string): void {
    const seat = walkSeat();
    if (seat < 0 || !scene.playEmote(seat, id)) return;
    if (mode === 'online' && online) online.send({ k: 'emote', id });
  }

  /** Walks my gnome to a floor point (world units). */
  function walkMe(x: number, z: number): void {
    const seat = walkSeat();
    const w = seat >= 0 ? scene.walker(seat) : null;
    if (!w) return;
    walkTo(w, { x, z });
  }

  canvas.addEventListener('pointerdown', (e) => {
    const onCloth = scene.pointToTable(e.clientX, e.clientY);
    if (!onCloth || !overTable(onCloth[0], onCloth[1])) {
      // Off the table: a tap on the floor walks my gnome there.
      const floor = scene.pointToFloor(e.clientX, e.clientY);
      if (floor && started) walkMe(floor.x, floor.z);
      refreshHud();
      return;
    }
    if (!canAct()) return;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = onCloth;
    if (m.ballInHand) {
      placing = { x, y };
    } else if (stage === 'line') {
      lining = true;
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
      lining = false;
      stage = 'strike';
    } else if (stroke) {
      const s = stroke;
      stroke = null;
      const cue = cueNow();
      const cap = pullCap();
      const maxPull = Math.min(s.maxPull, cap);
      if (!cue || !canAct() || maxPull < MIN_PULL) {
        // A tap, or no room to pull: no stroke. It sends you back to lining up, so you can re-aim.
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
          const power = Math.min(1, maxPull / PULL_MAX);
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
    lining = false;
    stroke = null;
    hud.setPower(null);
    refreshHud();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      sfx.toggle();
      music.setOn(!sfx.isMuted());
      refreshHud();
    } else if (e.key === 'Escape' && started && !hud.menuOpen) {
      showMenu();
    } else if (/^[1-4]$/.test(e.key) && started && mode !== 'spectate') {
      // Keys 1-4 play the equipped emotes on desktop, as in Club Gnome.
      const id = emoteIds[Number(e.key) - 1];
      if (id) playMyEmote(id);
    }
  });

  // My emotes: the unlocked loadout (the free ones until it loads).
  void loadMyEmotes().then((ids) => {
    if (ids.length > 0) emoteIds = ids.map((e) => e.id);
    refreshHud();
  });

  // ------------------------------------------------------------ frame loop

  const maxSteps = Math.round(SETTLE_LIMIT_S / SUB_DT);

  /** The other player's gnome eases toward the place it last reported. */
  function followRemote(dt: number): void {
    const seat = 1 - me;
    const w = scene.walker(seat);
    if (!w || !remotePose) return;
    const k = Math.min(1, dt * 8);
    const ox = w.x;
    const oz = w.z;
    w.x += (remotePose.x - w.x) * k;
    w.z += (remotePose.z - w.z) * k;
    const dx = w.x - ox;
    const dz = w.z - oz;
    w.vx = dt > 0 ? dx / dt : 0;
    w.vz = dt > 0 ? dz / dt : 0;
    w.moving = Math.hypot(dx, dz) > 0.002;
    if (w.moving) w.yaw = Math.atan2(dx, dz);
    else {
      let d = remotePose.yaw - w.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      w.yaw += d * k;
    }
  }

  /** My gnome's place goes to the other player while it walks, and once more when it stops. */
  function sendPose(now: number): void {
    if (mode !== 'online' || !online) return;
    const w = scene.walker(me);
    if (!w) return;
    if ((w.moving || wasMoving) && now - poseSentAt >= POSE_EVERY_MS) {
      online.send({ k: 'pose', x: w.x, z: w.z, yaw: w.yaw });
      poseSentAt = now;
    }
    wasMoving = w.moving;
  }

  /** CPU gnomes (Big Lou, and both gnomes when spectating) wander about, and walk to their end of the table for a shot. */
  function cpuWalk(dt: number): void {
    const seatsCpu = mode === 'spectate' ? [0, 1] : mode === 'cpu' ? [1] : [];
    for (const s of seatsCpu) {
      const w = scene.walker(s);
      if (!w || !started) continue;
      if (isCpuTurn() && m.turn === s) {
        const spot = { x: s === 0 ? -SEAT_X : SEAT_X, z: 0 };
        if (Math.hypot(w.x - spot.x, w.z - spot.z) > 0.08 && isIdle(w)) walkTo(w, spot);
        continue;
      }
      if (!isIdle(w)) continue;
      wanderT[s] -= dt;
      if (wanderT[s] <= 0) {
        wanderT[s] = 2 + Math.random() * 3;
        walkTo(w, { x: (Math.random() * 2 - 1) * 2.2, z: (Math.random() * 2 - 1) * 1.5 });
      }
    }
  }

  function frame(now: number): void {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    clock += dt;

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

    // Walking: step every walker that has a path, then the CPU's decisions, then the remote gnome.
    for (let s = 0; s < 2; s++) {
      const w: Walker | null = scene.walker(s);
      if (w && (w.path.length > 0 || w.moving) && !(mode === 'online' && s !== me)) stepWalker(w, dt);
    }
    // The two gnomes bump rather than pass through each other (a remote player's gnome is placed by its own feed).
    const gnomeA = scene.walker(0);
    const gnomeB = scene.walker(1);
    if (gnomeA && gnomeB) separateWalkers(gnomeA, gnomeB, mode === 'online' && me !== 0, mode === 'online' && me !== 1);
    cpuWalk(dt);
    if (mode === 'online') {
      followRemote(dt);
      sendPose(clock * 1000);
    }

    // The CPU takes its shot once its gnome is standing at its end and the pause is over.
    if (isCpuTurn()) {
      const w = scene.walker(m.turn);
      const at = w && isIdle(w) && Math.hypot(w.x - (m.turn === 0 ? -SEAT_X : SEAT_X), w.z) < 0.1;
      if (at) {
        if (cpuClock < 0) cpuClock = mode === 'spectate' ? SPECTATE_THINK_S : CPU_THINK_S;
        cpuClock -= dt;
        if (cpuClock <= 0) {
          cpuClock = -1;
          cpuTakeShot();
        }
      } else {
        cpuClock = -1;
      }
    } else {
      cpuClock = -1;
    }

    // The camera follows the gnome whose shot it is (pass and play), or mine.
    const followSeat = mode === 'spectate' ? 0 : walkSeat() >= 0 ? walkSeat() : me;
    scene.setCamera(currentCam(), followSeat);

    // The live pull for the power meter and the stick (capped so the stick stays on the cloth).
    let pullRatio = 0;
    if (stroke && canAct()) {
      pullRatio = Math.max(0, Math.min(1, Math.min(stroke.nowPull, pullCap()) / PULL_MAX));
      hud.setPower(pullRatio);
    }
    const aimView = canAct() ? { dx: dir.dx, dy: dir.dy, pull: pullRatio } : null;
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

  // #cpu starts a match against Big Lou at once (for demos and screenshots); #spectate watches two CPUs.
  if (/[#&]cpu\b/.test(location.hash)) startGame('cpu', [{ name: myName(), look: myLook() }, { name: CPU_NAME, look: CPU_LOOK }], 0, 7);
  else if (/[#&]spectate\b/.test(location.hash)) startGame('spectate', [{ name: CPU_NAME, look: CPU_LOOK }, { name: 'Gnome Two', look: SPECTATE_LOOK }], 0, 7);
  else showMenu();
  requestAnimationFrame(frame);
}

startApp();
