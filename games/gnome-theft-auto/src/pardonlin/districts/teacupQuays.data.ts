// Teacup Row and the Quays (E30): the words. Shop names, menus, posters, street names, vignettes and residents.
// Where things stand is decided in teacupQuays.ts; this file only holds the text and the people.
import type { AmbientGnomeDef } from '../../ambientGnomes';
import type { Vignette } from '../plan';

/** Names over doors, by building id: dealt out in turn (more than the buildings need, so the street never repeats itself). */
export const BUILDING_BANNERS: Record<string, readonly string[]> = {
  'euro-bistro': ['THE LONG LUNCH', 'BISTRO PENDING', 'THE SECOND CROISSANT', 'ESPRESSO, ETC.', 'CAFÉ ADEQUATE', 'THE LAST ORDER\n(NOT YET)', 'THE TEAPOT AND THE TRUTH', 'BISTRO OF MIXED FEELINGS', 'NO COMMENT CAFÉ'],
  'euro-corner-cafe': ['CAFÉ CORNER\n(THE OTHER ONE)', 'CAFÉ SECOND OPINION', 'THE CORNER CAFÉ\nAT THE CORNER'],
  'euro-bakery': ['BAKERY (OPINIONS EXTRA)', 'THE OTHER BAKERY\n(NOT THE BAKERY)'],
  'euro-shopfront-cheese': ['CHEESE\n(SEE ALSO: SMELL)', 'CHEESE, MOSTLY', 'THE CHEESE SHOP\nIS NOT THE CHEESE'],
  'euro-shopfront-chemist': ['REMEDIES FOR LUNCH', 'CHEMIST: ASK ABOUT TUESDAY'],
  'euro-shopfront-antiques': ['ANTIQUES\n(NEW STOCK: OLD)', 'ANTIQUES, ALSO A CHAIR'],
  'euro-townhouse-mansard': ['PASTRY AND OTHER OPINIONS', 'SALON OF SIGHS', 'UMBRELLAS FOR THE UNDECIDED'],
  'euro-half-timbered': ['THE ALMOST INN', 'HOUSE OF MANY HATS'],
  'euro-townhouse-tall': ['No. 9: BACK SOON', 'No. 11: ALSO BACK SOON'],
  'euro-apartment-block': ['BALCONY APARTMENTS\n(BALCONIES EXTRA)'],
};

export interface Placed { text: string; x: number; z: number; yaw: number }
const PI = Math.PI;

/** Street-name signs, renamed in the town's voice. */
export const STREET_SIGNS: readonly Placed[] = [
  { text: 'Teacup Row\n(No Mugs)', x: -1528.3, z: 113.4, yaw: PI },
  { text: 'Teacup Row\n(Still No Mugs)', x: -1519.6, z: 247.2, yaw: 0 },
  { text: 'Place du Pot\n(Pot Not Included)', x: -1511, z: 429.5, yaw: PI / 2 },
  { text: 'South Quay\n(The River Is Decorative)', x: -1577.2, z: 128, yaw: PI },
  { text: 'Rue Haute\n(Please Be Brief)', x: -1453.2, z: 128, yaw: PI },
  { text: 'Avenue to the Hatwheel\n(Allow Several Laps)', x: -1530.6, z: 62, yaw: PI },
  { text: 'Cross Street\n(Look Both Ways, Then Queue)', x: -1556, z: 112.5, yaw: PI },
  { text: 'Market Square\n(Closed Between Open Hours)', x: -1485, z: 386, yaw: -PI / 2 },
];

/** Chalkboard menus on the terraces. */
export const MENUS: readonly Placed[] = [
  { text: 'Croissant: one per customer, per life', x: -1527.6, z: 158, yaw: PI / 2 },
  { text: 'Soup of the day: yesterday\'s', x: -1527.6, z: 183, yaw: PI / 2 },
  { text: 'Coffee: small, smaller, theoretical', x: -1527.6, z: 212, yaw: PI / 2 },
  { text: 'Tea: ask, wait, apologise', x: -1527.6, z: 233, yaw: PI / 2 },
  { text: 'Lunch 12:00 to 15:00.\nDinner 15:01 to lunch.', x: -1519.5, z: 150, yaw: -PI / 2 },
  { text: 'Special of the day:\nthe table by the window', x: -1519.5, z: 176, yaw: -PI / 2 },
  { text: 'Water: free, once you\'ve found a glass', x: -1519.5, z: 211, yaw: -PI / 2 },
  { text: 'Today\'s special is a long conversation', x: -1519.5, z: 231, yaw: -PI / 2 },
  { text: 'Baguette: 80 cm.\nNot 79. We measure.', x: -1519.8, z: 141.6, yaw: -PI / 2 },
  { text: 'Tarte of the day:\nsee yesterday', x: -1576, z: 156, yaw: -PI / 2 },
  { text: 'Sandwich: bread, optionally cheese,\nalways opinion', x: -1452.4, z: 304, yaw: PI },
];

/** Posters on poster boards. */
export const POSTERS: readonly Placed[] = [
  { text: 'CAFÉ CLOSED FOR LUNCH.\nBack after lunch.', x: -1519.4, z: 244.6, yaw: -PI / 2 },
  { text: 'STRIKE TOMORROW\nagainst the strike of next week', x: -1527.9, z: 121.2, yaw: PI / 2 },
  { text: 'LOST: one opinion.\nAnswers to anything.', x: -1583.8, z: 322, yaw: -PI / 2 },
  { text: 'ACCORDION RECITAL\nThursdays. The fourth tune is not on the programme.', x: -1453.4, z: 206, yaw: PI },
  { text: 'FORMS IN TRIPLICATE\navailable in duplicate', x: -1484, z: 414, yaw: -PI / 2 },
  { text: 'NO PIGEONS\n(they know)', x: -1514, z: 352, yaw: 0 },
  { text: 'MIME WORKSHOP\nsilent, but very full', x: -1451.8, z: 60, yaw: PI },
  { text: 'LOST DOG.\nFound dog. Please settle between you.', x: -1471.5, z: 20, yaw: PI / 2 },
];

export const VIGNETTES: readonly Vignette[] = [
  {
    id: 'tq-tuesday-espresso', name: 'The espresso since Tuesday', x: -1523.5, z: 152.4,
    story: 'One espresso, two chairs, a newspaper dated Tuesday, a stack of twelve saucers and a chess game on its move 3 of a longer discussion: nobody will clear the cup and nobody dares drink it.',
  },
  {
    id: 'tq-bakery-queue', name: 'The bakery queue at dawn', x: -1520.5, z: 137,
    story: 'Five queue posts, a bench with a bedroll on it, a thermos, a basket of baguettes and a ticket board on number 4 of 4,311: whoever started this queue has gone to get a better place in it.',
  },
  {
    id: 'tq-waiters-revenge', name: 'The waiter\'s revenge', x: -1526, z: 169.3,
    story: 'A table set for one with the bill already on it and a croissant nobody ordered; one chair turned to face the wall, one knocked over. Hector has made his point.',
  },
  {
    id: 'tq-bicycle-planter', name: 'The bicycle that is a planter', x: -1525.5, z: 250.5,
    story: 'A bike rack at the lane\'s south mouth with geranium pots where the bicycles go, and a sign that says BICYCLES ONLY. Technically the pots came by bicycle.',
  },
  {
    id: 'tq-book-that-fell-in', name: 'The book that fell in', x: -1587.5, z: 87,
    story: 'Prudence Spine\'s green boxes stand open with one gap in the books, a fishing rod is hooked on the railing and an angler\'s stool faces the river: a book went in, and someone is trying to get it back out before anyone notices.',
  },
  {
    id: 'tq-empty-pitch', name: 'The accordionist\'s empty pitch', x: -1593.5, z: 332,
    story: 'An accordion on a crate, a hat on the ground with three acorns in it and a half-eaten sandwich, but no Anatole. He has gone to find a fourth tune, or lunch.',
  },
  {
    id: 'tq-audience-of-chairs', name: 'The audience of chairs', x: -1525, z: 289,
    story: 'A bandstand with a music stand and a cello, and three rows of café chairs lined up to face it. Nobody is sitting; everyone is waiting to be asked.',
  },
  {
    id: 'tq-post-booth-lunch', name: 'The post booth that is at lunch', x: -1521, z: 402,
    story: 'A red post booth with a queue of four posts, a heap of parcels, a lost suitcase and a deck chair for waiting, under a note that says CLOSED FOR LUNCH, BACK AFTER LUNCH.',
  },
];

const base = { skin: 0xf1c27d, boots: 0x222222, pants: 0x2c3e50 } as const;

export const RESIDENTS: readonly AmbientGnomeDef[] = [
  {
    id: 'pl-baker', name: 'Brigitte Levain', x: -1520, z: 131.5, yaw: -PI / 2, idle: 'vendor-call',
    look: { ...base, hat: 0xf4f1e8, shirt: 0xfbf7ee, pants: 0x6b4a2f, beard: null, hair: { color: 0x8b5a2b, style: 'bun' }, dress: true },
    bubble: 'One baguette per customer. Eighty centimetres, not seventy-nine. The queue starts here and ends elsewhere.',
  },
  {
    id: 'pl-cafe-a', name: 'Jean-Pot', x: -1525.7, z: 153.3, yaw: PI / 2, idle: 'sip-drink',
    look: { ...base, hat: 0x2f3e55, shirt: 0xb9323b, beard: 0xcfcfcf, glasses: true },
    bubble: 'It is the same espresso. It has simply become more interesting. Life is a queue, you understand.',
  },
  {
    id: 'pl-cafe-b', name: 'Sabine Sip', x: -1523.1, z: 151.5, yaw: -PI / 2, idle: 'think',
    look: { ...base, hat: 0x7b3f61, shirt: 0xe9d9a6, beard: null, hair: { color: 0x4a3a2a, style: 'long' }, dress: true },
    bubble: 'Jean says life is a queue. I say it is a table. We have been at the table since Tuesday.',
  },
  {
    id: 'pl-waiter', name: 'Hector Disdain', x: -1527.3, z: 172.6, yaw: -PI / 2, idle: 'idle-pompous',
    look: { ...base, hat: 0x1c1c1c, shirt: 0xffffff, pants: 0x151515, beard: 0x333333, glasses: true },
    bubble: 'Hector has seen you. This is the full extent of the service.',
  },
  {
    id: 'pl-accordion', name: 'Anatole Bellows', x: -1586, z: 197.8, yaw: 0.3, idle: 'busk-guitar',
    look: { ...base, hat: 0x3a5f3a, shirt: 0xa84b2a, pants: 0x4a4f57, beard: 0x8a6a4a },
    bubble: 'I know a fourth tune. I am saving it for a better river.',
  },
  {
    id: 'pl-bouquiniste', name: 'Prudence Spine', x: -1583.9, z: 74.5, yaw: -PI / 2, idle: 'read',
    look: { ...base, hat: 0x2f5d3a, shirt: 0x3a4a6b, pants: 0x3b3b3b, beard: null, hair: { color: 0xd0d0d0, style: 'bun' }, glasses: true, dress: true },
    bubble: 'I have every book. I will not tell you which ones are in the boxes, and you are not ready for the green one.',
  },
];
