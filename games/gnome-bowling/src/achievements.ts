import { createAchievementTracker } from '@lawn/achievements';
import type { Ctx, System } from './config';

export function createAchievements(ctx: Ctx): System {
  const tracker = createAchievementTracker({ ui: ctx.ui });
  let lastSerial = 0;

  return {
    update() {
      const r = ctx.state.result;
      if (!r || r.serial === lastSerial) return;
      lastSerial = r.serial;

      const player = ctx.state.players[r.player];
      if (!player || player.npc || !player.local) return;

      if (r.kind === 'strike' || r.kind === 'double' || r.kind === 'turkey' || r.kind === 'hambone') {
        void tracker.unlock('bowling-all-gnomes-down');
      }
      if (r.kind === 'turkey' || r.kind === 'hambone' || r.streak >= 3) {
        void tracker.unlock('bowling-certified-pilgrim');
      }
      if (r.kind === 'spare') void tracker.unlock('bowling-fist-pump');
      if (r.kind === 'gutter') void tracker.unlock('bowling-facepalm');
      if (r.kind === 'split' && ctx.state.standing.every((up, i) => up === (i === 6 || i === 9))) {
        void tracker.unlock('bowling-7-10-split');
      }
    },
  };
}
