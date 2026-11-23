// Tuft hunting (docs/roadmaps/gta-hunting.md): the system app.ts talks to. Spawns the quarry from HUNT_SPOTS, steps
// the simulation (quarry.ts), leaves and draws tracks, plays calls, takes the player's bullets (hitTest), offers the comb
// prompt at a knocked-over quarry and Hazel's counter at the lodge, and keeps the save, the HUD and the achievements.
// Local to each browser, like the other wildlife (critters.ts): the animals are not relayed online.
import type * as THREE from 'three';
import { isOpen, openSpot } from '../critters';
import type { Economy } from '../economy';
import { playAt, play2d } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, Box, Fx, Hud, Player, Sfx, World } from '../types';
import { createHuntHud, type HuntHud } from './huntHud';
import { createHuntStore, type HuntStore } from './huntSave';
import { createLodge } from './lodge';
import { createLodgeUi } from './lodgeUi';
import {
  canComb, combQuarry, createQuarry, quarryContains, shootQuarry, stepQuarry,
  type Quarry, type QuarryEnv,
} from './quarry';
import { createQuarryView } from './quarryView';
import { registerHuntSounds } from './sounds';
import { HUNT, HUNT_ACHIEVEMENTS, HUNT_SPOTS, LODGE, SPECIES, speciesById, type HuntSpecies } from './species';
import { createTracks, leavePrints } from './tracks';
import { createTrackView } from './trackView';

export interface HuntDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  fx: Fx;
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Storage for the save (tests); default localStorage. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** What app.ts hands the hunt each frame. */
export interface HuntFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  playerX: number;
  playerZ: number;
  /** On foot and able to act (not in a vehicle, not falling or tumbling). */
  onFoot: boolean;
  /** Speed on foot, units/s (0 in a vehicle). */
  footSpeed: number;
  /** |speed| of the vehicle the player is in, 0 on foot. */
  vehicleSpeed: number;
  /** 0 day .. 1 night. */
  night: number;
  /** Rounds in the held gun's magazine now: a drop since last frame means a shot went off. */
  ammo: number;
  /** True while a cutscene, shop or menu holds the game: the hunt HUD hides. */
  paused: boolean;
}

export interface Hunting {
  readonly boxes: readonly Box[];
  readonly blips: readonly Blip[];
  readonly list: readonly Quarry[];
  /** A player bullet at (x, y, z). True when it hit a quarry (a knock-down or a bounce off a rolled shell). */
  hitTest(x: number, y: number, z: number): boolean;
  /** The E prompt: comb a knocked-over quarry, or talk to Hazel at the lodge counter. Null when neither. */
  prompt(player: Player): string | null;
  /** E pressed while prompt() was not null. True when handled. */
  interact(player: Player): boolean;
  isOpen(): boolean;
  close(): void;
  update(f: HuntFrame): void;
  /** Debug trainer: spawn one quarry of `id` at (x, z) (nudged to open land in its region). Null for an unknown id. */
  spawn(id: string, x: number, z: number): Quarry | null;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** Heading word for a yaw (0 = +z = south on the map, PI/2 = +x = east). */
function heading(yaw: number): string {
  // Map bearing: north is -z. atan2(dx, -dz) gives 0 for north, PI/2 for east.
  const b = Math.atan2(Math.sin(yaw), -Math.cos(yaw));
  const i = Math.round(((b + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return COMPASS[i];
}

/** Where a quarry of `s` may appear near (x, z): open land in its region with HUNT.spawnMargin to spare (so never on or
 *  beside a road, in water or in a building), or null when there is none within 120 units. */
export function spawnSpot(s: HuntSpecies, x: number, z: number, world: World): { x: number; z: number } | null {
  return openSpot(x, z, s.radius + HUNT.spawnMargin, s.region, world);
}

export interface PlannedQuarry { species: HuntSpecies; x: number; z: number; homeX: number; homeZ: number; leash: number }

/** Every quarry HUNT_SPOTS places at start (deterministic for a given rnd). A spot with no open land is skipped. */
export function spawnPlan(world: World, rnd: () => number): PlannedQuarry[] {
  const out: PlannedQuarry[] = [];
  for (const spot of HUNT_SPOTS) {
    const s = speciesById(spot.species);
    if (!s) continue;
    const centre = openSpot(spot.x, spot.z, 2 + HUNT.spawnMargin, s.region, world);
    if (!centre) continue;
    for (let i = 0; i < spot.count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * spot.spread;
      const p = spawnSpot(s, centre.x + Math.cos(a) * r, centre.z + Math.sin(a) * r, world);
      if (p) out.push({ species: s, x: p.x, z: p.z, homeX: centre.x, homeZ: centre.z, leash: spot.leash });
    }
  }
  return out;
}

export function createHunting(deps: HuntDeps): Hunting {
  registerHuntSounds();
  const store: HuntStore = createHuntStore(deps.storage);
  const lodge = createLodge(deps.scene);
  const quarryView = createQuarryView(deps.scene);
  const tracks = createTracks();
  const trackView = createTrackView(deps.scene);
  const list: Quarry[] = [];
  let nextId = 1;
  let seed = 7654321;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const envs = new Map<string, QuarryEnv>();
  const envFor = (s: HuntSpecies): QuarryEnv => {
    let e = envs.get(s.id);
    if (!e) {
      // quarry.ts asks for radius + HUNT.roadMargin, which keeps quarry off the highway tarmac and its verges.
      e = { ground: heightAt, open: (x, z, r) => isOpen(x, z, r, s.region, deps.world), rnd };
      envs.set(s.id, e);
    }
    return e;
  };

  const lodgeUi = createLodgeUi(deps.ui, {
    store,
    acorns: () => deps.economy.state().acorns,
    spend: (n) => deps.economy.spend(n, 'Tuft License'),
    earn: (n, reason) => deps.economy.earn(n, reason),
    onSold(items, acorns) {
      play2d('hunt-sell');
      deps.hud.toast(`${LODGE.keeper} pays ${acorns} Acorns for ${items} item${items === 1 ? '' : 's'}.`, 3500);
      if (items > 0) deps.increment(HUNT_ACHIEVEMENTS.trader, items);
    },
    onLicensed() {
      deps.hud.toast(`Tuft License bought. Knock quarry over with a shot, then comb it before it gets up.`, 6000);
      deps.play('shutter');
    },
    play: deps.play,
  });
  const huntHud: HuntHud = createHuntHud(deps.ui, () => {
    if (lodgeUi.isOpen()) lodgeUi.close();
    else lodgeUi.open('journal', false);
  });

  function spawn(id: string, x: number, z: number, leash = 30): Quarry | null {
    const s = speciesById(id);
    if (!s) return null;
    const p = spawnSpot(s, x, z, deps.world);
    if (!p) return null;
    const q = createQuarry(nextId++, s, p.x, p.z, envFor(s), leash);
    q.yaw = rnd() * Math.PI * 2;
    q.callT = s.callEvery[0] + rnd() * (s.callEvery[1] - s.callEvery[0]);
    list.push(q);
    return q;
  }

  for (const p of spawnPlan(deps.world, rnd)) {
    const q = createQuarry(nextId++, p.species, p.x, p.z, envFor(p.species), p.leash);
    q.homeX = p.homeX;
    q.homeZ = p.homeZ;
    q.yaw = rnd() * Math.PI * 2;
    q.callT = p.species.callEvery[0] + rnd() * (p.species.callEvery[1] - p.species.callEvery[0]);
    list.push(q);
  }

  // Debug: ?hunt=<species id> spawns one 10 units in front of the player on the first frame.
  let debugSpawn = ((): string | null => {
    try { return new URLSearchParams(location.search).get('hunt'); } catch { return null; }
  })();

  let px = 0, pz = 0;
  let lastAmmo = -1;
  let bounceToastT = 0;
  let toldNoLicense = false;
  const flying = new Set<Quarry>();

  function combable(player: Player): Quarry | null {
    if (player.vehicle || player.airborne) return null;
    let best: Quarry | null = null;
    let bd = Infinity;
    for (const q of list) {
      if (!canComb(q, player.x, player.z)) continue;
      const d = Math.hypot(q.x - player.x, q.z - player.z);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  function comb(q: Quarry): void {
    const s = q.species;
    if (!store.licensed()) {
      deps.hud.toast(`You need a Tuft License. ${LODGE.keeper} sells them at the Tuft & Tally Lodge in Mossy Wood.`, 5000);
      if (!toldNoLicense) { toldNoLicense = true; deps.play('whistle'); }
      return;
    }
    if (store.bagFull()) {
      deps.hud.toast(`Your game bag is full (${HUNT.bagSize}). Sell at the Tuft & Tally Lodge.`, 4000);
      return;
    }
    const keepsake = Math.random() < s.keepsake.chance;
    const res = store.recordComb(s, keepsake, q.lastShotDist);
    if (!res.added) return;
    combQuarry(q, px, pz);
    deps.fx.smash?.(q.x, q.y + s.height * 0.5, q.z, s.tuft.color);
    playAt('hunt-comb', q);
    deps.hud.toast(keepsake ? `Combed: ${s.tuft.name}, and a ${s.keepsake.name}!` : `Combed: ${s.tuft.name}.`, 3500);
    if (res.firstOfSpecies) deps.hud.callout?.('NEW IN THE JOURNAL', s.name);
    deps.unlock(HUNT_ACHIEVEMENTS.firstTuft);
    if (s.legendary) deps.unlock(HUNT_ACHIEVEMENTS.oldGrizzle);
    if (store.speciesTaken() >= SPECIES.length) deps.unlock(HUNT_ACHIEVEMENTS.fieldGuide);
    lodgeUi.refresh();
  }

  function hint(f: HuntFrame): string | null {
    // A quarry down near the player: tell them to comb it, with the seconds left.
    let downQ: Quarry | null = null;
    let downD = 40;
    for (const q of list) {
      if (q.mode !== 'down' || q.combedT > 0) continue;
      const d = Math.hypot(q.x - f.playerX, q.z - f.playerZ);
      if (d < downD) { downD = d; downQ = q; }
    }
    if (downQ) return `${downQ.species.name} is down: comb it! ${Math.ceil(downQ.modeT)}s`;
    for (const q of list) {
      if (q.mode === 'wary' && Math.hypot(q.x - f.playerX, q.z - f.playerZ) < 30) return `A ${q.species.name} has heard you. Stand still.`;
    }
    const near = tracks.near(f.playerX, f.playerZ, HUNT.hintRange);
    if (near.length > 0) {
      const p = near[0];
      const s = speciesById(p.species);
      if (s) return `${p.age < HUNT.trackLife / 2 ? 'Fresh' : 'Old'} ${s.name} tracks, heading ${heading(p.yaw)}`;
    }
    return null;
  }

  const blips: Blip[] = [lodge.blip];

  return {
    boxes: lodge.boxes,
    blips,
    list,
    hitTest(x, y, z) {
      for (const q of list) {
        if (!quarryContains(q, x, y, z)) continue;
        const dist = Math.hypot(q.x - px, q.z - pz);
        const r = shootQuarry(q, px, pz, dist);
        if (r === 'miss') continue;
        if (r === 'bounced') {
          playAt('hunt-bounce', q);
          deps.fx.spark(x, y, z);
          if (bounceToastT <= 0) {
            deps.hud.toast(`Shots bounce off a rolled-up ${q.species.name}. Wait for it to uncurl.`, 3000);
            bounceToastT = 20;
          }
          return true;
        }
        deps.fx.smash?.(q.x, q.y + q.species.height * 0.5, q.z, q.species.puff);
        deps.play('bump');
        playAt(q.species.call, q, { param: 1 });
        if (dist >= HUNT.longShot) deps.unlock(HUNT_ACHIEVEMENTS.longShot);
        return true;
      }
      return false;
    },
    prompt(player) {
      if (player.vehicle || player.airborne) return null;
      const q = combable(player);
      if (q) return store.licensed() ? `Comb ${q.species.name} (${q.species.tuft.name})` : `Comb ${q.species.name} (needs a Tuft License)`;
      if (lodge.nearCounter(player.x, player.z)) return `Talk to ${LODGE.keeper} (Tuft & Tally Lodge)`;
      return null;
    },
    interact(player) {
      if (player.vehicle || player.airborne) return false;
      const q = combable(player);
      if (q) { comb(q); return true; }
      if (lodge.nearCounter(player.x, player.z)) { lodgeUi.open('lodge', true); return true; }
      return false;
    },
    isOpen: () => lodgeUi.isOpen(),
    close: () => lodgeUi.close(),
    spawn: (id, x, z) => spawn(id, x, z),
    update(f) {
      px = f.playerX;
      pz = f.playerZ;
      bounceToastT -= f.dt;
      if (debugSpawn) {
        const id = debugSpawn;
        debugSpawn = null;
        if (!spawn(id, f.playerX, f.playerZ - 10)) deps.hud.toast(`?hunt: no species "${id}"`, 4000);
      }
      const shot = lastAmmo >= 0 && f.ammo < lastAmmo;
      lastAmmo = f.ammo;
      const noise = f.vehicleSpeed > 0.5 ? 1 + Math.min(1, f.vehicleSpeed / 15)
        : f.footSpeed < 0.5 ? 0.15 : f.footSpeed < 4 ? 0.45 : 1;
      const frame = { dt: f.dt, playerX: f.playerX, playerZ: f.playerZ, noise, night: f.night, shot };
      for (const q of list) {
        stepQuarry(q, frame, envFor(q.species));
        leavePrints(tracks, q);
        // Calls: a tracking cue by ear.
        q.callT -= f.dt;
        if (q.callT <= 0) {
          const s = q.species;
          q.callT = s.callEvery[0] + rnd() * (s.callEvery[1] - s.callEvery[0]);
          if (q.mode !== 'hidden' && q.mode !== 'burrowed' && Math.hypot(q.x - f.playerX, q.z - f.playerZ) < HUNT.callRadius) {
            playAt(s.call, q, { param: q.awareness >= HUNT.wary ? 1 : 0.5, maxDist: HUNT.callRadius });
          }
        }
        // A flushed bird takes off with a clatter of wings (once per flight).
        if (q.mode === 'flying') {
          if (!flying.has(q)) { flying.add(q); playAt('hunt-flush', q); }
        } else flying.delete(q);
      }
      tracks.update(f.dt);
      trackView.update(tracks, f.playerX, f.playerZ, heightAt);
      quarryView.update(list, f.playerX, f.playerZ, f.dt, f.time);
      lodge.update(f.dt, f.playerX, f.playerZ);
      huntHud.setHidden(f.paused);
      const h = f.paused ? null : hint(f);
      const bag = store.bagCount();
      huntHud.update({ visible: store.licensed() || bag > 0 || h !== null, bag, bagSize: HUNT.bagSize, licensed: store.licensed(), hint: h });
    },
  };
}
