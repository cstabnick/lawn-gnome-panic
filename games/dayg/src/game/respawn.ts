// Waking up at a haven after a death (roadmap 8.14). Step 0 stub: no-op.
import type { BlockoutMap } from '../world/types';
import type { Collider } from '../world/collide';
import type { Bus } from './bus';
import type { BodySystem, InventorySystem, NeedsSystem, PlayerState, Respawner, SimHost, SkillSystem } from './types';

export function createRespawner(deps: {
  host: SimHost; player: PlayerState; inv: InventorySystem; needs: NeedsSystem; body: BodySystem; skills: SkillSystem; bus: Bus; map: BlockoutMap; collider: Collider;
}): Respawner {
  return { respawn: (at): void => { /* roadmap 8.14 */ } };
}
