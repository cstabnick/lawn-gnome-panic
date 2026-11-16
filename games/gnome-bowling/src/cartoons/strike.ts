// Strike cartoons: different ways for the gnome pins to get struck.
import {
  PAL, ball, circle, clear, easeBack, easeIn, easeOut, gnomePin, headline, hop, lane, lerp, pinRack, rect, rng, scanSweep, seg,
  slamText, star, stepT, text,
} from './crt';
import { CRT_W, type Cartoon, type CartoonInfo } from './types';

/** Rack spot offsets (x, depth row 0 = front) for pins 0..9, in rack units. */
const SPOTS: readonly (readonly [number, number])[] = [
  [0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2], [-3, 3], [-1, 3], [1, 3], [3, 3],
];

/** Bowled Over: the ball rolls up the lane and the gnome pins fly off spinning, seeing stars. */
const bowledOver: Cartoon = {
  id: 'bowled-over',
  kinds: ['strike', 'double'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    const HIT = 0.8;
    clear(g, PAL.black);
    lane(g, 40);
    const rand = rng(info.seed);
    const flights = SPOTS.map(() => ({ vx: lerp(-90, 90, rand()), vy: lerp(-120, -70, rand()), spin: lerp(-14, 14, rand()) }));
    // back rows first
    for (let i = 9; i >= 0; i--) {
      const [sx, row] = SPOTS[i];
      const x0 = CRT_W / 2 + sx * 5.5;
      const y0 = 52 - row * 3;
      if (T < HIT) {
        gnomePin(g, x0, y0, { scale: 0.55, face: T > HIT - 0.35 ? 'scared' : 'happy' });
      } else {
        const ft = T - HIT;
        const f = flights[i];
        gnomePin(g, x0 + f.vx * ft, y0 + f.vy * ft + 160 * ft * ft, { scale: 0.55, rot: f.spin * ft, face: 'dizzy' });
      }
    }
    if (T < HIT + 0.2) {
      const k = seg(T, 0, HIT);
      ball(g, CRT_W / 2 + Math.sin(k * 3) * 6 * (1 - k), lerp(122, 50, k), lerp(14, 4, k), T * 10, PAL.blue, true);
    }
    if (T >= HIT && T < HIT + 0.25) {
      for (let i = 0; i < 6; i++) star(g, CRT_W / 2 + Math.cos(i) * 18, 44 + Math.sin(i * 2) * 10, 4, PAL.yellow, T * 6);
    }
    slamText(g, headline(info), CRT_W / 2, 26, 24, PAL.yellow, T, HIT + 0.3);
    if (T > HIT + 0.8) text(g, info.name.toUpperCase(), CRT_W / 2, 104, 10, info.color);
    scanSweep(g, t);
  },
};

/** Ka-Boom: a black bomb-ball rolls up the lane with a lit fuse, blows up, and the pins come down in a dizzy heap. */
const kaboom: Cartoon = {
  id: 'kaboom',
  kinds: ['strike', 'double'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    const X = CRT_W / 2;
    // All random values are drawn up front, in a fixed order, so every frame sees the same numbers.
    const rand = rng(info.seed);
    const pins = SPOTS.map(() => ({ delay: rand() * 0.3, lx: lerp(50, 110, rand()), ly: lerp(56, 64, rand()), rot: lerp(-1.6, 1.6, rand()) }));
    const puffs = Array.from({ length: 6 }, () => ({ px: lerp(50, 110, rand()), ph: rand(), pr: lerp(2.5, 5, rand()) }));
    const blasts: readonly { c: string; r: number; dx: number; dy: number }[] = [
      { c: PAL.red, r: 60, dx: lerp(-6, 6, rand()), dy: lerp(-4, 4, rand()) },
      { c: PAL.orange, r: 46, dx: lerp(-6, 6, rand()), dy: lerp(-4, 4, rand()) },
      { c: PAL.yellow, r: 34, dx: lerp(-6, 6, rand()), dy: lerp(-4, 4, rand()) },
      { c: PAL.white, r: 22, dx: lerp(-4, 4, rand()), dy: lerp(-3, 3, rand()) },
    ];

    if (T < 0.9) {
      // the rack, then the black ball rolling up the lane with a sparking fuse
      clear(g, PAL.black);
      lane(g, 40);
      pinRack(g, 80, 52, 0.55, T > 0.5 ? 'scared' : 'sweat');
      const k = seg(T, 0, 0.9);
      const y = lerp(122, 50, k);
      const r = lerp(14, 5, k);
      ball(g, X, y, r, T * 10, PAL.black);
      rect(g, X - 1, y - r - 4, 1, 4, PAL.brown);
      const frame = Math.round(T * 12);
      star(g, X - 0.5, y - r - 5, 3, frame % 2 ? PAL.yellow : PAL.orange, frame * 0.5);
    } else if (T < 1.0) {
      // the flash
      clear(g, PAL.white);
    } else {
      lane(g, 40);
      // the explosion
      if (T < 1.75) {
        const k = seg(T, 1.0, 1.7);
        for (const b of blasts) circle(g, 80 + b.dx, 48 + b.dy, b.r * easeOut(k), b.c);
      }
      if (T >= 1.0 && T < 1.8) slamText(g, 'KA-BOOM!', X, 60, 22, PAL.orange, T, 1.0);
      // smoke drifts up off the heap; it stops at the end pose
      if (T >= 1.6) {
        const TE = Math.min(T, 3.2);
        for (const p of puffs) {
          const age = ((TE - 1.6) * 0.5 + p.ph) % 1;
          circle(g, p.px + Math.sin(age * 6) * 2, lerp(62, 12, age), p.pr * (0.5 + age * 0.8), PAL.grey);
        }
      }
      // the ten pins drop from the top onto the heap
      if (T >= 1.6) {
        pins.forEach((p) => {
          const ft = T - 1.6 - p.delay;
          if (ft < 0) return;
          const y = ft >= 0.5 ? p.ly : lerp(-10, p.ly, easeIn(ft / 0.5));
          gnomePin(g, p.lx, y, { scale: 0.55, rot: p.rot, face: 'dizzy' });
        });
      }
    }
    if (T >= 1.9) slamText(g, headline(info), X, 24, 24, PAL.yellow, T, 1.9);
    if (T >= 2.4) text(g, info.name.toUpperCase(), X, 104, 10, info.color);
    scanSweep(g, t);
  },
};

/** Panic Run: the pins see a huge blue ball coming, run for it sideways, and the two in the middle get flattened. */
const panicRun: Cartoon = {
  id: 'panic-run',
  kinds: ['strike', 'double'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    const X = CRT_W / 2;
    // Random values drawn up front, in a fixed order, so every frame sees the same numbers.
    const rand = rng(info.seed);
    const speeds = SPOTS.map(() => lerp(60, 90, rand()));
    const phases = SPOTS.map(() => rand());
    clear(g, PAL.black);
    lane(g, 40);
    // the big ball: appears at the bottom at 0.6 s and rolls up to the pins by 1.6 s (drawn first, so the pins sit in front)
    if (T >= 0.6) {
      const k = seg(T, 0.6, 1.6);
      ball(g, X, lerp(130, 56, k), lerp(26, 10, k), T * 8, PAL.blue, true);
    }
    // back rows first
    for (let i = 9; i >= 0; i--) {
      const [sx, row] = SPOTS[i];
      const x0 = X + sx * 5.5;
      const y0 = 52 - row * 3;
      if (sx === 0) {
        // pins 0 and 4 stay put and get flattened, then wobble back up a little
        const sq = T < 2.8 ? lerp(1, 0.25, seg(T, 1.5, 1.7)) : lerp(0.25, 0.5, easeBack(seg(T, 2.8, 3.2)));
        gnomePin(g, x0, y0, { scale: 0.55, squash: sq, face: T >= 1.5 ? 'dizzy' : 'scared' });
      } else if (T < 1.0) {
        gnomePin(g, x0, y0, { scale: 0.55, face: T >= 0.6 ? 'scared' : 'happy' });
      } else {
        // running off sideways, with a little hop and two legs that alternate every frame
        const dir = sx < 0 ? -1 : 1;
        const r = T - 1.0;
        const x = x0 + dir * speeds[i] * r;
        const by = y0 - hop(((r * 4 + phases[i]) % 1 + 1) % 1) * 3;
        const f = Math.round(T * 12) % 2;
        rect(g, x - 3, by, 2, f ? 3 : 2, PAL.black);
        rect(g, x + 1, by, 2, f ? 2 : 3, PAL.black);
        gnomePin(g, x, by, { scale: 0.55, face: 'scared' });
      }
      // the alarm mark pops above every pin's hat while they are still standing
      if (T >= 0.6 && T < 1.0) text(g, '!', x0, y0 - 24, 10, PAL.yellow);
    }
    slamText(g, headline(info), X, 24, 24, PAL.yellow, T, 2.0);
    if (T >= 2.5) text(g, info.name.toUpperCase(), X, 104, 10, info.color);
    scanSweep(g, t);
  },
};

/** Strike cartoons. Add new ones to this list. */
export const STRIKE_CARTOONS: Cartoon[] = [bowledOver, kaboom, panicRun];
