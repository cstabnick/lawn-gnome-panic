# Gnome emotes

Goal: animated emotes as a new kind of cosmetic. Achievements across the arcade unlock them, the player equips up to 4 in the Gnome Creator, and Club Gnome is the first game that plays them (online, seen by everyone).

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | `npm test -w packages/emotes`, `npm test -w packages/achievements`, the six trigger games type-check | written by the planner: `packages/emotes`, `AchievementDef.emote`, 10 emote achievements, toast line, unlock calls in gnome-front, lawn-prix, gnome-golf, gnome-bowling, gnome-sweet-gnome, paragnormal |
| 2 Use emotes | `npm run build` + `npm test` for club-gnome and gnome-creator, smoke checks | 2A Club Gnome, 2B Gnome Creator (parallel; disjoint folders) |

## Design

- `packages/emotes` (`@lawn/emotes`): `EmoteDef` = id, label, icon, duration, loop, free, and `pose(t, out)`: a pure function writing shoulder/hip pivot angles and body-rig offsets. No keyframe assets: every emote is code. `createEmotePlayer(model)` runs after `model.update()` and blends the pose over the walk animation; walking cancels it. Works on any `@lawn/gnome` model, so any game can adopt emotes with ~5 lines.
- Unlocks reuse `@lawn/achievements`: `AchievementDef.emote = { emoteId, label, icon }` (alongside or instead of a gear `reward`). Two emotes are free (`wave`, `cheer`).
- Loadout: up to 4 ids in localStorage `gnome.emotes.v1` (`{ version: 1, slots }`). Not in the look code and not cloud-synced yet: other players never need my loadout, only the emote id I play (sent as a relay message).

| Emote | Achievement | Game |
|---|---|---|
| Battle Bop (the arm-pump/point victory dance) | Bop to Victory: win a Conquest match | gnome-front |
| Salute | Garden Guard: take down 25 gnomes | gnome-front |
| Floss | Chequered Floss: win a race | lawn-prix |
| The Worm | Last but Loud: finish last | lawn-prix |
| Golf Clap | Polite Applause: play all 9 holes | gnome-golf |
| Fist Pump | Picked Up: bowl a spare | gnome-bowling |
| Facepalm | Gutter Gnome: roll a gutter ball | gnome-bowling |
| Toadstool Jig | Dance Floor: 20 emotes in Club Gnome | club-gnome |
| Pinwheel Spin | Pinwheel: beat level 10 | gnome-sweet-gnome |
| Spooked Shiver | Still Shaking: escape 3 houses | paragnormal |

## Shared issue environment (pasted into both issues)

~~~~text
## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\goatfish` (a git worktree; do not cd elsewhere, do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root; run it again (from the root) only after you add a dependency to a package.json.
- Another worker is editing a different game at the same time. Touch only the files listed under Change.
- Repo rules that apply: mobile by default (every action has a touch button of at least 44 px, no hover-only UI; check a 390x844 viewport), UI modules append their own container to `#ui` and never restyle or hide `#ui`.

## The new package you use: `@lawn/emotes` (already written and tested; do not edit it)
Animated emotes for the shared `@lawn/gnome` model. Exports (from `packages/emotes/src/index.ts`):
    interface EmoteDef { id: string; label: string; icon: string; duration: number; loop: boolean; free?: boolean; pose(t: number, out: EmotePose): void }
    const EMOTES: readonly EmoteDef[];                 // 12 emotes; 'wave' and 'cheer' are free, 10 are achievement rewards
    function getEmote(id: string): EmoteDef | undefined;
    function isEmoteId(id: unknown): id is string;     // validate network/stored ids with this
    interface EmotePlayer {
      readonly current: string | null;
      play(id: string): boolean;      // restarts from the beginning, replaces any running emote
      stop(): void;                   // blends back to the walk/idle animation
      update(dt: number, moving?: boolean): void;  // call every frame RIGHT AFTER model.update(state, dt); moving=true stops it
      setModel(model: GnomeModel): void;           // call after rebuilding the gnome model (new look)
    }
    function createEmotePlayer(model: GnomeModel): EmotePlayer;
    const MAX_EQUIPPED = 4;
    const DEFAULT_LOADOUT: readonly string[];          // ['wave', 'cheer']
    function loadLoadout(): string[];                  // saved loadout (localStorage 'gnome.emotes.v1'), or DEFAULT_LOADOUT
    function saveLoadout(ids: readonly string[]): string[];   // sanitizes (known ids, no repeats, max 4), saves, returns what was saved
    function emoteAchievementId(emoteId: string): string | undefined;  // the achievement that unlocks it (undefined for free ones)
    function loadUnlockedEmotes(store?: AchievementStore): Promise<string[]>;  // ids the player has (free + unlocked), catalog order
    function loadMyEmotes(): Promise<EmoteDef[]>;      // the loadout minus anything not unlocked: what an emote menu shows
`@lawn/achievements` has `getAchievement(id)` returning an `AchievementDef` with `title`, `gameTitle`, `description` and a new optional `emote?: { emoteId; label; icon }`.
~~~~

## 2A Club Gnome

~~~~text
Epic: 2 (Use emotes in games)
Depends on: none

(Environment: paste the shared block above.)

## Goal
In Club Gnome, the 😀 emote row also shows the player's up-to-4 equipped animated emotes. Tapping one (or pressing keys 1-4 on desktop) plays the dance on my gnome, other players online see it too, walking cancels it, and playing them counts toward the new `club-dance-floor` achievement (20 plays).

## Read first
- games/club-gnome/src/avatars.ts: `Avatar` interface, `upsert` (rebuilds `a.model` on a new look), `update` (calls `a.model.update(a.state, dt)`; `p.moving` is the walking flag).
- games/club-gnome/src/net.ts: `TownMsg`, `parseTownMsg`, `NetEvents`, `TownNet`, the `relay` case in `onServerMsg`, and `emote(e)` at the bottom.
- games/club-gnome/src/hud.ts: `HudHandlers`, `Hud`, CSS classes `.th-emotes` / `.th-emote`, the `emoteRow` build (around line 196) and the `emoteBtn` click (around line 340).
- games/club-gnome/src/main.ts: `createHud(ui, {...})` handlers (around line 95), `createNet({...})` handlers incl. `onEmote` (around line 162), the `keydown` listener (around line 303), `frame()`.
- games/club-gnome/src/achievements.ts: the small exported hook functions.

## Change
- games/club-gnome/package.json: already has "@lawn/emotes" (the planner added it and ran npm install). Do not run npm install.
- games/club-gnome/src/avatars.ts:
  - `Avatar` gets `emote: EmotePlayer` (import `createEmotePlayer, type EmotePlayer` from '@lawn/emotes'). Create it with `createEmotePlayer(model)` when a new avatar is created in `upsert`; when `upsert` rebuilds the model of an existing avatar, call `a.emote.setModel(model)`.
  - Add to the `Avatars` interface and implement: `/** Plays an animated emote (@lawn/emotes id) on this avatar; unknown ids are ignored. */ playEmote(id: number, emoteId: string): void;` = `avatars.get(id)?.emote.play(emoteId)`.
  - In `update`, right after `a.model.update(a.state, dt);` add `a.emote.update(dt, p.moving);`.
- games/club-gnome/src/net.ts:
  - `TownMsg` gains `| { k: 'anim'; a: string }`. `parseTownMsg` accepts it only when `isEmoteId(d.a)` (import from '@lawn/emotes'), returning `{ k: 'anim', a: d.a }`.
  - `NetEvents` gains `/** An animated emote (@lawn/emotes id). */ onAnim(id: number, a: string): void;`. In the `relay` case dispatch `'anim'` to `ev.onAnim(m.from, msg.a)`; keep 'pos' and 'emo' working (make the 'emo' branch explicit).
  - `TownNet` gains `/** Relays an animated emote to everyone else and calls ev.onAnim(ME, a) at once. */ anim(a: string): void;` implemented exactly like `emote(e)` but sending `{ k: 'anim', a }` and calling `ev.onAnim(ME, a)`.
- games/club-gnome/src/net.test.ts: add tests: `{ k: 'anim', a: 'battle-bop' }` parses to itself; `{ k: 'anim', a: 'moonwalk' }`, `{ k: 'anim', a: 'toString' }`, `{ k: 'anim', a: 3 }`, `{ k: 'anim' }` give null.
- games/club-gnome/src/hud.ts:
  - `HudHandlers` gains `/** An animated emote button was pressed. */ onAnim(id: string): void;` and `/** The emote row was just opened (main.ts refreshes the animated emotes). */ onEmoteMenu(): void;`.
  - `Hud` gains `/** The animated emotes shown first in the emote row (the player's equipped ones, max 4). */ setAnimEmotes(list: readonly { id: string; label: string; icon: string }[]): void;`.
  - In the emote row put a container `animWrap` (class `th-anims`, CSS `.th-anims{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:100%}`) FIRST, then the existing emoji buttons (unchanged behaviour). Each animated button: classes `th-emote th-anim`, content = the icon plus a label span `th-anim-lbl` (10px, uppercase) under it, `aria-label` = label; CSS `.th-anim{min-width:64px;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px;line-height:1.1;color:#fff}`. Click: `emoteRow.classList.add('th-hide')` then `h.onAnim(id)`.
  - After the animated buttons always add one more `th-emote th-anim` button, icon '🎨', label 'Edit', which hides the row and calls `h.onCreator()` (emotes are equipped in the creator).
  - `setAnimEmotes` rebuilds only `animWrap`'s children (the list, then Edit). Empty list = just Edit.
  - The 😀 button: when its click makes the row visible, call `h.onEmoteMenu()`.
- games/club-gnome/src/achievements.ts: add `/** I played an animated emote. */ export function onAnimSent(): void` doing `swallow(t.increment('club-dance-floor'))` with the same null-tracker guard as the others.
- games/club-gnome/src/main.ts:
  - `import { loadMyEmotes, type EmoteDef } from '@lawn/emotes';`. Keep `let myAnims: EmoteDef[] = [];` and `function refreshAnims(): void { void loadMyEmotes().then((list) => { myAnims = list; hud.setAnimEmotes(list); }); }`. Call it once after `hud` and `net` exist, and from the new `onEmoteMenu` handler.
  - `function playAnim(id: string): void { net.anim(id); onAnimSent(); }`. Hud handler `onAnim(id) { playAnim(id); }`.
  - Net handler `onAnim(id, a)`: same map filter as `onEmote` (`const mine = id === net.myId || id === ME; if (!mine && peerMap.get(id) !== mapId) return;`), then `avatars.playEmote(mine ? ME : id, a)`.
  - In the existing `keydown` listener: when `!hud.typing` and `e.key` is '1'..'4' and `myAnims[n - 1]` exists, `playAnim(myAnims[n - 1].id)` and `e.preventDefault()`. Do not change other keys.
- games/club-gnome/README.md: one line near the controls: "Animated emotes: the 😀 row shows your up-to-4 equipped emotes (equip them in Gnome Creator; 🎨 Edit opens it); keys 1-4 on desktop. Walking stops a dance."

## Contract
- Network message `{ k: 'anim', a: <EmoteDef.id> }`, validated with `isEmoteId`.
- Achievement id `club-dance-floor` already exists in packages/achievements/src/catalog.ts (target 20).

## Done when
- `npx tsc --noEmit -p games/club-gnome` passes.
- `npm test -w games/club-gnome` passes, including the new net tests.
- With `npm run dev -w games/club-gnome` running in the background (read the real port from its output; stop it afterwards), `bash tools/smoke.sh http://localhost:<port>/ ui` reports no console errors.

## Out of scope
packages/* (do not edit @lawn/emotes or @lawn/achievements), every other game, games/gnome-creator (another worker owns it).
~~~~

## 2B Gnome Creator

~~~~text
Epic: 2 (Use emotes in games)
Depends on: none

(Environment: paste the shared block above.)

## Goal
The Gnome Creator gets an EMOTES section: every emote as a button (locked ones show 🔒 and how to unlock them), the player equips up to 4 (saved at once to the loadout), and tapping any emote plays it on the preview gnome.

## Read first
- games/gnome-creator/src/editor.ts: `EditorCallbacks`, `Editor`, the CSS string (classes `.ge-eq`, `.ge-eq-grid`, `.locked`, `.sel`), and the Equipment section (around line 251) to copy its look.
- games/gnome-creator/src/preview.ts: the render loop (`model.update(state, dt)`) and `setLook` (rebuilds `model`).
- games/gnome-creator/src/main.ts: start-up order; `achievementStore.getState()` then `editor.setUnlocked`.

## Change
- games/gnome-creator/package.json: already has "@lawn/emotes" (the planner added it and ran npm install). Do not run npm install.
- games/gnome-creator/src/preview.ts:
  - `const emote = createEmotePlayer(model);` after the first model. In the loop call `emote.update(dt);` right after `model.update(state, dt);`. In `setLook`, after building the new model, `emote.setModel(model);`.
  - Add to `Preview`: `/** Plays an emote on the turntable gnome (a looping one runs 2 cycles then stops). */ playEmote(id: string): void;`. It calls `emote.play(id)`. While `emote.current` is set, the turntable does not spin: instead ease `state.facing` toward 0 so the gnome faces the camera (wrap facing into [-PI, PI] first, then `state.facing += (0 - state.facing) * Math.min(1, dt * 6)`). For a looping emote (`getEmote(id)?.loop`), call `emote.stop()` after `2 * duration` seconds: keep a countdown variable decremented in the loop (no setTimeout).
- games/gnome-creator/src/editor.ts:
  - `export interface EmoteChoice { id: string; label: string; icon: string; unlocked: boolean; /** How to get it, e.g. "Bop to Victory (Gnome Front): Win a Conquest match." or "Everyone has this one." */ hint: string; }`
  - `EditorCallbacks` gains `/** The equipped emotes changed (capped at 4, in order). */ onEmotesChange(ids: string[]): void;` and `/** An emote button was tapped: play it on the preview. */ onEmotePreview(id: string): void;`.
  - `Editor` gains `/** Shows every emote and which are equipped. Calls no callbacks. */ setEmotes(choices: readonly EmoteChoice[], equipped: readonly string[]): void;`.
  - New section right after Equipment and before SAVE: label `EMOTES (EQUIP UP TO 4)`, then an 11px line `Tap to try one. Earn more from achievements across the arcade; play them in Club Gnome.`, then a grid reusing the `ge-eq-grid` / `ge-eq` styles (each button at least 44 px tall) with icon, label, a `ge-eq-lock` span (🔒 when locked, else empty) and a badge span `ge-emo-slot` showing the equipped slot number 1-4 (empty when not equipped; style it small and bold, e.g. `.ge-emo-slot{font-weight:700;font-size:11px;min-width:12px}`). `btn.title = hint`. Equipped buttons get class `sel`; locked ones get class `locked` but stay enabled (they can be previewed).
  - Click: always `cb.onEmotePreview(id)`. If locked: `setStatus('Locked: ' + hint)` and stop. If equipped: remove it. Else if fewer than 4 equipped: append it. Else `setStatus('You can equip 4 emotes. Tap one of yours to take it off.', true)` and stop. After a change re-render the section and call `cb.onEmotesChange([...equipped])`.
- games/gnome-creator/src/main.ts:
  - Import `EMOTES, emoteAchievementId, loadLoadout, saveLoadout, loadUnlockedEmotes` from '@lawn/emotes' and `getAchievement` from '@lawn/achievements'.
  - Editor callbacks: `onEmotesChange(ids) { saveLoadout(ids); editor.setStatus('Emotes saved.'); }` (saved at once; SAVE stays for look and name) and `onEmotePreview(id) { preview.playEmote(id); }`.
  - At start-up after `editor.setState(state)`: `const have = new Set(await loadUnlockedEmotes(achievementStore));` choices from `EMOTES`: unlocked = `have.has(e.id)`; hint = `e.free ? 'Everyone has this one.' :` the achievement `getAchievement(emoteAchievementId(e.id)!)` as `` `${a.title} (${a.gameTitle}): ${a.description}` ``. Equipped = `loadLoadout().filter((id) => have.has(id))`. Call `editor.setEmotes(choices, equipped)`.
- games/gnome-creator/README.md: one short paragraph about the Emotes section (max 4, saved at once to `gnome.emotes.v1`, unlocked by achievements, `@lawn/emotes`).

## Contract
- `preview.playEmote(id)` and `editor.setEmotes(choices, equipped)` as above. Loadout storage only through `saveLoadout` / `loadLoadout`.

## Done when
- `npx tsc --noEmit -p games/gnome-creator` passes.
- With `npm run dev -w games/gnome-creator` running in the background (read the real port from its output; stop it afterwards), `bash tools/smoke.sh http://localhost:<port>/ ui` reports no console errors.
- At 390x844 the emote buttons are reachable by scrolling the bottom sheet and are at least 44 px tall.

## Out of scope
packages/*, every other game, games/club-gnome (another worker owns it).
~~~~
