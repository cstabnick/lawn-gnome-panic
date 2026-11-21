// Soft lens smear: a dark-blue vignette over the ride that briefly dims the view.
// Used when a Pester lands on a Territorial creature. Purely visual, never blocks input.

/** Full-stage overlay, hidden until flashSmear() is called. Appended to `parent`. */
export function mountSmear(parent: HTMLElement): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(12, 28, 80, 0) 35%, rgba(12, 28, 80, 0.35) 100%)',
    opacity: '0',
    transition: 'opacity 0.35s',
  });
  parent.append(el);
  return el;
}

/** Shows the smear at 0.6 opacity, then fades it back out after `seconds`. No-op for reduced motion. */
export function flashSmear(el: HTMLDivElement, seconds: number): void {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch {
    // matchMedia unavailable: show the smear anyway
  }
  el.style.opacity = '0.6';
  window.setTimeout(() => {
    el.style.opacity = '0';
  }, seconds * 1000);
}
