// Club Gnome: shop furniture for Acorn Row (the Gnome Salon, the Gnome Market dressing room, the furniture shop).
import type { PrefabDef } from '../types';

export const CLUB_GNOME_SHOPS: PrefabDef[] = [
  {
    id: 'barber-chair', name: 'Barber Chair', category: 'furniture', uses: ['sit','place'],
    seat: [0, 0.55, 0.05],
    tags: ['barber','chair','salon','hair','seat','furniture'], emoji: [],
    about: 'A padded salon chair on a chrome pedestal with a footrest. STUB: replace.',
    examine: ['Placeholder line one for the Barber Chair, to be written.', 'Placeholder line two for the Barber Chair, to be written.', 'Placeholder line three for the Barber Chair, to be written.', 'Placeholder line four for the Barber Chair, to be written.'],
    parts: [
      { s: 'box', d: [0.6, 1.0, 0.6], at: [0, 0.5, 0], c: 'brass' },
    ],
  },
  {
    id: 'salon-mirror', name: 'Salon Mirror', category: 'furniture', uses: ['place'],
    tags: ['mirror','salon','vanity','glass','hair','furniture'], emoji: [],
    about: 'A tall standing salon mirror in a wooden frame with a shelf of combs. STUB: replace.',
    examine: ['Placeholder line one for the Salon Mirror, to be written.', 'Placeholder line two for the Salon Mirror, to be written.', 'Placeholder line three for the Salon Mirror, to be written.', 'Placeholder line four for the Salon Mirror, to be written.'],
    parts: [
      { s: 'box', d: [0.8, 1.6, 0.25], at: [0, 0.8, 0], c: 'brass' },
    ],
  },
  {
    id: 'changing-screen', name: 'Changing Screen', category: 'furniture', uses: ['place'],
    tags: ['screen','changing','dressing','folding','cloth','furniture'], emoji: [],
    about: 'A three-panel folding cloth screen for trying on clothes behind. STUB: replace.',
    examine: ['Placeholder line one for the Changing Screen, to be written.', 'Placeholder line two for the Changing Screen, to be written.', 'Placeholder line three for the Changing Screen, to be written.', 'Placeholder line four for the Changing Screen, to be written.'],
    parts: [
      { s: 'box', d: [1.4, 1.5, 0.4], at: [0, 0.75, 0], c: 'brass' },
    ],
  },
  {
    id: 'coming-soon-placard', name: 'Coming Soon Placard', category: 'prop', uses: ['place'],
    tags: ['placard','sign','easel','coming','soon','board','prop'], emoji: [],
    about: 'A board on a wooden easel painted COMING SOON. STUB: replace.',
    examine: ['Placeholder line one for the Coming Soon Placard, to be written.', 'Placeholder line two for the Coming Soon Placard, to be written.', 'Placeholder line three for the Coming Soon Placard, to be written.', 'Placeholder line four for the Coming Soon Placard, to be written.'],
    parts: [
      { s: 'box', d: [0.7, 1.2, 0.4], at: [0, 0.6, 0], c: 'brass' },
    ],
  },
];
