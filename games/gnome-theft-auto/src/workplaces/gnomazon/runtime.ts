// E25 Gnomazon job runtime: clock in at a packing station on the FC-1 floor, pack against the quota, get paid.
// STUB: issue 24 fills it in.
import type { WorkDeps, WorkJobRuntime } from '../types';

export function installGnomazon(deps: WorkDeps): WorkJobRuntime {
  void deps;
  return { update() {}, isOpen: () => false, blips: () => [] };
}
