// Gnome Golf's party slice "Golf Hole": the game's stroke play together mode (together.ts) for four gnomes on one
// random par 3 of the island; fewest strokes wins. The rules (tee line, strokes, water, pickup, places), the big
// ball, the course and its light are the game's own. What is left here is the party glue: the shots counter, the
// CPU's timing and wobble, the drag/hold controls and the camera. The view replays each flight from its stored inputs.
import * as THREE from 'three';
import { createGnomeModel, type PlayerState } from '@lawn/gnome';
import { seedFrom, type MinigameDef, type MinigameView, type PadState, type SliceReport, type ViewCtx } from '@lawn/party';
import { HOLES, LOOK, type ShotResult, type Wind } from '../config';
import { heightAt } from '../course';
import { setCarts } from '../obstacles';
import { seededWind, yawTo } from '../round';
import { buildBigBall } from '../ball';
import {
  canStrike, caddieShot, clubOf, distToPin, holeDone, pickupAt, placeBalls, replayFlight, settleBalls, strokeBall, teeBalls,
  type TogetherBall, type TogetherFlight,
} from '../together';
import { addSkyAndSun, buildCourse } from '../world';

const ROUND_S = 75;
/** The power meter rises 0 -> 1 and falls back in this many seconds. */
const METER_CYCLE_S = 1.4;
/** A CPU waits this long at rest before it plays again. */
const CPU_WAIT_S = 1.2;

export interface Ball extends TogetherBall {
  /** The highest shots counter this ball has answered. */
  lastShots: number;
}
export interface HoleState { hole: number; wind: Wind; t: number; balls: Ball[] }
export interface HoleInput { yaw: number; power: number; shots: number }

const def: MinigameDef<HoleState, HoleInput> = {
  meta: {
    id: 'golf-hole',
    title: 'Golf Hole',
    game: 'gnome-golf',
    goal: 'Sink it in the fewest strokes on one par 3.',
    controls: 'Drag sideways to aim and pull back for power, release to swing (keys: ←/→ aim, hold Space for power).',
    maxSeconds: ROUND_S,
  },

  init(seats, rng) {
    setCarts([]); // no carts on this hole
    const par3 = HOLES.flatMap((h, i) => (h.par === 3 ? [i] : []));
    const hole = par3[Math.floor(rng() * par3.length)];
    const w = seededWind(seedFrom(Math.floor(rng() * 0x7fffffff)), hole);
    return {
      hole,
      wind: { yaw: Math.round(w.yaw * 1000) / 1000, mph: w.mph },
      t: 0,
      balls: teeBalls(hole, seats.length).map((b) => ({ ...b, lastShots: 0 })),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    settleBalls(s.balls, s.t, dt);
    s.balls.forEach((b, k) => {
      const i = inputs[k];
      // A counter that grew since the last answer asks for one stroke. Asked during a flight, it is dropped.
      if (i && i.shots > b.lastShots) {
        b.lastShots = i.shots;
        strokeBall(b, i.yaw, i.power, s.hole, s.wind, s.t, rng);
      }
    });
  },

  cpu(s, seat, rng) {
    const b = s.balls[seat];
    const ideal = caddieShot(b, s.hole);
    if (!canStrike(b, s.hole) || b.restT <= CPU_WAIT_S) return { yaw: ideal.yaw, power: 0, shots: b.lastShots };
    return {
      yaw: ideal.yaw + (rng() - 0.5) * 0.08,
      power: Math.min(1, ideal.power * (1 + (rng() - 0.5) * 0.12)),
      shots: b.lastShots + 1,
    };
  },

  result(s, timeUp) {
    if (!timeUp && !holeDone(s.balls, s.hole)) return null;
    return placeBalls(s.balls, s.hole);
  },

  report(s) {
    const par = HOLES[s.hole].par;
    const values = s.balls.map((b) => ({
      strokes: b.holed ? b.strokes : null,
      left: b.holed ? null : Math.round(distToPin(b, s.hole) * 10) / 10,
      par,
    }));
    const notes = s.balls.map((b): string | null => {
      if (!b.holed) return b.strokes >= pickupAt(s.hole) ? 'Picked up' : 'Not holed';
      if (b.strokes === 1) return 'Hole in one!';
      if (b.strokes - par <= -2) return 'Eagle';
      if (b.strokes - par === -1) return 'Birdie';
      return null;
    });
    const stats: SliceReport['stats'] = [
      { key: 'strokes', label: 'Strokes', format: 'int', better: 'lower' },
      { key: 'left', label: 'Left to pin', unit: 'yd', format: '1dp', better: 'lower' },
      { key: 'par', label: 'Par', format: 'int' },
    ];
    return { stats, values, notes };
  },

  createView(ctx: ViewCtx): MinigameView<HoleState, HoleInput> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    setCarts([]); // the view replays shots without running init, so it clears the carts here too
    camera.far = LOOK.cameraFar;
    camera.updateProjectionMatrix();
    const { sun } = addSkyAndSun(scene, renderer);
    const course = buildCourse(scene, renderer);

    const balls = seats.map((seat) => buildBigBall(scene, seat.color));
    const gnomes = seats.map((seat) => {
      const model = createGnomeModel(seat.look);
      scene.add(model.object);
      const pose: PlayerState = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 };
      return { model, pose, placed: false };
    });

    // The aim line: a row of dots along the yaw, 2.5 yd apart.
    const dotGeo = new THREE.SphereGeometry(0.2, 6, 4);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dots = Array.from({ length: 12 }, () => {
      const d = new THREE.Mesh(dotGeo, dotMat);
      d.visible = false;
      scene.add(d);
      return d;
    });

    const panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;left:0;right:0;bottom:8%;text-align:center;font:600 18px system-ui;color:#fff;text-shadow:0 2px 4px #000;pointer-events:none';
    const label = document.createElement('div');
    const scoreLine = document.createElement('div');
    scoreLine.style.cssText = 'font:500 14px system-ui;opacity:.9;margin-top:4px';
    const bar = document.createElement('div');
    bar.style.cssText = 'margin:8px auto 0;width:min(60vw,320px);height:12px;background:rgba(0,0,0,.4);border-radius:6px;overflow:hidden';
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;width:0;background:linear-gradient(90deg,#7bd35a,#f2c230,#e5484d)';
    bar.appendChild(fill);
    panel.append(label, bar, scoreLine);
    ui.appendChild(panel);

    let yaw = 0;
    let aimed = false;
    let wasAtRest = true;
    let shots = 0;
    let charging = false;
    let chargeT = 0;
    let meter = 0;
    let releasePower = 0;
    let lastDt = 1 / 60;
    let lastPointerX: number | null = null;
    // Pointer mode (a held pointer): pullY0 is where the press began, pull is the pull-back power, pointerWas the last frame's state.
    let pullY0 = 0;
    let pull = 0;
    let pointerWas = false;
    let camReady = false;
    // Each cached replay keeps its own clock (el): s arrives 15 times a second online, so the clock runs on render time and only snaps when it drifts.
    const replays: ({ t0: number; sim: ShotResult; el: number } | null)[] = seats.map(() => null);

    // The trajectory of a flight, simulated once per flight (keyed by its start time) with the same inputs the host used.
    const replayOf = (k: number, f: TogetherFlight, s: Readonly<HoleState>) => {
      const hit = replays[k];
      if (hit && hit.t0 === f.t0) return hit;
      const fresh = { t0: f.t0, sim: replayFlight(f, s.hole, s.wind), el: Math.max(0, s.t - f.t0) };
      replays[k] = fresh;
      return fresh;
    };

    const ballAt = (k: number, s: Readonly<HoleState>): THREE.Vector3 => {
      const b = s.balls[k];
      const r = balls[k].radius;
      const f = b.flight;
      if (!f) return new THREE.Vector3(b.x, heightAt(b.x, b.z) + r, b.z);
      const { sim, el } = replayOf(k, f, s);
      const p = sim.points[Math.min(sim.points.length - 1, Math.max(0, Math.floor(el / sim.sampleDt)))];
      return new THREE.Vector3(p.x, p.y + r, p.z);
    };

    // Watching: the ball farthest from the pin still in play.
    const subjectOf = (s: Readonly<HoleState>): number => {
      if (mySeat !== null) return mySeat;
      let best = 0;
      let bestD = -1;
      s.balls.forEach((b, k) => {
        if (b.holed) return;
        const d = distToPin(b, s.hole);
        if (d > bestD) {
          bestD = d;
          best = k;
        }
      });
      return best;
    };

    return {
      render(s, dt) {
        lastDt = Math.min(dt, 0.1);
        const pin = HOLES[s.hole].pin;
        course.update(dt, s.t, s.wind.yaw);

        // Each flight's replay clock runs on render time; it snaps to the state's clock only when they drift apart.
        s.balls.forEach((b, k) => {
          const f = b.flight;
          if (!f) return;
          const rep = replayOf(k, f, s);
          rep.el += dt;
          const want = Math.max(0, s.t - f.t0);
          if (Math.abs(rep.el - want) > 0.25) rep.el = want;
        });

        s.balls.forEach((b, k) => balls[k].place(ballAt(k, s), b.holed));

        // Each gnome stands 1 yd behind its ball, facing the shot (or the aim, or the pin before a shot).
        s.balls.forEach((b, k) => {
          const g = gnomes[k];
          const f = b.flight;
          const sx = f ? f.sx : b.x;
          const sz = f ? f.sz : b.z;
          const a = f ? f.yaw : mySeat === k ? yaw : yawTo(b.x, b.z, pin.x, pin.z);
          const tx = sx - Math.sin(a);
          const tz = sz - Math.cos(a);
          const target = new THREE.Vector3(tx, heightAt(tx, tz), tz);
          if (g.placed) g.pose.position.lerp(target, 1 - Math.exp(-dt * 15));
          else {
            g.pose.position.copy(target);
            g.placed = true;
          }
          g.pose.facing = a;
          g.model.update(g.pose, dt);
        });

        // Camera: 8 yd behind the subject ball and 4 yd up, looking on past it toward the pin.
        const subject = subjectOf(s);
        const sp = ballAt(subject, s);
        sun.target.position.set(sp.x, 0, sp.z);
        sun.position.set(sp.x + 60, 120, sp.z + 40);
        const ex = pin.x - sp.x;
        const ez = pin.z - sp.z;
        const d = Math.hypot(ex, ez) || 1;
        const ux = ex / d;
        const uz = ez / d;
        const want = new THREE.Vector3(sp.x - ux * 8, sp.y + 4, sp.z - uz * 8);
        if (camReady) camera.position.lerp(want, 1 - Math.exp(-dt * 4));
        else {
          camera.position.copy(want);
          camReady = true;
        }
        camera.lookAt(sp.x + ux * 12, sp.y + 0.5, sp.z + uz * 12);

        // Overlay and aim line.
        scoreLine.textContent = seats
          .map((seat, k) => `${seat.name} ${s.balls[k].holed ? 'in ' : ''}${s.balls[k].strokes}`)
          .join(' · ');
        if (mySeat !== null) {
          const b = s.balls[mySeat];
          const rest = b.flight === null;
          const myTurn = canStrike(b, s.hole);
          const club = b.flight ? b.flight.club : clubOf(b, s.hole);
          if (b.holed) label.textContent = `Holed in ${b.strokes}`;
          else if (!rest) label.textContent = `Stroke ${b.strokes} · ${club}`;
          else if (!myTurn) label.textContent = `Out of strokes at ${b.strokes}`;
          else label.textContent = `Stroke ${b.strokes + 1} · ${club}`;
          bar.style.display = myTurn ? '' : 'none';
          fill.style.width = `${((charging ? meter : pull) * 100).toFixed(1)}%`;
          dots.forEach((dot, j) => {
            dot.visible = myTurn;
            if (!myTurn) return;
            const dd = (j + 1) * 2.5;
            const x = b.x + Math.sin(yaw) * dd;
            const z = b.z + Math.cos(yaw) * dd;
            dot.position.set(x, heightAt(x, z) + 0.15, z);
          });
        } else {
          label.textContent = 'Watching';
          bar.style.display = 'none';
          dots.forEach((dot) => (dot.visible = false));
        }
      },

      input(pad: Readonly<PadState>, s: Readonly<HoleState>): HoleInput {
        const me = mySeat ?? 0;
        const b = s.balls[me];
        const { pin } = HOLES[s.hole];
        const rest = b.flight === null;
        // The aim starts at the line to the pin each time my ball comes to rest.
        if (!aimed || (rest && !wasAtRest)) {
          yaw = yawTo(b.x, b.z, pin.x, pin.z);
          aimed = true;
        }
        wasAtRest = rest;

        const canShoot = canStrike(b, s.hole);
        const p = pad.pointer;
        const held = !!(p && p.down);
        if (p && held) {
          // Pointer mode: drag sideways to turn the aim, pull back (drag down) for power, release to swing.
          // pad.a is also true while held, so the hold-to-charge meter is not used here.
          if (!pointerWas) {
            pullY0 = p.y;
            pull = 0;
            lastPointerX = null;
            charging = false;
          }
          if (lastPointerX !== null) yaw += (p.x - lastPointerX) * 1.5;
          lastPointerX = p.x;
          pull = canShoot ? Math.min(1, Math.max(0, (pullY0 - p.y) / 0.8)) : 0;
        } else {
          // Releasing the pointer swings with the pull power it had.
          if (pointerWas && canShoot && pull > 0.05) {
            shots += 1;
            releasePower = pull;
          }
          pull = 0;
          lastPointerX = null;
          // Keys: ←/→ turn the aim, hold Space to run the meter, release to swing with the power it showed.
          yaw += pad.x * 0.8 * lastDt;
          if (pad.a && canShoot) {
            if (!charging) {
              charging = true;
              chargeT = 0;
            }
            chargeT += lastDt;
            const ph = (chargeT / METER_CYCLE_S) % 2;
            meter = ph <= 1 ? ph : 2 - ph;
          } else {
            if (charging && !pad.a && canShoot) {
              shots += 1;
              releasePower = meter;
            }
            charging = false;
          }
        }
        pointerWas = held;
        return { yaw, power: releasePower, shots };
      },
    };
  },
};

export default def;
