// The Ammu-Gnation Pocket Kit: the gun-mod sheet (gunShop.ts) opened anywhere in the world, on foot. The camera swings in on the
// gnome's hand and the held gun wears the draft live (weapons.previewLoadout). Owned mods refit for free; new ones are bought at the
// shop price plus a Pigeon-Drop delivery fee. Opened with K, or the 🔧 in the weapon wheel. Not while wanted (heat >= 1).
import type { ShowroomTarget } from './camera';
import type { Economy } from './economy';
import { createGunShop, type GunFit, type GunShop } from './gunShop';
import { moddedGun } from './gunMods';
import { playGunShot } from './gunSounds';
import { KEYS, isTyping } from './keys';
import type { GunKind, Hud, Sfx, Weapons } from './types';

/** Acorns added to a Pocket Kit order that buys at least one new mod (refits are free). */
export const POCKET_KIT_FEE = 10;

export interface GunModKitDeps {
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  weapons: Weapons;
  play(sfx: Sfx): void;
  /** May the kit open now (on foot, alive, not mid-air, no other shop, menu or cutscene open). */
  canOpen(): boolean;
  /** Hat Watch heat now: the kit will not open for a wanted gnome (heat >= 1). */
  heat(): number;
  /** The world point the camera looks at while the kit is open (the gnome's gun hand). */
  focus(): { x: number; y: number; z: number };
  /** The kit opened (camera target near the hand; the game hides the HUD and holds the controls) or closed (null). */
  showroom(target: ShowroomTarget | null): void;
  /** An order went through (wallet charged, gunModStore saved). */
  onFit(info: GunFit): void;
}

export interface GunModKit {
  /** Open on a gun (default: the held one). A wanted gnome, or canOpen() false, gets a toast or nothing instead. */
  open(gun?: GunKind): void;
  /** Close; the held gun goes back to its fitted mods. */
  close(): void;
  isOpen(): boolean;
}

export function createGunModKit(deps: GunModKitDeps): GunModKit {
  let sheet: GunShop | null = null;

  /** The sheet, made on first open (it needs the page). */
  function ensureSheet(): GunShop {
    if (sheet) return sheet;
    sheet = createGunShop(deps.ui, deps.hud, {
      acorns: () => deps.economy.state().acorns,
      spend: (n, r) => deps.economy.spend(n, r),
      play: deps.play,
      preview: (g, l) => deps.weapons.previewLoadout?.(g, l),
      testFire: (g, l) => playGunShot(g, moddedGun(g, l).sound),
      onFit: (info) => deps.onFit(info),
      onClose: onSheetClosed,
    }, {
      rootId: 'gta-pocketkit',
      title: 'Pocket Kit',
      slogan: 'Ammu-Gnation, bolted on where you stand.',
      orderFee: POCKET_KIT_FEE,
      feeLabel: 'Pigeon-Drop delivery',
    });
    return sheet;
  }

  /** The sheet closed (Done, close button, Escape): the held gun goes back to its fitted mods and the camera returns. */
  function onSheetClosed(): void {
    deps.weapons.previewLoadout?.(deps.weapons.gun, null);
    deps.showroom(null);
  }

  function open(gun: GunKind = deps.weapons.gun): void {
    if (isOpen()) return;
    if (!deps.canOpen()) return;
    if (deps.heat() >= 1) {
      deps.hud.toast('Pocket Kit: "Not with the Hat Watch on your tail. Lose them first."');
      deps.play('alarm');
      return;
    }
    ensureSheet().open(gun);
    const f = deps.focus();
    deps.showroom({ x: f.x, y: f.y, z: f.z, radius: 0.35, distance: 1.9 });
  }

  function close(): void {
    sheet?.close();
  }

  function isOpen(): boolean {
    return sheet?.isOpen() ?? false;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.code !== KEYS.modKit || e.repeat || isTyping(e)) return;
      if (isOpen()) close();
      else open();
    });
  }

  return { open, close, isOpen };
}
