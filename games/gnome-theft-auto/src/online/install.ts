// Online world sync, wired once by app.ts (docs/roadmaps/gta-online-sync.md): the hub plus one adapter per system.
// Offline (no server, ?offline, or alone in the room) the hub does nothing and every system plays exactly as before.
import type * as THREE from 'three';
import { decodeLoadout, defaultLoadout, encodeLoadout, isStockLoadout } from '@lawn/glaze';
import type { Birding } from '../birding/birding';
import { applyVariant, fleetEntry } from '../fleet';
import { createVehicle, damageVehicle, explodeVehicle, repairVehicle, setVehicleLook, syncVehicleMesh } from '../vehicles';
import { createParkSync, type ParkSync } from './parkSync';
import type { Economy } from '../economy';
import type { EventDirector } from '../events/director';
import type { Fishing } from '../fishing/fishing';
import type { Hunting } from '../hunting/hunting';
import type { Lockup } from '../lockup/runtime';
import type { GtaNet } from '../net';
import type { Remotes } from '../remotes';
import type { SkyTraffic } from '../skyTraffic/runtime';
import type { PlayerEmote } from '../anim/playerEmote';
import type { Fx, Hud, Npcs, Player, Sfx, Vehicle, World } from '../types';
import { createActSync, type ActSync } from './actSync';
import { createBirdSync } from './birdSync';
import { createEventSync } from './eventSync';
import { createHub, type Hub } from './hub';
import { createHuntSync } from './huntSync';
import { SYS } from './protocol';
import { createSkySync } from './skySync';
import { createSlingSync } from './slingSync';
import { createSeaSync } from './seaSync';

export interface OnlineDeps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  net: GtaNet;
  hud: Hud;
  economy: Economy;
  fx: Fx;
  play(s: Sfx): void;
  world: World;
  player: Player;
  vehicles: Vehicle[];
  npcs: Npcs;
  remotes: Remotes;
  emote: PlayerEmote;
  fishing: Fishing;
  birding: Birding;
  hunting: Hunting;
  director: EventDirector;
  sky: SkyTraffic;
  lockup: Lockup;
  /** Shoot damage on a vehicle I own, blowing it up at 0 hp (app.ts damageVehicle + blowUp). */
  damage(v: Vehicle, amount: number): void;
  /** Vehicles built at start-up, the same on every client (parked spots, airfield, craft, moored boats): parkSync's stable set. */
  stableVehicles?: readonly Vehicle[];
  /** The vehicle I drive (driver 'player'), or null. */
  driving?(): Vehicle | null;
}

export interface Online {
  readonly hub: Hub;
  /** Stationary vehicles (online/parkSync.ts); null when the deps had no stable set. */
  readonly park: ParkSync | null;
  /** An emote just started on my gnome (createPlayerEmote's onPlay). */
  noteEmote(id: string): void;
  /** Every frame; (x, z) = where I am (my vehicle when driving). away = in a cutscene or the portal (hub.ts). */
  update(dt: number, x: number, z: number, away?: boolean): void;
  /** A player bullet at (x, y, z): true when it hit something mirrored from another player's world. */
  hitTest(x: number, y: number, z: number): boolean;
}

export function installOnline(d: OnlineDeps): Online {
  const hub = createHub({
    net: d.net,
    onPay(n, reason) {
      d.economy.earn(n, reason);
      d.hud.toast(`+${n} Acorns: ${reason}`, 3500);
    },
  });
  const act = hub.register(SYS.act, (link) => createActSync(link, {
    emote: d.emote, fishing: d.fishing, birding: d.birding, remotes: d.remotes, camera: d.camera, player: d.player,
  })) as ActSync;
  hub.register(SYS.quarry, (link) => createHuntSync(link, { hunting: d.hunting }));
  hub.register(SYS.flock, (link) => createBirdSync(link, { birding: d.birding, scene: d.scene }));
  hub.register(SYS.sky, (link) => createSkySync(link, { sky: d.sky, scene: d.scene, fx: d.fx, damage: d.damage }));
  hub.register(SYS.event, (link) => createEventSync(link, {
    director: d.director, scene: d.scene, npcs: d.npcs, vehicles: d.vehicles, fx: d.fx, play: d.play, hud: d.hud, damage: d.damage,
  }));
  hub.register(SYS.sling, (link) => createSlingSync(link, { lockup: d.lockup, scene: d.scene }));
  hub.register(SYS.sea, (link) => createSeaSync(link));
  const stable = d.stableVehicles;
  const driving = d.driving;
  const park = stable && driving ? hub.register(SYS.park, (link) => createParkSync(link, {
    vehicles: d.vehicles,
    stable,
    driving,
    create(kind, x, z, yaw, tint, str) {
      const v = createVehicle(d.scene, kind, x, z, yaw, tint);
      restyle(v, str);
      return v;
    },
    place(v, x, y, z, yaw) {
      v.x = x; v.y = y; v.z = z; v.yaw = yaw;
      v.speed = 0; v.vy = 0; v.knock = undefined; v.sim = undefined;
      syncVehicleMesh(v, 0);
    },
    setHp(v, hp) {
      if (hp > v.hp + 0.01) repairVehicle(v);
      damageVehicle(v, v.hp - hp);
      // A prefab with no damage stages ignores damageVehicle: the hit points must still match, or the two clients'
      // ledgers would claim the vehicle back and forth.
      v.hp = hp;
    },
    wreck(v) {
      explodeVehicle(v);
      d.fx.explode(v.x, v.y + 0.5, v.z);
    },
    show(v, on) {
      if (on) d.scene.add(v.object);
      else d.scene.remove(v.object);
    },
    describe(v) {
      return `${v.variant ?? ''}|${v.look && !isStockLoadout(v.look) ? encodeLoadout(v.look) : ''}`;
    },
    restyle,
  })) as ParkSync : null;
  /** Variant and Glaze look from a `${variant}|${lookCode}` string. */
  function restyle(v: Vehicle, str: string): void {
    const [variant, code] = str.split('|');
    const e = variant ? fleetEntry(variant) : undefined;
    if (e && e.kind === v.kind && v.variant !== e.id) applyVariant(v, e);
    if (v.rig) {
      const look = code ? decodeLoadout(code) : null;
      setVehicleLook(v, look ?? defaultLoadout(v.tint));
    }
  }
  return {
    hub,
    park,
    noteEmote: (id) => act.noteEmote(id),
    update: (dt, x, z, away) => hub.update(dt, x, z, away),
    hitTest: (x, y, z) => hub.hitTest(x, y, z),
  };
}
