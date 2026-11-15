// STUB (Epic 2 fills this in): the title / garage screen: pick a vehicle and a mower colour, then Start.
import type { RacerChoice } from '../config';

/** Shows the menu in its own container under ui. onStart fires once (from the Start click) and the menu removes itself. */
export function showMenu(ui: HTMLElement, initial: RacerChoice, onStart: (choice: RacerChoice) => void): void {
  const box = document.createElement('div');
  box.id = 'lp-menu';
  box.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto';
  const b = document.createElement('button');
  b.id = 'lp-start';
  b.textContent = 'Start';
  b.onclick = () => { box.remove(); onStart(initial); };
  box.appendChild(b);
  ui.appendChild(box);
}
