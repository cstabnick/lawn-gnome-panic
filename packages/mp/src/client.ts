// Browser client for the shared matchmaking server: one WebSocket, JSON messages from protocol.ts.
import { PROTOCOL_VERSION, type AnyGameMsg, type ClientMsg, type GameId, type ServerMsg } from './protocol';

/**
 * The matchmaking server's WebSocket URL: ?mp=<url> wins, then the VITE_MP_URL build variable,
 * then ws://localhost:8787/ws on a local dev server. '' = online is not set up for this build.
 */
export function serverUrl(): string {
  const param = new URLSearchParams(location.search).get('mp');
  if (param) return param;
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  if (env?.VITE_MP_URL) return env.VITE_MP_URL;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'ws://localhost:8787/ws';
  return '';
}

export interface NetClient<G = AnyGameMsg> {
  /** My player id once welcomed, else null. */
  readonly id: number | null;
  readonly connected: boolean;
  /** performance.now() when the server was last heard from. */
  readonly lastHeardAt: number;
  /** Opens the socket and says hello; resolves on 'welcome'. Safe to call again while open. */
  connect(): Promise<void>;
  /** Join matchmaking: code null = public queue, else a room code (4-8 of A-Z, 0-9). */
  queue(code: string | null, character: string, name: string): void;
  leave(): void;
  /** Relay d to one player of my match (to = id) or to everyone else (to = null). */
  send(to: number | null, d: G): void;
  chat(text: string): void;
  /** Closes the socket without a reconnect. Close listeners run. */
  drop(): void;
  onMessage(fn: (m: ServerMsg<G>) => void): void;
  onClose(fn: () => void): void;
}

export function createNetClient<G = AnyGameMsg>(url: string, game: GameId, hello: { name: string; character: string }): NetClient<G> {
  let ws: WebSocket | null = null;
  let id: number | null = null;
  let opening: Promise<void> | null = null;
  let lastHeardAt = 0;
  const listeners: ((m: ServerMsg<G>) => void)[] = [];
  const closers: (() => void)[] = [];

  function raw(m: ClientMsg<G>): void {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
  }

  return {
    get id() { return id; },
    get connected() { return ws !== null && ws.readyState === WebSocket.OPEN && id !== null; },
    get lastHeardAt() { return lastHeardAt; },
    connect() {
      if (ws && ws.readyState === WebSocket.OPEN && id !== null) return Promise.resolve();
      if (opening) return opening;
      opening = new Promise<void>((resolve, reject) => {
        const sock = new WebSocket(url);
        ws = sock;
        let welcomed = false;
        sock.onopen = () => raw({ t: 'hello', v: PROTOCOL_VERSION, name: hello.name, character: hello.character, game });
        sock.onmessage = (ev) => {
          lastHeardAt = performance.now();
          let m: ServerMsg<G>;
          try {
            m = JSON.parse(String(ev.data)) as ServerMsg<G>;
          } catch {
            return;
          }
          if (m.t === 'welcome') {
            id = m.id;
            welcomed = true;
            opening = null;
            resolve();
          }
          for (const fn of listeners) fn(m);
        };
        sock.onerror = () => {
          if (!welcomed) reject(new Error('Could not reach the matchmaking server'));
        };
        sock.onclose = () => {
          if (ws === sock) ws = null;
          id = null;
          opening = null;
          if (!welcomed) reject(new Error('Could not reach the matchmaking server'));
          for (const fn of closers) fn();
        };
      });
      return opening;
    },
    queue(code, character, name) { raw({ t: 'queue', code, character, name }); },
    leave() { raw({ t: 'leave' }); },
    send(to, d) { raw({ t: 'relay', to, d }); },
    chat(text) { raw({ t: 'chat', text }); },
    drop() {
      const sock = ws;
      if (!sock) return;
      ws = null;
      id = null;
      opening = null;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onerror = null;
      sock.onclose = null;
      try {
        sock.close();
      } catch {
        // already closing
      }
      for (const fn of closers) fn();
    },
    onMessage(fn) { listeners.push(fn); },
    onClose(fn) { closers.push(fn); },
  };
}
