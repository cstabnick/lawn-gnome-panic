// The Unmown checklist as a Gnomlet app (E31): a touch-friendly list of the twelve entries, ticked or not, with the
// rangers' hints. Stub (E31 foundation): issue B6 fills it. Keep the exported signature.
import type { ChecklistStore } from './checklist';

/** Registers the 'unmown-checklist' Gnomlet app (group 'journals'). Called once from living/runtime.ts. */
export function registerChecklistApp(store: ChecklistStore): void {
  void store;
}
