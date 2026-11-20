// Online multiplayer client & state sync for GBA GJAM over @lawn/mp.
import { getMyGnome, onLooksChanged, prefetchLooks, resolveLook } from '@lawn/gnome';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import type { PlayerControlInput } from './input';
import type { DunkState, JamSimulation, SimBall, SimCallbacks } from './sim';
import { getTeamById } from './teams';
import type {
  AnnouncerEvent,
  Difficulty,
  GnomePlayerProfile,
  MatchConfig,
  MatchResult,
} from './types';

export interface PlayerSnap {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: number;
  grounded: boolean;
  turbo: number;
  onFire: boolean;
  stunTimer: number;
  shoveTimer: number;
  isShooting: boolean;
  dunk: DunkState | null;
  celebrateTimer: number;
}

export interface SimSnapshot {
  score: [number, number];
  quarter: number;
  clockSec: number;
  shotClock: number;
  phase: JamSimulation['phase'];
  p1ControlIdx: number;
  p2ControlIdx: number;
  excitement: number;
  players: PlayerSnap[];
  ball: {
    x: number;
    y: number;
    z: number;
    carrier: number | null;
    mode: SimBall['mode'];
    spin: number;
    onFire: boolean;
  };
}

export type SimEvent =
  | { kind: 'announce'; ev: AnnouncerEvent }
  | { kind: 'sound'; sound: Parameters<SimCallbacks['onSound']>[0] }
  | { kind: 'rimShake'; side: 'left' | 'right'; strength: number }
  | { kind: 'cameraPunch'; strength: number }
  | { kind: 'burst'; x: number; y: number; z: number; burstKind: 'fire' | 'confetti' | 'dust'; color?: number };

export interface LocalSetupPayload {
  teamId: string;
  useCustom: boolean;
  duo: [number, number];
  customProfile?: GnomePlayerProfile;
  difficulty: Difficulty;
  quarterSeconds: number;
}

export type JamNetMsg =
  | { k: 'ping' }
  | { k: 'setup'; setup: LocalSetupPayload }
  | { k: 'start'; config: MatchConfig }
  | { k: 'input'; inp: PlayerControlInput }
  | { k: 'snap'; s: SimSnapshot }
  | { k: 'ev'; ev: SimEvent }
  | { k: 'end'; result: MatchResult };

export interface NetStatus {
  status: 'off' | 'connecting' | 'queued' | 'starting' | 'playing' | 'error';
  message: string;
  code: string | null;
  waiting: number;
  startsInS: number;
  myTeam: 0 | 1;
  isHost: boolean;
  opponentName: string;
}

export const INITIAL_NET_STATUS: NetStatus = {
  status: 'off',
  message: '',
  code: null,
  waiting: 0,
  startsInS: 0,
  myTeam: 0,
  isHost: false,
  opponentName: '',
};

export interface JamNetCallbacks {
  onStatus: (status: NetStatus) => void;
  onStartOnlineMatch: (config: MatchConfig) => void;
  onRemoteEvent: (ev: SimEvent) => void;
  onRemoteMatchEnd: (result: MatchResult) => void;
  onOpponentLeft: (reason: string) => void;
  onRemoteLooksUpdated: (players: PlayerInfo[]) => void;
}

const PING_EVERY_S = 2;
const SNAP_EVERY_S = 1 / 20;

export function captureSnapshot(sim: JamSimulation): SimSnapshot {
  return {
    score: [sim.score[0], sim.score[1]],
    quarter: sim.quarter,
    clockSec: sim.clockSec,
    shotClock: sim.shotClock,
    phase: sim.phase,
    p1ControlIdx: sim.p1ControlIdx,
    p2ControlIdx: sim.p2ControlIdx,
    excitement: sim.excitement,
    players: sim.players.map((p) => ({
      x: p.pos.x,
      y: p.pos.y,
      z: p.pos.z,
      vx: p.vel.x,
      vy: p.vel.y,
      vz: p.vel.z,
      facing: p.facing,
      grounded: p.grounded,
      turbo: p.turbo,
      onFire: p.onFire,
      stunTimer: p.stunTimer,
      shoveTimer: p.shoveTimer,
      isShooting: p.isShooting,
      dunk: p.dunk ? { ...p.dunk } : null,
      celebrateTimer: p.celebrateTimer,
    })),
    ball: {
      x: sim.ball.pos.x,
      y: sim.ball.pos.y,
      z: sim.ball.pos.z,
      carrier: sim.ball.carrier,
      mode: sim.ball.mode,
      spin: sim.ball.spin,
      onFire: sim.ball.onFire,
    },
  };
}

export class JamNet {
  private client: NetClient<JamNetMsg> | null = null;
  private cb: JamNetCallbacks;
  private active = false;
  private opening = false;

  status: NetStatus = { ...INITIAL_NET_STATUS };
  private roster: PlayerInfo[] = [];
  private hostId: number | null = null;
  private myId: number | null = null;
  private localSetup: LocalSetupPayload | null = null;
  private setups = new Map<number, LocalSetupPayload>();
  private setupTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  private pingAcc = 0;
  private snapAcc = 0;
  private inputAcc = 0;

  // Latched remote input (on host) and latched outgoing edges (on guest)
  private remoteInput: PlayerControlInput = {
    moveX: 0,
    moveZ: 0,
    turbo: false,
    shootDown: false,
    shootPressed: false,
    shootReleased: false,
    passPressed: false,
  };
  private guestEdgeLatch = { shootPressed: false, shootReleased: false, passPressed: false };

  // Guest interpolation target
  private latestSnap: SimSnapshot | null = null;

  constructor(cb: JamNetCallbacks) {
    this.cb = cb;
    onLooksChanged(() => {
      if (this.roster.length > 0) {
        this.cb.onRemoteLooksUpdated(this.roster);
      }
    });
  }

  isAvailable(): boolean {
    return serverUrl().length > 0;
  }

  private setStatus(patch: Partial<NetStatus>): void {
    this.status = { ...this.status, ...patch };
    this.cb.onStatus(this.status);
  }

  private ensureClient(name: string): NetClient<JamNetMsg> {
    if (!this.client) {
      const code = getMyGnome()?.code ?? 'gnorman';
      const c = createNetClient<JamNetMsg>(serverUrl(), 'gba-gjam', { name, character: code });
      c.onMessage((m) => this.handleMessage(m));
      c.onClose(() => {
        if (!this.opening && this.active) {
          this.handleDisconnect('Connection lost');
        }
      });
      this.client = c;
    }
    return this.client;
  }

  async queue(code: string | null, name: string, setup: LocalSetupPayload): Promise<void> {
    const url = serverUrl();
    if (!url) {
      this.setStatus({ status: 'error', message: 'Online server URL not configured.', code });
      return;
    }
    this.clearSetupTimer();
    this.active = true;
    this.started = false;
    this.roster = [];
    this.setups.clear();
    this.latestSnap = null;
    this.localSetup = setup;
    this.setStatus({
      status: 'connecting',
      message: 'Connecting to Gnomerena server…',
      code,
      waiting: 0,
      startsInS: 0,
      opponentName: '',
    });

    try {
      const c = this.ensureClient(name);
      if (!c.connected) {
        this.opening = true;
        await c.connect();
        this.opening = false;
      }
      if (!this.active) return;
      const charCode = getMyGnome()?.code ?? 'gnorman';
      c.queue(code, charCode, name);
      this.setStatus({
        status: 'queued',
        message: code ? `Waiting in room ${code}…` : 'Searching for opponent…',
        code,
      });
    } catch (err) {
      this.opening = false;
      this.active = false;
      this.setStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'Could not connect to server',
      });
    }
  }

  leave(): void {
    this.clearSetupTimer();
    this.active = false;
    this.started = false;
    this.roster = [];
    this.setups.clear();
    this.latestSnap = null;
    this.client?.leave();
    this.setStatus({ ...INITIAL_NET_STATUS });
  }

  private handleDisconnect(reason: string): void {
    const wasPlaying = this.status.status === 'playing' || this.status.status === 'starting';
    this.clearSetupTimer();
    this.active = false;
    this.started = false;
    this.setStatus({ status: 'error', message: reason, waiting: 0, startsInS: 0 });
    this.client?.drop();
    this.client = null;
    if (wasPlaying) {
      this.cb.onOpponentLeft(reason);
    }
  }

  private clearSetupTimer(): void {
    if (this.setupTimer !== null) {
      clearTimeout(this.setupTimer);
      this.setupTimer = null;
    }
  }

  private handleMessage(m: ServerMsg<JamNetMsg>): void {
    if (!this.active) return;
    switch (m.t) {
      case 'queued':
        if (this.started) return;
        this.setStatus({
          status: 'queued',
          message: m.code ? `Room ${m.code} — waiting for opponent…` : 'Waiting for opponent…',
          code: m.code,
          waiting: m.players,
          startsInS: m.startsInS,
        });
        return;

      case 'match': {
        void prefetchLooks(m.players);
        this.roster = [...m.players].sort((a, b) => a.id - b.id);
        this.myId = m.you;
        this.hostId = m.hostId;
        const myIndex = this.roster.findIndex((p) => p.id === m.you);
        const myTeam: 0 | 1 = myIndex === 1 ? 1 : 0;
        const isHost = m.hostId === m.you;
        const opp = this.roster.find((p) => p.id !== m.you);
        this.setStatus({
          status: 'starting',
          message: 'Match found! Syncing rosters…',
          myTeam,
          isHost,
          opponentName: opp?.name ?? 'Opponent',
          waiting: this.roster.length,
          startsInS: 0,
        });

        if (this.localSetup && this.myId !== null) {
          this.setups.set(this.myId, this.localSetup);
          this.client?.send(null, { k: 'setup', setup: this.localSetup });
        }

        if (isHost) {
          this.tryHostStart();
          this.clearSetupTimer();
          this.setupTimer = setTimeout(() => {
            if (!this.started && this.active) {
              this.forceHostStart();
            }
          }, 1500);
        }
        return;
      }

      case 'relay': {
        const d = m.d;
        if (!d || typeof d !== 'object') return;
        if (d.k === 'setup') {
          this.setups.set(m.from, d.setup);
          if (this.status.isHost && !this.started) {
            this.tryHostStart();
          }
        } else if (d.k === 'start') {
          if (!this.status.isHost && !this.started) {
            this.started = true;
            this.clearSetupTimer();
            const cfg: MatchConfig = {
              ...d.config,
              opponentMode: 'online',
              onlineContext: { myTeam: this.status.myTeam, isHost: false },
            };
            this.setStatus({ status: 'playing', message: '' });
            this.cb.onStartOnlineMatch(cfg);
          }
        } else if (d.k === 'input') {
          if (this.status.isHost) {
            this.remoteInput = {
              ...d.inp,
              shootPressed: this.remoteInput.shootPressed || d.inp.shootPressed,
              shootReleased: this.remoteInput.shootReleased || d.inp.shootReleased,
              passPressed: this.remoteInput.passPressed || d.inp.passPressed,
            };
          }
        } else if (d.k === 'snap') {
          if (!this.status.isHost) {
            this.latestSnap = d.s;
          }
        } else if (d.k === 'ev') {
          if (!this.status.isHost) {
            this.cb.onRemoteEvent(d.ev);
          }
        } else if (d.k === 'end') {
          if (!this.status.isHost) {
            this.started = false;
            this.cb.onRemoteMatchEnd(d.result);
          }
        }
        return;
      }

      case 'left':
        this.handleDisconnect('Opponent left the match');
        return;

      case 'host':
        this.hostId = m.hostId;
        this.setStatus({ isHost: m.hostId === this.myId });
        return;

      case 'ended':
        this.handleDisconnect(m.reason || 'Match ended');
        return;

      default:
        return;
    }
  }

  private tryHostStart(): void {
    if (this.started || this.roster.length < 2) return;
    if (this.setups.has(this.roster[0].id) && this.setups.has(this.roster[1].id)) {
      this.forceHostStart();
    }
  }

  private forceHostStart(): void {
    if (this.started || this.roster.length < 2) return;
    this.started = true;
    this.clearSetupTimer();

    const p0Info = this.roster[0];
    const p1Info = this.roster[1];
    const s0 = this.setups.get(p0Info.id);
    const s1 = this.setups.get(p1Info.id);

    const homeTeam = getTeamById(s0?.teamId ?? 'mossbottom');
    let awayTeam = getTeamById(s1?.teamId ?? 'redcap');
    if (awayTeam.id === homeTeam.id) {
      awayTeam = getTeamById(homeTeam.id === 'redcap' ? 'thatchford' : 'redcap');
    }

    const buildRoster = (
      info: PlayerInfo,
      setup: LocalSetupPayload | undefined,
      team: ReturnType<typeof getTeamById>,
    ): [GnomePlayerProfile, GnomePlayerProfile] => {
      const duo = setup?.duo ?? [0, 1];
      if (setup?.useCustom && setup.customProfile) {
        const resolved = resolveLook(info);
        const prof: GnomePlayerProfile = {
          ...setup.customProfile,
          look: resolved ? { ...resolved, pants: team.secondary } : { ...setup.customProfile.look, pants: team.secondary },
          userId: info.userId,
        };
        return [prof, team.roster[duo[1]] ?? team.roster[0]];
      }
      const pFirst = team.roster[duo[0]] ?? team.roster[0];
      const pSecond = team.roster[duo[1]] ?? team.roster[1];
      return [{ ...pFirst, userId: info.userId }, pSecond];
    };

    const config: MatchConfig = {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeRoster: buildRoster(p0Info, s0, homeTeam),
      awayRoster: buildRoster(p1Info, s1, awayTeam),
      opponentMode: 'online',
      difficulty: s0?.difficulty ?? 'pro',
      quarterSeconds: s0?.quarterSeconds ?? 60,
      onlineContext: { myTeam: this.status.myTeam, isHost: true },
    };

    this.client?.send(null, { k: 'start', config });
    this.setStatus({ status: 'playing', message: '' });
    this.cb.onStartOnlineMatch(config);
  }

  /** Called by host every sim step to consume latched guest input. */
  consumeRemoteInput(): PlayerControlInput {
    const out: PlayerControlInput = { ...this.remoteInput };
    this.remoteInput.shootPressed = false;
    this.remoteInput.shootReleased = false;
    this.remoteInput.passPressed = false;
    return out;
  }

  /** Called every frame (and from whileHidden) to pump keepalives, guest inputs, and host snapshots. */
  tick(dt: number, sim: JamSimulation | null, localInput: PlayerControlInput | null): void {
    if (!this.active || !this.client?.connected) return;

    this.pingAcc += dt;
    if (this.pingAcc >= PING_EVERY_S) {
      this.pingAcc = 0;
      this.client.send(null, { k: 'ping' });
    }

    if (!sim || this.status.status !== 'playing') return;

    if (this.status.isHost) {
      this.snapAcc += dt;
      if (this.snapAcc >= SNAP_EVERY_S) {
        this.snapAcc = 0;
        this.client.send(null, { k: 'snap', s: captureSnapshot(sim) });
      }
    } else if (localInput) {
      this.guestEdgeLatch.shootPressed ||= localInput.shootPressed;
      this.guestEdgeLatch.shootReleased ||= localInput.shootReleased;
      this.guestEdgeLatch.passPressed ||= localInput.passPressed;

      this.inputAcc += dt;
      if (this.inputAcc >= SNAP_EVERY_S && this.hostId !== null) {
        this.inputAcc = 0;
        this.client.send(this.hostId, {
          k: 'input',
          inp: {
            ...localInput,
            shootPressed: this.guestEdgeLatch.shootPressed,
            shootReleased: this.guestEdgeLatch.shootReleased,
            passPressed: this.guestEdgeLatch.passPressed,
          },
        });
        this.guestEdgeLatch.shootPressed = false;
        this.guestEdgeLatch.shootReleased = false;
        this.guestEdgeLatch.passPressed = false;
      }
    }
  }

  /** Apply the latest host snapshot onto the guest's JamSimulation for smooth rendering. */
  applySnapshotToGuest(sim: JamSimulation, dt: number): void {
    const s = this.latestSnap;
    if (!s) return;

    sim.score[0] = s.score[0];
    sim.score[1] = s.score[1];
    sim.quarter = s.quarter;
    sim.clockSec = s.clockSec;
    sim.shotClock = s.shotClock;
    sim.phase = s.phase;
    sim.p1ControlIdx = s.p1ControlIdx;
    sim.p2ControlIdx = s.p2ControlIdx;
    sim.excitement = s.excitement;

    const alpha = Math.min(1, dt * 18);
    for (let i = 0; i < sim.players.length && i < s.players.length; i++) {
      const p = sim.players[i];
      const ps = s.players[i];
      p.pos.x += (ps.x - p.pos.x) * alpha;
      p.pos.y += (ps.y - p.pos.y) * alpha;
      p.pos.z += (ps.z - p.pos.z) * alpha;
      p.vel.set(ps.vx, ps.vy, ps.vz);
      p.facing = ps.facing;
      p.grounded = ps.grounded;
      p.turbo = ps.turbo;
      p.onFire = ps.onFire;
      p.stunTimer = ps.stunTimer;
      p.shoveTimer = ps.shoveTimer;
      p.isShooting = ps.isShooting;
      p.dunk = ps.dunk ? { ...ps.dunk } : null;
      p.celebrateTimer = ps.celebrateTimer;
    }

    sim.ball.pos.x += (s.ball.x - sim.ball.pos.x) * alpha;
    sim.ball.pos.y += (s.ball.y - sim.ball.pos.y) * alpha;
    sim.ball.pos.z += (s.ball.z - sim.ball.pos.z) * alpha;
    sim.ball.carrier = s.ball.carrier;
    sim.ball.mode = s.ball.mode;
    sim.ball.spin = s.ball.spin;
    sim.ball.onFire = s.ball.onFire;
  }

  sendEvent(ev: SimEvent): void {
    if (this.active && this.status.isHost) {
      this.client?.send(null, { k: 'ev', ev });
    }
  }

  sendMatchEnd(result: MatchResult): void {
    if (this.active && this.status.isHost) {
      this.started = false;
      this.client?.send(null, { k: 'end', result });
    }
  }

  /** Update look equipment on a running sim if remote gear finishes fetching. */
  applyFetchedLooksToSim(sim: JamSimulation, players: PlayerInfo[]): void {
    for (const info of players) {
      if (!info.userId) continue;
      const fetched = resolveLook(info);
      if (!fetched) continue;
      for (const sp of sim.players) {
        if (sp.profile.userId === info.userId) {
          const team = getTeamById(sp.team === 0 ? sim.config.homeTeamId : sim.config.awayTeamId);
          sp.profile.look = { ...fetched, pants: team.secondary };
        }
      }
    }
  }
}
