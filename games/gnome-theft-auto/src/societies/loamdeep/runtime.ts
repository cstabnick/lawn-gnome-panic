// Loamdeep's runtime (E17 issue J4): job spots in the halls, running a mole-job shift (HUD strip, lamps, roots, the
// sorting and digging games), paying and saving, the Under-Chorus speaker. STUB: the J4 worker fills it.
import type { InteriorKit } from '../../interiors/types';
import type { SocietyDeps, SocietyPart } from '../config';

/** Adds the job spots and the live lamps to the room being built (called from loamdeep/interior.ts on every entry). */
export function buildJobSpots(_kit: InteriorKit): void {}

export function installLoamdeep(_deps: SocietyDeps): SocietyPart {
  return {};
}
