Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
Gnomes mutter their lines aloud like Animal Crossing villagers, but deep: a babble of short pitched syllables, one per letter, shaped by vowel formants. Plus five tiny sound effects. All WebAudio, no files.

## Read first
- `games/gnome-blackjack/src/mutter.ts`: the stub you replace.
- `games/gnome-blackjack/src/volume.ts`: `volume.effective('sounds')` returns the 0..1 effects gain (0 when muted).
- `games/gnome-blackjack/src/config.ts`: `VOICE_MIN_HZ` (70) and `VOICE_MAX_HZ` (140).

## Change
- `src/mutter.ts`:
  - One lazily created `AudioContext` (`new AudioContext()`), made in `unlockAudio()` (call `ctx.resume()` there too; app.ts calls it on the first pointerdown/keydown). Before unlock, or if AudioContext is missing, or `location.hash` contains `mute`, every function does nothing. Never touch `window`/`document` at import time beyond reading nothing (create everything lazily).
  - A master `GainNode` → a `BiquadFilterNode` lowpass at 2600 Hz (keeps it deep and muffled) → `ctx.destination`. Read `volume.effective('sounds')` on every call and set the master gain from it.
  - `mutter(text, voiceHz)`: walk the text (first 48 letters at most). Schedule from `ctx.currentTime + 0.02`:
    - letter: one blip, then advance 0.068 s; space: advance 0.04 s; `,` 0.12 s; `. ! ?` 0.18 s; other characters skip.
    - blip pitch: `voiceHz * (1 + (((code * 7) % 12) - 6) / 45) * (0.96 + Math.random() * 0.08)` where code = the lower-case letter's char code (so the same word sounds the same each time). Over the last 3 blips before `?` glide up 25 %; before `!` raise them 15 %.
    - blip sound: a `sawtooth` oscillator at the pitch plus a `square` oscillator one octave down (pitch / 2, gain 0.5 of the saw) → two parallel `bandpass` BiquadFilters (Q 5) at the formants of the letter's vowel, mixed → an envelope gain (0 → 0.22 in 8 ms, hold, → 0 by 55 ms) → master. Vowel formants (F1/F2 Hz): a 750/1150, e 420/1900, i 300/2200, o 460/800, u 330/700, y like i. A consonant uses the formants of the next vowel in the word (or 500/1400), and is shorter and quieter (40 ms, peak 0.14). Stop the oscillators after the envelope ends (`osc.stop(t + 0.07)`).
    - At most 2 mutters at once: starting a third stops the oldest's remaining nodes (keep each mutter's oscillators in a list).
  - `sfx(kind)`: 'card' = 40 ms of white noise (an AudioBuffer of random samples) through a bandpass 3200 Hz, quick decay; 'chip' = two 25 ms sine clicks at 2100 and 2700 Hz, 30 ms apart; 'tick' = a 30 ms 1200 Hz sine; 'win' = three rising triangle notes (523, 659, 784 Hz, 90 ms each); 'lose' = two falling triangle notes (330, 247 Hz, 160 ms each). Peak gain about 0.25.
- `games/gnome-blackjack/mutter-test.html` (a dev-only page, not linked from the game): a text field, a pitch slider (70..140), a "Mutter" button that calls `unlockAudio()` then `mutter(text, pitch)`, and one button per sfx. It loads `<script type="module" src="/src/mutter-test.ts">`; write `src/mutter-test.ts` for it. Vite serves it at `/mutter-test.html` in dev.

## Contract
```ts
export type Sfx = 'card' | 'chip' | 'tick' | 'win' | 'lose';
export function unlockAudio(): void;
export function mutter(text: string, voiceHz: number): void;
export function sfx(kind: Sfx): void;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes for your files.
- `grep -n "window\|document" games/gnome-blackjack/src/mutter.ts` shows uses only inside functions.

## Out of scope
table.ts, cards.ts, banter.ts, scene.ts, hud.ts, net.ts, app.ts, config.ts, characters.ts, index.html.
