// Save Trainer hooks for mowable plants: a "Mowing" tab (counts, mow or regrow around the player, reset the counter) and a
// "Plants" group on the Spawn tab (mow around the crosshair, regrow everything). Trainer mows never count as the player's.
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
import { button, confirmButton, grid, heading, note, status } from '../trainer/ui';
import { markTrainerModified } from '../trainer/mark';
import type { Flora } from './runtime';

export function registerFloraTrainer(flora: Flora): void {
  registerTrainerSection({
    id: 'mowing',
    label: 'Mowing',
    order: 47,
    build(el, ctx) {
      const st = status();
      const s = flora.stats();
      const kinds = Object.entries(s.byKind).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} ${n}`).join(', ');
      const mow = (r: number): void => st.set(`Mowed ${flora.mowAllNear(ctx.player.x, ctx.player.z, r)} plants within ${r} m`);
      el.append(
        st.el,
        heading('Mowing'),
        note(`${s.plants} mowable plants: ${s.standing} standing, ${s.cut} cut, ${s.regrowing} regrowing.`),
        note(`Mowed by you: ${s.mowed} (Lawn Service cuts: ${s.lawn}).`),
        note(kinds ? `By kind: ${kinds}.` : 'Nothing mowed yet.'),
        grid(
          button('Mow all within 40 m', () => mow(40)),
          button('Mow all within 200 m', () => mow(200)),
          button('Regrow everything', () => st.set(`Regrew ${flora.regrowAll()} plants`)),
          confirmButton('Reset Mowed counter', () => {
            flora.resetCounter();
            markTrainerModified('mowed counter');
            st.set('Mowed counter reset');
          }),
        ),
      );
    },
  });
  registerTrainerSpawnable('Plants', 'mow-here', 'Mow 15 m here', (at) => `Mowed ${flora.mowAllNear(at.x, at.z, 15)}`);
  registerTrainerSpawnable('Plants', 'regrow-all', 'Regrow all plants', () => `Regrew ${flora.regrowAll()}`);
}
