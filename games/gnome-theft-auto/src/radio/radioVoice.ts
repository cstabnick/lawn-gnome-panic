// Turfton FM hosts read their talk, caller, traffic and bulletin lines aloud in their own gnome voices (@lawn/mutter via
// voice/speech.ts, over the air). One option turns it off: 'gta.radioVoice' ('off' = off), event 'gta:radio-voice'.
import { registerOption } from '../optionsRegistry';
import { speech } from '../voice/speech';
import { voiceFor } from '../voice/voices';

const KEY = 'gta.radioVoice';
/** A phone does not synthesize more than this many characters of one line. */
const MAX_CHARS = 160;

let busy: (() => boolean) | null = null;

export function getRadioVoice(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setRadioVoice(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* per-session only */
  }
  if (!on) stopRadio();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:radio-voice'));
}

/** Skip radio speech while this returns true (a cutscene or comms line is talking: they share one engine). */
export function setRadioVoiceBusy(fn: (() => boolean) | null): void {
  busy = fn;
}

/** The first 160 characters of a line, cut at a word boundary when it is longer. */
export function radioCut(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_CHARS) return t;
  const head = t.slice(0, MAX_CHARS);
  // If the 161st character is a space the head already ends on a whole word; otherwise back up to the last space.
  if (/\s/.test(t[MAX_CHARS])) return head.trimEnd();
  const space = head.lastIndexOf(' ');
  return (space > 0 ? head.slice(0, space) : head).trimEnd();
}

export function speakRadio(
  line: { who: string; text: string },
  hostKey: string,
  opts: { gain?: number; pan?: number } = {},
): number {
  if (!getRadioVoice() || busy?.()) return 0;
  const text = radioCut(line.text);
  if (!text) return 0;
  const m = speech();
  m.stop();
  return m.say(text, voiceFor(hostKey), { radio: true, phone: true, maxLetters: 3, gain: opts.gain, pan: opts.pan });
}

export function stopRadio(): void {
  speech().stop();
}

registerOption({
  section: 'audio',
  id: 'radio-voice',
  label: 'Radio voice',
  kind: 'toggle',
  get: getRadioVoice,
  set: setRadioVoice,
  desc: 'Hosts read their lines aloud in their own voices.',
  order: 70,
  watch: 'gta:radio-voice',
});
