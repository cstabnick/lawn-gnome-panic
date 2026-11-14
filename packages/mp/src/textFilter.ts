// Player-text filter, shared by the browser games and the matchmaking server (packages/mp-server).
// Names use checkName(); chat will use censorText(). Built on the `obscenity` package (MIT),
// which also catches leetspeak and stretched spellings ("sh1t", "fuuuck") without flagging
// innocent words like "Scunthorpe" or "classic".
import { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } from 'obscenity';

export const NAME_MIN = 2;
export const NAME_MAX = 18;
export const CHAT_MAX = 120;

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
const censor = new TextCensor();
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g;

/** Removes control and invisible characters, collapses whitespace, trims. */
export function tidyText(raw: string): string {
  return raw.replace(CONTROL_RE, '').replace(/\s+/g, ' ').trim();
}

/** True when the text contains no blocked words. */
export function isClean(text: string): boolean {
  return !matcher.hasMatch(text);
}

/** The text with blocked words masked (for chat). */
export function censorText(text: string): string {
  return censor.applyTo(text, matcher.getAllMatches(text));
}

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

/** Validates a display name: tidied, NAME_MIN..NAME_MAX characters, no blocked words. */
export function checkName(raw: unknown): NameCheck {
  const name = tidyText(typeof raw === 'string' ? raw : '');
  const len = Array.from(name).length;
  if (len < NAME_MIN) return { ok: false, reason: `Names need at least ${NAME_MIN} characters.` };
  if (len > NAME_MAX) return { ok: false, reason: `Names are at most ${NAME_MAX} characters.` };
  if (!isClean(name)) return { ok: false, reason: 'That name is not allowed. Pick another one.' };
  return { ok: true, name };
}
