// Test-only: a stand-in `document` so world building code runs under vitest (node). Canvas 2D contexts are a proxy that
// accepts every call and property, so code that draws textures runs exactly as in a browser (including any random
// numbers it draws), and THREE.CanvasTexture gets an object to hold. Nothing is rendered.

/** A value every property read, call and `new` of which returns another such value. */
function sink(): unknown {
  const fn = function () { /* no-op */ };
  const p: unknown = new Proxy(fn, {
    get(_t, key) {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === 'width' || key === 'height') return 0;
      if (key === 'data') return new Uint8ClampedArray(4);
      return p;
    },
    set: () => true,
    apply: () => p,
    construct: () => p as object,
  });
  return p;
}

function fakeCanvas(): Record<string, unknown> {
  return {
    width: 300,
    height: 150,
    style: {},
    getContext: () => sink(),
    toDataURL: () => 'data:,',
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

/** Installs the stand-in on globalThis (once). Returns a function that removes it again. */
export function installFakeDom(): () => void {
  const g = globalThis as Record<string, unknown>;
  if (g.document) return () => {};
  g.document = {
    createElement: (tag: string) => (tag === 'canvas' ? fakeCanvas() : { style: {}, appendChild: () => {}, setAttribute: () => {} }),
    createElementNS: () => fakeCanvas(),
  };
  return () => { delete g.document; };
}
