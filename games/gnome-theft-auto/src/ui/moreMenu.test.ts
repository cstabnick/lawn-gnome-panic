// DOM probe for the "cannot click Options in the Tab menu" bug (L94): #ui is pointer-events:none, so every overlay
// root appended to it must turn pointer events back on, or each tile under it is dead to mouse and touch.
import { describe, expect, it } from 'vitest';
import { MORE_CSS } from './moreMenu';

/** The declarations of the first CSS rule whose selector is exactly `sel`. */
function cssRule(css: string, sel: string): string {
  const flat = css.replace(/\s+/g, ' ');
  const i = flat.indexOf(`${sel}{`);
  if (i < 0) return '';
  return flat.slice(i + sel.length + 1, flat.indexOf('}', i));
}

describe('More menu overlay', () => {
  it('takes pointer events (its parent #ui does not)', () => {
    expect(cssRule(MORE_CSS, '#gta-more')).toMatch(/pointer-events:\s*auto/);
  });
});
