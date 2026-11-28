import { describe, expect, it } from 'vitest';
import { CALLER_NAMES, COMMS, callerOf } from './comms';
import { questById } from './defs';
import { STORY_ROWS } from './storyRows';

/** GR4: a comms line must not open with a spoken "Previously" label. */
const PREVIOUSLY = /^\s*previously\b/i;
/** GR5: a sincere or crisis row must not name a fee in acorns. */
const FEE = /\b(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred|thousand)\b[^.!?]{0,20}\bacorns?\b/i;
const FEE_ROWS = new Set([26, 31, 34, 35, 52, 70]);

const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

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

  it('never opens a line with a spoken "Previously" label (GR4)', () => {
    const offenders = new Set<string>();
    for (const [id, steps] of Object.entries(COMMS)) {
      for (const call of Object.values(steps)) {
        if (call.lines.some((l) => PREVIOUSLY.test(l.text))) offenders.add(id);
      }
    }
    // Today's offenders (FX21). FX22 (acts I-II), FX23 (act III) and FX24 (act IV) remove their rows; FX24 leaves it empty.
    const PREVIOUSLY_ALLOW = new Set<string>([
      'm07-even-estates', 'm09-where-asphalt-sleeps', 'm24-the-burrow-door', 'm25-one-leg-to-stand-on',
      'm29-the-kicked-board', 'm32-driftwoods-chart', 'm33-the-bench-lock', 'm37-snowdrop-slope', 'm38-pail-pond',
      'm39-couch-surfing', 'm40-the-capwood-run', 'm43-saltbucket-boardwalk', 'm44-the-bathtub-queen',
      'm45-rootwell-admissions', 'm46-starfall-at-the-anthill', 'm46-starfall-at-the-anthill-p1',
      'm48-the-groundskeepers-secret', 'm49-loamdeep', 'm50-trellisdown-tasting', 'm51-the-flock-stands',
      'm54-the-heist-board', 'm58-the-reeves-barn', 'm60-the-moles-dig', 'm61-diggs-medal', 'm62-cams-cell',
      'm63-four-taps', 'm64-all-hats-p1', 'm64-all-hats-p2', 'm65-the-countess-relents', 'm66-porcelain-hearts',
      'm67-emergency-assessment', 'm68-lights-out', 'm69-the-combine-wakes',
    ]);
    expect(
      sorted(offenders),
      'a new offender: write the recap as an in-voice clause, and the journal line in quests/story/previously.ts',
    ).toEqual(sorted(PREVIOUSLY_ALLOW));
  });

  it('says no fee in the sincere and crisis rows (GR5)', () => {
    const offenders = new Set<string>();
    for (const [id, steps] of Object.entries(COMMS)) {
      const row = STORY_ROWS[id];
      if (row === undefined || !FEE_ROWS.has(row)) continue;
      for (const [step, call] of Object.entries(steps)) {
        if (call.lines.some((l) => FEE.test(l.text))) offenders.add(`${id}#${step}`);
      }
    }
    // Today's offenders (FX21). FX22-FX24 remove these.
    const FEE_ALLOW = new Set<string>([
      'ch3-salvage-raid-p1#0', 'ch3-salvage-raid-p2#0', 'ch5-even-cut-p1#0', 'ch5-even-cut-p2#0', 'ch5-even-cut-p3#0',
      'm26-the-knot-hole#0', 'm31-granny-cracks#0', 'm34-forty-seven-wrenches#0', 'm52-the-test-cut-p1#0',
      'm52-the-test-cut-p2#0', 'm52-the-test-cut-p3#0',
    ]);
    expect(
      sorted(offenders),
      'a new offender: a sincere or crisis row must not name a fee; move the money out of the line',
    ).toEqual(sorted(FEE_ALLOW));
  });
});
