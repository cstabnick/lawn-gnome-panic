// The Verge: a windswept strip of mown stubble by the Fence. The Last Tuft war camp (south), the Shorn
// (the Even Cut's stubble desert, west), the King's cart, the Level (the Even Cut's square fort, east),
// the Battlefield and the Fence line (north), and the Shed at the far north end.
// Negative z is north. Houses are kept clear of every region centre (edge at least 4 m away).
// The Mower battle area (x -30..30, z -125..-15) holds no houses except the Shed.
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.verge!);
