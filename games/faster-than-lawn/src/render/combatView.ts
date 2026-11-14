// Draws both mowers, crew, fires, shields and projectiles for CombatScene.
import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT, TEX } from '../config';
import { WEAPONS } from '../sim/data';
import { effectivePower, roomIdOfSystem } from '../sim/queries';
import { SYSTEM_LABELS } from '../sim/types';
import type { CombatEvent, CombatState, Crew, Room, ShipState, Side, SystemId } from '../sim/types';

interface Point { x: number; y: number }

interface RoomView {
  system: SystemId | null;
  centre: Point;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  overlay: Phaser.GameObjects.Rectangle;
  fire: Phaser.GameObjects.Image;
  flicker: { v: number };
}

interface ShipView {
  centre: Point;
  shieldW: number;
  shieldH: number;
  shieldGfx: Phaser.GameObjects.Graphics;
  shieldDrawnLayers: number;
  weaponsRoomId: number;
  rooms: Map<number, RoomView>;
}

interface CrewView {
  sprite: Phaser.GameObjects.Image;
  hpBar: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Graphics;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export class CombatView {
  /** Set by CombatScene. Called when a room rectangle is clicked (left button). */
  onRoomClicked: (side: Side, roomId: number) => void = () => {};
  /** Set by CombatScene. Called when a crew sprite is clicked. */
  onCrewClicked: (side: Side, crewId: number) => void = () => {};

  private views!: Record<Side, ShipView>;
  private readonly crewViews: Record<Side, Map<number, CrewView>> = { player: new Map(), enemy: new Map() };
  private readonly projectileImages = new Map<number, Phaser.GameObjects.Image>();
  private sparks!: ReturnType<Phaser.GameObjects.GameObjectFactory['particles']>;
  private selectedCrewId: number | null = null;
  private targeting = false;

  constructor(protected scene: Phaser.Scene, state: CombatState) {
    this.drawLawn();
    this.views = {
      player: this.buildShip('player', state.player),
      enemy: this.buildShip('enemy', state.enemy),
    };
    this.sparks = this.scene.add.particles(0, 0, TEX.spark, {
      speed: { min: 60, max: 200 },
      lifespan: 450,
      scale: { start: 1, end: 0 },
      emitting: false,
    });
  }

  /** Call every frame (also while paused). Reads state.log for effects; CombatScene empties the log afterwards. */
  update(state: CombatState): void {
    this.updateShip('player', state.player);
    this.updateShip('enemy', state.enemy);
    this.updateCrew('player', state.player);
    this.updateCrew('enemy', state.enemy);
    this.updateProjectiles(state);
    for (const e of state.log) this.handleEvent(e);
  }

  /** Highlight this player crew member (null = none). */
  setSelectedCrew(crewId: number | null): void {
    this.selectedCrewId = crewId;
  }

  /** While true, enemy rooms highlight on hover (a weapon is being aimed). */
  setTargeting(active: boolean): void {
    this.targeting = active;
    for (const rv of this.views.enemy.rooms.values()) this.paintRoomStroke('enemy', rv);
  }

  /** Pixel centre of a room. */
  roomCenter(side: Side, roomId: number): { x: number; y: number } {
    const rv = this.views[side].rooms.get(roomId);
    return rv ? { x: rv.centre.x, y: rv.centre.y } : { x: 0, y: 0 };
  }

  // ---- building (once, in the constructor) ----

  private drawLawn(): void {
    this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.lawnDark, 1)
      .setOrigin(0, 0).setDepth(-10);
    for (let x = 0; x < GAME_WIDTH; x += 160) {
      this.scene.add.rectangle(x, 0, 80, GAME_HEIGHT, COLORS.lawnLight, 0.5)
        .setOrigin(0, 0).setDepth(-10);
    }
  }

  private buildShip(side: Side, ship: ShipState): ShipView {
    const origin = side === 'player' ? LAYOUT.playerOrigin : LAYOUT.enemyOrigin;
    const tile = LAYOUT.tile;
    const pad = 24;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of ship.rooms) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    }
    const left = origin.x + minX * tile - pad;
    const top = origin.y + minY * tile - pad;
    const right = origin.x + maxX * tile + pad;
    const bottom = origin.y + maxY * tile + pad;
    const bw = right - left;
    const bh = bottom - top;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    // Body, blade deck, wheels, name.
    this.scene.add.rectangle(cx, cy, bw, bh, side === 'player' ? COLORS.hullPlayer : COLORS.hullEnemy)
      .setDepth(-5);
    this.scene.add.rectangle(cx, bottom + 8, bw, 16, 0x9e9e9e).setDepth(-5);
    const wheels = this.scene.add.graphics().setDepth(-4);
    wheels.fillStyle(0x212121, 1);
    const corners: [number, number][] = [[left, top], [right, top], [left, bottom], [right, bottom]];
    for (const [wx, wy] of corners) wheels.fillCircle(wx, wy, 22);
    this.scene.add.text(cx, top - 40, ship.name, { color: COLORS.text, fontSize: '18px' })
      .setOrigin(0.5).setDepth(1);

    // Rooms.
    const rooms = new Map<number, RoomView>();
    for (const room of ship.rooms) rooms.set(room.id, this.buildRoom(side, room, origin));

    // Shield ellipse, redrawn only when its layer count changes.
    const shieldGfx = this.scene.add.graphics().setDepth(3);

    return {
      centre: { x: cx, y: cy },
      shieldW: bw + 60,
      shieldH: bh + 60,
      shieldGfx,
      shieldDrawnLayers: -1,
      weaponsRoomId: roomIdOfSystem(ship, 'weapons'),
      rooms,
    };
  }

  private buildRoom(side: Side, room: Room, origin: Point): RoomView {
    const tile = LAYOUT.tile;
    const x = origin.x + room.x * tile;
    const y = origin.y + room.y * tile;
    const w = room.w * tile;
    const h = room.h * tile;

    const rect = this.scene.add.rectangle(x, y, w, h, COLORS.room)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.roomStroke)
      .setDepth(0);
    const label = this.scene.add.text(x + 4, y + 4, room.system ? SYSTEM_LABELS[room.system] : '',
      { color: COLORS.text, fontSize: '11px' }).setDepth(1);
    const status = this.scene.add.text(x + 4, y + h - 4, '', { color: COLORS.text, fontSize: '12px' })
      .setOrigin(0, 1).setDepth(1);
    const overlay = this.scene.add.rectangle(x, y, w, h, COLORS.damage, 0.25)
      .setOrigin(0, 0).setDepth(1).setVisible(false);
    const fire = this.scene.add.image(x + w / 2, y + h / 2, TEX.fire).setDepth(1).setVisible(false);

    // Flicker multiplier on the fire scale; update() multiplies it by the fire strength.
    const flicker = { v: 1 };
    this.scene.tweens.add({ targets: flicker, v: 1.12, duration: 180, yoyo: true, repeat: -1 });

    const rv: RoomView = {
      system: room.system,
      centre: { x: x + w / 2, y: y + h / 2 },
      rect,
      label,
      status,
      overlay,
      fire,
      flicker,
    };

    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerdown', () => this.onRoomClicked(side, room.id));
    rect.on('pointerover', () => {
      if (side === 'player' || this.targeting) rect.setStrokeStyle(2, COLORS.roomHover, 1);
    });
    rect.on('pointerout', () => this.paintRoomStroke(side, rv));

    return rv;
  }

  private paintRoomStroke(side: Side, rv: RoomView): void {
    if (side === 'enemy' && this.targeting) rv.rect.setStrokeStyle(2, COLORS.roomHover, 0.5);
    else rv.rect.setStrokeStyle(2, COLORS.roomStroke, 1);
  }

  private drawShield(view: ShipView, layers: number): void {
    const g = view.shieldGfx;
    g.clear();
    view.shieldDrawnLayers = layers;
    if (layers <= 0) {
      g.setVisible(false);
      return;
    }
    g.setVisible(true);
    g.setAlpha(0.3 + 0.15 * layers);
    g.lineStyle(2 + 2 * layers, COLORS.shield, 1);
    g.strokeEllipse(view.centre.x, view.centre.y, view.shieldW, view.shieldH);
  }

  // ---- per-frame drawing ----

  private updateShip(side: Side, ship: ShipState): void {
    const view = this.views[side];
    if (view.shieldDrawnLayers !== ship.shieldLayers) this.drawShield(view, ship.shieldLayers);

    for (const room of ship.rooms) {
      const rv = view.rooms.get(room.id);
      if (!rv) continue;

      if (room.system) {
        const sys = ship.systems[room.system];
        rv.status.setText(`${effectivePower(sys)}/${sys.level}`);
        rv.status.setColor(sys.damage > 0 ? COLORS.danger : COLORS.text);
        rv.overlay.setVisible(sys.damage > 0);
      }

      if (room.fire > 0) {
        rv.fire
          .setVisible(true)
          .setPosition(rv.centre.x, rv.centre.y)
          .setScale((0.8 + room.fire / 100) * rv.flicker.v);
      } else {
        rv.fire.setVisible(false);
      }
    }
  }

  private updateCrew(side: Side, ship: ShipState): void {
    const views = this.crewViews[side];

    // Remove sprites of crew that are gone.
    const live = new Set(ship.crew.map((c) => c.id));
    for (const [id, cv] of views) {
      if (live.has(id)) continue;
      cv.sprite.destroy();
      cv.hpBar.destroy();
      cv.ring.destroy();
      views.delete(id);
    }

    // Standing crew grouped by room, for slot offsets.
    const standing = new Map<number, Crew[]>();
    for (const c of ship.crew) {
      if (c.moveMsLeft > 0) continue;
      const list = standing.get(c.roomId);
      if (list) list.push(c);
      else standing.set(c.roomId, [c]);
    }

    for (const c of ship.crew) {
      let cv = views.get(c.id);
      if (!cv) {
        cv = this.createCrewView(side, c.id);
        views.set(c.id, cv);
      }

      let pos: Point;
      if (c.moveMsLeft > 0) {
        const a = this.roomCenter(side, c.fromRoomId);
        const b = this.roomCenter(side, c.roomId);
        const t = c.moveMsTotal > 0 ? clamp01(1 - c.moveMsLeft / c.moveMsTotal) : 1;
        pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      } else {
        const list = standing.get(c.roomId) ?? [];
        const k = list.indexOf(c);
        const n = list.length;
        const centre = this.roomCenter(side, c.roomId);
        pos = { x: centre.x + (k - (n - 1) / 2) * 22, y: centre.y + 6 };
      }

      cv.sprite.setPosition(pos.x, pos.y);

      // HP bar above the head.
      const frac = clamp01(c.hp / c.maxHp);
      cv.hpBar.clear();
      cv.hpBar.fillStyle(0x000000, 0.6);
      cv.hpBar.fillRect(pos.x - 12, pos.y - 22, 24, 4);
      cv.hpBar.fillStyle(frac < 0.35 ? 0xff1744 : 0x76ff03, 1);
      cv.hpBar.fillRect(pos.x - 12, pos.y - 22, 24 * frac, 4);

      // Selection ring under the selected player gnome.
      cv.ring.clear();
      if (side === 'player' && c.id === this.selectedCrewId) {
        cv.ring.lineStyle(2, COLORS.roomSelected, 1);
        cv.ring.strokeEllipse(pos.x, pos.y + 12, 28, 12);
      }
    }
  }

  private createCrewView(side: Side, id: number): CrewView {
    const sprite = this.scene.add.image(0, 0, side === 'player' ? TEX.gnome : TEX.gnomeEnemy).setDepth(5);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => this.onCrewClicked(side, id));
    const ring = this.scene.add.graphics().setDepth(4);
    const hpBar = this.scene.add.graphics().setDepth(6);
    return { sprite, hpBar, ring };
  }

  private updateProjectiles(state: CombatState): void {
    const live = new Set<number>();
    for (const p of state.projectiles) {
      live.add(p.id);
      const targetSide: Side = p.from === 'player' ? 'enemy' : 'player';
      const a = this.roomCenter(p.from, this.views[p.from].weaponsRoomId);
      const b = this.roomCenter(targetSide, p.targetRoomId);
      const t = p.travelMsTotal > 0 ? clamp01(1 - p.travelMsLeft / p.travelMsTotal) : 1;
      const lobber = WEAPONS[p.defId]?.kind === 'lobber';

      let img = this.projectileImages.get(p.id);
      if (!img) {
        img = this.scene.add.image(a.x, a.y, lobber ? TEX.pinecone : TEX.clipping).setDepth(10);
        if (!lobber) img.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
        this.projectileImages.set(p.id, img);
      }

      let y = a.y + (b.y - a.y) * t;
      const x = a.x + (b.x - a.x) * t;
      if (lobber) y -= Math.sin(t * Math.PI) * 140;
      img.setPosition(x, y);
    }

    for (const [id, img] of this.projectileImages) {
      if (live.has(id)) continue;
      img.destroy();
      this.projectileImages.delete(id);
    }
  }

  // ---- log effects (state.log is read here, cleared by CombatScene) ----

  private handleEvent(e: CombatEvent): void {
    switch (e.type) {
      case 'hit': {
        const c = this.roomCenter(e.target, e.roomId);
        this.sparks.explode(12, c.x, c.y);
        this.floatText(c.x, c.y, `-${e.damage}`, COLORS.danger);
        if (e.target === 'player') this.scene.cameras.main.shake(150, 0.006);
        break;
      }
      case 'miss': {
        const c = this.roomCenter(e.target, e.roomId);
        this.floatText(c.x, c.y, 'MISS', '#ffffff');
        break;
      }
      case 'shieldBlock': {
        const c = this.roomCenter(e.target, e.roomId);
        this.floatText(c.x, c.y, 'BLOCKED', '#4fc3f7');
        this.scene.tweens.add({ targets: this.views[e.target].shieldGfx, alpha: 1, duration: 80, yoyo: true });
        break;
      }
      case 'crewDied': {
        const c = this.views[e.side].centre;
        this.floatText(c.x, c.y, `${e.name} is compost!`, COLORS.text);
        break;
      }
      case 'repaired': {
        const c = this.roomCenter(e.side, e.roomId);
        this.floatText(c.x, c.y, '+1', '#76ff03');
        break;
      }
      default:
        break;
    }
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.scene.add.text(x, y, text, { color, fontSize: '16px', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }
}
