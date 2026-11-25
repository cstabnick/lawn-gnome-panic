// The character intro card (L105): a name, a role and one line slide in over a freeze-frame flash. The director shows
// it for the 'intro' scene step; quests and anything else outside a cutscene call showCharacterIntro().
import type { CharacterIntro } from './castIntros';

export interface IntroCard {
  /** The card's root element (already appended to the parent). */
  readonly el: HTMLElement;
  /** Show a card for about `seconds` (the caller hides it; `seconds` paces the slide-in and the stripe). */
  show(card: CharacterIntro, opts?: { seconds?: number; freeze?: boolean }): void;
  /** Hide it (slides out). Safe to call when hidden. */
  hide(): void;
  /** Remove the element. */
  destroy(): void;
}

/** Build the card inside `parent` (the director's overlay, or the game's #ui). Stub until E09 issue 08. */
export function createIntroCard(parent: HTMLElement): IntroCard {
  const el = document.createElement('div');
  el.className = 'gta-intro-card';
  el.style.display = 'none';
  parent.appendChild(el);
  return {
    el,
    show(card) {
      el.textContent = `${card.name}${card.role ? ` — ${card.role}` : ''}`;
      el.style.display = 'block';
    },
    hide() {
      el.style.display = 'none';
    },
    destroy() {
      el.remove();
    },
  };
}

/**
 * Outside a cutscene: show an intro card over the game for `seconds` (default 3.2), with the 'intro' stinger, then
 * remove it. Resolves when it has gone. Stub until E09 issue 08.
 */
export function showCharacterIntro(
  card: CharacterIntro,
  opts: { seconds?: number; freeze?: boolean; parent?: HTMLElement } = {},
): Promise<void> {
  const parent = opts.parent ?? document.getElementById('ui') ?? document.body;
  const c = createIntroCard(parent);
  c.show(card, opts);
  return new Promise((resolve) => {
    setTimeout(() => {
      c.hide();
      c.destroy();
      resolve();
    }, (opts.seconds ?? 3.2) * 1000);
  });
}
