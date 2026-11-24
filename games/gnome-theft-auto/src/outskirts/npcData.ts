// Pebblewick's nine townsfolk: who they are, how they look (overrides on the town base look, see npcs.ts) and the
// three lines each says when the player greets them. Stations and schedules are in town.ts (NPC_STATIONS).
import type { GnomeLook } from '@lawn/gnome';
import type { TownNpcId } from './town';

export interface TownNpcDef {
  id: TownNpcId;
  name: string;
  look: Partial<GnomeLook>;
  lines: readonly string[];
}

export const TOWN_NPCS: readonly TownNpcDef[] = [
  {
    id: 'yarrow',
    name: 'Reeve Yarrow Potsherd',
    look: { hat: 0x6a3d9a, shirt: 0x3a3f58, beard: 0xe8e2d0, glasses: true },
    lines: [
      'Pebblewick is a town, not a stop. We have a bell, a bus and a reeve.',
      'Population thirty-one. I count every morning. Some mornings I get thirty-two.',
      'The highway was meant to stop at the Flats. We asked it nicely to keep going.',
    ],
  },
  {
    id: 'marigold',
    name: 'Marigold Skillet',
    look: { hat: 0xe8a33a, shirt: 0xf4efe6, beard: null, hair: { color: 0x8b4a2b, style: 'bun' } },
    lines: [
      "Sit down, you look dusty. Everyone looks dusty. That's why it's the Dry Spoon.",
      'Prickly pear pie, fresh from the oven. The oven is the sun.',
      'Fizz Cup weekends I feed four hundred. Other days I feed Burnet four times.',
    ],
  },
  {
    id: 'thistle',
    name: 'Thistle Twine',
    look: { hat: 0x2f7d5a, shirt: 0xb88a4a, beard: 0xbfbfbf, glasses: true },
    lines: [
      "If Twine's doesn't sell it, you don't need it.",
      'Postcards, five Acorns. Stamps are Sorrel\'s problem.',
      'I sweep the porch twice a day. The Flats sweep it back three times.',
    ],
  },
  {
    id: 'burnet',
    name: 'Burnet Ratchet',
    look: { hat: 0xc0392b, shirt: 0x34495e, beard: 0x5a4a3a },
    lines: [
      'Every racer stops here twice. Once on the way out, once on a tow.',
      "That pump's Black Dew. Don't smoke near it. Don't sing near it either.",
      'I can hear a loose carb from the junction. I can hear the Old Combine from my bed.',
    ],
  },
  {
    id: 'sorrel',
    name: 'Sorrel Stampwell',
    look: { hat: 0x1f5fa8, shirt: 0xd9c9a3, beard: null, hair: { color: 0x3a2a1a, style: 'braid' } },
    lines: [
      'Snail post goes out on the Hopper at golden hour. If the snail is ready.',
      'I never read the postcards. I glance. For the stamps.',
      'Somebody keeps posting letters to the Old Combine. No return address.',
    ],
  },
  {
    id: 'comfrey',
    name: 'Doc Comfrey Mortar',
    look: { hat: 0xf4f4f4, shirt: 0x6fb7b0, beard: 0xdedede, glasses: true },
    lines: [
      'Hairline cracks, mostly. The dry wind does it. Glaze twice a day.',
      "Turfton's Glaze Clinic sends me their overflow. I send them my bills.",
      "If you're cracked, I'm open. If you're bored, try the diner.",
    ],
  },
  {
    id: 'purslane',
    name: 'Purslane Furrow',
    look: { hat: 0x7a8a3a, shirt: 0xa8743a, beard: 0xf0eee6 },
    lines: [
      'The Weeping Line gives a drop every span. A drop is plenty, if you\'re a pepper.',
      'Thirty years I\'ve farmed the edge of the Flats. The Flats never once said thank you.',
      "Something's drinking from my line out by the canyon. Something with a pump.",
    ],
  },
  {
    id: 'mallow',
    name: 'Mallow Bucket',
    look: { hat: 0xf2c94c, shirt: 0xe06a8a, beard: null, freckles: true, hair: { color: 0xc96a2b, style: 'pigtails' } },
    lines: [
      "There's a combine in the dunes and it hums at three in the morning.",
      "I drew a map. It's mostly arrows. The arrows are important.",
      "When I'm reeve, the water tower's getting a slide.",
    ],
  },
  {
    id: 'sedge',
    name: 'Old Sedge',
    look: { hat: 0x4a4a4a, shirt: 0x9a5a3a, beard: 0xcccccc },
    lines: [
      "This one's called Dust in the Carburettor. Same as the last one, slower.",
      "Tips in the hat, not the well. The well has enough.",
      'I played the Speedway once. They lapped me.',
    ],
  },
];
