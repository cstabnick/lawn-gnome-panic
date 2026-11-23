// Snares and spikes that catch the Hatless (roadmap 9.2). Step 0 stub: no-op.
import type { Bus } from './bus';
import type { HatlessSystem, PlayerState, SimHost, TrapSystem } from './types';

export function createTrapSystem(deps: { host: SimHost; hatless: HatlessSystem; bus: Bus; getPlayer: () => PlayerState }): TrapSystem {
  return { update: (dt: number): void => { /* roadmap 9.2 */ } };
}
