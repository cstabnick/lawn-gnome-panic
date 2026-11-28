// The mission comms panel: a talking-head portrait of whoever is speaking, their name, and their line typing out in
// their voice. 'briefing' at a quest's start (what you are doing, why, who is involved), 'call' for phone-style comms
// when an objective changes. Never pauses the game; tap to advance, Skip to close. Appends its own container to #ui.
import type { GnomeLook } from '@lawn/gnome';
import type { VoiceSpec } from '@lawn/mutter';
import { speech, unlockSpeech } from '../voice/speech';
import { portraitElement } from './portrait';
import { fillHint } from '../ui/glyphs';
import { CHARS_PER_SECOND, getTextSpeed } from '../cutscene/textSpeed';

/** Who is talking: display name, look (for the portrait), voice, and a stable key (portrait cache). */
export interface BriefingCaller {
  key: string;
  name: string;
  look: GnomeLook;
  voice: VoiceSpec;
}

export interface BriefingLine {
  caller: BriefingCaller;
  text: string;
}

export interface BriefingShowOptions {
  /** 'briefing' (quest start, a bigger card with a title) or 'call' (mid-mission, a phone call). Default 'call'. */
  mode?: 'briefing' | 'call';
  /** Card heading, e.g. the quest title. */
  title?: string;
  /** GR5 (FX21): the reward chip's text (quests/story/rewards.ts rewardChip(q).text), shown on a 'briefing' card. */
  reward?: string;
  /** D7 (FX21): a short frame shown before the title in the card's tag, e.g. 'Before the Even Cut'. */
  kicker?: string;
  /** Called once when the last line is done or the panel is skipped / hidden. */
  onDone?: () => void;
}

export interface Briefing {
  /** The panel's root element (inside #ui). */
  readonly el: HTMLElement;
  /** Show a run of lines (replaces whatever is showing). */
  show(lines: readonly BriefingLine[], opts?: BriefingShowOptions): void;
  /** Close at once (e.g. a cutscene started). Calls onDone. */
  hide(): void;
  readonly active: boolean;
  /** Advance the typing and auto-advance timers. Call once a frame with the frame time in seconds. */
  update(dt: number): void;
}

/** Phone-call ring shown before the first line of a call types. */
const RING_SECONDS = 0.6;
/** A reveal that uncovers more than this many characters at once speaks one word only. */
const BURST_CHARS = 12;
/** Longest word the voice sings out. */
const MAX_VOICE_LETTERS = 4;
/** How long the portrait stays bobbed when a word starts. */
const BOB_SECONDS = 0.09;
const MIN_HOLD_SECONDS = 3.0;
const WORDS_PER_SECOND = 3.0;
/** L47: comms text stays a little longer. */
const EXTRA_HOLD_SECONDS = 0.8;

const STYLE_ID = 'gta-briefing-style';
const STYLE = `
#gta-briefing{position:fixed;inset:0;z-index:45;pointer-events:none;font-family:system-ui,sans-serif;}
#gta-briefing .gb-card{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 150px);
  width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:rgba(12,14,18,.9);
  border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 28px rgba(0,0,0,.6);color:#f5f7fa;pointer-events:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
#gta-briefing .gb-head{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
#gta-briefing .gb-ring{flex:none;width:68px;height:68px;border-radius:14px;border:3px solid #d93636;background:rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box;}
#gta-briefing .gb-portrait{width:62px;height:62px;display:block;transition:transform .04s linear;transform-origin:50% 90%;}
#gta-briefing .gb-portrait.gb-talk{transform:translateY(-2px) scale(1.03);}
#gta-briefing .gb-who{min-width:0;flex:1;}
#gta-briefing .gb-tag{font-size:11px;font-weight:800;letter-spacing:.08em;color:#bff3ff;text-transform:uppercase;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#gta-briefing .gb-name{margin-top:2px;color:#ffd23f;font-weight:800;font-size:16px;line-height:1.2;}
#gta-briefing .gb-name.gb-hidden{visibility:hidden;}
#gta-briefing .gb-text{font-size:15px;line-height:1.45;min-height:4.35em;margin-bottom:12px;}
#gta-briefing .gb-rest{visibility:hidden;}
#gta-briefing .gb-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;}
#gta-briefing button{min-width:44px;min-height:44px;padding:8px 16px;border-radius:999px;font:700 14px system-ui,sans-serif;
  cursor:pointer;touch-action:manipulation;box-sizing:border-box;}
#gta-briefing .gb-next{border:2px solid #ffd23f;background:rgba(255,210,63,.18);color:#ffd23f;}
#gta-briefing .gb-skip{border:2px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;}
#gta-briefing .gb-icon{display:none;}
#gta-briefing .gb-chip{flex:none;align-self:flex-start;max-width:42%;padding:4px 10px;border-radius:999px;background:rgba(255,210,63,.16);
  border:1px solid rgba(255,210,63,.6);color:#ffe9a8;font-size:13px;font-weight:700;line-height:1.3;text-align:right;overflow:hidden;
  text-overflow:ellipsis;display:none;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
#gta-briefing .gb-chip.gb-chip-on{display:-webkit-box;}
/* Phone portrait: a compact strip under the minimap, scrollable text, icon buttons. */
@media (max-width:700px) and (orientation:portrait){
  #gta-briefing .gb-card{top:calc(env(safe-area-inset-top,0px) + max(18px,4vw) + var(--gta-map,128px) + 60px);bottom:auto;
    left:max(8px,env(safe-area-inset-left,0px));right:max(8px,env(safe-area-inset-right,0px));width:auto;transform:none;
    padding:8px 10px;max-height:28vh;display:flex;flex-direction:column;overflow:hidden;}
  #gta-briefing .gb-head{margin-bottom:6px;gap:10px;}
  #gta-briefing .gb-ring{width:40px;height:40px;border-radius:10px;border-width:2px;}
  #gta-briefing .gb-portrait{width:36px;height:36px;}
  #gta-briefing .gb-who{display:flex;align-items:baseline;gap:6px;}
  #gta-briefing .gb-tag{font-size:10px;flex:0 1 auto;min-width:0;}
  /* The chip takes its own row under the name, so the speaker's name is never cut short. */
  #gta-briefing .gb-head{flex-wrap:wrap;row-gap:4px;}
  #gta-briefing .gb-who{flex:1 1 calc(100% - 50px);}
  #gta-briefing .gb-chip{font-size:11px;padding:2px 8px;margin-left:50px;max-width:calc(100% - 50px);-webkit-line-clamp:1;text-align:left;}
  #gta-briefing .gb-name{margin-top:0;font-size:14px;min-width:0;flex:0 1 auto;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
  #gta-briefing .gb-text{flex:1 1 auto;min-height:4.2em;font-size:13px;margin-bottom:8px;overflow-y:auto;touch-action:pan-y;}
  #gta-briefing .gb-actions{flex:none;}
  #gta-briefing .gb-icon{display:inline;}
  #gta-briefing .gb-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
  #gta-briefing button{width:44px;height:44px;min-width:44px;padding:0;font-size:20px;line-height:1;}
}
/* Landscape phone: a short strip at the top, capped at 40 percent of the height. */
@media (max-height:500px){
  #gta-briefing .gb-card{top:calc(env(safe-area-inset-top,0px) + 8px);bottom:auto;right:auto;left:50%;transform:translateX(-50%);
    width:min(440px,52vw);padding:8px 12px;max-height:40vh;display:flex;flex-direction:column;overflow:hidden;}
  #gta-briefing .gb-ring{width:36px;height:36px;}
  #gta-briefing .gb-portrait{width:32px;height:32px;}
  #gta-briefing .gb-head{margin-bottom:4px;}
  #gta-briefing .gb-text{flex:1 1 auto;min-height:2.9em;font-size:13px;margin-bottom:6px;overflow-y:auto;touch-action:pan-y;}
  #gta-briefing .gb-name{font-size:14px;}
  #gta-briefing .gb-chip{font-size:11px;padding:2px 8px;max-width:44%;-webkit-line-clamp:2;border-radius:10px;}
  #gta-briefing .gb-actions{flex:none;}
  #gta-briefing .gb-icon{display:inline;}
  #gta-briefing .gb-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
  #gta-briefing button{width:44px;height:44px;min-width:44px;padding:0;font-size:20px;line-height:1;}
}`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = STYLE;
  document.head.appendChild(s);
}

function isSpace(ch: string | undefined): boolean {
  return ch === undefined || /\s/.test(ch);
}

function holdSeconds(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(MIN_HOLD_SECONDS, words / WORDS_PER_SECOND) + EXTRA_HOLD_SECONDS;
}

/** Builds the comms panel inside ui (hidden until show()). */
export function createBriefing(ui: HTMLElement): Briefing {
  ensureStyle();
  const el = document.createElement('div');
  el.id = 'gta-briefing';
  el.style.display = 'none';

  const card = document.createElement('div');
  card.className = 'gb-card';
  const head = document.createElement('div');
  head.className = 'gb-head';
  const ring = document.createElement('div');
  ring.className = 'gb-ring';
  const who = document.createElement('div');
  who.className = 'gb-who';
  const tagEl = document.createElement('div');
  tagEl.className = 'gb-tag';
  const nameEl = document.createElement('div');
  nameEl.className = 'gb-name';
  who.append(tagEl, nameEl);
  // The reward chip: shown on a 'briefing' card only (toggled with a class, not an inline display).
  const chipEl = document.createElement('div');
  chipEl.className = 'gb-chip';
  head.append(ring, who, chipEl);

  // Typed part and the untyped rest; the rest is hidden, not removed, so the card keeps its size while typing.
  const textEl = document.createElement('div');
  textEl.className = 'gb-text';
  const typedEl = document.createElement('span');
  const restEl = document.createElement('span');
  restEl.className = 'gb-rest';
  textEl.append(typedEl, restEl);

  const actions = document.createElement('div');
  actions.className = 'gb-actions';
  // Each button has an icon (shown on phones) and a text label (hidden there, still read by screen readers).
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'gb-skip';
  skipBtn.setAttribute('aria-label', 'Skip');
  const skipIcon = document.createElement('span');
  skipIcon.className = 'gb-icon';
  skipIcon.setAttribute('aria-hidden', 'true');
  skipIcon.textContent = '⏭';
  const skipLabel = document.createElement('span');
  skipLabel.className = 'gb-label';
  skipLabel.textContent = 'Skip ✕';
  skipBtn.append(skipIcon, skipLabel);
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'gb-next';
  const nextIcon = document.createElement('span');
  nextIcon.className = 'gb-icon';
  nextIcon.setAttribute('aria-hidden', 'true');
  nextIcon.textContent = '›';
  const nextLabel = document.createElement('span');
  nextLabel.className = 'gb-label';
  nextBtn.append(nextIcon, nextLabel);
  actions.append(skipBtn, nextBtn);
  card.append(head, textEl, actions);
  el.appendChild(card);
  ui.appendChild(el);

  let active = false;
  let mode: 'briefing' | 'call' = 'call';
  let title = '';
  let kicker = '';
  let reward = '';
  let lines: readonly BriefingLine[] = [];
  let index = 0;
  let onDone: (() => void) | undefined;

  let text = '';
  let shown = 0;
  let phase: 'ring' | 'type' | 'hold' = 'type';
  let ringLeft = 0;
  let acc = 0;
  /** Characters per second for the current line, from the Options text speed (Infinity = whole line at once). */
  let cps = CHARS_PER_SECOND.normal;
  let holdLeft = 0;
  let bobLeft = 0;
  let lastNow = 0;
  let portraitEl: HTMLImageElement | null = null;

  const paint = (): void => {
    typedEl.textContent = text.slice(0, shown);
    restEl.textContent = text.slice(shown);
  };

  const finish = (): void => {
    if (!active) return;
    active = false;
    el.style.display = 'none';
    speech().stop();
    const cb = onDone;
    onDone = undefined;
    cb?.();
  };

  /** Speaks the word that starts at the newest uncovered word start (or only one word after a big jump). */
  const reveal = (n: number): void => {
    const target = Math.max(0, Math.min(text.length, Math.floor(n)));
    if (target === shown) return;
    const from = shown;
    shown = target;
    paint();
    if (target < from) return;
    const starts: number[] = [];
    for (let i = from; i < target; i++) {
      if (!isSpace(text[i]) && isSpace(text[i - 1])) starts.push(i);
    }
    if (starts.length === 0) return;
    const burst = target - from > BURST_CHARS;
    const picked = burst ? starts[0] : starts[starts.length - 1];
    const word = text.slice(picked).split(/\s/)[0];
    const caller = lines[index].caller;
    speech().stop();
    speech().say(word, caller.voice, {
      maxLetters: MAX_VOICE_LETTERS,
      phone: mode === 'call',
      radio: mode === 'call',
    });
    if (portraitEl) {
      portraitEl.classList.add('gb-talk');
      bobLeft = BOB_SECONDS;
    }
  };

  const tagFor = (): string =>
    mode === 'briefing' ? `${kicker ? `${kicker} · ` : ''}Briefing${title ? ` · ${title}` : ''}` : '📞 Call';

  const paintChip = (): void => {
    const on = mode === 'briefing' && reward.length > 0;
    chipEl.classList.toggle('gb-chip-on', on);
    if (on) {
      chipEl.textContent = reward;
      chipEl.setAttribute('aria-label', `Reward: ${reward}`);
    } else {
      chipEl.textContent = '';
      chipEl.removeAttribute('aria-label');
    }
  };

  const startLine = (i: number): void => {
    index = i;
    const line = lines[i];
    const caller = line.caller;
    text = fillHint(line.text);
    shown = 0;
    acc = 0;
    cps = CHARS_PER_SECOND[getTextSpeed()];
    tagEl.textContent = tagFor();
    nameEl.textContent = caller.name;
    nameEl.classList.remove('gb-hidden');
    ring.style.borderColor = `#${(caller.look.hat & 0xffffff).toString(16).padStart(6, '0')}`;
    if (portraitEl?.dataset.key !== caller.key) {
      portraitEl?.remove();
      portraitEl = portraitElement(caller.key, caller.look);
      portraitEl.className = 'gb-portrait';
      portraitEl.dataset.key = caller.key;
      ring.replaceChildren(portraitEl);
    }
    nextLabel.textContent = i === lines.length - 1 ? 'Done ▶' : 'Next ▶';
    nextBtn.setAttribute('aria-label', i === lines.length - 1 ? 'Done' : 'Next');
    if (mode === 'call' && i === 0) {
      // A phone call rings first: the incoming caller shows where the line will type.
      phase = 'ring';
      ringLeft = RING_SECONDS;
      nameEl.classList.add('gb-hidden');
      typedEl.textContent = `📞 Incoming: ${caller.name}`;
      restEl.textContent = '';
      return;
    }
    phase = text.length === 0 ? 'hold' : 'type';
    holdLeft = holdSeconds(text);
    paint();
  };

  const next = (): void => {
    if (index + 1 >= lines.length) {
      finish();
      return;
    }
    startLine(index + 1);
  };

  /** Next tap: finish typing if the line is still typing, otherwise go to the next line. */
  const advance = (): void => {
    if (!active) return;
    if (phase === 'ring') {
      phase = 'type';
      nameEl.classList.remove('gb-hidden');
      paint();
      return;
    }
    if (shown < text.length) {
      reveal(text.length);
      phase = 'hold';
      holdLeft = holdSeconds(text);
      return;
    }
    next();
  };

  // Taps on the card advance; the buttons stop the event so the card handler does not fire twice.
  card.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    unlockSpeech();
    // A long line scrolls inside the card: a touch that starts in the scrollable text is a drag, not a tap.
    if (textEl.contains(e.target as Node) && textEl.scrollHeight > textEl.clientHeight) return;
    advance();
  });
  nextBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    unlockSpeech();
    advance();
  });
  skipBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    finish();
  });

  return {
    el,
    show(newLines, opts) {
      if (active) finish();
      if (newLines.length === 0) {
        opts?.onDone?.();
        return;
      }
      mode = opts?.mode ?? 'call';
      title = opts?.title ?? '';
      kicker = opts?.kicker ?? '';
      reward = opts?.reward ?? '';
      lines = newLines;
      onDone = opts?.onDone;
      active = true;
      el.style.display = 'block';
      paintChip();
      startLine(0);
    },
    hide() {
      if (!active) return;
      el.style.display = 'none';
      speech().stop();
      finish();
    },
    get active() {
      return active;
    },
    update(frameDt: number) {
      // Wall-clock time, not the game's clamped frame step: on a slow phone (or a busy frame) the text still types at
      // reading speed and stays in step with the voice.
      const now = typeof performance !== 'undefined' ? performance.now() : 0;
      const dt = lastNow > 0 && now > 0 ? Math.min(0.25, (now - lastNow) / 1000) : frameDt;
      lastNow = now;
      if (!active) return;
      if (bobLeft > 0) {
        bobLeft -= dt;
        if (bobLeft <= 0) portraitEl?.classList.remove('gb-talk');
      }
      if (phase === 'ring') {
        ringLeft -= dt;
        if (ringLeft <= 0) {
          phase = 'type';
          nameEl.classList.remove('gb-hidden');
          paint();
        }
        return;
      }
      if (phase === 'type') {
        // Instant: the whole line at once (Infinity * 0 would be NaN, so it is not multiplied by dt).
        acc = Number.isFinite(cps) ? acc + dt * cps : text.length;
        const target = Math.floor(acc);
        if (target > shown) reveal(target);
        if (shown >= text.length) {
          phase = 'hold';
          holdLeft = holdSeconds(text);
        }
        return;
      }
      holdLeft -= dt;
      if (holdLeft <= 0) next();
    },
  };
}
