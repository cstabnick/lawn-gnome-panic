// Wire messages of Once in a Gnomillion (the `d` of an @lawn/mp relay). The HOST's browser owns the Room
// (engine.ts) and persists it; guests only send intents and render the PublicRoom the host sends back.
import type { ClosedRound, Player, Room } from '../engine';

/** A Room as guests see it: the open round's answers are hidden, only WHO has answered is known. */
export interface PublicRoom {
  code: string; hostPid: string; players: Player[]; windowMs: number; totalRounds: number;
  current: { n: number; prompt: string; openedAt: number; closesAt: number; answered: string[] } | null;
  history: ClosedRound[];
}
export type GuestMsg =
  | { t: 'join'; pid: string; name: string }
  | { t: 'answer'; pid: string; round: number; text: string; at: number };
export type HostMsg =
  | { t: 'state'; room: PublicRoom }
  | { t: 'ack'; pid: string; round: number; ok: boolean; why?: string };
export type Msg = GuestMsg | HostMsg;
/** An answer written while the host was away; kept in localStorage (KEY_PENDING) and resent on reconnect. */
export interface PendingAnswer { code: string; pid: string; round: number; text: string; at: number }

export function toPublic(room: Room): PublicRoom {
  const { current, promptOrder: _o, ...rest } = room;
  return { ...rest, current: current && { n: current.n, prompt: current.prompt, openedAt: current.openedAt, closesAt: current.closesAt, answered: Object.keys(current.answers) } };
}
