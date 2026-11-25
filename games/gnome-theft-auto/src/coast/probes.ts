// Coast quest probes (E11 issue 3A): the three window events the coast modules send, counted into the counter probes
// the 'probe' quest objective watches (city/probes.ts). Pure module state plus window listeners; no DOM.
//   gta:spokewheel-ride  -> coast-spokewheel-rides
//   gta:tow-run          -> coast-tow-gates (+1 per gate on course 'saltwater'), coast-tow-finish (+1 per finished run)
//   gta:queen-chest      -> coast-queen-chest
import { bumpProbe, declareCounter } from '../city/probes';

export const COAST_PROBES = ['coast-spokewheel-rides', 'coast-tow-gates', 'coast-tow-finish', 'coast-queen-chest'] as const;

let installed = false;

/** Declare the coast counters and listen for the coast events, once. A no-op without a window (tests, the headless sim). */
export function installCoastProbes(): void {
  for (const id of COAST_PROBES) declareCounter(id);
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('gta:spokewheel-ride', () => bumpProbe('coast-spokewheel-rides'));
  window.addEventListener('gta:queen-chest', () => bumpProbe('coast-queen-chest'));
  window.addEventListener('gta:tow-run', (e) => {
    const d = (e as CustomEvent<{ course?: string; finished?: boolean }>).detail;
    if (!d || d.course !== 'saltwater') return;
    if (d.finished) bumpProbe('coast-tow-finish');
    else bumpProbe('coast-tow-gates');
  });
}
