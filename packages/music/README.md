# @lawn/music

Synthesized game music on Tone.js, shared by `games/sample-3d` (Lawn Gnome Panic) and `games/faster-than-lawn`. Everything is generated in code, so there are no assets to credit.

- **Sector themes** (`buildSectorTrack`): five chiptune themes in the manner of Ben Prunty's FTL score. Each has an explore and a battle arrangement that play in sync and crossfade when `opts.battle()` flips. Songs are arranged from per-theme pattern banks under fixed rules, so the notes are never random.
- **Jungle** (`buildRunTrack`, `buildMenuTheme`): a generated drum & bass track per seed, and a composed menu theme.
- **Golf ambient** (`buildGolfAmbient`): slow, relaxing generated golf music (soft pads, electric piano, a lazy bass, a flute melody, light brushed percussion) that loops forever. `games/gnome-golf` uses it.
- **Garden lullaby** (`buildGardenLullaby`): very light, peaceful, a touch more than ambient (a soft music-box arpeggio pulse, quiet pad, round bass, a small pentatonic bell tune, barely-there shaker; 76-84 bpm, major key, 16-bar loop). `games/gnome-sweet-gnome` uses it.
- **Tricky big beat** (`buildTrickyTrack`): an original big-beat / breakbeat track in the spirit of early-2000s snowboard games (hard funky break, sliding acid bass, brass stabs, vinyl scratches, a chopped formant "vocal" hook). It reacts to the game: `opts.air()` muffles the mix, `hooks.land()` slams it back with a crash, `hooks.scratch()` cuts a scratch in, `opts.boost()` opens the filter with a riser, `opts.hype()` adds layers. `games/aether-board` uses it.
- **Trance** (`buildTranceTrack`): classic uplifting trance (136-140 BPM, supersaw leads/stabs/pads, major arpeggios, sidechain pump, stereo chorus, dotted-8th ping-pong delay, build/breakdown/drop structure). `games/gnome-creator` uses it.

Use it from a game:

```ts
import { playSong, setMuteKey, buildSectorTrack } from '@lawn/music';

setMuteKey('my-game-music-muted');
let battle = false;
playSong((T, keep, out) => buildSectorTrack(T, keep, out, seed, { battle: () => battle }));
```

Add `"@lawn/music": "*"` to the game's dependencies and run `npm install` from the repo root. Type-check with `npm run typecheck -w packages/music`.

## Mixing & Harmony Guidelines

- **Keep low end (`< ~220 Hz`) out of spatial & modulation FX**: Always high-pass **inputs** (not just outputs) of reverb, delay, chorus, phaser, and stereo-widening buses (`createFx`, `createAmbientFx`, and `createStereoBus` enforce `220 Hz` pre-FX high-passing by default). Letting sub/kick/bass fundamentals into reverb or modulation smears the envelope and muddies the mix.
- **Mono low end, high-passed layers**: Keep kick and sub/bass centered; high-pass pads, stabs, leads, and arps above `200–240 Hz` so they don't compete with the sub.
- **Consonant keys & progressions**: For bright/major tracks, stick to warm keys and progressions that avoid harsh diminished/tritone chords (e.g. `#iv°` in Lydian).
