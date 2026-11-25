import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetOptionsRegistry, activateOption, listOptionSections, onOptionsChange, optionDescText, optionValueText,
  registerOption, registerOptionsSection, type OptionDef,
} from './optionsRegistry';

describe('Options registry', () => {
  beforeEach(() => _resetOptionsRegistry());

  it('orders sections by order (built-ins by SECTIONS), rows by order, whatever the call order', () => {
    registerOption({ section: 'audio', id: 'b', label: 'B', kind: 'toggle', order: 20, get: () => true, set: () => {} });
    registerOption({ section: 'map', id: 'm', label: 'M', kind: 'toggle', get: () => true, set: () => {} });
    registerOption({ section: 'audio', id: 'a', label: 'A', kind: 'toggle', order: 10, get: () => true, set: () => {} });
    registerOptionsSection('weather', 'Weather', () => {}, 55);
    const s = listOptionSections();
    expect(s.map((x) => x.id)).toEqual(['map', 'weather', 'audio']);
    expect(s[2].title).toBe('Sound');
    expect(s[2].rows.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('drops empty sections and titles unknown ones after their id', () => {
    registerOptionsSection('empty', 'Empty');
    registerOption({ section: 'mystery', id: 'x', label: 'X', kind: 'button', run: () => {} });
    expect(listOptionSections().map((x) => [x.id, x.title])).toEqual([['mystery', 'mystery']]);
  });

  it('toggles, cycles and shows values', () => {
    let on = false;
    let v = 'low';
    const t: OptionDef = { section: 'view', id: 't', label: 'T', kind: 'toggle', get: () => on, set: (x) => { on = x; } };
    const c: OptionDef = {
      section: 'view', id: 'c', label: 'C', kind: 'cycle', values: [{ id: 'low', label: 'Low' }, { id: 'tall', label: 'Tall' }],
      get: () => v, set: (x) => { v = x; },
    };
    const s: OptionDef = { section: 'audio', id: 's', label: 'S', kind: 'slider', get: () => 0.35, set: () => {}, desc: () => 'live' };
    expect(optionValueText(t)).toBe('off');
    activateOption(t);
    expect(on).toBe(true);
    activateOption(c);
    expect(optionValueText(c)).toBe('Tall');
    activateOption(c);
    expect(v).toBe('low');
    expect(optionValueText(s)).toBe('35%');
    expect(optionDescText(s)).toBe('live');
  });

  it('replaces a row with the same id and tells listeners', () => {
    let n = 0;
    onOptionsChange(() => n++);
    registerOption({ section: 'view', id: 'r', label: 'One', kind: 'button', run: () => {} });
    registerOption({ section: 'view', id: 'r', label: 'Two', kind: 'button', run: () => {} });
    expect(listOptionSections()[0].rows.map((r) => r.label)).toEqual(['Two']);
    expect(n).toBe(2);
  });
});
