// One look per coast character (R-239): Driftwood, Marram Teaspoon and Captain Samphire Bilge wear their cutscene cast
// preset in the quests and as residents; Reel Ruth wears a look of her own. (The cabin npc in pirateShip.ts reads
// CAST.samphire.look directly; its interior builds lazily, so it is not asserted here.)
import { describe, expect, it } from 'vitest';
import { CAST } from '../cutscene/cast';
import { COAST_QUEST_DEFS } from '../quests/coastQuests';
import { BILGE, COAST_RESIDENTS } from './life';

const WHO = [
  { key: 'marram', speaker: 'Marram Teaspoon', resident: 'coast-marram-spokewheel' },
  { key: 'driftwood', speaker: 'Driftwood', resident: 'coast-driftwood-tube' },
  { key: 'samphire', speaker: 'Captain Samphire Bilge', resident: 'coast-captain-bilge' },
] as const;

/** Every {speaker, look} object anywhere in the quest definitions. */
function lines(node: unknown, out: { speaker: string; look?: unknown }[] = []): { speaker: string; look?: unknown }[] {
  if (Array.isArray(node)) node.forEach((n) => lines(n, out));
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.speaker === 'string') out.push({ speaker: o.speaker, look: o.look });
    for (const v of Object.values(o)) if (typeof v === 'object') lines(v, out);
  }
  return out;
}

describe('coast characters wear one look', () => {
  const all = lines(COAST_QUEST_DEFS);

  for (const w of WHO) {
    it(`${w.speaker}: quest lines and the resident use CAST.${w.key}`, () => {
      const mine = all.filter((l) => l.speaker === w.speaker);
      expect(mine.length).toBeGreaterThan(0);
      for (const l of mine) expect(l.look).toEqual(CAST[w.key].look);
      expect([...COAST_RESIDENTS, BILGE].find((r) => r.id === w.resident)!.look).toEqual(CAST[w.key].look);
    });
  }

  it('gives Reel Ruth a look no cast preset shares', () => {
    const ruth = COAST_RESIDENTS.find((r) => r.id === 'coast-angler-spur')!.look;
    for (const [k, p] of Object.entries(CAST)) {
      expect(ruth.hat, `${k} hat`).not.toBe(p.look.hat);
      expect(ruth.shirt, `${k} shirt`).not.toBe(p.look.shirt);
    }
  });
});
