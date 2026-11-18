// STUB: the DOM HUD (need meters, action buttons, trick menu, toasts, naming). Filled in by its own issue; keep these signatures.
import type { TrickId } from './config';
import type { Mood, PetState } from './sim';

export type Mode = 'pet' | 'ball' | 'bath';

export interface UiHandlers {
  onFeed(): void;
  onWater(): void;
  onMode(mode: Mode): void;
  onTrick(trick: TrickId): void;
  onRename(name: string): void;
  onMute(muted: boolean): void;
}

export interface UiView {
  mode: Mode;
  mood: Mood;
  /** The dog is busy (eating, fetching, doing a trick): trick buttons are disabled. */
  busy: boolean;
  /** One short line telling the player what to do now, e.g. "Swipe up to throw!". */
  hint: string;
}

export interface Ui {
  /** Called every frame; must be cheap (only touch the DOM when a shown value changed). */
  update(s: PetState, view: UiView): void;
  /** A short message that fades after ~2 s, e.g. "Good dog!". */
  toast(text: string): void;
  /** Show the name-your-dog dialog; calls handlers.onRename with the trimmed name (1-16 chars). */
  askName(current: string): void;
}

export function createUi(parent: HTMLElement, h: UiHandlers): Ui {
  const root = document.createElement('div');
  root.id = 'pup-hud';
  parent.appendChild(root);
  void h;
  return { update: () => {}, toast: () => {}, askName: () => {} };
}
