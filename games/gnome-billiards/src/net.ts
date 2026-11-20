// Online 8-ball over the shared matchmaking server (@lawn/mp). No host logic: the shooter's browser plays the shot,
// relays the cue and the strike, and then sends the settled table. The other browser runs the same physics for the
// animation and takes the shooter's table as the truth, so a small difference never sticks.
import { getMyGnome } from '@lawn/gnome';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { GAME_ID } from './config';
import type { Match } from './rules';

export type BilMsg =
  | { k: 'shot'; vx: number; vy: number; cx?: number; cy?: number }
  | { k: 'sync'; match: Match };

export interface NetHandlers {
  onStatus(text: string): void;
  onMatch(players: PlayerInfo[], you: number, seed: number): void;
  onMsg(m: BilMsg): void;
  onGone(reason: string): void;
}

export interface OnlineLink {
  queue(code: string | null): void;
  send(m: BilMsg): void;
  leave(): void;
}

export function openOnline(h: NetHandlers): OnlineLink {
  const name = getMyGnome()?.name ?? 'Gnome';
  const character = getMyGnome()?.code ?? 'gnorman';
  let playing = false;
  const client: NetClient<BilMsg> = createNetClient<BilMsg>(serverUrl(), GAME_ID, { name, character });
  client.onMessage((m: ServerMsg<BilMsg>) => {
    switch (m.t) {
      case 'queued':
        h.onStatus(m.code ? `Waiting for a friend in room ${m.code}…` : `Looking for an opponent… ${m.startsInS > 0 ? `(${m.startsInS}s)` : ''}`);
        return;
      case 'match':
        playing = true;
        h.onMatch(m.players, m.you, m.seed);
        return;
      case 'relay':
        if (playing) h.onMsg(m.d);
        return;
      case 'left':
        if (playing) {
          playing = false;
          h.onGone('Your opponent left the table.');
        }
        return;
      case 'ended':
        if (playing) {
          playing = false;
          h.onGone('The match ended.');
        }
        return;
      case 'error':
        h.onStatus(m.message);
        return;
      default:
        return;
    }
  });
  client.onClose(() => {
    if (playing) {
      playing = false;
      h.onGone('Connection lost.');
    }
  });
  return {
    queue(code) {
      client
        .connect()
        .then(() => client.queue(code, character, name))
        .catch(() => h.onStatus('Could not reach the server. Try again in a moment.'));
    },
    send(m) {
      client.send(null, m);
    },
    leave() {
      playing = false;
      client.leave();
    },
  };
}
