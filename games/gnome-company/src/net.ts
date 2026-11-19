import { getMyGnome } from '@lawn/gnome';
import { GameRoomSim } from './shared/sim';
import type {
  ChatMessage,
  ClientMessage,
  PlayerInputPacket,
  ServerMessage,
  ToolKind,
  WorldSnapshot,
} from './shared/types';

export interface NetCallbacks {
  onJoined: (playerId: string, roomCode: string, snapshot: WorldSnapshot) => void;
  onSnapshot: (snapshot: WorldSnapshot) => void;
  onChat: (msg: ChatMessage) => void;
  onError: (msg: string) => void;
  onOpenShop?: () => void;
}

export class GameNetClient {
  private ws: WebSocket | null = null;
  private localSim: GameRoomSim | null = null;
  private localTimer: number | null = null;
  public playerId = '';
  public isSolo = false;

  constructor(private cb: NetCallbacks) {}

  public startSolo(name: string, color: string): void {
    this.disconnect();
    this.isSolo = true;
    this.localSim = new GameRoomSim('SOLO');
    this.playerId = 'solo_1';
    this.localSim.addPlayer(this.playerId, name, color, getMyGnome()?.code);
    this.cb.onJoined(this.playerId, 'SOLO', this.localSim.snapshot);
    this.cb.onChat({
      id: `sys_${Date.now()}`,
      sender: 'Gnome Jesus',
      text: 'Solo Pilgrimage started! Pull the Sacred Lever in the Shed when ready.',
      color: '#fde047',
      isSystem: true,
    });

    let last = performance.now();
    this.localTimer = window.setInterval(() => {
      if (!this.localSim) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.localSim.step(dt);
      this.cb.onSnapshot(this.localSim.snapshot);
    }, 50);
  }

  public connectMultiplayer(
    action:
      | { type: 'create_room'; name: string; color: string }
      | { type: 'join_room'; code: string; name: string; color: string }
      | { type: 'quick_join'; name: string; color: string },
  ): void {
    this.disconnect();
    this.isSolo = false;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      const character = getMyGnome()?.code;
      this.sendWs(character ? { ...action, character } : action);
    });

    ws.addEventListener('message', (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(ev.data)) as ServerMessage;
      } catch {
        return;
      }
      if (msg.type === 'joined') {
        this.playerId = msg.playerId;
        this.cb.onJoined(msg.playerId, msg.roomCode, msg.snapshot);
      } else if (msg.type === 'snapshot') {
        this.cb.onSnapshot(msg.snapshot);
      } else if (msg.type === 'chat') {
        this.cb.onChat(msg.message);
      } else if (msg.type === 'error') {
        this.cb.onError(msg.message);
      }
    });

    ws.addEventListener('error', () => {
      this.cb.onError('Could not reach multiplayer server. Try Solo Mode or start the server!');
    });
  }

  public disconnect(): void {
    if (this.localTimer !== null) {
      clearInterval(this.localTimer);
      this.localTimer = null;
    }
    this.localSim = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private sendWs(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public sendInput(input: PlayerInputPacket): void {
    if (this.isSolo && this.localSim) {
      this.localSim.applyInput(this.playerId, input);
    } else {
      this.sendWs({ type: 'input', input });
    }
  }

  public interact(): void {
    if (this.isSolo && this.localSim) {
      const res = this.localSim.handleInteract(this.playerId);
      if (res.openShop && this.cb.onOpenShop) this.cb.onOpenShop();
    } else {
      this.sendWs({ type: 'interact' });
    }
  }

  public dropItem(): void {
    if (this.isSolo && this.localSim) {
      this.localSim.handleDropItem(this.playerId);
    } else {
      this.sendWs({ type: 'drop_item' });
    }
  }

  public useItem(dirX: number, dirY: number, dirZ: number): void {
    if (this.isSolo && this.localSim) {
      this.localSim.handleUseItem(this.playerId, dirX, dirY, dirZ);
    } else {
      this.sendWs({ type: 'use_item', dirX, dirY, dirZ });
    }
  }

  public buyTool(kind: ToolKind): void {
    if (this.isSolo && this.localSim) {
      this.localSim.handleBuyTool(this.playerId, kind);
    } else {
      this.sendWs({ type: 'buy_tool', kind });
    }
  }

  public pray(): void {
    if (this.isSolo && this.localSim) {
      this.localSim.handlePray(this.playerId);
    } else {
      this.sendWs({ type: 'pray' });
    }
  }

  public pullLever(): void {
    if (this.isSolo && this.localSim) {
      this.localSim.handlePullLever(this.playerId);
    } else {
      this.sendWs({ type: 'pull_lever' });
    }
  }

  public sendChat(text: string): void {
    if (this.isSolo) {
      const p = this.localSim?.snapshot.players[this.playerId];
      if (!p || !text.trim()) return;
      this.cb.onChat({
        id: `c_${Date.now()}`,
        sender: p.name,
        text: text.trim().slice(0, 140),
        color: p.color,
      });
    } else {
      this.sendWs({ type: 'chat', text });
    }
  }
}
