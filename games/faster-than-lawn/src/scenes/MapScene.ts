import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TEX } from '../config';
import type { CombatSceneData, EventSceneData, GameOverData } from '../config';
import { getRun, currentBeacon, beaconTier } from '../run';
import type { RunState } from '../run';
import { EVENTS } from '../sim/events';
import type { Beacon, BeaconKind } from '../sim/types';
import { playSfx } from '../audio';
import { makeButton } from '../ui/button';

const TINT: Record<BeaconKind, number> = {
  start: 0xffffff,
  fight: 0xff5252,
  event: 0xffd54f,
  shop: 0x4fc3f7,
  empty: 0xcfd8dc,
  exit: 0xffab00,
};

const LABEL: Record<BeaconKind, string> = {
  start: 'START',
  fight: 'FIGHT',
  event: '?',
  shop: 'SHOP',
  empty: '',
  exit: 'GARDEN GATE',
};

// Back-yard map: hop along links to the Garden Gate.
export class MapScene extends Phaser.Scene {
  private busy = false;

  constructor() { super(SCENES.map); }

  create(): void {
    this.busy = false;
    const run = getRun(this);
    const ship = run.ship;

    if (ship.hull <= 0 || ship.crew.length === 0) {
      this.scene.start(SCENES.gameOver, { victory: false, jumps: run.jumps, scrap: run.scrap } satisfies GameOverData);
      return;
    }

    // Background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.lawnDark).setOrigin(0, 0);
    const stripes = this.add.graphics();
    stripes.fillStyle(COLORS.lawnLight, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 160) stripes.fillRect(x, 0, 80, GAME_HEIGHT);

    this.add.text(640, 30, 'THE BACK YARD - reach the Garden Gate', { color: COLORS.text, fontSize: '28px' }).setOrigin(0.5);
    this.add.text(
      640, 64,
      `Hull ${ship.hull}/${ship.maxHull}   Scrap ${run.scrap}   Pinecones ${ship.pinecones}   Gnomes ${ship.crew.length}   Jumps ${run.jumps}`,
      { color: COLORS.text, fontSize: '18px' },
    ).setOrigin(0.5);

    // Links
    const beacons = run.sector.beacons;
    const links = this.add.graphics();
    links.lineStyle(3, 0xffffff, 0.25);
    for (const b of beacons) {
      for (const id of b.links) {
        const t = beacons[id];
        links.lineBetween(b.x, b.y, t.x, t.y);
      }
    }

    // Beacons
    const current = currentBeacon(run);
    const reachable = new Set(current.links);
    for (const b of beacons) {
      const base = b.kind === 'exit' ? 1.4 : 1;
      const img = this.add.image(b.x, b.y, TEX.beacon)
        .setTint(b.visited ? 0x777777 : TINT[b.kind])
        .setScale(base);
      const label = LABEL[b.kind];
      if (label !== '') {
        this.add.text(b.x, b.y + (b.kind === 'exit' ? 26 : 20), label, { color: COLORS.text, fontSize: '12px' }).setOrigin(0.5, 0);
      }
      if (reachable.has(b.id)) {
        this.tweens.add({ targets: img, scale: base * 1.25, duration: 600, yoyo: true, repeat: -1 });
        img.setInteractive({ useHandCursor: true });
        img.on('pointerdown', () => this.travel(run, b));
      }
    }

    // Current beacon marker
    const ring = this.add.graphics();
    ring.lineStyle(3, 0xff5252, 1);
    ring.strokeCircle(current.x, current.y, 22);
    this.add.text(current.x, current.y - 30, 'YOU', { color: COLORS.text, fontSize: '12px' }).setOrigin(0.5, 1);

    // Shop shortcut
    if (current.kind === 'shop') {
      makeButton(this, 640, 680, 240, 44, 'Visit shop', () => this.scene.start(SCENES.shop), 20);
    }

    // Legend
    this.add.text(16, GAME_HEIGHT - 16, 'red FIGHT  yellow EVENT  blue SHOP  orange GATE (boss)', { color: COLORS.textDim, fontSize: '12px' }).setOrigin(0, 1);
  }

  private travel(run: RunState, b: Beacon): void {
    if (this.busy) return;
    this.busy = true;

    run.beaconId = b.id;
    run.jumps += 1;
    const firstVisit = !b.visited;
    b.visited = true;
    playSfx('jump');

    switch (b.kind) {
      case 'fight':
        this.scene.start(SCENES.combat, { tier: beaconTier(b), isBoss: false } satisfies CombatSceneData);
        return;
      case 'exit':
        this.scene.start(SCENES.combat, { tier: 5, isBoss: true } satisfies CombatSceneData);
        return;
      case 'event':
        this.scene.start(SCENES.event, { eventId: b.eventId ?? EVENTS[0].id } satisfies EventSceneData);
        return;
      case 'shop':
        this.scene.start(SCENES.shop);
        return;
      case 'empty':
      case 'start':
        if (firstVisit) run.scrap += 3;
        this.scene.restart();
        return;
    }
  }
}
