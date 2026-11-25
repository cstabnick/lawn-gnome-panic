// Character intro cards (L105): who each main character is, in a name, a role and one line, for the 'intro' scene step
// (script.ts) and showCharacterIntro (introCard.ts). Pure data; lore: docs/design/gnome-theft-auto/characters.md and
// docs/lore/. E20-E22 place the intros in the story; this file only says what each card reads.

/** What one intro card shows. */
export interface CharacterIntro {
  /** Display name, e.g. "Pip Potsworth". */
  name: string;
  /** A short role, at most 28 characters, e.g. "Your neighbour. Fixer." */
  role: string;
  /** One line of who they are, at most 70 characters, in the game's dry voice. */
  line: string;
  /** Accent colour 0xRRGGBB for the card's stripe (the character's hat colour). Default 0xffd23f. */
  accent?: number;
}

/** By cast key (cutscene/cast.ts CAST keys). Filled by E09 issue 09. */
export const CAST_INTROS: Readonly<Record<string, CharacterIntro>> = {};

const titleCase = (s: string): string => s.replace(/\b\w/g, (m) => m.toUpperCase());

/**
 * The card for `who` (a cast key or label, any case), with any of `over`'s fields replacing the stored ones. An unknown
 * `who` gets its title-cased name and empty role and line.
 */
export function introFor(who: string, over: Partial<CharacterIntro> = {}): CharacterIntro {
  const base = CAST_INTROS[who.toLowerCase()] ?? { name: titleCase(who), role: '', line: '' };
  return {
    name: over.name ?? base.name,
    role: over.role ?? base.role,
    line: over.line ?? base.line,
    accent: over.accent ?? base.accent,
  };
}
