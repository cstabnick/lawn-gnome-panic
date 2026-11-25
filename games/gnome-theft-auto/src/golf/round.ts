// Hedgeworth's round as pure state (STUB: issue A2 fills it in). One player, four holes, @lawn/golf for the swing and the
// ball. World metres for the ball and aim; the flight itself is the package result in the golf frame (golf/course.ts).
import type { ClubId, Lie } from '@lawn/golf';
import type { CardView, HudView, RoundEvent, RoundState } from './types';
import { HOLES } from './types';

/** A new round on hole `hole` (default 0), ball on its tee. */
export function newRound(seed: number, hole = 0): RoundState {
  const h = HOLES[hole];
  return {
    seed, hole, strokes: 0, scores: HOLES.map(() => null), ball: { x: h.tee.x, z: h.tee.z }, lie: 'tee', club: 'DR',
    aimYaw: 0, wind: { yaw: 0, mph: 0 }, phase: 'walk', swing: { stage: 'idle', marker: 0, power: 0 }, flight: null,
    banner: '', bannerT: 0, birdieRun: 0,
  };
}
export function startHole(_s: RoundState, _hole: number): void {}
export function addressBall(_s: RoundState): void {}
export function leaveBall(_s: RoundState): void {}
export function setAim(s: RoundState, yaw: number): void { s.aimYaw = yaw; }
export function turnAim(_s: RoundState, _dir: number, _dt: number): void {}
export function cycleClub(_s: RoundState, _delta: number): void {}
export function defaultClub(_lie: Lie, _yardsToPin: number): ClubId { return 'DR'; }
export function tapSwing(_s: RoundState): RoundEvent[] { return []; }
export function tickRound(_s: RoundState, _dt: number): RoundEvent[] { return []; }
export function nextHole(_s: RoundState): RoundEvent[] { return []; }
export function totals(_s: RoundState): { strokes: number; toPar: number; played: number } { return { strokes: 0, toPar: 0, played: 0 }; }
export function ballWorld(s: RoundState): { x: number; y: number; z: number } { return { x: s.ball.x, y: 0, z: s.ball.z }; }
export function pinYards(_s: RoundState): number { return 0; }
export function hudView(s: RoundState, atBall: boolean): HudView {
  const h = HOLES[s.hole];
  return {
    holeNumber: h.number, holeName: h.name, par: h.par, strokes: s.strokes, toPar: 0, clubName: s.club, clubYards: 0,
    lieName: s.lie, pinYards: 0, windRel: 0, windMph: 0, phase: s.phase, meter: null, banner: null, atBall,
  };
}
export function cardView(_s: RoundState, _best: readonly (number | null)[]): CardView {
  return { holes: [], total: 0, toPar: 0, final: false };
}
