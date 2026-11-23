// Every old quest dialogue scene (through legacy.ts) must pass the line-of-sight and collision check in a room set.
// Room stages need no world boxes. Shots run at normal text speed.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();
// Some modules in the import chain (audio.ts, via vehicles.ts) listen on `window` when they load: a bare stand-in.
const g = globalThis as Record<string, unknown>;
if (!g.window) g.window = { addEventListener: () => {}, removeEventListener: () => {} };
const { QUESTS, GIVERS } = await import('../quests/defs');
const { legacyDialogueScript } = await import('./legacy');
const { checkScript, formatIssues } = await import('./check');

const dialogueQuests = QUESTS.filter((q) => q.cutscene?.kind === 'dialogue');

describe('quest dialogue cutscenes', () => {
  it.each(dialogueQuests.map((q) => [q.id, q] as const))('%s: all shots pass', (id, q) => {
    const c = q.cutscene;
    if (c?.kind !== 'dialogue') throw new Error(`${id} has no dialogue cutscene`);
    const script = legacyDialogueScript({
      room: c.room ?? GIVERS[q.giver].room,
      lines: c.lines,
      titleCard: c.titleCard,
    });
    expect(formatIssues(id, checkScript(script, []))).toBe(`${id}: all shots pass`);
  }, 60000);
});
