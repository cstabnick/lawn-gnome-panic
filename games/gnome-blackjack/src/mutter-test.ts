// Dev-only page for trying the mutter voice and sound effects.
import { mutter, sfx, unlockAudio, type Sfx } from './mutter';

const text = document.getElementById('text') as HTMLInputElement;
const pitch = document.getElementById('pitch') as HTMLInputElement;
const hz = document.getElementById('hz') as HTMLElement;
const mutterBtn = document.getElementById('mutter') as HTMLButtonElement;
const sfxRow = document.getElementById('sfx') as HTMLElement;

pitch.addEventListener('input', () => {
  hz.textContent = pitch.value;
});

mutterBtn.addEventListener('click', () => {
  unlockAudio();
  mutter(text.value, Number(pitch.value));
});

const kinds: Sfx[] = ['card', 'chip', 'tick', 'win', 'lose'];
for (const kind of kinds) {
  const b = document.createElement('button');
  b.textContent = kind;
  b.addEventListener('click', () => {
    unlockAudio();
    sfx(kind);
  });
  sfxRow.append(b);
}
