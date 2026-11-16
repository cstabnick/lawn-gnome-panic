import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { GameRoomSim } from '../../src/shared/sim';
import type { ClientMessage, ServerMessage } from '../../src/shared/types';

const PORT = Number(process.env.PORT) || 8788;

interface ClientConn {
  ws: WebSocket;
  playerId: string;
  roomCode: string | null;
}

interface Room {
  code: string;
  sim: GameRoomSim;
  clients: Map<string, ClientConn>;
}

const rooms = new Map<string, Room>();
let nextPlayerId = 1;

function makeRoomCode(): string {
  const words = ['SHED', 'AMEN', 'MULC', 'GNOM', 'DEKU', 'WORM', 'BARK', 'TOAD'];
  for (const w of words) {
    if (!rooms.has(w)) return w;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? makeRoomCode() : code;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastRoom(room: Room, msg: ServerMessage): void {
  const raw = JSON.stringify(msg);
  for (const c of room.clients.values()) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(raw);
    }
  }
}

function joinRoom(conn: ClientConn, room: Room, name: string, color: string): void {
  if (conn.roomCode && rooms.has(conn.roomCode)) {
    leaveRoom(conn);
  }
  conn.roomCode = room.code;
  room.clients.set(conn.playerId, conn);
  const p = room.sim.addPlayer(conn.playerId, name, color);
  send(conn.ws, {
    type: 'joined',
    playerId: conn.playerId,
    roomCode: room.code,
    snapshot: room.sim.snapshot,
  });
  broadcastRoom(room, {
    type: 'chat',
    message: {
      id: `sys_${Date.now()}`,
      sender: 'Gnome Jesus',
      text: `${p.name} entered the Shed!`,
      color: '#fde047',
      isSystem: true,
    },
  });
}

function leaveRoom(conn: ClientConn): void {
  if (!conn.roomCode) return;
  const room = rooms.get(conn.roomCode);
  conn.roomCode = null;
  if (!room) return;
  const p = room.sim.snapshot.players[conn.playerId];
  room.clients.delete(conn.playerId);
  room.sim.removePlayer(conn.playerId);
  if (p) {
    broadcastRoom(room, {
      type: 'chat',
      message: {
        id: `sys_${Date.now()}`,
        sender: 'Gnome Jesus',
        text: `${p.name} returned to the mulch.`,
        color: '#94a3b8',
        isSystem: true,
      },
    });
  }
  if (room.clients.size === 0) {
    rooms.delete(room.code);
  }
}

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const conn: ClientConn = {
    ws,
    playerId: `p_${nextPlayerId++}`,
    roomCode: null,
  };

  ws.on('message', (data) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(data)) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === 'create_room') {
      const code = makeRoomCode();
      const room: Room = {
        code,
        sim: new GameRoomSim(code),
        clients: new Map(),
      };
      rooms.set(code, room);
      joinRoom(conn, room, msg.name, msg.color);
      return;
    }

    if (msg.type === 'join_room') {
      const code = msg.code.trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        send(ws, { type: 'error', message: `Shed "${code}" not found.` });
        return;
      }
      if (room.clients.size >= 6) {
        send(ws, { type: 'error', message: `Shed "${code}" is full (6/6 gnomes).` });
        return;
      }
      joinRoom(conn, room, msg.name, msg.color);
      return;
    }

    if (msg.type === 'quick_join') {
      let target: Room | undefined;
      for (const r of rooms.values()) {
        if (r.clients.size < 6) {
          target = r;
          break;
        }
      }
      if (!target) {
        const code = makeRoomCode();
        target = { code, sim: new GameRoomSim(code), clients: new Map() };
        rooms.set(code, target);
      }
      joinRoom(conn, target, msg.name, msg.color);
      return;
    }

    if (!conn.roomCode) return;
    const room = rooms.get(conn.roomCode);
    if (!room) return;

    switch (msg.type) {
      case 'input':
        room.sim.applyInput(conn.playerId, msg.input);
        break;
      case 'interact':
        room.sim.handleInteract(conn.playerId);
        break;
      case 'drop_item':
        room.sim.handleDropItem(conn.playerId);
        break;
      case 'use_item':
        room.sim.handleUseItem(conn.playerId, msg.dirX, msg.dirY, msg.dirZ);
        break;
      case 'buy_tool':
        room.sim.handleBuyTool(conn.playerId, msg.kind);
        break;
      case 'pray':
        room.sim.handlePray(conn.playerId);
        break;
      case 'pull_lever':
        room.sim.handlePullLever(conn.playerId);
        break;
      case 'chat': {
        const p = room.sim.snapshot.players[conn.playerId];
        if (!p) break;
        const text = msg.text.trim().slice(0, 140);
        if (!text) break;
        broadcastRoom(room, {
          type: 'chat',
          message: {
            id: `c_${Date.now()}_${Math.random()}`,
            sender: p.name,
            text,
            color: p.color,
          },
        });
        break;
      }
    }
  });

  ws.on('close', () => leaveRoom(conn));
  ws.on('error', () => leaveRoom(conn));
});

let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;

  for (const room of rooms.values()) {
    room.sim.step(dt);
    broadcastRoom(room, { type: 'snapshot', snapshot: room.sim.snapshot });
  }
}, 50);

server.listen(PORT, () => {
  console.log(`[gnome-company-server] listening on http://localhost:${PORT} (ws at /ws)`);
});
