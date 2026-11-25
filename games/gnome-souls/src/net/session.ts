// @lawn/mp host-authoritative co-op session wrapper for Gnome Souls.
import { createNetClient, serverUrl, type NetClient, type PlayerInfo } from '@lawn/mp';
import { getMyGnome } from '@lawn/gnome';
import type { PlayerActionInput, WorldState } from '../sim/types';
import type { GameNetMsg, WorldSnapshotMsg } from './protocol';

export interface OnlineSession {
  client: NetClient<GameNetMsg>;
  isHost: () => boolean;
  myId: () => number;
  roster: () => PlayerInfo[];
  sendInput: (inp: PlayerActionInput) => void;
  broadcastSnapshot: (state: WorldState) => void;
  close: () => void;
}

export function startOnlineSession(
  roomCode: string | null,
  callbacks: {
    onStatus: (msg: string) => void;
    onMatchReady: (isHost: boolean, myId: number, players: PlayerInfo[]) => void;
    onRosterChanged: (players: PlayerInfo[]) => void;
    onHostTakeover: () => void;
    onGuestInput: (playerId: number, inp: PlayerActionInput) => void;
    onSnapshot: (snap: WorldSnapshotMsg) => void;
    onError: (msg: string) => void;
  },
): OnlineSession {
  const mine = getMyGnome();
  const url = serverUrl();
  let roster: PlayerInfo[] = [];
  let hostFlag = false;
  let myId = -1;

  const charCode = mine?.code ?? 'gnorman';
  const myName = mine?.name ?? 'Ashen Gnome';
  const client = createNetClient<GameNetMsg>(url, 'gnome-souls', {
    name: myName,
    character: charCode,
    resumable: true,
  });

  client.onMessage((m) => {
    if (m.t === 'queued') {
      callbacks.onStatus(`Summoning (${m.players} gnomes)...`);
    } else if (m.t === 'match') {
      myId = m.you;
      hostFlag = m.hostId === myId;
      roster = [...m.players];
      callbacks.onMatchReady(hostFlag, myId, roster);
    } else if (m.t === 'joined') {
      roster.push(m.player);
      callbacks.onRosterChanged(roster);
    } else if (m.t === 'left') {
      roster = roster.filter((p) => p.id !== m.id);
      callbacks.onRosterChanged(roster);
    } else if (m.t === 'host') {
      hostFlag = m.hostId === myId;
      if (hostFlag) callbacks.onHostTakeover();
    } else if (m.t === 'relay') {
      if (m.d.t === 'inp') {
        callbacks.onGuestInput(m.from, m.d.inp);
      } else if (m.d.t === 'snap') {
        callbacks.onSnapshot(m.d);
      }
    } else if (m.t === 'error') {
      callbacks.onError(m.message);
    }
  });

  client.onClose(() => callbacks.onStatus('Disconnected from relay'));
  void client
    .connect()
    .then(() => client.queue(roomCode, charCode, myName))
    .catch((err) => callbacks.onError(String(err)));

  return {
    client,
    isHost: () => hostFlag,
    myId: () => myId,
    roster: () => roster,
    sendInput(inp) {
      client.send(null, { t: 'inp', inp });
    },
    broadcastSnapshot(state) {
      const snap: WorldSnapshotMsg = {
        t: 'snap',
        tick: state.tick,
        time: state.time,
        fogOpen: state.fogOpen,
        victory: state.victory,
        players: state.players.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
          color: p.color,
          userId: p.userId,
          x: p.x,
          z: p.z,
          facing: p.facing,
          hp: p.hp,
          maxHp: p.maxHp,
          stamina: p.stamina,
          maxStamina: p.maxStamina,
          flasks: p.flasks,
          action: p.action,
          actionTimer: p.actionTimer,
          attackId: p.attackId,
        })),
        enemies: state.enemies.map((e) => ({
          id: e.id,
          kind: e.kind,
          x: e.x,
          z: e.z,
          facing: e.facing,
          hp: e.hp,
          maxHp: e.maxHp,
          state: e.state,
          timer: e.timer,
        })),
        boss: {
          active: state.boss.active,
          alive: state.boss.alive,
          hp: state.boss.hp,
          maxHp: state.boss.maxHp,
          phase: state.boss.phase,
          attack: state.boss.attack,
          timer: state.boss.timer,
          aimAngle: state.boss.aimAngle,
          segments: state.boss.segments,
          telegraph: state.boss.telegraph,
        },
      };
      client.send(null, snap);
    },
    close() {
      client.drop();
    },
  };
}
