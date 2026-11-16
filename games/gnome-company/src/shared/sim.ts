import {
  DEKU_LOOT_POOL,
  HOUSE_LOOT_POOL,
  ITEM_CATALOG,
  PORTALS,
  SERMONS,
  SHED_STATIONS,
  YARD_LOOT_POOL,
  ZONE_BOUNDS,
} from './catalog';
import type {
  EnemyEntity,
  EnemyKind,
  ItemKind,
  PlayerInputPacket,
  PlayerState,
  ProjectileEntity,
  SermonEvent,
  SoundEvent,
  ToolKind,
  WorldItem,
  WorldSnapshot,
  ZoneId,
} from './types';

const DAY_DURATION_S = 150;
const SUMMARY_DURATION_S = 5.5;

function dist2D(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class GameRoomSim {
  public snapshot: WorldSnapshot;
  private nextId = 1;
  private sermonSeq = 1;
  private soundSeq = 1;
  private duskWarned = false;
  private summaryTimer = 0;

  constructor(roomCode: string) {
    this.snapshot = {
      roomCode,
      phase: 'lobby',
      day: 1,
      cycle: 1,
      quotaTarget: 180,
      quotaProgress: 0,
      gnomeBucks: 60,
      dayTime: 0,
      hostId: '',
      players: {},
      items: {},
      enemies: {},
      projectiles: {},
      sermon: {
        seq: 1,
        text: 'WELCOME TO MY SHED, TINY DISCIPLE. PULL THE LEVER TO SERVE THE QUOTA!',
        tone: 'holy',
      },
      recentSounds: [],
      summaryText: '',
    };
    this.spawnStarterGear();
  }

  private uid(prefix: string): string {
    return `${prefix}_${this.nextId++}`;
  }

  private emitSermon(text: string, tone: SermonEvent['tone']): void {
    this.sermonSeq += 1;
    this.snapshot.sermon = { seq: this.sermonSeq, text, tone };
    this.emitSound('sermon', 'shed', 0, 2, 0);
  }

  private emitSound(
    kind: SoundEvent['kind'],
    zone: ZoneId,
    x: number,
    y: number,
    z: number,
  ): void {
    this.soundSeq += 1;
    this.snapshot.recentSounds.push({
      seq: this.soundSeq,
      kind,
      zone,
      x,
      y,
      z,
    });
    if (this.snapshot.recentSounds.length > 24) {
      this.snapshot.recentSounds.shift();
    }
  }

  private spawnStarterGear(): void {
    this.spawnItem('flashlight', 'shed', -1.2, 0.5, 0.5);
    this.spawnItem('tennis_ball', 'shed', 1.2, 0.5, 0.5);
    this.spawnItem('trowel', 'shed', 0.4, 0.5, -0.4);
  }

  private spawnItem(kind: ItemKind, zone: ZoneId, x: number, y: number, z: number): WorldItem {
    const def = ITEM_CATALOG[kind];
    const variance = def.category === 'loot' ? 0.85 + Math.random() * 0.35 : 1;
    const item: WorldItem = {
      id: this.uid('item'),
      kind,
      name: def.name,
      category: def.category,
      value: Math.round(def.baseValue * variance),
      cursed: def.cursed,
      zone,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      holderId: null,
      tithed: false,
    };
    this.snapshot.items[item.id] = item;
    return item;
  }

  private spawnEnemy(kind: EnemyKind, zone: ZoneId, x: number, z: number): EnemyEntity {
    const initialState: EnemyEntity['state'] =
      kind === 'earthworm'
        ? 'burrow'
        : kind === 'mower'
          ? 'patrol'
          : kind === 'squirrel'
            ? 'scurry'
            : kind === 'spider'
              ? 'lurk'
              : kind === 'cultist'
                ? 'stalk'
                : 'wander';

    const enemy: EnemyEntity = {
      id: this.uid('mob'),
      kind,
      zone,
      x,
      y: 0,
      z,
      yaw: Math.random() * Math.PI * 2,
      state: initialState,
      stateTimer: 1 + Math.random() * 2,
      targetPlayerId: null,
      targetItemId: null,
      hp: 100,
      stunTimer: 0,
      homeX: x,
      homeZ: z,
      actionSeq: 0,
    };
    this.snapshot.enemies[enemy.id] = enemy;
    return enemy;
  }

  public addPlayer(id: string, name: string, color: string): PlayerState {
    const idx = Object.keys(this.snapshot.players).length;
    const p: PlayerState = {
      id,
      name: name.slice(0, 16) || `Gnome ${idx + 1}`,
      color,
      zone: 'shed',
      x: (idx % 3 - 1) * 1.1,
      y: 0,
      z: 0.5,
      yaw: Math.PI,
      pitch: 0,
      alive: true,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      crouching: false,
      heldItemId: null,
      flashlightOn: false,
      prayTimer: 0,
      blessingTimer: 0,
      damageFlash: 0,
    };
    this.snapshot.players[id] = p;
    if (!this.snapshot.hostId) {
      this.snapshot.hostId = id;
    }
    return p;
  }

  public removePlayer(id: string): void {
    const p = this.snapshot.players[id];
    if (p && p.heldItemId && this.snapshot.items[p.heldItemId]) {
      this.dropPlayerItem(p);
    }
    delete this.snapshot.players[id];
    if (this.snapshot.hostId === id) {
      this.snapshot.hostId = Object.keys(this.snapshot.players)[0] ?? '';
    }
  }

  public applyInput(playerId: string, input: PlayerInputPacket): void {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive) return;
    // During the day summary everyone is being returned to the shed spawn; ignore
    // client positions so the reset survives until the client snaps to it.
    if (this.snapshot.phase === 'day_summary') return;
    // Allow client movement within current zone bounds (portals are server-triggered)
    const bounds = ZONE_BOUNDS[p.zone];
    p.x = clamp(input.x, bounds.minX, bounds.maxX);
    p.y = clamp(input.y, 0, 5);
    p.z = clamp(input.z, bounds.minZ, bounds.maxZ);
    p.yaw = input.yaw;
    p.pitch = clamp(input.pitch, -1.5, 1.5);
    p.crouching = input.crouching;
    p.flashlightOn = input.flashlightOn;
  }

  public handlePray(playerId: string): void {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive) return;
    p.prayTimer = 1.6;
    this.emitSound('pray', p.zone, p.x, p.y, p.z);
  }

  public handleDropItem(playerId: string): void {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive || !p.heldItemId) return;
    this.dropPlayerItem(p);
  }

  private dropPlayerItem(p: PlayerState): void {
    if (!p.heldItemId) return;
    const item = this.snapshot.items[p.heldItemId];
    if (item) {
      item.holderId = null;
      item.zone = p.zone;
      item.x = p.x - Math.sin(p.yaw) * 0.9;
      item.y = 0.35;
      item.z = p.z - Math.cos(p.yaw) * 0.9;
      item.vx = 0;
      item.vy = 0;
      item.vz = 0;
    }
    p.heldItemId = null;
  }

  public handleUseItem(playerId: string, dirX: number, dirY: number, dirZ: number): void {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive || !p.heldItemId) return;
    const item = this.snapshot.items[p.heldItemId];
    if (!item) {
      p.heldItemId = null;
      return;
    }

    if (item.kind === 'flashlight') {
      p.flashlightOn = !p.flashlightOn;
      return;
    }

    if (item.kind === 'tennis_ball') {
      // Throw ball forward!
      item.holderId = null;
      item.zone = p.zone;
      item.x = p.x + dirX * 0.8;
      item.y = p.y + 1.1;
      item.z = p.z + dirZ * 0.8;
      item.vx = dirX * 14;
      item.vy = Math.max(3, dirY * 10 + 4);
      item.vz = dirZ * 14;
      item.thrownAt = Date.now();
      p.heldItemId = null;
      this.emitSound('pickup', p.zone, p.x, p.y, p.z);
      return;
    }

    if (item.kind === 'airhorn') {
      this.emitSound('airhorn', p.zone, p.x, p.y, p.z);
      for (const mob of Object.values(this.snapshot.enemies)) {
        if (mob.zone === p.zone && mob.kind !== 'dog' && mob.kind !== 'pillbug') {
          if (dist2D(mob.x, mob.z, p.x, p.z) < 12) {
            mob.stunTimer = 2.2;
          }
        }
      }
      return;
    }

    if (item.kind === 'trowel') {
      this.emitSound('bonk', p.zone, p.x, p.y, p.z);
      for (const mob of Object.values(this.snapshot.enemies)) {
        if (mob.zone === p.zone && mob.kind !== 'dog' && mob.kind !== 'pillbug') {
          if (dist2D(mob.x, mob.z, p.x, p.z) < 3.4) {
            mob.stunTimer = 3.2;
            mob.actionSeq += 1;
          }
        }
      }
      return;
    }

    if (item.kind === 'holy_dew') {
      p.hp = Math.min(p.maxHp, p.hp + 50);
      p.stamina = 100;
      p.blessingTimer = 14;
      this.emitSound('pray', p.zone, p.x, p.y, p.z);
      delete this.snapshot.items[item.id];
      p.heldItemId = null;
      return;
    }
  }

  public handleBuyTool(playerId: string, kind: ToolKind): void {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive || p.zone !== 'shed') return;
    const def = ITEM_CATALOG[kind];
    if (!def || def.category !== 'tool') return;
    if (this.snapshot.gnomeBucks < def.baseValue) return;
    this.snapshot.gnomeBucks -= def.baseValue;
    const item = this.spawnItem(kind, 'shed', 2.2 + (Math.random() - 0.5) * 0.8, 0.5, -1.2);
    this.emitSound('bell', 'shed', 2.8, 1, -2.0);
    if (!p.heldItemId) {
      item.holderId = p.id;
      p.heldItemId = item.id;
    }
  }

  public handlePullLever(playerId: string): void {
    const p = this.snapshot.players[playerId];
    if (!p || p.zone !== 'shed') return;
    if (this.snapshot.phase === 'lobby') {
      this.startDay();
    } else if (this.snapshot.phase === 'yard') {
      this.endDay('The Shed departed early with surviving gnomes!');
    } else if (this.snapshot.phase === 'game_over') {
      this.resetRun();
    }
  }

  public handleInteract(playerId: string): { openShop?: boolean } {
    const p = this.snapshot.players[playerId];
    if (!p || !p.alive) return {};

    // 1. Shed stations
    if (p.zone === 'shed') {
      if (dist2D(p.x, p.z, SHED_STATIONS.shrine.x, SHED_STATIONS.shrine.z) < 2.3) {
        p.prayTimer = 2.0;
        p.blessingTimer = 14;
        this.emitSound('pray', 'shed', 0, 1, -3.2);
        this.emitSermon(
          'GNOME JESUS BLESSES THY TINY KNEES! (+SPEED FOR 14s)',
          'holy',
        );
        return {};
      }
      if (dist2D(p.x, p.z, SHED_STATIONS.tithe.x, SHED_STATIONS.tithe.z) < 2.4) {
        if (p.heldItemId) {
          const item = this.snapshot.items[p.heldItemId];
          if (item && item.category === 'loot') {
            this.titheItem(item);
            p.heldItemId = null;
            return {};
          }
        }
      }
      if (dist2D(p.x, p.z, SHED_STATIONS.shop.x, SHED_STATIONS.shop.z) < 2.3) {
        return { openShop: true };
      }
      if (dist2D(p.x, p.z, SHED_STATIONS.lever.x, SHED_STATIONS.lever.z) < 2.3) {
        this.handlePullLever(playerId);
        return {};
      }
    }

    // 2. Portals
    for (const portal of Object.values(PORTALS)) {
      if (portal.zone === p.zone && dist2D(p.x, p.z, portal.x, portal.z) < 2.6) {
        if (portal.zone === 'shed' && this.snapshot.phase !== 'yard') {
          this.emitSermon(
            'PULL THE SACRED LEVER FIRST BEFORE OPENING THE SHED DOOR!',
            'angry',
          );
          return {};
        }
        p.zone = portal.toZone;
        p.x = portal.toX;
        p.z = portal.toZ;
        p.y = 0;
        this.emitSound('portal', p.zone, p.x, p.y, p.z);
        return {};
      }
    }

    // 3. Pick up nearest item
    if (!p.heldItemId) {
      let best: WorldItem | null = null;
      let bestD = 2.5;
      for (const item of Object.values(this.snapshot.items)) {
        if (item.zone !== p.zone || item.holderId !== null || item.tithed) continue;
        const d = dist2D(p.x, p.z, item.x, item.z);
        if (d < bestD) {
          bestD = d;
          best = item;
        }
      }
      if (best) {
        best.holderId = p.id;
        p.heldItemId = best.id;
        this.emitSound('pickup', p.zone, p.x, p.y, p.z);
        if (best.cursed) {
          this.emitSermon(pick(SERMONS.cursedPickup), 'spooky');
        }
      }
    }

    return {};
  }

  private titheItem(item: WorldItem): void {
    item.tithed = true;
    item.holderId = null;
    this.snapshot.quotaProgress += item.value;
    this.snapshot.gnomeBucks += item.value;
    delete this.snapshot.items[item.id];
    this.emitSound('tithe', 'shed', SHED_STATIONS.tithe.x, 1, SHED_STATIONS.tithe.z);
    this.emitSermon(
      `${pick(SERMONS.titheGood)} (+$${item.value})`,
      'holy',
    );
  }

  public startDay(): void {
    this.snapshot.phase = 'yard';
    this.snapshot.dayTime = 0;
    this.duskWarned = false;
    this.snapshot.projectiles = {};

    // Clear old non-shed items & all enemies
    for (const [id, item] of Object.entries(this.snapshot.items)) {
      if (item.zone !== 'shed' && !item.holderId) {
        delete this.snapshot.items[id];
      }
    }
    this.snapshot.enemies = {};

    // Revive players in shed
    let idx = 0;
    for (const p of Object.values(this.snapshot.players)) {
      p.alive = true;
      p.hp = p.maxHp;
      p.stamina = 100;
      p.zone = 'shed';
      p.x = (idx % 3 - 1) * 1.1;
      p.y = 0;
      p.z = 0.5;
      idx += 1;
    }

    // Spawn Yard Loot
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      const rad = 12 + Math.random() * 20;
      this.spawnItem(
        pick(YARD_LOOT_POOL),
        'yard',
        Math.cos(ang) * rad,
        0.35,
        Math.sin(ang) * rad,
      );
    }

    // Spawn Deku Tree Loot
    for (let i = 0; i < 7; i++) {
      const lx = (Math.random() - 0.5) * 24;
      const lz = (Math.random() - 0.5) * 22 - 2;
      this.spawnItem(pick(DEKU_LOOT_POOL), 'deku', lx, 0.35, lz);
    }

    // Spawn House Loot
    for (let i = 0; i < 8; i++) {
      const lx = (Math.random() - 0.5) * 22;
      const lz = (Math.random() - 0.5) * 20 - 2;
      this.spawnItem(pick(HOUSE_LOOT_POOL), 'house', lx, 0.35, lz);
    }

    // Spawn Enemies!
    // Yard: Giant Earthworms, Possessed Lawn Mowers, Acorn Squirrels, Pillbug, Giant Fetch Dog
    this.spawnEnemy('earthworm', 'yard', -10, -4);
    this.spawnEnemy('earthworm', 'yard', 12, 4);
    this.spawnEnemy('mower', 'yard', -16, 10);
    this.spawnEnemy('mower', 'yard', 16, -2);
    this.spawnEnemy('squirrel', 'yard', -18, -8);
    this.spawnEnemy('squirrel', 'yard', 14, 12);
    this.spawnEnemy('squirrel', 'yard', 2, -16);
    this.spawnEnemy('pillbug', 'yard', -6, 8);
    this.spawnEnemy('dog', 'yard', 6, 14);

    // Deku Tree: Giant Spiders, Evil Shadow Gnome Cultist, Rolling Pillbug
    this.spawnEnemy('spider', 'deku', -7, -6);
    this.spawnEnemy('spider', 'deku', 8, -4);
    this.spawnEnemy('cultist', 'deku', 0, -9);
    this.spawnEnemy('pillbug', 'deku', 4, 4);

    // House: Giant Spiders & Evil Shadow Gnome Cultist
    this.spawnEnemy('spider', 'house', -7, -5);
    this.spawnEnemy('spider', 'house', 7, 2);
    this.spawnEnemy('cultist', 'house', 0, -7);

    this.emitSound('bell', 'shed', 0, 2, 0);
    this.emitSermon(
      `DAY ${this.snapshot.day}/3 BEGINS! ${pick(SERMONS.dayStart)}`,
      'holy',
    );
  }

  private endDay(reason: string): void {
    // Any loot dropped on the Shed floor is automatically tithed!
    let autoTithed = 0;
    for (const item of Object.values(this.snapshot.items)) {
      if (item.zone === 'shed' && item.category === 'loot' && !item.tithed) {
        if (item.holderId) {
          const holder = this.snapshot.players[item.holderId];
          if (holder && holder.alive && holder.zone === 'shed') {
            autoTithed += item.value;
            this.snapshot.quotaProgress += item.value;
            this.snapshot.gnomeBucks += item.value;
            holder.heldItemId = null;
            delete this.snapshot.items[item.id];
          }
        } else {
          autoTithed += item.value;
          this.snapshot.quotaProgress += item.value;
          this.snapshot.gnomeBucks += item.value;
          delete this.snapshot.items[item.id];
        }
      }
    }

    // Players outside shed lose held items and are rescued/repaired next day
    for (const p of Object.values(this.snapshot.players)) {
      if (p.zone !== 'shed' || !p.alive) {
        if (p.heldItemId) {
          delete this.snapshot.items[p.heldItemId];
          p.heldItemId = null;
        }
      }
      p.zone = 'shed';
      p.x = 0;
      p.z = 0.5;
      p.alive = true;
      p.hp = p.maxHp;
    }

    this.snapshot.enemies = {};
    this.snapshot.projectiles = {};
    this.snapshot.phase = 'day_summary';
    this.summaryTimer = SUMMARY_DURATION_S;
    this.snapshot.summaryText = `${reason} Auto-tithed $${autoTithed} from Shed.`;
    this.emitSound('bell', 'shed', 0, 2, 0);
  }

  private resetRun(): void {
    this.snapshot.day = 1;
    this.snapshot.cycle = 1;
    this.snapshot.quotaTarget = 180;
    this.snapshot.quotaProgress = 0;
    this.snapshot.gnomeBucks = 60;
    this.snapshot.items = {};
    this.snapshot.enemies = {};
    this.snapshot.projectiles = {};
    this.spawnStarterGear();
    this.snapshot.phase = 'lobby';
    for (const p of Object.values(this.snapshot.players)) {
      p.alive = true;
      p.hp = p.maxHp;
      p.zone = 'shed';
      p.x = 0;
      p.z = 0.5;
      p.heldItemId = null;
    }
    this.emitSermon('A NEW FLOCK OF GNOMES RISES FROM THE CLAY! SERVE THE QUOTA!', 'holy');
  }

  public step(dt: number): void {
    // Update player timers & held item positions
    for (const p of Object.values(this.snapshot.players)) {
      if (p.prayTimer > 0) p.prayTimer = Math.max(0, p.prayTimer - dt);
      if (p.blessingTimer > 0) p.blessingTimer = Math.max(0, p.blessingTimer - dt);
      if (p.damageFlash > 0) p.damageFlash = Math.max(0, p.damageFlash - dt);

      if (p.heldItemId) {
        const item = this.snapshot.items[p.heldItemId];
        if (item) {
          item.zone = p.zone;
          item.x = p.x;
          item.y = p.y + 1.0;
          item.z = p.z;
        } else {
          p.heldItemId = null;
        }
      }
    }

    // Update thrown items physics
    for (const item of Object.values(this.snapshot.items)) {
      if (item.holderId !== null) continue;
      if (Math.abs(item.vx) > 0.05 || Math.abs(item.vz) > 0.05 || item.y > 0.35) {
        item.vy -= 18 * dt;
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.z += item.vz * dt;
        if (item.y <= 0.35) {
          item.y = 0.35;
          item.vy = Math.abs(item.vy) > 2 ? -item.vy * 0.45 : 0;
          item.vx *= 0.72;
          item.vz *= 0.72;
        }
        const b = ZONE_BOUNDS[item.zone];
        item.x = clamp(item.x, b.minX, b.maxX);
        item.z = clamp(item.z, b.minZ, b.maxZ);
      }
    }

    if (this.snapshot.phase === 'day_summary') {
      this.summaryTimer -= dt;
      if (this.summaryTimer <= 0) {
        if (this.snapshot.day >= 3) {
          if (this.snapshot.quotaProgress >= this.snapshot.quotaTarget) {
            this.snapshot.cycle += 1;
            this.snapshot.day = 1;
            this.snapshot.quotaProgress = 0;
            this.snapshot.quotaTarget = Math.round(this.snapshot.quotaTarget * 1.55);
            this.snapshot.phase = 'lobby';
            this.emitSermon(pick(SERMONS.quotaMet), 'holy');
          } else {
            this.snapshot.phase = 'game_over';
            this.emitSermon(pick(SERMONS.quotaFailed), 'angry');
          }
        } else {
          this.snapshot.day += 1;
          this.snapshot.phase = 'lobby';
          this.emitSermon(
            `DAY ${this.snapshot.day} OF 3! PULL THE LEVER WHEN READY!`,
            'holy',
          );
        }
      }
      return;
    }

    if (this.snapshot.phase !== 'yard') return;

    // Advance day clock
    this.snapshot.dayTime += dt / DAY_DURATION_S;
    if (!this.duskWarned && this.snapshot.dayTime >= 0.62) {
      this.duskWarned = true;
      this.emitSermon(pick(SERMONS.duskWarning), 'spooky');
      this.emitSound('bell', 'yard', 0, 10, 0);
    }
    if (this.snapshot.dayTime >= 1.0) {
      this.endDay('Midnight fell! The Shed slammed shut!');
      return;
    }

    // Check total party wipe
    const players = Object.values(this.snapshot.players);
    if (players.length > 0 && players.every((p) => !p.alive)) {
      this.endDay('All gnomes perished in the yard!');
      return;
    }

    this.stepProjectiles(dt);
    this.stepEnemies(dt);
  }

  private stepProjectiles(dt: number): void {
    for (const [id, proj] of Object.entries(this.snapshot.projectiles)) {
      proj.ttl -= dt;
      proj.vy -= 14 * dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;

      if (proj.ttl <= 0 || proj.y <= 0.1) {
        delete this.snapshot.projectiles[id];
        continue;
      }

      for (const p of Object.values(this.snapshot.players)) {
        if (!p.alive || p.zone !== proj.zone) continue;
        if (dist2D(p.x, p.z, proj.x, proj.z) < 1.0 && Math.abs(p.y + 0.8 - proj.y) < 1.2) {
          this.damagePlayer(p, 16);
          delete this.snapshot.projectiles[id];
          break;
        }
      }
    }
  }

  private damagePlayer(p: PlayerState, amount: number): void {
    if (!p.alive) return;
    p.hp = Math.max(0, p.hp - amount);
    p.damageFlash = 0.45;
    this.emitSound('hurt', p.zone, p.x, p.y, p.z);
    if (p.hp <= 0) {
      p.alive = false;
      this.dropPlayerItem(p);
      this.emitSound('die', p.zone, p.x, p.y, p.z);
      this.emitSermon(`${p.name.toUpperCase()}: ${pick(SERMONS.playerDied)}`, 'angry');
    }
  }

  private nearestPlayer(zone: ZoneId, x: number, z: number, maxRange: number): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = maxRange;
    for (const p of Object.values(this.snapshot.players)) {
      if (!p.alive || p.zone !== zone) continue;
      const d = dist2D(x, z, p.x, p.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  private stepEnemies(dt: number): void {
    const now = Date.now();
    for (const mob of Object.values(this.snapshot.enemies)) {
      if (mob.stunTimer > 0) {
        mob.stunTimer = Math.max(0, mob.stunTimer - dt);
        continue;
      }
      mob.stateTimer -= dt;
      const bounds = ZONE_BOUNDS[mob.zone];
      const nightMult = this.snapshot.dayTime > 0.62 ? 1.25 : 1.0;

      if (mob.kind === 'earthworm') {
        const target = this.nearestPlayer(mob.zone, mob.x, mob.z, 26);
        if (mob.state === 'burrow') {
          mob.y = -1.8;
          if (target) {
            const ang = Math.atan2(target.x - mob.x, target.z - mob.z);
            mob.yaw = ang;
            mob.x += Math.sin(ang) * 4.5 * nightMult * dt;
            mob.z += Math.cos(ang) * 4.5 * nightMult * dt;
            if (dist2D(mob.x, mob.z, target.x, target.z) < 3.2 && mob.stateTimer <= 0) {
              mob.state = 'warning';
              mob.stateTimer = 1.25;
              mob.actionSeq += 1;
            }
          } else {
            mob.x += Math.sin(mob.yaw) * 2.5 * dt;
            mob.z += Math.cos(mob.yaw) * 2.5 * dt;
            if (mob.stateTimer <= 0) {
              mob.yaw += (Math.random() - 0.5) * 2.2;
              mob.stateTimer = 2.0;
            }
          }
        } else if (mob.state === 'warning') {
          mob.y = -0.7;
          if (mob.stateTimer <= 0) {
            mob.state = 'erupt';
            mob.stateTimer = 1.2;
            mob.y = 0;
            mob.actionSeq += 1;
            this.emitSound('worm_erupt', mob.zone, mob.x, 0, mob.z);
            for (const p of Object.values(this.snapshot.players)) {
              if (p.alive && p.zone === mob.zone && dist2D(p.x, p.z, mob.x, mob.z) < 2.8) {
                this.damagePlayer(p, 35);
              }
            }
          }
        } else {
          // erupt
          mob.y = 0.2;
          if (mob.stateTimer <= 0) {
            mob.state = 'burrow';
            mob.stateTimer = 3.0;
          }
        }
      } else if (mob.kind === 'mower') {
        const target = this.nearestPlayer(mob.zone, mob.x, mob.z, 18);
        if (mob.state === 'patrol') {
          mob.x += Math.sin(mob.yaw) * 3.2 * dt;
          mob.z += Math.cos(mob.yaw) * 3.2 * dt;
          if (mob.stateTimer <= 0) {
            mob.yaw += (Math.random() - 0.5) * 2.4;
            mob.stateTimer = 2.5;
          }
          if (target) {
            mob.state = 'rev';
            mob.stateTimer = 0.9;
            mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
            this.emitSound('mower_rev', mob.zone, mob.x, 0, mob.z);
          }
        } else if (mob.state === 'rev') {
          if (target) mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
          if (mob.stateTimer <= 0) {
            mob.state = 'charge';
            mob.stateTimer = 2.1;
          }
        } else {
          // charge
          mob.x += Math.sin(mob.yaw) * 9.5 * nightMult * dt;
          mob.z += Math.cos(mob.yaw) * 9.5 * nightMult * dt;
          for (const p of Object.values(this.snapshot.players)) {
            if (p.alive && p.zone === mob.zone && dist2D(p.x, p.z, mob.x, mob.z) < 1.8) {
              this.damagePlayer(p, 40);
              mob.state = 'patrol';
              mob.stateTimer = 2.0;
            }
          }
          if (mob.stateTimer <= 0) {
            mob.state = 'patrol';
            mob.stateTimer = 2.0;
          }
        }
      } else if (mob.kind === 'squirrel') {
        const target = this.nearestPlayer(mob.zone, mob.x, mob.z, 20);
        if (mob.state === 'scurry') {
          mob.x += Math.sin(mob.yaw) * 4.2 * dt;
          mob.z += Math.cos(mob.yaw) * 4.2 * dt;
          if (mob.stateTimer <= 0) {
            mob.yaw += (Math.random() - 0.5) * 3.0;
            mob.stateTimer = 1.6;
            if (target && dist2D(mob.x, mob.z, target.x, target.z) < 18) {
              mob.state = 'windup';
              mob.stateTimer = 0.65;
              mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
            }
          }
        } else {
          // windup -> throw acorn
          if (target) mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
          if (mob.stateTimer <= 0) {
            if (target) {
              const dx = target.x - mob.x;
              const dz = target.z - mob.z;
              const d = Math.max(0.1, Math.hypot(dx, dz));
              const speed = 15;
              const proj: ProjectileEntity = {
                id: this.uid('acorn'),
                kind: 'acorn',
                zone: mob.zone,
                x: mob.x,
                y: 1.0,
                z: mob.z,
                vx: (dx / d) * speed,
                vy: 3.5 + d * 0.14,
                vz: (dz / d) * speed,
                ttl: 2.5,
              };
              this.snapshot.projectiles[proj.id] = proj;
              this.emitSound('acorn_throw', mob.zone, mob.x, 1, mob.z);
            }
            mob.state = 'scurry';
            mob.stateTimer = 2.2;
          }
        }
      } else if (mob.kind === 'spider' || mob.kind === 'cultist') {
        const target = this.nearestPlayer(mob.zone, mob.x, mob.z, 16);
        if (target) {
          mob.state = 'chase';
          const ang = Math.atan2(target.x - mob.x, target.z - mob.z);
          mob.yaw = ang;
          const baseSpd = mob.kind === 'spider' ? 4.4 : 3.6;
          const lightBoost = target.flashlightOn ? 1.15 : 1.0;
          mob.x += Math.sin(ang) * baseSpd * lightBoost * nightMult * dt;
          mob.z += Math.cos(ang) * baseSpd * lightBoost * nightMult * dt;
          if (mob.stateTimer <= 0) {
            mob.stateTimer = 3.0;
            this.emitSound(
              mob.kind === 'spider' ? 'spider_hiss' : 'cultist_chant',
              mob.zone,
              mob.x,
              1,
              mob.z,
            );
          }
          if (dist2D(mob.x, mob.z, target.x, target.z) < 1.5 && mob.actionSeq <= 0) {
            this.damagePlayer(target, mob.kind === 'spider' ? 24 : 28);
            mob.stunTimer = 1.1; // brief cooldown after bite/poke
          }
        } else {
          mob.state = mob.kind === 'spider' ? 'lurk' : 'stalk';
          mob.x += Math.sin(mob.yaw) * 1.8 * dt;
          mob.z += Math.cos(mob.yaw) * 1.8 * dt;
          if (mob.stateTimer <= 0) {
            mob.yaw += (Math.random() - 0.5) * 2.5;
            mob.stateTimer = 2.5;
          }
        }
      } else if (mob.kind === 'pillbug') {
        // Harmless creepy-cute giant pillbug that curls up & rolls around!
        if (mob.state === 'wander') {
          mob.x += Math.sin(mob.yaw) * 1.6 * dt;
          mob.z += Math.cos(mob.yaw) * 1.6 * dt;
          if (mob.stateTimer <= 0) {
            mob.state = 'roll';
            mob.stateTimer = 3.2;
            mob.yaw = Math.random() * Math.PI * 2;
          }
        } else {
          mob.x += Math.sin(mob.yaw) * 6.2 * dt;
          mob.z += Math.cos(mob.yaw) * 6.2 * dt;
          if (mob.stateTimer <= 0) {
            mob.state = 'wander';
            mob.stateTimer = 2.8;
          }
        }
      } else if (mob.kind === 'dog') {
        // Giant goofy fetch dog! NEVER kills you!
        let thrownBall: WorldItem | null = null;
        for (const item of Object.values(this.snapshot.items)) {
          if (
            item.zone === mob.zone &&
            item.holderId === null &&
            (item.kind === 'tennis_ball' || item.kind === 'blighted_twig') &&
            item.thrownAt &&
            now - item.thrownAt < 14000
          ) {
            thrownBall = item;
            break;
          }
        }

        if (mob.state === 'return' && mob.targetItemId) {
          const item = this.snapshot.items[mob.targetItemId];
          const p = this.nearestPlayer(mob.zone, mob.x, mob.z, 50);
          if (!item || !p) {
            mob.state = 'wander';
            mob.targetItemId = null;
          } else {
            const ang = Math.atan2(p.x - mob.x, p.z - mob.z);
            mob.yaw = ang;
            mob.x += Math.sin(ang) * 7.5 * dt;
            mob.z += Math.cos(ang) * 7.5 * dt;
            item.x = mob.x + Math.sin(mob.yaw) * 1.2;
            item.y = 0.85;
            item.z = mob.z + Math.cos(mob.yaw) * 1.2;
            if (dist2D(mob.x, mob.z, p.x, p.z) < 2.8) {
              item.y = 0.35;
              item.thrownAt = undefined;
              mob.targetItemId = null;
              mob.state = 'excited';
              mob.stateTimer = 2.0;
              this.emitSound('bark', mob.zone, mob.x, 1.2, mob.z);
              this.emitSermon(pick(SERMONS.dogFetch), 'silly');
            }
          }
        } else if (thrownBall) {
          mob.state = 'fetch';
          const ang = Math.atan2(thrownBall.x - mob.x, thrownBall.z - mob.z);
          mob.yaw = ang;
          mob.x += Math.sin(ang) * 8.5 * dt;
          mob.z += Math.cos(ang) * 8.5 * dt;
          if (dist2D(mob.x, mob.z, thrownBall.x, thrownBall.z) < 1.8) {
            mob.targetItemId = thrownBall.id;
            mob.state = 'return';
            this.emitSound('bark', mob.zone, mob.x, 1.2, mob.z);
          }
        } else {
          const p = this.nearestPlayer(mob.zone, mob.x, mob.z, 18);
          if (p) {
            mob.state = 'excited';
            const ang = Math.atan2(p.x - mob.x, p.z - mob.z);
            mob.yaw = ang;
            const d = dist2D(mob.x, mob.z, p.x, p.z);
            if (d > 3.6) {
              mob.x += Math.sin(ang) * 5.2 * dt;
              mob.z += Math.cos(ang) * 5.2 * dt;
            }
            if (mob.stateTimer <= 0) {
              mob.stateTimer = 3.5;
              this.emitSound('bark', mob.zone, mob.x, 1.2, mob.z);
            }
          } else {
            mob.state = 'wander';
            mob.x += Math.sin(mob.yaw) * 2.5 * dt;
            mob.z += Math.cos(mob.yaw) * 2.5 * dt;
            if (mob.stateTimer <= 0) {
              mob.yaw += (Math.random() - 0.5) * 2.0;
              mob.stateTimer = 3.0;
            }
          }
        }
      }

      // Keep inside zone bounds
      if (mob.x <= bounds.minX + 1 || mob.x >= bounds.maxX - 1) {
        mob.x = clamp(mob.x, bounds.minX + 1, bounds.maxX - 1);
        mob.yaw = -mob.yaw;
      }
      if (mob.z <= bounds.minZ + 1 || mob.z >= bounds.maxZ - 1) {
        mob.z = clamp(mob.z, bounds.minZ + 1, bounds.maxZ - 1);
        mob.yaw = Math.PI - mob.yaw;
      }
    }
  }
}
