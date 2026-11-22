import { describe, expect, it, vi, beforeAll } from 'vitest';
import type { EditorContext } from '../context';
import { installAgentApi, type ApiHooks, type LeApi } from './api';
import { collectProblems } from './problems';

// Only the problem list is faked: each save test sets what the level's problems are.
vi.mock('./problems', () => ({ collectProblems: vi.fn(() => []) }));
const collectProblemsMock = vi.mocked(collectProblems);

beforeAll(() => {
  if (!('window' in globalThis)) (globalThis as unknown as { window: unknown }).window = globalThis;
});

function fakeCtx() {
  const ctx = {
    snap: 0,
    outdoorZones: ['a', 'b'],
    history: { nextUndo: '', undo: vi.fn(), redo: vi.fn() },
    select: vi.fn(),
    setZone: vi.fn(),
    viewport: { focus: vi.fn() },
  };
  return ctx;
}

function fakeHooks() {
  return {
    save: vi.fn(async () => ['levels/a.ts']),
    activateTool: vi.fn((): boolean => true),
    refreshProblems: vi.fn(),
  };
}

function setup() {
  const ctx = fakeCtx();
  const hooks = fakeHooks();
  const le: LeApi = installAgentApi(ctx as unknown as EditorContext, hooks as ApiHooks);
  return { ctx, hooks, le };
}

describe('window.le', () => {
  it('is installed on window with version 1', () => {
    const { le } = setup();
    expect((globalThis as unknown as { le: LeApi }).le).toBe(le);
    expect(le.version).toBe(1);
  });

  it('help() lists every command', () => {
    const { le } = setup();
    const names = le.help().map((h) => h.name);
    for (const n of [
      'item.add', 'item.move', 'item.nudge', 'item.set', 'item.rotate', 'item.delete', 'item.duplicate',
      'select', 'focus', 'zone.set', 'tool', 'snap', 'undo', 'redo', 'save',
    ]) {
      expect(names).toContain(n);
    }
  });

  it('run() of an unknown name resolves { ok: false } pointing at le.help()', async () => {
    const { le } = setup();
    const r = await le.run('nope');
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.error).toContain('le.help()');
  });

  it('run() with a missing ref resolves { ok: false } naming ref', async () => {
    const { le } = setup();
    const r = await le.run('item.move', {});
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.error).toContain('ref');
  });

  it('snap sets ctx.snap', async () => {
    const { ctx, le } = setup();
    const r = await le.run('snap', { m: 1 });
    expect(r).toEqual({ ok: true, value: null });
    expect(ctx.snap).toBe(1);
  });

  it('zone.set fails for a zone that is not loaded', async () => {
    const { ctx, le } = setup();
    const r = await le.run('zone.set', { id: 'x' });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.error).toContain('No zone "x"');
    expect(ctx.setZone).not.toHaveBeenCalled();
  });

  it('tool calls hooks.activateTool', async () => {
    const { hooks, le } = setup();
    const r = await le.run('tool', { id: 'select' });
    expect(r.ok).toBe(true);
    expect(hooks.activateTool).toHaveBeenCalledWith('select');
  });

  it('a tool the game does not have fails', async () => {
    const { hooks, le } = setup();
    (hooks.activateTool as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const r = await le.run('tool', { id: 'nope' });
    expect(r.ok).toBe(false);
  });

  it('a wrongly typed argument names the command and the argument', async () => {
    const { le } = setup();
    const r = await le.run('snap', { m: 'big' });
    expect(r).toEqual({ ok: false, error: 'snap: m must be a number' });
  });

  it('save runs when there are no error problems', async () => {
    const { hooks, le } = setup();
    collectProblemsMock.mockReturnValueOnce([{ severity: 'warning', code: 'w', msg: 'just a warning', zone: 'a' }]);
    const r = await le.run('save', {});
    expect(r).toEqual({ ok: true, value: { files: ['levels/a.ts'] } });
    expect(hooks.save).toHaveBeenCalledTimes(1);
  });

  it('save is refused by error problems unless force is true', async () => {
    const { hooks, le } = setup();
    collectProblemsMock.mockReturnValueOnce([{ severity: 'error', code: 'e', msg: 'broken prop', zone: 'a' }]);
    const r = await le.run('save', {});
    expect(r).toEqual({ ok: false, error: 'Save refused: broken prop (pass force: true to save anyway)' });
    expect(hooks.save).not.toHaveBeenCalled();

    collectProblemsMock.mockReturnValueOnce([{ severity: 'error', code: 'e', msg: 'broken prop', zone: 'a' }]);
    const forced = await le.run('save', { force: true });
    expect(forced.ok).toBe(true);
    expect(hooks.save).toHaveBeenCalledTimes(1);
  });
});
