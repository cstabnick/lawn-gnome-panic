// Code-drawn house art. Every function draws into a Graphics in design space (AREA_W x AREA_H, see houseData.ts).
// Outdoor art (yard, cottage) lives in houseArtOutdoor.ts, indoor art (living room, kitchen) in houseArtIndoor.ts,
// Oakwood Treehouse art in houseArtTreehouse.ts, Shell Cove art in houseArtCove.ts.
import Phaser from 'phaser';
import { BACKDROP_INDOOR, DRAW_INDOOR } from './houseArtIndoor';
import { BACKDROP_OUTDOOR, DRAW_OUTDOOR } from './houseArtOutdoor';
import { BACKDROP_TREEHOUSE, DRAW_TREEHOUSE } from './houseArtTreehouse';
import { BACKDROP_COVE, DRAW_COVE } from './houseArtCove';
import type { BackdropFn, DrawFn } from './artTypes';

export type { BackdropFn, DrawFn } from './artTypes';

/** Keyed by HouseSlot.art. */
export const DRAW: Record<string, DrawFn> = { ...DRAW_OUTDOOR, ...DRAW_INDOOR, ...DRAW_TREEHOUSE, ...DRAW_COVE };
/** Keyed by HouseArea.backdrop. */
export const BACKDROP: Record<string, BackdropFn> = { ...BACKDROP_OUTDOOR, ...BACKDROP_INDOOR, ...BACKDROP_TREEHOUSE, ...BACKDROP_COVE };

/** The "messy" stand-in for an unbuilt slot: a heap of junk and weeds, centred on (x, y), about w x h. */
export function drawJunk(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  const s = Math.min(w, h);
  const by = y + h / 2 - s * 0.05;
  // Weeds.
  g.fillStyle(0x4b7a2a, 1);
  for (let i = 0; i < 7; i++) {
    const wx = x - w * 0.4 + (i * w * 0.8) / 6;
    g.fillTriangle(wx - s * 0.04, by, wx + s * 0.04, by, wx + (i % 2 ? 1 : -1) * s * 0.06, by - s * 0.22);
  }
  // A broken crate and a cardboard box.
  g.fillStyle(0x7a5a3a, 1);
  g.fillRect(x - s * 0.35, by - s * 0.32, s * 0.4, s * 0.32);
  g.lineStyle(Math.max(2, s * 0.02), 0x4a3420, 1);
  g.strokeRect(x - s * 0.35, by - s * 0.32, s * 0.4, s * 0.32);
  g.lineBetween(x - s * 0.35, by - s * 0.32, x + s * 0.05, by);
  g.fillStyle(0xb08a5a, 1);
  g.fillRect(x + s * 0.02, by - s * 0.22, s * 0.3, s * 0.22);
  g.fillStyle(0x8a6a40, 1);
  g.fillRect(x + s * 0.02, by - s * 0.22, s * 0.3, s * 0.04);
  // A cobweb-grey dust cloud.
  g.fillStyle(0x9a9a9a, 0.35);
  g.fillCircle(x - s * 0.1, by - s * 0.4, s * 0.12);
  g.fillCircle(x + s * 0.08, by - s * 0.36, s * 0.09);
}
