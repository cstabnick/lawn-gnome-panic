Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full, especially the UI rule.

## Goal
Sound effects and a quiet lute-like ambience made with WebAudio, saving and loading to localStorage, and a title screen.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `SAVE_KEY`, `INVENTORY_SIZE`, `UI`, `PLAYER_ID`.
- `games/gnomes-of-gnomomia/src/state.ts`: `state`, `newGameState`, `GameState`.
- `games/gnomes-of-gnomomia/src/audio.ts`, `src/save.ts`, `src/ui/title.ts`: the stubs you replace.
- `games/sample-dodge/src/audio.ts`: an example of WebAudio oscillator sounds in this repo.

## Change
### `games/gnomes-of-gnomomia/src/audio.ts`
- `initAudio()`: create the `AudioContext` lazily on the first `pointerdown` or `keydown` (window listeners), with a master `GainNode` (0.5). Mute toggles with the `m` key (ignored in inputs) and persists in localStorage key `'gnomomia.muted'` (`'1'`/`'0'`; wrap localStorage in try/catch).
- A helper `tone(freq, endFreq, seconds, type, volume)` (oscillator with an exponential frequency ramp and a gain envelope: quick attack, exponential decay) and `noise(seconds, filterFreq, volume)` (a short white-noise buffer through a `BiquadFilterNode` lowpass).
- Bus sounds: `hit` with attacker `PLAYER_ID` → thwack (`noise(0.08, 1800, 0.5)` + `tone(160, 80, 0.1, 'square', 0.2)`); `hit` on the player → lower thud (`tone(110, 50, 0.15, 'square', 0.3)`); `hit` with `spell` → whoosh (`noise(0.3, 900, 0.4)`); `miss` → `noise(0.12, 600, 0.2)`; `skill-up` → chime (660 then 990 Hz sine, 0.15 s each); `level-up` → triangle arpeggio 523, 659, 784, 1046 Hz, 0.12 s apart; `item-added` → `tone(880, 1200, 0.07, 'sine', 0.15)`; `enemy-killed` → `tone(300, 90, 0.35, 'sawtooth', 0.15)`; `player-died` → `tone(400, 60, 1.2, 'triangle', 0.3)`; `heal` → `tone(400, 900, 0.4, 'sine', 0.2)`; `quest-updated` → a two-note fanfare (784 then 1046 Hz triangle).
- Ambience: once audio has started, every 0.7 s with chance 0.45 pluck a random note of A minor pentatonic (220, 261.6, 293.7, 329.6, 392, 440 Hz) as a `'triangle'` tone with 1.2 s decay at volume 0.04 (silent while muted).

### `games/gnomes-of-gnomomia/src/save.ts`
Imports: `state, newGameState, type GameState` from `'./state'`; `player, teleportPlayer` from `'./player'`; `SAVE_KEY, INVENTORY_SIZE` from `'./config'`.
- `saveGame()`: skip if `player.dead`. `localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state, x: player.position.x, z: player.position.z }))` in try/catch.
- `loadGame()`: read and parse in try/catch; valid only if `v === 1`, `state` is an object, `state.inventory` is an array of length `INVENTORY_SIZE`, and x and z are finite numbers. Then `const fresh = newGameState()`; `Object.assign(state, fresh, data.state)`; also merge nested records so new fields survive: `state.attributes = { ...fresh.attributes, ...data.state.attributes }`, same for `skills` and `equipment`. `teleportPlayer(x, z)`. Return true. Anything invalid → false.
- `deleteSave()`: `localStorage.removeItem(SAVE_KEY)` in try/catch.

### `games/gnomes-of-gnomomia/src/ui/title.ts`
- `showTitle(root, hasSave)`: append a full-screen overlay (`position: absolute; inset: 0; pointer-events: auto; z-index: 500`) with a soft dark vignette over the running 3D scene (`radial-gradient(ellipse at center, rgba(20,15,8,0.25), rgba(20,15,8,0.8))`). Centred: the title `Gnomes of Gnomomia` (Georgia serif, 64 px, 40 px on narrow screens, `UI.gold`, `text-shadow: 3px 3px 0 #3a2a10, 0 0 24px rgba(0,0,0,0.6)`), a subtitle `An old-school gnome role-playing game` (`UI.textDim`, italic), then buttons: `Continue` (only if `hasSave`) and `New Game`, styled as old-school stone buttons (`UI.panelBg`, `2px solid UI.borderLight`, `UI.text`, 18 px, hover brighter). Below, a small controls help block in `UI.textDim`: `Click to walk · Click a foe to fight · Right-click for options · Arrows / middle-drag turn the camera · Wheel zooms · 1 Flare · 2 Mend · I E C J B panels · M mute`.
- Resolve the promise with `'continue'` or `'new'` when a button is clicked (Enter = the first button), fading the overlay out over 0.4 s and then removing it.

## Contract
All exports keep their stub signatures.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/audio.ts`, `src/save.ts` or `src/ui/title.ts`.

## Out of scope
`src/main.ts`, `src/state.ts` and all other files.
