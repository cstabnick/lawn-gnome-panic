// Builds the sprite of one piece: a plain tile, a special (back glow, special art, kind badge), the prism or a lost gnome.
// Children, in order: 0 the soft shadow (stays put on the grass), 1 the selection ring (named 'sel', hidden until BoardView
// selects the piece), 2 the 'art' container. BoardView waves 'art' every frame; the outer container takes the move tweens.
import Phaser from 'phaser';
import { TEX } from '../config';
import type { Piece, SpecialKind } from '../engine/types';

/** The art is drawn at 90% of a cell, whatever the texture's pixel size. */
const FILL = 0.9;

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

/** Scale `img` so it is `px` wide, whatever size its texture is. */
function fit(img: Phaser.GameObjects.Image, px: number): Phaser.GameObjects.Image {
  return img.setScale(px / img.width);
}

/** A piece sprite centred on (0, 0) of its container. The caller positions the container. */
export function makePieceSprite(scene: Phaser.Scene, piece: Piece, cell: number): Phaser.GameObjects.Container {
  const node = scene.add.container(0, 0);
  const half = cell * 0.5;
  const px = cell * FILL;
  const art = scene.add.container(0, 0);
  art.name = 'art';
  // How far (degrees) this piece leans in the board's wave. Gnomes lean a little more.
  art.setData('lean', piece.kind === 'gnome' ? 7 : 4);

  const img = (key: string, size = px): Phaser.GameObjects.Image => fit(scene.add.image(0, 0, key), size);

  // Shadow: the main art, tinted black, squashed, lying on the grass down and to the right of the piece.
  const mainKey =
    piece.kind === 'gnome'
      ? TEX.gnome
      : piece.kind === 'prism'
        ? TEX.prism
        : piece.special === null
          ? TEX.tile[piece.kind]
          : SPECIAL_TEX[piece.special];
  const shadow = img(mainKey).setTint(0x000000).setAlpha(0.25).setPosition(cell * 0.04, cell * 0.04);
  shadow.scaleY *= 0.9;
  node.add(shadow);

  const ring = scene.add.graphics();
  ring.name = 'sel';
  ring.fillStyle(0xffffff, 0.25).fillCircle(0, 0, half);
  ring.lineStyle(3, 0xffffff, 0.95).strokeCircle(0, 0, half);
  ring.setVisible(false);
  node.add(ring);

  if (piece.kind === 'gnome') {
    const head = img(TEX.gnome);
    art.add(head);
    scene.tweens.add({ targets: head, y: -cell * 0.08, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
  } else if (piece.kind === 'prism') {
    const gem = img(TEX.prism);
    art.add(gem);
    scene.tweens.add({ targets: gem, angle: 14, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
  } else if (piece.special === null) {
    art.add(img(TEX.tile[piece.kind]));
  } else {
    const back = img(TEX.back[piece.kind]);
    art.add(back);
    scene.tweens.add({ targets: back, alpha: 0.55, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });

    const special = img(SPECIAL_TEX[piece.special]);
    art.add(special);
    scene.tweens.add({ targets: special, scale: special.scaleX * 1.08, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });

    const badge = img(TEX.tile[piece.kind], cell * 0.35).setPosition(cell * 0.28, -cell * 0.28);
    art.add(badge);
  }
  node.add(art);
  return node;
}
