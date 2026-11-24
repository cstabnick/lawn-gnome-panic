// Skyways on the minimap and the big map: a raised road with a dark shadow and a light outline, so it reads apart from the
// ground roads underneath. Drawn onto the pre-rendered map canvas (hud.ts), so this runs once per map build, not per frame.
import { branchTrim, deckSamples, skywayDefs } from './deck';
import { kindOf } from './skyways';

const SHADOW = 'rgba(0,0,0,0.35)';
const OUTLINE = '#f4f4f4';
const DECK = '#3d3d44';
const OPEN_END = '#d94f3d';

/** Draw every skyway onto the pre-rendered map canvas. X and Y map world x and z to canvas pixels. */
export function drawSkywaysOnMap(g: CanvasRenderingContext2D, X: (x: number) => number, Y: (z: number) => number): void {
  // 1 world metre in canvas pixels, so a deck's drawn width matches its real width.
  const m = Math.max(1, Math.abs(X(1) - X(0)));
  g.save();
  g.lineCap = 'butt';
  g.lineJoin = 'round';
  for (const def of skywayDefs()) {
    // Construction-site ramps and platforms are not on the map.
    if (kindOf(def) === 'site') continue;
    const all = deckSamples(def.id, 8);
    // A branch starts where it leaves its parent's edge, so it does not paint over the parent's outline.
    let from = 0;
    if (def.points[0].on) {
      const i = all.findIndex((p) => p.along >= branchTrim(def.id).start);
      from = i < 0 ? all.length : i;
    }
    const s = all.slice(from);
    if (s.length < 2) continue;
    const trace = (): void => {
      g.beginPath();
      s.forEach((p, i) => (i === 0 ? g.moveTo(X(p.x), Y(p.z)) : g.lineTo(X(p.x), Y(p.z))));
    };
    // Shadow: the whole path, nudged down and right.
    g.save();
    g.translate(2, 2);
    trace();
    g.strokeStyle = SHADOW;
    g.lineWidth = def.width * m + 4;
    g.stroke();
    g.restore();
    // Light outline, then the dark deck on top.
    trace();
    g.strokeStyle = OUTLINE;
    g.lineWidth = def.width * m + 3;
    g.stroke();
    trace();
    g.strokeStyle = DECK;
    g.lineWidth = def.width * m;
    g.stroke();
    if (def.openEnd) {
      // A stunt span with no ramp down: a red bar across the open end.
      const end = s[s.length - 1];
      const rx = end.dirZ * (def.width / 2);
      const rz = -end.dirX * (def.width / 2);
      g.beginPath();
      g.moveTo(X(end.x + rx), Y(end.z + rz));
      g.lineTo(X(end.x - rx), Y(end.z - rz));
      g.strokeStyle = OPEN_END;
      g.lineWidth = Math.max(2, m * 0.8);
      g.stroke();
    }
  }
  g.restore();
}
