// E20 story layout (E21/E22 copy it): one file per story row, `src/quests/story/<NN>-<slug>.ts`, exporting
// `STORY: StoryFile`: the row's QuestDef(s) (an extended row lists its parts p1, p2, ... then the final part, which keeps
// the row id) and its mission comms. The act aggregators (actI.ts, actII.ts) are the only files that import them;
// index.ts flattens them for defs.ts and comms.ts. Scenes live in `cutscene/scenes/story/m<NN>-<slug>.ts`, stages in
// `quests/stages/story/s<NN>-<slug>.ts`.
import type { CommsCall } from '../comms';
import type { GiverDef, QuestDef } from '../types';
import type { QuestPlan } from '../../questSim/types';

export interface StoryFile {
  /** In play order: p1, p2, ..., then the row's own id. */
  quests: readonly QuestDef[];
  /** questId -> objective step -> the call that plays when that step starts (comms.ts rules: 16 words a line). */
  comms: Readonly<Record<string, Readonly<Record<number, CommsCall>>>>;
  /**
   * Quest-sim plans (questSim/plans.ts rules), one per quest id above: { suite: 'story', expect: 'pass' }, or a known
   * failure with its class and reason; a quest with a 'choice' objective needs variants: ['A', 'B'].
   */
  plans?: Readonly<Record<string, QuestPlan>>;
  /**
   * New quest givers this row needs (merged into defs.ts GIVERS). Prefer an existing giver id (side-valve, mulch-club,
   * city-hall, cloverfield-barn, unmowed-hollow, bramble, nubbin, tumblesoil, hogweed, saxifrage, chard, cardoon,
   * fennel, thrift, loch-driftwood, kerb-exchange, speedway, ...). A new giver's id must be listed in the `givers` of a
   * stage (the row's own stage file), or stages.test.ts fails.
   */
  givers?: Readonly<Record<string, GiverDef>>;
  /** Turfton FM bulletins by radioBulletin id (each quest's id): at least two lines each, R-021 (no wet, no gore). */
  bulletins?: Readonly<Record<string, readonly string[]>>;
}

/** Step-0 briefing: who, what, where, why now, the reward, in the speaker's voice. `[speakerKey, line]` pairs. */
export const brief = (...lines: [string, string][]): CommsCall => ({ mode: 'briefing', lines: lines.map(([who, text]) => ({ who, text })) });
/** A later step's phone call. */
export const call = (...lines: [string, string][]): CommsCall => ({ mode: 'call', lines: lines.map(([who, text]) => ({ who, text })) });
