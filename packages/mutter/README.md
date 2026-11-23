# @lawn/mutter

The Animal-Crossing-style "mutter" voice from Gnome Blackjack, as a package. Text becomes a run of short formant
blips: a main oscillator plus a square an octave down, through two vowel bandpasses, with a pitch lift on `?` and `!`.
A character is a `VoiceSpec`: a base pitch plus the knobs that make two voices sound different.

```ts
import { createMutter } from '@lawn/mutter';

const voice = createMutter({ gain: () => volumeStore.effective('sounds') });
window.addEventListener('pointerdown', () => voice.unlock());   // browsers need a gesture

const seconds = voice.say('Blessed be this glaze!', 88);        // a bare pitch = the original Blackjack voice

const gnorbert = { hz: 78, wave: 'square', wobble: 0.3 } as const;
voice.say('Mind the hedge.', gnorbert);
voice.say('Over here, quick!', { hz: 132, speed: 1.4, style: 'syllables' }, { phone: true, pan: 0.4 });
```

- `say(text, voice, opts?)` returns how long the line takes in seconds (0 if silent), so a reveal can wait for it.
- `voice` is a `VoiceSpec`, or just a base pitch in Hz. `{ hz: 88 }` and `88` are the same voice.
- `estimate(text, opts?, voice?)` gives the duration without playing. Pass the same voice you will `say` with and the
  numbers match.
- `stop()` cuts off whatever is speaking.
- `maxLetters` (default 48, Blackjack's value) caps how many letters are voiced; longer lines are voiced up to the cap.
- Muted when the URL hash contains `mute`.
- `resolveVoice(voice)` returns a voice with every default filled in (useful for tests and for reading a voice back).

Blackjack's pitches: Old Gnick 74, Gnorbert 78, Grumbo 70, Mossimo 92, Auntie Thistle 118, Gnadine 132, Lil Pebble 140.

## VoiceSpec

| Field | Range / values | Default | What it does |
| --- | --- | --- | --- |
| `hz` | 60 .. 220 | required | Base pitch: deep .. squeaky. |
| `speed` | 0.6 .. 1.6 | 1 | Blip rate: slow and deliberate .. fast and breathless. |
| `wave` | `saw`, `square`, `triangle`, `sine` | `saw` | Main oscillator: buzzy, hollow, soft, pure. |
| `sub` | 0 .. 1 | 0.5 | Octave-down square under the main oscillator: thin .. chesty. |
| `formant` | 0.8 .. 1.3 | 1 | Multiplies both vowel formants: big and dark .. small and bright. |
| `q` | 2 .. 9 | 5 | Formant bandpass Q: breathy and wide .. nasal and sharp. |
| `breath` | 0 .. 1 | 0 | White noise through the formants: whisper, rasp, smoker. |
| `wobble` | 0 .. 1 | 0 | 5.5 Hz vibrato plus per-blip pitch jitter: old, nervous, theatrical. |
| `range` | 0.2 .. 2 | 1 | Melodic spread per letter: monotone clerk .. sing-song showman. |
| `glide` | -1 .. 1 | 0 | Pitch movement across the line: falls (tired) .. rises (eager). |
| `style` | `letters`, `syllables`, `words` | `letters` | One blip per letter, per vowel group (longer, rounder), or per word (terse, gruff). |
| `syllables` | space-separated, e.g. `'bo ba bu mm'` | `''` | Speak a made-up syllable set instead of the real letters. Each unit picks one syllable by a hash of its letters, so the same text always sounds the same. |
| `bright` | Hz | 2600 | The voice's own lowpass cutoff. |

## SayOptions

- `phone: true`: the line goes through a 350..3200 Hz band with a soft clip (mission comms, a call). It replaces the
  voice's `bright` lowpass.
- `gain`: 0..1, extra gain for this line only (a distant gnome).
- `pan`: -1..1, stereo pan for this line only (skipped where `StereoPannerNode` is missing).
- `maxLetters`: the voiced-letter cap described above.

## Two-voice example

```ts
const clerk = { hz: 110, range: 0.3, speed: 0.8, style: 'words', glide: -0.4 } as const;
const showman = { hz: 150, range: 1.8, speed: 1.3, wave: 'triangle', glide: 0.6, wobble: 0.4 } as const;

voice.say('Fourteen forms, please.', clerk, { pan: -0.3 });
voice.say('Fourteen forms? Splendid!', showman, { pan: 0.3 });
```

At most two lines play at once; a third one stops the oldest.

Gnome Blackjack and Paragnormal still carry their own copies; they can adopt this package when someone is working there.
