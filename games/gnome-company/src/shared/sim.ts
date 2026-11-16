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
import {
  getStealthMultiplier,
  hasLineOfSight,
  PATROL_ROUTES,
  resolveCircleObstacles,
} from './world';
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

  private spawnEnemy(
    kind: EnemyKind,
    zone: ZoneId,
    x: number,
    z: number,
    routeId?: string,
  ): EnemyEntity {
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

    const route = routeId ? PATROL_ROUTES[routeId] : undefined;
    const startX = route?.[0]?.x ?? x;
    const startZ = route?.[0]?.z ?? z;

    const enemy: EnemyEntity = {
      id: this.uid('mob'),
      kind,
      zone,
      x: startX,
      y: 0,
      z: startZ,
      yaw: Math.random() * Math.PI * 2,
      state: initialState,
      stateTimer: 1 + Math.random() * 1.5,
      targetPlayerId: null,
      targetItemId: null,
      hp: 100,
      stunTimer: 0,
      homeX: startX,
      homeZ: startZ,
      routeId,
      waypointIdx: route ? 1 % route.length : 0,
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
        p.hp = Math.min(p.maxHp, p.hp + 25);
        this.emitSound('pray', 'shed', 0, 1, -3.2);
        this.emitSermon(
          'GNOME JESUS BLESSES THY TINY KNEES! (+25 HP & SPEED FOR 14s)',
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

    // Spawn Yard Loot (pushed clear of solid obstacles)
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      const rad = 11 + Math.random() * 19;
      const pos = resolveCircleObstacles('yard', Math.cos(ang) * rad, Math.sin(ang) * rad, 0.8);
      this.spawnItem(pick(YARD_LOOT_POOL), 'yard', pos.x, 0.35, pos.z);
    }

    // Spawn Deku Tree Loot
    for (let i = 0; i < 7; i++) {
      const lx = (Math.random() - 0.5) * 24;
      const lz = (Math.random() - 0.5) * 22 - 2;
      const pos = resolveCircleObstacles('deku', lx, lz, 0.8);
      this.spawnItem(pick(DEKU_LOOT_POOL), 'deku', pos.x, 0.35, pos.z);
    }

    // Spawn House Loot
    for (let i = 0; i < 8; i++) {
      const lx = (Math.random() - 0.5) * 22;
      const lz = (Math.random() - 0.5) * 20 - 2;
      const pos = resolveCircleObstacles('house', lx, lz, 0.8);
      this.spawnItem(pick(HOUSE_LOOT_POOL), 'house', pos.x, 0.35, pos.z);
    }

    // Spawn Enemies with pre-determined learnable patrol routes!
    // Yard: Giant Earthworms, Possessed Lawn Mowers, Acorn Squirrels, Pillbug, Giant Fetch Dog
    this.spawnEnemy('earthworm', 'yard', -12, -15, 'yard_worm_north');
    this.spawnEnemy('earthworm', 'yard', -28, 18, 'yard_worm_south');
    this.spawnEnemy('mower', 'yard', -20, 12, 'yard_mower_west');
    this.spawnEnemy('mower', 'yard', 8, 12, 'yard_mower_east');
    this.spawnEnemy('squirrel', 'yard', -16, -10, 'yard_squirrel_deku');
    this.spawnEnemy('squirrel', 'yard', 15, -10, 'yard_squirrel_house');
    this.spawnEnemy('squirrel', 'yard', -5, -2, 'yard_squirrel_mid');
    this.spawnEnemy('pillbug', 'yard', -6, 8);
    this.spawnEnemy('dog', 'yard', 6, 14);

    // Deku Tree: Giant Spiders, Evil Shadow Gnome Cultist, Rolling Pillbug
    this.spawnEnemy('spider', 'deku', -11, 7, 'deku_spider_west');
    this.spawnEnemy('spider', 'deku', 2, 7, 'deku_spider_east');
    this.spawnEnemy('cultist', 'deku', -3, -11, 'deku_cultist');
    this.spawnEnemy('pillbug', 'deku', 4, 4);

    // House: Giant Spiders & Evil Shadow Gnome Cultist
    this.spawnEnemy('spider', 'house', -11, 8, 'house_spider_west');
    this.spawnEnemy('spider', 'house', 7, 8, 'house_spider_east');
    this.spawnEnemy('cultist', 'house', -2, -11, 'house_cultist');

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

      if (
        proj.ttl <= 0 ||
        proj.y <= 0.1 ||
        resolveCircleObstacles(proj.zone, proj.x, proj.z, 0.15).hit
      ) {
        delete this.snapshot.projectiles[id];
        continue;
      }

      for (const p of Object.values(this.snapshot.players)) {
        if (!p.alive || p.zone !== proj.zone) continue;
        if (dist2D(p.x, p.z, proj.x, proj.z) < 1.0 && Math.abs(p.y + 0.8 - proj.y) < 1.2) {
          this.damagePlayer(p, 12);
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

  private angleDiff(a: number, b: number): number {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  }

  /**
   * Stealth- and line-of-sight-aware player detection.
   * Checks proximity hearing (reduced when crouching) + forward vision cone + obstacle LOS.
   */
  private detectPlayer(
    mob: EnemyEntity,
    visionRange: number,
    fovHalfRad: number,
    hearingRange: number,
  ): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = Infinity;

    for (const p of Object.values(this.snapshot.players)) {
      if (!p.alive || p.zone !== mob.zone) continue;
      const d = dist2D(mob.x, mob.z, p.x, p.z);

      const hearDist = hearingRange * (p.crouching ? 0.5 : 1.0);
      const heard = d <= hearDist;

      let seen = false;
      const stealthMult = getStealthMultiplier(
        p.zone,
        p.x,
        p.z,
        p.crouching,
        p.flashlightOn,
      );
      const effectiveVision = visionRange * stealthMult;
      if (d <= effectiveVision) {
        const angToPlayer = Math.atan2(p.x - mob.x, p.z - mob.z);
        if (
          this.angleDiff(mob.yaw, angToPlayer) <= fovHalfRad &&
          hasLineOfSight(mob.zone, mob.x, mob.z, p.x, p.z)
        ) {
          seen = true;
        }
      }

      if ((heard || seen) && d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  private moveMobWithObstacles(
    mob: EnemyEntity,
    dx: number,
    dz: number,
    radius = 0.55,
  ): boolean {
    const nextX = mob.x + dx;
    const nextZ = mob.z + dz;
    const res = resolveCircleObstacles(mob.zone, nextX, nextZ, radius);
    mob.x = res.x;
    mob.z = res.z;
    return res.hit;
  }

  /**
   * Walks an enemy along its pre-determined patrol route, pausing briefly at corners.
   */
  private followPatrol(mob: EnemyEntity, speed: number, dt: number): void {
    const route = mob.routeId ? PATROL_ROUTES[mob.routeId] : undefined;
    if (!route || route.length === 0) {
      this.moveMobWithObstacles(
        mob,
        Math.sin(mob.yaw) * speed * dt,
        Math.cos(mob.yaw) * speed * dt,
      );
      if (mob.stateTimer <= 0) {
        mob.yaw += (Math.random() - 0.5) * 2.2;
        mob.stateTimer = 2.2;
      }
      return;
    }

    const idx = (mob.waypointIdx ?? 0) % route.length;
    const pt = route[idx];
    const d = dist2D(mob.x, mob.z, pt.x, pt.z);
    if (d < 0.75) {
      if (mob.stateTimer <= 0) {
        mob.waypointIdx = (idx + 1) % route.length;
        mob.stateTimer = pt.pause ?? 0.5;
      }
      return;
    }

    const ang = Math.atan2(pt.x - mob.x, pt.z - mob.z);
    mob.yaw = ang;
    const step = Math.min(d, speed * dt);
    const hit = this.moveMobWithObstacles(
      mob,
      Math.sin(ang) * step,
      Math.cos(ang) * step,
    );
    if (hit && mob.stateTimer <= -1.5) {
      // If somehow blocked, advance to next waypoint
      mob.waypointIdx = (idx + 1) % route.length;
      mob.stateTimer = 0.3;
    }
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
      const nightMult = this.snapshot.dayTime > 0.62 ? 1.15 : 1.0;

      if (mob.kind === 'earthworm') {
        // Earthworms sense ground vibrations when close or moving fast, not across the whole yard
        const target = this.detectPlayer(mob, 14, Math.PI, 4.5);
        if (mob.state === 'burrow') {
          mob.y = -1.8;
          if (target) {
            const ang = Math.atan2(target.x - mob.x, target.z - mob.z);
            mob.yaw = ang;
            this.moveMobWithObstacles(
              mob,
              Math.sin(ang) * 3.4 * nightMult * dt,
              Math.cos(ang) * 3.4 * nightMult * dt,
            );
            if (dist2D(mob.x, mob.z, target.x, target.z) < 2.6 && mob.stateTimer <= 0) {
              mob.state = 'warning';
              mob.stateTimer = 1.45;
              mob.actionSeq += 1;
            }
          } else {
            this.followPatrol(mob, 2.6, dt);
          }
        } else if (mob.state === 'warning') {
          mob.y = -0.65;
          if (mob.stateTimer <= 0) {
            mob.state = 'erupt';
            mob.stateTimer = 1.2;
            mob.y = 0;
            mob.actionSeq += 1;
            this.emitSound('worm_erupt', mob.zone, mob.x, 0, mob.z);
            for (const p of Object.values(this.snapshot.players)) {
              if (p.alive && p.zone === mob.zone && dist2D(p.x, p.z, mob.x, mob.z) < 2.5) {
                this.damagePlayer(p, 25);
              }
            }
          }
        } else {
          // erupt
          mob.y = 0.2;
          if (mob.stateTimer <= 0) {
            mob.state = 'burrow';
            mob.stateTimer = 3.2;
          }
        }
      } else if (mob.kind === 'mower') {
        const target = this.detectPlayer(mob, 14, Math.PI * 0.36, 3.2);
        if (mob.state === 'patrol') {
          this.followPatrol(mob, 3.0, dt);
          if (target) {
            mob.state = 'rev';
            mob.stateTimer = 1.15;
            mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
            mob.lastSeenX = target.x;
            mob.lastSeenZ = target.z;
            this.emitSound('mower_rev', mob.zone, mob.x, 0, mob.z);
          }
        } else if (mob.state === 'rev') {
          if (target) {
            mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
          }
          if (mob.stateTimer <= 0) {
            mob.state = 'charge';
            mob.stateTimer = 1.7;
          }
        } else {
          // charge straight ahead; bonks into hedges/fences!
          const hitWall = this.moveMobWithObstacles(
            mob,
            Math.sin(mob.yaw) * 7.6 * nightMult * dt,
            Math.cos(mob.yaw) * 7.6 * nightMult * dt,
            0.7,
          );
          for (const p of Object.values(this.snapshot.players)) {
            if (p.alive && p.zone === mob.zone && dist2D(p.x, p.z, mob.x, mob.z) < 1.65) {
              this.damagePlayer(p, 28);
              mob.state = 'patrol';
              mob.stateTimer = 2.2;
              break;
            }
          }
          if (hitWall) {
            this.emitSound('bonk', mob.zone, mob.x, 0.5, mob.z);
            mob.stunTimer = 1.2;
            mob.state = 'patrol';
            mob.stateTimer = 1.5;
          } else if (mob.stateTimer <= 0) {
            mob.state = 'patrol';
            mob.stateTimer = 1.8;
          }
        }
      } else if (mob.kind === 'squirrel') {
        const target = this.detectPlayer(mob, 15, Math.PI * 0.45, 3.0);
        if (mob.state === 'scurry') {
          this.followPatrol(mob, 3.2, dt);
          if (target && mob.stateTimer <= 0) {
            mob.state = 'windup';
            mob.stateTimer = 0.85;
            mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
          }
        } else {
          // windup -> throw acorn if still has line of sight
          if (target) {
            mob.yaw = Math.atan2(target.x - mob.x, target.z - mob.z);
          }
          if (mob.stateTimer <= 0) {
            if (target && hasLineOfSight(mob.zone, mob.x, mob.z, target.x, target.z)) {
              const dx = target.x - mob.x;
              const dz = target.z - mob.z;
              const d = Math.max(0.1, Math.hypot(dx, dz));
              const speed = 13.5;
              const proj: ProjectileEntity = {
                id: this.uid('acorn'),
                kind: 'acorn',
                zone: mob.zone,
                x: mob.x,
                y: 1.0,
                z: mob.z,
                vx: (dx / d) * speed,
                vy: 3.2 + d * 0.13,
                vz: (dz / d) * speed,
                ttl: 2.5,
              };
              this.snapshot.projectiles[proj.id] = proj;
              this.emitSound('acorn_throw', mob.zone, mob.x, 1, mob.z);
            }
            mob.state = 'scurry';
            mob.stateTimer = 2.6;
          }
        }
      } else if (mob.kind === 'spider' || mob.kind === 'cultist') {
        const target = this.detectPlayer(mob, 12.5, Math.PI * 0.44, 3.0);
        if (target) {
          mob.state = 'chase';
          mob.targetPlayerId = target.id;
          mob.lastSeenX = target.x;
          mob.lastSeenZ = target.z;
          const ang = Math.atan2(target.x - mob.x, target.z - mob.z);
          mob.yaw = ang;
          const baseSpd = mob.kind === 'spider' ? 3.7 : 3.2;
          const lightBoost = target.flashlightOn ? 1.12 : 1.0;
          this.moveMobWithObstacles(
            mob,
            Math.sin(ang) * baseSpd * lightBoost * nightMult * dt,
            Math.cos(ang) * baseSpd * lightBoost * nightMult * dt,
          );
          if (mob.stateTimer <= 0) {
            mob.stateTimer = 3.2;
            this.emitSound(
              mob.kind === 'spider' ? 'spider_hiss' : 'cultist_chant',
              mob.zone,
              mob.x,
              1,
              mob.z,
            );
          }
          if (dist2D(mob.x, mob.z, target.x, target.z) < 1.45) {
            this.damagePlayer(target, mob.kind === 'spider' ? 18 : 20);
            mob.stunTimer = 1.5;
          }
        } else if (
          (mob.state === 'chase' || mob.state === 'search') &&
          mob.lastSeenX !== undefined &&
          mob.lastSeenZ !== undefined
        ) {
          if (mob.state === 'chase') {
            mob.state = 'search';
            mob.stateTimer = 2.6;
          }
          const dLast = dist2D(mob.x, mob.z, mob.lastSeenX, mob.lastSeenZ);
          if (dLast > 0.8) {
            const ang = Math.atan2(mob.lastSeenX - mob.x, mob.lastSeenZ - mob.z);
            mob.yaw = ang;
            this.moveMobWithObstacles(
              mob,
              Math.sin(ang) * 2.8 * dt,
              Math.cos(ang) * 2.8 * dt,
            );
          } else {
            // Look around suspiciously at last known spot
            mob.yaw += Math.sin(mob.stateTimer * 3.5) * 1.8 * dt;
          }
          if (mob.stateTimer <= 0) {
            mob.state = mob.kind === 'spider' ? 'lurk' : 'stalk';
            mob.targetPlayerId = null;
            mob.lastSeenX = undefined;
            mob.lastSeenZ = undefined;
            mob.stateTimer = 0.6;
          }
        } else {
          mob.state = mob.kind === 'spider' ? 'lurk' : 'stalk';
          this.followPatrol(mob, 2.2, dt);
        }
      } else if (mob.kind === 'pillbug') {
        // Harmless creepy-cute giant pillbug that curls up & rolls around!
        if (mob.state === 'wander') {
          const hit = this.moveMobWithObstacles(
            mob,
            Math.sin(mob.yaw) * 1.6 * dt,
            Math.cos(mob.yaw) * 1.6 * dt,
          );
          if (hit) mob.yaw += Math.PI * 0.7;
          if (mob.stateTimer <= 0) {
            mob.state = 'roll';
            mob.stateTimer = 3.2;
            mob.yaw = Math.random() * Math.PI * 2;
          }
        } else {
          const hit = this.moveMobWithObstacles(
            mob,
            Math.sin(mob.yaw) * 6.2 * dt,
            Math.cos(mob.yaw) * 6.2 * dt,
          );
          if (hit) mob.yaw += Math.PI * 0.8;
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
            this.moveMobWithObstacles(
              mob,
              Math.sin(ang) * 7.5 * dt,
              Math.cos(ang) * 7.5 * dt,
            );
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
          this.moveMobWithObstacles(
            mob,
            Math.sin(ang) * 8.5 * dt,
            Math.cos(ang) * 8.5 * dt,
          );
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
              this.moveMobWithObstacles(
                mob,
                Math.sin(ang) * 5.2 * dt,
                Math.cos(ang) * 5.2 * dt,
              );
            }
            if (mob.stateTimer <= 0) {
              mob.stateTimer = 3.5;
              this.emitSound('bark', mob.zone, mob.x, 1.2, mob.z);
            }
          } else {
            mob.state = 'wander';
            const hit = this.moveMobWithObstacles(
              mob,
              Math.sin(mob.yaw) * 2.5 * dt,
              Math.cos(mob.yaw) * 2.5 * dt,
            );
            if (hit || mob.stateTimer <= 0) {
              mob.yaw += (Math.random() - 0.5) * 2.2;
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
