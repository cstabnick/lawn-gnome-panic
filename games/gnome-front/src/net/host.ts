// src/net/host.ts: the host side of online play. The host's browser runs the whole match. This file gives each
// human a soldier slot, applies the guests' messages to their soldiers, smooths the remote humans' movement, and
// sends a snapshot with the latest events to everyone SNAP_HZ times a second.
import * as THREE from 'three';
import { weaponOf, type Game, type Soldier } from '../config';
import { applyClassNow, damageSoldier } from '../soldiers';
import { damageVehicle, enterVehicle, exitVehicle, simulatedHere } from '../vehicles';
import { spawnGrenade } from '../combat';
import { applyHumans, freeSlot, lobby, netLink, netState, r2, soldierInterp, vehicleInterp } from './state';
import type { Interp } from '@lawn/mp/interp';
import {
  BIT_ADS, BIT_GROUNDED, BIT_SPRINT, CAUSES, CLASS_IDS, encodeEvent, SNAP_HZ, WEAPON_IDS,
  type GuestMsg, type NetEvent, type SnapMsg, type SoldierSnap, type VehicleSnap, type FlagSnap,
} from './protocol';

export interface HostSync {
  /** Makes netState.humans match netLink.roster (keeps existing slots, frees slots of players who left, gives new players a slot), then applyHumans. */
  reconcile(): void;
  /** A guest's message. */
  onRelay(from: number, d: GuestMsg): void;
  /** Every frame while hosting: smooth remote humans and their vehicles, send snapshots at SNAP_HZ. */
  update(dt: number): void;
  /** Forget everything about the match (left or lost it). */
  reset(): void;
}

/** A remote human's 'me' playback buffer ([x, y, z, yaw, pitch]) and their latest movement bits. */
interface SoldierTarget { buf: Interp; bits: number; life: number }

/** Events kept for the next snapshot; past this many, the oldest 'shot' events are dropped. */
const MAX_PENDING = 600;

export function createHostSync(game: Game): HostSync {
  /** Events since the last snapshot. */
  let pending: NetEvent[] = [];
  /** 'me' playback per remote soldier, keyed by soldier id. */
  const targets = new Map<number, SoldierTarget>();
  /** Playback ([x, z, yaw, speed]) per vehicle driven by a remote human, keyed by vehicle id. */
  const vTargets = new Map<number, Interp>();
  const sOut = [0, 0, 0, 0, 0];
  const vOut = [0, 0, 0, 0];
  let snapAcc = 0;
  /** Players given a slot whose class pick has not arrived yet: their first 'me' switches the slot to it right away. */
  const freshSlots = new Set<number>();

  game.on((e) => {
    if (netState.role !== 'host' || lobby.status !== 'in') return;
    if (e.type === 'spawn') {
      netState.lives.set(e.soldier.id, (netState.lives.get(e.soldier.id) ?? 0) + 1);
    }
    const n = encodeEvent(e, (id) => netState.lives.get(id) ?? 0);
    if (!n) return;
    pending.push(n);
    const excess = pending.length - MAX_PENDING;
    if (excess > 0) {
      let toDrop = excess;
      pending = pending.filter((ev) => {
        if (toDrop > 0 && ev[0] === 'shot') {
          toDrop--;
          return false;
        }
        return true;
      });
    }
  });

  function buildSnap(): SnapMsg {
    return {
      k: 'snap',
      t: r2(game.time),
      ms: Math.round(performance.now()),
      tk: [Math.ceil(game.tickets[0]), Math.ceil(game.tickets[1])],
      over: game.over ? 1 : 0,
      win: game.winner === null ? -1 : game.winner,
      hu: netState.humans.map((h): [number, number, string] => [h.soldierId, h.playerId, h.name]),
      s: game.soldiers.map((s): SoldierSnap => [
        r2(s.pos.x), r2(s.pos.y), r2(s.pos.z), r2(s.yaw), r2(s.pitch), Math.round(s.hp),
        s.alive ? 1 : 0, s.vehicle ? s.vehicle.id : -1, CLASS_IDS.indexOf(s.classId), s.kills, s.deaths,
        (s.sprinting ? BIT_SPRINT : 0) | (s.grounded ? BIT_GROUNDED : 0) | (s.ads ? BIT_ADS : 0),
      ]),
      v: game.vehicles.map((v): VehicleSnap => [
        r2(v.pos.x), r2(v.pos.z), r2(v.yaw), r2(v.speed), Math.round(v.hp), v.alive ? 1 : 0,
        v.driver ? v.driver.id : -1, v.team,
      ]),
      f: game.flags.map((f): FlagSnap => [r2(f.progress), f.owner === null ? -1 : f.owner, f.contested ? 1 : 0]),
      ev: pending,
    };
  }

  function reconcile(): void {
    const roster = netLink.roster;
    const me = netLink.me;

    // 2. Keep only slots whose player is still in the match.
    netState.humans = netState.humans.filter((h) => roster.some((p) => p.id === h.playerId));

    // 3. Give me my own slot (the soldier this browser controls).
    if (!netState.humans.some((h) => h.playerId === me)) {
      const mine = roster.find((p) => p.id === me);
      netState.humans.push({ soldierId: game.player.id, playerId: me, name: mine ? mine.name : 'YOU' });
    }
    applyHumans(game, me);

    // 5. Give every other player in join order a free bot slot.
    for (const p of roster) {
      if (netState.humans.some((h) => h.playerId === p.id)) continue;
      const s = freeSlot(game);
      if (!s) break;
      if (s.vehicle) exitVehicle(game, s);
      netState.humans.push({ soldierId: s.id, playerId: p.id, name: p.name });
      freshSlots.add(p.id);
      applyHumans(game, me);
    }

    // 6. Forget targets of soldiers and vehicles that are no longer remote-driven.
    for (const id of [...targets.keys()]) {
      if (!game.soldiers[id]?.remote) targets.delete(id);
    }
    for (const id of [...vTargets.keys()]) {
      const v = game.vehicles[id];
      if (!v || !v.alive || !v.driver || !v.driver.remote) vTargets.delete(id);
    }
  }

  function onRelay(from: number, d: GuestMsg): void {
    const slot = netState.humans.find((h) => h.playerId === from);
    if (!slot) return;
    const s = game.soldiers[slot.soldierId];
    if (!s) return;

    switch (d.k) {
      case 'me': {
        const cls = CLASS_IDS[d.cls];
        if (cls) {
          s.nextClassId = cls;
          // A bot slot a guest just took keeps the bot's class otherwise: use the class the guest picked on the title screen.
          if (freshSlots.delete(from) && d.a === 1 && s.alive && s.classId !== cls) applyClassNow(s, cls);
        }
        // Ignore the rest unless the guest thinks it is alive, the soldier is alive, and the life matches.
        if (d.a !== 1 || !s.alive || d.life !== (netState.lives.get(s.id) ?? 0)) return;

        let t = targets.get(s.id);
        const fresh = !t;
        if (!t) {
          t = { buf: soldierInterp(), bits: 0, life: d.life };
          targets.set(s.id, t);
        }
        if (t.life !== d.life) {
          // A new life: start from the spawn point instead of sliding over from where the last one died.
          t.life = d.life;
          t.buf.clear();
        }
        t.buf.push([d.p[0], d.p[1], d.p[2], d.p[3], d.p[4]], d.ms);
        t.bits = d.p[5];
        if (fresh) {
          s.pos.set(d.p[0], d.p[1], d.p[2]);
          s.yaw = d.p[3];
          s.pitch = d.p[4];
        }

        if (d.veh >= 0 && d.vp && s.vehicle && s.vehicle.id === d.veh) {
          let vb = vTargets.get(d.veh);
          if (!vb) {
            vb = vehicleInterp();
            vTargets.set(d.veh, vb);
          }
          vb.push([d.vp[0], d.vp[1], d.vp[2], d.vp[3]], d.ms);
        }

        for (let i = 0; i + 5 < d.sh.length; i += 6) {
          game.emit({
            type: 'shot',
            shooter: s,
            weapon: weaponOf(s).id,
            from: new THREE.Vector3(d.sh[i], d.sh[i + 1], d.sh[i + 2]),
            to: new THREE.Vector3(d.sh[i + 3], d.sh[i + 4], d.sh[i + 5]),
          });
        }
        return;
      }
      case 'dmg': {
        const victim = game.soldiers[d.v];
        if (!victim) return;
        const amount = Math.min(Math.max(d.d, 0), 1000);
        damageSoldier(
          game, victim, amount, s, CAUSES[d.c] ?? 'gun', d.h === 1,
          d.w >= 0 ? (WEAPON_IDS[d.w] ?? null) : null,
        );
        return;
      }
      case 'vdmg': {
        const v = game.vehicles[d.v];
        if (v) damageVehicle(game, v, Math.min(Math.max(d.d, 0), 2000), s);
        return;
      }
      case 'enter': {
        const v = game.vehicles[d.v];
        if (v && v.alive && !v.driver && s.alive && !s.vehicle) enterVehicle(game, s, v);
        return;
      }
      case 'exit': {
        if (s.vehicle) exitVehicle(game, s);
        return;
      }
      case 'gren': {
        if (s.alive) {
          spawnGrenade(game, s, new THREE.Vector3(d.p[0], d.p[1], d.p[2]), new THREE.Vector3(d.vel[0], d.vel[1], d.vel[2]));
        }
        return;
      }
    }
  }

  function update(dt: number): void {
    if (netState.role !== 'host') return;

    // 1. Play back remote humans from their 'me' buffers.
    const now = performance.now();
    for (const s of game.soldiers) {
      if (!s.remote || !s.alive) continue;
      const t = targets.get(s.id);
      if (!t || !t.buf.sample(sOut, now)) continue;
      s.yaw = sOut[3];
      s.pitch = sOut[4];
      // Seated soldiers: updateSoldiers puts them on the vehicle, so only the look direction comes from the buffer.
      if (s.vehicle) continue;
      if (dt > 0) s.vel.set((sOut[0] - s.pos.x) / dt, (sOut[1] - s.pos.y) / dt, (sOut[2] - s.pos.z) / dt);
      s.pos.set(sOut[0], sOut[1], sOut[2]);
      s.sprinting = (t.bits & BIT_SPRINT) !== 0;
      s.grounded = (t.bits & BIT_GROUNDED) !== 0;
      s.ads = (t.bits & BIT_ADS) !== 0;
    }

    // 2. Play back vehicles driven by remote humans (their driver's browser moves them; this side only follows).
    for (const v of game.vehicles) {
      if (!v.alive || simulatedHere(game, v)) continue;
      const buf = vTargets.get(v.id);
      if (!buf || !buf.sample(vOut, now)) continue;
      v.pos.x = vOut[0];
      v.pos.z = vOut[1];
      v.yaw = vOut[2];
      v.speed = vOut[3];
      // v.pos.y is left alone: updateVehicles sets it from the terrain.
    }

    // 3. Send a snapshot SNAP_HZ times a second.
    snapAcc += dt;
    if (snapAcc >= 1 / SNAP_HZ) {
      snapAcc = 0;
      netLink.send(null, buildSnap());
      pending = [];
    }
  }

  function reset(): void {
    pending = [];
    freshSlots.clear();
    targets.clear();
    vTargets.clear();
    snapAcc = 0;
  }

  return { reconcile, onRelay, update, reset };
}
