// Turkey cartoons (three or more strikes in a row).
import {
  PAL, circle, clear, easeBack, easeIn, gnomePin, headline, hop, lane, lerp, pinRack, rect, scanSweep, seg,
  slamText, stepT, sunburst, text, tri,
} from './crt';
import { CRT_W, type Cartoon, type CartoonInfo } from './types';

/** A cartoon turkey standing with its feet at (x, y), about 26 px tall at s = 1. `frame` alternates legs and head tilt. */
function turkey(g: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number, hat: boolean): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const walk = frame % 2 === 0 ? 0 : 1;
  // tail fan, behind the body: big rounded feathers in two rings, spread wide so they show around a stack
  const FEATHERS = [PAL.red, PAL.orange, PAL.yellow, PAL.green, PAL.yellow, PAL.orange, PAL.red];
  const cx = -2;
  const cy = -13;
  for (let ring = 0; ring < 2; ring++) {
    const R = ring === 0 ? 13 : 9;
    for (let i = 0; i < FEATHERS.length; i++) {
      const a = lerp(Math.PI * 0.82, Math.PI * 2.18, i / (FEATHERS.length - 1));
      const fx = cx + Math.cos(a) * R;
      const fy = cy + Math.sin(a) * R * 0.8;
      circle(g, fx, fy, ring === 0 ? 5.2 : 4.2, PAL.black);
      circle(g, fx, fy, ring === 0 ? 4.4 : 3.4, ring === 0 ? FEATHERS[i] : PAL.brown);
    }
  }
  // legs
  rect(g, -4 + walk, -6, 1.5, 6, PAL.orange);
  rect(g, 2.5 - walk, -6, 1.5, 6, PAL.orange);
  // body, with a dark outline so it reads against the sunburst and the feathers
  circle(g, 0, -12, 8.2, PAL.black);
  circle(g, 0, -12, 7, PAL.brown);
  // neck
  rect(g, 3, -17, 3, 5, PAL.tan);
  // head, tilted for the gobble
  g.save();
  g.translate(5, -18);
  g.rotate(walk ? 0.25 : -0.1);
  circle(g, 0, 0, 4, PAL.black);
  circle(g, 0, 0, 3.2, PAL.tan);
  tri(g, 2.5, -1.2, 2.5, 1.2, 6, 0, PAL.orange); // beak
  circle(g, 2.2, 2.6, 1.1, PAL.red); // wattle
  circle(g, 0.8, -1, 0.7, PAL.black); // eye
  if (hat) tri(g, -3.2, -2.2, 3.2, -2.2, 0.4, -11, PAL.red);
  g.restore();
  g.restore();
}

/** Turkey on Turkey: turkeys drop one by one and stack up, one per strike in the streak. */
const turkeyOnTurkey: Cartoon = {
  id: 'turkey-on-turkey',
  kinds: ['turkey', 'hambone'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 10);
    sunburst(g, 80, 70, T, PAL.navy, PAL.blue);
    rect(g, 0, 100, CRT_W, 20, PAL.navy);
    const n = Math.min(Math.max(info.streak, 3), 6);
    const sc = n > 4 ? Math.min(1, 66 / ((n - 1) * 18 + 34)) : 1;
    const step = 18 * sc;
    const landAt = (i: number): number => 0.25 + i * 0.45;
    const lastLand = landAt(n - 1);
    const tHead = lastLand + 0.3;
    const sway = seg(T, lastLand, lastLand + 0.3);
    for (let i = 0; i < n; i++) {
      const land = landAt(i);
      if (T < land - 0.4) continue;
      const feetY = 100 - i * step;
      const fall = seg(T, land - 0.4, land);
      const y = fall >= 1 ? feetY : lerp(-40, feetY, easeIn(fall));
      const x = 80 + Math.sin(T * 4 + i) * i * 0.8 * sway;
      // the turkey below squashes for 0.1 s when this one lands on it
      const squashing = i + 1 < n && T >= landAt(i + 1) && T < landAt(i + 1) + 0.1;
      g.save();
      g.translate(x, y);
      g.scale(1, squashing ? 0.85 : 1);
      turkey(g, 0, 0, sc, Math.floor(T * 8), i === n - 1);
      g.restore();
      // speech bubble on landing, alternating sides
      if (T >= land && T < land + 0.35) {
        const left = i % 2 === 0;
        const bx = left ? 6 : 110;
        const by = Math.min(88, Math.max(14, feetY - 30 * sc));
        const dir = left ? 1 : -1;
        const ex = left ? bx + 44 : bx;
        rect(g, bx, by, 44, 12, PAL.white);
        tri(g, ex, by + 4, ex, by + 8, ex + dir * 5, by + 12, PAL.white);
        text(g, 'GOBBLE!', bx + 22, by + 6, 7, PAL.black, PAL.white);
      }
    }
    slamText(g, headline(info), 80, 18, 20, PAL.yellow, T, tHead);
    slamText(g, `${info.streak} IN A ROW!`, 80, 30, 9, PAL.white, T, tHead + 0.3);
    if (T >= tHead) text(g, info.name.toUpperCase(), 80, 110, 10, info.color);
    scanSweep(g, t);
  },
};

const ALL_DOWN: readonly boolean[] = [true, true, true, true, true, true, true, true, true, true];

/** Turkey Trot: a turkey in bowling shoes struts across the lane and knocks the whole rack down. */
const turkeyTrot: Cartoon = {
  id: 'turkey-trot',
  kinds: ['turkey'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 10);
    clear(g, PAL.black);
    lane(g, 40);
    const tx = lerp(-20, 180, seg(T, 0.6, 2.8));
    const hit = tx >= 80;
    // rack: standing, or all down with the tipped pins lying at the back
    pinRack(g, 80, 52, 0.5, 'scared', hit ? ALL_DOWN : []);
    if (hit) {
      for (let i = 0; i < 10; i++) {
        gnomePin(g, 80 + (i - 4.5) * 6, 56 + (i % 3) * 2, { scale: 0.5, rot: i % 2 ? 1.4 : -1.4, face: 'dizzy' });
      }
    }
    // three strike marks
    for (let i = 0; i < 3; i++) {
      const k = seg(T, 0.2 + i * 0.35, 0.45 + i * 0.35);
      if (k <= 0) continue;
      const sc = easeBack(k);
      g.save();
      g.translate(56 + i * 24, 14);
      g.scale(sc, sc);
      rect(g, -8, -8, 16, 16, PAL.white);
      text(g, 'X', 0, 0, 12, PAL.red, PAL.white);
      g.restore();
    }
    // the strutting turkey in bowling shoes
    if (T >= 0.6 && T <= 2.8) {
      const fy = 104 - hop((T * 8) % 1) * 4;
      turkey(g, tx, fy, 1.4, Math.floor(T * 8), true);
      rect(g, tx - 8, fy - 3, 6, 3, PAL.white);
      rect(g, tx + 2, fy - 3, 6, 3, PAL.white);
      rect(g, tx - 8, fy - 2, 6, 1, PAL.red);
      rect(g, tx + 2, fy - 2, 6, 1, PAL.red);
    }
    slamText(g, headline(info), 80, 60, 24, PAL.orange, T, 2.4);
    if (T >= 2.8) text(g, 'GOBBLE GOBBLE!', 80, 78, 8, PAL.yellow);
    if (T >= 2.8) text(g, info.name.toUpperCase(), 80, 110, 10, info.color);
    scanSweep(g, t);
  },
};

/** Turkey cartoons. Add new ones to this list. */
export const TURKEY_CARTOONS: Cartoon[] = [turkeyOnTurkey, turkeyTrot];
