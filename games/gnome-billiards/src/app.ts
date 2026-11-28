// Gnome Billiards: the game controller. Ties together table physics, 8-ball/9-ball/Straight/6-ball/Bank Pool rules,
// multi-tier CPUs with table talk & pre-shot cue animation, fine-grain aiming + Aim Zoom, chip wagering, challenge mode,
// online link, and 3D scene.
import { getMyGnome, GNORMAN_LOOK, resolveLook, type GnomeLook } from '@lawn/gnome';
import { DEFAULT_LOADOUT, getEmote, isEmoteId, loadMyEmotes } from '@lawn/emotes';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { claimFreeChips, getChips, onOakcountChange, spendChips, winChips } from '@lawn/oakcount';
import { createBilliardsAchievements } from './achievements';
import { deltaAngle, FINE_AIM_SCALE, FINE_NUDGE_RAD, NUDGE_STEP_RAD, rotateDir } from './aim';
import { createBanterVoice, pickBanter, PLAYER_QUIPS, type BanterTopic } from './banter';
import { CHALLENGES, challengeBalls, challengeTargets, checkChallenge, loadCompletedChallenges, markChallengeComplete, type ChallengeDef } from './challenges';
import { CPU_THINK_S, CUE_BALL, MAX_SHOT_SPEED, PULL_MAX, SETTLE_LIMIT_S, SUB_DT, TABLE_H, TABLE_W } from './config';
import { chooseCpuShot, CPU_PROFILES, cpuPlaceSpot, type CpuShot, type CpuTier } from './cpu';
import { isIdle, RAIL_HX, RAIL_HZ, separateWalkers, stepWalker, walkTo, type Walker } from './gnomes';
import { createHud, type EmoteButton, type Hud, type SeatView } from './hud';
import { initPoolMusic } from './music';
import { openOnline, type BilMsg, type OnlineLink } from './net';
import { beginShot, canPlaceCue, copyBalls, isMoving, setCue, stepOnce, type Ball, type Table } from './physics';
import { applyVerdict, BANK_TARGET, GAME_MODE_META, judge, lowestBallId, newMatch, STRAIGHT_TARGET, type GameMode, type Match, type Verdict } from './rules';
import { BilliardsScene, SEAT_X, type CameraMode } from './scene';
import { sfx } from './sfx';
import { clampWager, maxWager, wagerPayout } from './wager';

type Mode = 'cpu' | 'local' | 'online' | 'spectate' | 'challenge';
interface Seat {
  name: string;
  look: GnomeLook;
  cpuTier?: CpuTier;
}

const MIN_PULL = 0.02;
const MIN_FORWARD = 0.04;
const POSE_EVERY_MS = 120;
const SPECTATE_THINK_S = 0.7;
const NAG_AFTER_S = 18;

const PASS_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x2e8a5a, beard: null, freckles: true };
const CAM_NAMES: Record<CameraMode, string> = { follow: 'Follow', aim: 'Aim Zoom', table: 'Table', orbit: 'Orbit' };

function overTable(x: number, y: number): boolean {
  return Math.abs(x - TABLE_W / 2) <= RAIL_HX && Math.abs(y - TABLE_H / 2) <= RAIL_HZ;
}

function nearTable(x: number, y: number): boolean {
  return Math.abs(x - TABLE_W / 2) <= RAIL_HX + 0.55 && Math.abs(y - TABLE_H / 2) <= RAIL_HZ + 0.55;
}

export function startApp(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ui = document.getElementById('ui') as HTMLElement;
  const scene = new BilliardsScene(canvas);
  const music = initPoolMusic();
  music.setOn(!sfx.isMuted());
  const achievements = createBilliardsAchievements(ui);
  const banter = createBanterVoice(() => sfx.isMuted());

  let mode: Mode = 'cpu';
  let gameMode: GameMode = '8ball';
  let cpuTier: CpuTier = 'regular';
  let wager = 0;
  let activeWager = 0;
  let activeWagerMult = 1;
  let lastWonWager = 0;
  let challenge: ChallengeDef | null = null;
  let completedChallenges = loadCompletedChallenges();

  let seats: Seat[] = [];
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
  let pendingCpuShot: CpuShot | null = null;
  let placedAt: { x: number; y: number } | null = null;
  let placing: { x: number; y: number } | null = null;
  let online: OnlineLink | null = null;
  let searching = false;
  let menuStatus = '';
  let acc = 0;
  let last = performance.now();
  let clock = 0;

  let stage: 'line' | 'strike' = 'line';
  let dir = { dx: 1, dy: 0 };
  let lining = false;
  let fineAim = false;
  let shiftDown = false;
  let lastDragVec: { x: number; y: number } | null = null;
  let stroke: { sx: number; sy: number; maxPull: number; pullX: number; pullY: number; nowPull: number } | null = null;

  let camIdx = 0;
  let camModes: CameraMode[] = ['follow', 'aim', 'table'];
  let emoteIds: string[] = [...DEFAULT_LOADOUT];
  let remotePose: { x: number; z: number; yaw: number } | null = null;
  let poseSentAt = 0;
  let wasMoving = false;
  const wanderT = [1, 1];
  let turnIdleS = 0;
  let naggedThisTurn = false;
  let lastBanter = '';
  let replyTimer: number | null = null;

  const myName = (): string => getMyGnome()?.name ?? 'You';
  const myLook = (): GnomeLook => getMyGnome()?.look ?? GNORMAN_LOOK;
  const seedNow = (): number => Math.floor(Math.random() * 2147483647) + 1;
  const isHuman = (slot: number): boolean =>
    mode === 'cpu' ? slot === 0 : mode === 'challenge' ? slot === 0 : mode === 'local' ? true : mode === 'online' ? slot === me : false;

  function walkSeat(): number {
    if (!started || mode === 'spectate') return -1;
    return mode === 'local' ? m.turn : me;
  }

  function canAct(): boolean {
    if (!started || table !== null || m.winner !== null || mode === 'spectate') return false;
    if (mode === 'local' || mode === 'challenge') return true;
    if (mode === 'cpu') return m.turn === 0;
    return m.turn === me;
  }

  function isCpuTurn(): boolean {
    return started && table === null && m.winner === null && (mode === 'spectate' || (mode === 'cpu' && m.turn === 1));
  }

  function speakCpu(tier: CpuTier, topic: BanterTopic, seatIdx = 1): void {
    const line = pickBanter(tier, topic, { player: myName(), wager: activeWager }, Math.random, lastBanter);
    if (!line) return;
    lastBanter = line;
    const speaker = seats[seatIdx]?.name ?? CPU_PROFILES[tier].name;
    const accent = tier === 'cracked' ? '#ffd54f' : tier === 'shark' ? '#ff6e91' : '#9ad8ff';
    const side: 'left' | 'right' = seatIdx === 0 ? 'left' : 'right';
    hud.showBubble(speaker, line, accent, side);
    banter.say(line, tier);
  }

  function isMatchPoint(slot: number): boolean {
    if (m.gameMode === 'straight') return m.scores[slot] === STRAIGHT_TARGET - 1;
    if (m.gameMode === 'bank') return m.scores[slot] === BANK_TARGET - 1;
    if (m.gameMode === '9ball' || m.gameMode === '6ball') {
      return lowestBallId(m.balls) === (m.gameMode === '9ball' ? 9 : 6);
    }
    const grp = m.groups[slot];
    if (!grp) return false;
    return m.balls.filter((b) => !b.pocketed && b.id !== CUE_BALL && (grp === 'solid' ? b.id <= 7 : b.id >= 9)).length === 0;
  }

  function pipsFor(slot: number): SeatView['pips'] | undefined {
    if (mode === 'challenge') return undefined;
    if (m.gameMode === 'straight') return { group: null, potted: m.scores[slot], total: STRAIGHT_TARGET };
    if (m.gameMode === 'bank') return { group: null, potted: m.scores[slot], total: BANK_TARGET };
    if (m.gameMode === '8ball') {
      const grp = m.groups[slot] ?? null;
      if (!grp) return { group: null, potted: 0, total: 7 };
      const potted = m.balls.filter((b) => b.pocketed && b.id !== CUE_BALL && (grp === 'solid' ? b.id <= 7 : b.id >= 9)).length;
      return { group: grp, potted, total: 7 };
    }
    return undefined;
  }

  function groupLabel(slot: number): string {
    if (mode === 'challenge' && challenge) {
      const targets = new Set(challengeTargets(challenge));
      const left = m.balls.filter((b) => !b.pocketed && targets.has(b.id)).length;
      return `Shots: ${m.shots}/${challenge.parShots} · ${left} left`;
    }
    if (m.gameMode === '9ball' || m.gameMode === '6ball') {
      const low = lowestBallId(m.balls);
      return low !== null ? `${GAME_MODE_META[m.gameMode].short} · Target: ${low}` : GAME_MODE_META[m.gameMode].short;
    }
    if (m.gameMode === 'straight') {
      return `Points: ${m.scores[slot]} / ${STRAIGHT_TARGET}`;
    }
    if (m.gameMode === 'bank') {
      return `Banks: ${m.scores[slot]} / ${BANK_TARGET}`;
    }
    const p = pipsFor(slot);
    if (!p || !p.group) return 'Open table: first to pocket decides';
    return `${p.group === 'solid' ? 'Solids' : 'Stripes'} · ${p.potted} of 7 down`;
  }

  function currentCam(): CameraMode {
    return camModes[camIdx % camModes.length];
  }

  function emoteButtons(): EmoteButton[] {
    return emoteIds
      .map((id) => getEmote(id))
      .filter((e): e is NonNullable<ReturnType<typeof getEmote>> => !!e)
      .map((e) => ({ id: e.id, label: e.label, icon: e.icon }));
  }

  function refreshHud(): void {
    if (!started) {
      hud.setBar(!sfx.isMuted(), false, null);
      hud.setFineControls(false, fineAim);
      hud.setPot(null);
      hud.setEmotes([]);
      return;
    }
    const views: SeatView[] = seats.map((s, i) => ({
      name: s.name,
      look: s.look,
      sub: mode === 'spectate' ? `${CPU_PROFILES[s.cpuTier ?? 'regular'].title} · ${groupLabel(i)}` : groupLabel(i),
      active: m.winner === null && m.turn === i,
      pips: pipsFor(i),
    }));
    hud.setSeats(views);
    if (mode === 'cpu' && activeWager > 0) {
      const pay = wagerPayout(activeWager, activeWagerMult);
      hud.setPot(`Pot: 🪙 ${activeWager} (Win +${pay.profit})`);
    } else if (mode === 'challenge' && challenge) {
      const tags: string[] = [`🏆 ${challenge.title}`, `+${challenge.chipReward}🪙`];
      if (challenge.avoidIds?.length) tags.push(`Avoid #${challenge.avoidIds.join(', #')}`);
      if (challenge.requireBank) tags.push('Bank Required!');
      hud.setPot(tags.join(' · '));
    } else {
      hud.setPot(null);
    }

    const canAimNow = canAct() && !m.ballInHand;
    const reaim = canAimNow && stage === 'strike';
    hud.setBar(
      !sfx.isMuted(),
      true,
      `Camera: ${CAM_NAMES[currentCam()]}`,
      mode !== 'spectate',
      reaim,
      canAimNow,
      fineAim || shiftDown,
      mode === 'challenge',
    );
    hud.setFineControls(canAimNow, fineAim || shiftDown);
    hud.setEmotes(mode === 'spectate' ? [] : emoteButtons(), mode === 'cpu');
    let hint = '';
    if (canAct()) {
      if (m.ballInHand) hint = 'Drag the cue ball onto the cloth.';
      else if (stage === 'line') hint = fineAim ? 'Fine Aim ON: drag gently, scroll wheel, or tap ◀/▶. Let go to lock.' : 'Drag on the table to aim, then let go.';
      else hint = 'Pull back and release to shoot (◀/▶ nudges aim).';
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
    pendingCpuShot = null;
    if (replyTimer !== null) {
      window.clearTimeout(replyTimer);
      replyTimer = null;
    }
    activeWager = 0;
    challenge = null;
    wager = clampWager(wager, getChips());
    hud.hideBubble();
    hud.setPot(null);
    hud.setPower(null);
    hud.setFineControls(false, fineAim);
    hud.setBar(!sfx.isMuted(), false, null);
    hud.setEmotes([]);
    hud.setMessage('');
    hud.setSeats([]);
    hud.hideOver();
    hud.showMenu({
      status: menuStatus,
      searching,
      gameMode,
      cpuTier,
      chips: getChips(),
      wager,
      completedChallenges: completedChallenges.size,
      totalChallenges: CHALLENGES.length,
    });
  }

  function startGame(newMode: Mode, sts: Seat[], meSlot: number, seed: number, gm: GameMode = gameMode): void {
    mode = newMode;
    seats = sts;
    me = meSlot;
    m = newMatch(seed, 0, gm);
    started = true;
    table = null;
    pendingSync = null;
    reported = false;
    cpuClock = -1;
    pendingCpuShot = null;
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
    turnIdleS = 0;
    naggedThisTurn = false;
    if (replyTimer !== null) {
      window.clearTimeout(replyTimer);
      replyTimer = null;
    }
    camModes = mode === 'spectate' ? ['orbit', 'table', 'follow'] : ['follow', 'aim', 'table'];
    camIdx = 0;
    note = mode === 'challenge' && challenge ? challenge.description : `${seats[0].name} breaks (${GAME_MODE_META[gm].short}).`;
    scene.setSeats(seats.map((s) => s.look));
    hud.hideMenu();
    hud.hideOver();
    hud.hideBubble();
    refreshHud();

    if (mode === 'cpu') {
      const chipsBefore = getChips() + activeWager;
      const high = activeWager > 0 && chipsBefore > 0 && activeWager >= chipsBefore * 0.25;
      speakCpu(cpuTier, high ? 'highWager' : 'matchStart', 1);
    } else if (mode === 'spectate') {
      speakCpu(sts[0].cpuTier ?? 'regular', 'matchStart', 0);
    }
  }

  function startChallenge(def: ChallengeDef): void {
    challenge = def;
    activeWager = 0;
    startGame('challenge', [{ name: myName(), look: myLook() }], 0, 1, '8ball');
    m.balls = challengeBalls(def);
    m.shots = 0;
    note = `${def.title}: ${def.description}`;
    refreshHud();
  }

  // ------------------------------------------------------------ shots

  function fire(vx: number, vy: number): void {
    shooter = m.turn;
    before = copyBalls(m.balls);
    if (mode === 'online' && shooter === me && online) {
      online.send({ k: 'shot', vx, vy, cx: placedAt?.x, cy: placedAt?.y });
    }
    placedAt = null;
    pendingCpuShot = null;
    table = beginShot(m.balls, vx, vy);
    acc = 0;
    stroke = null;
    stage = 'line';
    turnIdleS = 0;
    naggedThisTurn = false;
    sfx.clack(Math.min(1, Math.hypot(vx, vy) / MAX_SHOT_SPEED));
    refreshHud();
  }

  function finishShot(): void {
    const t = table;
    if (!t) return;
    table = null;
    const isBreak = m.shots === 0;

    if (mode === 'challenge' && challenge) {
      m.balls = copyBalls(t.balls);
      m.shots++;
      const res = checkChallenge(challenge, before, m.balls, t.events, m.shots);
      if (t.events.pocketed.some((id) => id !== CUE_BALL)) sfx.pocket();
      if (t.events.pocketed.includes(CUE_BALL)) sfx.foul();
      if (res.status === 'won') {
        const first = markChallengeComplete(challenge.id);
        completedChallenges = loadCompletedChallenges();
        achievements.challengeClear();
        if (first) winChips(challenge.chipReward);
        sfx.win();
        const sub = first ? `First-time clear: +${challenge.chipReward} chips!` : `Cleared in ${m.shots} shot${m.shots > 1 ? 's' : ''}!`;
        const idx = CHALLENGES.findIndex((c) => c.id === challenge!.id);
        const hasNext = idx >= 0 && idx + 1 < CHALLENGES.length;
        hud.showOver(`🏆 ${challenge.title} Cleared!`, true, sub, hasNext ? 'Next Challenge' : undefined);
      } else if (res.status === 'lost') {
        sfx.lose();
        hud.showOver('Challenge Failed', true, res.reason);
      } else {
        note = `${res.remaining} target${res.remaining > 1 ? 's' : ''} left · ${challenge.parShots - m.shots} shot${challenge.parShots - m.shots > 1 ? 's' : ''} remaining.`;
      }
      refreshHud();
      return;
    }

    const hadBankPot = t.events.pocketed.some((id) => id !== CUE_BALL && (t.events.cushionHits?.[id] ?? 0) >= 1);
    const v: Verdict = judge(before, t.events, m.groups, shooter, m.gameMode, m.scores);
    applyVerdict(m, t.balls, v);
    report(v, isBreak, hadBankPot);
    if (mode === 'online' && shooter === me && online) online.send({ k: 'sync', match: snapshot(m) });
    if (pendingSync) {
      const incoming = pendingSync;
      pendingSync = null;
      adopt(incoming);
    } else {
      afterResult();
    }
  }

  function report(v: Verdict, isBreak: boolean, hadBankPot: boolean): void {
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
      const ballName =
        m.gameMode === '9ball' ? '9 ball' : m.gameMode === '6ball' ? '6 ball' : m.gameMode === 'straight' ? 'winning point' : m.gameMode === 'bank' ? 'winning bank' : '8 ball';
      note = v.winner === shooter ? `${who} sinks the ${ballName}!` : `${who} fouls on the ${ballName}.`;
    } else if (v.foul) {
      note = `Foul (${v.reasons.join(', ')}). ${next} places the cue ball.`;
    } else if (v.continues) {
      note = `${who} pots ${v.ownPotted}. Go again!`;
    } else if (v.potted.length > 0) {
      note = `${who} pots ${v.potted.length}. ${next}'s shot.`;
    } else {
      note = `No pot. ${next}'s shot.`;
    }

    if (v.winner === null) {
      if (mode === 'cpu') {
        if (shooter === 1) {
          if (v.foul) speakCpu(cpuTier, 'cpuFoul', 1);
          else if (hadBankPot && v.ownPotted > 0) speakCpu(cpuTier, 'bankShot', 1);
          else if (v.ownPotted >= 2) speakCpu(cpuTier, 'cpuMultiPot', 1);
          else if (v.ownPotted === 1) speakCpu(cpuTier, isMatchPoint(1) ? 'matchPoint' : 'cpuPot', 1);
          else speakCpu(cpuTier, 'cpuMiss', 1);
        } else {
          if (v.foul) speakCpu(cpuTier, 'playerFoul', 1);
          else if (hadBankPot && v.ownPotted > 0) speakCpu(cpuTier, 'bankShot', 1);
          else if (v.ownPotted > 0) speakCpu(cpuTier, isMatchPoint(0) ? 'matchPoint' : 'playerPot', 1);
          else speakCpu(cpuTier, 'playerMiss', 1);
        }
      } else if (mode === 'spectate') {
        const opp = 1 - shooter;
        const sTier = seats[shooter].cpuTier ?? 'regular';
        const oTier = seats[opp].cpuTier ?? 'regular';
        if (v.foul) speakCpu(oTier, 'playerFoul', opp);
        else if (hadBankPot && v.ownPotted > 0) speakCpu(sTier, 'bankShot', shooter);
        else if (v.ownPotted >= 2) speakCpu(sTier, 'cpuMultiPot', shooter);
        else if (v.ownPotted === 1) speakCpu(sTier, 'cpuPot', shooter);
        else speakCpu(oTier, 'playerMiss', opp);
      }
    }
  }

  function snapshot(src: Match): Match {
    return JSON.parse(JSON.stringify(src)) as Match;
  }

  function adopt(incoming: Match): void {
    const raw = snapshot(incoming) as Match & { gameMode?: GameMode; scores?: [number, number] };
    raw.gameMode ??= '8ball';
    raw.scores ??= [0, 0];
    m = raw;
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
    let subtext: string | undefined;
    let doubleLabel: string | undefined;

    if (mode === 'spectate') {
      text = `${seats[w].name} wins!`;
      speakCpu(seats[w].cpuTier ?? 'regular', 'cpuWin', w);
    } else if (mode === 'cpu') {
      const cpuName = CPU_PROFILES[cpuTier].name;
      text = w === 0 ? `You defeated ${cpuName}!` : `${cpuName} wins the rack.`;
      if (w === 0) {
        achievements.cpuWin();
        if (cpuTier === 'cracked') achievements.crackedWin();
        if (activeWager > 0) {
          const pay = wagerPayout(activeWager, activeWagerMult);
          winChips(pay.totalReturn);
          achievements.highRoller();
          subtext = `Wager won: +${pay.profit} chips (returned ${pay.totalReturn} 🪙)!`;
          lastWonWager = activeWager;
          const nextBet = clampWager(lastWonWager * 2, getChips());
          if (nextBet > 0) doubleLabel = `🔥 Double or Nothing (🪙 ${nextBet})`;
        } else {
          lastWonWager = 0;
        }
        speakCpu(cpuTier, 'playerWin', 1);
      } else {
        lastWonWager = 0;
        if (activeWager > 0) subtext = `Lost ${activeWager} chips on the table.`;
        speakCpu(cpuTier, 'cpuWin', 1);
      }
      activeWager = 0;
    } else if (mode === 'online') {
      text = w === me ? 'You win!' : `${seats[w].name} wins!`;
      if (w === me) achievements.onlineWin();
    } else {
      text = `${seats[w].name} wins!`;
    }

    const youWon = mode === 'local' ? true : mode === 'spectate' ? true : w === (mode === 'cpu' ? 0 : me);
    if (youWon) sfx.win();
    else sfx.lose();
    hud.showOver(text, mode !== 'online', subtext, undefined, doubleLabel);
  }

  function prepareCpuShot(): void {
    const tier = seats[m.turn]?.cpuTier ?? cpuTier;
    if (m.ballInHand) {
      const spot = cpuPlaceSpot(m.balls, Math.random, { tier, group: m.groups[m.turn] ?? null, gameMode: m.gameMode });
      setCue(m.balls, spot.x, spot.y);
      m.ballInHand = false;
    }
    const cue = m.balls.find((b) => b.id === CUE_BALL);
    if (!cue) return;
    pendingCpuShot = chooseCpuShot(m.balls, cue.x, cue.y, m.groups[m.turn], Math.random, {
      tier,
      gameMode: m.gameMode,
      isBreak: m.shots === 0,
    });
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
    startGame('online', sts, slot, seed, '8ball');
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

  function launchCpuMatch(betOverride?: number): void {
    online?.leave();
    online = null;
    const bet = clampWager(betOverride ?? wager, getChips());
    activeWager = 0;
    activeWagerMult = CPU_PROFILES[cpuTier].wagerMult;
    if (bet > 0 && spendChips(bet)) {
      activeWager = bet;
    }
    const profile = CPU_PROFILES[cpuTier];
    startGame(
      'cpu',
      [
        { name: myName(), look: myLook() },
        { name: profile.name, look: profile.look, cpuTier },
      ],
      0,
      seedNow(),
      gameMode,
    );
  }

  // ------------------------------------------------------------ HUD

  const hud: Hud = createHud(ui, {
    onCpu: () => launchCpuMatch(),
    onLocal: () => {
      online?.leave();
      online = null;
      activeWager = 0;
      startGame('local', [{ name: myName(), look: myLook() }, { name: 'Gnome Two', look: PASS_LOOK }], 0, seedNow(), gameMode);
    },
    onSpectate: () => {
      online?.leave();
      online = null;
      activeWager = 0;
      startGame(
        'spectate',
        [
          { name: CPU_PROFILES.regular.name, look: CPU_PROFILES.regular.look, cpuTier: 'regular' },
          { name: CPU_PROFILES.cracked.name, look: CPU_PROFILES.cracked.look, cpuTier: 'cracked' },
        ],
        0,
        seedNow(),
        gameMode,
      );
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
      if (mode === 'challenge' && challenge) {
        startChallenge(challenge);
        return;
      }
      if (mode === 'cpu') {
        launchCpuMatch();
        return;
      }
      startGame(mode, seats, 0, seedNow(), gameMode);
    },
    onRetry: () => {
      if (mode === 'challenge' && challenge) startChallenge(challenge);
    },
    onNextChallenge: () => {
      if (!challenge) return;
      const idx = CHALLENGES.findIndex((c) => c.id === challenge!.id);
      const next = idx >= 0 ? CHALLENGES[idx + 1] : undefined;
      if (next) startChallenge(next);
    },
    onDoubleOrNothing: () => {
      const nextBet = clampWager(lastWonWager * 2, getChips());
      wager = nextBet;
      launchCpuMatch(nextBet);
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
    onReaim: () => {
      if (!canAct() || m.ballInHand) return;
      stage = 'line';
      stroke = null;
      hud.setPower(null);
      refreshHud();
    },
    onFineToggle: () => {
      fineAim = !fineAim;
      refreshHud();
    },
    onNudge: (rad) => {
      if (!canAct() || m.ballInHand) return;
      dir = rotateDir(dir.dx, dir.dy, rad);
    },
    onEmote: (id) => playMyEmote(id),
    onQuip: (id) => {
      const q = PLAYER_QUIPS.find((x) => x.id === id);
      if (!q || !started || mode !== 'cpu') return;
      hud.showBubble(myName(), q.text, '#7ed957', 'left');
      if (replyTimer !== null) window.clearTimeout(replyTimer);
      replyTimer = window.setTimeout(() => {
        replyTimer = null;
        if (started && mode === 'cpu') speakCpu(cpuTier, 'comeback', 1);
      }, 850);
    },
    onSelectGameMode: (gm) => {
      gameMode = gm;
      if (!started) showMenu();
    },
    onSelectCpuTier: (t) => {
      cpuTier = t;
      if (!started) showMenu();
    },
    onWagerChange: (amount) => {
      wager = clampWager(amount, getChips());
      if (!started) {
        const cpu = CPU_PROFILES[cpuTier];
        hud.updateWager(wager, getChips(), cpu.wagerMult, cpu.name);
      }
    },
    onClaimFreeChips: () => {
      claimFreeChips();
      wager = clampWager(wager, getChips());
      if (!started) showMenu();
    },
    onOpenChallenges: () => {
      completedChallenges = loadCompletedChallenges();
      hud.showChallenges(completedChallenges);
    },
    onStartChallenge: (id) => {
      const def = CHALLENGES.find((c) => c.id === id);
      if (def) startChallenge(def);
    },
  });

  onOakcountChange(() => {
    wager = clampWager(wager, getChips());
    if (!started && hud.menuOpen) {
      const cpu = CPU_PROFILES[cpuTier];
      hud.updateWager(wager, getChips(), cpu.wagerMult, cpu.name);
    }
  });

  // ------------------------------------------------------------ canvas input

  function fit(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    scene.resize(innerWidth, innerHeight, dpr);
  }
  window.addEventListener('resize', fit);
  fit();

  const cueNow = (): Ball | undefined => m.balls.find((b) => b.id === CUE_BALL);

  function playMyEmote(id: string): void {
    const seat = walkSeat();
    if (seat < 0 || !scene.playEmote(seat, id)) return;
    if (mode === 'online' && online) online.send({ k: 'emote', id });
  }

  function walkMe(x: number, z: number): void {
    const seat = walkSeat();
    const w = seat >= 0 ? scene.walker(seat) : null;
    if (!w) return;
    walkTo(w, { x, z });
  }

  const unlockAudio = (): void => banter.unlock();
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!started || !canAct() || m.ballInHand) return;
      e.preventDefault();
      const step = fineAim || shiftDown ? FINE_NUDGE_RAD : NUDGE_STEP_RAD;
      dir = rotateDir(dir.dx, dir.dy, Math.sign(e.deltaY) * step);
    },
    { passive: false },
  );

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;
    const onCloth = scene.pointToTable(e.clientX, e.clientY);
    const inStrikeZone = canAct() && !m.ballInHand && stage === 'strike' && !!onCloth && nearTable(onCloth[0], onCloth[1]);
    if (!onCloth || (!overTable(onCloth[0], onCloth[1]) && !inStrikeZone)) {
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
      lastDragVec = null;
      if (fineAim || shiftDown) {
        const cue = cueNow();
        if (cue) {
          const dx = cue.x - x;
          const dy = cue.y - y;
          const len = Math.hypot(dx, dy);
          if (len >= 0.02) lastDragVec = { x: dx / len, y: dy / len };
        }
      } else {
        aimAt(x, y);
      }
    } else {
      stroke = { sx: x, sy: y, maxPull: 0, pullX: x, pullY: y, nowPull: 0 };
    }
    refreshHud();
  });

  canvas.addEventListener('contextmenu', (e) => {
    if (canAct() && !m.ballInHand && stage === 'strike') {
      e.preventDefault();
      stage = 'line';
      stroke = null;
      hud.setPower(null);
      refreshHud();
    }
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
      const pull = (x - stroke.sx) * -dir.dx + (y - stroke.sy) * -dir.dy;
      stroke.nowPull = pull;
      if (pull > stroke.maxPull) {
        stroke.maxPull = pull;
        stroke.pullX = x;
        stroke.pullY = y;
      }
    }
  });

  function aimAt(x: number, y: number): void {
    const cue = cueNow();
    if (!cue) return;
    const dx = cue.x - x;
    const dy = cue.y - y;
    const len = Math.hypot(dx, dy);
    if (len < 0.02) return;
    const ux = dx / len;
    const uy = dy / len;
    if ((fineAim || shiftDown) && lastDragVec) {
      const dA = deltaAngle(lastDragVec.x, lastDragVec.y, ux, uy) * FINE_AIM_SCALE;
      dir = rotateDir(dir.dx, dir.dy, dA);
    } else {
      dir = { dx: ux, dy: uy };
    }
    lastDragVec = { x: ux, y: uy };
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
      lastDragVec = null;
      stage = 'strike';
    } else if (stroke) {
      const s = stroke;
      stroke = null;
      const cue = cueNow();
      const maxPull = Math.min(s.maxPull, PULL_MAX);
      if (!cue || !canAct() || maxPull < MIN_PULL) {
        stage = 'line';
      } else {
        const fwd = (x - s.pullX) * dir.dx + (y - s.pullY) * dir.dy;
        const releasePull = Math.min(s.nowPull, PULL_MAX);
        const usedPull = fwd >= MIN_FORWARD ? maxPull : releasePull >= MIN_PULL ? releasePull : 0;
        if (usedPull >= MIN_PULL) {
          const power = Math.min(1, usedPull / PULL_MAX);
          fire(dir.dx * power * MAX_SHOT_SPEED, dir.dy * power * MAX_SHOT_SPEED);
        }
      }
    }
    hud.setPower(null);
    refreshHud();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    placing = null;
    lining = false;
    lastDragVec = null;
    stroke = null;
    hud.setPower(null);
    refreshHud();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift' && !shiftDown) {
      shiftDown = true;
      if (started) refreshHud();
    }
    if (e.key === 'm' || e.key === 'M') {
      sfx.toggle();
      music.setOn(!sfx.isMuted());
      refreshHud();
    } else if ((e.key === 'f' || e.key === 'F') && started && canAct() && !m.ballInHand) {
      fineAim = !fineAim;
      refreshHud();
    } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && started && canAct() && !m.ballInHand) {
      dir = rotateDir(dir.dx, dir.dy, -(fineAim || shiftDown ? FINE_NUDGE_RAD : NUDGE_STEP_RAD));
    } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && started && canAct() && !m.ballInHand) {
      dir = rotateDir(dir.dx, dir.dy, fineAim || shiftDown ? FINE_NUDGE_RAD : NUDGE_STEP_RAD);
    } else if (e.key === 'Escape' && started && !hud.menuOpen) {
      showMenu();
    } else if (/^[1-4]$/.test(e.key) && started && mode !== 'spectate') {
      const id = emoteIds[Number(e.key) - 1];
      if (id) playMyEmote(id);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' && shiftDown) {
      shiftDown = false;
      if (started) refreshHud();
    }
  });

  void loadMyEmotes().then((ids) => {
    if (ids.length > 0) emoteIds = ids.map((e) => e.id);
    refreshHud();
  });

  // ------------------------------------------------------------ frame loop

  const maxSteps = Math.round(SETTLE_LIMIT_S / SUB_DT);

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

    for (let s = 0; s < seats.length; s++) {
      const w: Walker | null = scene.walker(s);
      if (w && (w.path.length > 0 || w.moving) && !(mode === 'online' && s !== me)) stepWalker(w, dt);
    }
    const gnomeA = scene.walker(0);
    const gnomeB = scene.walker(1);
    if (gnomeA && gnomeB) separateWalkers(gnomeA, gnomeB, mode === 'online' && me !== 0, mode === 'online' && me !== 1);
    cpuWalk(dt);
    if (mode === 'online') {
      followRemote(dt);
      sendPose(clock * 1000);
    }

    if (mode === 'cpu' && canAct()) {
      turnIdleS += dt;
      if (turnIdleS >= NAG_AFTER_S && !naggedThisTurn) {
        naggedThisTurn = true;
        speakCpu(cpuTier, 'nag', 1);
      }
    } else {
      turnIdleS = 0;
    }

    let cpuAimView: { dx: number; dy: number; pull: number } | null = null;
    if (isCpuTurn()) {
      const w = scene.walker(m.turn);
      const at = w && isIdle(w) && Math.hypot(w.x - (m.turn === 0 ? -SEAT_X : SEAT_X), w.z) < 0.1;
      if (at) {
        if (cpuClock < 0) {
          cpuClock = mode === 'spectate' ? SPECTATE_THINK_S : CPU_THINK_S;
          prepareCpuShot();
        }
        cpuClock -= dt;
        if (pendingCpuShot) {
          const sp = Math.hypot(pendingCpuShot.vx, pendingCpuShot.vy) || 1;
          const pull = cpuClock < 0.4 ? Math.min(1, ((0.4 - Math.max(0, cpuClock)) / 0.4) * (sp / MAX_SHOT_SPEED)) : 0;
          cpuAimView = { dx: pendingCpuShot.vx / sp, dy: pendingCpuShot.vy / sp, pull };
        }
        if (cpuClock <= 0) {
          cpuClock = -1;
          if (pendingCpuShot) fire(pendingCpuShot.vx, pendingCpuShot.vy);
        }
      } else {
        cpuClock = -1;
        pendingCpuShot = null;
      }
    } else {
      cpuClock = -1;
      pendingCpuShot = null;
    }

    const followSeat = mode === 'spectate' ? 0 : walkSeat() >= 0 ? walkSeat() : me;
    scene.setCamera(currentCam(), followSeat);

    let pullRatio = 0;
    if (stroke && canAct()) {
      pullRatio = Math.max(0, Math.min(1, stroke.nowPull / PULL_MAX));
      hud.setPower(pullRatio);
    }
    const aimView = canAct() ? { dx: dir.dx, dy: dir.dy, pull: pullRatio, locked: stage === 'strike', fine: fineAim || shiftDown } : null;
    const placingView = placing ? { x: placing.x, y: placing.y, ok: canPlaceCue(m.balls, placing.x, placing.y) } : null;
    scene.update(
      {
        balls: table ? table.balls : m.balls,
        aim: aimView,
        cpuAim: cpuAimView,
        placing: placingView,
        activeSeat: table || !started || m.winner !== null ? -1 : m.turn,
      },
      dt,
    );
    requestAnimationFrame(frame);
  }

  if (/[#&]cpu\b/.test(location.hash)) {
    startGame('cpu', [{ name: myName(), look: myLook() }, { name: CPU_PROFILES.regular.name, look: CPU_PROFILES.regular.look, cpuTier: 'regular' }], 0, 7, '8ball');
  } else if (/[#&]spectate\b/.test(location.hash)) {
    startGame(
      'spectate',
      [
        { name: CPU_PROFILES.regular.name, look: CPU_PROFILES.regular.look, cpuTier: 'regular' },
        { name: CPU_PROFILES.cracked.name, look: CPU_PROFILES.cracked.look, cpuTier: 'cracked' },
      ],
      0,
      7,
      '8ball',
    );
  } else if (/[#&]challenge\b/.test(location.hash)) {
    showMenu();
    hud.showChallenges(completedChallenges);
  } else {
    showMenu();
  }
  requestAnimationFrame(frame);
}

startApp();
