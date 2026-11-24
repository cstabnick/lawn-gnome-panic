// NPC sky traffic and the banner plane (docs/roadmaps/gta-online-sync.md, Issue 1.5): the lead spawns the aircraft; each
// owner publishes its own; everyone near mirrors them (smooth, with the same advert) and can shoot them down or tear the
// banner. A mirror is a Vehicle that is not in any vehicle list: it is drawn, never driven, and never hit by the world.
import type * as THREE from 'three';
import { Interp } from '@lawn/mp/interp';
import type { SkyTraffic, SkyNetRec } from '../skyTraffic/runtime';
import { createBanner } from '../skyTraffic/banner';
import type { SkyBanner } from '../skyTraffic/banner';
import { SKY_ADS } from '../skyTraffic/ads';
import { SKY_BEHAVIOURS } from '../skyTraffic/behaviours';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import type { Fx, Vehicle } from '../types';
import { outranks } from './authority';
import type { SyncAdapter, SyncFrame, SyncLink } from './hub';
import type { MirrorChanges, MirrorEnt, OwnedEnt } from './replicate';
import { SYS, qAngle, qPos, qSigned, qUnit, uqAngle, uqPos, uqSigned, uqUnit } from './protocol';
import { VEHICLE_CODES } from '../net';

export interface SkySyncDeps {
  sky: SkyTraffic;
  scene: THREE.Scene;
  fx: Fx;
  /** Shoot damage on a vehicle I own (blows it up at 0 hp). */
  damage(v: Vehicle, amount: number): void;
}

const STATES = ['flying', 'leaving', 'downed', 'wreck'] as const;
/** Mirror-side sample layout: x, y, z, yaw, pitch, roll. */
const SAMPLE_LEN = 6;
/** Command codes sent to the owner. */
const CMD_SHOT = 1;
const CMD_TEAR = 2;
/** Distance (m) inside which a mirrored banner is drawn in detail. */
const DETAIL_RANGE = 300;

/** One mirrored aircraft on this client. */
interface SkyView {
  owner: number;
  id: number;
  v: Vehicle;
  interp: Interp;
  banner: SkyBanner | null;
  /** Last banner flag received (0 none, 1 towing, 2 torn). */
  flag: number;
  /** Last received speed (m/s); the mesh takes it each frame. */
  speed: number;
  /** Last advert id shown on the banner. */
  adId: string;
  /** Behaviour index (SKY_BEHAVIOURS) of the flight. */
  beh: number;
}

export function createSkySync(link: SyncLink, d: SkySyncDeps): SyncAdapter {
  const views = new Set<SkyView>();
  const sample: number[] = new Array<number>(SAMPLE_LEN).fill(0);

  function dispose(view: SkyView): void {
    removeVehicle(d.scene, view.v);
    view.banner?.dispose();
    view.banner = null;
    views.delete(view);
  }

  /** Feeds one received record into a view: the motion sample, the speed, the hp, and the banner. */
  function applyRec(view: SkyView, e: MirrorEnt): void {
    const r = e.rec;
    view.interp.push([
      uqPos(r[3]), uqPos(r[4]), uqPos(r[5]), uqAngle(r[6]), uqSigned(r[7], 1.6), uqSigned(r[8], 1.6),
    ], e.sentAt);
    view.speed = r[10] / 10;
    view.v.hp = uqUnit(r[12]);

    const flag = r[11];
    const adId = e.str ?? '';
    const ad = adId ? SKY_ADS.find((a) => a.id === adId) ?? null : null;

    if (flag === 1 && !view.banner && ad) {
      view.banner = createBanner(d.scene);
      view.banner.setAd(ad);
      view.adId = ad.id;
    } else if (view.banner && ad && ad.id !== view.adId) {
      view.banner.setAd(ad);
      view.adId = ad.id;
    }
    if (flag === 2 && view.banner && !view.banner.torn) view.banner.tearLoose();
    view.flag = flag;
  }

  function addView(e: MirrorEnt): SkyView {
    const r = e.rec;
    const kind = VEHICLE_CODES[r[2]] ?? 'plane';
    const x = uqPos(r[3]);
    const z = uqPos(r[5]);
    const yaw = uqAngle(r[6]);
    const v = createVehicle(d.scene, kind, x, z, yaw);
    v.y = uqPos(r[4]);
    v.driver = 'remote';
    const view: SkyView = {
      owner: e.owner,
      id: e.id,
      v,
      interp: new Interp({ pos: [0, 1, 2], angles: [3, 4, 5], snapDist: 200 }),
      banner: null,
      flag: 0,
      speed: 0,
      adId: '',
      beh: r[1],
    };
    views.add(view);
    applyRec(view, e);
    return view;
  }

  return {
    sys: SYS.sky,
    radius: 650,
    // 2 Hz (docs/roadmaps/gta-multiplayer-audit.md, bandwidth): Interp smooths between records; planes fly steady lines.
    hz: 2,

    collect(out: OwnedEnt[]): void {
      for (const r of d.sky.netList()) {
        if (r.state === 'wreck') continue;
        out.push(ownedOf(r));
      }
    },

    receive(ch: MirrorChanges): void {
      for (const e of ch.added) {
        const existing = e.view as SkyView | undefined;
        if (existing) dispose(existing);
        e.view = addView(e);
      }
      for (const e of ch.changed) {
        const view = e.view as SkyView | undefined;
        if (view) applyRec(view, e);
        else e.view = addView(e);
      }
      for (const e of ch.removed) {
        const view = e.view as SkyView | undefined;
        if (view) dispose(view);
        e.view = undefined;
      }
    },

    command(_from: number, id: number, c: number, a: readonly number[]): void {
      const rec = d.sky.netList().find((r) => r.key === id);
      if (!rec) return;
      // Bounded: one peer message can never do more than a heavy hit (docs/roadmaps/gta-multiplayer-audit.md).
      if (c === CMD_SHOT) d.damage(rec.v, Math.max(0, Math.min(30, a[0] ?? 15)) / 100);
      else if (c === CMD_TEAR) d.sky.tearBanner(id);
    },

    ownerGone(_owner: number, ents: readonly MirrorEnt[], adopt: (x: number, z: number) => boolean): void {
      for (const e of ents) {
        const view = e.view as SkyView | undefined;
        const r = e.rec;
        const state = STATES[r[9]];
        const def = SKY_BEHAVIOURS[r[1]];
        const x = uqPos(r[3]);
        const y = uqPos(r[4]);
        const z = uqPos(r[5]);
        const yaw = uqAngle(r[6]);
        const speed = r[10] / 10;
        if (def && (state === 'flying' || state === 'leaving') && adopt(x, z)) {
          d.sky.adopt(def.id, x, y, z, yaw, speed);
        }
        if (view) dispose(view);
        e.view = undefined;
      }
    },

    update(dt: number, f: SyncFrame): void {
      // There is one banner tow over town: while I can see someone else's, I spawn nothing (after a host leaves, the
      // adopter's banner and the new lead's fresh one were both up: docs/roadmaps/gta-multiplayer-audit.md).
      let towing = false;
      for (const view of views) if (view.flag === 1) towing = true;
      d.sky.setSpawning(f.lead && !towing);
      // Each client flies its own sky until it is online (while it loads, or alone), so on joining two players can both
      // own the same flight (two banner tows). The higher-ranked player's copy wins; mine flies off.
      for (const r of d.sky.netList()) {
        if (r.state !== 'flying') continue;
        const beh = SKY_BEHAVIOURS.findIndex((def) => def.id === r.id);
        for (const view of views) {
          if (view.beh === beh && outranks(view.owner, f.myId, f.hostId)) { d.sky.dismiss?.(r.key); break; }
        }
      }
      for (const view of views) {
        const v = view.v;
        if (view.interp.sample(sample)) {
          v.x = sample[0];
          v.y = sample[1];
          v.z = sample[2];
          v.yaw = sample[3];
          if (v.air) {
            v.air.pitch = sample[4];
            v.air.roll = sample[5];
          }
        }
        v.speed = view.speed;
        syncVehicleMesh(v, dt);

        const banner = view.banner;
        if (banner) {
          const r = v.spec.radius;
          const fx = Math.sin(v.yaw);
          const fz = Math.cos(v.yaw);
          const near = Math.hypot(v.x - f.me.x, v.z - f.me.z) < DETAIL_RANGE;
          banner.update(dt, v.x - fx * r, v.y + 0.5, v.z - fz * r, v.yaw, v.speed, f.now / 1000, near);
          if (banner.torn && banner.gone()) {
            banner.dispose();
            view.banner = null;
          }
        }
      }
    },

    hitTest(x: number, y: number, z: number): boolean {
      for (const view of views) {
        const banner = view.banner;
        if (banner && !banner.torn && banner.hitTest(x, y, z)) {
          link.command(view.owner, view.id, CMD_TEAR);
          d.fx.spark(x, y, z);
          return true;
        }
      }
      for (const view of views) {
        const v = view.v;
        const reach = v.spec.radius;
        const flat = Math.hypot(x - v.x, z - v.z);
        if (flat < reach && y >= v.y - 0.5 && y <= v.y + 1 + reach * 0.6) {
          link.command(view.owner, view.id, CMD_SHOT, [15]);
          d.fx.spark(x, y, z);
          return true;
        }
      }
      return false;
    },

    reset(): void {
      for (const view of [...views]) dispose(view);
      d.sky.setSpawning(true);
    },
  };
}

/**
 * The record an owner publishes for one of its aircraft. Layout: [0] key, [1] behaviour index, [2] VEHICLE_CODES index,
 * [3..5] x/y/z (qPos), [6] yaw (qAngle), [7] pitch, [8] roll (qSigned 1.6), [9] state index, [10] speed (x10),
 * [11] banner flag (0 none, 1 towing, 2 torn), [12] hp (qUnit). str = the advert id.
 */
function ownedOf(r: SkyNetRec): OwnedEnt {
  const b = r.body;
  return {
    id: r.key,
    x: b.x,
    z: b.z,
    rec: [
      r.key,
      SKY_BEHAVIOURS.findIndex((def) => def.id === r.id),
      VEHICLE_CODES.indexOf(r.v.kind),
      qPos(b.x),
      qPos(b.y),
      qPos(b.z),
      qAngle(b.yaw),
      qSigned(b.pitch, 1.6),
      qSigned(b.roll, 1.6),
      STATES.indexOf(r.state),
      Math.round(b.speed * 10),
      r.banner,
      qUnit(r.v.hp),
    ],
    str: r.adId ?? '',
  };
}
