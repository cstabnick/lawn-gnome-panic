// Waking up at a haven after a death (roadmap 8.14). A shattered gnome leaves its gear on its body (the sim's
// `player-died` makes the body container); the player rises again as a new gnome with the same look at a haven.
import { RESPAWN_KIT, SKILL, STAMINA } from '../config';
import type { BlockoutMap, HavenDef } from '../world/types';
import type { Collider } from '../world/collide';
import type { ItemStack, HavenId, NpcId, PlayerKey, WorldState } from '../sim/types';
import { SKILLS } from '../sim/types';
import { HAVEN_REGION } from '../sim/regions';
import { membersOf } from '../sim/factions';
import { subjectOfPlayer, trustOf } from '../sim/social';
import type { Bus } from './bus';
import { createBody } from './body';
import type { BodySystem, InventorySystem, NeedsSystem, PlayerState, Respawner, SimHost, SkillSystem, StackRef } from './types';

const TEACH_TRUST = 0.3;

/** Every stack the gnome carries, with the ref that holds it (hands, worn, then pack). */
function carriedRefs(inv: InventorySystem): { ref: StackRef; stack: ItemStack }[] {
  const out: { ref: StackRef; stack: ItemStack }[] = [];
  const st = inv.state;
  st.hands.forEach((s, i) => { if (s && s.count > 0) out.push({ ref: { where: 'hand', index: i as 0 | 1 }, stack: s }); });
  for (const slot of Object.keys(st.worn) as (keyof typeof st.worn)[]) {
    const s = st.worn[slot];
    if (s && s.count > 0) out.push({ ref: { where: 'worn', slot }, stack: s });
  }
  st.pack.forEach((s, i) => { if (s.count > 0) out.push({ ref: { where: 'pack', index: i }, stack: s }); });
  return out;
}

/** The alive NPC in the player's faction who trusts the player most, above TEACH_TRUST; null when none. */
function teacherFor(w: WorldState, key: PlayerKey): NpcId | null {
  const faction = w.players[key]?.faction;
  if (faction === null || faction === undefined) return null;
  const f = w.factions[faction];
  if (!f) return null;
  const subject = subjectOfPlayer(key);
  let best: NpcId | null = null;
  let bestTrust = TEACH_TRUST;
  for (const id of membersOf(w, f)) {
    const t = trustOf(w, id, subject);
    if (t > bestTrust) { bestTrust = t; best = id; }
  }
  return best;
}

export function createRespawner(deps: {
  host: SimHost; player: PlayerState; inv: InventorySystem; needs: NeedsSystem; body: BodySystem; skills: SkillSystem; bus: Bus; map: BlockoutMap; collider: Collider;
}): Respawner {
  const { host, player, inv, needs, body, skills, bus, map, collider } = deps;

  // Shattered: the sim keeps the gear in a body container; the gnome's own inventory is emptied.
  bus.on('player-shattered', (e) => {
    const carried = carriedRefs(inv).map((c) => ({ ...c.stack }));
    host.apply({ kind: 'player-died', cause: e.cause, region: player.region, carried });
    for (const c of carriedRefs(inv).reverse()) inv.take(c.ref, c.stack.count);
  });

  return {
    respawn(at: HavenId): void {
      const w = host.world;
      const me = host.me;
      const teacher = teacherFor(w, me);
      const oldXp = { ...skills.xp };

      host.apply({ kind: 'respawn', at, teacher });

      const def: HavenDef | undefined = map.havens.find((h) => h.id === at);
      const r = def ? def.rect : null;
      const x = r ? (r.x0 + r.x1) / 2 : map.playerSpawn.x;
      const z = r ? (r.z0 + r.z1) / 2 : map.playerSpawn.z;
      const y = collider.groundAt(x, z, 1e6);
      player.pos.set(x, y, z);
      player.vel.set(0, 0, 0);
      player.grounded = true;
      player.climbing = null;
      player.vaulting = 0;
      player.fallFromY = null;
      player.speed = 0;
      player.stamina = STAMINA.max;
      player.alive = true;
      player.region = HAVEN_REGION[at] ?? null;
      player.haven = at;

      needs.state.warmth = 100;
      needs.state.water = 100;
      needs.state.food = 100;
      needs.state.calm = 100;

      Object.assign(body.state, createBody());

      for (const s of RESPAWN_KIT) inv.add({ ...s });

      const lineage: Partial<Record<(typeof SKILLS)[number], number>> = {};
      if (teacher !== null) for (const s of SKILLS) lineage[s] = (oldXp[s] ?? 0) * SKILL.lineageShare;
      skills.load(lineage);

      bus.emit('respawned', { at, taught: teacher !== null });
    },
  };
}
