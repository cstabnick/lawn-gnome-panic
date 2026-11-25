// E24 workplace jobs: the chef at the Route South Acorn Diner (chef/), the mechanic at Pay 'n' Glaze (mechanic/) and the
// comedian at Le Petit Groan in Pardonlin (comedy/). app.ts calls installWorkplaces once. Plan: docs/roadmaps/gta-batch-3/E24/.
// E25 adds the bin crew (garbage/), the fire brigade (firefighter/) and Gnomazon FC-1 (gnomazon/). Plan: .../E25/.
import type { Blip } from '../types';
import './chef/kitchen';
import './comedy/club';
import './gnomazon/warehouse';
import { installChef } from './chef/runtime';
import { installComedy } from './comedy/runtime';
import { installFirefighter } from './firefighter/runtime';
import { installGarbage } from './garbage/runtime';
import { installGnomazon } from './gnomazon/runtime';
import { installMechanic } from './mechanic/runtime';
import { shiftCardOpen } from './shiftCard';
import type { WorkDeps, WorkJobRuntime, WorkWaypoint } from './types';

export interface Workplaces {
  update(dt: number): void;
  /** A workplace UI or staged scene is up: hold the player's controls. */
  isOpen(): boolean;
  blips(): Blip[];
  /** E25: the first job's route target (bin, fire, depot), or null. */
  waypoint(): WorkWaypoint | null;
}

export function installWorkplaces(deps: WorkDeps): Workplaces {
  const jobs: WorkJobRuntime[] = [
    installChef(deps), installMechanic(deps), installComedy(deps),
    installGarbage(deps), installFirefighter(deps), installGnomazon(deps),
  ];
  return {
    update(dt) { for (const j of jobs) j.update(dt); },
    isOpen: () => shiftCardOpen() || jobs.some((j) => j.isOpen()),
    blips: () => jobs.flatMap((j) => j.blips()),
    waypoint() {
      for (const j of jobs) {
        const w = j.waypoint?.();
        if (w) return w;
      }
      return null;
    },
  };
}
