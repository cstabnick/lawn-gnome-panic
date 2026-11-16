~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
Online play over the shared matchmaking server: quick match or room code, the match's players and host, relaying PartyMsg, keepalive pings, players leaving, host changes and a lost connection, all behind one small interface main.ts uses.

## Read first
- packages/mp/src/client.ts: createNetClient(url, game, hello), serverUrl(), NetClient (connect, queue, leave, send, drop, onMessage, onClose)
- packages/mp/src/protocol.ts: ServerMsg ('welcome', 'queued', 'match', 'relay', 'left', 'host', 'beat', 'ended', 'error'), PlayerInfo, MATCH_SILENT_S, GAMES['gnome-party']
- games/gnome-bowling/src/net.ts: a working example of the same job (read only; copy patterns, do not import)
- games/gnome-party/src/config.ts: PartyMsg, GAME_ID
- games/gnome-party/src/net.ts: the stub you replace

## Change
- games/gnome-party/src/net.ts: implement the Contract.

## Contract (keep these exports exactly)
import type { PlayerInfo } from '@lawn/mp/protocol';
import type { PartyMsg } from './config';

export interface NetStatus {
  status: 'off' | 'connecting' | 'queued' | 'playing' | 'error';
  /** Human-readable line for the menu ("Waiting for players: 2 / 4, starts in 12 s", "Could not reach the server"). */
  message: string;
  /** Room code while queued with one, else null. */
  code: string | null;
}
export interface MatchInfo { players: PlayerInfo[]; hostId: number; you: number; seed: number }

export interface PartyNet {
  readonly status: NetStatus;
  readonly isHost: boolean;
  readonly myId: number | null;
  /** True when serverUrl() is '' (online not set up for this build): the menu hides online buttons. */
  readonly unavailable: boolean;
  quickMatch(name: string): void;
  /** code: 4-8 of A-Z 0-9 (upper-case it). */
  joinRoom(code: string, name: string): void;
  leave(): void;
  /** Host -> everyone else. */
  broadcast(m: PartyMsg): void;
  /** Anyone -> the host (no-op on the host). */
  sendToHost(m: PartyMsg): void;
  onStatus(fn: (s: NetStatus) => void): void;
  onMatch(fn: (m: MatchInfo) => void): void;
  onMessage(fn: (fromId: number, m: PartyMsg) => void): void;
  onLeft(fn: (id: number) => void): void;
  /** The server named a new host (fires for everyone, including the new host). */
  onHost(fn: (hostId: number) => void): void;
  /** The connection or match is gone (closed socket, 'ended'). The party is over for this screen. */
  onLost(fn: (reason: string) => void): void;
  /** Every frame: non-hosts send { k:'ping' } to the host every 2 s while playing, so the server never times them out. */
  update(dt: number): void;
}
export function createNet(): PartyNet;

Behaviour:
- One NetClient, created on first quickMatch/joinRoom: createNetClient<PartyMsg>(serverUrl(), 'gnome-party', { name, character: getMyGnome()?.code ?? 'gnorman' })
  (getMyGnome from '@lawn/gnome'). connect() then queue(code | null, character, name).
- 'queued' → status 'queued' with "Waiting for players: N / 4, starts in S s". 'match' → status 'playing', remember hostId,
  call prefetchLooks(players) (from '@lawn/gnome'), fire onMatch. 'relay' → validate it is an object with a string `k` in
  'party' | 'snap' | 'in' | 'roll' | 'ping', else drop it; fire onMessage(from, d). 'left' → onLeft. 'host' → update hostId, onHost.
  'ended' or a socket close while playing → status 'off', onLost(reason). 'error' with code 'bad-name' → status 'error', message "Pick another name".
- broadcast = client.send(null, m) (host only; ignored otherwise). sendToHost = client.send(hostId, m).
- leave(): client.leave(), status 'off', no onLost.

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- `npm test -w packages/mp-server` passes (it exercises the server, including the 'gnome-party' id added in epic 1). You are the only
  worker allowed to start the mp-server (port 8787); stop anything you start.
- Reading the code: every ServerMsg case listed under Behaviour is handled, and a relay with an unknown or missing `k` is dropped.

## Out of scope
main.ts (it wires your callbacks), packages/mp and packages/mp-server (do not edit).
~~~~
