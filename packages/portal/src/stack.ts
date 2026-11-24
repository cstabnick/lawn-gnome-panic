// The portal stack: entering a building pushes the frame you came from; walking out pops it and puts you back.
// Each page keeps the frames IT pushed (a nested visit is a page inside a page, with its own stack), saved in
// sessionStorage under stackKey(game) so a reload finds it.
import type { PortalFrame, ReturnPose } from './types';

export const STACK_KEY = 'lawn.portal.stack.v1';
/** Deepest nesting allowed (a door inside a building inside a building ...). */
export const MAX_DEPTH = 8;

export function stackKey(game: string): string {
  return `${STACK_KEY}:${game}`;
}

/** A visit id: unique per walk-in, safe in a URL. */
export function newVisitId(portal: string, now = Date.now(), rand = Math.random): string {
  return `${portal}-${now.toString(36)}-${Math.floor(rand() * 36 ** 5).toString(36)}`;
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 120;

function isPose(v: unknown): v is ReturnPose {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return num(p.x) && num(p.y) && num(p.z) && num(p.yaw) && (p.extra === undefined || (typeof p.extra === 'object' && p.extra !== null));
}

export function isFrame(v: unknown): v is PortalFrame {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return str(f.visit) && str(f.portal) && str(f.from) && str(f.to) && num(f.depth) && num(f.enteredAt)
    && isPose(f.ret) && (f.room === null || typeof f.room === 'string');
}

export class PortalStack {
  private readonly f: PortalFrame[];

  constructor(frames: PortalFrame[] = []) {
    this.f = frames.slice(0, MAX_DEPTH);
  }

  get depth(): number {
    return this.f.length;
  }

  /** The frame to return to next (the most recent walk-in), or null. */
  peek(): PortalFrame | null {
    return this.f[this.f.length - 1] ?? null;
  }

  /** Throws when the stack is full or the visit is already on it (a double tap on the door). */
  push(frame: PortalFrame): void {
    if (this.f.length >= MAX_DEPTH) throw new Error('portal stack full');
    if (this.f.some((x) => x.visit === frame.visit)) throw new Error(`visit ${frame.visit} already on the stack`);
    this.f.push(frame);
  }

  pop(): PortalFrame | null {
    return this.f.pop() ?? null;
  }

  frames(): readonly PortalFrame[] {
    return this.f;
  }

  toJSON(): string {
    return JSON.stringify({ version: 1, frames: this.f });
  }

  /** Never throws: junk or a missing key gives an empty stack; bad frames are dropped. */
  static parse(text: string | null): PortalStack {
    if (!text) return new PortalStack();
    try {
      const raw = JSON.parse(text) as { frames?: unknown };
      const frames = Array.isArray(raw.frames) ? raw.frames.filter(isFrame) : [];
      return new PortalStack(frames);
    } catch {
      return new PortalStack();
    }
  }
}
