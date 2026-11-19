// Mossbottom Vale: the starting valley (levels 1-6).
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.mossbottom!);
