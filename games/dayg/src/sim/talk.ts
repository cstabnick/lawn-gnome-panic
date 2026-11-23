// Talking to NPCs (quests.md "Talking to NPCs"). Step 0 stub: every verb is offered; roadmap 7.4 fills the rules.
import type { PhraseLine, PlayerKey, TalkInput, TalkResult, TalkVerb, NpcId, WorldState } from './types';
import { TALK_VERBS } from './types';
import type { Rng } from './rng';

export function verbsFor(w: WorldState, npc: NpcId, player: PlayerKey): { verb: TalkVerb; ok: boolean; why: string | null }[] {
  return TALK_VERBS.map((verb) => ({ verb, ok: true, why: null }));
}
export function talk(w: WorldState, input: TalkInput, rng: Rng): TalkResult {
  const name = w.npcs[input.npc]?.name ?? '';
  const lines: PhraseLine[] = [{ key: 'greet.neutral', vars: { name } }];
  return { ok: true, lines, trustDelta: 0, give: [], take: [], acorns: 0, quest: null, joined: null, hostile: false };
}
