// Mission comms for the five Kerbside Exchange city contracts (quests/cityQuests.ts). Same shape as COMMS in comms.ts:
// step 0 is the briefing (plays as objective 0 starts), later steps a call when that objective begins. Lines follow the
// direction bible: at most 16 words (aim for 12), the speaker's own voice (city/cityCast.ts), one place name per call.
// Merged into comms.ts; type-only import of CommsCall, so there is no import cycle.
import type { CommsCall } from './comms';

/** Display names on the comms card for the city speakers (comms.ts CALLER_NAMES holds the rest). */
export const CITY_CALLER_NAMES: Readonly<Record<string, string>> = {
  dot: 'Dot Pennywort',
  hedda: 'Hedda Galley',
  nina: 'Neon-Moth Nina',
  grout: 'Big Wrench Grout',
  mabel: 'Mabel Kerbstone',
};

const brief = (...lines: [string, string][]): CommsCall => ({ mode: 'briefing', lines: lines.map(([who, text]) => ({ who, text })) });
const call = (...lines: [string, string][]): CommsCall => ({ mode: 'call', lines: lines.map(([who, text]) => ({ who, text })) });

export const CITY_COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = {
  'city-kerbside-rounds': {
    0: brief(
      ['dot', 'Next stop, Kerbside Rounds! I need a runner with decent shoes.'],
      ['dot', 'Four stops: a bundle, then three drops. Fares, please!'],
      ['dot', 'Report back here when you are done. I punch cards, not feelings.'],
    ),
    1: call(['bodega', 'Tattlers, all warm. Nina is on the Strip. Mind the cat, she bites.']),
    2: call(['nina', 'Got the bundle, sugar! Now Kerb Row, before the moth eats it.']),
    3: call(['mabel', 'Mine goes upstairs, over the garage. I will have the change ready.']),
    4: call(['juniper', 'Page four is the one people read. Return to Dot.']),
  },
  'city-impound-run': {
    0: brief(
      ['pip', 'Clay-Mart returns yard! Two HOA clerks, and my Zero-Turn is in there.'],
      ['pip', 'Crack Tare and Gross. Then I need my Zero-Turn back, please.'],
      ['pip', 'Don\'t scratch it. Everything I own pulls left, but it is mine.'],
    ),
    1: call(['tansy', 'Respray at Pay \'n\' Glaze, park it in my Lock-Up. Sling-Lift if it stalls.']),
  },
  'city-glow-band-express': {
    0: brief(
      ['nina', 'Glow-bands, sugar! Run them round town before the Toadstools go on.'],
      ['nina', 'Four stops, ninety seconds. The clock starts at my stoop.'],
      ['nina', 'Don\'t stop for the moth. Not even when he asks nicely.'],
    ),
  },
  'city-penthouse-exclusive': {
    0: brief(
      ['hedda', 'Penthouse. Exclusive. Thorne Tower, tonight.'],
      ['hedda', 'Fly the Sycamore round, three passes. Photograph the Pot.'],
      ['hedda', 'Headline is the grass. Or the lack of it. I need a picture.'],
    ),
    1: call(['dot', 'Hedda is at my desk, so the photos come here. Land by the stop.']),
  },
  'city-skyway-robbery': {
    0: brief(
      ['grout', 'Skyway. Eastbound. Beat the HOA ledger van to the off-ramp.'],
      ['grout', 'The HOA ledger rides the Skyway. Get there first, brother.'],
      ['grout', 'The strike-fund ledger is in that van. Take it. Nobody else will.'],
    ),
    1: call(['grout', 'Crack the crew, brother. They work for the HOA, not for you.']),
    2: call(['tansy', 'Van to the Union Hall in Clay-Mart Industrial. Gently. It owes us money.']),
  },
};
