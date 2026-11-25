// The character intro card (L105): a name, a role and one line slide in over a freeze-frame flash. The director shows
// it for the 'intro' scene step; quests and anything else outside a cutscene call showCharacterIntro().
import type { CharacterIntro } from './castIntros';
import { createCueAudio, type CueAudio } from './cueAudio';

export interface IntroCard {
  /** The card's root element (already appended to the parent). */
  readonly el: HTMLElement;
  /** Show a card for about `seconds` (the caller hides it; `seconds` paces the progress bar). */
  show(card: CharacterIntro, opts?: { seconds?: number; freeze?: boolean }): void;
  /** Hide it (slides out). Safe to call when hidden. */
  hide(): void;
  /** Remove the element. */
  destroy(): void;
}

const STYLE_ID = 'gta-intro-card-style';

const CSS = `
.gta-intro-card { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.gta-intro-card [hidden] { display: none !important; }
.gta-intro-card .gic-flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
.gta-intro-card .gic-vignette { position: absolute; inset: 0; opacity: 0;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%); }
.gta-intro-card .gic-card { position: absolute; box-sizing: border-box; opacity: 0;
  left: max(16px, env(safe-area-inset-left)); top: calc(11vh + 20px);
  max-width: min(440px, calc(100vw - 32px)); padding: 10px 16px 13px 16px;
  background: rgba(10,12,16,.82); border-left: 6px solid var(--gic-accent, #ffd23f); color: #fff;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
.gta-intro-card .gic-name { margin: 0; font-weight: 800; font-size: 28px; line-height: 1.1;
  text-transform: uppercase; letter-spacing: .04em; }
.gta-intro-card .gic-role { margin: 4px 0 0 0; font-size: 12px; line-height: 1.3; text-transform: uppercase;
  letter-spacing: .14em; color: var(--gic-accent, #ffd23f); }
.gta-intro-card .gic-line { margin: 6px 0 0 0; font-size: 15px; line-height: 1.35; font-style: italic; color: #e8e8e8;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.gta-intro-card .gic-bar { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%;
  background: var(--gic-accent, #ffd23f); transform-origin: left center; }
@media (max-width: 480px) { .gta-intro-card .gic-name { font-size: 22px; } }

.gta-intro-card.gic-live .gic-card { animation: gic-in .35s ease-out .15s both; }
.gta-intro-card.gic-live .gic-bar { animation: gic-bar var(--gic-seconds, 3.2s) linear both; }
.gta-intro-card.gic-live.gic-freeze .gic-flash { animation: gic-flash .18s ease-out both; }
.gta-intro-card.gic-live.gic-freeze .gic-vignette { animation: gic-fade .2s ease-out both; }
.gta-intro-card.gic-out .gic-card { animation: gic-away .3s ease-in both; }
.gta-intro-card.gic-out .gic-vignette { animation: gic-unfade .3s ease-in both; }

@keyframes gic-in { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes gic-away { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(-24px); } }
@keyframes gic-flash { 0% { opacity: 0; } 50% { opacity: .85; } 100% { opacity: 0; } }
@keyframes gic-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes gic-unfade { from { opacity: 1; } to { opacity: 0; } }
@keyframes gic-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }

@media (prefers-reduced-motion: reduce) {
  .gta-intro-card.gic-live .gic-card { animation-name: gic-fade; animation-delay: 0s; }
  .gta-intro-card.gic-out .gic-card { animation-name: gic-fade-out; }
  .gta-intro-card.gic-live.gic-freeze .gic-flash { animation: none; opacity: 0; }
}
@keyframes gic-fade-out { from { opacity: 1; } to { opacity: 0; } }

body[data-intro-freeze="on"] canvas { filter: saturate(.2) contrast(1.15) brightness(1.04); transition: filter .15s; }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Build the card inside `parent` (the director's overlay, or the game's #ui). */
export function createIntroCard(parent: HTMLElement): IntroCard {
  ensureStyle();
  const el = document.createElement('div');
  el.className = 'gta-intro-card';
  el.style.display = 'none';
  el.innerHTML = '<div class="gic-flash"></div><div class="gic-vignette"></div>'
    + '<div class="gic-card"><p class="gic-name"></p><p class="gic-role"></p><p class="gic-line"></p>'
    + '<div class="gic-bar"></div></div>';
  parent.appendChild(el);

  const nameEl = el.querySelector<HTMLElement>('.gic-name')!;
  const roleEl = el.querySelector<HTMLElement>('.gic-role')!;
  const lineEl = el.querySelector<HTMLElement>('.gic-line')!;
  let shown = false;

  const clearFreeze = (): void => {
    delete document.body.dataset.introFreeze;
  };

  return {
    el,
    show(c, opts = {}) {
      const freeze = opts.freeze !== false;
      const seconds = opts.seconds ?? 3.2;
      const accent = `#${(c.accent ?? 0xffd23f).toString(16).padStart(6, '0')}`;
      el.style.setProperty('--gic-accent', accent);
      el.style.setProperty('--gic-seconds', `${seconds}s`);
      nameEl.textContent = c.name;
      roleEl.textContent = c.role;
      roleEl.hidden = !c.role;
      lineEl.textContent = c.line;
      lineEl.hidden = !c.line;
      el.style.display = 'block';
      // Restart the animations from the top.
      el.classList.remove('gic-out', 'gic-live', 'gic-freeze');
      void el.offsetWidth;
      el.classList.add('gic-live');
      if (freeze) {
        el.classList.add('gic-freeze');
        document.body.dataset.introFreeze = 'on';
      } else {
        clearFreeze();
      }
      shown = true;
    },
    hide() {
      clearFreeze();
      if (!shown) return;
      shown = false;
      el.classList.remove('gic-live', 'gic-freeze');
      el.classList.add('gic-out');
    },
    destroy() {
      clearFreeze();
      el.remove();
    },
  };
}

let cue: CueAudio | null = null;

/**
 * Outside a cutscene: show an intro card over the game for `seconds` (default 3.2), with the 'intro' stinger, then
 * remove it. Resolves when it has gone.
 */
export function showCharacterIntro(
  card: CharacterIntro,
  opts: { seconds?: number; freeze?: boolean; parent?: HTMLElement } = {},
): Promise<void> {
  const parent = opts.parent ?? document.getElementById('ui') ?? document.body;
  const c = createIntroCard(parent);
  cue ??= createCueAudio();
  cue.stinger('intro');
  c.show(card, opts);
  return new Promise((resolve) => {
    setTimeout(() => {
      c.hide();
      setTimeout(() => {
        c.destroy();
        resolve();
      }, 350);
    }, (opts.seconds ?? 3.2) * 1000);
  });
}
