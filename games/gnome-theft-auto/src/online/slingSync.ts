// The owner's Sling-Lift delivery chopper and its dangling load, mirrored by everyone near. The owner publishes the
// flight state as one record (id 1); each mirror draws the chopper and rope (createSlingRig) and hangs a remote copy of
// the load from the rope until the owner releases it. The vehicle once it is down is not relayed here: the owner adds
// it to the world and marks it shared, and online/parkSync.ts (SYS.park) gives everyone a parked copy.
import type * as THREE from 'three';
import type { Lockup } from '../lockup/runtime';
import { createSlingRig, type SlingRig } from '../lockup/sling';
import type { SlingPhase, SlingState } from '../lockup/types';
import { Interp } from '@lawn/mp/interp';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import type { Vehicle, VehicleKind } from '../types';
import { VEHICLE_CODES } from '../net';
import type { MirrorEnt, MirrorChanges, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from './hub';
import { qAngle, qPos, SYS, uqAngle, uqPos } from './protocol';

export interface SlingSyncDeps { lockup: Lockup; scene: THREE.Scene }

const PHASES: readonly SlingPhase[] = ['inbound', 'lowering', 'release', 'outbound', 'done'];

/** The entity id of the one flight an owner can have in the air. */
const SLING_ID = 1;

interface View {
  rig: SlingRig;
  state: SlingState;
  interp: Interp;
  load: Vehicle;
  loadGone: boolean;
}

/** Decode the flight state values the interpolator tracks: [hx, hy, hz, heading, loadY]. */
const POS_ANGLE = { pos: [0, 1, 2], angles: [3], snapDist: 80 } as const;

function valuesOf(rec: readonly number[]): number[] {
  return [uqPos(rec[2]), uqPos(rec[3]), uqPos(rec[4]), uqAngle(rec[5]), uqPos(rec[6])];
}

function applyRec(view: View, rec: readonly number[], sentAt: number): void {
  view.state.phase = PHASES[rec[1]] ?? view.state.phase;
  view.state.released = rec[7] === 1;
  view.interp.push(valuesOf(rec), sentAt);
}

export function createSlingSync(link: SyncLink, d: SlingSyncDeps): SyncAdapter {
  void link;
  const live = new Set<View>();

  function disposeView(view: View): void {
    view.rig.dispose();
    if (!view.loadGone) {
      removeVehicle(d.scene, view.load);
      view.loadGone = true;
    }
    live.delete(view);
  }

  function makeView(e: MirrorEnt): View {
    const [, phaseIdx, , , , , , released, kindIdx, tint] = e.rec;
    const [hx, hy, hz, heading, loadY] = valuesOf(e.rec);
    const kind = (VEHICLE_CODES[kindIdx] ?? 'ride-on') as VehicleKind;
    const load = createVehicle(d.scene, kind, hx, hz, heading, tint);
    load.driver = 'remote';
    const state: SlingState = {
      phase: PHASES[phaseIdx] ?? 'inbound',
      t: 0,
      hx, hy, hz, heading, loadY,
      released: released === 1,
    };
    const interp = new Interp(POS_ANGLE);
    interp.push([hx, hy, hz, heading, loadY], e.sentAt);
    return { rig: createSlingRig(d.scene), state, interp, load, loadGone: false };
  }

  return {
    sys: SYS.sling,
    radius: 450,
    hz: 8,

    collect(out: OwnedEnt[], _f: SyncFrame): void {
      void _f;
      const w = d.lockup.slingWire();
      if (!w) return;
      const s = w.state;
      const rec = [
        SLING_ID, PHASES.indexOf(s.phase), qPos(s.hx), qPos(s.hy), qPos(s.hz), qAngle(s.heading), qPos(s.loadY),
        s.released ? 1 : 0, VEHICLE_CODES.indexOf(w.kind), w.tint,
      ];
      out.push({ id: SLING_ID, x: s.hx, z: s.hz, rec });
    },

    receive(ch: MirrorChanges, _f: SyncFrame | null): void {
      void _f;
      for (const e of ch.added) {
        const view = makeView(e);
        e.view = view;
        live.add(view);
      }
      for (const e of ch.changed) {
        const view = e.view as View | undefined;
        if (view) applyRec(view, e.rec, e.sentAt);
      }
      for (const e of ch.removed) {
        const view = e.view as View | undefined;
        if (view) {
          disposeView(view);
          e.view = undefined;
        }
      }
    },

    ownerGone(_owner: number, ents: readonly MirrorEnt[]): void {
      for (const e of ents) {
        const view = e.view as View | undefined;
        if (view) {
          disposeView(view);
          e.view = undefined;
        }
      }
    },

    update(dt: number, _f: SyncFrame): void {
      void _f;
      const out: number[] = [];
      for (const view of live) {
        if (view.interp.sample(out)) {
          view.state.hx = out[0];
          view.state.hy = out[1];
          view.state.hz = out[2];
          view.state.heading = out[3];
          view.state.loadY = out[4];
        }
        view.state.t += dt;
        view.rig.update(view.state, dt);

        if (!view.state.released && !view.loadGone) {
          const { load, state } = view;
          load.x = state.hx;
          load.z = state.hz;
          load.y = state.loadY;
          load.yaw = state.heading;
          load.speed = 0;
          syncVehicleMesh(load, 0);
        } else if (view.state.released && !view.loadGone) {
          removeVehicle(d.scene, view.load);
          view.loadGone = true;
        }
      }
    },

    reset(): void {
      for (const view of [...live]) disposeView(view);
    },
  };
}
