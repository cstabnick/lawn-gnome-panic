// Each player's activity (emote, fishing rod and bobber, binoculars) as one SYS.act record. The owner publishes its own
// hands; every mirror hands the decoded activity to remotes.setActivity so the remote gnome shows it.
import * as THREE from 'three';
import type { PlayerEmote } from '../anim/playerEmote';
import type { Birding } from '../birding/birding';
import type { Fishing } from '../fishing/fishing';
import type { Remotes } from '../remotes';
import type { Player } from '../types';
import type { MirrorEnt, OwnedEnt } from './replicate';
import type { SyncAdapter, SyncFrame, SyncLink } from './hub';
import { ACT, SYS, decodeActivity, encodeActivity, type RemoteActivity } from './protocol';

export interface ActSyncDeps {
  emote: PlayerEmote;
  fishing: Fishing;
  birding: Birding;
  remotes: Remotes;
  camera: THREE.PerspectiveCamera;
  player: Player;
}

export interface ActSync extends SyncAdapter {
  /** An emote just started on my gnome. */
  noteEmote(id: string): void;
}

export function createActSync(link: SyncLink, d: ActSyncDeps): ActSync {
  void link;
  let emoteId: string | null = null;
  let emoteSeq = 0;
  const set = new Set<number>();
  const v = new THREE.Vector3();

  const apply = (e: MirrorEnt): void => {
    d.remotes.setActivity(e.owner, decodeActivity(e.rec, e.str));
    set.add(e.owner);
  };

  return {
    sys: SYS.act, radius: 300, hz: 8,
    noteEmote(id: string) {
      emoteId = id;
      emoteSeq++;
    },
    collect(out: OwnedEnt[], f: SyncFrame) {
      const w = d.fishing.wire();
      const scope = !w && d.birding.viewing();
      let lookYaw = 0;
      let lookPitch = 0;
      if (scope) {
        d.camera.getWorldDirection(v);
        lookYaw = Math.atan2(v.x, v.z);
        lookPitch = Math.asin(Math.max(-1, Math.min(1, v.y)));
      }
      const a: RemoteActivity = {
        emote: d.emote.active ? emoteId : null,
        emoteSeq,
        mode: w ? ACT.rod : scope ? ACT.scope : ACT.none,
        rod: w?.rod ?? '',
        phase: w?.phase ?? 'idle',
        phaseT: 0,
        charge: w?.charge ?? 0,
        bobber: w?.bobber ?? null,
        lookYaw,
        lookPitch,
      };
      const { rec, str } = encodeActivity(a);
      out.push({ id: 0, x: f.me.x, z: f.me.z, rec, str });
    },
    receive(ch) {
      for (const e of ch.added) apply(e);
      for (const e of ch.changed) apply(e);
      for (const e of ch.removed) {
        d.remotes.setActivity(e.owner, null);
        set.delete(e.owner);
      }
    },
    ownerGone(owner: number) {
      d.remotes.setActivity(owner, null);
      set.delete(owner);
    },
    update() {},
    reset() {
      for (const id of set) d.remotes.setActivity(id, null);
      set.clear();
    },
  };
}
