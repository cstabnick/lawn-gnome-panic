import { describe, expect, it } from 'vitest';
import { LOADING_FACTS } from './facts';
import { hideLoading, loadingProgress, showLoading } from './loader';
import { LOADING_PAGES } from './pages';

describe('loading screen', () => {
  it('is safe without a DOM', () => {
    expect(() => {
      showLoading(['a', 'b']);
      loadingProgress(0, 'a');
      loadingProgress(1, 'b');
      hideLoading();
      hideLoading();
    }).not.toThrow();
  });

  it('has short facts', () => {
    expect(LOADING_FACTS.length).toBeGreaterThanOrEqual(20);
    for (const f of LOADING_FACTS) expect(f.length).toBeLessThanOrEqual(140);
  });

  it('has drawable pages', () => {
    expect(LOADING_PAGES.length).toBeGreaterThanOrEqual(4);
    for (const p of LOADING_PAGES) {
      expect(p.title).not.toBe('');
      expect(p.svg.startsWith('<svg')).toBe(true);
      expect(p.svg.trim().endsWith('</svg>')).toBe(true);
    }
  });
});
