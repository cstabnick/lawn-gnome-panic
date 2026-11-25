// 2-on-2 NBA Jam style arcade basketball simulation.
import * as THREE from 'three';
import {
  captureGameState,
  createSlotBot,
  normalizeBotInput,
  type BotController,
  type BotRole,
  type CreateBotOptions,
  type GameStateSnapshot,
} from './ai';
import { COURT_HALF_X, COURT_HALF_Z, HOOP_X, HOOP_Y, THREE_PT_RADIUS } from './court';
import { DEFAULT_BALANCE_CONFIG, type SimBalanceConfig } from './balance';
import type { PlayerControlInput } from './input';
import type {
  AnnouncerEvent,
  Difficulty,
  DunkStyle,
  GnomePlayerProfile,
  MatchConfig,
  MatchResult,
  PlayerBoxScore,
} from './types';

export interface DunkState {
  style: DunkStyle;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  t: number;
  duration: number;
  peakY: number;
  scored: boolean;
  launcherIdx?: number;
  /** Set once the windup disruption roll has happened (once per dunk). */
  windupRolled?: boolean;
  /** Opponent indices that have already rolled a contest against this dunk (once per defender). */
  contestRolled?: number[];
}

export interface SimPlayer {
  index: number; // 0,1 = Home (attacks +X right hoop); 2,3 = Away (attacks -X left hoop)
  team: 0 | 1;
  profile: GnomePlayerProfile;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  grounded: boolean;
  turbo: number; // 0..100
  streak: number;
  onFire: boolean;
  stunTimer: number;
  shoveTimer: number;
  stealCooldown: number;
  /** >0 while a pump fake is live. */
  fakeTimer: number;
  fakeCooldown: number;
  /** >0 after a defender bit on a fake: next shot is uncontested. */
  openLookTimer: number;
  shootHold: number; // >0 while charging jump shot in air
  isShooting: boolean;
  dunk: DunkState | null;
  celebrateTimer: number;
  box: PlayerBoxScore;
}

export interface SimBall {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  carrier: number | null; // player index or null
  mode: 'held' | 'shot' | 'pass' | 'loose' | 'inbound';
  shooter: number | null;
  passTarget: number | null;
  isThreeAttempt: boolean;
  isAlleyOop: boolean;
  isBackboardLob: boolean;
  /** Defender who will pick this pass off, and at what fraction of the flight. */
  interceptBy: number | null;
  interceptU: number;
  /** Defenders who already rolled a swat on the current shot. */
  blockRolled: number[];
  willScore: boolean;
  shotStartX: number;
  shotStartZ: number;
  flightT: number;
  flightDur: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  arcPeak: number;
  spin: number;
  onFire: boolean;
  pickupLock: number;
  lastTouchTeam: 0 | 1;
}

export interface SimCallbacks {
  onAnnounce: (ev: AnnouncerEvent) => void;
  onSound: (
    kind:
      | 'bounce'
      | 'swish'
      | 'swish3'
      | 'clang'
      | 'dunk'
      | 'dunkFire'
      | 'pass'
      | 'shove'
      | 'block'
      | 'fire'
      | 'whistle'
      | 'buzzer'
      | 'cheer',
  ) => void;
  onRimShake: (side: 'left' | 'right', strength: number) => void;
  onCameraPunch: (strength: number) => void;
  onBurst: (pos: THREE.Vector3, kind: 'fire' | 'confetti' | 'dust', color?: number) => void;
  onAchievement: (kind: 'dunk' | 'three' | 'fire' | 'win') => void;
  onMatchEnd: (result: MatchResult) => void;
}

const GRAVITY = 22;
const SHOT_CLOCK_MAX = 24;

export class JamSimulation {
  readonly config: MatchConfig;
  readonly players: SimPlayer[] = [];
  readonly ball: SimBall;
  readonly cb: SimCallbacks;

  score: [number, number] = [0, 0];
  quarter = 1;
  clockSec: number;
  shotClock = SHOT_CLOCK_MAX;
  phase: 'tipoff' | 'live' | 'scored' | 'quarterBreak' | 'finished' = 'tipoff';
  phaseTimer = 1.1;
  inboundTeam: 0 | 1 = 0;

  /** Which home player index (0 or 1) P1 currently controls. */
  p1ControlIdx = 0;
  /** Which away player index (2 or 3) P2 controls in local2p mode. */
  p2ControlIdx = 2;

  excitement = 0.2; // 0..1 drives crowd bounce
  dribbleTick = 0;
  tick = 0;
  /** Seconds left in which the inbound ball-holder cannot be stolen from. */
  inboundProtectT = 0;
  /** Fake telemetry by the faking team: fakes thrown, defenders who bit, steals that read a fake. */
  fakeStats = { fakes: [0, 0], bites: [0, 0], reads: [0, 0] };
  private finishedSent = false;
  private bots: [BotController, BotController, BotController, BotController];
  private readonly bal: SimBalanceConfig;

  constructor(config: MatchConfig, cb: SimCallbacks, botOpts: CreateBotOptions = {}) {
    this.config = config;
    this.bal = { ...DEFAULT_BALANCE_CONFIG, ...config.balance };
    this.cb = cb;
    this.clockSec = config.quarterSeconds;
    this.bots = [
      createSlotBot(config.botSlots?.[0], botOpts),
      createSlotBot(config.botSlots?.[1], botOpts),
      createSlotBot(config.botSlots?.[2], botOpts),
      createSlotBot(config.botSlots?.[3], botOpts),
    ];

    const allProfiles: Array<{ team: 0 | 1; profile: GnomePlayerProfile }> = [
      { team: 0, profile: config.homeRoster[0] },
      { team: 0, profile: config.homeRoster[1] },
      { team: 1, profile: config.awayRoster[0] },
      { team: 1, profile: config.awayRoster[1] },
    ];

    allProfiles.forEach((entry, idx) => {
      this.players.push({
        index: idx,
        team: entry.team,
        profile: entry.profile,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        facing: entry.team === 0 ? Math.PI / 2 : -Math.PI / 2,
        grounded: true,
        turbo: 100,
        streak: 0,
        onFire: false,
        stunTimer: 0,
        shoveTimer: 0,
        stealCooldown: 0,
        fakeTimer: 0,
        fakeCooldown: 0,
        openLookTimer: 0,
        shootHold: 0,
        isShooting: false,
        dunk: null,
        celebrateTimer: 0,
        box: {
          name: entry.profile.name,
          team: entry.team,
          pts: 0,
          fgm: 0,
          fga: 0,
          tpm: 0,
          tpa: 0,
          dunks: 0,
          steals: 0,
          blocks: 0,
          rebounds: 0,
        },
      });
    });

    this.ball = {
      pos: new THREE.Vector3(0, 2.2, 0),
      vel: new THREE.Vector3(),
      carrier: null,
      mode: 'loose',
      shooter: null,
      passTarget: null,
      isThreeAttempt: false,
      isAlleyOop: false,
      isBackboardLob: false,
      interceptBy: null,
      interceptU: 1,
      blockRolled: [],
      willScore: false,
      shotStartX: 0,
      shotStartZ: 0,
      flightT: 0,
      flightDur: 0.8,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      arcPeak: 4.5,
      spin: 0,
      onFire: false,
      pickupLock: 0,
      lastTouchTeam: 0,
    };

    this.resetTipoff();
  }

  private resetTipoff(): void {
    this.players[0].pos.set(-1.3, 0, -0.3);
    this.players[1].pos.set(-4.2, 0, 1.8);
    this.players[2].pos.set(1.3, 0, 0.3);
    this.players[3].pos.set(4.2, 0, -1.8);
    for (const p of this.players) {
      p.vel.set(0, 0, 0);
      p.grounded = true;
      p.dunk = null;
      p.stunTimer = 0;
      p.isShooting = false;
      p.facing = p.team === 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    this.ball.pos.set(0, 3.6, 0);
    this.ball.vel.set(0, 0, 0);
    this.ball.carrier = null;
    this.ball.mode = 'loose';
    this.ball.isAlleyOop = false;
    this.ball.isBackboardLob = false;
    this.ball.onFire = false;
    this.shotClock = SHOT_CLOCK_MAX;
    this.phase = 'tipoff';
    this.phaseTimer = 1.0;
    this.cb.onSound('whistle');
    this.cb.onAnnounce({
      text: this.quarter > 4 ? 'OVERTIME!' : `QUARTER ${this.quarter}`,
      subtext: 'TIP-OFF!',
      color: '#ffd21f',
      big: true,
    });
  }

  private setupInbound(team: 0 | 1): void {
    this.inboundTeam = team;
    const attackDir = team === 0 ? 1 : -1;
    const baseX = -attackDir * (COURT_HALF_X - 2.4);
    const baseIdx = team === 0 ? 0 : 2;
    const defIdx = team === 0 ? 2 : 0;

    // Give ball to primary ball-handler on inbound team
    const hasP2 = this.config.opponentMode === 'local2p' || this.config.opponentMode === 'online';
    const handler = team === 0 ? this.p1ControlIdx : hasP2 ? this.p2ControlIdx : baseIdx;
    const mate = handler === baseIdx ? baseIdx + 1 : baseIdx;

    this.players[handler].pos.set(baseX, 0, 0);
    this.players[mate].pos.set(baseX + attackDir * 4.0, 0, -2.1);
    this.players[defIdx].pos.set(attackDir * 2.2, 0, 0.5);
    this.players[defIdx + 1].pos.set(attackDir * 5.2, 0, -1.8);

    for (const p of this.players) {
      p.vel.set(0, 0, 0);
      p.grounded = true;
      p.dunk = null;
      p.stunTimer = 0;
      p.isShooting = false;
      p.fakeTimer = 0;
      p.openLookTimer = 0;
      p.shootHold = 0;
      p.facing = p.team === 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    this.giveBallTo(handler);
    this.shotClock = SHOT_CLOCK_MAX;
    this.inboundProtectT = this.bal.inboundProtectSec;
    this.phase = 'live';
  }

  private giveBallTo(playerIdx: number): void {
    this.ball.carrier = playerIdx;
    this.ball.interceptBy = null;
    this.ball.mode = 'held';
    this.ball.shooter = null;
    this.ball.passTarget = null;
    this.ball.isAlleyOop = false;
    this.ball.isBackboardLob = false;
    this.ball.pickupLock = 0.25;
    const p = this.players[playerIdx];
    this.ball.lastTouchTeam = p.team;
    this.ball.onFire = p.onFire;
    if (p.team === 0) this.p1ControlIdx = playerIdx;
    else if (this.config.opponentMode === 'local2p' || this.config.opponentMode === 'online') this.p2ControlIdx = playerIdx;
  }

  /** Target hoop X for a team (Home attacks +HOOP_X, Away attacks -HOOP_X). */
  targetHoopX(team: 0 | 1): number {
    return team === 0 ? HOOP_X : -HOOP_X;
  }

  /** Replace the BotController for a player slot (0..3) at runtime. */
  setBot(slot: 0 | 1 | 2 | 3, bot: BotController): void {
    this.bots[slot].dispose?.();
    this.bots[slot] = bot;
  }

  /** Returns a pure JSON-serializable snapshot of the current match state. */
  getSnapshot(): GameStateSnapshot {
    return captureGameState(this);
  }

  /** Disposes any worker/remote bot controllers owned by this simulation. */
  dispose(): void {
    for (const bot of this.bots) {
      bot.dispose?.();
    }
  }

  step(dt: number, p1In: PlayerControlInput, p2In: PlayerControlInput): void {
    const clampedDt = Math.min(dt, 0.05);
    this.tick++;
    this.excitement = Math.max(0.15, this.excitement - clampedDt * 0.35);

    if (this.phase === 'finished') return;

    // Phase timers (tipoff, scored celebration, quarter break)
    if (this.phase === 'tipoff') {
      this.phaseTimer -= clampedDt;
      this.ball.pos.y = 1.6 + Math.abs(Math.sin(this.phaseTimer * Math.PI)) * 2.4;
      if (this.phaseTimer <= 0) {
        // Tip to Home P1 on Q1/Q3/OT, Away on Q2/Q4
        const winner = this.quarter % 2 === 1 ? 0 : 2;
        this.giveBallTo(winner);
        this.phase = 'live';
      }
      return;
    }

    if (this.phase === 'scored') {
      this.phaseTimer -= clampedDt;
      // Ball drops through net onto court
      this.ball.pos.y = Math.max(0.15, this.ball.pos.y - clampedDt * 3.8);
      for (const p of this.players) {
        if (p.celebrateTimer > 0) p.celebrateTimer -= clampedDt;
        this.stepPlayerGravityOnly(p, clampedDt);
      }
      if (this.phaseTimer <= 0) {
        this.setupInbound(this.inboundTeam);
      }
      return;
    }

    if (this.phase === 'quarterBreak') {
      this.phaseTimer -= clampedDt;
      if (this.phaseTimer <= 0) {
        this.quarter++;
        this.clockSec = this.quarter > 4 ? 30 : this.config.quarterSeconds;
        this.resetTipoff();
      }
      return;
    }

    // LIVE PLAY
    this.clockSec = Math.max(0, this.clockSec - clampedDt);
    if (this.ball.mode === 'held' || this.ball.mode === 'pass') {
      this.shotClock -= clampedDt;
      if (this.shotClock <= 0) {
        // Shot clock violation! Turnover to other team
        const turnoverTeam: 0 | 1 = this.ball.lastTouchTeam === 0 ? 1 : 0;
        this.cb.onSound('buzzer');
        this.cb.onAnnounce({ text: 'SHOT CLOCK VIOLATION!', color: '#ff6644' });
        this.setupInbound(turnoverTeam);
        return;
      }
    }

    // End of quarter check (allow in-flight shot to finish for buzzer beaters!)
    if (this.clockSec <= 0 && this.ball.mode !== 'shot') {
      this.handleQuarterEnd();
      return;
    }

    // Compute controls for all 4 players
    const inputs: PlayerControlInput[] = [
      this.emptyInput(),
      this.emptyInput(),
      this.emptyInput(),
      this.emptyInput(),
    ];

    const snapshot = captureGameState(this);

    if (this.config.opponentMode === 'botvsbot') {
      inputs[0] = this.runBot(snapshot, 0, clampedDt, 'solo', null);
      inputs[1] = this.runBot(snapshot, 1, clampedDt, 'teammate', null);
      inputs[2] = this.runBot(snapshot, 2, clampedDt, 'opponent', null);
      inputs[3] = this.runBot(snapshot, 3, clampedDt, 'opponent', null);
    } else {
      // P1 controls p1ControlIdx on Home team
      inputs[this.p1ControlIdx] = p1In;
      const p1Mate = (this.p1ControlIdx === 0 ? 1 : 0) as 0 | 1;
      inputs[p1Mate] = this.runBot(snapshot, p1Mate, clampedDt, 'teammate', p1In);

      if (this.config.opponentMode === 'local2p' || this.config.opponentMode === 'online') {
        inputs[this.p2ControlIdx] = p2In;
        const p2Mate = (this.p2ControlIdx === 2 ? 3 : 2) as 2 | 3;
        inputs[p2Mate] = this.runBot(snapshot, p2Mate, clampedDt, 'teammate', p2In);
      } else {
        inputs[2] = this.runBot(snapshot, 2, clampedDt, 'opponent', null);
        inputs[3] = this.runBot(snapshot, 3, clampedDt, 'opponent', null);
      }
    }

    // Step all 4 players
    for (let i = 0; i < 4; i++) {
      // Alternate which team updates first each tick so neither side gets a built-in edge.
      const k = this.tick % 2 === 0 ? i : (i + 2) % 4;
      this.stepPlayer(this.players[k], inputs[k], clampedDt);
    }

    // Soft player-to-player collision separation
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const a = this.players[i];
        const b = this.players[j];
        if (a.dunk || b.dunk) continue;
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const dist = Math.hypot(dx, dz);
        const minD = 0.72;
        if (dist > 0.001 && dist < minD) {
          const push = (minD - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          a.pos.x -= nx * push;
          a.pos.z -= nz * push;
          b.pos.x += nx * push;
          b.pos.z += nz * push;
        }
      }
    }

    // Step ball
    this.stepBall(clampedDt);
  }

  private emptyInput(): PlayerControlInput {
    return {
      moveX: 0,
      moveZ: 0,
      turbo: false,
      shootDown: false,
      shootPressed: false,
      shootReleased: false,
      passPressed: false,
      fakePressed: false,
    };
  }

  private stepPlayerGravityOnly(p: SimPlayer, dt: number): void {
    if (!p.grounded) {
      p.vel.y -= GRAVITY * dt;
      p.pos.y += p.vel.y * dt;
      if (p.pos.y <= 0) {
        p.pos.y = 0;
        p.vel.y = 0;
        p.grounded = true;
      }
    }
  }

  private stepPlayer(p: SimPlayer, inp: PlayerControlInput, dt: number): void {
    if (p.stealCooldown > 0) p.stealCooldown -= dt;
    if (p.fakeTimer > 0) p.fakeTimer -= dt;
    if (p.fakeCooldown > 0) p.fakeCooldown -= dt;
    if (p.openLookTimer > 0) p.openLookTimer -= dt;
    if (p.shoveTimer > 0) p.shoveTimer -= dt;
    if (p.celebrateTimer > 0) p.celebrateTimer -= dt;

    // Active Dunk Animation!
    if (p.dunk) {
      this.stepDunk(p, dt);
      return;
    }

    // Stunned from a shove!
    if (p.stunTimer > 0) {
      p.stunTimer -= dt;
      p.vel.x *= Math.exp(-5 * dt);
      p.vel.z *= Math.exp(-5 * dt);
      p.pos.x += p.vel.x * dt;
      p.pos.z += p.vel.z * dt;
      this.clampToCourt(p.pos);
      this.stepPlayerGravityOnly(p, dt);
      return;
    }

    // Airborne defenders can swat a shot in flight on any tick (strong, readable blocks).
    if (
      this.bal.shotBlockAirborneScan &&
      !p.grounded &&
      this.ball.mode === 'shot' &&
      this.ball.shooter !== null &&
      this.players[this.ball.shooter].team !== p.team
    ) {
      this.tryBlockShot(p);
    }

    // Turbo regeneration & usage
    const moving = Math.hypot(inp.moveX, inp.moveZ) > 0.1;
    const usingTurbo = inp.turbo && (p.onFire || p.turbo > 2);
    if (usingTurbo && moving) {
      const drain = p.onFire ? 32 * this.bal.fireTurboDrainScale : 32;
      if (drain > 0) p.turbo = Math.max(0, p.turbo - drain * dt);
    } else {
      p.turbo = Math.min(100, p.turbo + 18 * dt);
    }

    // Movement speed derived from Speed stat
    const baseSpeed = 4.6 + (p.profile.stats.speed / 10) * 0.34;
    const speedMul = usingTurbo ? 1.48 : 1.0;
    const carryMul = this.ball.carrier === p.index ? 0.96 : 1.0;
    const fakeMul = p.fakeTimer > 0 ? this.bal.fakeMoveScale : 1;
    const moveSpeed = baseSpeed * speedMul * carryMul * this.bal.moveSpeedScale * fakeMul;

    if (p.grounded) {
      const targetVx = inp.moveX * moveSpeed;
      const targetVz = inp.moveZ * moveSpeed;
      const accel = 1 - Math.exp(-15 * dt);
      p.vel.x += (targetVx - p.vel.x) * accel;
      p.vel.z += (targetVz - p.vel.z) * accel;
    } else {
      // Slight air control
      p.vel.x += inp.moveX * 4.5 * dt;
      p.vel.z += inp.moveZ * 4.5 * dt;
    }

    p.pos.x += p.vel.x * dt;
    p.pos.z += p.vel.z * dt;
    this.clampToCourt(p.pos);

    // Facing direction
    if (Math.hypot(p.vel.x, p.vel.z) > 0.35 && !p.isShooting) {
      p.facing = Math.atan2(p.vel.x, p.vel.z);
    } else if (this.ball.carrier === p.index) {
      const hx = this.targetHoopX(p.team);
      p.facing = Math.atan2(hx - p.pos.x, 0 - p.pos.z);
    }

    // Gravity
    if (!p.grounded) {
      p.vel.y -= GRAVITY * dt;
      p.pos.y += p.vel.y * dt;
      if (p.pos.y <= 0) {
        p.pos.y = 0;
        p.vel.y = 0;
        p.grounded = true;
        if (p.isShooting && this.ball.carrier === p.index) {
          // Auto-release if landed without releasing
          this.releaseJumpShot(p, 0.5);
        }
        p.isShooting = false;
        p.shootHold = 0;
      }
    }

    const hasBall = this.ball.carrier === p.index;
    const teamHasBall =
      this.ball.carrier !== null && this.players[this.ball.carrier].team === p.team;

    // OFFENSE WITH BALL: Shoot / Dunk / Pass
    if (hasBall) {
      if (inp.fakePressed && p.grounded && !p.isShooting && p.fakeCooldown <= 0) {
        this.startFake(p);
      }
      if (inp.shootPressed && p.grounded) {
        p.fakeTimer = 0;
        const hx = this.targetHoopX(p.team);
        const distToHoop = Math.hypot(hx - p.pos.x, p.pos.z);
        const dunkReach =
          this.bal.dunkBaseReach +
          (p.profile.stats.dunk / 10) * 0.24 +
          (usingTurbo ? this.bal.dunkTurboReachBonus : 0) +
          (p.onFire ? this.bal.dunkFireReachBonus : 0);
        const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
        const mate = this.players[mateIdx];
        const mateClose = mate.grounded && mate.stunTimer <= 0 && p.pos.distanceTo(mate.pos) < 2.3;

        if (
          usingTurbo &&
          mateClose &&
          distToHoop <= 8.2 &&
          (distToHoop > dunkReach || (p.pos.distanceTo(mate.pos) < 1.8 && Math.random() < 0.55))
        ) {
          this.startPartnerLaunchDunk(p, mate);
          return;
        }

        if (distToHoop <= dunkReach) {
          this.startDunk(p, usingTurbo);
          return;
        } else {
          // Jump shot!
          p.grounded = false;
          p.vel.y = 7.4 + (usingTurbo ? 0.9 : 0);
          p.vel.x *= 0.35;
          p.vel.z *= 0.35;
          p.facing = Math.atan2(hx - p.pos.x, -p.pos.z);
          p.isShooting = true;
          p.shootHold = 0.01;
        }
      }

      if (p.isShooting) {
        p.shootHold += dt;
        // Release when button let go, OR automatically right after jump apex (makes tapping feel awesome!)
        if (inp.shootReleased || (p.vel.y < -0.6 && p.shootHold > 0.18)) {
          // Peak of jump (vel.y near 0) is ideal timing!
          const timingQuality = Math.max(0, 1 - Math.abs(p.vel.y) / 7.5);
          const earlyPenalty = p.shootHold < 0.14 ? this.bal.earlyReleasePenalty : 0;
          this.releaseJumpShot(p, timingQuality, earlyPenalty);
          p.isShooting = false;
          p.shootHold = 0;
        }
      }

      if (inp.passPressed && !p.dunk) {
        this.throwPass(p, usingTurbo);
      }
    } else if (teamHasBall) {
      // OFF-BALL OFFENSE: Jump for Alley-Oop, or Partner-Launch the ball carrier!
      const carrier = this.ball.carrier !== null ? this.players[this.ball.carrier] : null;
      const hx = this.targetHoopX(p.team);
      if (
        usingTurbo &&
        inp.passPressed &&
        p.grounded &&
        carrier &&
        carrier.grounded &&
        !carrier.dunk &&
        p.pos.distanceTo(carrier.pos) < 2.3 &&
        Math.hypot(hx - carrier.pos.x, carrier.pos.z) <= 8.2
      ) {
        this.startPartnerLaunchDunk(carrier, p);
        return;
      }

      if (inp.shootPressed && p.grounded) {
        p.grounded = false;
        p.vel.y = 8.8 + (usingTurbo ? 1.0 : 0);
        const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
        const distHoop = Math.hypot(rimX - p.pos.x, p.pos.z);
        if (distHoop < 6.5 && distHoop > 0.4) {
          // Drift toward the rim for an alley-oop catch!
          const dx = (rimX - p.pos.x) / distHoop;
          const dz = -p.pos.z / distHoop;
          p.vel.x = dx * Math.min(5.2, distHoop * 1.4);
          p.vel.z = dz * Math.min(5.2, distHoop * 1.4);
        }
      }
    } else {
      // DEFENSE / LOOSE BALL: Block/Rebound or Steal/Shove!
      if (inp.shootPressed && p.grounded) {
        p.grounded = false;
        p.vel.y = 8.2 + (p.profile.stats.defense / 10) * 0.22 + (usingTurbo ? 1.2 : 0);
        this.tryBlockShot(p);
        const faker = this.fakeLiveCarrier(p);
        if (faker) this.resolveBite(p, faker);
      }

      if (inp.passPressed && p.stealCooldown <= 0) {
        this.tryStealOrShove(p, usingTurbo);
      }
    }
  }

  private startPartnerLaunchDunk(dunker: SimPlayer, launcher: SimPlayer): void {
    const hx = this.targetHoopX(dunker.team);
    launcher.shoveTimer = 0.45;
    launcher.vel.set(0, 0, 0);
    launcher.facing = Math.atan2(hx - launcher.pos.x, -launcher.pos.z);
    if (!launcher.onFire) launcher.turbo = Math.max(0, launcher.turbo - 20);
    this.cb.onSound('shove');
    this.cb.onBurst(dunker.pos.clone().add(new THREE.Vector3(0, 0.4, 0)), 'dust');
    this.cb.onBurst(dunker.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), 'confetti');
    this.cb.onCameraPunch(0.35);
    this.startDunk(dunker, true, 'partnerLaunch', launcher.index);
  }

  private startDunk(
    p: SimPlayer,
    usingTurbo: boolean,
    forcedStyle?: DunkStyle,
    launcherIdx?: number,
  ): void {
    const hx = this.targetHoopX(p.team);
    const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
    const dist = Math.hypot(rimX - p.pos.x, p.pos.z);

    // Choose a fun NBA Jam dunk style!
    let style: DunkStyle = forcedStyle ?? 'tomahawk';
    if (!forcedStyle) {
      if (p.onFire) {
        style = 'meteor';
      } else if (dist > 3.6 || (usingTurbo && Math.random() < 0.55)) {
        const flashy: DunkStyle[] = ['frontflip', 'helicopter360', 'windmill', 'spin720'];
        style = flashy[Math.floor(Math.random() * flashy.length)];
      } else {
        const standard: DunkStyle[] = ['tomahawk', 'windmill', 'helicopter360', 'spin720'];
        style = standard[Math.floor(Math.random() * standard.length)];
      }
    }

    const dur =
      style === 'partnerLaunch'
        ? Math.max(0.62, Math.min(0.95, 0.48 + dist * 0.065))
        : Math.max(0.46, Math.min(0.78, 0.36 + dist * 0.075));
    const peakY =
      style === 'partnerLaunch'
        ? 5.4
        : style === 'meteor'
          ? 4.4
          : style === 'frontflip' || style === 'spin720'
            ? 4.1
            : style === 'backboard' || style === 'alleyOop'
              ? 3.85
              : 3.55;

    p.grounded = false;
    p.isShooting = false;
    p.shootHold = 0;
    p.facing = Math.atan2(rimX - p.pos.x, -p.pos.z);
    p.dunk = {
      style,
      startX: p.pos.x,
      startZ: p.pos.z,
      targetX: rimX,
      targetZ: 0,
      t: 0,
      duration: dur,
      peakY,
      scored: false,
      launcherIdx,
    };

    if (!p.onFire && usingTurbo) p.turbo = Math.max(0, p.turbo - 18);

    const callouts: Record<DunkStyle, string> = {
      tomahawk: 'MONSTER JAM!',
      helicopter360: '360 HELICOPTER!',
      frontflip: 'CANNONBALL FLIP!',
      windmill: 'WINDMILL SLAM!',
      meteor: 'METEOR FLAME DUNK!',
      spin720: 'TORNADO 720° SLAM!',
      alleyOop: 'ALLEY-OOP SLAM!',
      backboard: 'OFF THE GLASS SLAM!',
      partnerLaunch: 'PARTNER LAUNCH DUNK!!',
    };
    const subtext =
      style === 'partnerLaunch' && launcherIdx !== undefined
        ? `${this.players[launcherIdx].profile.name} CATAPULTS ${p.profile.name}!`
        : p.profile.name.toUpperCase();
    this.cb.onAnnounce({
      text: callouts[style],
      subtext,
      color:
        style === 'meteor'
          ? '#ff6a00'
          : style === 'partnerLaunch'
            ? '#ff44ff'
            : style === 'backboard' || style === 'alleyOop'
              ? '#44ffcc'
              : '#ffd21f',
      big: true,
    });
    this.excitement = Math.min(1, this.excitement + (style === 'partnerLaunch' ? 0.65 : 0.45));
  }

  private stepDunk(p: SimPlayer, dt: number): void {
    const d = p.dunk!;
    d.t += dt;
    const u = Math.min(1, d.t / d.duration);

    // Smooth parabolic leap toward rim
    p.pos.x = d.startX + (d.targetX - d.startX) * u;
    p.pos.z = d.startZ + (d.targetZ - d.startZ) * u;
    p.pos.y = Math.sin(u * Math.PI) * (d.peakY - 0.5) + u * (HOOP_Y - 0.85) * (1 - u * 0.3);
    p.facing = Math.atan2(d.targetX - d.startX, d.targetZ - d.startZ);

    // On-fire dunks are only stoppable when dunkFireContestable is set, at half the chance.
    const contestable = !p.onFire || this.bal.dunkFireContestable;
    const fireScale = p.onFire ? 0.5 : 1;

    // Windup: a grounded defender close to the dunker during the gather can strip it (rolled once per dunk).
    if (contestable && this.bal.dunkWindupSec > 0 && d.t < this.bal.dunkWindupSec && !d.windupRolled) {
      for (const opp of this.players) {
        if (opp.team === p.team || !opp.grounded || opp.stunTimer > 0) continue;
        if (opp.pos.distanceTo(p.pos) < 1.4) {
          d.windupRolled = true;
          // Fixed 50% strip chance: the windup has no tuned knob of its own.
          if (Math.random() < 0.5) {
            this.failDunk(p, opp, 'STRIPPED!', `${opp.profile.name} STRIPS IT!`, false);
            return;
          }
          break;
        }
      }
    }

    // Contest: defenders near the flight path in the second half each roll once to foul up the dunk.
    if (contestable && this.bal.dunkContestRadius > 0 && u >= 0.5 && u < 1 && !d.scored) {
      if (!d.contestRolled) d.contestRolled = [];
      for (const opp of this.players) {
        if (opp.team === p.team || d.contestRolled.includes(opp.index)) continue;
        const horiz = Math.hypot(opp.pos.x - p.pos.x, opp.pos.z - p.pos.z);
        if (horiz >= this.bal.dunkContestRadius) continue;
        d.contestRolled.push(opp.index);
        const chance =
          Math.min(0.85, this.bal.dunkContestFailChance + (opp.profile.stats.defense / 100) * 0.3) * fireScale;
        if (Math.random() < chance) {
          this.failDunk(p, opp, 'REJECTED!', `${opp.profile.name} SAYS NO!`, true);
          return;
        }
      }
    }

    // Check if defender swatted the dunk right at the rim!
    if (u > 0.65 && u < 0.88 && !d.scored && contestable) {
      for (const opp of this.players) {
        if (opp.team === p.team || opp.grounded || opp.stunTimer > 0) continue;
        const dist = opp.pos.distanceTo(p.pos);
        if (
          dist < 1.25 &&
          opp.pos.y > 1.4 &&
          Math.random() < (this.bal.dunkBlockBaseChance + (opp.profile.stats.defense / 10) * 0.012) * fireScale
        ) {
          this.failDunk(p, opp, 'REJECTED!', `${opp.profile.name} SAYS NO!`, true);
          return;
        }
      }
    }

    if (u >= 1 && !d.scored) {
      d.scored = true;
      p.dunk = null;
      p.vel.set((p.team === 0 ? -1 : 1) * 1.4, -2, 0);
      p.box.fga++;
      p.box.fgm++;
      p.box.dunks++;
      this.ball.carrier = null;
      this.ball.pos.set(d.targetX, HOOP_Y - 0.1, 0);
      this.ball.mode = 'loose';
      this.cb.onSound(p.onFire ? 'dunkFire' : 'dunk');
      this.cb.onRimShake(p.team === 0 ? 'right' : 'left', p.onFire ? 1.5 : 1.0);
      this.cb.onCameraPunch(p.onFire ? 0.9 : 0.55);
      this.cb.onBurst(new THREE.Vector3(d.targetX, HOOP_Y, 0), p.onFire ? 'fire' : 'confetti');
      if (p.team === 0) this.emitAchievement('dunk');
      if (this.bal.dunkLandingRecoverySec > 0) {
        p.stunTimer = Math.max(p.stunTimer, this.bal.dunkLandingRecoverySec);
      }
      this.scoreBasket(p, 2, true);
    }
  }

  /**
   * A dunk is stopped by a defender (rejected, or stripped during the windup):
   * the dunker loses the attempt and the ball goes loose.
   */
  private failDunk(p: SimPlayer, opp: SimPlayer, text: string, subtext: string, isBlock: boolean): void {
    p.dunk = null;
    p.vel.set((p.team === 0 ? -1 : 1) * 4, 2, (Math.random() - 0.5) * 3);
    p.box.fga++;
    if (isBlock) opp.box.blocks++;
    else opp.box.steals++;
    this.ball.carrier = null;
    this.ball.mode = 'loose';
    this.ball.vel.set((p.team === 0 ? -1 : 1) * 6.5, 5.5, (Math.random() - 0.5) * 5);
    this.cb.onSound(isBlock ? 'block' : 'shove');
    this.cb.onCameraPunch(0.45);
    this.cb.onAnnounce({ text, subtext, color: '#44ccff', big: true });
  }

  private releaseJumpShot(p: SimPlayer, timingQuality: number, earlyPenalty = 0): void {
    const hx = this.targetHoopX(p.team);
    const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
    const dist = Math.hypot(rimX - p.pos.x, p.pos.z);
    const isThree = dist >= THREE_PT_RADIUS;

    // A jumping defender right at the release can swat it (not if the shooter has a fake-created open look).
    if (this.bal.shotBlockReleaseScale > 0 && p.openLookTimer <= 0) {
      for (const opp of this.players) {
        if (opp.team === p.team || opp.stunTimer > 0 || opp.grounded || opp.pos.y < 0.45) continue;
        const dd = Math.hypot(opp.pos.x - p.pos.x, opp.pos.z - p.pos.z);
        const blockChance = (0.12 + (opp.profile.stats.defense / 100) * 0.22) * this.bal.shotBlockReleaseScale;
        if (dd < 1.7 && Math.random() < blockChance) {
          p.box.fga++;
          if (isThree) p.box.tpa++;
          opp.box.blocks++;
          this.ball.carrier = null;
          this.ball.mode = 'loose';
          this.ball.vel.set((p.team === 0 ? 1 : -1) * 4.5, 4.0, (Math.random() - 0.5) * 4);
          this.ball.pickupLock = 0.25;
          this.cb.onSound('block');
          this.cb.onCameraPunch(0.35);
          this.cb.onAnnounce({ text: 'SWATTED AWAY!', subtext: opp.profile.name, color: '#44ccff' });
          return;
        }
      }
    }

    // Check closest defender contest
    let contest = 0;
    for (const opp of this.players) {
      if (opp.team === p.team || opp.stunTimer > 0) continue;
      const d = Math.hypot(opp.pos.x - p.pos.x, opp.pos.z - p.pos.z);
      if (d < 2.2) {
        const jumpBonus = !opp.grounded ? 0.16 : 0.06;
        contest = Math.max(contest, (1 - d / 2.2) * (0.14 + (opp.profile.stats.defense / 10) * 0.018) + jumpBonus);
      }
    }
    contest *= this.bal.contestScale;
    let openBonus = 0;
    if (p.openLookTimer > 0) {
      contest = 0;
      openBonus = this.bal.fakeOpenShotBonus;
      p.openLookTimer = 0;
    }

    const baseChance = isThree
      ? this.bal.threeBaseChance + (p.profile.stats.threePt / 10) * this.bal.threeStatScale
      : this.bal.twoBaseChance + (p.profile.stats.threePt / 10) * this.bal.twoStatScale;
    const timingBonus = timingQuality * this.bal.timingBonusMax;
    const fireBonus = p.onFire ? this.bal.fireShotBonus : 0;
    const distPenalty = Math.max(0, (dist - 8.5) * 0.045);
    const chance = Math.max(0.08, Math.min(0.96, baseChance + timingBonus + fireBonus + openBonus - contest - distPenalty - earlyPenalty));

    const willScore = Math.random() < chance;
    p.box.fga++;
    if (isThree) p.box.tpa++;

    this.ball.carrier = null;
    this.ball.mode = 'shot';
    this.ball.blockRolled = [];
    this.ball.shooter = p.index;
    this.ball.isThreeAttempt = isThree;
    this.ball.willScore = willScore;
    this.ball.shotStartX = p.pos.x;
    this.ball.shotStartZ = p.pos.z;
    this.ball.startPos.set(p.pos.x, p.pos.y + 1.25, p.pos.z);
    this.ball.endPos.set(rimX, HOOP_Y + 0.05, 0);
    this.ball.flightT = 0;
    this.ball.flightDur = Math.max(0.52, Math.min(1.15, 0.42 + dist * 0.065));
    this.ball.arcPeak = Math.max(HOOP_Y + 1.4, HOOP_Y + dist * 0.28);
    this.ball.onFire = p.onFire;
    this.ball.lastTouchTeam = p.team;

    this.cb.onSound('pass');
  }

  private throwPass(p: SimPlayer, usingTurbo = false): void {
    const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
    const mate = this.players[mateIdx];
    p.fakeTimer = 0;

    const hx = this.targetHoopX(p.team);
    const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
    const myDistHoop = Math.hypot(rimX - p.pos.x, p.pos.z);
    const mateDistHoop = Math.hypot(rimX - mate.pos.x, mate.pos.z);

    // Self-lob off the backboard when driving/airborne near the hoop with Turbo+Pass (or airborne Pass)
    if (
      (usingTurbo || !p.grounded) &&
      myDistHoop < 6.8 &&
      (mateDistHoop > myDistHoop + 0.6 || mateDistHoop > 6.5)
    ) {
      this.throwBackboardLob(p);
      return;
    }

    // Alley-oop lob to teammate if they're airborne near hoop OR we hold Turbo+Pass while they're in range!
    const isAlleyOop = (!mate.grounded && mateDistHoop < 5.8) || (usingTurbo && mateDistHoop < 7.2);

    if (isAlleyOop && mate.grounded) {
      // Launch teammate toward the rim to meet the alley-oop!
      mate.grounded = false;
      mate.vel.y = 8.6;
      const dx = rimX - mate.pos.x;
      const dz = -mate.pos.z;
      const d = Math.max(0.1, Math.hypot(dx, dz));
      mate.vel.x = (dx / d) * Math.min(6.4, d * 1.8);
      mate.vel.z = (dz / d) * Math.min(6.4, d * 1.8);
    }

    this.ball.carrier = null;
    this.ball.mode = 'pass';
    this.ball.passTarget = mateIdx;
    this.ball.shooter = p.index;
    this.ball.isAlleyOop = isAlleyOop;
    this.ball.isBackboardLob = false;
    this.ball.startPos.copy(this.ball.pos);
    this.ball.endPos.set(mate.pos.x, mate.pos.y + (isAlleyOop ? 1.5 : 0.9), mate.pos.z);
    const dist = this.ball.startPos.distanceTo(this.ball.endPos);
    this.ball.flightT = 0;
    this.ball.flightDur =
      (isAlleyOop ? Math.max(0.28, Math.min(0.6, dist / 15)) : Math.max(0.2, Math.min(0.55, dist / 18))) *
      this.bal.passFlightScale;
    this.ball.arcPeak = Math.max(this.ball.startPos.y, this.ball.endPos.y) + (isAlleyOop ? 1.9 : 0.45);
    this.ball.lastTouchTeam = p.team;
    this.cb.onSound('pass');
    this.rollPassIntercept(p, isAlleyOop);

    if (isAlleyOop) {
      this.cb.onAnnounce({ text: 'ALLEY-OOP!', color: '#44ffcc', big: true });
    }
  }

  /** A defender standing on the pass line may pick the pass off; lobs are harder unless the defender is at the rim. */
  private rollPassIntercept(p: SimPlayer, isAlleyOop: boolean): void {
    const b = this.ball;
    b.interceptBy = null;
    b.interceptU = 1;
    if (this.bal.passInterceptChance <= 0) return;
    const ax = b.startPos.x;
    const az = b.startPos.z;
    const dx = b.endPos.x - ax;
    const dz = b.endPos.z - az;
    const len2 = Math.max(0.0001, dx * dx + dz * dz);
    let best: SimPlayer | null = null;
    let bestChance = 0;
    let bestT = 0.5;
    for (const opp of this.players) {
      if (opp.team === p.team || opp.stunTimer > 0 || opp.dunk) continue;
      const t = Math.max(0.15, Math.min(0.85, ((opp.pos.x - ax) * dx + (opp.pos.z - az) * dz) / len2));
      const cx = ax + dx * t;
      const cz = az + dz * t;
      const d = Math.hypot(opp.pos.x - cx, opp.pos.z - cz);
      if (d >= this.bal.passInterceptRadius) continue;
      let c = this.bal.passInterceptChance * (1 - d / this.bal.passInterceptRadius) + (opp.profile.stats.defense / 100) * 0.12;
      if (isAlleyOop) {
        const rimD = Math.hypot(this.targetHoopX(p.team) - opp.pos.x, opp.pos.z);
        if (rimD > 2.2) c *= this.bal.alleyOopInterceptScale;
      }
      if (c > bestChance) {
        bestChance = c;
        best = opp;
        bestT = t;
      }
    }
    if (best && Math.random() < bestChance) {
      b.interceptBy = best.index;
      b.interceptU = bestT;
    }
  }

  private throwBackboardLob(p: SimPlayer): void {
    const side = p.team === 0 ? 1 : -1;
    const hx = this.targetHoopX(p.team);
    const boardX = side * (HOOP_X + 0.22);

    this.ball.carrier = null;
    this.ball.mode = 'pass';
    this.ball.passTarget = p.index;
    this.ball.shooter = p.index;
    this.ball.isAlleyOop = false;
    this.ball.isBackboardLob = true;
    this.ball.startPos.copy(this.ball.pos);
    this.ball.endPos.set(boardX, HOOP_Y + 0.35, 0);
    const dist = this.ball.startPos.distanceTo(this.ball.endPos);
    this.ball.flightT = 0;
    this.ball.flightDur = Math.max(0.24, Math.min(0.45, dist / 16));
    this.ball.arcPeak = Math.max(this.ball.startPos.y, HOOP_Y + 0.65) + 0.3;
    this.ball.lastTouchTeam = p.team;

    if (p.grounded) {
      p.grounded = false;
      p.vel.y = 10.2;
    }
    const targetX = hx - side * 1.15;
    const dx = targetX - p.pos.x;
    const dz = -p.pos.z;
    const d = Math.max(0.1, Math.hypot(dx, dz));
    p.vel.x = (dx / d) * Math.min(7.2, d * 2.3);
    p.vel.z = (dz / d) * Math.min(7.2, d * 2.3);
    p.facing = Math.atan2(hx - p.pos.x, -p.pos.z);

    this.cb.onSound('pass');
    this.cb.onAnnounce({ text: 'OFF THE GLASS!', color: '#ffdd44', big: true });
  }

  private tryBlockShot(p: SimPlayer): void {
    if (this.ball.mode !== 'shot') return;
    if (this.ball.flightT / this.ball.flightDur > 0.72) return; // no goaltending on way down
    const dist = p.pos.distanceTo(this.ball.pos);
    if (dist < this.bal.shotBlockReach) {
      if (this.bal.shotBlockBaseChance < 1) {
        if (this.ball.blockRolled.includes(p.index)) return;
        this.ball.blockRolled.push(p.index);
        const chance = Math.min(0.9, this.bal.shotBlockBaseChance + (p.profile.stats.defense / 100) * 0.25);
        if (Math.random() >= chance) return;
      }
      p.box.blocks++;
      this.ball.mode = 'loose';
      this.ball.vel.set((p.team === 0 ? 1 : -1) * 5.5, 4.5, (Math.random() - 0.5) * 5);
      this.ball.pickupLock = 0.25;
      this.cb.onSound('block');
      this.cb.onCameraPunch(0.35);
      this.cb.onAnnounce({ text: 'SWATTED AWAY!', subtext: p.profile.name, color: '#44ccff' });
    }
  }

  private tryStealOrShove(p: SimPlayer, usingTurbo: boolean): void {
    p.stealCooldown = this.bal.shoveCooldownSec;
    p.shoveTimer = 0.22;
    if (p.fakeTimer > 0) p.fakeTimer = 0;

    // Find nearest opponent within reach
    let target: SimPlayer | null = null;
    let bestD = 1.65;
    for (const opp of this.players) {
      if (opp.team === p.team || opp.dunk || opp.stunTimer > 0) continue;
      const d = Math.hypot(opp.pos.x - p.pos.x, opp.pos.z - p.pos.z);
      if (d < bestD) {
        bestD = d;
        target = opp;
      }
    }

    if (!target) {
      p.stealCooldown = this.bal.shoveWhiffCooldownSec;
      // On defense with no opponent nearby, pressing Pass switches control to teammate!
      if (p.index === this.p1ControlIdx) {
        this.p1ControlIdx = p.index === 0 ? 1 : 0;
      } else if ((this.config.opponentMode === 'local2p' || this.config.opponentMode === 'online') && p.index === this.p2ControlIdx) {
        this.p2ControlIdx = p.index === 2 ? 3 : 2;
      }
      return;
    }

    const dx = target.pos.x - p.pos.x;
    const dz = target.pos.z - p.pos.z;
    const len = Math.max(0.01, Math.hypot(dx, dz));
    p.facing = Math.atan2(dx, dz);

    // The inbound holder is protected for a few seconds so the offence can reposition (clocks keep running).
    if (this.ball.carrier === target.index && this.inboundProtectT > 0) {
      this.cb.onSound('bounce');
      return;
    }

    // Fake in progress: a defender who lunges either bites (and is burned) or reads it.
    const fakeLive = this.ball.carrier === target.index && target.fakeTimer > 0;
    if (fakeLive && this.resolveBite(p, target)) return;

    if (usingTurbo) {
      // Classic NBA Jam SHOVE!
      if (!p.onFire) p.turbo = Math.max(0, p.turbo - this.bal.shoveTurboCost);
      target.stunTimer = this.bal.shoveStunSec;
      target.vel.set((dx / len) * 8.5, 3.2, (dz / len) * 8.5);
      target.grounded = false;
      this.cb.onSound('shove');
      this.cb.onBurst(target.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 'dust');
      this.cb.onCameraPunch(0.25);

      if (this.ball.carrier === target.index && Math.random() < this.bal.shoveTurnoverChance) {
        p.box.steals++;
        if (this.bal.shoveKnocksLoose) {
          this.ball.carrier = null;
          this.ball.mode = 'loose';
          this.ball.vel.set((dx / len) * 5.0, 3.6, (dz / len) * 5.0);
          this.ball.pickupLock = 0.25;
        } else {
          this.giveBallTo(p.index);
          this.shotClock = SHOT_CLOCK_MAX;
        }
        this.cb.onAnnounce({ text: 'CRUNCHING SHOVE!', subtext: 'TURNOVER!', color: '#ff8844' });
      }
    } else if (this.ball.carrier === target.index) {
      // Quick steal poke!
      // Stealing from the front (carrier shields the ball) is hard; from behind is easier; a sprinting carrier is harder to poke.
      const toThiefX = p.pos.x - target.pos.x;
      const toThiefZ = p.pos.z - target.pos.z;
      const tl = Math.max(0.01, Math.hypot(toThiefX, toThiefZ));
      const facing = (Math.sin(target.facing) * toThiefX + Math.cos(target.facing) * toThiefZ) / tl;
      const angleScale = facing > 0.5 ? this.bal.stealFrontScale : facing < -0.3 ? this.bal.stealBackScale : 1;
      const turboScale = Math.hypot(target.vel.x, target.vel.z) > 6.2 ? this.bal.stealTurboCarrierScale : 1;
      const stealChance =
        (this.bal.stealBaseChance + (p.profile.stats.defense / 10) * this.bal.stealDefenseScale) * angleScale * turboScale +
        (fakeLive ? this.bal.fakeReadStealBonus : 0);
      if (Math.random() < stealChance) {
        if (fakeLive) this.fakeStats.reads[p.team]++;
        p.box.steals++;
        this.giveBallTo(p.index);
        this.shotClock = SHOT_CLOCK_MAX;
        this.cb.onSound('pass');
        this.cb.onAnnounce({ text: 'PICKPOCKET!', subtext: `${p.profile.name} STEALS!`, color: '#44ff88' });
      } else {
        this.cb.onSound('bounce');
        // Reaching in and missing leaves the defender off balance.
        if (this.bal.stealWhiffStunSec > 0) p.stunTimer = Math.max(p.stunTimer, this.bal.stealWhiffStunSec);
      }
    }
  }

  /** Start a pump fake: the carrier rises with the ball, slowed, and any defender who bites is burned. */
  private startFake(p: SimPlayer): void {
    p.fakeTimer = this.bal.fakeDurationSec;
    p.fakeCooldown = this.bal.fakeCooldownSec + this.bal.fakeDurationSec;
    this.fakeStats.fakes[p.team]++;
    this.cb.onSound('bounce');
  }

  /** The ball-carrier of the other team if they are mid-fake and within fake radius of def. */
  private fakeLiveCarrier(def: SimPlayer): SimPlayer | null {
    const c = this.ball.carrier !== null ? this.players[this.ball.carrier] : null;
    if (!c || c.team === def.team || c.fakeTimer <= 0) return null;
    return Math.hypot(c.pos.x - def.pos.x, c.pos.z - def.pos.z) <= this.bal.fakeRadius ? c : null;
  }

  /** A defender jumps or lunges during a fake. Returns true if they bit (stunned, shooter gets an open look). */
  private resolveBite(def: SimPlayer, carrier: SimPlayer): boolean {
    const chance = Math.max(
      0.05,
      Math.min(0.95, this.bal.fakeBiteBaseChance - (def.profile.stats.defense / 100) * this.bal.fakeBiteDefenseScale),
    );
    if (Math.random() >= chance) return false;
    def.stunTimer = Math.max(def.stunTimer, this.bal.fakeBiteStunSec);
    carrier.openLookTimer = this.bal.fakeOpenWindowSec;
    carrier.fakeTimer = 0;
    this.fakeStats.bites[carrier.team]++;
    this.cb.onSound('bounce');
    this.cb.onAnnounce({ text: 'BITES ON THE FAKE!', subtext: def.profile.name, color: '#ffd21f' });
    return true;
  }

  private stepBall(dt: number): void {
    const b = this.ball;
    if (b.pickupLock > 0) b.pickupLock -= dt;
    if (this.inboundProtectT > 0) this.inboundProtectT -= dt;
    b.spin += dt * 9;

    if (b.mode === 'held' && b.carrier !== null) {
      const p = this.players[b.carrier];
      const fx = Math.sin(p.facing);
      const fz = Math.cos(p.facing);
      if (p.dunk) {
        // Ball held high in dunking hand!
        b.pos.set(p.pos.x + fx * 0.32, p.pos.y + 1.38, p.pos.z + fz * 0.32);
      } else if (p.isShooting || !p.grounded || p.fakeTimer > 0) {
        b.pos.set(p.pos.x + fx * 0.25, p.pos.y + 1.25, p.pos.z + fz * 0.25);
      } else {
        // Bouncing dribble!
        const speed = Math.hypot(p.vel.x, p.vel.z);
        const rate = 6.5 + speed * 0.65;
        const prevSin = Math.sin(this.dribbleTick);
        this.dribbleTick += dt * rate;
        const curSin = Math.sin(this.dribbleTick);
        if (prevSin > 0 && curSin <= 0 && speed > 0.6) {
          this.cb.onSound('bounce');
        }
        const bounceH = 0.16 + Math.abs(curSin) * 0.68;
        // Offset to right hand
        const rx = fz;
        const rz = -fx;
        b.pos.set(p.pos.x + fx * 0.42 + rx * 0.22, bounceH, p.pos.z + fz * 0.42 + rz * 0.22);
      }
      return;
    }

    if (b.mode === 'pass' && b.passTarget !== null) {
      const target = this.players[b.passTarget];
      if (!b.isBackboardLob) {
        b.endPos.set(target.pos.x, target.pos.y + (b.isAlleyOop ? 1.3 : 0.95), target.pos.z);
      }
      b.flightT += dt;
      const u = Math.min(1, b.flightT / b.flightDur);
      b.pos.lerpVectors(b.startPos, b.endPos, u);
      b.pos.y += Math.sin(u * Math.PI) * (b.arcPeak - Math.max(b.startPos.y, b.endPos.y));

      if (b.interceptBy !== null && u >= b.interceptU && !b.isBackboardLob) {
        const thief = this.players[b.interceptBy];
        b.interceptBy = null;
        thief.box.steals++;
        this.giveBallTo(thief.index);
        this.shotClock = SHOT_CLOCK_MAX;
        this.cb.onSound('pass');
        this.cb.onAnnounce({ text: 'PICKED OFF!', subtext: thief.profile.name, color: '#44ff88' });
        return;
      }

      if (u >= 1) {
        if (b.isBackboardLob) {
          // Ball smacks the backboard and rebounds into the air for a spike dunk!
          const side: -1 | 1 = b.endPos.x >= 0 ? 1 : -1;
          b.mode = 'loose';
          b.isBackboardLob = false;
          b.pickupLock = 0.02;
          b.vel.set(-side * 4.2, 0.8, 0);
          this.cb.onSound('clang');
          this.cb.onRimShake(side === 1 ? 'right' : 'left', 0.45);
          this.cb.onBurst(b.pos.clone(), 'dust');
          return;
        }
        const wasAlleyOop = b.isAlleyOop;
        this.giveBallTo(b.passTarget);
        // If teammate caught it airborne near the hoop (or on an alley-oop lob), auto-trigger Alley-Oop Dunk!
        const hx = this.targetHoopX(target.team);
        if ((!target.grounded || wasAlleyOop) && Math.hypot(hx - target.pos.x, target.pos.z) < 5.8) {
          this.startDunk(target, true, 'alleyOop');
        }
      }
      return;
    }

    if (b.mode === 'shot') {
      b.flightT += dt;
      const u = Math.min(1, b.flightT / b.flightDur);
      b.pos.lerpVectors(b.startPos, b.endPos, u);
      const baseLineY = b.startPos.y + (b.endPos.y - b.startPos.y) * u;
      const extraH = Math.max(0.8, b.arcPeak - Math.max(b.startPos.y, b.endPos.y));
      b.pos.y = baseLineY + Math.sin(u * Math.PI) * extraH;

      if (u >= 1) {
        const shooter = b.shooter !== null ? this.players[b.shooter] : this.players[0];
        if (b.willScore) {
          const pts = b.isThreeAttempt ? 3 : 2;
          shooter.box.fgm++;
          if (b.isThreeAttempt) shooter.box.tpm++;
          this.cb.onSound(b.isThreeAttempt ? 'swish3' : 'swish');
          this.cb.onRimShake(shooter.team === 0 ? 'right' : 'left', 0.35);
          if (b.isThreeAttempt) {
            this.cb.onBurst(b.endPos.clone(), 'confetti');
            if (shooter.team === 0) this.emitAchievement('three');
          }
          this.scoreBasket(shooter, pts, false);
        } else {
          // Rim clang or backboard rebound -> loose ball!
          const side: -1 | 1 = shooter.team === 0 ? 1 : -1;
          this.cb.onSound('clang');
          this.cb.onRimShake(side === 1 ? 'right' : 'left', 0.5);
          b.mode = 'loose';
          b.pickupLock = 0.16;
          if (Math.random() < 0.45) {
            // Bank hard off the backboard for a high rebound!
            b.pos.set(side * (HOOP_X + 0.15), HOOP_Y + 0.45, (Math.random() - 0.5) * 0.4);
            b.vel.set(-side * (3.0 + Math.random() * 2.6), 3.6 + Math.random() * 1.8, (Math.random() - 0.5) * 3.2);
          } else {
            b.vel.set(-side * (2.5 + Math.random() * 3.5), 4.2 + Math.random() * 2.2, (Math.random() - 0.5) * 4.5);
          }
        }
      }
      return;
    }

    // LOOSE BALL physics & rebound pickup
    if (b.mode === 'loose') {
      b.vel.y -= GRAVITY * 0.8 * dt;
      b.pos.addScaledVector(b.vel, dt);
      this.collideBackboards(b);
      if (b.pos.y < 0.16) {
        b.pos.y = 0.16;
        if (Math.abs(b.vel.y) > 1.2) {
          b.vel.y = -b.vel.y * 0.62;
          b.vel.x *= 0.82;
          b.vel.z *= 0.82;
          this.cb.onSound('bounce');
        } else {
          b.vel.y = 0;
          b.vel.x *= 0.9;
          b.vel.z *= 0.9;
        }
      }
      // Keep ball in bounds
      if (Math.abs(b.pos.x) > COURT_HALF_X - 0.4) {
        b.pos.x = Math.sign(b.pos.x) * (COURT_HALF_X - 0.4);
        b.vel.x = -b.vel.x * 0.6;
      }
      if (Math.abs(b.pos.z) > COURT_HALF_Z - 0.4) {
        b.pos.z = Math.sign(b.pos.z) * (COURT_HALF_Z - 0.4);
        b.vel.z = -b.vel.z * 0.6;
      }

      if (b.pickupLock <= 0) {
        const order = this.tick % 2 === 0 ? this.players : [...this.players.slice(2), ...this.players.slice(0, 2)];
        for (const p of order) {
          if (p.stunTimer > 0) continue;
          const d = Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z);
          const dy = Math.abs(p.pos.y + 0.85 - b.pos.y);
          const catchR = !p.grounded ? 1.65 : 0.95;
          const catchY = !p.grounded ? 1.8 : 1.2;
          if (d < catchR && dy < catchY) {
            if (b.lastTouchTeam !== p.team || b.shooter !== null) {
              p.box.rebounds++;
            }
            this.giveBallTo(p.index);
            this.shotClock = SHOT_CLOCK_MAX;
            // Airborne catch of a high rebound near offensive hoop -> Putback / Backboard Spike Dunk!
            const hx = this.targetHoopX(p.team);
            if (!p.grounded && p.pos.y > 0.6 && b.pos.y > 1.5 && Math.hypot(hx - p.pos.x, p.pos.z) < 4.5) {
              this.startDunk(p, true, 'backboard');
            }
            break;
          }
        }
      }
    }
  }

  private scoreBasket(scorer: SimPlayer, pts: 2 | 3, isDunk: boolean): void {
    this.score[scorer.team] += pts;
    scorer.box.pts += pts;
    scorer.celebrateTimer = 1.2;

    // Update ON FIRE streaks (opponents lose their fire when you score!)
    for (const p of this.players) {
      if (p.team !== scorer.team) {
        p.streak = 0;
        p.onFire = false;
      }
    }
    scorer.streak++;
    const justCaughtFire = !scorer.onFire && scorer.streak >= this.bal.fireStreakThreshold;
    if (justCaughtFire) {
      scorer.onFire = true;
      scorer.turbo = 100;
      this.cb.onSound('fire');
      this.cb.onAnnounce({
        text: "HE'S ON FIRE!!",
        subtext: `${scorer.profile.name} IS UNSTOPPABLE!`,
        color: '#ff5500',
        big: true,
      });
      if (scorer.team === 0) this.emitAchievement('fire');
    } else if (scorer.streak === 2) {
      this.cb.onAnnounce({
        text: "HE'S HEATING UP!",
        subtext: pts === 3 ? 'FROM DOWNTOWN!' : '+2 POINTS',
        color: '#ffaa22',
      });
    } else if (this.clockSec <= 0.05) {
      this.cb.onAnnounce({
        text: 'BUZZER BEATER!!',
        subtext: `+${pts} FOR ${scorer.profile.name}!`,
        color: '#ff3366',
        big: true,
      });
    } else if (pts === 3) {
      this.cb.onAnnounce({
        text: 'FROM DOWNTOWN!',
        subtext: `${scorer.profile.name} +3`,
        color: '#44ff88',
        big: true,
      });
    } else if (!isDunk) {
      this.cb.onAnnounce({
        text: 'NOTHING BUT NET!',
        subtext: `${scorer.profile.name} +2`,
        color: '#ffd21f',
      });
    }

    this.excitement = Math.min(1, this.excitement + (isDunk || pts === 3 ? 0.8 : 0.45));
    this.inboundTeam = scorer.team === 0 ? 1 : 0;
    this.phase = 'scored';
    this.phaseTimer = 1.15;

    // If clock hit 0 during the shot, advance quarter after celebration
    if (this.clockSec <= 0) {
      this.handleQuarterEnd();
    }
  }

  private handleQuarterEnd(): void {
    this.cb.onSound('buzzer');
    if (this.quarter < 4) {
      this.phase = 'quarterBreak';
      this.phaseTimer = 1.8;
      this.cb.onAnnounce({
        text: `END OF QUARTER ${this.quarter}`,
        subtext: `${this.score[0]} - ${this.score[1]}`,
        color: '#ffd21f',
        big: true,
      });
    } else if (this.score[0] === this.score[1]) {
      // Tied at end of Q4 or OT -> another Overtime!
      this.phase = 'quarterBreak';
      this.phaseTimer = 1.8;
      this.cb.onAnnounce({
        text: 'TIED! GOING TO OVERTIME!',
        color: '#ff5533',
        big: true,
      });
    } else {
      this.phase = 'finished';
      if (!this.finishedSent) {
        this.finishedSent = true;
        const winner: 0 | 1 = this.score[0] > this.score[1] ? 0 : 1;
        if (winner === 0) this.emitAchievement('win');
        this.cb.onSound('cheer');
        this.cb.onMatchEnd({
          homeTeamId: this.config.homeTeamId,
          awayTeamId: this.config.awayTeamId,
          homeScore: this.score[0],
          awayScore: this.score[1],
          winner,
          overtime: this.quarter > 4,
          boxScore: this.players.map((p) => ({ ...p.box })),
        });
      }
    }
  }

  private runBot(
    snapshot: GameStateSnapshot,
    slot: 0 | 1 | 2 | 3,
    dt: number,
    role: BotRole,
    humanInput: PlayerControlInput | null,
  ): PlayerControlInput {
    const raw = this.bots[slot].decide(snapshot, {
      playerIndex: slot,
      role,
      difficulty: this.config.difficulty,
      dt,
      humanInput,
    });
    return normalizeBotInput(raw);
  }

  private emitAchievement(kind: 'dunk' | 'three' | 'fire' | 'win'): void {
    if (this.config.opponentMode === 'botvsbot') return;
    this.cb.onAchievement(kind);
  }

  private collideBackboards(b: SimBall): void {
    for (const side of [-1, 1] as const) {
      const boardX = side * (HOOP_X + 0.36);
      if (
        Math.abs(b.pos.x - boardX) < 0.24 &&
        b.pos.y >= 2.55 &&
        b.pos.y <= 4.15 &&
        Math.abs(b.pos.z) <= 1.0
      ) {
        const approachingFront = Math.sign(b.vel.x) === side || Math.abs(b.vel.x) < 0.8;
        if (approachingFront) {
          b.pos.x = boardX - side * 0.25;
          b.vel.x = -side * Math.max(2.2, Math.abs(b.vel.x) * 0.72);
        } else {
          b.pos.x = boardX + side * 0.25;
          b.vel.x = side * Math.max(1.8, Math.abs(b.vel.x) * 0.65);
        }
        b.vel.y *= 0.82;
        b.vel.z *= 0.85;
        this.cb.onSound('clang');
        this.cb.onRimShake(side === 1 ? 'right' : 'left', 0.35);
        this.cb.onBurst(b.pos.clone(), 'dust');
        break;
      }
    }
  }

  private clampToCourt(pos: THREE.Vector3): void {
    pos.x = Math.max(-COURT_HALF_X + 0.55, Math.min(COURT_HALF_X - 0.55, pos.x));
    pos.z = Math.max(-COURT_HALF_Z + 0.55, Math.min(COURT_HALF_Z - 0.55, pos.z));
  }
}
