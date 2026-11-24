// Water waves option (docs/roadmaps/gta-water-waves.md): 'Water waves: off / low / high' in the Options panel, saved in
// localStorage, overridden by ?waves=0|off|low|high|1 (a URL value is not saved). Feeds waves.ts setWaveDetail.
// Waves are a local view choice: online, the host's sea is the same for everyone; 'off' only stills your own water.
import { setSeaState, setWaveDetail, waveDetail, type WaveDetail } from './waves';

const KEY = 'gta-waves';
const ORDER: readonly WaveDetail[] = ['off', 'low', 'high'];

/** ?waves=0|off -> 'off', low -> 'low', 1|on|high -> 'high', else null. */
export function parseWaveParam(search: string): WaveDetail | null {
  const v = new URLSearchParams(search).get('waves');
  if (v === null) return null;
  const s = v.toLowerCase();
  if (s === '0' || s === 'off') return 'off';
  if (s === 'low') return 'low';
  if (s === '1' || s === 'on' || s === 'high') return 'high';
  return null;
}

export function getSavedWaveDetail(): WaveDetail {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'off' || v === 'low' || v === 'high' ? v : 'high';
  } catch {
    return 'high';
  }
}

export function saveWaveDetail(d: WaveDetail): void {
  try {
    localStorage.setItem(KEY, d);
  } catch {
    /* per-session only */
  }
}

/** Read the saved choice and ?waves= and apply it (app.ts calls this once at start). */
export function initWaveDetail(search: string): void {
  setWaveDetail(parseWaveParam(search) ?? getSavedWaveDetail());
  // Dev / demo: ?sea=calm|breezy|blustery forces the sea state from the start (online the host's choice still wins).
  const sea = new URLSearchParams(search).get('sea');
  if (sea === 'calm' || sea === 'breezy' || sea === 'blustery') setSeaState(sea, -1e9);
}

/** Add the 'Water waves' button to the Options panel (options.ts). */
export function mountWaveOptions(panel: HTMLElement): void {
  const head = document.createElement('div');
  head.className = 'gta-opt-note';
  head.style.fontWeight = '700';
  head.textContent = 'Water';
  const list = document.createElement('div');
  list.className = 'gta-opt-list';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gta-opt-mode';
  const paint = (): void => {
    btn.innerHTML = `Water waves: ${waveDetail()}<small>How much the loch and the Puddle Sea roll. Low is gentler and cheaper; off is flat water.</small>`;
  };
  paint();
  btn.addEventListener('click', () => {
    const next = ORDER[(ORDER.indexOf(waveDetail()) + 1) % ORDER.length];
    setWaveDetail(next);
    saveWaveDetail(next);
    paint();
  });
  list.appendChild(btn);
  panel.append(head, list);
}

export type { WaveDetail };
