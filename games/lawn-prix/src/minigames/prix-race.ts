// Lawn Prix as a Gnome Party slice: the game's own 3-lap race on the game's own track, four seats at once.
// Built from the game's modules: sim.ts (the race and the CPU driver), scene/trackView (the garden),
// scene/racer (the mower and gnome), scene/camera (the chase camera). Only the glue lives here.
import type { MinigameDef, MinigameView, PadState, SeatInfo, ViewCtx } from '@lawn/party';
import { RACE, type KartState, type RaceState, type VehicleId } from '../config';
import { cpuInput, createRace, racePlaces, stepRace } from '../sim';
import { buildTrack } from '../scene/trackView';
import { createRacer, type Racer } from '../scene/racer';
import { updateChaseCamera } from '../scene/camera';

/** Seats alternate vehicles so both show up in the party: cart on even seats, bike on odd. */
function vehicleFor(seat: number): VehicleId {
  return seat % 2 === 0 ? 'cart' : 'bike';
}

/** Input of one seat: steer -1..1 (+ right), drift held, brake held (throttle is automatic). */
interface I {
  steer: number;
  drift: boolean;
  brake: boolean;
}

const CPU_SKILL = 0.95;
const ORDINALS = ['1st', '2nd', '3rd', '4th'];
/** Display smoothing: snapshots arrive 15 times a second, so ease towards them; snap when this far off (m). */
const SMOOTH_RATE = 15;
const SNAP_DIST = 8;

const def: MinigameDef<RaceState, I> = {
  meta: {
    id: 'prix-race',
    title: 'Lawn Prix',
    game: 'lawn-prix',
    goal: 'Finish 3 laps of the garden first. Stay on the mown stripe.',
    controls: 'Steer with A/D, arrows or a drag; hold Space or the screen to drift, release for a boost.',
    maxSeconds: 90,
  },

  init(seats: readonly SeatInfo[]) {
    return createRace(
      seats.map((seat) => ({ vehicle: vehicleFor(seat.seat), skill: seat.cpu ? CPU_SKILL : 1 })),
      'garden',
      RACE.laps,
    );
  },

  step(s, inputs, dt) {
    stepRace(
      s,
      inputs.map((i) =>
        i ? { steer: Math.max(-1, Math.min(1, i.steer)), throttle: i.brake ? -1 : 1, drift: !!i.drift, item: false } : null,
      ),
      dt,
    );
  },

  cpu(s, seat) {
    const k = cpuInput(s, seat);
    return { steer: k.steer, drift: k.drift, brake: k.throttle < 0 };
  },

  result(s, timeUp) {
    if (!s.over && !timeUp) return null;
    return racePlaces(s);
  },

  createView(ctx: ViewCtx): MinigameView<RaceState, I> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    buildTrack(scene, 'garden');
    renderer.shadowMap.enabled = true;
    camera.far = 400;
    camera.updateProjectionMatrix();

    const racers: Racer[] = seats.map((seat) => createRacer(scene, seat.look, vehicleFor(seat.seat), seat.color));

    // Display copies of the karts, eased towards the latest state. Created from the first state seen.
    let display: KartState[] | null = null;
    let firstFrame = true;

    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;inset:0;pointer-events:none;font:700 22px system-ui;color:#fff;text-shadow:0 2px 4px #000';
    ui.appendChild(overlay);
    const mk = (css: string): HTMLDivElement => {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;${css}`;
      overlay.appendChild(d);
      return d;
    };
    const placeEl = mk('top:12px;left:16px');
    const lapEl = mk('top:44px;left:16px');
    const finEl = mk('top:40%;left:0;right:0;text-align:center;font-size:48px');

    const setText = (el: HTMLElement, text: string): void => {
      if (el.textContent !== text) el.textContent = text;
    };

    function sync(s: Readonly<RaceState>, dt: number): KartState[] {
      display ??= structuredClone(s.karts);
      const out = display;
      const a = 1 - Math.exp(-dt * SMOOTH_RATE);
      s.karts.forEach((src, i) => {
        const d = out[i];
        const { x, z, h, ...rest } = src;
        Object.assign(d, rest);
        const dx = x - d.x;
        const dz = z - d.z;
        if (Math.hypot(dx, dz) > SNAP_DIST) {
          d.x = x;
          d.z = z;
          d.h = h;
        } else {
          d.x += dx * a;
          d.z += dz * a;
          d.h += Math.atan2(Math.sin(h - d.h), Math.cos(h - d.h)) * a;
        }
      });
      return out;
    }

    function updateOverlay(s: Readonly<RaceState>): void {
      if (mySeat === null) {
        setText(placeEl, '');
        setText(lapEl, '');
        setText(finEl, '');
        return;
      }
      const me = s.karts[mySeat];
      const place = racePlaces(s)[mySeat];
      setText(placeEl, `${ORDINALS[place]} / ${seats.length}`);
      setText(lapEl, `LAP ${Math.min(me.lap + 1, s.laps)}/${s.laps}`);
      setText(finEl, me.fin !== null ? `FINISHED ${ORDINALS[place]}!` : '');
    }

    return {
      render(s, dt) {
        const k = sync(s, dt);
        k.forEach((kart, i) => racers[i].update(kart, dt));
        // Watching? Follow the leader.
        const target = mySeat ?? Math.max(0, racePlaces(s).indexOf(0));
        updateChaseCamera(camera, k[target], dt, firstFrame);
        firstFrame = false;
        updateOverlay(s);
      },
      input(pad: Readonly<PadState>): I {
        return { steer: pad.x, drift: pad.a, brake: pad.y < -0.5 };
      },
      dispose() {
        racers.forEach((r) => r.dispose());
        overlay.remove();
      },
    };
  },
};

export default def;
