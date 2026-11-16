import { WebSocketServer, WebSocket } from 'ws';

interface PlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  mode: string;
  stamina: number;
  hp: number;
  grabX?: number;
  grabY?: number;
  grabZ?: number;
}

interface PitonData {
  id: string;
  playerId: string;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

interface Room {
  code: string;
  seed: number;
  clients: Map<string, { ws: WebSocket; state: PlayerState }>;
  pitons: PitonData[];
}

const PORT = Number(process.env.PORT ?? 8081);
const PALETTE = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#ff9f43', '#55efc4', '#fd79a8', '#74b9ff'];

const rooms = new Map<string, Room>();
let nextId = 1;

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? randomCode() : code;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 899999) + 100000;
}

function sanitizeName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().slice(0, 16) : '';
  return s || 'Climber';
}

function send(ws: WebSocket, msg: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: unknown, excludeId?: string): void {
  const payload = JSON.stringify(msg);
  for (const [id, client] of room.clients) {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  const playerId = `p${nextId++}`;
  let currentRoom: Room | null = null;

  const joinRoom = (room: Room, name: string, color?: string) => {
    if (currentRoom) leaveRoom();
    currentRoom = room;
    const assignedColor =
      typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
        ? color
        : PALETTE[room.clients.size % PALETTE.length];

    const initialState: PlayerState = {
      id: playerId,
      name: sanitizeName(name),
      color: assignedColor,
      x: 0,
      y: 1.7,
      z: 10,
      yaw: 0,
      pitch: 0,
      mode: 'grounded',
      stamina: 100,
      hp: 100,
    };

    const existing = Array.from(room.clients.values()).map((c) => c.state);
    room.clients.set(playerId, { ws, state: initialState });

    send(ws, {
      type: 'welcome',
      playerId,
      code: room.code,
      seed: room.seed,
      players: existing,
      pitons: room.pitons,
    });
  };

  const leaveRoom = () => {
    if (!currentRoom) return;
    currentRoom.clients.delete(playerId);
    broadcast(currentRoom, { type: 'player_left', playerId });
    if (currentRoom.clients.size === 0) {
      rooms.delete(currentRoom.code);
    }
    currentRoom = null;
  };

  ws.on('message', (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create_room': {
        const seed = typeof msg.seed === 'number' && Number.isFinite(msg.seed) ? Math.floor(msg.seed) : randomSeed();
        const room: Room = { code: randomCode(), seed, clients: new Map(), pitons: [] };
        rooms.set(room.code, room);
        joinRoom(room, String(msg.name ?? ''), typeof msg.color === 'string' ? msg.color : undefined);
        break;
      }
      case 'join_room': {
        const code = typeof msg.code === 'string' ? msg.code.trim().toUpperCase() : '';
        const room = rooms.get(code);
        if (!room) {
          send(ws, { type: 'error', message: `Room "${code}" not found.` });
          return;
        }
        joinRoom(room, String(msg.name ?? ''), typeof msg.color === 'string' ? msg.color : undefined);
        break;
      }
      case 'quick_join': {
        let target: Room | undefined;
        for (const room of rooms.values()) {
          if (room.clients.size < 8) {
            target = room;
            break;
          }
        }
        if (!target) {
          const seed = typeof msg.seed === 'number' && Number.isFinite(msg.seed) ? Math.floor(msg.seed) : randomSeed();
          target = { code: randomCode(), seed, clients: new Map(), pitons: [] };
          rooms.set(target.code, target);
        }
        joinRoom(target, String(msg.name ?? ''), typeof msg.color === 'string' ? msg.color : undefined);
        break;
      }
      case 'state': {
        if (!currentRoom) return;
        const entry = currentRoom.clients.get(playerId);
        if (!entry) return;
        const s = entry.state;
        if (typeof msg.x === 'number') s.x = msg.x;
        if (typeof msg.y === 'number') s.y = msg.y;
        if (typeof msg.z === 'number') s.z = msg.z;
        if (typeof msg.yaw === 'number') s.yaw = msg.yaw;
        if (typeof msg.pitch === 'number') s.pitch = msg.pitch;
        if (typeof msg.mode === 'string') s.mode = msg.mode;
        if (typeof msg.stamina === 'number') s.stamina = msg.stamina;
        if (typeof msg.hp === 'number') s.hp = msg.hp;
        s.grabX = typeof msg.grabX === 'number' ? msg.grabX : undefined;
        s.grabY = typeof msg.grabY === 'number' ? msg.grabY : undefined;
        s.grabZ = typeof msg.grabZ === 'number' ? msg.grabZ : undefined;
        break;
      }
      case 'ping': {
        if (!currentRoom) return;
        const entry = currentRoom.clients.get(playerId);
        if (!entry) return;
        if (typeof msg.x === 'number' && typeof msg.y === 'number' && typeof msg.z === 'number') {
          broadcast(currentRoom, {
            type: 'ping',
            playerId,
            name: entry.state.name,
            color: entry.state.color,
            x: msg.x,
            y: msg.y,
            z: msg.z,
          });
        }
        break;
      }
      case 'piton': {
        if (!currentRoom) return;
        if (
          typeof msg.x === 'number' &&
          typeof msg.y === 'number' &&
          typeof msg.z === 'number' &&
          typeof msg.nx === 'number' &&
          typeof msg.ny === 'number' &&
          typeof msg.nz === 'number'
        ) {
          const piton: PitonData = {
            id: `pt${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            x: msg.x,
            y: msg.y,
            z: msg.z,
            nx: msg.nx,
            ny: msg.ny,
            nz: msg.nz,
          };
          currentRoom.pitons.push(piton);
          if (currentRoom.pitons.length > 64) currentRoom.pitons.shift();
          broadcast(currentRoom, { type: 'piton', ...piton });
        }
        break;
      }
      case 'revive': {
        if (!currentRoom) return;
        const entry = currentRoom.clients.get(playerId);
        const targetId = typeof msg.targetId === 'string' ? msg.targetId : '';
        const target = currentRoom.clients.get(targetId);
        if (entry && target) {
          send(target.ws, { type: 'revive', targetId, byName: entry.state.name });
        }
        break;
      }
      case 'summit': {
        if (!currentRoom) return;
        const entry = currentRoom.clients.get(playerId);
        if (entry && typeof msg.timeSec === 'number') {
          broadcast(currentRoom, {
            type: 'summit',
            playerId,
            name: entry.state.name,
            timeSec: msg.timeSec,
          });
        }
        break;
      }
    }
  });

  ws.on('close', leaveRoom);
  ws.on('error', leaveRoom);
});

// 20 Hz state snapshot broadcast
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.clients.size === 0) continue;
    const players = Array.from(room.clients.values()).map((c) => c.state);
    broadcast(room, { type: 'snapshot', players });
  }
}, 50);

console.log(`PEAK CLIMB multiplayer server listening on ws://localhost:${PORT}`);
