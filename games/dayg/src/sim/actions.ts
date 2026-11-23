// Applies one sequenced action to the world (every change a player makes). Step 0 stub: player-join is real; roadmap 7.5 does the rest.
import type { ActionEnvelope, ActionResult, PlayerRecord, TickResult, WorldState } from './types';
import type { Streams } from './rng';
import { hashWorld, stepWorld } from './world';

export function applyAction(w: WorldState, s: Streams, env: ActionEnvelope): ActionResult {
  const a = env.action;
  if (a.kind === 'player-join') {
    const rec = w.players[env.player];
    if (rec) {
      rec.online = true;
      rec.lastTick = w.tick;
      return { ok: true };
    }
    const fresh: PlayerRecord = {
      key: env.player, name: a.name, look: a.look, userId: a.userId, region: a.region, online: true,
      joinedTick: w.tick, lastTick: w.tick, acorns: 0, faction: null, notoriety: 0, quests: [],
      done: 0, failed: 0, deaths: 0, skills: {}, bed: null,
    };
    w.players[env.player] = fresh;
    return { ok: true };
  }
  return { ok: false, error: 'stub' };
}
export function tickWorld(w: WorldState, s: Streams): TickResult {
  stepWorld(w, s);
  return { tick: w.tick, arrivals: [], hash: hashWorld(w) };
}
