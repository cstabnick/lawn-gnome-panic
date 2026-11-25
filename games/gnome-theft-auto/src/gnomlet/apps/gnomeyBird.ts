// Gnomey Bird (L94): a small flap-through-the-gaps game on the Gnomlet. STUB: the E07 Gnomey Bird issue fills it in.
import { registerGnomletApp } from '../registry';

/** Registers the Gnomey Bird app on the Gnomlet (app.ts calls this once, right after createGnomlet). */
export function registerGnomeyBird(): void {
  registerGnomletApp({
    id: 'gnomey-bird',
    label: 'Gnomey Bird',
    icon: '🐦',
    group: 'fun',
    order: 30,
    open: (root) => {
      root.textContent = 'Coming soon.';
    },
  });
}
