// Every crossover building. Adding one: a registerPortal call here, a door in each visiting game, and the host game
// reading joinPortalVisit() (see README.md).
import { registerPortal } from './registry';

/** The Gnomecino: Club Gnome runs the interior (its 'gnomecino' map); Gnome Theft Auto's Turfton door walks into it. */
export const GNOMECINO = registerPortal({
  id: 'gnomecino',
  building: 'The Gnomecino',
  host: { game: 'club-gnome', devPort: 5197, query: '', title: 'The Gnomecino' },
  doors: [
    { game: 'club-gnome', mode: 'native', label: 'Enter the Gnomecino' },
    { game: 'gnome-theft-auto', mode: 'visit', label: 'Enter The Gnomecino' },
  ],
});
