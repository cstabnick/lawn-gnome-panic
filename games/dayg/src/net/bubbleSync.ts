// Shares each region's bubble (its Hatless) between the players in it (roadmap 8.8). The bubble owner runs the
// Hatless and sends their state to the viewers; a viewer shows them as puppets, queues its hits for the owner and
// turns the owner's scratches into hits on itself. Solo, or with no bubble, nothing is sent.
import type { Bus } from '../game/bus';
import type { HatlessSystem, NetSession, PlayerState, SimHost } from '../game/types';
import { bubbleOf } from '../sim/bubbles';
import { NET } from '../config';
import type { DaygMsg, Pose } from './protocol';

export interface BubbleSync { update(dt: number): void }

export function createBubbleSync(deps: { host: SimHost; session: NetSession; hatless: HatlessSystem; getPlayer: () => PlayerState; bus: Bus }): BubbleSync {
  const { host, session, hatless, bus } = deps;
  const poses = new Map<number, Pose>();   // newest pose per session id: where the viewers stand
  const period = 1 / NET.hatlessHz;
  let authority: boolean | null = null;    // last value given to hatless.setAuthority
  let sendAcc = 0;

  session.onMessage((from: number, m: DaygMsg) => {
    const b = bubbleOf(host.world, host.me);
    switch (m.t) {
      case 'pose':
        poses.set(from, m.p);
        return;
      case 'hl':
        // Viewer: the owner's list, for my bubble's region.
        if (b && b.owner !== host.me && m.r === b.region && session.idOf(b.owner) === from) hatless.applyRemote(m.l);
        return;
      case 'hit': {
        // Owner: a viewer's hit on one of the bubble's Hatless.
        if (!b || b.owner !== host.me || m.r !== b.region) return;
        const key = session.keyOf(from);
        if (key === null || !b.viewers.includes(key)) return;
        hatless.strike({ x: m.x, y: m.y, z: m.z }, m.f, m.reach, m.dmg);
        return;
      }
      case 'scratch':
        // Viewer: one of the owner's Hatless scratched me.
        if (b && b.owner !== host.me && session.idOf(b.owner) === from) {
          bus.emit('player-hit', { strength: m.strength, from: { x: m.x, z: m.z } });
        }
        return;
      default:
        return;
    }
  });

  // Owner: the viewers' latest poses are targets the Hatless may go for, besides me.
  hatless.setExtraTargets(() => {
    const b = bubbleOf(host.world, host.me);
    if (!b || b.owner !== host.me) return [];
    const out: { key: string; pos: { x: number; y: number; z: number } }[] = [];
    for (const key of b.viewers) {
      const id = session.idOf(key);
      const p = id === null ? undefined : poses.get(id);
      if (p) out.push({ key, pos: { x: p.x, y: p.y, z: p.z } });
    }
    return out;
  });

  // Owner: a scratch on a viewer's gnome goes to that viewer.
  hatless.onRemoteScratch((key, strength, from) => {
    const id = session.idOf(key);
    if (id !== null) session.send(id, { t: 'scratch', strength, x: from.x, z: from.z });
  });

  return {
    update(dt: number): void {
      const b = bubbleOf(host.world, host.me);
      // Solo, no bubble, or I own the bubble: I run the Hatless. A viewer gets puppets.
      const mine = !b || b.owner === host.me;
      if (mine !== authority) {
        authority = mine;
        hatless.setAuthority(mine);
      }
      if (!b) return;
      if (mine) {
        if (b.owner !== host.me || b.viewers.length === 0) return;
        sendAcc += dt;
        if (sendAcc < period) return;
        sendAcc = 0;
        const list = hatless.exportState();
        for (const key of b.viewers) {
          const id = session.idOf(key);
          if (id !== null) session.send(id, { t: 'hl', r: b.region, l: list });
        }
        return;
      }
      // Viewer: my queued hits go to the owner.
      const strikes = hatless.drainStrikes();
      const ownerId = session.idOf(b.owner);
      if (ownerId === null) return;
      for (const s of strikes) session.send(ownerId, { t: 'hit', r: b.region, x: s.x, y: s.y, z: s.z, f: s.f, reach: s.reach, dmg: s.dmg });
    },
  };
}
