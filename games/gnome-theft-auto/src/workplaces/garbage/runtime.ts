// E25 garbage job runtime: start a round at the depot, drive the Bin Lorry to each bin, lift it, tip the load at the
// heap, get paid. STUB: issue 21 fills it in.
import type { WorkDeps, WorkJobRuntime } from '../types';

export function installGarbage(deps: WorkDeps): WorkJobRuntime {
  void deps;
  return { update() {}, isOpen: () => false, blips: () => [], waypoint: () => null };
}
