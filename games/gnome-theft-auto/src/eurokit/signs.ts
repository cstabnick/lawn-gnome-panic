// Satirical text for the European kit's blank sign faces (E29). Keep the exported signatures.

/** Which sign prefabs have a blank face, the face part's name and its size (prefab-local metres, facing +z). */
export interface SignFace { part: 'sign-face'; width: number; height: number; centre: readonly [number, number, number] }

export const SIGN_FACE: Readonly<Record<'euro-chalkboard-sign' | 'euro-poster-board' | 'euro-street-sign', SignFace>> = {
  'euro-chalkboard-sign': { part: 'sign-face', width: 0.5, height: 0.7, centre: [0, 0.62, 0.12] },
  'euro-poster-board': { part: 'sign-face', width: 1.2, height: 1.6, centre: [0, 1.4, 0.06] },
  'euro-street-sign': { part: 'sign-face', width: 0.6, height: 0.3, centre: [0, 2.2, 0.03] },
};

export type SignKind = 'menu' | 'poster' | 'street';

/** Lines for each kind of sign. Menu lines fit a chalkboard (40 characters), posters take a sentence or two (60), street names are short (24). */
export const EURO_SIGN_LINES: Readonly<Record<SignKind, readonly string[]>> = {
  menu: [
    "Soup of the day: yesterday's",
    'Croissant (one per customer, per life)',
    'Espresso: small, dark, not for you',
    'Omelette, if the chef feels like it',
    "Today's cheese: the same cheese",
    'Steak frites (frites out of stock)',
    'Lunch: from noon, until it is over',
    'Coffee, served with a small opinion',
    "Tart of the season: last season's",
    'Bread: fresh, in the sense of Tuesday',
    'Wine by the glass. Glass by the wine.',
    'Soup (cold). Soup (hot). Soup (later).',
    'Pastry: please ask. We will think.',
    'Closed for lunch. Open for lunch.',
  ],
  poster: [
    'STRIKE ON TUESDAY. Strike about Tuesday on Wednesday.',
    "Lost: one beret. Answers to 'Beret'.",
    'Concert tonight at the Opera Hall. Chairs not provided.',
    'Notice: the bell will ring at ten. Ten is negotiable.',
    'Forms: file in triplicate. Then copy the forms.',
    'The bicycle lane is for bicycles. It is not for parking.',
    'Rain expected. Umbrellas are a personal choice.',
    'Scooter for sale. Mostly noise. Only slightly used.',
    'Closed for a holiday. Ask us which holiday.',
    'Queue here. The queue is for nothing. Join it.',
    'Pigeons are not to be fed. They are not to be asked.',
    'The fountain is decorative. Do not drink the decoration.',
    'Please do not run. Walking is also discouraged.',
    'Lost: a small car, parked somewhere. Please advise.',
  ],
  street: [
    'Rue de la Long Lunch',
    'Queue Street',
    'Little Pebble Lane',
    'Strike Avenue',
    'Boulevard of Forms',
    'Beret Walk',
    'Pastry Row',
    'Tuesday Crescent',
    'Puddle Terrace',
    'Scooter Passage',
    'Opera Hall Steps',
    'Rue Who Cares',
    'Closed Lane',
    'Bell Tower Way',
    'Tiny Car Gap',
    'Cheese Street',
  ],
};

/** A line for a sign of `kind`, picked by `seed` (deterministic). '' when the list is empty. */
export function signLine(kind: SignKind, seed: number): string {
  const list = EURO_SIGN_LINES[kind];
  if (!list.length) return '';
  return list[Math.abs(Math.floor(seed)) % list.length];
}
