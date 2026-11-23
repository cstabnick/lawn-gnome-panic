import { describe, expect, it } from 'vitest';
import { CALLER_NAMES, COMMS, callerOf } from './comms';
import { questById } from './defs';

describe('mission comms', () => {
  it('only names real quests and objective steps', () => {
    for (const [id, steps] of Object.entries(COMMS)) {
      const q = questById(id);
      expect(q, id).toBeDefined();
      for (const step of Object.keys(steps).map(Number)) {
        expect(step, `${id} step ${step}`).toBeLessThan(q!.objectives.length);
      }
    }
  });

  it('keeps lines to the bible limit (16 words) with a known speaker', () => {
    for (const [id, steps] of Object.entries(COMMS)) {
      for (const call of Object.values(steps)) {
        expect(call.lines.length, id).toBeGreaterThan(0);
        for (const l of call.lines) {
          expect(l.text.split(/\s+/).length, `${id}: ${l.text}`).toBeLessThanOrEqual(16);
          expect(CALLER_NAMES[l.who], `${id}: ${l.who}`).toBeDefined();
        }
      }
    }
  });

  it('gives every story quest a briefing at its start', () => {
    for (const id of Object.keys(COMMS).filter((k) => questById(k)?.chapter)) {
      expect(COMMS[id][0], id).toBeDefined();
    }
  });

  it('resolves a caller with a name, look and voice', () => {
    const c = callerOf('tansy');
    expect(c.name).toBe('Tansy Clayfoot');
    expect(c.look.hat).toBe(0xf08a24);
    expect(c.voice.hz).toBeGreaterThan(0);
  });
});
