// Builds the sprite of one piece: a plain tile, a special (back glow, special art, kind badge), the prism or a lost gnome.
// Child 0 is the selection ring (named 'sel', hidden until BoardView selects the piece).
import Phaser from 'phaser';
import { TEX } from '../config';
import type { Piece, SpecialKind } from '../engine/types';

/** Piece art is 64x64 and drawn at 90% of a cell. */
const ART = 64;

const SPECIAL_TEX: Record<SpecialKind, string> = {
  mowerH: TEX.mowerH,
  mowerV: TEX.mowerV,
  bomb: TEX.bomb,
  bee: TEX.bee,
};

/** Identity of a piece's look: a sprite is rebuilt when this changes. */
export function pieceSig(piece: Piece): string {
  return `${piece.kind}:${piece.special ?? ''}`;
}

/** A piece sprite centred on (0, 0) of its container. The caller positions the container. */
export function makePieceSprite(scene: Phaser.Scene, piece: Piece, cell: number): Phaser.GameObjects.Container {
  const node = scene.add.container(0, 0);
  const s = (cell * 0.9) / ART;
  const half = cell * 0.5;

  const ring = scene.add.graphics();
  ring.name = 'sel';
  ring.fillStyle(0xffffff, 0.25).fillCircle(0, 0, half);
  ring.lineStyle(3, 0xffffff, 0.95).strokeCircle(0, 0, half);
  ring.setVisible(false);
  node.add(ring);

  const art = (key: string, scale = s): Phaser.GameObjects.Image => scene.add.image(0, 0, key).setScale(scale);

  if (piece.kind === 'gnome') {
    const head = art(TEX.gnome);
    node.add(head);
    scene.tweens.add({ targets: head, y: -cell * 0.08, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
  } else if (piece.kind === 'prism') {
    const gem = art(TEX.prism);
    node.add(gem);
    scene.tweens.add({ targets: gem, angle: 14, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
  } else if (piece.special === null) {
    node.add(art(TEX.tile[piece.kind]));
  } else {
    const back = art(TEX.back[piece.kind]);
    node.add(back);
    scene.tweens.add({ targets: back, alpha: 0.55, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });

    const special = art(SPECIAL_TEX[piece.special]);
    node.add(special);
    scene.tweens.add({ targets: special, scale: s * 1.08, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });

    const badge = art(TEX.tile[piece.kind], (cell * 0.35) / ART).setPosition(cell * 0.28, -cell * 0.28);
    node.add(badge);
  }
  return node;
}
