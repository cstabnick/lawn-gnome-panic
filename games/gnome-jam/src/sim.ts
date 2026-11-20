// 2-on-2 NBA Jam style arcade basketball simulation.
import * as THREE from 'three';
import { COURT_HALF_X, COURT_HALF_Z, HOOP_X, HOOP_Y, THREE_PT_RADIUS } from './arena';
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
  private finishedSent = false;

  constructor(config: MatchConfig, cb: SimCallbacks) {
    this.config = config;
    this.cb = cb;
    this.clockSec = config.quarterSeconds;

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
    const handler = team === 0 ? this.p1ControlIdx : this.config.opponentMode === 'local2p' ? this.p2ControlIdx : baseIdx;
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
      p.shootHold = 0;
      p.facing = p.team === 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    this.giveBallTo(handler);
    this.shotClock = SHOT_CLOCK_MAX;
    this.phase = 'live';
  }

  private giveBallTo(playerIdx: number): void {
    this.ball.carrier = playerIdx;
    this.ball.mode = 'held';
    this.ball.shooter = null;
    this.ball.passTarget = null;
    this.ball.pickupLock = 0.25;
    const p = this.players[playerIdx];
    this.ball.lastTouchTeam = p.team;
    this.ball.onFire = p.onFire;
    if (p.team === 0) this.p1ControlIdx = playerIdx;
    else if (this.config.opponentMode === 'local2p') this.p2ControlIdx = playerIdx;
  }

  /** Target hoop X for a team (Home attacks +HOOP_X, Away attacks -HOOP_X). */
  targetHoopX(team: 0 | 1): number {
    return team === 0 ? HOOP_X : -HOOP_X;
  }

  step(dt: number, p1In: PlayerControlInput, p2In: PlayerControlInput): void {
    const clampedDt = Math.min(dt, 0.05);
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

    // P1 controls p1ControlIdx on Home team
    inputs[this.p1ControlIdx] = p1In;
    const p1Mate = this.p1ControlIdx === 0 ? 1 : 0;
    inputs[p1Mate] = this.computeAI(this.players[p1Mate], clampedDt, 'teammate', p1In);

    if (this.config.opponentMode === 'local2p') {
      inputs[this.p2ControlIdx] = p2In;
      const p2Mate = this.p2ControlIdx === 2 ? 3 : 2;
      inputs[p2Mate] = this.computeAI(this.players[p2Mate], clampedDt, 'teammate', p2In);
    } else {
      inputs[2] = this.computeAI(this.players[2], clampedDt, 'opponent', null);
      inputs[3] = this.computeAI(this.players[3], clampedDt, 'opponent', null);
    }

    // Step all 4 players
    for (let i = 0; i < 4; i++) {
      this.stepPlayer(this.players[i], inputs[i], clampedDt);
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

    // Turbo regeneration & usage
    const moving = Math.hypot(inp.moveX, inp.moveZ) > 0.1;
    const usingTurbo = inp.turbo && (p.onFire || p.turbo > 2);
    if (usingTurbo && moving) {
      if (!p.onFire) p.turbo = Math.max(0, p.turbo - 32 * dt);
    } else {
      p.turbo = Math.min(100, p.turbo + 18 * dt);
    }

    // Movement speed derived from Speed stat
    const baseSpeed = 4.6 + p.profile.stats.speed * 0.34;
    const speedMul = usingTurbo ? 1.48 : 1.0;
    const carryMul = this.ball.carrier === p.index ? 0.96 : 1.0;
    const moveSpeed = baseSpeed * speedMul * carryMul;

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
      if (inp.shootPressed && p.grounded) {
        const hx = this.targetHoopX(p.team);
        const distToHoop = Math.hypot(hx - p.pos.x, p.pos.z);
        const dunkReach = 3.2 + p.profile.stats.dunk * 0.24 + (usingTurbo ? 1.25 : 0) + (p.onFire ? 1.1 : 0);

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
          this.releaseJumpShot(p, timingQuality);
          p.isShooting = false;
          p.shootHold = 0;
        }
      }

      if (inp.passPressed && !p.dunk) {
        this.throwPass(p);
      }
    } else if (teamHasBall) {
      // OFF-BALL OFFENSE: Jump for Alley-Oop, or call for pass!
      if (inp.shootPressed && p.grounded) {
        p.grounded = false;
        p.vel.y = 8.4 + (usingTurbo ? 1.0 : 0);
      }
    } else {
      // DEFENSE / LOOSE BALL: Block/Rebound or Steal/Shove!
      if (inp.shootPressed && p.grounded) {
        p.grounded = false;
        p.vel.y = 8.2 + p.profile.stats.defense * 0.22 + (usingTurbo ? 1.2 : 0);
        this.tryBlockShot(p);
      }

      if (inp.passPressed && p.stealCooldown <= 0) {
        this.tryStealOrShove(p, usingTurbo);
      }
    }
  }

  private startDunk(p: SimPlayer, usingTurbo: boolean): void {
    const hx = this.targetHoopX(p.team);
    const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
    const dist = Math.hypot(rimX - p.pos.x, p.pos.z);

    // Choose a fun NBA Jam dunk style!
    let style: DunkStyle = 'tomahawk';
    if (p.onFire) {
      style = 'meteor';
    } else if (dist > 3.6 || (usingTurbo && Math.random() < 0.45)) {
      const flashy: DunkStyle[] = ['frontflip', 'helicopter360', 'windmill'];
      style = flashy[Math.floor(Math.random() * flashy.length)];
    } else {
      const standard: DunkStyle[] = ['tomahawk', 'windmill', 'helicopter360'];
      style = standard[Math.floor(Math.random() * standard.length)];
    }

    const dur = Math.max(0.46, Math.min(0.78, 0.36 + dist * 0.075));
    const peakY = style === 'meteor' ? 4.4 : style === 'frontflip' ? 4.0 : 3.55;

    p.grounded = false;
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
    };

    if (!p.onFire && usingTurbo) p.turbo = Math.max(0, p.turbo - 18);

    const callouts: Record<DunkStyle, string> = {
      tomahawk: 'MONSTER JAM!',
      helicopter360: '360 HELICOPTER!',
      frontflip: 'CANNONBALL FLIP!',
      windmill: 'WINDMILL SLAM!',
      meteor: 'METEOR FLAME DUNK!',
    };
    this.cb.onAnnounce({
      text: callouts[style],
      subtext: p.profile.name.toUpperCase(),
      color: style === 'meteor' ? '#ff6a00' : '#ffd21f',
      big: true,
    });
    this.excitement = Math.min(1, this.excitement + 0.45);
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

    // Check if defender swatted the dunk right at the rim!
    if (u > 0.65 && u < 0.88 && !d.scored && !p.onFire) {
      for (const opp of this.players) {
        if (opp.team === p.team || opp.grounded || opp.stunTimer > 0) continue;
        const dist = opp.pos.distanceTo(p.pos);
        if (dist < 1.25 && opp.pos.y > 1.4 && Math.random() < 0.04 + opp.profile.stats.defense * 0.012) {
          // REJECTED!
          p.dunk = null;
          p.vel.set((p.team === 0 ? -1 : 1) * 4, 2, (Math.random() - 0.5) * 3);
          p.box.fga++;
          opp.box.blocks++;
          this.ball.carrier = null;
          this.ball.mode = 'loose';
          this.ball.vel.set((p.team === 0 ? -1 : 1) * 6.5, 5.5, (Math.random() - 0.5) * 5);
          this.cb.onSound('block');
          this.cb.onCameraPunch(0.45);
          this.cb.onAnnounce({ text: 'REJECTED!', subtext: `${opp.profile.name} SAYS NO!`, color: '#44ccff', big: true });
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
      if (p.team === 0) this.cb.onAchievement('dunk');
      this.scoreBasket(p, 2, true);
    }
  }

  private releaseJumpShot(p: SimPlayer, timingQuality: number): void {
    const hx = this.targetHoopX(p.team);
    const rimX = hx + (p.team === 0 ? -0.36 : 0.36);
    const dist = Math.hypot(rimX - p.pos.x, p.pos.z);
    const isThree = dist >= THREE_PT_RADIUS;

    // Check closest defender contest
    let contest = 0;
    for (const opp of this.players) {
      if (opp.team === p.team || opp.stunTimer > 0) continue;
      const d = Math.hypot(opp.pos.x - p.pos.x, opp.pos.z - p.pos.z);
      if (d < 2.2) {
        const jumpBonus = !opp.grounded ? 0.16 : 0.06;
        contest = Math.max(contest, (1 - d / 2.2) * (0.14 + opp.profile.stats.defense * 0.018) + jumpBonus);
      }
    }

    const baseChance = isThree
      ? 0.28 + p.profile.stats.threePt * 0.055
      : 0.44 + p.profile.stats.threePt * 0.042;
    const timingBonus = timingQuality * 0.22;
    const fireBonus = p.onFire ? 0.28 : 0;
    const distPenalty = Math.max(0, (dist - 8.5) * 0.045);
    const chance = Math.max(0.08, Math.min(0.96, baseChance + timingBonus + fireBonus - contest - distPenalty));

    const willScore = Math.random() < chance;
    p.box.fga++;
    if (isThree) p.box.tpa++;

    this.ball.carrier = null;
    this.ball.mode = 'shot';
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

  private throwPass(p: SimPlayer): void {
    const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
    const mate = this.players[mateIdx];

    // Check if teammate is airborne near the hoop -> ALLEY-OOP!
    const hx = this.targetHoopX(p.team);
    const mateDistHoop = Math.hypot(hx - mate.pos.x, mate.pos.z);
    const isAlleyOop = !mate.grounded && mateDistHoop < 4.5;

    this.ball.carrier = null;
    this.ball.mode = 'pass';
    this.ball.passTarget = mateIdx;
    this.ball.shooter = p.index;
    this.ball.startPos.copy(this.ball.pos);
    this.ball.endPos.set(mate.pos.x, mate.pos.y + (isAlleyOop ? 1.5 : 0.9), mate.pos.z);
    const dist = this.ball.startPos.distanceTo(this.ball.endPos);
    this.ball.flightT = 0;
    this.ball.flightDur = Math.max(0.2, Math.min(0.55, dist / 18));
    this.ball.arcPeak = Math.max(this.ball.startPos.y, this.ball.endPos.y) + (isAlleyOop ? 1.8 : 0.45);
    this.ball.lastTouchTeam = p.team;
    this.cb.onSound('pass');

    if (isAlleyOop) {
      this.cb.onAnnounce({ text: 'ALLEY-OOP!', color: '#44ffcc', big: true });
    }
  }

  private tryBlockShot(p: SimPlayer): void {
    if (this.ball.mode !== 'shot') return;
    if (this.ball.flightT / this.ball.flightDur > 0.72) return; // no goaltending on way down
    const dist = p.pos.distanceTo(this.ball.pos);
    if (dist < 2.2) {
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
    p.stealCooldown = 0.55;
    p.shoveTimer = 0.22;

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
      // On defense with no opponent nearby, pressing Pass switches control to teammate!
      if (p.index === this.p1ControlIdx) {
        this.p1ControlIdx = p.index === 0 ? 1 : 0;
      } else if (this.config.opponentMode === 'local2p' && p.index === this.p2ControlIdx) {
        this.p2ControlIdx = p.index === 2 ? 3 : 2;
      }
      return;
    }

    const dx = target.pos.x - p.pos.x;
    const dz = target.pos.z - p.pos.z;
    const len = Math.max(0.01, Math.hypot(dx, dz));
    p.facing = Math.atan2(dx, dz);

    if (usingTurbo) {
      // Classic NBA Jam SHOVE!
      if (!p.onFire) p.turbo = Math.max(0, p.turbo - 22);
      target.stunTimer = 0.85;
      target.vel.set((dx / len) * 8.5, 3.2, (dz / len) * 8.5);
      target.grounded = false;
      this.cb.onSound('shove');
      this.cb.onBurst(target.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 'dust');
      this.cb.onCameraPunch(0.25);

      if (this.ball.carrier === target.index) {
        p.box.steals++;
        this.giveBallTo(p.index);
        this.shotClock = SHOT_CLOCK_MAX;
        this.cb.onAnnounce({ text: 'CRUNCHING SHOVE!', subtext: 'TURNOVER!', color: '#ff8844' });
      }
    } else if (this.ball.carrier === target.index) {
      // Quick steal poke!
      const stealChance = 0.34 + p.profile.stats.defense * 0.045;
      if (Math.random() < stealChance) {
        p.box.steals++;
        this.giveBallTo(p.index);
        this.shotClock = SHOT_CLOCK_MAX;
        this.cb.onSound('pass');
        this.cb.onAnnounce({ text: 'PICKPOCKET!', subtext: `${p.profile.name} STEALS!`, color: '#44ff88' });
      } else {
        this.cb.onSound('bounce');
      }
    }
  }

  private stepBall(dt: number): void {
    const b = this.ball;
    if (b.pickupLock > 0) b.pickupLock -= dt;
    b.spin += dt * 9;

    if (b.mode === 'held' && b.carrier !== null) {
      const p = this.players[b.carrier];
      const fx = Math.sin(p.facing);
      const fz = Math.cos(p.facing);
      if (p.dunk) {
        // Ball held high in dunking hand!
        b.pos.set(p.pos.x + fx * 0.32, p.pos.y + 1.38, p.pos.z + fz * 0.32);
      } else if (p.isShooting || !p.grounded) {
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
      b.endPos.set(target.pos.x, target.pos.y + 0.95, target.pos.z);
      b.flightT += dt;
      const u = Math.min(1, b.flightT / b.flightDur);
      b.pos.lerpVectors(b.startPos, b.endPos, u);
      b.pos.y += Math.sin(u * Math.PI) * (b.arcPeak - Math.max(b.startPos.y, b.endPos.y));

      if (u >= 1) {
        this.giveBallTo(b.passTarget);
        // If teammate caught it airborne near the hoop, auto-trigger Alley-Oop Dunk!
        const hx = this.targetHoopX(target.team);
        if (!target.grounded && Math.hypot(hx - target.pos.x, target.pos.z) < 4.8) {
          this.startDunk(target, true);
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
            if (shooter.team === 0) this.cb.onAchievement('three');
          }
          this.scoreBasket(shooter, pts, false);
        } else {
          // Rim clang -> loose rebound!
          this.cb.onSound('clang');
          this.cb.onRimShake(shooter.team === 0 ? 'right' : 'left', 0.5);
          b.mode = 'loose';
          b.pickupLock = 0.2;
          const kickDir = shooter.team === 0 ? -1 : 1;
          b.vel.set(kickDir * (2.5 + Math.random() * 3.5), 4.2 + Math.random() * 2.2, (Math.random() - 0.5) * 4.5);
        }
      }
      return;
    }

    // LOOSE BALL physics & rebound pickup
    if (b.mode === 'loose') {
      b.vel.y -= GRAVITY * 0.8 * dt;
      b.pos.addScaledVector(b.vel, dt);
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
        for (const p of this.players) {
          if (p.stunTimer > 0) continue;
          const d = Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z);
          const dy = Math.abs(p.pos.y + 0.7 - b.pos.y);
          if (d < 0.95 && dy < 1.2) {
            if (b.lastTouchTeam !== p.team || b.shooter !== null) {
              p.box.rebounds++;
            }
            this.giveBallTo(p.index);
            this.shotClock = SHOT_CLOCK_MAX;
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
    const justCaughtFire = !scorer.onFire && scorer.streak >= 3;
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
      if (scorer.team === 0) this.cb.onAchievement('fire');
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
        if (winner === 0) this.cb.onAchievement('win');
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

  /** Smart NBA Jam AI for both your teammate and AI opponents! */
  private computeAI(
    p: SimPlayer,
    dt: number,
    role: 'teammate' | 'opponent',
    humanInput: PlayerControlInput | null,
  ): PlayerControlInput {
    const out = this.emptyInput();
    if (p.stunTimer > 0 || p.dunk) return out;

    const diffScale =
      role === 'teammate'
        ? 0.92
        : this.config.difficulty === 'rookie'
          ? 0.65
          : this.config.difficulty === 'allstar'
            ? 1.08
            : 0.88;

    const hx = this.targetHoopX(p.team);
    const attackDir = p.team === 0 ? 1 : -1;
    const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
    const mate = this.players[mateIdx];

    const hasBall = this.ball.carrier === p.index;
    const teamHasBall =
      this.ball.carrier !== null && this.players[this.ball.carrier].team === p.team;

    // 1. Loose ball -> sprint to grab rebound!
    if (this.ball.mode === 'loose') {
      this.steerToward(p, this.ball.pos.x, this.ball.pos.z, out, true);
      if (this.ball.pos.y > 1.5 && p.pos.distanceTo(this.ball.pos) < 1.8 && p.grounded) {
        out.shootPressed = true;
      }
      return out;
    }

    // 2. AI HAS THE BALL
    if (hasBall) {
      // If human teammate pressed Pass -> immediately pass to human!
      if (role === 'teammate' && humanInput?.passPressed) {
        out.passPressed = true;
        return out;
      }
      // If human teammate pressed Shoot -> shoot/dunk right away!
      if (role === 'teammate' && humanInput?.shootPressed) {
        out.shootPressed = true;
        out.shootDown = true;
        return out;
      }

      const distHoop = Math.hypot(hx - p.pos.x, p.pos.z);
      const preferThree = p.profile.stats.threePt >= 8 && Math.abs(p.pos.z) > 2.0 && distHoop < 7.2 && distHoop > THREE_PT_RADIUS + 0.3;

      if (distHoop < 3.4 + p.profile.stats.dunk * 0.16) {
        // Drive in and DUNK!
        out.turbo = true;
        out.shootPressed = true;
        out.shootDown = true;
        return out;
      }

      if (preferThree && Math.random() < 0.035 * diffScale) {
        out.shootPressed = true;
        out.shootDown = true;
        return out;
      }

      // Pass to open teammate occasionally
      const mateDistHoop = Math.hypot(hx - mate.pos.x, mate.pos.z);
      if (mateDistHoop + 2.5 < distHoop && Math.random() < 0.025 * diffScale) {
        out.passPressed = true;
        return out;
      }

      // Drive toward basket with slight weave
      const targetZ = Math.sin(this.clockSec * 1.4 + p.index) * 2.2;
      this.steerToward(p, hx - attackDir * 1.4, targetZ, out, p.turbo > 35 && distHoop < 9);
      if (p.isShooting && p.vel.y <= 0.3) {
        out.shootReleased = true;
      } else if (p.isShooting) {
        out.shootDown = true;
      }
      return out;
    }

    // 3. TEAMMATE HAS THE BALL (Off-ball offense!)
    if (teamHasBall) {
      // Space out nicely on the opposite wing or cut to the hoop for an alley-oop!
      const wantZ = mate.pos.z >= 0 ? -3.0 : 3.0;
      const wantX =
        p.profile.stats.dunk >= 7
          ? hx - attackDir * 2.6
          : hx - attackDir * (THREE_PT_RADIUS + 0.7);
      this.steerToward(p, wantX, wantZ, out, Math.hypot(wantX - p.pos.x, wantZ - p.pos.z) > 3.5);
      return out;
    }

    // 4. DEFENSE!
    const carrier = this.ball.carrier !== null ? this.players[this.ball.carrier] : null;
    if (carrier) {
      const myDist = p.pos.distanceTo(carrier.pos);
      const mateDist = mate.pos.distanceTo(carrier.pos);
      const guardBall = myDist <= mateDist + 0.5;

      if (guardBall) {
        // Stay between ball carrier and our hoop
        const ownHoopX = this.targetHoopX(carrier.team);
        const gx = carrier.pos.x + Math.sign(ownHoopX - carrier.pos.x) * 1.1;
        const gz = carrier.pos.z * 0.92;
        this.steerToward(p, gx, gz, out, myDist > 2.4 && p.turbo > 30);

        // Attempt steal or shove when close!
        if (myDist < 1.55 && p.stealCooldown <= 0 && Math.random() < (1.6 * diffScale) * dt) {
          out.passPressed = true;
          out.turbo = Math.random() < 0.45 * diffScale;
        }
        // Jump to block if carrier jumps!
        if ((!carrier.grounded || carrier.dunk) && myDist < 2.3 && p.grounded && Math.random() < 0.25 * diffScale) {
          out.shootPressed = true;
        }
      } else {
        // Guard the off-ball opponent
        const oppOff = this.players.find((o) => o.team !== p.team && o.index !== carrier.index);
        if (oppOff) {
          const ownHoopX = this.targetHoopX(carrier.team);
          const gx = (oppOff.pos.x + ownHoopX * 0.35) / 1.35;
          this.steerToward(p, gx, oppOff.pos.z * 0.85, out, false);
        }
      }
    }

    return out;
  }

  private steerToward(
    p: SimPlayer,
    tx: number,
    tz: number,
    out: PlayerControlInput,
    turbo: boolean,
  ): void {
    const dx = tx - p.pos.x;
    const dz = tz - p.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.35) {
      out.moveX = dx / d;
      out.moveZ = dz / d;
      out.turbo = turbo;
    }
  }

  private clampToCourt(pos: THREE.Vector3): void {
    pos.x = Math.max(-COURT_HALF_X + 0.55, Math.min(COURT_HALF_X - 0.55, pos.x));
    pos.z = Math.max(-COURT_HALF_Z + 0.55, Math.min(COURT_HALF_Z - 0.55, pos.z));
  }
}
