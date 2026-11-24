// Sim jobs and tubing in the Save Trainer (trainer/registry.ts): a Jobs tab (go on duty, force a gig, add XP, call or
// take a player cab, tow line, NPC rider) and Spawn-tab buttons (a tow tube, an NPC rider).
import type { Tubing } from '../tubing/types';
import { markTrainerModified } from '../trainer/mark';
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
import { button, grid, heading, note, row, select, status } from '../trainer/ui';
import { JOBS, KIND_LEVEL, type JobDef } from './defs';
import { LAND_PLACES } from './places';
import { JOB_IDS, type GigKind, type Jobs } from './types';

/** A result string shows as is; no result (null / nothing) shows as 'OK'. */
function said(r: string | null | undefined): string {
  return r ?? 'OK';
}

export function registerJobsTrainer(jobs: Jobs, tubing: Tubing): void {
  registerTrainerSection({
    id: 'jobs', label: 'Jobs', order: 47,
    build(el) {
      const st = status();
      const rows: HTMLElement[] = [];

      for (const id of JOB_IDS) {
        const def: JobDef = JOBS[id];
        const kinds = Object.keys(KIND_LEVEL[id]) as GigKind[];
        const kindSel = select([
          { value: '', label: 'Any gig' },
          ...kinds.map((k) => ({ value: k, label: k })),
        ]);
        const dest = select(LAND_PLACES.map((p) => ({ value: p.id, label: p.name })));
        rows.push(
          heading(def.title),
          row(null,
            button('On duty', () => {
              const r = jobs.goOnDuty(id);
              st.set(r ?? 'On duty', r !== null);
            }),
            button('+100 XP', () => { jobs.addXp(id, 100); markTrainerModified('jobs'); st.set('+100 XP'); }),
            button('Go off duty', () => { jobs.goOffDuty(); st.set('Off duty'); }),
          ),
          row('Force gig', kindSel, button('Force', () => {
            const kind = (kindSel.value || undefined) as GigKind | undefined;
            st.set(said(jobs.forceGig(kind)));
          })),
          row('Call a cab to', dest, button('Call', () => st.set(said(jobs.callCab(dest.value))))),
        );
      }

      rows.push(
        heading('Player cabs'),
        note('Take a real player call (taxi duty), or cab to a place as a rider.'),
        grid(button('Take player call', () => st.set(said(jobs.takeCall())))),
        heading('Tubing'),
        note('Drive a boat: tow line out puts the tube rope behind you.'),
        grid(
          button('Tow line out', () => st.set(said(tubing.setTow(true)))),
          button('Tow line in', () => st.set(said(tubing.setTow(false)))),
          button('Add NPC rider', () => st.set(said(tubing.addNpcRider()))),
          button('Hop on a tow', () => st.set(said(tubing.hopOn()))),
          button('Debug', () => st.set(`${JSON.stringify(jobs.debug())} | ${JSON.stringify(tubing.debug())}`)),
        ),
      );

      el.append(st.el, ...rows);
    },
  });

  registerTrainerSpawnable('Jobs', 'tow-tube', 'Tow tube (rental)', () => tubing.spawnTube() ?? 'Tube in the water');
  registerTrainerSpawnable('Jobs', 'npc-rider', 'NPC tube rider', () => tubing.addNpcRider() ?? 'NPC rider hooked on');
  registerTrainerSpawnable('Jobs', 'gig', 'A gig now', () => jobs.forceGig() ?? 'Gig started');
}
