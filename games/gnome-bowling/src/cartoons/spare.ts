// Spare cartoons.
import { PAL, ball, circle, clear, gnomePin, headline, lane, lerp, rect, rng, scanSweep, seg, slamText, star, stepT, text } from './crt';
import { CRT_W, type Cartoon, type CartoonInfo } from './types';

/** Last Gnome Standing: one gnome pin is left, trembles, and gets bowled off the top of the screen. */
const lastGnomeStanding: Cartoon = {
  id: 'last-gnome-standing',
  kinds: ['spare'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    const HIT = 1.3;
    clear(g, PAL.black);
    lane(g, 40);
    if (T >= 0.2 && T < 1.1) text(g, '1 LEFT...', CRT_W / 2, 10, 9, PAL.white);
    if (T < HIT) {
      const flip = Math.floor(T / 0.3) % 2 === 1;
      const shake = T < 1.2 ? (Math.round(T * 12) % 2 === 0 ? 1 : -1) : 0;
      gnomePin(g, 80 + shake, 58, { scale: 1.1, face: T >= 1.0 ? 'scared' : 'sweat', flip });
    }
    // the ball: rolls in from the left, hits the pin, then carries on off the right edge
    if (T >= 1.1) {
      const bx = T < HIT ? lerp(-10, 70, seg(T, 1.1, HIT)) : 70 + (T - HIT) * 200;
      if (T < HIT) {
        for (let i = 0; i < 3; i++) rect(g, bx - 24 - i * 4, 44 + i * 5, 20, 1, PAL.white);
      }
      if (bx < CRT_W + 12) ball(g, bx, 50, 8, T * 12, PAL.pink, true);
    }
    // the hit: sparkle burst, then the pin flies off the top right, spinning
    if (T >= HIT && T < HIT + 0.25) {
      for (let i = 0; i < 3; i++) {
        star(g, 80 + Math.cos(i * 2.1) * 12, 40 + Math.sin(i * 2.1) * 10, 4, i % 2 ? PAL.yellow : PAL.white, T * 8);
      }
    }
    if (T >= HIT && T < 1.8) {
      const ft = T - HIT;
      gnomePin(g, 80 + 110 * ft, 58 - 200 * ft + 160 * ft * ft, { scale: 1.1, rot: ft * 12, face: 'dizzy' });
    }
    if (T >= 2.0 && T < 2.3) {
      const k = seg(T, 2.0, 2.3);
      star(g, 150, 4, 5 * Math.sin(k * Math.PI), PAL.white);
    }
    slamText(g, headline(info), CRT_W / 2, 30, 24, PAL.cyan, T, 1.6);
    if (T >= 2.1) text(g, info.name.toUpperCase(), CRT_W / 2, 104, 10, info.color);
    scanSweep(g, t);
  },
};

/** Clean Sweep: a giant broom sweeps the leftover pins off the lane. */
const cleanSweep: Cartoon = {
  id: 'clean-sweep',
  kinds: ['spare'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    clear(g, PAL.black);
    lane(g, 40);
    const rand = rng(info.seed);
    const n = 2 + Math.floor(rand() * 3);
    const xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(n === 1 ? 80 : lerp(50, 110, i / (n - 1)));
    const k = seg(T, 0.4, 2.2);
    const bx = lerp(175, -25, k);
    // leftover pins: standing until the broom reaches them, then pushed in front of the bristles
    xs.forEach((x0, i) => {
      const pushed = T >= 0.4 && bx <= x0 + 18 + i * 4;
      const px = pushed ? bx - 18 - i * 4 : x0;
      gnomePin(g, px, 60, { scale: 0.8, rot: pushed ? -0.6 : 0, face: pushed ? 'scared' : 'smug' });
    });
    if (T >= 0.4 && T < 2.2) {
      // dust puffs trailing behind the broom
      for (let j = 0; j < 6; j++) {
        const p = (k * 3 + j / 6) % 1;
        circle(g, bx + 14 + p * 34, 52 + (j % 3) * 5, 1 + 5 * (1 - p), PAL.grey);
      }
      // handle, leaning back to the right, then the bristle head
      g.save();
      g.translate(bx, 57);
      g.rotate(0.35);
      rect(g, -2, -70, 4, 70, PAL.brown);
      g.restore();
      rect(g, bx - 15, 50, 30, 14, PAL.yellow);
      for (let s = 0; s < 4; s++) rect(g, bx - 11 + s * 7, 50, 2, 14, PAL.orange);
    }
    slamText(g, headline(info), CRT_W / 2, 30, 24, PAL.cyan, T, 2.0);
    if (T >= 2.4) {
      text(g, 'CLEAN SWEEP!', CRT_W / 2, 52, 9, PAL.yellow);
      text(g, info.name.toUpperCase(), CRT_W / 2, 104, 10, info.color);
    }
    scanSweep(g, t);
  },
};

/** Spare cartoons. Add new ones to this list. */
export const SPARE_CARTOONS: Cartoon[] = [lastGnomeStanding, cleanSweep];
