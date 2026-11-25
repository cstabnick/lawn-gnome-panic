// The Burrowfolk at home in Loamdeep (E17 issue B11): moles placed in the halls (built on every entry), bobbing,
// waddling and talking; DJ Moleman at the Under-Chorus decks once he visits. STUB: the B11 worker fills it.
import type { InteriorKit } from '../../interiors/types';

/** Puts the moles into the room being built (called from loamdeep/interior.ts on every entry). */
export function buildMoleFolk(_kit: InteriorKit): void {}

/** Animates the moles built by the last buildMoleFolk (no-op when the player is not in Loamdeep). */
export function updateMoleFolk(_dt: number, _t: number): void {}
