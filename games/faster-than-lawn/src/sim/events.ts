// Text events at 'event' beacons.

export interface EventOutcome {
  text: string;
  scrap?: number;      // added (negative = lost, never below 0)
  hull?: number;       // added (negative = damage, clamp 1..maxHull: events never kill)
  pinecones?: number;  // added
  crew?: number;       // +1 = a new gnome joins (random name from GNOME_NAMES); -1 = the last gnome leaves (never the only one)
  fight?: boolean;     // after the text, start a fight at this beacon's tier
}

export interface EventChoice {
  label: string;
  outcomes: { weight: number; outcome: EventOutcome }[]; // pick one by weight
}

export interface GnomeEvent {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}

export const EVENTS: GnomeEvent[] = [
  {
    id: 'birdbath',
    title: 'An Abandoned Birdbath',
    text: 'A cracked stone birdbath sits in the clover. Something glints at the bottom of the murky water.',
    choices: [
      { label: 'Send a gnome to fish it out', outcomes: [
        { weight: 2, outcome: { text: 'A handful of shiny bottle caps. Scrap is scrap.', scrap: 20 } },
        { weight: 1, outcome: { text: 'A robin defends its bath. Your gnome comes back pecked and the mower takes a beak to the hull.', hull: -3 } },
      ] },
      { label: 'Mow on by', outcomes: [{ weight: 1, outcome: { text: 'You leave the birdbath to the birds.' } }] },
    ],
  },
  {
    id: 'stranded',
    title: 'A Stranded Gnome',
    text: 'A lone gnome waves a tiny fishing rod from atop a molehill. Their mower is a smoking wreck.',
    choices: [
      { label: 'Offer a seat', outcomes: [
        { weight: 3, outcome: { text: 'They hop aboard, delighted. Your crew grows by one.', crew: 1 } },
        { weight: 1, outcome: { text: 'It was an ambush! Their friends roar out of the hedge.', fight: true } },
      ] },
      { label: 'Toss them some pinecones and leave', outcomes: [{ weight: 1, outcome: { text: 'They thank you and start whittling.', pinecones: -2, scrap: 10 } }] },
    ],
  },
  {
    id: 'sprinklers',
    title: 'Sprinkler Zone',
    text: 'The ground hisses. A grid of sprinkler heads pops up all around you.',
    choices: [
      { label: 'Floor it through', outcomes: [
        { weight: 1, outcome: { text: 'You make it through soaked but intact.' } },
        { weight: 1, outcome: { text: 'A high-pressure jet slams the engine cover.', hull: -4 } },
      ] },
      { label: 'Wait it out', outcomes: [{ weight: 1, outcome: { text: 'You wait. A passing beetle trades you scrap for shade.', scrap: 8 } }] },
    ],
  },
  {
    id: 'compost',
    title: 'The Compost Heap',
    text: 'A steaming compost heap. Rumour says gnomes bury their treasures here.',
    choices: [
      { label: 'Dig in', outcomes: [
        { weight: 1, outcome: { text: 'Buried pinecones, perfectly seasoned.', pinecones: 4 } },
        { weight: 1, outcome: { text: 'Mostly banana peels. And some scrap!', scrap: 15 } },
        { weight: 1, outcome: { text: 'A mower parked under the heap wakes up angry.', fight: true } },
      ] },
      { label: 'Hold your nose and leave', outcomes: [{ weight: 1, outcome: { text: 'Wise.' } }] },
    ],
  },
  {
    id: 'garden-shed',
    title: 'Garden Shed',
    text: 'The shed door is ajar. Inside: a workbench, a tub of grease and a sleeping cat.',
    choices: [
      { label: 'Patch the mower', outcomes: [
        { weight: 3, outcome: { text: 'Some grease and duct tape later, the hull looks better.', hull: 6 } },
        { weight: 1, outcome: { text: 'The cat wakes up. You flee, minus some scrap you dropped.', scrap: -10 } },
      ] },
      { label: 'Leave the cat alone', outcomes: [{ weight: 1, outcome: { text: 'Let sleeping cats lie.' } }] },
    ],
  },
  {
    id: 'garden-sale',
    title: 'Yard Sale',
    text: 'A gnome trader has a blanket of odds and ends spread on the lawn.',
    choices: [
      { label: 'Buy pinecones (10 scrap)', outcomes: [{ weight: 1, outcome: { text: 'A sack of pinecones, slightly used.', scrap: -10, pinecones: 5 } }] },
      { label: 'Sell spare parts', outcomes: [{ weight: 1, outcome: { text: 'You unbolt something that seemed unimportant.', scrap: 18, hull: -2 } }] },
      { label: 'Just browsing', outcomes: [{ weight: 1, outcome: { text: 'The trader sighs.' } }] },
    ],
  },
];

export function getEvent(id: string): GnomeEvent {
  return EVENTS.find((e) => e.id === id) ?? EVENTS[0];
}
