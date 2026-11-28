// The Sound section of Options: a mute toggle (the touch and pad way to mute), the World and Ambience volume sliders and
// the Voices slider (voice/speech.ts), as Options registry rows (optionsRegistry.ts); options.ts draws them.

import { isGameMuted, setMuted } from '../audio';
import { getWorldVolume, setWorldVolume, getAmbienceVolume, setAmbienceVolume } from './bus';
import { getVoiceVolume, setVoiceVolume } from '../voice/speech';
import { registerAction } from '../ui/actions';
import { fillHint } from '../ui/glyphs';
import { onInputSourceChange } from '../ui/inputSource';
import { registerOption, registerOptionsSection } from '../optionsRegistry';

/** The one-line note under the sliders; {mute} is the mute key, a pad glyph or the touch words. */
const NOTE = 'World: other vehicles, gunfire, animals, footsteps. Ambience: wind, birds, city hum, water. Voices: gnomes talking, in scenes, on the phone and in the street. {mute} mutes everything.';

/** Registers the Sound section (mute, World / Ambience / Voices sliders and the note) with the Options registry, and
 *  the 'mute' action (the touch and pad way to mute, also the Gnomlet's Mute app). */
export function registerSoundOptions(): void {
  const toggleMute = (): void => setMuted(!isGameMuted());
  registerAction('mute', { run: toggleMute });
  registerOptionsSection('audio', 'Sound', (el) => {
    // The one-line note under the sliders; the key caps and pad glyphs in it follow the device in use.
    const note = document.createElement('div');
    note.className = 'gta-opt-note';
    const paint = (): void => { note.textContent = fillHint(NOTE); };
    paint();
    onInputSourceChange(paint);
    el.append(note);
    return { show: paint };
  });
  registerOption({
    section: 'audio', id: 'mute', label: 'Sound', kind: 'toggle', order: 10, watch: 'gta:muted', words: ['muted', 'on'],
    desc: () => `Everything, the radio too (${fillHint('{mute}')}).`,
    get: isGameMuted,
    set: (on) => setMuted(on),
  });
  registerOption({ section: 'audio', id: 'vol-world', label: 'World sounds', kind: 'slider', order: 20, get: getWorldVolume, set: setWorldVolume });
  registerOption({ section: 'audio', id: 'vol-ambience', label: 'Ambience', kind: 'slider', order: 30, get: getAmbienceVolume, set: setAmbienceVolume });
  registerOption({ section: 'audio', id: 'vol-voices', label: 'Voices', kind: 'slider', order: 40, get: getVoiceVolume, set: setVoiceVolume });
}
