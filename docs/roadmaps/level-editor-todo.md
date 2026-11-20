# Level editor: TODO

Open items for tools/level-editor, found while building world object and spawn placement (PR #247). Not started. Each item says
why it matters and the suggested approach, so anyone can pick one up.

## 1. Check the new editor features in a browser
**Why:** object rings, the spawn list, drag and rotate, and the details window are covered only by unit tests and type checks.
The headless smoke check confirms the page loads, nothing more.
**Approach:** add e2e steps to `tools/level-editor/e2e/run.mjs` (real browser, real clicks, against a throwaway copy of the
level files): select a migrated object, nudge it, save, and check the marker changed; select a spawn, change its count, and check
`data.count`; open the details window and check the model name. Until then, a manual checklist in the PR.

## 2. Update the editor's README and AGENT_INDEX.md
**Why:** `tools/level-editor/README.md` does not mention object markers, spawn markers, the `objects` and `spawns` collections,
or the details window. The project rules require AGENT_INDEX.md to change when a tool or doc changes.
**Approach:** add a "Markers" section (what a marker is, the `kind` values, the `v` field and what each `data` key means),
the two new collections, and the details window. Add the same to AGENT_INDEX.md.

## 3. Show load errors in the editor instead of a blank page
**Why:** when the content fails to load, the editor shows an empty page. It happened three times during this work, always with a
stale server, and the only clue was in the terminal.
**Approach:** catch the content load failure in `main.ts` (the `LOAD_ERRORS` list from content.ts is already collected) and show
a fixed banner with the first ten messages and a note to restart the editor server. Keep the editor usable when the errors are
only warnings.

## 4. Sort markers by id on save
**Why:** markers are appended in migration order. Every save of a zone can reorder them, and two people editing one zone file
get noisy merge conflicts.
**Approach:** in `levelDocs.ts` (`worldZoneToDoc`), sort `markers` by `kind`, then `id`. Add a test that a shuffled input saves
in the same order every time. This keeps diffs to the changed markers only.

## 5. Document the edit boundary in the UI
**Why:** the agent sets pack values (verb, examine text, flags, conditions, and the count and spread defaults), and the human
tunes placement. The details window shows pack values but cannot change them. People will try to edit a pack value and find
nothing happens.
**Approach:** a one-line note at the top of the details window ("Pack values are set in code. Placement and spawn overrides
are editable in the select panel.") and a short tooltip on each read-only row that names the file it comes from.

## 6. Check draft recovery against the current content
**Why:** unsaved edits are kept in browser storage and offered back after a reload. If the content has changed since, a restored
draft can point at objects or spawns that no longer exist.
**Approach:** on restore, check each restored marker's id against the current `OBJECTS` and `SPAWNS`. Drop markers that no
longer match, and say so in the status line. Never restore silently.

## 7. Refuse to save a marker that has no pack entry
**Why:** a marker with no matching pack object or spawn makes the whole content load fail. The content check catches it at
startup, but the editor should catch it at save, when the author is still looking at it.
**Approach:** in the editor's `beforeSave` for the gnomomia adapter, compare each `object` and `spawn` marker's id with the
current pack tables. Block the save and list the unknown ids, unless the author confirms (for a marker about to be added to a
pack in another file).

## 8. Stable ids: what to use and when (answer, not a task)
**Question:** should markers get a UUID-style id, so they are unique without a naming scheme?

**What engines usually do (from memory; not checked online):**
- **Unity** gives each asset a GUID stored in a `.meta` file next to it. References use the GUID, so renaming or moving the
  asset does not break them.
- **Unreal** gives actors and assets a GUID (`FGuid`) for references, and a readable name for people.
- **Godot** gives resources a `uid://` id for references, separate from the file path.
- **LDtk** gives every entity an `iid`, a UUID that stays the same when the entity moves or is renamed. Its readable identifier
  is a separate field.
- **Tiled** uses per-map integer ids, unique within one map only.

The common pattern: a machine id that never changes (UUID or GUID) for references, and a readable name for people.

**What fits this codebase:** the readable id already does the job for everything tied to a pack. A pack object or spawn is
referenced by its id from quests, saves (`state.objects`) and runtime sync keys. Those ids are the identity, so they must stay
readable and unchanged. A UUID would be a second identity that the packs would need to reference, which adds work for no gain.

So: keep readable ids for anything a pack defines. Add a UUID `iid` only to markers that have no pack identity, such as future
decorative props or warps that are placed alone. Add it when that first case appears, not before. Do not rename existing ids.

## 9. Index-based spawn sync: move to ids before reordering is ever needed
**Why:** multiplayer sync keys and enemy random seeds are derived from each spawn's position in `SPAWNS`
(`s:${index}:${i}` and `99 + index` in entities.ts). That is safe today because nobody reorders the lists. A future edit that
inserts or reorders a spawn would silently change the keys of every spawn after it.
**Approach:** when multiplayer spawn sync is next touched, key by spawn id (`s:${id}:${i}`) and seed from a hash of the id.
Keep the index only as a fallback for old saves, and say so in a comment. Until then, add a lint rule or test that fails when
a spawn is moved within its pack file.

## Not in this list
- Warps and interiors: see `docs/roadmaps/warps-and-interiors.md`.
- Splitting PR #247 for review: the user is merging it as one PR.
