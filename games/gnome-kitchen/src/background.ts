// The kitchen backdrop: a polka-dot wall, a sunny top bar, a wooden counter along the bottom, and a mint plate under
// the play area and Gnoma's panel.
import Phaser from 'phaser';
import { COLORS, N } from './config';
import type { Layout } from './layout';

export function drawKitchen(g: Phaser.GameObjects.Graphics, lay: Layout): void {
  const { W, H, ins } = lay;
  g.clear();
  g.fillStyle(N(COLORS.bg), 1);
  g.fillRect(0, 0, W, H);

  // Polka-dot wallpaper, staggered rows.
  g.fillStyle(N(COLORS.dot), 0.6);
  for (let row = 0, y = 20; y < H; row++, y += 40) {
    for (let x = row % 2 ? 40 : 20; x < W; x += 40) g.fillCircle(x, y, 4);
  }

  // Top bar: sunny yellow with a pink stripe.
  const topH = ins.top + lay.top;
  g.fillStyle(N(COLORS.yellow), 1);
  g.fillRect(0, 0, W, topH);
  g.fillStyle(N(COLORS.pink), 1);
  g.fillRect(0, topH - 6, W, 6);

  // Bottom: a wooden counter with planks.
  const botY = H - ins.bottom - lay.bottom;
  g.fillStyle(N(COLORS.wood), 1);
  g.fillRect(0, botY, W, H - botY);
  g.fillStyle(0x000000, 0.08);
  for (let y = botY + 14; y < H; y += 16) g.fillRect(0, y, W, 2);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(0, botY, W, 4);

  // The play plate and Gnoma's panel.
  const p = lay.play;
  g.fillStyle(N(COLORS.plate), 1);
  g.fillRoundedRect(p.x - 10, p.y - 10, p.w + 20, p.h + 20, 24);
  g.lineStyle(4, N(COLORS.mint), 1);
  g.strokeRoundedRect(p.x - 10, p.y - 10, p.w + 20, p.h + 20, 24);

  const q = lay.gnoma;
  g.fillStyle(N(COLORS.mintSoft), 1);
  g.fillRoundedRect(q.x - 4, q.y - 4, q.w + 8, q.h + 8, 22);
}
