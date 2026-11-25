// E24 chef: the touch mini-steps (STUB: filled by its E24 issue). DOM only.
import type { CookStep, StepWidget } from './types';

/** A playable widget for one step. */
export function makeStepWidget(step: CookStep): StepWidget {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = `${step.emoji} ${step.label} (tap)`;
  let done: number | null = null;
  el.addEventListener('click', () => { done = 80; });
  return { el, update() {}, result: () => done, destroy() {} };
}
