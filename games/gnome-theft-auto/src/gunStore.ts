// Ammu-Gnation, Turfton's gun-mod store: the walk-in storefront on the east edge of town (prefab building + collision
// boxes), the counter prompt, and the back-room display stage far off the map where the shop shows the modded gun big on
// a turntable while the sheet (gunShop.ts) is open. STUB: the store issue fills createGunStore in; the shape is final.
import type * as THREE from 'three';
import type { ShowroomTarget } from './camera';
import type { Economy } from './economy';
import type { GunFit } from './gunShop';
import type { Box, GunKind, Hud, Player, Sfx } from './types';

/** Where the store stands: centre (x, z), its open front faces -x (toward the road at x = 180), drawn at `scale`. */
export const GUN_STORE = { x: 200, z: -30, yaw: -Math.PI / 2, scale: 3 } as const;
/** Map blip colour (olive with a safety-orange rim reads on the city grey). */
export const GUN_STORE_BLIP = '#ff7a1a';

export interface GunStoreDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  /** The weapon the player holds now: the shop opens on it. */
  currentGun(): GunKind;
  /** Hat Watch heat now: the store will not serve a wanted gnome (heat >= 1). */
  heat(): number;
  /** The shop opened (a target for chase.showroom: the display gun) or closed (null). The game hides the HUD and holds the controls. */
  showroom(target: ShowroomTarget | null): void;
  /** An order went through (after gunModStore saved it). */
  onFit(info: GunFit): void;
}

export interface GunStore {
  /** The storefront's collision boxes in world coordinates. The game pushes them into world.boxes once. */
  readonly boxes: readonly Box[];
  /** Where the map pin goes. */
  readonly blip: { x: number; z: number; color: string };
  /** 'Shop mods at Ammu-Gnation' while the player stands on foot at the counter, else null. */
  prompt(player: Player): string | null;
  /** Open the shop (E or the touch button at the counter). A wanted gnome gets a toast instead. */
  interact(player: Player): void;
  isOpen(): boolean;
  close(): void;
  /** Every frame (turns the display while open). */
  update(dt: number): void;
}

export function createGunStore(deps: GunStoreDeps): GunStore {
  void deps;
  return {
    boxes: [],
    blip: { x: GUN_STORE.x, z: GUN_STORE.z, color: GUN_STORE_BLIP },
    prompt: () => null,
    interact() {},
    isOpen: () => false,
    close() {},
    update() {},
  };
}
