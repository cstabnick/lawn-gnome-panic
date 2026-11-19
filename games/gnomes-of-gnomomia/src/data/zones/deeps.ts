// Drainpipe Deeps: indoor dungeon under the Keep. Three wings (Gutters, Cistern, Backflow) split by walls;
// hatches open each wing as the story reaches it. Layout from src/data/README.md (zone layouts table).
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.deeps!);
