import { describe, expect, it } from 'vitest';
import { PAD_FAMILIES, glyphLabel } from '@lawn/gamepad';
import { ACTIONS, type ActionId } from './actions';
import { controlsFor, fillHint, fillHintHtml, glyphHtml, glyphText } from './glyphs';

const ALL_IDS = ACTIONS.map((a) => a.id) as ActionId[];

describe('keyboard glyphs', () => {
  it('shows key caps, WASD, mouse buttons and the More menu route', () => {
    expect(glyphText('interact', 'keyboard', 'foot')).toBe('E');
    expect(glyphText('move', 'keyboard', 'foot')).toBe('WASD');
    expect(glyphText('fire', 'keyboard', 'foot')).toBe('Click');
    expect(glyphText('party', 'keyboard', 'foot').startsWith('Tab ›')).toBe(true);
  });
});

describe('pad glyphs', () => {
  it('has a non-empty glyph for every action on every family', () => {
    for (const f of PAD_FAMILIES) {
      for (const a of ALL_IDS) {
        expect(glyphText(a, f, 'foot'), `${a} on ${f}`).not.toBe('');
      }
    }
  });

  it('draws the interact and phone bindings from the pad', () => {
    for (const f of PAD_FAMILIES) {
      expect(glyphText('interact', f, 'foot')).toBe(glyphLabel(f, 'north'));
      expect(glyphText('phone', f, 'foot')).toBe(`${glyphLabel(f, 'select')} › Phone`);
    }
  });
});

describe('touch glyphs', () => {
  it('uses the touch words and no HTML', () => {
    expect(glyphText('fire', 'touch', 'foot')).toBe('Fire');
    expect(glyphHtml('interact', 'touch', 'foot')).toBe('');
    expect(glyphHtml('fire', 'touch', 'foot')).toBe('');
  });
});

describe('hint tokens', () => {
  it('fills known tokens and leaves unknown ones alone', () => {
    expect(fillHint('Press {interact} to talk', 'keyboard')).toBe('Press E to talk');
    expect(fillHint('{nope}', 'keyboard')).toBe('{nope}');
  });

  it('does not touch double-brace gold-name markup', () => {
    expect(fillHint('{{journal}} and {journal}', 'keyboard')).toBe('{{journal}} and J');
  });

  it('escapes literal text and renders key caps in HTML', () => {
    const html = fillHintHtml('a<b {interact}', 'keyboard');
    expect(html).toContain('&lt;');
    expect(html).toContain('<kbd class="gta-key">E</kbd>');
  });

  it('renders pad glyphs as SVG in HTML', () => {
    expect(fillHintHtml('{interact}', 'xbox')).toContain('<svg');
  });
});

describe('controlsFor', () => {
  it('lists every listed action on keyboard with html', () => {
    const rows = controlsFor('keyboard', 'all');
    expect(rows.length).toBeGreaterThan(20);
    for (const r of rows) expect(r.html).not.toBe('');
  });

  it('filters by camera mode', () => {
    const ids = controlsFor('xbox', 'drive').map((r) => r.id);
    expect(ids).toContain('boost');
    expect(ids).not.toContain('aim');
  });
});
