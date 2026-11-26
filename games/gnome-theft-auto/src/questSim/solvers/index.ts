// Quest sim: one solver per objective kind. A new objective kind in quests/types.ts makes this table fail to compile
// until it has a solver (and coverage.test.ts names it).
import type { ObjectiveDef } from '../../quests/types';
import type { Solver } from '../types';
import { choiceSolver, crackSolver, visitSolver } from './foot';
import { chaseFollowSolver, convoyAmbushSolver, stealDeliverSolver } from './drive';
import { airDropSolver, bossCombineSolver, surviveDerbySolver } from './action';
import { tessieBuoysSolver, tessieEscortSolver, tessieRideSolver, tessieSightingsSolver } from './tessie';
import { raceSolver } from './race';
import { checkpointsSolver } from './checkpoints';
import { probeSolver } from './probe';
import { inspectSolver, passengerSolver } from './story';

export const SOLVERS: { [K in ObjectiveDef['kind']]: Solver<K> } = {
  crack: crackSolver,
  visit: visitSolver,
  choice: choiceSolver,
  'steal-deliver': stealDeliverSolver,
  'chase-follow': chaseFollowSolver,
  'convoy-ambush': convoyAmbushSolver,
  'air-drop': airDropSolver,
  'survive-derby': surviveDerbySolver,
  'boss-combine': bossCombineSolver,
  'tessie-sightings': tessieSightingsSolver,
  'tessie-buoys': tessieBuoysSolver,
  'tessie-escort': tessieEscortSolver,
  'tessie-ride': tessieRideSolver,
  race: raceSolver,
  checkpoints: checkpointsSolver,
  probe: probeSolver,
  passenger: passengerSolver,
  inspect: inspectSolver,
};

/** The solver for one objective (typed loosely for the runner). */
export function solverFor(obj: ObjectiveDef): Solver {
  return SOLVERS[obj.kind] as unknown as Solver;
}
