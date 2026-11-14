import type { NetClient } from '../config';
import { PROTOCOL_VERSION, type ClientMsg, type GameMsg, type ServerMsg } from './protocol';

/**
 * The matchmaking server's WebSocket URL: ?mp=<url> wins, then the VITE_MP_URL build variable,
 * then ws://localhost:8787 on a local dev server. '' = online is not set up for this build.
 */
export function serverUrl(): string {
  const param = new URLSearchParams(location.search).get('mp');
  if (param) return param;
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  if (env?.VITE_MP_URL) return env.VITE_MP_URL;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'ws://localhost:8787/ws';
  return '';
}

/** One WebSocket to the matchmaking server; JSON messages from src/net/protocol.ts. */
export function createNetClient(url: string, hello: { name: string; character: string }): NetClient {
  let ws: WebSocket | null = null;
  let id: number | null = null;
  let opening: Promise<void> | null = null;
  let lastHeardAt = 0;
  const listeners: ((m: ServerMsg) => void)[] = [];
  const closers: (() => void)[] = [];

  function raw(m: ClientMsg): void {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
  }

  return {
    get id() { return id; },
    get connected() { return ws !== null && ws.readyState === WebSocket.OPEN && id !== null; },
    connect() {
      if (ws && ws.readyState === WebSocket.OPEN && id !== null) return Promise.resolve();
      if (opening) return opening;
      opening = new Promise<void>((resolve, reject) => {
        const sock = new WebSocket(url);
        ws = sock;
        let welcomed = false;
        sock.onopen = () => raw({ t: 'hello', v: PROTOCOL_VERSION, name: hello.name, character: hello.character, game: 'lawn-gnome-panic' });
        sock.onmessage = (ev) => {
          lastHeardAt = performance.now();
          let m: ServerMsg;
          try {
            m = JSON.parse(String(ev.data)) as ServerMsg;
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
    send(to: number | null, d: GameMsg) { raw({ t: 'relay', to, d }); },
    chat(text: string) { raw({ t: 'chat', text }); },
    get lastHeardAt() { return lastHeardAt; },
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
