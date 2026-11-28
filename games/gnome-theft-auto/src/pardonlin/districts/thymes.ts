// The Thymes through Pardonlin (FX09, D9 item 4): quay walls, stairs, moored boats, bouquinistes, bridge parapets.
// Pure data, like the district plans; plans.ts hands each piece to the district it stands in (the river corridor
// x -1626..-1595 belongs to Teacup Row and the Quays).
import type { DistrictPlan } from '../plan';

export function planThymes(): Omit<DistrictPlan, 'id'> {
  return { buildings: [], props: [], signs: [], vignettes: [], residents: [], ground: [] };
}
