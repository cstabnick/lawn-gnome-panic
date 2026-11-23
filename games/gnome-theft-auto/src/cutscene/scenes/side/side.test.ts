// Every side quest names real scenes (intro, mid-quest beats, payoffs), and they are real-world scenes with live streets.
// The line-of-sight check for them runs in ../scenes.test.ts with every other scene.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../../../testing/fakeDom';

installFakeDom();
const g = globalThis as Record<string, unknown>;
if (!g.window) g.window = { addEventListener: () => {}, removeEventListener: () => {} };
const { SCENES } = await import('../index');
const { SIDE_SCENES } = await import('./index');
const { SIDE_QUESTS } = await import('../../../quests/sideQuests');
const { TESSIE_QUEST } = await import('../../../quests/tessieQuest');

const quests = [...SIDE_QUESTS, TESSIE_QUEST];

/** Every scene id a quest names. */
function sceneIds(q: (typeof quests)[number]): string[] {
  const ids: string[] = [];
  if (q.cutscene?.kind === 'script' && typeof q.cutscene.script === 'string') ids.push(q.cutscene.script);
  ids.push(...Object.values(q.beats ?? {}));
  if (q.outro) ids.push(q.outro);
  for (const o of q.objectives) if (o.kind === 'choice') for (const opt of [o.optionA, o.optionB]) if (opt.outro) ids.push(opt.outro);
  return ids;
}

describe('side-quest scenes', () => {
  it.each(quests.map((q) => [q.id, q] as const))('%s has a scripted intro and a payoff', (_id, q) => {
    expect(q.cutscene?.kind).toBe('script');
    const endings = q.objectives.find((o) => o.kind === 'choice');
    expect(!!q.outro || !!endings).toBe(true);
  });

  it.each(quests.map((q) => [q.id, q] as const))('%s names only scenes that exist', (_id, q) => {
    for (const id of sceneIds(q)) expect(SCENES[id], `${q.id} -> ${id}`).toBeDefined();
  });

  it.each(Object.entries(SIDE_SCENES))('%s is a live real-world scene', (id, s) => {
    expect(s.id).toBe(id);
    expect(s.stage.kind).toBe('world');
    expect(s.world).toBe('live');
  });
});
