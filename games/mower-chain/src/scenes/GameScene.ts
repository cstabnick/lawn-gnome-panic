// The game scene: wires the session (network or offline world), the arena view and the HUD together.
import Phaser from 'phaser';
import { SCENES } from '../config';
import type { MowerInput } from '../config';
import { createSession } from '../online';
import type { Session } from '../online';
import { ArenaView } from '../render';
import { Hud } from '../hud';

export class GameScene extends Phaser.Scene {
  private session!: Session;
  private view!: ArenaView;
  private hud!: Hud;
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private heading = 0;
  private pointerSeen = false;

  private readonly onPointer = (): void => {
    this.pointerSeen = true;
  };

  constructor() { super(SCENES.game); }

  create(data: { name: string }): void {
    this.heading = 0;
    this.pointerSeen = false;

    this.session = createSession(data.name);
    this.view = new ArenaView(this);
    this.hud = new Hud(() => this.session.respawn());
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on('pointermove', this.onPointer);
    this.input.on('pointerdown', this.onPointer);

    this.events.once('shutdown', () => {
      this.input.off('pointermove', this.onPointer);
      this.input.off('pointerdown', this.onPointer);
      this.session.destroy();
      this.view.destroy();
      this.hud.destroy();
    });
  }

  update(_time: number, delta: number): void {
    const cam = this.cameras.main;
    const pointer = this.input.activePointer;

    // Heading points from the screen centre to the pointer; keep 0 until the pointer has been used.
    if (this.pointerSeen) {
      this.heading = Math.atan2(pointer.y - cam.height / 2, pointer.x - cam.width / 2);
    }
    const boost = pointer.isDown || (this.spaceKey?.isDown ?? false);

    const input: MowerInput = { angle: this.heading, boost };
    this.session.setInput(input);

    const snap = this.session.update(delta);
    if (snap) this.view.update(snap, this.session.myId, delta);
    this.hud.addEvents(this.session.drainEvents());
    this.hud.update(snap, this.session.myId, this.session);
  }
}
