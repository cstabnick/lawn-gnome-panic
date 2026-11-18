import Phaser from 'phaser';

/** Draws one built item centred on (x, y), sized about w x h, using palette [main, second, accent]. */
export type DrawFn = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, colors: readonly [number, number, number]) => void;

/** Draws an area's background over the whole AREA_W x AREA_H (1000 x 700) design space.
 *  `done` = every slot of the area is built: draw it brighter and tidier (sunshine, sparkle). */
export type BackdropFn = (g: Phaser.GameObjects.Graphics, done: boolean) => void;
