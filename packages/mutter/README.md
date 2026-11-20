# @lawn/mutter

The Animal-Crossing-style "mutter" voice from Gnome Blackjack, as a package. Text becomes a run of short formant
blips: a saw plus a square an octave down through two vowel bandpasses, with a pitch lift on `?` and `!`.

```ts
import { createMutter } from '@lawn/mutter';

const voice = createMutter({ gain: () => volumeStore.effective('sounds') });
window.addEventListener('pointerdown', () => voice.unlock());   // browsers need a gesture
const seconds = voice.say('Blessed be this glaze!', 88);        // 88 Hz = deep; Blackjack uses 70..140
```

- `say(text, hz, opts?)` returns how long the line takes in seconds (0 if silent), so a reveal can wait for it.
- `hz` is the base pitch. Blackjack: Old Gnick 74, Gnorbert 78, Grumbo 70, Mossimo 92, Auntie Thistle 118, Gnadine 132, Lil Pebble 140.
- `maxLetters` (default 48, Blackjack's value) caps how many letters are voiced; longer lines are voiced up to the cap.
- `stop()` cuts off whatever is speaking. `estimate(text, opts?)` gives the duration without playing.
- Muted when the URL hash contains `mute`.

Gnome Blackjack and Paragnormal still carry their own copies; they can adopt this package when someone is working there.
