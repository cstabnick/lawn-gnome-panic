// End-of-game epilogue: the EPILOGUE cards whose conditions hold, one at a time, then a closing card.
// One full-screen overlay is appended to the shared #ui root and removed by the closing card's button.
import { UI } from '../config';
import { EPILOGUE } from '../data/packs/ch8-finale';
import { checkCondition } from '../quests';

const CLOSING = 'Fescue is quiet. Beyond the Fence, someone has just started a second mower.';
const FADE_SECONDS = 0.8;

/** Shows the epilogue inside the root: each card fades in, with a Next button; the last card offers "Continue playing". */
export function showEpilogue(root: HTMLElement): void {
  const cards = [...EPILOGUE.filter((line) => checkCondition(line.when)).map((line) => line.text), CLOSING];

  const overlay = document.createElement('div');
  overlay.setAttribute('data-epilogue', '');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1000', 'background:#0d0a07', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'padding:16px', 'box-sizing:border-box', `font-family:${UI.font}`,
  ].join(';');
  root.appendChild(overlay);

  let index = 0;
  const show = (): void => {
    overlay.replaceChildren();
    const last = index === cards.length - 1;

    const text = document.createElement('p');
    text.textContent = cards[index];
    text.style.cssText = [
      `color:${UI.text}`, 'font-size:20px', 'line-height:1.5', 'max-width:560px', 'text-align:center', 'margin:0 0 24px',
      'opacity:0', `transition:opacity ${FADE_SECONDS}s`,
    ].join(';');

    const button = document.createElement('button');
    button.textContent = last ? 'Continue playing' : 'Next';
    button.style.cssText = [
      `background:${UI.panelBgDark}`, `border:2px solid ${UI.borderLight}`, `color:${UI.text}`, `font-family:${UI.font}`,
      'font-size:16px', 'padding:8px 18px', 'cursor:pointer',
    ].join(';');
    button.onclick = () => {
      if (last) {
        overlay.remove();
        return;
      }
      index += 1;
      show();
    };

    overlay.append(text, button);
    requestAnimationFrame(() => {
      text.style.opacity = '1';
    });
  };
  show();
}
