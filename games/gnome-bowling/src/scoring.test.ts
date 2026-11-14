import { expect, test } from 'vitest';
import { cursor, frameMarks, frameScores, isSplit, maxPossible, totalScore } from './scoring';

const zeros = (n: number): number[] => Array.from({ length: n }, () => 0);

test('perfect game', () => {
  const r = Array.from({ length: 12 }, () => 10);
  expect(totalScore(r)).toBe(300);
  expect(cursor(r).done).toBe(true);
  expect(frameMarks(r)[9]).toEqual(['X', 'X', 'X']);
});

test('all spares', () => {
  const r = Array.from({ length: 21 }, () => 5);
  expect(totalScore(r)).toBe(150);
  expect(frameMarks(r)[0]).toEqual(['5', '/']);
  expect(frameMarks(r)[9]).toEqual(['5', '/', '5']);
});

test('open game', () => {
  const r = Array.from({ length: 20 }, () => 4);
  expect(totalScore(r)).toBe(80);
  expect(cursor(r).done).toBe(true);
});

test('strike bonus waits for two balls', () => {
  expect(frameScores([10, 3])[0]).toBe(null);
  expect(frameScores([10, 3, 4])[0]).toBe(17);
  expect(cursor([10]).frame).toBe(1);
  expect(cursor([3]).fresh).toBe(false);
});

test('tenth frame: strike then 7 leaves a third ball at 3 pins', () => {
  const r = [...zeros(18), 10, 7];
  expect(cursor(r).done).toBe(false);
  expect(cursor(r).fresh).toBe(false);
  expect(frameMarks([...r, 3])[9]).toEqual(['X', '7', '/']);
});

test('tenth frame: open ends the game', () => {
  expect(cursor([...zeros(18), 3, 4]).done).toBe(true);
});

test('max possible', () => {
  expect(maxPossible([])).toBe(300);
  expect(maxPossible(zeros(20))).toBe(0);
});

test('splits', () => {
  const s = Array.from({ length: 10 }, () => false);
  s[6] = true;
  s[9] = true; // 7-10
  expect(isSplit(s)).toBe(true);
  const t = Array.from({ length: 10 }, () => false);
  t[3] = true;
  t[6] = true; // 4-7 touch
  expect(isSplit(t)).toBe(false);
});
