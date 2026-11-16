// Generates every texture in TEX (config.ts) in code. No external assets.
import type Phaser from 'phaser';
import { TEX } from './config';

const WHEEL = 0x2b2b2b;
const CAP = 0x555555;
const GRILLE = 0xbfbfbf;
const HANDLE = 0x2b2b2b;

/** 48x48 top-down push mower facing +x. The deck is white so setTint(color) colours it. */
function drawHead(g: Phaser.GameObjects.Graphics): void {
  // Wheels (drawn first, deck overlaps their inner edge).
  g.fillStyle(WHEEL, 1);
  g.fillRoundedRect(14, 5, 14, 9, 3);
  g.fillRoundedRect(14, 34, 14, 9, 3);
  // Thin dark handle at the back (-x side).
  g.lineStyle(2.5, HANDLE, 1);
  g.lineBetween(1, 24, 10, 24);
  // White deck: the dominant colour.
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(8, 12, 32, 24, 7);
  // Darker front grille notch.
  g.fillStyle(GRILLE, 1);
  g.fillRoundedRect(34, 19, 6, 10, 2);
  // Engine cap.
  g.fillStyle(CAP, 1);
  g.fillCircle(20, 24, 6);
}

/** 40x40 trailing mower segment, smaller and simpler than the head. */
function drawBody(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(WHEEL, 1);
  g.fillRoundedRect(10, 3, 12, 7, 2);
  g.fillRoundedRect(10, 30, 12, 7, 2);
  g.lineStyle(2, HANDLE, 1);
  g.lineBetween(1, 20, 7, 20);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(6, 10, 28, 20, 6);
  g.fillStyle(CAP, 1);
  g.fillCircle(19, 20, 5);
}

/** 16x16 grass tuft: three short blades rising from a common base. */
function drawGrass(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x2e8b2e, 1);
  g.fillTriangle(4, 15, 0, 6, 8, 15);
  g.fillStyle(0x4fbf3a, 1);
  g.fillTriangle(6, 15, 7, 1, 9, 15);
  g.fillStyle(0x2e8b2e, 1);
  g.fillTriangle(8, 15, 16, 5, 12, 15);
}

/** 24x24 golden clipping with a lighter highlight. */
function drawGold(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xe0a800, 1);
  g.fillCircle(12, 12, 10);
  g.fillStyle(0xffd84a, 1);
  g.fillCircle(12, 12, 7);
  g.fillStyle(0xfff3b0, 0.9);
  g.fillCircle(9, 8, 3);
}

/** 128x128 seamless lawn tile: two shades of green in mow stripes (period 128, so it tiles). */
function drawTile(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x5aa53c, 1);
  g.fillRect(0, 0, 64, 128);
  g.fillStyle(0x4c9633, 1);
  g.fillRect(64, 0, 64, 128);
}

/** Generate every texture in TEX (config.ts) with Graphics + generateTexture. Called once from BootScene. */
export function makeTextures(scene: Phaser.Scene): void {
  const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make(TEX.head, 48, 48, drawHead);
  make(TEX.body, 40, 40, drawBody);
  make(TEX.grass, 16, 16, drawGrass);
  make(TEX.gold, 24, 24, drawGold);
  make(TEX.tile, 128, 128, drawTile);
}
