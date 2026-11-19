import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchKey } from './index';

describe('watchKey', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is a no-op outside a browser', () => {
    expect(() => watchKey('k', () => {})()).not.toThrow();
  });

  it('reports writes to its key only, and stops after unsubscribe', () => {
    const handlers: Array<(e: unknown) => void> = [];
    vi.stubGlobal('window', {
      addEventListener: (_: string, h: (e: unknown) => void) => handlers.push(h),
      removeEventListener: (_: string, h: (e: unknown) => void) => handlers.splice(handlers.indexOf(h), 1),
    });
    const seen: Array<string | null> = [];
    const off = watchKey('k', (v) => seen.push(v));
    handlers[0]({ key: 'other', newValue: 'no' });
    handlers[0]({ key: 'k', newValue: 'yes' });
    expect(seen).toEqual(['yes']);
    off();
    expect(handlers).toHaveLength(0);
  });
});
