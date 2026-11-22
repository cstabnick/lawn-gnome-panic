// Who gets profiled. Off unless one of these says otherwise:
//   ?profile            on for this page load, 80 ms threshold
//   ?profile=50         on, 50 ms threshold
//   ?profile=upload     on, and send hitch reports to the mp-server (also ?profile=50,upload)
//   ?profile=keep       remember the settings above on this device (every game, every load) until ?profile=off
//   ?hitches[=ms]       the old Gnomomia flag, same as ?profile[=ms]
// A kept setting lives in localStorage 'lawn.profile', so a player who reports stutter can be sent one link once.

export interface ProfileConfig {
  on: boolean;
  thresholdMs: number;
  upload: boolean;
}

export const DEFAULT_THRESHOLD_MS = 80;
export const STORAGE_KEY = 'lawn.profile';
const OFF: ProfileConfig = { on: false, thresholdMs: DEFAULT_THRESHOLD_MS, upload: false };

/** Parses a ?profile value ('', '50', 'upload', '50,upload,keep', 'off'). */
export function parseProfileValue(v: string): ProfileConfig & { keep: boolean; off: boolean } {
  const words = v.split(/[,+ ]/).map((w) => w.trim().toLowerCase()).filter(Boolean);
  const ms = words.map(Number).find((n) => Number.isFinite(n) && n > 0);
  const off = words.includes('off') || words.includes('0');
  return {
    on: !off,
    off,
    thresholdMs: ms ?? DEFAULT_THRESHOLD_MS,
    upload: words.includes('upload'),
    keep: words.includes('keep'),
  };
}

/** Reads the URL and the kept setting. Never throws; off when anything goes wrong. */
export function readProfileConfig(search: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): ProfileConfig {
  try {
    const params = new URLSearchParams(search);
    const raw = params.has('profile') ? params.get('profile') ?? '' : params.has('hitches') ? params.get('hitches') ?? '' : null;
    if (raw !== null) {
      const c = parseProfileValue(raw);
      try {
        if (c.off) storage?.removeItem(STORAGE_KEY);
        else if (c.keep) storage?.setItem(STORAGE_KEY, raw.replace(/keep/i, ''));
      } catch {
        /* blocked storage */
      }
      return { on: c.on, thresholdMs: c.thresholdMs, upload: c.upload };
    }
    let kept: string | null = null;
    try {
      kept = storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      kept = null;
    }
    if (kept === null) return OFF;
    const c = parseProfileValue(kept);
    return { on: c.on, thresholdMs: c.thresholdMs, upload: c.upload };
  } catch {
    return OFF;
  }
}
