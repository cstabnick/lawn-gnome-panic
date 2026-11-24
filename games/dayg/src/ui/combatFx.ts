// Combat HUD feedback: subtle crosshair dot, melee/ram hit-marker flash, and red damage vignette.
export interface CombatFx {
  flashHit(kill?: boolean): void;
  flashDamage(strength?: number): void;
  setCrosshairVisible(on: boolean): void;
}

export function createCombatFx(ui: HTMLElement): CombatFx {
  const crosshair = document.createElement('div');
  crosshair.id = 'dayg-crosshair';
  crosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;' +
    'background:rgba(255,255,255,0.65);box-shadow:0 0 4px rgba(0,0,0,0.8);pointer-events:none;z-index:25';

  const hitMark = document.createElement('div');
  hitMark.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(0.8);font:800 22px/1 system-ui,sans-serif;' +
    'color:#ffd54f;text-shadow:0 0 6px rgba(0,0,0,0.9);pointer-events:none;z-index:26;opacity:0;transition:opacity .12s ease,transform .12s ease';
  hitMark.textContent = '✕';

  const vignette = document.createElement('div');
  vignette.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:24;opacity:0;transition:opacity .18s ease;' +
    'box-shadow:inset 0 0 90px 28px rgba(190,32,24,0.85)';

  ui.append(vignette, crosshair, hitMark);

  let hitTimer: number | undefined;
  let dmgTimer: number | undefined;

  return {
    setCrosshairVisible(on: boolean) {
      crosshair.style.display = on ? 'block' : 'none';
    },
    flashHit(kill = false) {
      hitMark.style.color = kill ? '#ff6b57' : '#ffd54f';
      hitMark.style.opacity = '1';
      hitMark.style.transform = 'translate(-50%,-50%) scale(1.25)';
      if (hitTimer) clearTimeout(hitTimer);
      hitTimer = window.setTimeout(() => {
        hitMark.style.opacity = '0';
        hitMark.style.transform = 'translate(-50%,-50%) scale(0.8)';
      }, 160);
    },
    flashDamage(strength = 0.7) {
      vignette.style.opacity = String(Math.min(1, Math.max(0.35, strength)));
      if (dmgTimer) clearTimeout(dmgTimer);
      dmgTimer = window.setTimeout(() => {
        vignette.style.opacity = '0';
      }, 260);
    },
  };
}
