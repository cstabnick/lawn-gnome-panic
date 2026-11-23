// The dialogue card: speaker name, the line typing out letter by letter (mutter blips per word as it starts), and
// Next / Skip buttons (44 px). The director decides what a tap means (finish the typing, or end the line).
import type { Mutter, VoiceSpec } from '@lawn/mutter';

/** `voice`: the speaker's voice (voice/voices.ts); without it the line is voiced at `hz` in the plain mutter. */
export interface SubtitleLine { speaker: string; text: string; icon?: string; hz: number; voice?: VoiceSpec }

export interface Subtitles {
  readonly el: HTMLElement;
  /** Show a new line with nothing typed yet. `last`: the button reads 'Done' instead of 'Next'. */
  show(line: SubtitleLine, last: boolean): void;
  /** Show the first n characters (clamped to the line). Speaks each word with the voice as its first letter appears. */
  reveal(n: number): void;
  readonly shown: number;
  readonly length: number;
  hide(): void;
  destroy(): void;
}

const BUTTON_CSS = 'min-width:96px;min-height:44px;padding:8px 16px;border-radius:999px;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;';
/** A reveal that uncovers more than this many characters at once (an instant line, a tap to finish) speaks one word only. */
const BURST_CHARS = 12;
/** Longest word the voice sings out. */
const MAX_VOICE_LETTERS = 4;

function isSpace(ch: string | undefined): boolean {
  return ch === undefined || /\s/.test(ch);
}

/** Builds the dialogue card inside parent (hidden until show()). */
export function createSubtitles(
  parent: HTMLElement,
  voice: Mutter,
  handlers: { onNext(): void; onSkip(): void },
  opts: { skippable?: boolean } = {},
): Subtitles {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(11vh + max(10px,env(safe-area-inset-bottom)));max-width:720px;margin:0 auto;box-sizing:border-box;padding:12px 16px;border-radius:14px;background:rgba(12,14,18,.84);border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 24px rgba(0,0,0,.55);display:none;pointer-events:auto;touch-action:manipulation;';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;';
  const speakerEl = document.createElement('div');
  speakerEl.style.cssText = 'color:#ffd23f;font:800 15px/1.2 system-ui,sans-serif;letter-spacing:.02em;';
  const badge = document.createElement('span');
  badge.style.cssText = 'font-size:18px;line-height:1;';
  head.append(speakerEl, badge);

  // Typed part and the untyped rest; the rest is hidden, not removed, so the card keeps its size while typing.
  const textEl = document.createElement('div');
  textEl.style.cssText = 'color:#f5f7fa;font:500 15px/1.45 system-ui,sans-serif;margin-bottom:10px;';
  const typedEl = document.createElement('span');
  const restEl = document.createElement('span');
  restEl.style.visibility = 'hidden';
  textEl.append(typedEl, restEl);

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.style.cssText = `${BUTTON_CSS}border:2px solid #ffd23f;background:rgba(255,210,63,.18);color:#ffd23f;`;
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.textContent = 'Skip ▶▶';
  skipBtn.style.cssText = `${BUTTON_CSS}border:2px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;`;
  if (opts.skippable === false) skipBtn.style.display = 'none';
  actions.append(nextBtn, skipBtn);
  el.append(head, textEl, actions);
  parent.appendChild(el);

  // Taps on the buttons stop here so the card-wide handler does not fire too.
  nextBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); handlers.onNext(); });
  skipBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); handlers.onSkip(); });
  el.addEventListener('pointerdown', (e) => { e.stopPropagation(); handlers.onNext(); });

  let text = '';
  let shown = 0;
  let voiceOf: number | VoiceSpec = 100;

  const paint = (): void => {
    typedEl.textContent = text.slice(0, shown);
    restEl.textContent = text.slice(shown);
  };

  return {
    el,
    show(line, last) {
      text = line.text;
      shown = 0;
      voiceOf = line.voice ? { ...line.voice, hz: line.hz } : line.hz;
      speakerEl.textContent = line.speaker;
      badge.textContent = line.icon ?? '';
      badge.style.display = line.icon ? '' : 'none';
      nextBtn.textContent = last ? 'Done ▶' : 'Next ▶';
      paint();
      el.style.display = 'block';
    },
    reveal(n) {
      const target = Math.max(0, Math.min(text.length, Math.floor(n)));
      if (target === shown) return;
      const from = shown;
      shown = target;
      paint();
      if (target < from) return;
      // Word starts (a letter after whitespace, or the first letter) uncovered by this reveal.
      const starts: number[] = [];
      for (let i = from; i < target; i++) {
        if (!isSpace(text[i]) && isSpace(text[i - 1])) starts.push(i);
      }
      if (starts.length === 0) return;
      const burst = target - from > BURST_CHARS;
      const picked = burst ? starts[0] : starts[starts.length - 1];
      const word = text.slice(picked).split(/\s/)[0];
      voice.stop();
      voice.say(word, voiceOf, { maxLetters: MAX_VOICE_LETTERS });
    },
    get shown() { return shown; },
    get length() { return text.length; },
    hide() {
      el.style.display = 'none';
      voice.stop();
    },
    destroy() {
      voice.stop();
      el.remove();
    },
  };
}
