import { createMutter } from '@lawn/mutter';
import { volumeStore } from '../music';

/** Gnome Jesus's voice: the Blackjack "mutter" synth on the game's sound volume. */
export const jesusVoice = createMutter({ gain: () => volumeStore.effective('sounds') });
