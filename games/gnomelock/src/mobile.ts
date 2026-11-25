// Mobile touch controls (>= 44px targets, safe-area insets, portrait & landscape).
import type { AbilitySlot, HeroId } from './sim/config';
import type { MobileInputState } from './input';
import { spellIconSvg } from './spellIcons';

export function mountMobileControls(
  parent: HTMLElement,
  mobile: MobileInputState,
  onShop: () => void,
): { setVisible: (v: boolean) => void; setHeroIcons: (heroId: HeroId) => void; el: HTMLElement } {
  const root = document.createElement('div');
  root.id = 'mobile-controls';
  root.style.cssText = `
    position:fixed;inset:0;pointer-events:none;z-index:20;display:none;
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  `;

  // Left virtual joystick zone
  const joyZone = document.createElement('div');
  joyZone.style.cssText = `
    position:fixed;left:max(14px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));
    width:118px;height:118px;border-radius:50%;
    background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.22);
    pointer-events:auto;touch-action:none;
  `;
  const joyKnob = document.createElement('div');
  joyKnob.style.cssText = `
    position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;
    border-radius:50%;background:rgba(255,255,255,0.42);pointer-events:none;
  `;
  joyZone.appendChild(joyKnob);

  let joyTouchId: number | null = null;
  let joyCx = 0;
  let joyCy = 0;
  const maxR = 42;

  joyZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t) return;
    joyTouchId = t.identifier;
    const r = joyZone.getBoundingClientRect();
    joyCx = r.left + r.width / 2;
    joyCy = r.top + r.height / 2;
  }, { passive: false });

  joyZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== joyTouchId) continue;
      let dx = t.clientX - joyCx;
      let dy = t.clientY - joyCy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
      mobile.moveX = dx / maxR;
      mobile.moveY = -dy / maxR;
    }
  }, { passive: false });

  const resetJoy = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        joyTouchId = null;
        joyKnob.style.transform = '';
        mobile.moveX = 0;
        mobile.moveY = 0;
      }
    }
  };
  joyZone.addEventListener('touchend', resetJoy);
  joyZone.addEventListener('touchcancel', resetJoy);

  // Right-half drag-aim surface
  const aimZone = document.createElement('div');
  aimZone.style.cssText = `
    position:fixed;right:0;top:64px;bottom:0;left:42%;
    pointer-events:auto;touch-action:none;z-index:1;
  `;
  let aimTouchId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  aimZone.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (!t || aimTouchId !== null) return;
    aimTouchId = t.identifier;
    lastX = t.clientX;
    lastY = t.clientY;
  }, { passive: true });
  aimZone.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== aimTouchId) continue;
      mobile.yawDelta += (t.clientX - lastX) * 0.005;
      mobile.pitchDelta += (t.clientY - lastY) * 0.004;
      lastX = t.clientX;
      lastY = t.clientY;
    }
  }, { passive: true });
  const endAim = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === aimTouchId) aimTouchId = null;
    }
  };
  aimZone.addEventListener('touchend', endAim);
  aimZone.addEventListener('touchcancel', endAim);

  function mkBtn(label: string, rightPx: number, bottomPx: number, size: number, bg: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = `
      position:fixed;right:calc(${rightPx}px + env(safe-area-inset-right));
      bottom:calc(${bottomPx}px + env(safe-area-inset-bottom));
      width:${size}px;height:${size}px;border-radius:50%;border:2px solid rgba(255,255,255,0.35);
      background:${bg};color:#fff;font-weight:700;font-size:12px;
      pointer-events:auto;touch-action:none;z-index:2;padding:0;
    `;
    return b;
  }

  const fireBtn = mkBtn('FIRE', 18, 86, 68, 'rgba(220,60,50,0.72)');
  fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobile.fireHeld = true; }, { passive: false });
  fireBtn.addEventListener('touchend', () => { mobile.fireHeld = false; });
  fireBtn.addEventListener('touchcancel', () => { mobile.fireHeld = false; });

  const jumpBtn = mkBtn('JMP', 96, 30, 50, 'rgba(60,150,235,0.65)');
  jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobile.jumpQueued = true; }, { passive: false });

  const dashBtn = mkBtn('DSH', 154, 48, 48, 'rgba(240,170,40,0.65)');
  dashBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobile.dashQueued = true; }, { passive: false });

  const slideBtn = mkBtn('SLD', 24, 24, 50, 'rgba(130,100,220,0.65)');
  slideBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobile.slideHeld = true; }, { passive: false });
  slideBtn.addEventListener('touchend', () => { mobile.slideHeld = false; });
  slideBtn.addEventListener('touchcancel', () => { mobile.slideHeld = false; });

  const shopBtn = mkBtn('SHOP', 18, 224, 48, 'rgba(200,150,40,0.75)');
  shopBtn.addEventListener('click', onShop);

  const abSlots: readonly AbilitySlot[] = ['Q', 'E', 'F', 'X'];
  const abBtns = abSlots.map((slot, idx) => {
    const b = mkBtn(slot, 96 + idx * 50, 162, 44, 'rgba(40,55,85,0.75)');
    b.addEventListener('touchstart', (e) => { e.preventDefault(); mobile.abilityQueued = slot; }, { passive: false });
    return b;
  });

  root.append(aimZone, joyZone, fireBtn, jumpBtn, dashBtn, slideBtn, shopBtn, ...abBtns);
  parent.appendChild(root);

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) root.style.display = 'block';

  return {
    el: root,
    setVisible(v: boolean) {
      root.style.display = v ? 'block' : 'none';
    },
    setHeroIcons(heroId: HeroId) {
      abBtns.forEach((btn, idx) => {
        const slot = abSlots[idx];
        const ic = spellIconSvg(heroId, slot);
        btn.style.borderColor = ic.color;
        btn.innerHTML = `<span style="display:inline-flex;width:22px;height:22px;color:${ic.color};pointer-events:none">${ic.svg}</span>`;
      });
    },
  };
}
