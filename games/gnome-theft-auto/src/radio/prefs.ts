// The player's radio text preference: on (default) shows the station, the DJs, adverts and bulletins as floating text;
// off hides all of it and leaves the music. Kept per browser. Changing it fires `gta:radio-text` so the text updates at once.

const KEY = 'gta.radioText';

export function getRadioText(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setRadioText(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* per-session only */
  }
  window.dispatchEvent(new Event('gta:radio-text'));
}
