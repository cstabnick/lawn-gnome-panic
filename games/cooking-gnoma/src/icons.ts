// The kitchen pictures. Each one is a @lawn/prefabs item drawn to a PNG at load time. The emoji is the fallback
// for a browser without WebGL.
import { prefabIcon } from '@lawn/prefabs';

export const ICON_PREFABS = {
  flour: 'acorn-flour-sack',
  frosting: 'grass-tuft',
  bowl: 'mixing-bowl',
  pan: 'cake-pan',
  oven: 'clay-oven',
  cake: 'acorn-cake',
} as const;

export type IconName = keyof typeof ICON_PREFABS;

export const ICON_NAMES = Object.keys(ICON_PREFABS) as IconName[];

export const ICON_EMOJI: Record<IconName, string> = {
  flour: '🌰',
  frosting: '🌿',
  bowl: '🥣',
  pan: '🍳',
  oven: '♨️',
  cake: '🍰',
};

export function iconKey(name: IconName): string {
  return `icon-${name}`;
}

/** A PNG data URL for the icon, or null when the browser cannot render prefabs. */
export function iconUrl(name: IconName): string | null {
  try {
    return prefabIcon(ICON_PREFABS[name], { size: 256 });
  } catch {
    return null;
  }
}
