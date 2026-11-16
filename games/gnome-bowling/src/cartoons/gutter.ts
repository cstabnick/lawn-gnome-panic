// Gutter ball and miss cartoons.
import { PAL, ball, circle, clear, easeOut, gnomePin, headline, hop, lerp, rect, scanSweep, seg, slamText, stepT, text, tri } from './crt';
import { CRT_W, type Cartoon, type CartoonInfo } from './types';

/** Gutter Gator: the ball rolls into the gutter, a gator snaps it up, burps, and the pins laugh. */
const gutterGator: Cartoon = {
  id: 'gutter-gator',
  kinds: ['gutter', 'miss'],
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void {
    const T = stepT(t, 12);
    clear(g, PAL.navy);
    rect(g, 0, 70, CRT_W, 8, PAL.tan);
    rect(g, 0, 78, CRT_W, 10, PAL.black);
    rect(g, 0, 78, CRT_W, 1, PAL.grey);
    // three gnome pins at the end of the lane, bouncing with laughter from 1.6 s
    [132, 142, 151].forEach((x, i) => {
      const hopY = T >= 1.6 ? hop(((T - 1.6) / 0.25 + i * 0.33) % 1) * 4 : 0;
      gnomePin(g, x, 70 - hopY, { scale: 0.7, face: 'happy' });
    });
    // the ball rolls in along the lane top, then drops into the gutter
    if (T < 1.4) {
      let bx: number;
      let by: number;
      if (T < 0.6) {
        bx = lerp(-8, 100, seg(T, 0, 0.6));
        by = 64 + Math.sin(T * 40) * 0.8;
      } else {
        bx = 100;
        by = lerp(64, 82, seg(T, 0.6, 0.8));
      }
      ball(g, bx, by, 6, T * 10, PAL.blue, false);
      if (T >= 0.6) circle(g, bx + 4, by - 5, 1, PAL.cyan);
    }
    // the gator rises out of the gutter, snaps its jaws on the ball, then sinks back
    if (T >= 1.0) {
      const rise = seg(T, 1.0, 1.4);
      const sink = seg(T, 1.8, 2.1);
      const hy = lerp(96, 76, rise) + 18 * sink;
      const open = 0.8 * easeOut(seg(T, 1.1, 1.35)) * (1 - seg(T, 1.4, 1.45));
      const hx = 84;
      g.save();
      g.beginPath();
      g.rect(0, 0, CRT_W, 88);
      g.clip();
      // head: a long green body with two bulging eyes on top
      rect(g, hx, hy - 5, 22, 10, PAL.green);
      circle(g, hx + 7, hy - 7, 2.6, PAL.white);
      circle(g, hx + 15, hy - 7, 2.6, PAL.white);
      rect(g, hx + 7, hy - 8, 1, 1, PAL.black);
      rect(g, hx + 15, hy - 8, 1, 1, PAL.black);
      // upper jaw, hinged at the back, with teeth on its underside
      g.save();
      g.translate(102, hy - 1);
      g.rotate(-open);
      rect(g, 0, -4, 20, 4, PAL.green);
      for (let i = 0; i < 4; i++) tri(g, 2 + i * 4.5, 0, 5 + i * 4.5, 0, 3.5 + i * 4.5, 3, PAL.white);
      g.restore();
      // lower jaw, with teeth on its top edge
      g.save();
      g.translate(102, hy + 1);
      g.rotate(open * 0.6);
      rect(g, 0, 0, 20, 4, PAL.green);
      for (let i = 0; i < 4; i++) tri(g, 2 + i * 4.5, 0, 5 + i * 4.5, 0, 3.5 + i * 4.5, -3, PAL.white);
      g.restore();
      g.restore();
    }
    if (T >= 1.4 && T < 1.9) text(g, 'CHOMP!', 95, 50, 12, PAL.white);
    if (T >= 2.0 && T < 2.7) {
      text(g, 'BURP!', 104, lerp(86, 56, seg(T, 2.0, 2.6)), 8, PAL.yellow);
    }
    slamText(g, headline(info), CRT_W / 2, 24, 18, PAL.grey, T, 2.2);
    if (T >= 2.5) text(g, info.name.toUpperCase(), CRT_W / 2, 104, 10, info.color);
    scanSweep(g, t);
  },
};

/** Gutter / miss cartoons. Add new ones to this list. */
export const GUTTER_CARTOONS: Cartoon[] = [gutterGator];
