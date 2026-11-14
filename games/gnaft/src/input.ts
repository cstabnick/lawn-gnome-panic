// Keyboard + mouse state, sampled per frame. Call endFrame() once at the end of every frame.

export interface Input {
  /** Key held (KeyboardEvent.code, e.g. 'KeyW'). */
  down(code: string): boolean;
  /** Key went down this frame. */
  pressed(code: string): boolean;
  /** Mouse button held (0 = left, 2 = right). */
  mouseDown(button: number): boolean;
  mousePressed(button: number): boolean;
  mouseReleased(button: number): boolean;
  /** Mouse movement since last frame, in pixels (works with pointer lock). */
  look(): { dx: number; dy: number };
  /** Mouse wheel deltaY summed since last frame (positive = scroll down / zoom out). */
  wheel(): number;
  /** True while the mouse is captured, or always in touch mode (touch controls stand in for the mouse). */
  locked(): boolean;
  requestLock(): void;
  exitLock(): void;
  endFrame(): void;
  /** True once touch mode is on (a coarse pointer, or the first touch). */
  touch(): boolean;
  /** For touch controls: feeds the same key, button, look and wheel state the keyboard and mouse feed. */
  virtual: VirtualInput;
}

export interface VirtualInput {
  /** Turns touch mode on (or off): locked() is then always true and requestLock() does nothing. */
  setTouch(on: boolean): void;
  keyDown(code: string): void;
  keyUp(code: string): void;
  /** Mouse button (0 = left, 2 = right). */
  buttonDown(button: number): void;
  buttonUp(button: number): void;
  /** Look movement in pixels, like mouse movement under pointer lock. */
  look(dx: number, dy: number): void;
  /** Like a wheel deltaY (positive = zoom out). */
  wheel(deltaY: number): void;
}

export function createInput(canvas: HTMLCanvasElement): Input {
  const keys = new Set<string>();
  const keysPressed = new Set<string>();
  const buttons = new Set<number>();
  const btnPressed = new Set<number>();
  const btnReleased = new Set<number>();
  let dx = 0;
  let dy = 0;
  let wheel = 0;
  let touchMode = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  window.addEventListener('wheel', (e) => { wheel += e.deltaY; }, { passive: true });
  window.addEventListener('touchstart', () => { touchMode = true; }, { passive: true, capture: true });

  const keyDown = (code: string): void => {
    if (!keys.has(code)) keysPressed.add(code);
    keys.add(code);
  };
  const buttonDown = (b: number): void => { buttons.add(b); btnPressed.add(b); };
  const buttonUp = (b: number): void => { if (buttons.delete(b)) btnReleased.add(b); };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
    keyDown(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); buttons.clear(); });
  canvas.addEventListener('mousedown', (e) => { buttons.add(e.button); btnPressed.add(e.button); });
  window.addEventListener('mouseup', (e) => {
    if (buttons.delete(e.button)) btnReleased.add(e.button);
  });
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      dx += e.movementX;
      dy += e.movementY;
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    down: (c) => keys.has(c),
    pressed: (c) => keysPressed.has(c),
    mouseDown: (b) => buttons.has(b),
    mousePressed: (b) => btnPressed.has(b),
    mouseReleased: (b) => btnReleased.has(b),
    look: () => ({ dx, dy }),
    wheel: () => wheel,
    locked: () => touchMode || document.pointerLockElement === canvas,
    requestLock: () => {
      if (touchMode) return;
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    },
    touch: () => touchMode,
    virtual: {
      setTouch: (on) => { touchMode = on; },
      keyDown,
      keyUp: (code) => { keys.delete(code); },
      buttonDown,
      buttonUp,
      look: (x, y) => { dx += x; dy += y; },
      wheel: (d) => { wheel += d; },
    },
    exitLock: () => {
      if (document.pointerLockElement) document.exitPointerLock();
    },
    endFrame: () => {
      keysPressed.clear();
      btnPressed.clear();
      btnReleased.clear();
      dx = 0;
      dy = 0;
      wheel = 0;
    },
  };
}
