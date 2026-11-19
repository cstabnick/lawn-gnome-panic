// Birdbath Keep: the capital. The castle is cut into the birdbath pedestal (north), the Basin lake
// sits on its rim, Pedestal Ward is the town around the base (south), and the stairs go down to the Deeps.
// Negative z is north.
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.keep!);
