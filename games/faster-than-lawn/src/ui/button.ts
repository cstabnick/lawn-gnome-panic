import Phaser from 'phaser';
import { COLORS } from '../config';

export interface Button {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  setEnabled(enabled: boolean): void;
  setText(text: string): void;
}

/** A clickable rectangle button centred on (x, y). onClick fires on pointerup while enabled. */
export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, onClick: () => void, fontSize = 18): Button {
  const bg = scene.add.rectangle(0, 0, w, h, COLORS.button).setStrokeStyle(2, 0xffffff, 0.6);
  const label = scene.add.text(0, 0, text, { color: COLORS.text, fontSize: `${fontSize}px`, align: 'center' }).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, label]);
  let enabled = true;
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => { if (enabled) bg.setFillStyle(COLORS.buttonHover); });
  bg.on('pointerout', () => bg.setFillStyle(enabled ? COLORS.button : COLORS.buttonDisabled));
  bg.on('pointerup', () => { if (enabled) onClick(); });
  return {
    container,
    label,
    setEnabled(e: boolean) {
      enabled = e;
      bg.setFillStyle(e ? COLORS.button : COLORS.buttonDisabled);
      label.setColor(e ? COLORS.text : COLORS.textDim);
    },
    setText(t: string) { label.setText(t); },
  };
}
