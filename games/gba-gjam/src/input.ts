// Unified keyboard (P1 + optional P2 local) and mobile touch controls for GBA GJAM.
import type { PlayerControlInput } from '@lawn/jam';

export type { PlayerControlInput };

export class JamInput {
  private keys = new Set<string>();
  private p1ShootPrev = false;
  private p1PassPrev = false;
  private p1FakePrev = false;
  private p2ShootPrev = false;
  private p2PassPrev = false;
  private p2FakePrev = false;

  // Touch state for P1
  private touchMoveX = 0;
  private touchMoveZ = 0;
  private touchTurbo = false;
  private touchShoot = false;
  private touchPass = false;
  private touchFake = false;
  private touchRoot: HTMLElement | null = null;
  private joyStickId: number | null = null;
  private joyOrigin = { x: 0, y: 0 };
  private joyKnob: HTMLElement | null = null;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onBlur = (): void => {
    this.keys.clear();
    this.touchMoveX = 0;
    this.touchMoveZ = 0;
    this.touchTurbo = false;
    this.touchShoot = false;
    this.touchPass = false;
    this.touchFake = false;
  };

  /** Mounts mobile touch overlay inside a parent container (shown on touch/small screens). */
  mountTouchControls(parent: HTMLElement): void {
    if (this.touchRoot) return;
    const root = document.createElement('div');
    root.id = 'jam-touch-controls';
    root.style.cssText = `
      position:fixed;inset:0;pointer-events:none;z-index:25;display:none;
      padding:env(safe-area-inset-top,8px) env(safe-area-inset-right,12px) env(safe-area-inset-bottom,12px) env(safe-area-inset-left,12px);
    `;

    // Left virtual joystick zone
    const joyBase = document.createElement('div');
    joyBase.style.cssText = `
      position:absolute;left:max(18px, env(safe-area-inset-left, 18px));bottom:max(20px, env(safe-area-inset-bottom, 20px));
      width:124px;height:124px;border-radius:50%;pointer-events:auto;
      background:rgba(15,18,36,0.52);border:2px solid rgba(255,255,255,0.28);
      display:flex;align-items:center;justify-content:center;touch-action:none;
    `;
    const knob = document.createElement('div');
    knob.style.cssText = `
      width:52px;height:52px;border-radius:50%;
      background:radial-gradient(circle at 35% 35%, #ffd21f, #e6681c);
      border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.45);
      transform:translate(0px,0px);pointer-events:none;
    `;
    joyBase.appendChild(knob);
    this.joyKnob = knob;

    const maxR = 42;
    joyBase.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.joyStickId = e.pointerId;
      joyBase.setPointerCapture(e.pointerId);
      const rect = joyBase.getBoundingClientRect();
      this.joyOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.updateJoy(e.clientX, e.clientY, maxR);
    });
    joyBase.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyStickId) return;
      this.updateJoy(e.clientX, e.clientY, maxR);
    });
    const endJoy = (e: PointerEvent) => {
      if (e.pointerId !== this.joyStickId) return;
      this.joyStickId = null;
      this.touchMoveX = 0;
      this.touchMoveZ = 0;
      knob.style.transform = 'translate(0px,0px)';
    };
    joyBase.addEventListener('pointerup', endJoy);
    joyBase.addEventListener('pointercancel', endJoy);

    // Right action buttons (all >= 56px touch targets!)
    const btnCluster = document.createElement('div');
    btnCluster.style.cssText = `
      position:absolute;right:max(16px, env(safe-area-inset-right, 16px));bottom:max(20px, env(safe-area-inset-bottom, 20px));
      display:grid;grid-template-columns:repeat(2,66px);gap:10px;pointer-events:none;
    `;

    const makeBtn = (label: string, bg: string, onState: (down: boolean) => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.style.cssText = `
        width:66px;height:66px;border-radius:50%;border:2px solid rgba(255,255,255,0.75);
        background:${bg};color:#fff;font-weight:900;font-size:12px;letter-spacing:0.4px;
        box-shadow:0 4px 12px rgba(0,0,0,0.45);pointer-events:auto;touch-action:none;
        display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1;
      `;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.style.transform = 'scale(0.92)';
        onState(true);
      });
      const up = () => {
        btn.style.transform = 'scale(1)';
        onState(false);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      return btn;
    };

    const turboBtn = makeBtn('TURBO', 'rgba(245,166,35,0.86)', (d) => (this.touchTurbo = d));
    const shootBtn = makeBtn('SHOOT\nBLK', 'rgba(217,43,43,0.9)', (d) => (this.touchShoot = d));
    const passBtn = makeBtn('PASS\nSTL', 'rgba(30,100,216,0.9)', (d) => (this.touchPass = d));
    const fakeBtn = makeBtn('FAKE', 'rgba(46,160,90,0.9)', (d) => (this.touchFake = d));

    // Arrange ergonomically: Turbo top-left, Shoot top-right, Pass bottom-left, Fake bottom-right
    btnCluster.append(turboBtn, shootBtn, passBtn, fakeBtn);
    root.append(joyBase, btnCluster);
    parent.appendChild(root);
    this.touchRoot = root;
  }

  setTouchVisible(visible: boolean): void {
    if (!this.touchRoot) return;
    const isTouchOrNarrow =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    this.touchRoot.style.display = visible && isTouchOrNarrow ? 'block' : 'none';
  }

  private updateJoy(cx: number, cy: number, maxR: number): void {
    const dx = cx - this.joyOrigin.x;
    const dy = cy - this.joyOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const ang = Math.atan2(dy, dx);
    const ox = dist > 4 ? Math.cos(ang) * clamped : 0;
    const oy = dist > 4 ? Math.sin(ang) * clamped : 0;
    this.touchMoveX = ox / maxR;
    this.touchMoveZ = oy / maxR;
    if (this.joyKnob) {
      this.joyKnob.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px)`;
    }
  }

  /** Poll P1 input (WASD + J/Space Shoot/Block, K/E Pass/Steal, R Fake, Shift/L Turbo, plus Arrows when solo). */
  pollP1(allowArrows: boolean): PlayerControlInput {
    let mx = 0;
    let mz = 0;
    if (this.keys.has('KeyA') || (allowArrows && this.keys.has('ArrowLeft'))) mx -= 1;
    if (this.keys.has('KeyD') || (allowArrows && this.keys.has('ArrowRight'))) mx += 1;
    if (this.keys.has('KeyW') || (allowArrows && this.keys.has('ArrowUp'))) mz -= 1;
    if (this.keys.has('KeyS') || (allowArrows && this.keys.has('ArrowDown'))) mz += 1;

    if (Math.abs(this.touchMoveX) > 0.05 || Math.abs(this.touchMoveZ) > 0.05) {
      mx = this.touchMoveX;
      mz = this.touchMoveZ;
    } else if (mx !== 0 && mz !== 0) {
      const inv = 1 / Math.SQRT2;
      mx *= inv;
      mz *= inv;
    }

    const shootDown =
      this.keys.has('Space') || this.keys.has('KeyJ') || this.keys.has('KeyF') || this.touchShoot;
    const passDown =
      this.keys.has('KeyK') || this.keys.has('KeyE') || this.keys.has('KeyG') || this.touchPass;
    const fakeDown = this.keys.has('KeyR') || this.touchFake;
    const turbo =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyL') || this.touchTurbo;

    const shootPressed = shootDown && !this.p1ShootPrev;
    const shootReleased = !shootDown && this.p1ShootPrev;
    const passPressed = passDown && !this.p1PassPrev;
    const fakePressed = fakeDown && !this.p1FakePrev;
    this.p1ShootPrev = shootDown;
    this.p1PassPrev = passDown;
    this.p1FakePrev = fakeDown;

    return { moveX: mx, moveZ: mz, turbo, shootDown, shootPressed, shootReleased, passPressed, fakePressed };
  }

  /** Poll P2 local keyboard input (Arrows + N/Enter Shoot/Block, M Pass/Steal, Period Fake, Comma/RControl Turbo). */
  pollP2(): PlayerControlInput {
    let mx = 0;
    let mz = 0;
    if (this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('ArrowUp')) mz -= 1;
    if (this.keys.has('ArrowDown')) mz += 1;
    if (mx !== 0 && mz !== 0) {
      const inv = 1 / Math.SQRT2;
      mx *= inv;
      mz *= inv;
    }
    const shootDown = this.keys.has('KeyN') || this.keys.has('Enter') || this.keys.has('Numpad1');
    const passDown = this.keys.has('KeyM') || this.keys.has('Numpad2');
    const fakeDown = this.keys.has('Period') || this.keys.has('Numpad4');
    const turbo = this.keys.has('Comma') || this.keys.has('ControlRight') || this.keys.has('Numpad3');

    const shootPressed = shootDown && !this.p2ShootPrev;
    const shootReleased = !shootDown && this.p2ShootPrev;
    const passPressed = passDown && !this.p2PassPrev;
    const fakePressed = fakeDown && !this.p2FakePrev;
    this.p2ShootPrev = shootDown;
    this.p2PassPrev = passDown;
    this.p2FakePrev = fakeDown;

    return { moveX: mx, moveZ: mz, turbo, shootDown, shootPressed, shootReleased, passPressed, fakePressed };
  }

  isPausePressed(): boolean {
    if (this.keys.has('Escape') || this.keys.has('KeyP')) {
      this.keys.delete('Escape');
      this.keys.delete('KeyP');
      return true;
    }
    return false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.touchRoot?.remove();
  }
}
