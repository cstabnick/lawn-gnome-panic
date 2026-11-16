export interface TouchCallbacks {
  onLook: (dx: number, dy: number) => void;
  onPing: () => void;
  onPiton: () => void;
  onDance: () => void;
  onWave: () => void;
  onRevive: () => void;
}

export class TouchControls {
  readonly isTouchDevice: boolean;
  readonly container: HTMLDivElement;

  forward = false;
  backward = false;
  left = false;
  right = false;
  sprint = false;
  grab = false;
  jump = false;

  private joyPointerId: number | null = null;
  private lookPointerId: number | null = null;
  private grabPointerId: number | null = null;
  private jumpPointerId: number | null = null;
  private lastLookX = 0;
  private lastLookY = 0;

  private readonly joyKnob: HTMLDivElement;
  private readonly joyBase: HTMLDivElement;
  private readonly grabBtn: HTMLButtonElement;
  private readonly reviveBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, private readonly cb: TouchCallbacks) {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.container = document.createElement('div');
    this.container.id = 'peak-touch';
    this.container.style.cssText = 'position:absolute;inset:0;display:none;pointer-events:none;';
    parent.appendChild(this.container);

    // Full-screen touch look layer (behind buttons/joystick)
    const lookLayer = document.createElement('div');
    lookLayer.style.cssText = 'position:absolute;inset:0;pointer-events:auto;touch-action:none;';
    this.container.appendChild(lookLayer);

    lookLayer.addEventListener('pointerdown', (e) => {
      if (this.lookPointerId !== null) return;
      this.lookPointerId = e.pointerId;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
      lookLayer.setPointerCapture(e.pointerId);
    });
    lookLayer.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookPointerId) return;
      const dx = e.clientX - this.lastLookX;
      const dy = e.clientY - this.lastLookY;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
      this.cb.onLook(dx, dy);
    });
    const endLook = (e: PointerEvent) => {
      if (e.pointerId === this.lookPointerId) this.lookPointerId = null;
    };
    lookLayer.addEventListener('pointerup', endLook);
    lookLayer.addEventListener('pointercancel', endLook);

    // Virtual Joystick (bottom-left)
    this.joyBase = document.createElement('div');
    this.joyBase.style.cssText = `
      position:absolute;left:22px;bottom:24px;width:116px;height:116px;border-radius:50%;
      background:rgba(15,23,42,0.45);border:2px solid rgba(255,255,255,0.28);
      pointer-events:auto;touch-action:none;
    `;
    this.joyKnob = document.createElement('div');
    this.joyKnob.style.cssText = `
      position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;
      border-radius:50%;background:rgba(255,255,255,0.82);box-shadow:0 2px 10px rgba(0,0,0,0.4);
      pointer-events:none;
    `;
    this.joyBase.appendChild(this.joyKnob);
    this.container.appendChild(this.joyBase);

    const updateJoystick = (clientX: number, clientY: number) => {
      const rect = this.joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.42;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / maxR;
      const ny = dy / maxR;
      this.forward = ny < -0.25;
      this.backward = ny > 0.25;
      this.left = nx < -0.25;
      this.right = nx > 0.25;
      this.sprint = dist > maxR * 0.88;
    };

    this.joyBase.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.joyPointerId = e.pointerId;
      this.joyBase.setPointerCapture(e.pointerId);
      updateJoystick(e.clientX, e.clientY);
    });
    this.joyBase.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyPointerId) return;
      updateJoystick(e.clientX, e.clientY);
    });
    const resetJoy = (e: PointerEvent) => {
      if (e.pointerId !== this.joyPointerId) return;
      this.joyPointerId = null;
      this.joyKnob.style.transform = 'translate(0px, 0px)';
      this.forward = this.backward = this.left = this.right = this.sprint = false;
    };
    this.joyBase.addEventListener('pointerup', resetJoy);
    this.joyBase.addEventListener('pointercancel', resetJoy);

    // Right-side action cluster
    const makeBtn = (label: string, css: string) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `
        position:absolute;border:1px solid rgba(255,255,255,0.3);color:#fff;font-weight:800;
        border-radius:50%;pointer-events:auto;touch-action:none;user-select:none;
        box-shadow:0 4px 14px rgba(0,0,0,0.35);${css}
      `;
      this.container.appendChild(b);
      return b;
    };

    this.grabBtn = makeBtn('GRAB', 'right:22px;bottom:26px;width:82px;height:82px;background:rgba(46,196,182,0.78);font-size:14px;');
    this.grabBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.grabPointerId = e.pointerId;
      this.grabBtn.setPointerCapture(e.pointerId);
      this.grab = true;
      this.grabBtn.style.background = 'rgba(255,209,102,0.9)';
    });
    const endGrab = (e: PointerEvent) => {
      if (e.pointerId !== this.grabPointerId) return;
      this.grabPointerId = null;
      this.grab = false;
      this.grabBtn.style.background = 'rgba(46,196,182,0.78)';
    };
    this.grabBtn.addEventListener('pointerup', endGrab);
    this.grabBtn.addEventListener('pointercancel', endGrab);

    const jumpBtn = makeBtn('JUMP', 'right:116px;bottom:34px;width:66px;height:66px;background:rgba(30,41,59,0.78);font-size:12px;');
    jumpBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.jumpPointerId = e.pointerId;
      jumpBtn.setPointerCapture(e.pointerId);
      this.jump = true;
    });
    const endJump = (e: PointerEvent) => {
      if (e.pointerId !== this.jumpPointerId) return;
      this.jumpPointerId = null;
      this.jump = false;
    };
    jumpBtn.addEventListener('pointerup', endJump);
    jumpBtn.addEventListener('pointercancel', endJump);

    const pingBtn = makeBtn('PING', 'right:22px;bottom:122px;width:54px;height:54px;background:rgba(30,41,59,0.72);font-size:11px;');
    pingBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onPing();
    });

    const pitonBtn = makeBtn('PITON', 'right:84px;bottom:122px;width:54px;height:54px;background:rgba(30,41,59,0.72);font-size:11px;');
    pitonBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onPiton();
    });

    const danceBtn = makeBtn('DANCE', 'right:146px;bottom:122px;width:54px;height:54px;background:rgba(139,92,246,0.75);font-size:11px;');
    danceBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onDance();
    });

    const waveBtn = makeBtn('WAVE', 'right:208px;bottom:122px;width:54px;height:54px;background:rgba(59,130,246,0.75);font-size:11px;');
    waveBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onWave();
    });

    this.reviveBtn = makeBtn('REVIVE', 'right:22px;bottom:186px;width:68px;height:42px;border-radius:12px;background:rgba(16,185,129,0.9);font-size:12px;display:none;');
    this.reviveBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onRevive();
    });
  }

  setVisible(visible: boolean): void {
    this.container.style.display = visible && this.isTouchDevice ? 'block' : 'none';
  }

  setReviveAvailable(available: boolean): void {
    this.reviveBtn.style.display = available ? 'block' : 'none';
  }
}
