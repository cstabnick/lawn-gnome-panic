// Shares each region's bubble (its Hatless) between the players in it (roadmap 8.8). Step 0 stub: no-op.
import type { Bus } from '../game/bus';
import type { HatlessSystem, NetSession, SimHost } from '../game/types';
import type { PlayerState } from '../game/types';

export interface BubbleSync { update(dt: number): void }

export function createBubbleSync(deps: { host: SimHost; session: NetSession; hatless: HatlessSystem; getPlayer: () => PlayerState; bus: Bus }): BubbleSync {
  return { update: (dt: number): void => { /* roadmap 8.8 */ } };
}
