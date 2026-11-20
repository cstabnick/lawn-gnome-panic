import { describe, it, expect } from 'vitest';
import { ANSWER, COLS, scoreGuess, isWin, shareText, verdict } from './logic';

describe('wordle-gnome', () => {
  it('the answer is gnome', () => { expect(ANSWER).toBe('GNOME'); expect(COLS).toBe(5); });
  it('GNOME wins', () => { expect(isWin(scoreGuess('gnome'))).toBe(true); expect(scoreGuess('GNOME')).toEqual(Array(5).fill('correct')); });
  it('MONGE: M,E yellow; O yellow; N yellow; G yellow', () => expect(scoreGuess('MONGE')).toEqual(['present', 'present', 'present', 'present', 'correct']));
  it('GGGGG: only the first G is green, the rest grey', () => expect(scoreGuess('GGGGG')).toEqual(['correct', 'absent', 'absent', 'absent', 'absent']));
  it('NNNNN: only the second N is green', () => expect(scoreGuess('NNNNN')).toEqual(['absent', 'correct', 'absent', 'absent', 'absent']));
  it('ABOUT: only O is green? no, O is at index 2 in both', () => expect(scoreGuess('ABOUT')).toEqual(['absent', 'absent', 'correct', 'absent', 'absent']));
  it('GLOOM: G, O green; extra O grey; M yellow', () => expect(scoreGuess('GLOOM')).toEqual(['correct', 'absent', 'correct', 'absent', 'present']));
  it('share text', () => expect(shareText(5, [scoreGuess('ABOUT'), scoreGuess('GNOME')], true)).toBe('Wordle 5 2/6\n\n⬛⬛🟩⬛⬛\n🟩🟩🟩🟩🟩'));
  it('verdicts', () => { expect(verdict(1, true)).toContain('GNOME'); expect(verdict(6, false)).toContain('always'); });
});
