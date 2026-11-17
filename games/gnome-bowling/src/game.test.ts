import { describe, expect, it } from 'vitest';
import { LOOK_ORDER, ROUND, SEAT_COLORS, THROW, type GameState } from './config';
import { makePlayer, newGame, newState, resultSeconds, throwBall, tickGame } from './game';

function advanceUntil(state: GameState, pred: () => boolean, maxS = 30): void {
  const dt = 0.05;
  for (let t = 0; t < maxS && !pred(); t += dt) {
    tickGame(state, dt);
  }
}

function playTurnToResultEnd(state: GameState): void {
  advanceUntil(state, () => state.phase === 'aim');
  expect(throwBall(state, { x: 0, aim: 0, speed: 9.5, spin: 0 })).toBe(true);
  advanceUntil(state, () => state.phase === 'result');
  const wait = resultSeconds(state.result) + 0.1;
  for (let t = 0; t < wait; t += 0.05) {
    tickGame(state, 0.05);
    if (state.phase !== 'result') break;
  }
}

function finishFrameForPlayer(state: GameState, playerIdx: number): void {
  while (state.current === playerIdx && (state.phase === 'intro' || state.phase === 'aim')) {
    playTurnToResultEnd(state);
  }
}

describe('framePan phase', () => {
  it('enters framePan only after all players finish a frame, then advances to intro', () => {
    const state = newState();
    newGame(state, [
      makePlayer('Gnorman', LOOK_ORDER[0], SEAT_COLORS[0]),
      makePlayer('Gnancy', LOOK_ORDER[1], SEAT_COLORS[1]),
    ], 'local');

    // Player 0 finishes frame 0 -> goes to player 1's intro (no framePan yet).
    finishFrameForPlayer(state, 0);
    expect(state.current).toBe(1);
    expect(state.frame).toBe(0);
    expect(state.phase).toBe('intro');

    // Player 1 finishes frame 0 -> all players finished frame 0 -> enters framePan.
    finishFrameForPlayer(state, 1);
    expect(state.current).toBe(0);
    expect(state.frame).toBe(1);
    expect(state.phase).toBe('framePan');

    // Stays in framePan before ROUND.framePanSeconds elapses.
    tickGame(state, ROUND.framePanSeconds * 0.5);
    expect(state.phase).toBe('framePan');

    // Transitions to intro once ROUND.framePanSeconds elapses.
    tickGame(state, ROUND.framePanSeconds * 0.6);
    expect(state.phase).toBe('intro');
    expect(state.current).toBe(0);
    expect(state.frame).toBe(1);
  });

  it('goes to final after the 10th frame without an extra framePan', () => {
    const state = newState();
    newGame(state, [
      makePlayer('Gnorman', LOOK_ORDER[0], SEAT_COLORS[0]),
    ], 'local');

    // Fast-forward 9 frames of gutter throws (18 rolls) via real turns? Faster: play 10 frames!
    for (let f = 0; f < 9; f++) {
      // Bowl frame f
      while (state.frame === f && state.phase !== 'framePan') {
        advanceUntil(state, () => state.phase === 'aim');
        throwBall(state, { x: 0.45, aim: 0.05, speed: THROW.speedMin, spin: 0 });
        advanceUntil(state, () => state.phase === 'result');
        advanceUntil(state, () => state.phase !== 'result');
      }
      expect(state.phase).toBe('framePan');
      advanceUntil(state, () => state.phase === 'intro');
    }

    // 10th frame: should end in 'final'
    while (state.phase !== 'final') {
      if (state.phase === 'intro') advanceUntil(state, () => state.phase === 'aim');
      if (state.phase === 'aim') {
        throwBall(state, { x: 0.45, aim: 0.05, speed: THROW.speedMin, spin: 0 });
      }
      advanceUntil(state, () => state.phase === 'result' || state.phase === 'final');
      if (state.phase === 'result') {
        advanceUntil(state, () => state.phase !== 'result');
      }
    }
    expect(state.phase).toBe('final');
  });
});
