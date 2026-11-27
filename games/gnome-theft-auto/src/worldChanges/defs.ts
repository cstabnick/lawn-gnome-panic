// World changes (E18, L68; design docs/design/gnome-theft-auto/world-changes.md): visible changes that switch on once a
// run of main quests is done, so the world develops with the story. Pure data and pure functions: no three.js, no DOM.
//
// A change is on when every quest in `after` is 'done' in the quest save, and no other change that is on lists it in
// `hides`. Nothing new is saved: old saves get every change they have earned on load. The props of each change are
// built by its builder (worldChanges/rows/*.ts, registered with registerWorldChange in registry.ts) as a separate
// toggled group, never an edit of the baked static batches.
//
// `after` names built main quests where possible. `planned` is the spine row (storyRows.ts) the design wants where that
// quest is not built yet; until then `after` is the nearest built beat that keeps the premise, or the planned id
// itself (the change then stays dormant). worldChanges.test.ts fails once a planned quest exists and `after` was not
// moved onto it. E20-E22: add rows W18+ the same way (data here, builder in rows/).
import type { QuestSave } from '../quests/types';

export interface WorldChangeDef {
  /** 'W01'..'W17' (design table), W18+ for later epics. */
  id: string;
  /** A short name for tools and the debug list. */
  title: string;
  /** Main quest ids that must all be done. */
  after: readonly string[];
  /** The design's capping quest (a STORY_ROWS id not built yet), when `after` is a stand-in. */
  planned?: string;
  /** Other changes this one switches off while it is on (W08 hides W07; W17 hides W08 and W02). */
  hides?: readonly string[];
  /** Where, for writers and the debug list. */
  where: string;
  /** The Turfton FM news line, played the first time the player is in a vehicle after the change turns on ('' = none). */
  bulletin: string;
  /** W17 only: the Ending B line (Ending A uses `bulletin`). */
  bulletinB?: string;
}

export const WORLD_CHANGES: readonly WorldChangeDef[] = [
  { id: 'W01', title: 'Flat 3B is home', after: ['m02-roof-on-credit'], where: 'Saucer Court, flat 3B',
    bulletin: 'Turfton FM news: a new tenant at Saucer Court, flat 3B. The neighbours are said to have noticed.' },
  { id: 'W02', title: 'Even-Estates hoardings', after: ['m07-even-estates'], where: 'Turfton fringe building sites',
    bulletin: 'Turfton FM news: building starts on three fringe sites. The homes will all be the same height, the developer says, on purpose.' },
  // W02's show-homes, split out so W17 can take the hoardings down and leave the homes standing (empty).
  { id: 'W18', title: 'Even-Estates show-homes', after: ['m07-even-estates'], where: 'Turfton fringe building sites',
    bulletin: '' },
  { id: 'W03', title: "Founders' Green opens", after: ['ch1-founders-boot'], where: "Founders' Green, downtown",
    bulletin: "Turfton FM news: Founders' Green is open. The ribbon was cut with the wrong scissors and no one minded." },
  { id: 'W04', title: "Gnertrude's is open", after: ['ch2-vespers-offer'], where: "Cloverfield, Granny's barn; the Route South welcome sign",
    bulletin: 'Turfton FM news: the foreclosure notices in Cloverfield have blown away. Nobody is saying who helped the wind.' },
  { id: 'W05', title: 'The Double Pot tops out', after: ['m21-penthouse-viewing'], where: 'The Double Pot and the Patio Gate',
    bulletin: 'Turfton FM news: the Double Pot is finished. It has two floors more than the plan and no one remembers asking.' },
  { id: 'W06', title: 'Moles are neighbours', after: ['m24-the-burrow-door'], where: 'Mossy Wood west edge, the Burrow Door',
    bulletin: 'Turfton FM news: Sorrel Tillbrook has put up a sign at the edge of Mossy Wood. She reads it out on air twice.' },
  { id: 'W07', title: 'Side-Valve party bunting', after: ['m34-forty-seven-wrenches'], where: 'Side-Valve Salvage bay',
    bulletin: 'Turfton FM news: Side-Valve Salvage threw a party. Forty-seven wrenches were present; one more was reported.' },
  { id: 'W08', title: 'Side-Valve seized', after: ['ch3-salvage-raid'], hides: ['W07'], where: 'Side-Valve Salvage bay',
    bulletin: 'Turfton FM news: the HOA has seized a salvage yard downtown. The owner could not be reached for comment.' },
  { id: 'W09', title: 'A second tenant in 3B', after: ['m39-couch-surfing'], where: 'Saucer Court, flats 3A and 3B',
    bulletin: 'Turfton FM news: a tenant at Saucer Court reports a second tenant. The neighbour reports it again.' },
  { id: 'W10', title: 'The lights are steady', after: ['m41-pinwheel-ridge'], where: 'Pinwheel Ridge; downtown neon; Capwood start; Woolly Sock Lodge',
    bulletin: 'Turfton FM news: the lights are steady again. The Pinwheel Ridge engineers say the wind was always willing.' },
  { id: 'W11', title: 'Tubes: they float', after: ['m44-the-bathtub-queen'], where: 'Saltbucket Boardwalk; the Bathtub Queen; Speedway; Rutbottom',
    bulletin: 'Turfton FM news: a tube hut has opened on the Saltwater. The Carburettors have also reopened their track, loudly.' },
  { id: 'W12', title: 'The dome is open', after: ['m46-starfall-at-the-anthill'], where: 'The Anthill Observatory; Rootwell quad',
    bulletin: 'Turfton FM news: the Rootwell observatory is open to the sky and empty of equipment. Students are marching about it.' },
  { id: 'W13', title: 'A root stall on Bodega\'s street', after: ['m49-loamdeep'], where: 'Bodega & Sons front; Mossy Wood edge; Tallgrass Commons',
    bulletin: 'Turfton FM news: a root stall has opened on Bodega\'s street. The roots are, the buyers say, excellent.' },
  { id: 'W14', title: 'The mown scar', after: ['m52-the-test-cut'], where: "Hedgeworth Links; Wader's Rest",
    bulletin: "Turfton FM news: a clean stripe has appeared across Hedgeworth. Groundskeepers there describe it as 'a little too clean'." },
  { id: 'W15', title: 'Coalition colours', after: ['m60-the-moles-dig'], where: 'Fort Sandpit gate; Pebblewick water tower',
    bulletin: 'Turfton FM news: the Spade Guard has taken to flying a flag of many colours. The Commander has no comment, and a medal.' },
  { id: 'W16', title: 'All hats', after: ['m64-all-hats'], where: 'Dust Flats overlook; New Puddle marina',
    bulletin: 'Turfton FM news: a great many hats are seen on the Dust Flats. Observers say they all appear to be friends.' },
  { id: 'W17', title: 'After the Even Cut', after: ['ch5-even-cut'], hides: ['W08', 'W02'], where: 'Side-Valve; fringe sites; the downtown scar; Trellisdown; Wader\'s Rest',
    bulletin: 'Turfton FM news: clover is growing on the meridian. The grass is, the council says, uneven. The council says it fondly.',
    bulletinB: 'Turfton FM news: the meridian now lights up at night in a grid. The council is calling it a feature.' },
  // E22: Cam's epilogue line (row 62's choice): freed, he sweeps the new Green; left for the Watch, his broom waits on a bench.
  { id: 'W19', title: "Cam's broom", after: ['ch5-even-cut', 'm62-cams-cell'], where: "Founders' Green",
    bulletin: "Turfton FM news: somebody is sweeping Founders' Green before anybody asked. Nobody is complaining. He apologises anyway." },
];

const BY_ID = new Map(WORLD_CHANGES.map((w) => [w.id, w]));

/** The row for an id, or undefined. */
export function worldChangeDef(id: string): WorldChangeDef | undefined {
  return BY_ID.get(id);
}

/** The ids of the changes that are on for this save, in table order (earned and not hidden by another one that is on). */
export function activeWorldChanges(saves: Record<string, QuestSave>): string[] {
  const earned = WORLD_CHANGES.filter((w) => w.after.every((id) => saves[id]?.state === 'done'));
  const hidden = new Set(earned.flatMap((w) => w.hides ?? []));
  return earned.filter((w) => !hidden.has(w.id)).map((w) => w.id);
}

/** E22: the option any quest's choice picked ('A' when none was recorded). */
export function choiceOf(saves: Record<string, QuestSave>, questId: string): 'A' | 'B' {
  return saves[questId]?.ending === 'B' ? 'B' : 'A';
}

/** W17's variant: the ending the finale's choice picked ('A' when none was recorded). */
export function endingOf(saves: Record<string, QuestSave>): 'A' | 'B' {
  return saves['ch5-even-cut']?.ending === 'B' ? 'B' : 'A';
}

/** The quest save key (quests/quests.ts SAVE_KEY), read here so this module does not import the engine. */
const QUEST_SAVE_KEY = 'gta-quests-v1';

/** Is change `id` on? Reads the quest save from localStorage when `saves` is omitted. */
export function isChanged(id: string, saves?: Record<string, QuestSave>): boolean {
  let s = saves;
  if (!s) {
    try {
      s = JSON.parse(localStorage.getItem(QUEST_SAVE_KEY) ?? '{}') as Record<string, QuestSave>;
    } catch {
      return false;
    }
  }
  return activeWorldChanges(s ?? {}).includes(id);
}

/** The Turfton FM bulletin key for a change (radio/content.ts EVENT_BULLETINS). */
export function worldBulletinKey(id: string, ending: 'A' | 'B' = 'A'): string {
  return ending === 'B' && worldChangeDef(id)?.bulletinB ? `world-${id}-B` : `world-${id}`;
}
