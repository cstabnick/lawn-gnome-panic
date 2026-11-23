// The online session: rooms, players and the relay (roadmap 8.6). Step 0 stub: status offline, every call a no-op.
import type { Bus } from '../game/bus';
import type { Clock, NetPlayer, NetSession, NetStatus, RoomChoice } from '../game/types';
import type { PlayerKey } from '../sim/types';
import type { NetClient } from '@lawn/mp';
import type { SimHost } from '../game/types';
import type { DaygMsg, Pose } from './protocol';

export interface SessionDeps { host: SimHost; bus: Bus; clock: Clock; getPose: () => Pose; client?: NetClient<DaygMsg> }

export function createNetSession(deps: SessionDeps): NetSession {
  return {
    status: 'offline' as NetStatus,
    code: null,
    myId: null,
    players: (): NetPlayer[] => [],
    start: async (c: RoomChoice, me: { name: string; character: string }): Promise<void> => { /* roadmap 8.6 */ },
    leave: (): void => { /* roadmap 8.6 */ },
    update: (dt: number): void => { /* roadmap 8.6 */ },
    send: (to: number | null, m: DaygMsg): void => { /* roadmap 8.6 */ },
    onStatus: (fn: (s: NetStatus) => void): (() => void) => () => {},
    onMessage: (fn: (from: number, m: DaygMsg) => void): (() => void) => () => {},
    keyOf: (id: number): PlayerKey | null => null,
    idOf: (key: PlayerKey): number | null => null,
  };
}
