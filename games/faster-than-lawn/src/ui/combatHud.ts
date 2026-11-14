import Phaser from 'phaser';
import { COLORS, TUNING } from '../config';
import { getRun } from '../run';
import { WEAPONS } from '../sim/data';
import { aliveCrew, effectivePower, evasion, freePower, jumpReady, shieldMax, weaponChargeTime } from '../sim/queries';
import { SYSTEM_LABELS } from '../sim/types';
import type { CombatState, Room, ShipState, SystemId, WeaponState } from '../sim/types';
import { makeButton } from './button';
import type { Button } from './button';

export interface HudCallbacks {
  onSystemPower(id: Exclude<SystemId, 'weapons'>, delta: 1 | -1): void;
  onWeaponToggle(index: number): void;
  onWeaponAim(index: number): void;
  onCrewSelect(crewId: number): void;
  onJump(): void;
}

export interface HudView { paused: boolean; aimingWeapon: number | null; selectedCrewId: number | null }

const DEPTH = 30;
const POWER_SYSTEMS: Exclude<SystemId, 'weapons'>[] = ['pilot', 'engines', 'shields', 'medbay'];
const BAR_PITCH = 14;
const WEAPON_X = 420;
const WEAPON_PITCH = 180;
const WEAPON_Y = 505;
const CREW_X = 1000;
const CREW_Y = 500;
const CREW_PITCH = 32;
const CREW_W = 200;

interface SystemColumn {
  id: Exclude<SystemId, 'weapons'>;
  minus: Button;
  plus: Button;
  bars: Phaser.GameObjects.Rectangle[];
}

interface WeaponCard {
  border: Phaser.GameObjects.Rectangle;
  charge: Phaser.GameObjects.Rectangle;
  status: Phaser.GameObjects.Text;
  pwr: Button;
  aim: Button;
}

interface CrewRow {
  id: number;
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  hp: Phaser.GameObjects.Rectangle;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Scale a left-anchored bar fill to a fraction of its full width. */
function setFraction(fill: Phaser.GameObjects.Rectangle, fraction: number): void {
  fill.setScale(clamp01(fraction), 1);
}

function roomLabel(ship: ShipState, roomId: number): string {
  const room: Room | undefined = ship.rooms[roomId];
  if (!room || room.system === null) return `ROOM ${roomId}`;
  return SYSTEM_LABELS[room.system];
}

export class CombatHud {
  private readonly scene: Phaser.Scene;
  private readonly cb: HudCallbacks;
  private readonly enabledCache = new Map<Button, boolean>();

  private readonly playerHull: Phaser.GameObjects.Rectangle;
  private readonly playerHullText: Phaser.GameObjects.Text;
  private readonly playerLine: Phaser.GameObjects.Text;
  private readonly enemyHull: Phaser.GameObjects.Rectangle;
  private readonly enemyHullText: Phaser.GameObjects.Text;
  private readonly enemyLine: Phaser.GameObjects.Text;
  private readonly reactorText: Phaser.GameObjects.Text;
  private readonly systems: SystemColumn[] = [];
  private readonly weapons: WeaponCard[] = [];
  private crewRows: CrewRow[] = [];
  private crewKey = '';
  private readonly jumpButton: Button;
  private readonly jumpText: Phaser.GameObjects.Text;
  private readonly banner: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, state: CombatState, cb: HudCallbacks) {
    this.scene = scene;
    this.cb = cb;
    const p = state.player;
    const e = state.enemy;

    const text = (x: number, y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text =>
      scene.add.text(x, y, str, style).setDepth(DEPTH);
    const rect = (x: number, y: number, w: number, h: number, color: number, alpha = 1): Phaser.GameObjects.Rectangle =>
      scene.add.rectangle(x, y, w, h, color, alpha).setOrigin(0, 0).setDepth(DEPTH);

    // Bottom panel and help line.
    rect(0, 470, 1280, 250, 0x000000, 0.75);
    text(640, 482, 'Click a gnome, then a room to move it.  AIM a weapon, then click an enemy room.  SPACE pauses.', { color: COLORS.textDim, fontSize: '13px' }).setOrigin(0.5, 0);

    // Top-left: player ship.
    text(20, 14, p.name, { color: COLORS.text, fontSize: '18px' });
    rect(20, 40, 300, 18, COLORS.room);
    this.playerHull = rect(20, 40, 300, 18, COLORS.power);
    this.playerHullText = text(170, 49, '', { color: COLORS.text, fontSize: '13px' }).setOrigin(0.5);
    this.playerLine = text(20, 66, '', { color: COLORS.text, fontSize: '14px' });

    // Top-right: enemy ship.
    text(1260, 14, e.name, { color: COLORS.text, fontSize: '18px' }).setOrigin(1, 0);
    rect(960, 40, 300, 18, COLORS.room);
    this.enemyHull = rect(960, 40, 300, 18, COLORS.damage);
    this.enemyHullText = text(1110, 49, '', { color: COLORS.text, fontSize: '13px' }).setOrigin(0.5);
    this.enemyLine = text(1260, 66, '', { color: COLORS.text, fontSize: '14px' }).setOrigin(1, 0);

    // Reactor and power columns.
    this.reactorText = text(20, 500, '', { color: COLORS.text, fontSize: '16px' });
    POWER_SYSTEMS.forEach((id, i) => {
      const level = p.systems[id].level;
      if (level <= 0) return;
      const x0 = 20 + i * 90;
      text(x0, 525, SYSTEM_LABELS[id], { color: COLORS.text, fontSize: '14px' });
      const minus = makeButton(scene, x0 + 25, 552, 30, 24, '-', () => cb.onSystemPower(id, -1), 16);
      const plus = makeButton(scene, x0 + 65, 552, 30, 24, '+', () => cb.onSystemPower(id, 1), 16);
      minus.container.setDepth(DEPTH);
      plus.container.setDepth(DEPTH);
      const bars: Phaser.GameObjects.Rectangle[] = [];
      for (let b = 0; b < level; b++) {
        bars.push(rect(x0 + 15, 690 - b * BAR_PITCH, 60, 10, COLORS.powerOff));
      }
      this.systems.push({ id, minus, plus, bars });
    });

    // Weapon cards.
    p.weapons.forEach((w, i) => {
      const x = WEAPON_X + i * WEAPON_PITCH;
      const border = rect(x, WEAPON_Y, 170, 150, 0x000000, 0.4).setStrokeStyle(2, COLORS.powerOff);
      text(x + 10, WEAPON_Y + 8, WEAPONS[w.defId].name, { color: COLORS.text, fontSize: '14px' });
      rect(x + 10, WEAPON_Y + 30, 150, 12, COLORS.room);
      const charge = rect(x + 10, WEAPON_Y + 30, 150, 12, COLORS.shield);
      const status = text(x + 10, WEAPON_Y + 50, '', { color: COLORS.text, fontSize: '14px' });
      text(x + 10, WEAPON_Y + 70, `+${WEAPONS[w.defId].power} power`, { color: COLORS.textDim, fontSize: '13px' });
      const pwr = makeButton(scene, x + 42, WEAPON_Y + 120, 80, 24, 'PWR', () => cb.onWeaponToggle(i), 14);
      const aim = makeButton(scene, x + 128, WEAPON_Y + 120, 80, 24, `AIM [${i + 1}]`, () => cb.onWeaponAim(i), 14);
      pwr.container.setDepth(DEPTH);
      aim.container.setDepth(DEPTH);
      this.weapons.push({ border, charge, status, pwr, aim });
    });

    // Jump.
    this.jumpText = text(1215, 640, '', { color: COLORS.text, fontSize: '14px' }).setOrigin(0.5);
    this.jumpButton = makeButton(scene, 1215, 680, 110, 50, 'JUMP', () => cb.onJump());
    this.jumpButton.container.setDepth(DEPTH);

    // Paused banner.
    this.banner = text(640, 445, 'PAUSED - SPACE to resume', { color: COLORS.accent, fontSize: '28px' }).setOrigin(0.5).setVisible(false);
  }

  update(state: CombatState, view: HudView): void {
    const p = state.player;
    const e = state.enemy;
    const run = getRun(this.scene);

    this.banner.setVisible(view.paused);

    setFraction(this.playerHull, p.hull / p.maxHull);
    this.playerHullText.setText(`HULL ${Math.max(0, p.hull)}/${p.maxHull}`);
    this.playerLine.setText(`Hedge ${p.shieldLayers}/${shieldMax(p)}   Dodge ${Math.round(evasion(p) * 100)}%   Scrap ${run.scrap}   Pinecones ${p.pinecones}`);

    setFraction(this.enemyHull, e.hull / e.maxHull);
    this.enemyHullText.setText(`HULL ${Math.max(0, e.hull)}/${e.maxHull}`);
    this.enemyLine.setText(`Hedge ${e.shieldLayers}/${shieldMax(e)}   Dodge ${Math.round(evasion(e) * 100)}%`);

    this.reactorText.setText(`REACTOR ${freePower(p)}/${p.reactor}`);
    const free = freePower(p);

    for (const col of this.systems) {
      const sys = p.systems[col.id];
      this.enable(col.minus, sys.power > 0);
      this.enable(col.plus, sys.power < sys.level - sys.damage && free > 0);
      const working = effectivePower(sys);
      col.bars.forEach((bar, b) => {
        bar.setFillStyle(b < working ? COLORS.power : b >= sys.level - sys.damage ? COLORS.damage : COLORS.powerOff);
      });
    }

    this.weapons.forEach((card, i) => {
      const w: WeaponState | undefined = p.weapons[i];
      if (!w) return;
      const def = WEAPONS[w.defId];
      const full = weaponChargeTime(p, w);
      setFraction(card.charge, full > 0 ? w.chargeMs / full : 1);
      const borderColor = view.aimingWeapon === i ? COLORS.roomHover : w.powered ? COLORS.power : COLORS.powerOff;
      card.border.setStrokeStyle(2, borderColor);
      let status: string;
      if (!w.powered) status = 'OFF';
      else if (w.targetRoomId !== null) status = `TARGET: ${roomLabel(e, w.targetRoomId)}`;
      else if (w.chargeMs >= full) status = 'READY';
      else status = 'CHARGING';
      if (def.kind === 'lobber') status += ' (pinecone)';
      card.status.setText(status);
    });

    const jumpPct = Math.min(100, Math.floor((state.jumpChargeMs / TUNING.jumpChargeMs) * 100));
    this.jumpText.setText(`Jump ${jumpPct}%`);
    this.enable(this.jumpButton, jumpReady(state));

    this.updateCrew(state, view.selectedCrewId);
  }

  private enable(btn: Button, on: boolean): void {
    if (this.enabledCache.get(btn) === on) return;
    this.enabledCache.set(btn, on);
    btn.setEnabled(on);
  }

  private updateCrew(state: CombatState, selectedCrewId: number | null): void {
    const alive = aliveCrew(state.player);
    const key = alive.map((c) => c.id).join(',');
    if (key !== this.crewKey) {
      this.crewKey = key;
      for (const row of this.crewRows) row.container.destroy();
      this.crewRows = alive.map((crew, i) => this.buildCrewRow(crew.id, crew.name, i));
    }
    for (const row of this.crewRows) {
      const crew = state.player.crew.find((c) => c.id === row.id);
      if (crew) setFraction(row.hp, crew.hp / crew.maxHp);
      const selected = row.id === selectedCrewId;
      row.bg.setFillStyle(selected ? COLORS.roomSelected : 0x000000, selected ? 0.45 : 0.3);
    }
  }

  private buildCrewRow(id: number, name: string, index: number): CrewRow {
    const y = CREW_Y + index * CREW_PITCH;
    const bg = this.scene.add.rectangle(0, 0, CREW_W, 28, 0x000000, 0.3).setOrigin(0, 0);
    const label = this.scene.add.text(6, 6, name, { color: COLORS.text, fontSize: '14px' });
    const hpBack = this.scene.add.rectangle(110, 10, 80, 8, COLORS.room).setOrigin(0, 0);
    const hp = this.scene.add.rectangle(110, 10, 80, 8, COLORS.power).setOrigin(0, 0);
    const container = this.scene.add.container(CREW_X, y, [bg, label, hpBack, hp]).setDepth(DEPTH);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerup', () => this.cb.onCrewSelect(id));
    return { id, container, bg, hp };
  }
}
