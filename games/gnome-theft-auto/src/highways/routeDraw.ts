// The GPS route line on the minimap and the big map, level-aware (docs/roadmaps/gta-skyway-traffic-gps.md).
import type { HudRoute } from '../types';

export type RoutePoints = HudRoute['points'];

/**
 * Stroke the route. `toScreen` maps world (x, z) to canvas px; `t` is seconds (the dashes crawl); `small` is the
 * minimap's lighter weight. Leaves the context's line dash reset.
 */
export function drawRoute(
  g: CanvasRenderingContext2D, pts: RoutePoints, toScreen: (x: number, z: number) => [number, number],
  color: string, t: number, small: boolean,
): void {
  if (pts.length < 2) return;
  const alpha = g.globalAlpha;
  const dash = small ? [4, 3] : [6, 4];
  const offset = -t * 8;
  const underlayW = small ? 3.2 : 4;
  const dashW = small ? 1.8 : 2.4;
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // Split the route into runs of one level. Run [i..j] covers the stretches i..j-1, all of level L.
  const n = pts.length;
  for (let i = 0; i < n - 1;) {
    const level = pts[i].level;
    let j = i + 1;
    while (j < n - 1 && pts[j].level === level) j++;
    const trace = (): void => {
      g.beginPath();
      for (let k = i; k <= j; k++) {
        const [x, y] = toScreen(pts[k].x, pts[k].z);
        if (k === i) g.moveTo(x, y); else g.lineTo(x, y);
      }
    };

    if (level === 'deck') {
      // A raised casing, so the stretch reads as up on a skyway.
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.strokeStyle = '#f4f4f4';
      g.lineWidth = underlayW + 2.5;
      trace();
      g.stroke();
    }

    if (level === 'under') {
      // Hidden beneath a deck: no underlay, faint dashes.
      g.globalAlpha = alpha * 0.45;
      g.setLineDash(dash);
      g.lineDashOffset = offset;
      g.strokeStyle = color;
      g.lineWidth = dashW * 0.7;
      trace();
      g.stroke();
    } else {
      g.setLineDash(dash);
      g.lineDashOffset = offset;
      g.strokeStyle = 'rgba(0,0,0,.55)';
      g.lineWidth = underlayW;
      trace();
      g.stroke();
      g.strokeStyle = color;
      g.lineWidth = dashW;
      trace();
      g.stroke();
    }
    g.globalAlpha = alpha;
    i = j;
  }
  g.setLineDash([]);
  g.lineDashOffset = 0;
}
