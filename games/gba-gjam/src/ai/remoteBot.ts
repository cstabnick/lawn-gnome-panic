import { normalizeBotInput } from '@lawn/jam';
import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '@lawn/jam';

export interface RemoteBotOptions {
  id?: string;
  name?: string;
  /** HTTP endpoint accepting POST { state, ctx } and returning PlayerControlInput JSON. */
  url?: string;
  onStatusChange?: (connected: boolean, detail?: string) => void;
}

export const DEFAULT_REMOTE_BOT_URL = 'http://127.0.0.1:8765/decide';

/**
 * Connects a GBA GJAM bot slot to an external HTTP/JSON server (e.g., Python ML POC).
 * Non-blocking during 60fps browser play; also supports decideAsync() for lockstep ML training.
 */
export class RemoteBotController implements BotController {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  private inFlight = false;
  private latestInput: BotInput = {};
  private disposed = false;
  private connected = false;
  private onStatusChange?: (connected: boolean, detail?: string) => void;

  constructor(opts: RemoteBotOptions = {}) {
    this.id = opts.id ?? 'remote-http';
    this.name = opts.name ?? 'Python / Remote AI';
    this.url = opts.url || DEFAULT_REMOTE_BOT_URL;
    this.onStatusChange = opts.onStatusChange;
  }

  decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
    if (this.disposed || typeof fetch !== 'function') return {};

    if (!this.inFlight) {
      this.inFlight = true;
      void this.fetchDecision(state, ctx).finally(() => {
        this.inFlight = false;
      });
    }

    return this.latestInput;
  }

  async decideAsync(state: GameStateSnapshot, ctx: BotDecisionContext): Promise<BotInput> {
    if (this.disposed || typeof fetch !== 'function') return {};
    return this.fetchDecision(state, ctx);
  }

  private async fetchDecision(state: GameStateSnapshot, ctx: BotDecisionContext): Promise<BotInput> {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, ctx }),
      });
      if (!res.ok) {
        this.setConnected(false, `HTTP ${res.status}`);
        return this.latestInput;
      }
      const data = (await res.json()) as BotInput;
      this.latestInput = normalizeBotInput(data);
      this.setConnected(true);
      return this.latestInput;
    } catch (err) {
      this.setConnected(false, err instanceof Error ? err.message : 'Connection failed');
      return {};
    }
  }

  private setConnected(ok: boolean, detail?: string): void {
    if (this.connected !== ok || !ok) {
      this.connected = ok;
      this.onStatusChange?.(ok, detail);
    }
  }

  reset(): void {
    this.latestInput = {};
    this.inFlight = false;
  }

  dispose(): void {
    this.disposed = true;
  }
}
