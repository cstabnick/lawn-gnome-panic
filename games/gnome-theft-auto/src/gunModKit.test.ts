import { describe, expect, it } from 'vitest';
import { createGunModKit, POCKET_KIT_FEE, type GunModKitDeps } from './gunModKit';

function stubDeps(): GunModKitDeps {
  return {
    ui: {} as HTMLElement,
    hud: { toast() {}, setVisible() {} } as unknown as GunModKitDeps['hud'],
    economy: {} as GunModKitDeps['economy'],
    weapons: { gun: 'pistol' } as unknown as GunModKitDeps['weapons'],
    play() {},
    canOpen: () => false,
    heat: () => 0,
    focus: () => ({ x: 0, y: 0, z: 0 }),
    showroom() {},
    onFit() {},
  };
}

describe('the Pocket Kit', () => {
  it('charges a positive whole-number order fee', () => {
    expect(Number.isInteger(POCKET_KIT_FEE)).toBe(true);
    expect(POCKET_KIT_FEE).toBeGreaterThan(0);
  });

  it('does nothing when the world says it cannot open', () => {
    const kit = createGunModKit(stubDeps());
    kit.open();
    expect(kit.isOpen()).toBe(false);
  });
});
