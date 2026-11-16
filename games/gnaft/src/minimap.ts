// Round radar in the top-right corner: the raft, the gnome, props and spotted islands.
import type { Ctx, System } from './config';
import { ISLAND_ORDER, ISLANDS, TILE_SIZE } from './config';
import { islandRelPos, raftExtent } from './rules';

const SIZE = 180;
const CENTRE = SIZE / 2;
const RADIUS_PX = 80;
const REDRAW_EVERY = 0.1; // seconds

type RGB = readonly [number, number, number];
const GRASS_YOUNG: RGB = [106, 176, 76]; // #6ab04c
const GRASS_OLD: RGB = [46, 125, 50]; // #2e7d32
const SAND = '#e8d59e';
const YELLOW = '#ffd54f';
const SPRINKLER = '#4fc3f7';
const FLAMINGO = '#ff6fae';

export function createMinimap(ctx: Ctx): System {
  const canvas = document.createElement('canvas');
  canvas.id = 'rg-minimap';
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.cssText = [
    'position:absolute',
    'top:12px',
    'right:12px',
    'border-radius:50%',
    'background:rgba(10,30,45,0.75)',
    'border:2px solid rgba(255,255,255,0.5)',
    'pointer-events:none',
    'display:none',
  ].join(';');
  ctx.ui.appendChild(canvas);

  const g = canvas.getContext('2d');
  let acc = REDRAW_EVERY; // draw on the first visible frame

  return {
    update(dt: number) {
      const s = ctx.state;
      const shown = s.mode !== 'title' && s.mode !== 'telescope';
      canvas.style.display = shown ? 'block' : 'none';
      if (!shown || !g) return;
      acc += dt;
      if (acc < REDRAW_EVERY) return;
      acc = 0;
      draw(g, ctx);
    },
  };
}

function mix(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const gr = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${gr},${bl})`;
}

function draw(g: CanvasRenderingContext2D, ctx: Ctx): void {
  const s = ctx.state;
  const R = Math.max(25, raftExtent(s) * 1.5); // visible radius in metres
  const k = RADIUS_PX / R; // pixels per metre
  const toX = (x: number) => CENTRE + x * k;
  const toY = (z: number) => CENTRE + z * k;

  g.clearRect(0, 0, SIZE, SIZE);

  // Everything inside the circle.
  g.save();
  g.beginPath();
  g.arc(CENTRE, CENTRE, RADIUS_PX, 0, Math.PI * 2);
  g.clip();

  // Spotted islands that are within range.
  for (const id of ISLAND_ORDER) {
    if (!s.islands[id].spotted) continue;
    const p = islandRelPos(s, id);
    if (Math.hypot(p.x, p.z) > R) continue;
    g.fillStyle = SAND;
    g.beginPath();
    g.arc(toX(p.x), toY(p.z), Math.max(2, ISLANDS[id].radius * k), 0, Math.PI * 2);
    g.fill();
  }

  // Raft tiles, darker as the grass grows.
  const size = TILE_SIZE * k;
  for (const t of s.tiles.values()) {
    const growth = Math.min(1, Math.max(0, t.growth));
    g.fillStyle = mix(GRASS_YOUNG, GRASS_OLD, growth);
    g.fillRect(toX(t.i * TILE_SIZE) - size / 2, toY(t.j * TILE_SIZE) - size / 2, size, size);
  }

  // Props.
  for (const p of s.props) {
    g.fillStyle = p.kind === 'sprinkler' ? SPRINKLER : FLAMINGO;
    g.beginPath();
    g.arc(toX(p.i * TILE_SIZE), toY(p.j * TILE_SIZE), 3, 0, Math.PI * 2);
    g.fill();
  }

  // Course line toward the island being sailed to.
  if (s.sea.course) {
    const p = islandRelPos(s, s.sea.course);
    const d = Math.hypot(p.x, p.z);
    if (d > 0) {
      const ux = p.x / d;
      const uz = p.z / d;
      g.strokeStyle = YELLOW;
      g.lineWidth = 1.5;
      g.setLineDash([4, 3]);
      g.beginPath();
      g.moveTo(CENTRE, CENTRE);
      g.lineTo(CENTRE + ux * RADIUS_PX, CENTRE + uz * RADIUS_PX);
      g.stroke();
      g.setLineDash([]);
    }
  }

  // The gnome: white triangle pointing along facing.
  const pos = s.player.position;
  const dx = Math.sin(s.player.facing);
  const dz = Math.cos(s.player.facing);
  const px = toX(pos.x);
  const py = toY(pos.z);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(px + dx * 7, py + dz * 7);
  g.lineTo(px - dx * 4 - dz * 4, py - dz * 4 + dx * 4);
  g.lineTo(px - dx * 4 + dz * 4, py - dz * 4 - dx * 4);
  g.closePath();
  g.fill();

  g.restore();

  // Rim markers for spotted islands out of range (not clipped).
  for (const id of ISLAND_ORDER) {
    if (!s.islands[id].spotted) continue;
    const p = islandRelPos(s, id);
    const d = Math.hypot(p.x, p.z);
    if (d <= R) continue;
    const ux = p.x / d;
    const uz = p.z / d;
    const rx = CENTRE + ux * RADIUS_PX;
    const ry = CENTRE + uz * RADIUS_PX;

    g.fillStyle = YELLOW;
    g.beginPath();
    g.moveTo(rx + ux * 6, ry + uz * 6);
    g.lineTo(rx - ux * 2 - uz * 4, ry - uz * 2 + ux * 4);
    g.lineTo(rx - ux * 2 + uz * 4, ry - uz * 2 - ux * 4);
    g.closePath();
    g.fill();

    g.font = '10px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(Math.round(d) + 'm', CENTRE + ux * (RADIUS_PX - 16), CENTRE + uz * (RADIUS_PX - 16));
  }
}
