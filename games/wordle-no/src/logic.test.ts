import { describe, it, expect } from 'vitest';
import { ANSWER, scoreGuess, isWin, shareText, verdict } from './logic';

describe('wordle-no', () => {
  it('the answer is no', () => expect(ANSWER).toBe('NO'));
  it('NO wins', () => { expect(scoreGuess('no')).toEqual(['correct', 'correct']); expect(isWin(scoreGuess('NO'))).toBe(true); });
  it('ON is both yellow', () => expect(scoreGuess('ON')).toEqual(['present', 'present']));
  it('NN: second N is grey, first green', () => expect(scoreGuess('NN')).toEqual(['correct', 'absent']));
  it('OO: second is green, first grey (no extra O)', () => expect(scoreGuess('OO')).toEqual(['absent', 'correct']));
  it('NX / XO partial', () => { expect(scoreGuess('NX')).toEqual(['correct', 'absent']); expect(scoreGuess('XO')).toEqual(['absent', 'correct']); });
  it('YA is all grey', () => expect(scoreGuess('YA')).toEqual(['absent', 'absent']));
  it('share text', () => expect(shareText(5, [scoreGuess('YA'), scoreGuess('NO')], true)).toBe('Wordle 5 2/6\n\n⬛⬛\n🟩🟩'));
  it('verdicts', () => { expect(verdict(1, true)).toContain('NO'); expect(verdict(6, false)).toContain('always'); });
});
