// The one hook every progress save module calls right after it writes localStorage (economy, glaze, gun mods, garage,
// quests, stunts, lap bests, boats helmed, collectibles). cloudSave.ts registers the listener once its startup sync is
// done; until then (and in unit tests) it does nothing. Kept apart from cloudSave.ts so the save modules stay light.
let listener: (() => void) | null = null;

/** A progress key in localStorage just changed: mirror it to the cloud save (throttled there). Never throws. */
export function notifySaveChanged(): void {
  try {
    listener?.();
  } catch {
    // cloud sync must never break a save write
  }
}

/** cloudSave.ts only: who hears notifySaveChanged() (null = nobody). */
export function setSaveChangedListener(cb: (() => void) | null): void {
  listener = cb;
}
