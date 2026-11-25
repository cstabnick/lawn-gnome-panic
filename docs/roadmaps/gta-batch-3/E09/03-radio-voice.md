Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none (issue 02 gives `radio: true` its crackle; the option is already typed, so this compiles without it)
Worker: Sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L47: Turfton FM talk, caller, traffic and bulletin lines are read out in the speaking host's own gnome voice
(@lawn/mutter through `voice/speech.ts`, with `radio: true`), not the SamJs "News bulletin" voice. The on-screen radio
text types at the player's Text speed option, and stays a little longer: it holds until `max(remainingSec + 1.5,
spoken + 1.0)` seconds, never past the next segment's start plus 1.5 s. A "Radio voice" option (default on) turns the
speaking off.

## Read first
- `games/gnome-theft-auto/src/radio/player.ts`: `render()` (~233), `tick(dt)`, `syncLive(station)` (~287, sets
  `current`, `remaining`, `textLeft`), `playBulletin` / `revealBulletin` (~322-342), `SONG_CREDIT_SECONDS`, `inVehicle`,
  `lastSpatialGain`, `lastSpatialPan`.
- `games/gnome-theft-auto/src/radio/content.ts`: `Line { who, text }`; station `sign.who` is the host label ('DOCK', ...).
  Segment kinds (`radio/schedule.ts`): 'song' | 'talk' | 'ad' | 'caller' | 'traffic' | 'bulletin'; `Segment.who`,
  `.text`, `.seconds`. `radio/broadcast.ts liveAt()` returns `offsetSec` (seconds into the segment) and `remainingSec`.
- `games/gnome-theft-auto/src/voice/speech.ts`: `speech()` (a Mutter: `say(text, voice, opts)` returns seconds,
  `stop()`), `unlockSpeech()`. `voice/voices.ts`: `voiceFor(label)` (any label; 'dock', 'sorrel' are listed, others get a
  derived voice).
- `games/gnome-theft-auto/src/cutscene/textSpeed.ts`: `getTextSpeed()`, `CHARS_PER_SECOND` (slow 22, normal 40, fast 75,
  instant Infinity), event `gta:text-speed`.
- `games/gnome-theft-auto/src/optionsRegistry.ts`: `registerOption({ section: 'audio', id, label, kind: 'toggle', get,
  set, desc, order, watch })`.

## Change
- New `src/radio/radioVoice.ts`:
  ```ts
  /** Radio voice option (default on), localStorage 'gta.radioVoice' ('off' = off), event 'gta:radio-voice'. */
  export function getRadioVoice(): boolean;
  export function setRadioVoice(on: boolean): void;
  /**
   * Speak one radio line in `hostKey`'s gnome voice (voiceFor(hostKey)), over the air (mutter { radio: true, phone: true,
   * maxLetters: 3 }), at `opts.gain` / `opts.pan`. Stops any line still speaking first (one line at a time). Returns the
   * spoken seconds, 0 when the option is off, the text is empty or audio is locked.
   */
  export function speakRadio(line: { who: string; text: string }, hostKey: string, opts?: { gain?: number; pan?: number }): number;
  export function stopRadio(): void;
  ```
  Long lines: speak at most the first 160 characters (cut at a word boundary) so a phone does not synthesize a minute
  of blips. Register the option at import time: `registerOption({ section: 'audio', id: 'radio-voice', label:
  'Radio voice', kind: 'toggle', get: getRadioVoice, set: setRadioVoice, desc: 'Hosts read their lines aloud in their
  own voices.', order: 70, watch: 'gta:radio-voice' })`. Mutter shares one engine with dialogue: `speakRadio` must not
  speak while a cutscene or comms line is talking; take an optional `busy?: () => boolean` via
  `setRadioVoiceBusy(fn)` (exported) and skip when it returns true (player.ts does not need to set it; leave the hook
  for app.ts).
- `src/radio/player.ts`:
  - Host key: for 'talk' and 'traffic' segments the line's `who` (lower-case); for 'caller' the `who` too; for
    'bulletin' the tuned station's host (`stationOf(id).sign.who`). 'ad' and 'song' are never spoken.
  - When a talk/caller/traffic segment starts fresh (`liveAt(...).offsetSec < 1.5`) and the player is in a vehicle (or
    the on-foot speaker is audible, using `lastSpatialGain`/`lastSpatialPan`), call `speakRadio`. A segment joined late
    shows its full text at once and is not spoken.
  - `revealBulletin`: speak the bulletin text in the host's voice (the SamJs "News bulletin" intro and chime stay).
  - Typing: the text line types at `CHARS_PER_SECOND[getTextSpeed()]` (keep a `typed` count advanced in `tick(dt)`;
    paint `current.text.slice(0, typed)`; songs and late joins show the full text). Do not repaint more than needed:
    update `text.textContent` only when the shown count changes.
  - Hold: for spoken or typed lines `textLeft = Math.min(remaining + 1.5, Math.max(remaining + 1.5, spoken + 1.0,
    typeSeconds + holdSeconds(text)))` where `holdSeconds` is from `cutscene/textSpeed.ts`. Songs keep
    `SONG_CREDIT_SECONDS`. If the next segment starts while the old text is still held, the new one replaces it.
  - `stopRadio()` when the radio is turned off, tuned, or the player leaves the vehicle without `keepPlaying`.
  - Respect `getRadioText()`: with radio text off the voice still speaks (the option is separate).
- Do not change `content.ts` lines (lore data) or `bulletinAudio.ts`.

## Contract
`speakRadio`, `stopRadio`, `getRadioVoice`, `setRadioVoice`, `setRadioVoiceBusy` exactly as above. Option id
`radio-voice`, key `gta.radioVoice`, event `gta:radio-voice`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- New `src/radio/radioVoice.test.ts` (node, no audio; stub `window`/`localStorage` like `src/radio/schedule.test.ts`
  or `src/testing/fakeDom.ts installFakeDom()`) checks: the option defaults on and round-trips; `speakRadio` returns 0
  when off; the 160-character cut ends on a word boundary (export the cut as `radioCut(text: string): string`).
- `npx vitest run src/radio` passes.

## Out of scope
`packages/mutter` (issue 02), `src/briefing/` (issue 04), `src/voice/speech.ts`, `src/options.ts`, `src/app.ts`.
