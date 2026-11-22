import { describe, expect, it } from 'vitest';
import type { EditorContext, GameAdapter } from '../context';
import { clubAdapter } from '../adapters/club';
import { gnomomiaAdapter } from '../adapters/gnomomia';
import { createContext } from '../state';
import { createWorld } from '../world';
import { collectProblems } from './problems';

function makeCtx(adapter: GameAdapter = gnomomiaAdapter): EditorContext {
  const ctx = createContext(adapter === gnomomiaAdapter ? createWorld() : adapter.createWorld(), adapter);
  ctx.viewport = { refresh() {}, focus() {} } as never;
  return ctx;
}

function zoneOf(ctx: EditorContext): { props?: Record<string, unknown>[]; origin?: { x: number; z: number }; half: number } {
  return ctx.zones[ctx.zone] as never;
}

const codes = (ps: { code: string }[]) => ps.map((p) => p.code);

describe('collectProblems', () => {
  it('reports no errors on the shipped first zone', () => {
    const ctx = makeCtx();
    expect(collectProblems(ctx).filter((p) => p.severity === 'error')).toEqual([]);
  });

  it('flags a prop whose prefab does not exist', () => {
    const ctx = makeCtx();
    const zone = zoneOf(ctx);
    zone.props ??= [];
    const index = zone.props.length;
    zone.props.push({ prefab: 'no-such-prefab', x: 0, z: 0, rot: 0, scale: 1 });
    const p = collectProblems(ctx).find((x) => x.code === 'unknown-prefab');
    expect(p?.severity).toBe('error');
    expect(p?.ref?.collection).toBe('props');
    expect(p?.ref?.index).toBe(index);
  });

  it('flags two solid props on the same spot', () => {
    const ctx = makeCtx();
    const zone = zoneOf(ctx);
    const ox = zone.origin?.x ?? 0;
    const oz = zone.origin?.z ?? 0;
    zone.props ??= [];
    zone.props.push({ prefab: 'barrel', x: ox, z: oz, rot: 0, scale: 1, solidR: 1 });
    zone.props.push({ prefab: 'barrel', x: ox, z: oz, rot: 0, scale: 1, solidR: 1 });
    expect(codes(collectProblems(ctx))).toContain('prop-overlap');
  });

  it('flags an item outside the level', () => {
    const ctx = makeCtx();
    const zone = zoneOf(ctx);
    const ox = zone.origin?.x ?? 0;
    zone.props ??= [];
    zone.props.push({ prefab: 'barrel', x: ox + zone.half + 50, z: 0, rot: 0, scale: 1 });
    expect(codes(collectProblems(ctx))).toContain('outside-zone');
  });

  it('flags a stale walkability bake once ground was edited', () => {
    const ctx = makeCtx();
    expect(codes(collectProblems(ctx))).not.toContain('stale-bake');
    ctx.dirty.walkRects.push({ minX: 0, maxX: 1, minZ: 0, maxZ: 1 });
    expect(codes(collectProblems(ctx))).toContain('stale-bake');
  });

  it('turns a crashing check into one check-failed error', () => {
    const ctx = makeCtx({
      ...gnomomiaAdapter,
      checks() {
        throw new Error('boom');
      },
    });
    const ps = collectProblems(ctx);
    const failed = ps.filter((p) => p.code === 'check-failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].severity).toBe('error');
    expect(failed[0].msg).toContain('boom');
  });

  it('reports a Club Gnome save refusal as save-check', () => {
    const ctx = makeCtx(clubAdapter);
    const zone = ctx.zones[ctx.zone] as unknown as { props?: Record<string, unknown>[] };
    zone.props ??= [];
    zone.props.push({ prefab: 'no-such-prefab', x: 0, z: 0, rot: 0, scale: 1 });
    const p = collectProblems(ctx).find((x) => x.code === 'save-check');
    expect(p?.severity).toBe('error');
    expect(p?.zone).toBe(ctx.zone);
  });

  it('sorts errors first, then by code', () => {
    const ctx = makeCtx();
    const zone = zoneOf(ctx);
    const ox = zone.origin?.x ?? 0;
    zone.props ??= [];
    zone.props.push({ prefab: 'barrel', x: ox + zone.half + 50, z: 0, rot: 0, scale: 1 });
    zone.props.push({ prefab: 'no-such-prefab', x: 0, z: 0, rot: 0, scale: 1 });
    const ps = collectProblems(ctx);
    const firstWarning = ps.findIndex((p) => p.severity === 'warning');
    expect(firstWarning).toBeGreaterThan(-1);
    expect(ps.slice(0, firstWarning).every((p) => p.severity === 'error')).toBe(true);
    expect(ps[0].severity).toBe('error');
  });
});
