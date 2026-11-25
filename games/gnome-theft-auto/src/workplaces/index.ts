// E24 workplace jobs: the chef at the Route South Acorn Diner (chef/), the mechanic at Pay 'n' Glaze (mechanic/) and the
// comedian at Le Petit Groan in Pardonlin (comedy/). app.ts calls installWorkplaces once. Plan: docs/roadmaps/gta-batch-3/E24/.
import type { Blip } from '../types';
import { installChef } from './chef/runtime';
import { installComedy } from './comedy/runtime';
import { installMechanic } from './mechanic/runtime';
import { shiftCardOpen } from './shiftCard';
import type { WorkDeps, WorkJobRuntime } from './types';

export interface Workplaces {
  update(dt: number): void;
  /** A workplace UI or staged scene is up: hold the player's controls. */
  isOpen(): boolean;
  blips(): Blip[];
}

export function installWorkplaces(deps: WorkDeps): Workplaces {
  const jobs: WorkJobRuntime[] = [installChef(deps), installMechanic(deps), installComedy(deps)];
  return {
    update(dt) { for (const j of jobs) j.update(dt); },
    isOpen: () => shiftCardOpen() || jobs.some((j) => j.isOpen()),
    blips: () => jobs.flatMap((j) => j.blips()),
  };
}
