// First-run tutorial: a small card of steps for a new character. Action steps advance by themselves when the
// player does the thing; every step also has a 44 px Next/Skip button so touch players are never stuck.
// Done (or skipped) is a story flag, so it is saved and a returning character never sees it again.
import { UI } from '../config';
import { bus } from '../events';
import { player } from '../player';
import { setFlag, state } from '../state';
import { EDGE, TOUCH } from './layout';

const DONE_FLAG = 'tutorial-done';

interface Step {
  title: string;
  text: string;
  /** Subscribes to whatever completes the step; returns the unsubscribe. Omit for a read-and-continue step. */
  watch?: (complete: () => void) => () => void;
}

const tap = TOUCH ? 'Tap' : 'Click';

const STEPS: Step[] = [
  {
    title: 'Walk',
    text: `${tap} the ground to walk there. Drag with a right or middle mouse button (or arrow keys) to turn the camera.`,
    watch(complete) {
      const sx = player.position.x;
      const sz = player.position.z;
      const t = setInterval(() => {
        if (Math.hypot(player.position.x - sx, player.position.z - sz) > 4) complete();
      }, 250);
      return () => clearInterval(t);
    },
  },
  {
    title: 'Talk',
    text: `${tap} Elder Fernwick, by the well, to talk and take your first quest.`,
    watch: (complete) => onBus('talk', complete),
  },
  {
    title: 'Cast',
    text: TOUCH ? 'Tap hotbar slot 1 (Flare) while an enemy is selected.' : 'Press 1 (Flare) while an enemy is selected, or click the enemy to attack.',
    watch: (complete) => onBus('cast', complete),
  },
  {
    title: 'Menus',
    text: TOUCH
      ? 'Long-press anything for its menu: Attack, Talk-to, Take, Examine. Use the bag button for your pack.'
      : 'Right-click anything for its menu: Attack, Talk-to, Take, Examine. I opens your pack, J your quests, C your stats.',
  },
  {
    title: 'Grow',
    text: 'Skills grow the more you use them. Ten skill-ups make a level. Good luck out there!',
  },
];

function onBus<K extends Parameters<typeof bus.on>[0]>(type: K, fn: () => void): () => void {
  const h = (): void => fn();
  bus.on(type, h);
  return () => bus.off(type, h);
}

function button(label: string, primary: boolean, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText =
    'min-height:44px;min-width:64px;padding:0 14px;border-radius:6px;cursor:pointer;font:inherit;' +
    `border:1px solid ${UI.gold};` +
    (primary ? 'background:#6b4e1c;color:#fff;' : `background:transparent;color:${UI.textDim};`);
  b.addEventListener('click', onClick);
  return b;
}

/** True when this character has not finished or skipped the tutorial. */
export function tutorialPending(): boolean {
  return state.flags[DONE_FLAG] === undefined;
}

/** Shows the tutorial card inside parent. Call after the title, for a new character. */
export function startTutorial(parent: HTMLElement): void {
  if (!tutorialPending()) return;
  const card = document.createElement('div');
  card.style.cssText =
    `position:absolute;left:50%;transform:translateX(-50%);top:max(64px,env(safe-area-inset-top));` +
    'width:min(360px,calc(100vw - 32px));box-sizing:border-box;padding:10px 14px;pointer-events:auto;z-index:400;' +
    `background:rgba(20,15,8,0.88);border:1px solid ${UI.gold};border-radius:8px;color:${UI.text};` +
    `font-family:${UI.font};font-size:14px;line-height:1.4;margin:0 ${EDGE.left};`;
  const head = document.createElement('div');
  head.style.cssText = `color:${UI.gold};font-weight:bold;margin-bottom:4px;`;
  const body = document.createElement('div');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;gap:8px;margin-top:8px;';
  card.append(head, body, row);
  parent.append(card);

  let i = 0;
  let unwatch: (() => void) | null = null;

  function finish(): void {
    unwatch?.();
    card.remove();
    setFlag(DONE_FLAG, '1');
  }

  function show(): void {
    unwatch?.();
    unwatch = null;
    const step = STEPS[i];
    head.textContent = `Tutorial ${i + 1}/${STEPS.length}: ${step.title}`;
    body.textContent = step.text;
    row.replaceChildren(
      button('Skip', false, finish),
      button(i === STEPS.length - 1 ? 'Done' : 'Next', true, next),
    );
    if (step.watch) unwatch = step.watch(() => setTimeout(next, 600));
  }

  function next(): void {
    if (!card.isConnected) return;
    if (++i >= STEPS.length) finish();
    else show();
  }

  show();
}
