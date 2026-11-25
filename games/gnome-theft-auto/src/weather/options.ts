// Weather option (E06): 'Weather: on / off' in the Options panel, saved in localStorage, and ?weather=. A URL value is
// not saved. The Options row copies the Water waves pattern (src/waveOptions.ts).
import { forceWeather, isWeatherEnabled, setWeatherEnabled } from './index';
import { WEATHER_KINDS, type WeatherKind } from './types';

export interface WeatherParam {
  /** ?weather=0|off -> false, 1|on -> true; absent for a kind. */
  enabled?: boolean;
  /** ?weather=clear|cloud|mist|rain|snow (optionally `rain:0.5`) forces that kind. */
  force?: { kind: WeatherKind; intensity: number };
}

const KEY = 'gta-weather';

/** ?weather=0|off|false -> off, 1|on|true -> on, a kind (optionally kind:0..1) forces it, else null. Case-insensitive. */
export function parseWeatherParam(search: string): WeatherParam | null {
  const raw = new URLSearchParams(search).get('weather');
  if (raw === null) return null;
  const s = raw.trim().toLowerCase();
  if (s === '0' || s === 'off' || s === 'false') return { enabled: false };
  if (s === '1' || s === 'on' || s === 'true') return { enabled: true };
  const m = /^([a-z]+)(?::(.+))?$/.exec(s);
  if (!m) return null;
  const kind = m[1] as WeatherKind;
  if (!WEATHER_KINDS.includes(kind)) return null;
  let intensity = 1;
  if (m[2] !== undefined) {
    const n = Number(m[2]);
    if (!Number.isFinite(n)) return null;
    intensity = Math.max(0, Math.min(1, n));
  }
  return { enabled: true, force: { kind, intensity } };
}

export function getSavedWeatherEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveWeatherEnabled(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* per-session only */
  }
}

/** Read the saved choice and ?weather= and apply them (app.ts calls this once at start). */
export function initWeatherOptions(search: string): void {
  const p = parseWeatherParam(search);
  setWeatherEnabled(p?.enabled ?? getSavedWeatherEnabled());
  if (p?.force) forceWeather(p.force.kind, p.force.intensity, true);
}

/** Add the 'Weather' row to the Options panel (options.ts). */
export function mountWeatherOptions(panel: HTMLElement): void {
  const head = document.createElement('div');
  head.className = 'gta-opt-note';
  head.style.fontWeight = '700';
  head.textContent = 'Weather';
  const list = document.createElement('div');
  list.className = 'gta-opt-list';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gta-opt-mode';
  const paint = (): void => {
    btn.innerHTML = `Weather: ${isWeatherEnabled() ? 'on' : 'off'}<small>Rain, snow, mist and clouds. Off clears the sky and saves a little battery.</small>`;
  };
  paint();
  btn.addEventListener('click', () => {
    const next = !isWeatherEnabled();
    setWeatherEnabled(next);
    saveWeatherEnabled(next);
    paint();
  });
  list.appendChild(btn);
  panel.append(head, list);
}
