// Turfton's recurring city cast (lore R-151): who they are, where they live, how they sound and how they move. Pure
// data, no DOM: the Kerbside Exchange app (city/exchangeApp.ts) reads it to name each job's client, and writers read it
// to keep voices consistent. Speaker keys are comms/cast keys (quests/comms.ts CALLER_NAMES, cutscene/cast.ts CAST,
// voice/voices.ts VOICES). `persona` is an idle/walk personality id from src/anim/persona.ts (PERSONAS).
import type { DistrictId } from '../districts';

/** Same strings as anim/persona.ts Persona (repeated so this table does not import the animation system). */
export type CityPersona = 'plain' | 'swagger' | 'shuffle' | 'tiptoe' | 'sulk' | 'jaunty' | 'nervous' | 'proud' | 'sleepy' | 'pompous';

export interface CityCastMember {
  /** Speaker key (comms, cutscene cast, voices). */
  key: string;
  name: string;
  /** One line: what they do in Turfton. */
  role: string;
  /** Their district (districts.ts), or null for the Ring Blocks / on the road. */
  district: DistrictId | null;
  /** The stage id they live or work at (quests/stages.ts). */
  home: string;
  persona: CityPersona;
  /** How they talk, for writers: one line. */
  voice: string;
  /** Quest giver ids (quests/defs.ts GIVERS) whose jobs are theirs. */
  givers: readonly string[];
  /** Quest ids where they are the client (the one who wants the job done). */
  clientOf: readonly string[];
  /** Lore entry id (docs/lore/entries/apocrypha/<id>.md). */
  lore: string;
}

export const CITY_CAST: readonly CityCastMember[] = [
  {
    key: 'dot', name: 'Dot Pennywort', role: 'Runs the Kerbside Exchange job board by the Central Bus Stop.',
    district: 'downtown', home: 'kerb-exchange', persona: 'proud',
    voice: 'A retired Snail-Coach conductor: calls stops, punches tickets, says "next" and "fares, please".',
    givers: ['kerb-exchange'], clientOf: ['city-kerbside-rounds'], lore: 'dot-pennywort',
  },
  {
    key: 'hedda', name: 'Hedda Galley', role: 'Edits the Turfton Tattler; never photographed, never corrected.',
    district: 'downtown', home: 'kerb-exchange', persona: 'pompous',
    voice: 'Talks in headlines. Drops verbs. "Penthouse. Exclusive. Tonight."',
    givers: [], clientOf: ['city-penthouse-exclusive'], lore: 'hedda-galley',
  },
  {
    key: 'nina', name: 'Neon-Moth Nina', role: 'Sells glow-bands on the Greenhouse Strip and knows every racer.',
    district: 'greenhouse', home: 'greenhouse-strip', persona: 'jaunty',
    voice: 'Fast, sly night-owl; everyone is "sugar"; forever shooing a moth mid-sentence.',
    givers: [], clientOf: ['city-glow-band-express'], lore: 'neon-moth-nina',
  },
  {
    key: 'grout', name: 'Big Wrench Grout', role: 'Union Boss of Local 404, Clay-Mart Industrial.',
    district: 'industrial', home: 'clay-mart-lot', persona: 'swagger',
    voice: 'Slow dockworker growl; short sentences; "brother" and "sister"; never says "please".',
    givers: [], clientOf: ['city-skyway-robbery'], lore: 'big-wrench-grout',
  },
  {
    key: 'pip', name: 'Pip Potsworth', role: 'Side-Valve hand, the first gnome every newcomer meets.',
    district: 'old-brick', home: 'side-valve-bay', persona: 'nervous',
    voice: 'Too fast, too many exclamation marks, owes everybody.',
    givers: ['pip-spawn'], clientOf: ['city-impound-run', 'prologue-fresh-kiln'], lore: 'pip-potsworth',
  },
  {
    key: 'tansy', name: 'Tansy Clayfoot', role: 'Runs Side-Valve Salvage and the Lock-Up.',
    district: 'old-brick', home: 'side-valve-bay', persona: 'plain',
    voice: 'Dry, few words, counts wrenches.',
    givers: ['side-valve'], clientOf: [], lore: 'tansy-clayfoot',
  },
  {
    key: 'bodega', name: 'John Bodega', role: 'Keeps Bodega & Sons (no sons) open all night.',
    district: 'old-brick', home: 'bodega-front', persona: 'sleepy',
    voice: 'Unhurried, kind, about the cat.',
    givers: [], clientOf: [], lore: 'john-bodega',
  },
  {
    key: 'juniper', name: 'Councilwoman Juniper Vance', role: 'The Zoning Board\'s one vote against the HOA.',
    district: 'downtown', home: 'city-hall-steps', persona: 'proud',
    voice: 'Brisk, procedural, exhausted; cites page numbers.',
    givers: ['city-hall'], clientOf: [], lore: 'juniper-vance',
  },
  {
    key: 'big lou', name: 'Big Lou', role: 'Holds the Gnomecino\'s velvet rope.',
    district: 'greenhouse', home: 'gnomecino-door', persona: 'swagger',
    voice: 'Three words at a time, about hats.',
    givers: ['strangers-gnomecino'], clientOf: ['sq-big-lou-embargo'], lore: 'big-lou-gta',
  },
  {
    key: 'shelldon', name: 'Shelldon', role: 'Runs courier snails out of a retired snail-coach in his alley.',
    district: 'old-brick', home: 'shelldon-alley', persona: 'tiptoe',
    voice: 'Whispers; the paving is listening.',
    givers: ['strangers-shelldon'], clientOf: ['sq-snail-rigging'], lore: 'shelldon-mucilage',
  },
  {
    key: 'mossley', name: 'Mossley', role: 'Surveys the grid from a folding table outside Bodega & Sons.',
    district: 'old-brick', home: 'bodega-front', persona: 'shuffle',
    voice: 'Breathless theories, plumb-lines and datums.',
    givers: ['strangers'], clientOf: ['sq-grid-truthers'], lore: 'mossley-inkcap',
  },
  {
    key: 'mabel', name: 'Mabel Kerbstone', role: 'Drives the one Turfton Taxi.',
    district: null, home: 'bus-stop', persona: 'plain',
    voice: 'Everyone is "dear"; the meter is always running.',
    givers: [], clientOf: [], lore: 'mabel-kerbstone',
  },
];

/** The cast member who is the client of a quest, if any. */
export function clientOf(questId: string): CityCastMember | undefined {
  return CITY_CAST.find((c) => c.clientOf.includes(questId));
}
