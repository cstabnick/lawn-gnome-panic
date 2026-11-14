// Gnome Golf's party slice "Golf Hole": one random par 3 of the island, all four gnomes play it at once,
// fewest strokes wins. Built from the game's own modules, none copied: the course (world.ts buildCourse),
// the shot physics (physics.ts), the round helpers (round.ts) and the golfer model. The logic (init, step,
// cpu, result) is pure; the view replays each shot from its stored inputs, so only inputs and start times travel.
import * as THREE from 'three';
import { createGnomeModel, type PlayerState } from '@lawn/gnome';
import { seedFrom, type MinigameDef, type MinigameView, type PadState, type ViewCtx } from '@lawn/party';
import { CLUB_ORDER, HOLES, LOOK, PHYS, type ClubId, type Lie, type Wind } from '../config';
import { heightAt } from '../course';
import { setCarts } from '../obstacles';
import { estimateCarry, simulateShot } from '../physics';
import { seededWind, yawTo } from '../round';
import { buildCourse } from '../world';

const ROUND_S = 75;
/** Yards between the four balls on the tee, across the line to the pin. */
const SPREAD = 1.5;
/** The ball is drawn at 3x its real radius, so it reads from the camera. */
const BALL_R = PHYS.ballRadius * 3;
/** The power meter rises 0 -> 1 and falls back in this many seconds. */
const METER_CYCLE_S = 1.4;
/** A CPU waits this long at rest before it plays again. */
const CPU_WAIT_S = 1.2;

/** Stored numbers are rounded to 1 mm so the JSON state stays under 2 KB and every viewer replays the same values. */
const r3 = (v: number): number => Math.round(v * 1000) / 1000;

export interface Flight {
  /** Where it was struck from, and the shot's inputs (the view replays simulateShot from these). */
  sx: number; sz: number; club: ClubId; power: number; accuracy: number; yaw: number; lie: Lie;
  t0: number; dur: number;
  /** Where it comes to rest, and the lie there. */
  ex: number; ez: number; endLie: Lie; holed: boolean;
}

export interface Ball {
  x: number; z: number; lie: Lie;
  strokes: number; holed: boolean; holedAt: number;
  /** The highest shots counter this ball has answered. */
  lastShots: number;
  /** Seconds at rest since the last landing or shot. */
  restT: number;
  flight: Flight | null;
}

export interface HoleState { hole: number; wind: Wind; t: number; balls: Ball[] }
export interface HoleInput { yaw: number; power: number; shots: number }

const CARRY_CLUBS = CLUB_ORDER.filter((c) => c !== 'PT');

/** The club for a stroke from `lie` over `dist` yards: the shortest club that reaches, the driver if none, the putter on the green. */
export function pickClub(lie: Lie, dist: number): ClubId {
  if (lie === 'green') return 'PT';
  for (let i = CARRY_CLUBS.length - 1; i >= 0; i--) {
    if (estimateCarry(CARRY_CLUBS[i], lie, 1) >= dist) return CARRY_CLUBS[i];
  }
  return 'DR';
}

/** The power (0..1) that makes this club reach `dist` from `lie`; full power when it cannot. */
export function powerFor(club: ClubId, lie: Lie, dist: number): number {
  if (club === 'PT') return Math.min(1, dist / estimateCarry('PT', lie, 1));
  if (estimateCarry(club, lie, 1) <= dist) return 1;
  let lo = 0.3;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (estimateCarry(club, lie, mid) < dist) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function distToPin(b: { x: number; z: number }, hole: number): number {
  const pin = HOLES[hole].pin;
  return Math.hypot(pin.x - b.x, pin.z - b.z);
}

function strokeCap(hole: number): number {
  return HOLES[hole].par + 3;
}

/** True when ball a is placed strictly ahead of ball b: holed beats not holed, then fewer strokes, then the earlier hole; not holed, the nearer to the pin. */
function ahead(s: Readonly<HoleState>, a: Ball, b: Ball): boolean {
  if (a.holed !== b.holed) return a.holed;
  if (a.holed) return a.strokes !== b.strokes ? a.strokes < b.strokes : a.holedAt < b.holedAt;
  return distToPin(a, s.hole) < distToPin(b, s.hole);
}

function startBall(x: number, z: number): Ball {
  return { x, z, lie: 'tee', strokes: 0, holed: false, holedAt: 0, lastShots: 0, restT: 0, flight: null };
}

/** Plays one stroke for a ball at rest. The shot's numbers are rounded before use, so the stored flight replays exactly. */
function strike(s: HoleState, b: Ball, i: HoleInput, rng: () => number): void {
  const club = pickClub(b.lie, distToPin(b, s.hole));
  const shot = {
    club,
    power: r3(Math.min(1, Math.max(0, i.power))),
    accuracy: r3((rng() - 0.5) * 0.3),
    yaw: r3(i.yaw),
  };
  const r = simulateShot(new THREE.Vector3(b.x, heightAt(b.x, b.z), b.z), shot, b.lie, s.wind, HOLES[s.hole].pin);
  b.strokes += 1;
  b.restT = 0;
  b.flight = {
    sx: b.x, sz: b.z, ...shot, lie: b.lie,
    t0: s.t, dur: r3(r.duration),
    ex: r3(r.end.x), ez: r3(r.end.z), endLie: r.endLie, holed: r.holed,
  };
}

const def: MinigameDef<HoleState, HoleInput> = {
  meta: {
    id: 'golf-hole',
    title: 'Golf Hole',
    game: 'gnome-golf',
    goal: 'Sink it in the fewest strokes on one par 3.',
    controls: 'Turn with ←/→ or drag sideways; hold Space or press and hold, release to swing.',
    maxSeconds: ROUND_S,
  },

  init(seats, rng) {
    setCarts([]); // no carts on this hole
    const par3 = HOLES.flatMap((h, i) => (h.par === 3 ? [i] : []));
    const hole = par3[Math.floor(rng() * par3.length)];
    const w = seededWind(seedFrom(Math.floor(rng() * 0x7fffffff)), hole);
    const { tee, pin } = HOLES[hole];
    const len = Math.hypot(pin.x - tee.x, pin.z - tee.z);
    const nx = -(pin.z - tee.z) / len;
    const nz = (pin.x - tee.x) / len;
    return {
      hole,
      wind: { yaw: r3(w.yaw), mph: w.mph },
      t: 0,
      balls: seats.map((_, k) => {
        const off = (k - 1.5) * SPREAD;
        return startBall(r3(tee.x + nx * off), r3(tee.z + nz * off));
      }),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    const cap = strokeCap(s.hole);
    s.balls.forEach((b, k) => {
      const f = b.flight;
      if (f && s.t >= f.t0 + f.dur) {
        // A water ball drops back where it was struck: one penalty stroke, same spot, same lie.
        if (f.endLie === 'water') b.strokes += 1;
        else {
          b.x = f.ex;
          b.z = f.ez;
          b.lie = f.endLie;
        }
        if (f.holed) {
          b.holed = true;
          b.holedAt = s.t;
        }
        b.flight = null;
        b.restT = 0;
      }
      if (b.flight === null) b.restT += dt;
      const i = inputs[k];
      // A counter that grew since the last answer asks for one stroke. Asked during a flight, it is dropped.
      if (i && i.shots > b.lastShots) {
        b.lastShots = i.shots;
        if (b.flight === null && !b.holed && b.strokes < cap) strike(s, b, i, rng);
      }
    });
  },

  cpu(s, seat, rng) {
    const b = s.balls[seat];
    const { pin } = HOLES[s.hole];
    const aim = yawTo(b.x, b.z, pin.x, pin.z);
    if (b.flight !== null || b.holed || b.strokes >= strokeCap(s.hole) || b.restT <= CPU_WAIT_S) {
      return { yaw: aim, power: 0, shots: b.lastShots };
    }
    const dist = distToPin(b, s.hole);
    const club = pickClub(b.lie, dist);
    const power = Math.min(1, powerFor(club, b.lie, dist) * (1 + (rng() - 0.5) * 0.12));
    return { yaw: aim + (rng() - 0.5) * 0.08, power, shots: b.lastShots + 1 };
  },

  result(s, timeUp) {
    const cap = strokeCap(s.hole);
    const done = s.balls.every((b) => b.flight === null && (b.holed || b.strokes >= cap));
    if (!timeUp && !done) return null;
    return s.balls.map((a) => s.balls.filter((b) => ahead(s, b, a)).length);
  },

  createView(ctx: ViewCtx): MinigameView<HoleState, HoleInput> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    scene.background = new THREE.Color(LOOK.sky);
    scene.fog = new THREE.Fog(LOOK.sky, LOOK.fogNear, LOOK.fogFar);
    camera.far = LOOK.cameraFar;
    camera.updateProjectionMatrix();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const course = buildCourse(scene, renderer);

    scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x3d6b3a, 1.3));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 400;
    sc.updateProjectionMatrix();
    scene.add(sun, sun.target);

    const ballGeo = new THREE.SphereGeometry(BALL_R, 12, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 6, 6);
    const ringGeo = new THREE.RingGeometry(0.5, 0.7, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ballMeshes = seats.map((seat) => {
      const mesh = new THREE.Mesh(ballGeo, ballMat);
      mesh.castShadow = true;
      const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: seat.color, transparent: true, opacity: 0.7 }));
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: seat.color, side: THREE.DoubleSide }));
      scene.add(mesh, beam, ring);
      return { mesh, beam, ring };
    });

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
    let camReady = false;
    const replays: ({ t0: number; points: THREE.Vector3[]; sampleDt: number } | null)[] = seats.map(() => null);

    // The trajectory of a flight, simulated once per flight (keyed by its start time) with the same inputs the host used.
    const replayOf = (k: number, f: Flight, s: Readonly<HoleState>) => {
      const hit = replays[k];
      if (hit && hit.t0 === f.t0) return hit;
      const r = simulateShot(
        new THREE.Vector3(f.sx, heightAt(f.sx, f.sz), f.sz),
        { club: f.club, power: f.power, accuracy: f.accuracy, yaw: f.yaw },
        f.lie, s.wind, HOLES[s.hole].pin,
      );
      const fresh = { t0: f.t0, points: r.points, sampleDt: r.sampleDt };
      replays[k] = fresh;
      return fresh;
    };

    const ballAt = (k: number, s: Readonly<HoleState>): THREE.Vector3 => {
      const b = s.balls[k];
      const f = b.flight;
      if (!f) return new THREE.Vector3(b.x, heightAt(b.x, b.z) + BALL_R, b.z);
      const rep = replayOf(k, f, s);
      const idx = Math.min(rep.points.length - 1, Math.max(0, Math.floor((s.t - f.t0) / rep.sampleDt)));
      const p = rep.points[idx];
      return new THREE.Vector3(p.x, p.y + BALL_R, p.z);
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

        s.balls.forEach((b, k) => {
          const p = ballAt(k, s);
          const m = ballMeshes[k];
          m.mesh.position.copy(p);
          m.beam.position.set(p.x, p.y + 3, p.z);
          m.beam.visible = !b.holed;
          m.ring.position.set(p.x, heightAt(p.x, p.z) + 0.05, p.z);
        });

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
        const cap = strokeCap(s.hole);
        scoreLine.textContent = seats
          .map((seat, k) => `${seat.name} ${s.balls[k].holed ? 'in ' : ''}${s.balls[k].strokes}`)
          .join(' · ');
        if (mySeat !== null) {
          const b = s.balls[mySeat];
          const rest = b.flight === null;
          const myTurn = rest && !b.holed && b.strokes < cap;
          const club = b.flight ? b.flight.club : pickClub(b.lie, distToPin(b, s.hole));
          if (b.holed) label.textContent = `Holed in ${b.strokes}`;
          else if (!rest) label.textContent = `Stroke ${b.strokes} · ${club}`;
          else if (!myTurn) label.textContent = `Out of strokes at ${b.strokes}`;
          else label.textContent = `Stroke ${b.strokes + 1} · ${club}`;
          bar.style.display = myTurn ? '' : 'none';
          fill.style.width = `${((charging ? meter : 0) * 100).toFixed(1)}%`;
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

        yaw += pad.x * 0.8 * lastDt;
        const p = pad.pointer;
        if (p && p.down) {
          if (lastPointerX !== null) yaw += (p.x - lastPointerX) * 1.5;
          lastPointerX = p.x;
        } else lastPointerX = null;

        const canShoot = rest && !b.holed && b.strokes < strokeCap(s.hole);
        if (pad.a && canShoot) {
          if (!charging) {
            charging = true;
            chargeT = 0;
          }
          chargeT += lastDt;
          const ph = (chargeT / METER_CYCLE_S) % 2;
          meter = ph <= 1 ? ph : 2 - ph;
        } else {
          // Releasing the button swings with the power the meter showed.
          if (charging && !pad.a && canShoot) {
            shots += 1;
            releasePower = meter;
          }
          charging = false;
        }
        return { yaw, power: releasePower, shots };
      },
    };
  },
};

export default def;
