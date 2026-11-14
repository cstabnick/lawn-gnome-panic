// Online play over the shared matchmaking server. STUB: issue 2D fills it in. Keep the exported signatures.
import type { PlayerInfo } from '@lawn/mp/protocol';
import type { PartyMsg } from './config';

export interface NetStatus {
  status: 'off' | 'connecting' | 'queued' | 'playing' | 'error';
  message: string;
  code: string | null;
}
export interface MatchInfo { players: PlayerInfo[]; hostId: number; you: number; seed: number }

export interface PartyNet {
  readonly status: NetStatus;
  readonly isHost: boolean;
  readonly myId: number | null;
  readonly unavailable: boolean;
  quickMatch(name: string): void;
  joinRoom(code: string, name: string): void;
  leave(): void;
  broadcast(m: PartyMsg): void;
  sendToHost(m: PartyMsg): void;
  onStatus(fn: (s: NetStatus) => void): void;
  onMatch(fn: (m: MatchInfo) => void): void;
  onMessage(fn: (fromId: number, m: PartyMsg) => void): void;
  onLeft(fn: (id: number) => void): void;
  onHost(fn: (hostId: number) => void): void;
  onLost(fn: (reason: string) => void): void;
  update(dt: number): void;
}

export function createNet(): PartyNet {
  const status: NetStatus = { status: 'off', message: '', code: null };
  return {
    status,
    isHost: true,
    myId: null,
    unavailable: true,
    quickMatch() {},
    joinRoom() {},
    leave() {},
    broadcast() {},
    sendToHost() {},
    onStatus() {},
    onMatch() {},
    onMessage() {},
    onLeft() {},
    onHost() {},
    onLost() {},
    update() {},
  };
}
