import { createAchievementTracker } from '@lawn/achievements';
import { HOLES, type Ctx, type GameState, type System } from './config';
import { currentHole, hooks, isMyBall, roundTotals } from './round';

export function createAchievements(ctx: Ctx): System {
  const tracker = createAchievementTracker({ ui: ctx.ui });

  let trackedHole = -1;
  let hitFairway = false;
  let hitFromRough = false;

  const resetHole = (holeIndex: number): void => {
    trackedHole = holeIndex;
    hitFairway = false;
    hitFromRough = false;
  };

  hooks.onAchievementFlight = (state: GameState) => {
    if (!isMyBall(state)) return;
    const f = state.flight;
    if (!f) return;

    if (state.holeIndex !== trackedHole) resetHole(state.holeIndex);

    if (state.lie === 'rough') hitFromRough = true;
    if (f.endLie === 'fairway') hitFairway = true;

    if (f.endLie === 'water') {
      void tracker.unlock('golf-ooops');
    }

    if (f.holed) {
      const hole = currentHole(state);
      if (state.strokes === hole.par) {
        void tracker.unlock('golf-nice');
      }
      if (state.lie !== 'green') {
        void tracker.unlock('golf-crisp-in');
      }
      if (!hitFairway && hitFromRough) {
        void tracker.unlock('golf-off-beaten-path');
      }
      const totals = roundTotals(state);
      if (totals.played >= HOLES.length && totals.toPar <= 0) {
        void tracker.unlock('golf-how');
      }
    }
  };

  return {
    update() {
      if (ctx.state.holeIndex !== trackedHole || ctx.state.strokes === 0) {
        resetHole(ctx.state.holeIndex);
      }
    },
  };
}
