// Footstep surfaces, from a region's traits (the sim does not know about surfaces).
import type { Trait } from '../sim/types';

export type Surface = 'grass' | 'gravel' | 'stone' | 'moss' | 'mud';

export function surfaceFor(traits: readonly Trait[]): Surface {
  if (traits.includes('FLOODS')) return 'mud';
  if (traits.includes('MOSSY')) return 'moss';
  if (traits.includes('SACRED') || traits.includes('HIGH')) return 'stone';
  if (traits.includes('OPEN') || traits.includes('CHOKE')) return 'gravel';
  return 'grass';
}
