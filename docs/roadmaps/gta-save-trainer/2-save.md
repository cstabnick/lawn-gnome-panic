Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
The trainer's **Save** tab (`src/trainer/sections/save.ts`, id `save`, order 10): export, copy, import (file and paste), reset, cloud-sync status, the trainer mark, restore of the pre-trainer backup, and a raw editor for each save key. This replaces the old Options > Experimental buttons, with the same file name and format (`gta-save.json`, `gta-save/v1`), so old exports still import.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/save.ts` (stub: keep `export function registerSaveSection(): void`)
- `games/gnome-theft-auto/src/saveIO.ts`: `GTA_SAVE_KEYS`, `exportSaveBundle()`, `importSaveBundle(text)` -> `{ok:true, keys}` | `{ok:false, error}`, `resetSaveBundle()`.
- `games/gnome-theft-auto/src/cloudSave.ts`: `cloudStatus()`, `onCloudStatus(cb)` (returns an unsubscribe function), `cloudStatusText(s)`, `cloudPaused()`, `setCloudPaused(paused)` (takes effect on the next load).
- `games/gnome-theft-auto/src/saveHook.ts`: `notifySaveChanged()`.
- `games/gnome-theft-auto/src/trainer/mark.ts`: `readTrainerMark()`, `markTrainerModified(what)`, `readTrainerBackup()`, `clearTrainerBackup()`, and the header comment (the cloud policy).
- `git show HEAD:games/gnome-theft-auto/src/options.ts` lines ~175-290: the old Experimental block (download via Blob + `<a download>`, clipboard, hidden file input, paste box, two-tap reset). Reuse its behaviour.

## Change
- `games/gnome-theft-auto/src/trainer/sections/save.ts` only. `registerSaveSection()` calls `registerTrainerSection({ id: 'save', label: 'Save', order: 10, build })`. `build(el)` appends, in order (one shared `status()` line near the top):
  1. `heading('Cloud save')` + a note with `cloudStatusText(cloudStatus())`, kept live with `onCloudStatus`: in the callback, if the note is no longer `isConnected`, call the unsubscribe and return. Then a button toggling sync on this device (`cloudPaused()` / `setCloudPaused(on)` from `cloudSave.ts`): label "Cloud sync: on" or "Cloud sync: paused", class `on` when paused, sub "Pause it to experiment without touching your cloud save (quest rewinds only stick while paused). Reloads." Click -> `setCloudPaused(!cloudPaused())`, status, `reloadSoon()`.
  2. `heading('Trainer mark')`: if `readTrainerMark()` is null: note "Untouched by the trainer." Else: "Changed by the trainer N times since <first, as a local date>." plus a note with the last 5 `what` entries joined by ", ". Always add a note with the policy: "Trainer changes to progress save and sync like normal play. Before the first one, the trainer keeps a backup on this device. Achievements are never changed by the trainer."
  3. If `readTrainerBackup()` is not null: `confirmButton('Restore pre-trainer backup', ...)`: `importSaveBundle(backup)`; ok -> `clearTrainerBackup()`, status "Restored. Reloading...", `reloadSoon()`; error -> status error. Plus `button('Download backup', ...)` saving it as `gta-save-backup.json`.
  4. `heading('Export / import')` and a `grid` of: "Export save" (sub "Downloads gta-save.json"): `JSON.stringify(exportSaveBundle(), null, 2)` as a Blob download named `gta-save.json`, `URL.revokeObjectURL` after; "Copy to clipboard": `navigator.clipboard?.writeText(json)` -> status "Copied." or error "Clipboard blocked: use Export."; "Import save (file)": a hidden `<input type=file accept="application/json,.json">` (appended to `el`) -> `importSaveBundle(await file.text())` -> ok: status `Imported ${keys.length} key(s). Reloading...` + `reloadSoon()`, else status error `Import failed: ${error}`; "Paste save JSON": toggles a box with `input({ rows: 5, placeholder: '{"format":"gta-save/v1","data":{...}}' })` and a button "Apply pasted JSON" doing the same import. Importing is NOT a trainer change: do not call `markTrainerModified`.
  5. `confirmButton('Reset save', ...)` sub "Wipe all Turfton progress (and the cloud copy) and reload": `resetSaveBundle()`, `clearTrainerBackup()`, status, `reloadSoon()`.
  6. `heading('Raw save keys')` + note "Edit one save key as JSON, then reload." A `select` of `GTA_SAVE_KEYS`, a textarea (`input({ rows: 8 })`) filled with the pretty JSON of `localStorage.getItem(key)` (empty when null; refill on select change), and a `row` of: "Apply & reload": `JSON.parse` the text (error -> status error "Not valid JSON."), `localStorage.setItem(key, JSON.stringify(parsed))`, `markTrainerModified('raw ' + key)`, `notifySaveChanged()`, `reloadSoon()`; `confirmButton('Delete key & reload')`: `removeItem`, mark, notify, reload. Wrap every localStorage use in try/catch.

## Contract
`export function registerSaveSection(): void` (called by `sections/index.ts`). Section id `'save'`, order 10.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/trainer/sections/save.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/saveIO.test.ts src/cloudSave.test.ts src/trainer` passes.

## Out of scope
`options.ts` (already points to the trainer), `saveIO.ts`, `cloudSave.ts`, `mark.ts`, every other file.
