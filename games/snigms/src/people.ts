// The neighbours of the town: four gnomes of the Yard with a routine each (where they are, hour by hour) and a few lines to say.
// Pure data: the view turns `look` into a gnome model, npcs.ts walks them, brain.ts chats with them.
// Names avoid the names already in docs/lore (Tansy, Bramble, Fernwick and Thatchford are taken there).

export type PersonId = 'chervil' | 'nettle' | 'mallow' | 'wren';

/** Colours as 0xRRGGBB. Beard and glasses are optional. */
export interface PersonLook {
  hat: number;
  coat: number;
  pants: number;
  boots: number;
  skin: number;
  beard?: number;
  glasses?: boolean;
}

export interface Routine {
  /** Hours, 0..24. A block runs from `from` up to `to` (wrapping past midnight is written as two blocks). */
  from: number;
  to: number;
  /** A spot id from the town level document (see town.ts townSpot). */
  spot: string;
}

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  blurb: string;
  look: PersonLook;
  /** Where they sleep when no routine block applies. */
  home: string;
  routine: Routine[];
  /** Things they say to the gnome, one at random per chat. Dry, no pop culture, no gore (docs/lore/canon.md). */
  lines: string[];
}

export const PEOPLE: Person[] = [
  {
    id: 'chervil',
    name: 'Chervil Hammerclod',
    role: 'Cook and owner of the Spore & Sprout',
    blurb: 'Runs the mushroom cafe on the square. Measures everything by the pinch.',
    look: { hat: 0xc0392b, coat: 0x7d5ba6, pants: 0x3b3b3b, boots: 0x222222, skin: 0xf1c27d },
    home: 'home-chervil',
    routine: [
      { from: 6, to: 14, spot: 'cafe' },
      { from: 14, to: 17, spot: 'square' },
      { from: 17, to: 22, spot: 'cafe' },
    ],
    lines: [
      'Two stews, one mushroom coffee, and a pinch of salt for luck.',
      'Spores in the cellar, sprouts on the sill. Nobody asked me to grow them. They just started.',
      'Eat slowly. The mushrooms have been in the dark all week and they feel it.',
      'Sit down, love. Carpool can wait ten minutes.',
    ],
  },
  {
    id: 'nettle',
    name: 'Nettle Haybale',
    role: 'Postgnome',
    blurb: 'Carries the letters across the Yard. Has never read one.',
    look: { hat: 0xe0b43a, coat: 0x4a6fa5, pants: 0x4a4a4a, boots: 0x222222, skin: 0xe9b98a, beard: 0x8a8a8a },
    home: 'home-nettle',
    routine: [
      { from: 7, to: 15, spot: 'post' },
      { from: 15, to: 17, spot: 'square' },
      { from: 17, to: 20, spot: 'park' },
    ],
    lines: [
      'I carry the letters. I never read the letters. That is the job.',
      'Snail-mail is slow. The bills are slower. Somebody always pays them, though.',
      'Got one for you. Does not say who it is from. They never do.',
      'Mind the dog on the long route. He is not a bad dog. He is just sure of himself.',
    ],
  },
  {
    id: 'mallow',
    name: 'Mallow Clayfoot',
    role: 'Retired mower mechanic',
    blurb: 'Forty years with oil and blades. Sits on the park bench most afternoons.',
    look: { hat: 0x5c8c4a, coat: 0x8c6a3f, pants: 0x5a4632, boots: 0x333333, skin: 0xd9a77a, beard: 0xf4f4f4, glasses: true },
    home: 'home-mallow',
    routine: [
      { from: 9, to: 12, spot: 'park' },
      { from: 12, to: 13, spot: 'cafe' },
      { from: 13, to: 18, spot: 'park' },
      { from: 18, to: 22, spot: 'square' },
    ],
    lines: [
      'Forty years I fixed mowers. The one that crossed the square? Not mine. Mine went in a ditch on purpose.',
      'The notice board says mind the mowers. Best advice this square ever had.',
      'Oil, blades and a cup of tea. That is all a gnome needs from a Tuesday.',
      'A good sit on this bench is worth three naps. Do not tell my knees.',
    ],
  },
  {
    id: 'wren',
    name: 'Wren Splitwell',
    role: 'Teenager of the square',
    blurb: 'Bored of the square and sure the Arcade is the only real place in the Yard.',
    look: { hat: 0x3ab3a3, coat: 0xe67e22, pants: 0x2c3e50, boots: 0x111111, skin: 0xf6d1a6 },
    home: 'home-wren',
    routine: [
      { from: 10, to: 14, spot: 'square' },
      { from: 14, to: 18, spot: 'park' },
      { from: 18, to: 21, spot: 'square' },
    ],
    lines: [
      'Meet you at the fountain. Everybody says that. Nobody ever has the fountain in mind.',
      'The Arcade has a cabinet that eats acorns. I am going to beat it one day.',
      'My feet are fine. It is the rest of me that is bored.',
      'If you see a mower coming, do not wave at it. I learned that the hard way.',
    ],
  },
];

export function personById(id: PersonId): Person {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) throw new Error(`No neighbour "${id}"`);
  return p;
}

/** The spot a neighbour is at this minute of the day: the first routine block that covers it, else their home. */
export function spotAt(p: Person, minuteOfDay: number): string {
  const hour = minuteOfDay / 60;
  for (const r of p.routine) if (hour >= r.from && hour < r.to) return r.spot;
  return p.home;
}

/** One line of "Chervil Hammerclod: ..." style text for the chat bubble. `pick` is 0..1 (injected for tests). */
export function lineFor(p: Person, pick: number): string {
  const i = Math.min(p.lines.length - 1, Math.floor(pick * p.lines.length));
  return p.lines[i];
}
