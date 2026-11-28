// Water waves option (docs/roadmaps/gta-water-waves.md): 'Water waves: off / low / high' in the Options panel, saved in
// localStorage, overridden by ?waves=0|off|low|high|1 (a URL value is not saved). Feeds waves.ts setWaveDetail.
// Waves are a local view choice: online, the host's sea is the same for everyone; 'off' only stills your own water.
import { registerOption } from './optionsRegistry';
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

/** Registers the 'Water waves' row with the Options registry (options.ts renders it). */
export function registerWaveOptions(): void {
  registerOption({
    section: 'world', id: 'waves', label: 'Water waves', kind: 'cycle', order: 60,
    desc: 'How much the loch and the Puddle Sea roll. Low is gentler and cheaper; off is flat water.',
    values: ORDER.map((id) => ({ id, label: id })),
    get: () => waveDetail(),
    set: (id) => {
      const d = id as WaveDetail;
      setWaveDetail(d);
      saveWaveDetail(d);
    },
  });
}

export type { WaveDetail };
