// The Animations tab of the Save Trainer: play any gnome animation by id on the player, or stop it. Nothing is saved.
import { ANIM_TABS, listAnims } from '../../anim/index';
import { closeTrainerPanel } from '../panel';
import { registerTrainerSection } from '../registry';
import type { TrainerCtx } from '../types';
import { button, grid, heading, note, row, status } from '../ui';

export function registerAnimationSection(): void {
  registerTrainerSection({
    id: 'animations',
    label: 'Animations',
    order: 70,
    build(el: HTMLElement, ctx: TrainerCtx) {
      const st = status();
      el.append(st.el);
      el.append(note('Plays on the gnome when standing on foot. Close the trainer to watch; moving stops it.'));
      el.append(row(null,
        button('Stop', () => ctx.emote.stop()),
        button('Close to watch', () => closeTrainerPanel()),
      ));

      for (const tab of ANIM_TABS) {
        const anims = listAnims({ category: tab.category });
        if (anims.length === 0) continue;
        el.append(heading(tab.title));
        el.append(grid(...anims.map((a) => button(`${a.icon} ${a.label}`, () => {
          if (ctx.player.vehicle) {
            st.set('Get out of the vehicle first.', true);
            return;
          }
          if (!ctx.emote.play(a.id)) {
            st.set(`Could not play ${a.id}`, true);
            return;
          }
          st.set(`Playing ${a.label}${a.loop ? ' (loops)' : ''}`);
        }, a.id))));
      }
    },
  });
}
