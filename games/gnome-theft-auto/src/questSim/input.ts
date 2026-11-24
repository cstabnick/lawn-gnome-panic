// Quest sim, browser layer: the one always-loaded piece. app.ts passes the frame's input through questSimInput(); while
// the bot drives (browser.ts sets an override) its controls replace the player's. Nothing else loads unless ?questsim
// or the trainer's Quest sim tab asks for it.
import type { InputState } from '../types';

let override: Partial<InputState> | null = null;

/** browser.ts: replace these input fields every frame (null gives the controls back to the player). */
export function setQuestSimInput(o: Partial<InputState> | null): void {
  override = o;
}

/** app.ts: the frame's input, with the bot's fields laid over it while it drives. */
export function questSimInput<T extends InputState>(inp: T): T {
  return override ? { ...inp, ...override, pad: false } : inp;
}
