// Game messages relayed by the shared server (the `d` of a relay). The server never reads them.
// Host = one browser per match (hostId from the 'match' message). Everyone else is a client.
import type { MowerInput, Snapshot, WorldEvent } from '../config';

export type GameMsg =
  /** client -> host, ~INPUT_HZ: what I want. */
  | { k: 'input'; in: MowerInput }
  /** client -> host: I died and want to play again. */
  | { k: 'respawn' }
  /** host -> everyone, ~SNAP_HZ. */
  | { k: 'snap'; s: Snapshot }
  /** host -> everyone: things that happened since the last snapshot. */
  | { k: 'events'; e: WorldEvent[] };
