import { PitonNetData, RemotePlayerState, ServerMessage } from './protocol';

export interface NetCallbacks {
  onWelcome: (playerId: string, code: string, seed: number, players: RemotePlayerState[], pitons: PitonNetData[]) => void;
  onSnapshot: (players: RemotePlayerState[]) => void;
  onPlayerLeft: (playerId: string) => void;
  onPing: (msg: { playerId: string; name: string; color: string; x: number; y: number; z: number }) => void;
  onPiton: (piton: PitonNetData) => void;
  onRevive: (byName: string) => void;
  onSummit: (name: string, timeSec: number) => void;
  onError: (message: string) => void;
  onDisconnect: () => void;
}

export class NetClient {
  private ws: WebSocket | null = null;
  private sendTimer = 0;

  connect(action: { type: 'create_room' | 'join_room' | 'quick_join'; name: string; code?: string; seed?: number }, cb: NetCallbacks): void {
    this.disconnect();
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    let opened = false;
    ws.onopen = () => {
      opened = true;
      ws.send(JSON.stringify(action));
    };

    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(ev.data)) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case 'welcome':
          cb.onWelcome(msg.playerId, msg.code, msg.seed, msg.players, msg.pitons);
          break;
        case 'snapshot':
          cb.onSnapshot(msg.players);
          break;
        case 'player_left':
          cb.onPlayerLeft(msg.playerId);
          break;
        case 'ping':
          cb.onPing(msg);
          break;
        case 'piton':
          cb.onPiton(msg);
          break;
        case 'revive':
          cb.onRevive(msg.byName);
          break;
        case 'summit':
          cb.onSummit(msg.name, msg.timeSec);
          break;
        case 'error':
          cb.onError(msg.message);
          break;
      }
    };

    ws.onerror = () => {
      if (!opened) {
        cb.onError('Could not reach multiplayer server (start it with: npm run dev -w games/peak-climb/server).');
      }
    };

    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null;
        cb.onDisconnect();
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  sendState(
    dt: number,
    state: {
      x: number;
      y: number;
      z: number;
      yaw: number;
      pitch: number;
      mode: string;
      stamina: number;
      hp: number;
    }
  ): void {
    if (!this.isConnected()) return;
    this.sendTimer += dt;
    if (this.sendTimer < 0.05) return; // 20 Hz
    this.sendTimer = 0;
    this.ws!.send(JSON.stringify({ type: 'state', ...state }));
  }

  sendPing(x: number, y: number, z: number): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'ping', x, y, z }));
    }
  }

  sendPiton(x: number, y: number, z: number, nx: number, ny: number, nz: number): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'piton', x, y, z, nx, ny, nz }));
    }
  }

  sendRevive(targetId: string): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'revive', targetId }));
    }
  }

  sendSummit(timeSec: number): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'summit', timeSec }));
    }
  }
}
