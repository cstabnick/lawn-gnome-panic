// The Rockery: rock-garden mountains. Flintdelve (the mining town) is cut into the rock, the Spigot
// is the source of the Hose, the Shard Mine and the Kiln hold the old Shard. Negative z is north.
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.rockery!);
