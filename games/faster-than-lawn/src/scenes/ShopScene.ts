import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TUNING } from '../config';
import { getRun } from '../run';
import type { RunState } from '../run';
import { makeCrew } from '../sim/ships';
import { GNOME_NAMES, SHOP_WEAPON_IDS, WEAPONS } from '../sim/data';
import { SYSTEM_LABELS } from '../sim/types';
import type { SystemId } from '../sim/types';
import { playSfx } from '../audio';
import { makeButton } from '../ui/button';

interface ShopItem {
  label: string;
  cost: number;
  available: boolean;
  apply: () => void;
}

const UPGRADABLE: SystemId[] = ['pilot', 'engines', 'shields', 'weapons', 'medbay'];

function buildItems(run: RunState): ShopItem[] {
  const ship = run.ship;
  const missing = ship.maxHull - ship.hull;
  const items: ShopItem[] = [];

  items.push({
    label: 'Repair 5 hull',
    cost: 5 * TUNING.shopHullRepairCost,
    available: missing > 0,
    apply: () => { ship.hull += Math.min(5, missing); },
  });
  items.push({
    label: 'Repair all hull',
    cost: missing * TUNING.shopHullRepairCost,
    available: missing > 0,
    apply: () => { ship.hull = ship.maxHull; },
  });
  items.push({
    label: '3 pinecones',
    cost: 3 * TUNING.shopPineconeCost,
    available: true,
    apply: () => { ship.pinecones += 3; },
  });
  items.push({
    label: 'Reactor +1',
    cost: TUNING.shopReactorCost,
    available: true,
    apply: () => { ship.reactor += 1; },
  });

  for (const id of UPGRADABLE) {
    const sys = ship.systems[id];
    items.push({
      label: `Upgrade ${SYSTEM_LABELS[id]} to ${sys.level + 1}`,
      cost: TUNING.shopSystemUpgradeCost * Math.max(1, sys.level),
      available: sys.level < TUNING.shopMaxSystemLevel,
      apply: () => { sys.level += 1; },
    });
  }

  items.push({
    label: 'Hire a gnome',
    cost: TUNING.shopHireCost,
    available: ship.crew.length < 6,
    apply: () => {
      const name = GNOME_NAMES.find((n) => !ship.crew.some((c) => c.name === n)) ?? 'Gnome';
      ship.crew.push(makeCrew(name, 0));
    },
  });

  const len = SHOP_WEAPON_IDS.length;
  for (const offset of [0, 1]) {
    const defId = SHOP_WEAPON_IDS[(run.beaconId * 7 + offset) % len];
    const def = WEAPONS[defId];
    items.push({
      label: `${def.name} (power ${def.power}, ${def.shots}x${def.damage} dmg${def.kind === 'lobber' ? ', uses pinecones' : ''})`,
      cost: def.cost,
      available: ship.weapons.length < 4,
      apply: () => { ship.weapons.push({ defId, powered: false, chargeMs: 0, targetRoomId: null }); },
    });
  }

  return items;
}

// Between fights: spend scrap on repairs, upgrades, gnomes and weapons.
export class ShopScene extends Phaser.Scene {
  constructor() { super(SCENES.shop); }

  create(): void {
    const run = getRun(this);
    const ship = run.ship;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.lawnDark).setOrigin(0, 0);
    this.add.text(640, 40, 'THE POTTING SHED', { color: COLORS.accent, fontSize: '36px' }).setOrigin(0.5);
    this.add.text(
      640, 96,
      `Scrap ${run.scrap}   Hull ${ship.hull}/${ship.maxHull}   Reactor ${ship.reactor}   Pinecones ${ship.pinecones}   Gnomes ${ship.crew.length}`,
      { color: COLORS.text, fontSize: '18px' },
    ).setOrigin(0.5);

    buildItems(run).forEach((item, i) => {
      const y = 140 + i * 44;
      const affordable = run.scrap >= item.cost;
      this.add.text(200, y, item.label, { color: item.available ? COLORS.text : COLORS.textDim, fontSize: '16px' }).setOrigin(0, 0.5);
      this.add.text(760, y, `${item.cost} scrap`, { color: COLORS.accent, fontSize: '16px' }).setOrigin(0.5);
      const btn = makeButton(this, 900, y, 100, 34, 'Buy', () => {
        if (!item.available || run.scrap < item.cost) return;
        run.scrap -= item.cost;
        item.apply();
        playSfx('buy');
        this.scene.restart();
      }, 16);
      btn.setEnabled(item.available && affordable);
    });

    makeButton(this, 640, 690, 200, 44, 'Leave', () => this.scene.start(SCENES.map), 20);
  }
}
