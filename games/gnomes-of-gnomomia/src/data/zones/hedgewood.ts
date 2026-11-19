// Hedgewood: dark hedge forest. The Clippings sawpit (north-east) is a lumber camp with cabins and a mill,
// the hunters' lodge sits in a hollow root at Barkhollow, the Wildlings' tangle surrounds the Elder Privet,
// spider tunnels run under Webhollow, and the paper wasps raise a spire to the west.
// Negative z is north. Houses are kept clear of every region centre.
import type { ZoneDef } from '../../config';
import { ZONE_DOCS, docToZone } from '../../levelDocs';

export const ZONE: ZoneDef = docToZone(ZONE_DOCS.hedgewood!);
