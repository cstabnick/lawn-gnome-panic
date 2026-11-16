// src/net/guest.ts: the guest side of online play. Applies the host's snapshots and events to the world, smooths
// everyone else's movement (snapshot interpolation), and sends this browser's own soldier ('me'), shots, damage claims, vehicle entries/exits
// and grenades to the host. The guest's own soldier is moved by player.ts locally; this file only places it once.
import * as THREE from 'three';
import { type Game, type Soldier, type Team, type Vehicle } from '../config';
import { applyClassNow, markDead, placeSpawned } from '../soldiers';
import { spawnGrenade } from '../combat';
import { exitVehicle, simulatedHere } from '../vehicles';
import { applyHumans, lobby, netHooks, netLink, netState, r2, soldierInterp, vehicleInterp } from './state';
import type { Interp } from '@lawn/mp/interp';
import {
  BIT_ADS, BIT_GROUNDED, BIT_SPRINT, CAUSES, CLASS_IDS, ME_HZ, WEAPON_IDS,
  type HostMsg, type MeMsg, type NetEvent,
} from './protocol';

export interface GuestSync {
  /** The host's message. */
  onRelay(from: number, d: HostMsg): void;
  /** Every frame while a guest: smooth everyone else, send 'me' at ME_HZ. */
  update(dt: number): void;
  /** Forget everything about the match (left, lost it, or became host). */
  reset(): void;
}

export function createGuestSync(game: Game): GuestSync {
  let placed = false;
  let applying = false;
  let shots: number[] = [];
  /** Snapshot buffers for everyone else, played back a little in the past (see @lawn/mp/interp). */
  const targets = new Map<number, Interp>();
  const vTargets = new Map<number, Interp>();
  const sOut = [0, 0, 0, 0, 0];
  const vOut = [0, 0, 0, 0];
  let meAcc = 0;

  // Damage claims: core code only calls these on a guest, and only for game.player's own hits.
  netHooks.sendDamage = (c) => netLink.send(netLink.hostId, {
    k: 'dmg', v: c.victim.id, d: r2(c.amount),
    c: CAUSES.indexOf(c.cause), w: c.weapon ? WEAPON_IDS.indexOf(c.weapon) : -1, h: c.headshot ? 1 : 0,
  });
  netHooks.sendVehicleDamage = (id, amount) => netLink.send(netLink.hostId, { k: 'vdmg', v: id, d: r2(amount) });

  // Local actions. Subscribed once; the handler ignores everything unless this guest is placed in a match.
  game.on((e) => {
    if (applying || netState.role !== 'guest' || !placed) return;
    switch (e.type) {
      case 'shot':
        if (e.shooter !== game.player) return;
        if (shots.length >= 120) return;
        shots.push(r2(e.from.x), r2(e.from.y), r2(e.from.z), r2(e.to.x), r2(e.to.y), r2(e.to.z));
        return;
      case 'grenadeThrown':
        if (e.thrower !== game.player) return;
        netLink.send(netLink.hostId, {
          k: 'gren',
          p: [r2(e.pos.x), r2(e.pos.y), r2(e.pos.z)],
          vel: [r2(e.vel.x), r2(e.vel.y), r2(e.vel.z)],
        });
        return;
      case 'enterVehicle':
        if (e.soldier !== game.player) return;
        netLink.send(netLink.hostId, { k: 'enter', v: e.vehicle.id });
        return;
      case 'exitVehicle':
        if (e.soldier !== game.player) return;
        netLink.send(netLink.hostId, { k: 'exit' });
        return;
      default:
        return;
    }
  });

  function S(i: number): Soldier | null {
    return i < 0 ? null : (game.soldiers[i] ?? null);
  }
  function V(i: number): Vehicle | null {
    return i < 0 ? null : (game.vehicles[i] ?? null);
  }
  function vec(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x, y, z);
  }

  function applyEvent(n: NetEvent): void {
    switch (n[0]) {
      case 'shot': {
        const shooter = S(n[1]);
        if (!shooter || shooter === game.player) return;
        game.emit({
          type: 'shot', shooter, weapon: WEAPON_IDS[n[2]],
          from: vec(n[3], n[4], n[5]), to: vec(n[6], n[7], n[8]),
        });
        return;
      }
      case 'hit': {
        const victim = S(n[2]);
        if (!victim) return;
        game.emit({ type: 'hit', shooter: S(n[1]), victim, damage: n[3], headshot: n[4] === 1 });
        return;
      }
      case 'vhit': {
        const vehicle = V(n[2]);
        if (!vehicle) return;
        game.emit({ type: 'vehicleHit', shooter: S(n[1]), vehicle, damage: n[3] });
        return;
      }
      case 'kill': {
        const victim = S(n[2]);
        if (!victim) return;
        if (victim.alive) markDead(victim);
        game.emit({
          type: 'kill', killer: S(n[1]), victim, cause: CAUSES[n[3]],
          weapon: n[4] >= 0 ? WEAPON_IDS[n[4]] : null, headshot: n[5] === 1,
        });
        return;
      }
      case 'spawn': {
        const s = S(n[1]);
        if (!s) return;
        netState.lives.set(s.id, n[7]);
        targets.delete(s.id);
        placeSpawned(game, s, n[2], n[3], n[4], n[5], CLASS_IDS[n[6]]);
        return;
      }
      case 'gren': {
        const thrower = S(n[1]);
        if (!thrower || thrower === game.player) return;
        spawnGrenade(game, thrower, vec(n[2], n[3], n[4]), vec(n[5], n[6], n[7]));
        return;
      }
      case 'vdead': {
        const v = V(n[1]);
        if (!v) return;
        if (v.alive) {
          v.alive = false;
          v.hp = 0;
          v.speed = 0;
          v.respawnT = v.def.respawnS;
          v.model.group.visible = false;
          if (v.driver) {
            v.driver.vehicle = null;
            v.driver = null;
          }
          game.emit({ type: 'explosion', pos: v.pos.clone(), radius: v.def.radius * 2 });
          game.emit({ type: 'vehicleDestroyed', vehicle: v, by: S(n[2]) });
        }
        return;
      }
      case 'enter': {
        const s = S(n[1]);
        const v = V(n[2]);
        if (!s || !v || s === game.player) return;
        s.vehicle = v;
        v.driver = s;
        game.emit({ type: 'enterVehicle', soldier: s, vehicle: v });
        return;
      }
      case 'exit': {
        const s = S(n[1]);
        const v = V(n[2]);
        if (!s || !v || s === game.player) return;
        if (v.driver === s) v.driver = null;
        s.vehicle = null;
        game.emit({ type: 'exitVehicle', soldier: s, vehicle: v });
        return;
      }
      case 'flag': {
        const flag = game.flags[n[1]];
        if (!flag) return;
        if (n[3] === 1) game.emit({ type: 'flagCaptured', flag, team: n[2] as Team });
        else game.emit({ type: 'flagLost', flag, team: n[2] as Team });
        return;
      }
      case 'over':
        game.over = true;
        game.winner = n[1] as Team;
        game.emit({ type: 'gameOver', winner: n[1] as Team });
        return;
    }
  }

  function applySnap(d: HostMsg): void {
    // 1. Human slots, then this browser's own slot if the host has given it one.
    netState.humans = d.hu.map(([soldierId, playerId, name]) => ({ soldierId, playerId, name }));
    applyHumans(game, netLink.me);

    // 2. First placement: move the guest's soldier to the host's spawn, once.
    if (!placed && netState.humans.some((h) => h.playerId === netLink.me)) {
      placed = true;
      const p = game.player;
      const row = d.s[p.id];
      p.pos.set(row[0], row[1], row[2]);
      p.yaw = row[3];
      p.pitch = row[4];
      // applyHumans carried the class picked on the title screen over to p.nextClassId; keep it.
      const pick = p.nextClassId;
      p.classId = CLASS_IDS[row[8]];
      if (row[6] === 0) {
        markDead(p); // respawns as the pick: 'me' sends it to the host as cls
      } else {
        p.alive = true;
        p.hp = row[5];
        p.model.setDead(false);
        // The host switches this soldier to the pick on our first 'me' (host.ts); do the same here.
        applyClassNow(p, pick);
      }
      p.nextClassId = pick;
      lobby.status = 'in';
      netHooks.startMatch?.();
    }

    // 3. Match clock and tickets.
    game.time = d.t;
    game.tickets = [d.tk[0], d.tk[1]];

    // 4. Events, in order. applying is set so our own handlers do not echo them back to the host.
    applying = true;
    try {
      for (const n of d.ev) applyEvent(n);
    } finally {
      applying = false;
    }

    // 5. Flags.
    for (let i = 0; i < d.f.length; i++) {
      const f = game.flags[i];
      if (!f) continue;
      const row = d.f[i];
      f.progress = row[0];
      f.owner = row[1] < 0 ? null : (row[1] as Team);
      f.contested = row[2] === 1;
    }

    // 6. Match over.
    game.over = d.over === 1;
    game.winner = d.win < 0 ? null : (d.win as Team);

    // 7. Soldiers.
    for (let i = 0; i < d.s.length; i++) {
      const row = d.s[i];
      const s = game.soldiers[i];
      if (!s) continue;
      s.kills = row[9];
      s.deaths = row[10];
      s.hp = row[5];

      if (s === game.player) {
        // Only death is taken from the host; player.ts moves this soldier.
        if (row[6] === 0 && s.alive) markDead(s);
        continue;
      }

      s.classId = CLASS_IDS[row[8]] ?? s.classId;
      if (row[6] === 0 && s.alive) markDead(s);
      const revived = row[6] === 1 && !s.alive;
      if (revived) {
        s.alive = true;
        s.model.setDead(false);
      }
      // Position goes into the soldier's playback buffer; update() shows it. It is only copied straight in when
      // the soldier appears (revived or first seen), so it does not slide over from where it died.
      let buf = targets.get(s.id);
      const fresh = revived || !buf;
      if (!buf) {
        buf = soldierInterp();
        targets.set(s.id, buf);
      }
      if (revived) buf.clear();
      buf.push([row[0], row[1], row[2], row[3], row[4]], d.ms);
      if (fresh) {
        s.pos.set(row[0], row[1], row[2]);
        s.yaw = row[3];
        s.pitch = row[4];
      }
      s.sprinting = (row[11] & BIT_SPRINT) !== 0;
      s.grounded = (row[11] & BIT_GROUNDED) !== 0;
      s.ads = (row[11] & BIT_ADS) !== 0;

      // Vehicle seat.
      if (row[7] >= 0) {
        const v = game.vehicles[row[7]];
        if (v) {
          s.vehicle = v;
          v.driver = s;
        }
      } else if (s.vehicle) {
        if (s.vehicle.driver === s) s.vehicle.driver = null;
        s.vehicle = null;
      }
    }

    // 8. Vehicles.
    for (let i = 0; i < d.v.length; i++) {
      const row = d.v[i];
      const v = game.vehicles[i];
      if (!v) continue;
      v.hp = row[4];
      v.team = row[7] as Team;
      if (row[5] === 0 && v.alive) {
        v.alive = false;
        v.model.group.visible = false;
        v.speed = 0;
      }
      if (row[5] === 1 && !v.alive) {
        v.alive = true;
        v.model.group.visible = true;
        v.pos.x = row[0];
        v.pos.z = row[1];
        v.yaw = row[2];
      }
      if (simulatedHere(game, v)) {
        // This browser drives it. If the host handed it to someone else, get out.
        if (row[6] >= 0 && row[6] !== game.player.id) exitVehicle(game, game.player);
      } else {
        let buf = vTargets.get(v.id);
        const fresh = !buf;
        if (!buf) {
          buf = vehicleInterp();
          vTargets.set(v.id, buf);
        }
        buf.push([row[0], row[1], row[2], row[3]], d.ms);
        if (fresh) {
          v.pos.x = row[0];
          v.pos.z = row[1];
          v.yaw = row[2];
          v.speed = row[3];
        }
        v.driver = row[6] >= 0 ? (game.soldiers[row[6]] ?? null) : null;
      }
    }
  }

  return {
    onRelay(_from, d) {
      if (d.k === 'snap') applySnap(d);
    },

    update(dt) {
      if (netState.role !== 'guest') return;
      const now = performance.now();

      // 1. Other soldiers: play back their snapshot buffer.
      for (const s of game.soldiers) {
        if (s === game.player || !s.alive || s.vehicle) continue;
        const buf = targets.get(s.id);
        if (!buf || !buf.sample(sOut, now)) continue;
        if (dt > 0) s.vel.set((sOut[0] - s.pos.x) / dt, (sOut[1] - s.pos.y) / dt, (sOut[2] - s.pos.z) / dt);
        s.pos.set(sOut[0], sOut[1], sOut[2]);
        s.yaw = sOut[3];
        s.pitch = sOut[4];
      }

      // 2. Vehicles this browser does not drive: play back x/z/yaw/speed.
      for (const v of game.vehicles) {
        if (!v.alive || simulatedHere(game, v)) continue;
        const buf = vTargets.get(v.id);
        if (!buf || !buf.sample(vOut, now)) continue;
        v.pos.x = vOut[0];
        v.pos.z = vOut[1];
        v.yaw = vOut[2];
        v.speed = vOut[3];
      }

      // 3. Send this browser's soldier at ME_HZ.
      if (!placed) return;
      meAcc += dt;
      if (meAcc < 1 / ME_HZ) return;
      meAcc = 0;
      const p = game.player;
      const v = p.vehicle;
      const bits = (p.sprinting ? BIT_SPRINT : 0) | (p.grounded ? BIT_GROUNDED : 0) | (p.ads ? BIT_ADS : 0);
      const msg: MeMsg = {
        k: 'me',
        life: netState.lives.get(p.id) ?? 0,
        a: p.alive ? 1 : 0,
        p: [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), r2(p.yaw), r2(p.pitch), bits],
        cls: CLASS_IDS.indexOf(p.nextClassId),
        veh: v ? v.id : -1,
        sh: shots,
        ms: Math.round(performance.now()),
        ...(v ? { vp: [r2(v.pos.x), r2(v.pos.z), r2(v.yaw), r2(v.speed)] as [number, number, number, number] } : {}),
      };
      shots = [];
      netLink.send(netLink.hostId, msg);
    },

    reset() {
      placed = false;
      applying = false;
      shots = [];
      targets.clear();
      vTargets.clear();
      meAcc = 0;
    },
  };
}
