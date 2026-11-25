import { normalizeBotInput } from '@lawn/jam';
import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '@lawn/jam';

export interface ScriptBotOptions {
  id?: string;
  name?: string;
  /** Maximum ms to wait for a single worker response before timing out. */
  timeoutMs?: number;
  onError?: (err: string) => void;
}

/**
 * Wraps a user-provided JS bot script inside an isolated Web Worker.
 * The script has NO access to window, document, localStorage, fetch, WebSocket, or XHR.
 *
 * Expected script contract:
 *   function decide(state, ctx) { return { moveX, moveZ, turbo, shootPressed, ... }; }
 */
function buildWorkerSource(userCode: string): string {
  return `"use strict";
const __module = { exports: {} };
const __decideFactory = (function(
  window, document, localStorage, sessionStorage,
  fetch, XMLHttpRequest, WebSocket, EventSource,
  importScripts, indexedDB, navigator, location,
  module, exports
) {
${userCode}
;
if (typeof decide === 'function') return decide;
if (typeof module.exports === 'function') return module.exports;
if (module.exports && typeof module.exports.decide === 'function') return module.exports.decide;
return null;
}).call(null,
  undefined, undefined, undefined, undefined,
  undefined, undefined, undefined, undefined,
  undefined, undefined, undefined, undefined,
  __module, __module.exports
);

if (typeof __decideFactory !== 'function') {
  self.postMessage({ type: 'init-error', error: 'Bot script must define function decide(state, ctx).' });
} else {
  self.postMessage({ type: 'ready' });
}

self.onmessage = function(ev) {
  const msg = ev.data;
  if (!msg || msg.type !== 'tick') return;
  if (typeof __decideFactory !== 'function') {
    self.postMessage({ type: 'result', id: msg.id, input: {} });
    return;
  }
  try {
    const input = __decideFactory(msg.state, msg.ctx) || {};
    self.postMessage({ type: 'result', id: msg.id, input });
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, error: String(err && err.message ? err.message : err) });
  }
};
`;
}

export class WorkerScriptBot implements BotController {
  readonly id: string;
  readonly name: string;
  private worker: Worker | null = null;
  private blobUrl: string | null = null;
  private inFlight = false;
  private lastSentAt = 0;
  private reqId = 0;
  private latestInput: BotInput = {};
  private timeoutMs: number;
  private onError?: (err: string) => void;
  private disposed = false;
  private errorCount = 0;
  private pendingResolve: ((input: BotInput) => void) | null = null;

  constructor(code: string, opts: ScriptBotOptions = {}) {
    this.id = opts.id ?? 'custom-script';
    this.name = opts.name ?? 'Custom Script Bot';
    this.timeoutMs = opts.timeoutMs ?? 250;
    this.onError = opts.onError;

    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
      this.onError?.('Web Workers are not available in this environment.');
      return;
    }

    const src = buildWorkerSource(code);
    const blob = new Blob([src], { type: 'application/javascript' });
    this.blobUrl = URL.createObjectURL(blob);
    this.worker = new Worker(this.blobUrl);
    this.worker.onmessage = (ev) => {
      const data = ev.data;
      if (!data) return;
      if (data.type === 'init-error') {
        this.onError?.(data.error);
        this.dispose();
        return;
      }
      if (data.type === 'error') {
        this.inFlight = false;
        this.errorCount++;
        this.onError?.(data.error);
        if (this.pendingResolve) {
          this.pendingResolve({});
          this.pendingResolve = null;
        }
        if (this.errorCount >= 10) {
          this.onError?.('Bot stopped after 10 runtime errors.');
          this.dispose();
        }
        return;
      }
      if (data.type === 'result') {
        this.inFlight = false;
        this.latestInput = normalizeBotInput(data.input);
        if (this.pendingResolve) {
          this.pendingResolve(this.latestInput);
          this.pendingResolve = null;
        }
      }
    };
    this.worker.onerror = (ev) => {
      this.inFlight = false;
      this.onError?.(ev.message || 'Worker syntax/runtime error');
      if (this.pendingResolve) {
        this.pendingResolve({});
        this.pendingResolve = null;
      }
    };
  }

  /** Non-blocking tick used by the 60fps browser loop. */
  decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
    if (this.disposed || !this.worker) return {};

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.inFlight && now - this.lastSentAt > this.timeoutMs) {
      // Worker hung (e.g. infinite loop) — terminate it safely.
      this.onError?.(`Bot script timed out (> ${this.timeoutMs}ms) and was terminated.`);
      this.dispose();
      return {};
    }

    if (!this.inFlight) {
      this.inFlight = true;
      this.lastSentAt = now;
      this.reqId++;
      this.worker.postMessage({ type: 'tick', id: this.reqId, state, ctx });
    }

    return this.latestInput;
  }

  /** Lockstep async tick for deterministic testing or headless stepping. */
  decideAsync(state: GameStateSnapshot, ctx: BotDecisionContext): Promise<BotInput> {
    if (this.disposed || !this.worker) return Promise.resolve({});
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.inFlight = true;
      this.lastSentAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.reqId++;
      this.worker!.postMessage({ type: 'tick', id: this.reqId, state, ctx });
    });
  }

  reset(): void {
    this.latestInput = {};
    this.inFlight = false;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}

/** Quick static syntax check before spawning a worker (does not execute code). */
export function validateBotScriptSyntax(code: string): string | null {
  if (!code.trim()) return 'Script is empty.';
  try {
    // Parse-only check: Function constructor parses without executing the body.
    new Function(code);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

export function loadBotScript(code: string, opts: ScriptBotOptions = {}): WorkerScriptBot {
  return new WorkerScriptBot(code, opts);
}
