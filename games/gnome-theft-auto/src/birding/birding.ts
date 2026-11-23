// Birding (docs/roadmaps/gta-birding.md): the system app.ts talks to. Spawns and steps the flocks round the player, plays
// calls and keeps the heard list, runs the scope's spotting and photos, pays the rewards and achievements, and wires the
// hide and the journal. Local to each browser, like the other wildlife: not relayed online.
import type * as THREE from 'three';
import type { Economy } from '../economy';
import { REGIONS, REGION_IDS, regionAt } from '../levels';
import { play2d, playAt } from '../sound';
import { heightAt, waterAt } from '../terrain';
import { markTrainerModified } from '../trainer/mark';
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
import { button, grid, heading, note, status } from '../trainer/ui';
import type { Blip, Box, Hud, Player, Sfx, World } from '../types';
import { createBirdStore, type BirdStore } from './birdSave';
import { createBirdView, type BirdView } from './birdView';
import { circleFlock, createFlock, sendFlock, stepFlock } from './flock';
import { createHide, type HideWorld } from './hide';
import { createJournalUi, type JournalUi } from './journalUi';
import { createPerchIndex, type PerchIndex } from './perches';
import { angleToView, bearingTo, createScope, type Scope } from './scope';
import { createScopeUi, type ScopeUi } from './scopeUi';
import { BIRDS, birdById } from './species';
import { registerBirdSounds } from './sounds';
import { flockSize, pickSpecies, speciesWeight, windAt, wildName } from './spawner';
import {
  BIRDING, BIRD_ACHIEVEMENTS, BIRD_SFX, HIDE, NEW_SPECIES_ACORNS, OPTICS, birdSoundId,
  type BirdSpecies, type Flock, type FlockEnv, type FlockFrame, type PerchSpot, type RegionId, type Threat,
  type TimeLabel, type Wind,
} from './types';

export interface BirdingDeps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Storage for the save (tests); default localStorage. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** What app.ts hands birding each frame (before chase.update). */
export interface BirdingFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  playerX: number;
  playerY: number;
  playerZ: number;
  /** On foot and able to act (not in a vehicle, not falling or tumbling, no cutscene or menu). */
  onFoot: boolean;
  /** Speed on foot, units/s (0 in a vehicle). */
  footSpeed: number;
  /** Every vehicle in the world (the player's own included): fast ones flush birds. */
  vehicles: readonly { x: number; z: number; speed: number }[];
  timeLabel: TimeLabel;
  /** Rounds in the held gun's magazine now: a drop since last frame means a shot went off. */
  ammo: number;
  /** The raw look input this frame (before app.ts zeroes it while the scope is up). */
  lookYaw: number;
  lookPitch: number;
  /** The chase camera's yaw and pitch now. */
  camYaw: number;
  camPitch: number;
  /** A cutscene, shop or menu holds the game: the birding HUD hides and the scope comes down. */
  paused: boolean;
}

export interface Birding {
  readonly boxes: readonly Box[];
  readonly blips: readonly Blip[];
  readonly species: readonly BirdSpecies[];
  /** The scope is up: app.ts holds movement, firing and the chase camera's look input. */
  viewing(): boolean;
  /** The E prompt at the hide keeper, or null. */
  prompt(player: Player): string | null;
  /** E pressed while prompt() was not null. True when handled. */
  interact(player: Player): boolean;
  /** The journal or hide sheet is open. */
  isOpen(): boolean;
  close(): void;
  update(f: BirdingFrame): void;
  /**
   * After chase.update: while the scope is up, puts the camera at the gnome's eye with the scope's view and returns the
   * scope's yaw and pitch (app.ts copies them to the chase camera so the view stays put when the scope comes down).
   * Null when the scope is down.
   */
  applyCamera(dt: number): { yaw: number; pitch: number } | null;
  /** Debug trainer: a flock of species `id` near (x, z). False for an unknown id. */
  spawn(id: string, x: number, z: number): boolean;
  /** Debug trainer: put species `id` on the life list (with its rewards). True when newly seen. */
  markSeen(id: string): boolean;
  /** Region the player is in (for the debug trainer and tests). */
  region(): RegionId;
  stats(): { flocks: number; birds: number };
}

const TAU = Math.PI * 2;
const TIME_LABELS: readonly TimeLabel[] = ['Dawn', 'Morning', 'Noon', 'Golden Hour', 'Dusk', 'Neon Night'];
/** Flocks farther than this do not play their flush clatter. */
const FLUSH_SOUND_RANGE = 60;
/** The ?bird=<id> debug flock appears this far in front of the player. */
const DEBUG_BIRD_DIST = 12;
/** Near the hide (for the HUD hint). */
const HIDE_HINT_RANGE = 30;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function coarsePointer(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function debugParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export function createBirding(deps: BirdingDeps): Birding {
  registerBirdSounds(BIRDS);
  const store: BirdStore = createBirdStore(deps.storage);
  const hide: HideWorld = createHide(deps.scene);
  const view: BirdView = createBirdView(deps.scene, 32);
  const cap = coarsePointer() ? BIRDING.maxBirdsPhone : BIRDING.maxBirds;

  // Local LCG, like hunting.ts: deterministic per session, no allocation.
  let seed = 2468013;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const waterSurface = (x: number, z: number): number | null => waterAt(x, z)?.surface ?? null;
  const perchIndex: PerchIndex = createPerchIndex(deps.world.boxes, heightAt, waterSurface);
  const scratch: PerchSpot = { x: 0, y: 0, z: 0, kind: 'ground' };
  const env: FlockEnv = {
    ground: heightAt,
    water: waterSurface,
    perch: (kinds, x, z, r, out) => perchIndex.find(kinds, x, z, r, rnd, out),
    rnd,
  };
  const scope: Scope = createScope(deps.camera);

  const flocks: Flock[] = [];
  let flockSeq = 0;
  let birdSeq = 0;
  const nextBirdId = (): number => ++birdSeq;
  let px = 0;
  let py = 0;
  let pz = 0;
  let spawnT = 0;
  let frameNo = 0;
  let lastAmmo = -1;
  let debugDone = false;
  // Spotting: the species being made out, for how long, and whether its sighting is already counted.
  let dwellId: string | null = null;
  let dwellT = 0;
  let counted = false;
  // Reused per frame: threats are pooled objects, the flock frame is one object.
  const threatPool: Threat[] = [];
  const threats: Threat[] = [];
  const frame: FlockFrame = {
    dt: 0, time: 0, playerX: 0, playerZ: 0, onFoot: false, footSpeed: 0, threats, shot: false, viewing: false,
  };

  function totalBirds(): number {
    let n = 0;
    for (const fl of flocks) n += fl.members.length;
    return n;
  }

  function addFlock(s: BirdSpecies, size: number, x: number, y: number, z: number, mode: Flock['mode']): Flock {
    const fl = createFlock(++flockSeq, s, size, x, y, z, mode, env, nextBirdId);
    fl.callT = s.callEvery[0] + rnd() * (s.callEvery[1] - s.callEvery[0]);
    flocks.push(fl);
    return fl;
  }

  function skyFlock(s: BirdSpecies, size: number, x: number, z: number): void {
    const fl = addFlock(s, size, x, heightAt(x, z) + s.altitude, z, 'flying');
    circleFlock(fl, x, z, env);
  }

  function recordSighting(s: BirdSpecies): boolean {
    const first = store.markSeen(s.id);
    if (first) {
      deps.economy.earn(NEW_SPECIES_ACORNS[s.rarity], 'New bird');
      play2d(BIRD_SFX.tick);
      deps.hud.callout?.('NEW ON THE LIFE LIST', s.name);
      deps.unlock(BIRD_ACHIEVEMENTS.firstTick);
      deps.increment(BIRD_ACHIEVEMENTS.lifeList10);
      const owls = BIRDS.filter((b) => b.group === 'owl');
      if (owls.length > 0 && owls.every((b) => store.hasSeen(b.id))) deps.unlock(BIRD_ACHIEVEMENTS.nightOwl);
      if (s.group === 'mythic') deps.unlock(BIRD_ACHIEVEMENTS.mythic);
      if (store.seenCount() >= BIRDS.length) deps.unlock(BIRD_ACHIEVEMENTS.fullList);
      if (store.claimable(BIRDS.length).length > 0) {
        deps.hud.toast(`Milestone reached! ${HIDE.keeper} at ${HIDE.name} on Loch Moss has a reward for you.`, 5000);
      }
      journal.refresh();
    }
    return first;
  }

  function tip(): string {
    const unseen = BIRDS.filter((s) => !store.hasSeen(s.id));
    const pool = unseen.length > 0 ? unseen : BIRDS;
    let best: BirdSpecies | null = null;
    let bestRegion: RegionId = 'turfton';
    let bestLabel: TimeLabel = 'Noon';
    let bestW = -1;
    for (const s of pool) {
      for (const region of REGION_IDS) {
        for (const label of TIME_LABELS) {
          const w = speciesWeight(s, region, label, 'calm');
          if (w > bestW) {
            bestW = w;
            best = s;
            bestRegion = region;
            bestLabel = label;
          }
        }
      }
    }
    if (!best) return 'Nobody is out yet. Keep your eyes open.';
    if (unseen.length === 0) return 'You have them all. Now find them again.';
    return `Try ${REGIONS[bestRegion].name} at ${bestLabel} for a ${best.name}.`;
  }

  const journal: JournalUi = createJournalUi(deps.ui, {
    birds: BIRDS,
    store,
    acorns: () => deps.economy.state().acorns,
    spend: (n, r) => deps.economy.spend(n, r),
    earn: (n, r) => deps.economy.earn(n, r),
    play: deps.play,
    playCall: (id) => play2d(birdSoundId(id), { param: 0.5 }),
    tip,
    onClaim: (n) => deps.hud.toast(`${HIDE.keeper} pays ${n} Acorns for your life list.`, 4000),
    onOptics: (i) => {
      const o = OPTICS[i];
      deps.hud.toast(`${o.name}: zoom to ${o.zooms[o.zooms.length - 1]}x.`, 4000);
    },
  });

  const scopeUi: ScopeUi = createScopeUi(deps.ui, {
    onScopeDown: () => scope.setHeld(true),
    onScopeUp: () => scope.setHeld(false),
    onZoom: () => scope.cycleZoom(),
    onSnap: () => scope.requestSnap(),
    onLower: () => scope.lower(),
    onJournal: () => (journal.isOpen() ? journal.close() : journal.open('list', false)),
  });

  const trySpawn = (f: BirdingFrame): void => {
    const total = totalBirds();
    if (flocks.length >= BIRDING.maxFlocks || total >= cap) return;
    const a = rnd() * TAU;
    const dist = BIRDING.spawnMin + rnd() * (BIRDING.spawnMax - BIRDING.spawnMin);
    const lim = deps.world.half - 5;
    const x = clamp(f.playerX + Math.cos(a) * dist, -lim, lim);
    const z = clamp(f.playerZ + Math.sin(a) * dist, -lim, lim);
    const s = pickSpecies(BIRDS, regionAt(x, z), f.timeLabel, windAt(f.time), rnd);
    if (!s) return;
    const size = Math.min(flockSize(s, rnd), cap - total);

    if (s.ambient && rnd() < 0.3) {
      skyFlock(s, size, x, z);
      return;
    }
    if (env.perch(s.perches, x, z, 30, scratch)) {
      if (rnd() < 0.5) {
        addFlock(s, size, scratch.x, scratch.y, scratch.z, scratch.kind === 'water' ? 'swimming' : 'perched');
      } else {
        // Out past the perch, away from the player, then flies in to settle.
        let dx = scratch.x - f.playerX;
        let dz = scratch.z - f.playerZ;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) {
          dx = Math.cos(a);
          dz = Math.sin(a);
        } else {
          dx /= len;
          dz /= len;
        }
        const sx = scratch.x + dx * 30;
        const sz = scratch.z + dz * 30;
        const fl = addFlock(s, size, sx, heightAt(sx, sz) + s.altitude, sz, 'flying');
        sendFlock(fl, scratch.x, scratch.y, scratch.z, scratch.kind, env);
      }
      return;
    }
    if (s.flight === 'soar' || s.ambient) skyFlock(s, size, x, z);
  };

  // Debug trainer spawn: bypasses the caps. Settles on a perch within 20 units, else circles the spot.
  const spawnAt = (id: string, x: number, z: number): boolean => {
    const s = birdById(id);
    if (!s) return false;
    const size = flockSize(s, rnd);
    if (env.perch(s.perches, x, z, 20, scratch)) {
      addFlock(s, size, scratch.x, scratch.y, scratch.z, scratch.kind === 'water' ? 'swimming' : 'perched');
    } else {
      skyFlock(s, size, x, z);
    }
    return true;
  };

  // The scope's spotting and snaps. Only while the scope is up.
  function spot(f: BirdingFrame): void {
    const eyeX = px;
    const eyeY = py + BIRDING.eyeHeight;
    const eyeZ = pz;
    const yaw = scope.yaw();
    const pitch = scope.pitch();
    const halfFov = (scope.fov() * Math.PI) / 360;
    const zoom = scope.zoom();

    let best: BirdSpecies | null = null;
    let bestAngle = Infinity;
    for (const fl of flocks) {
      const s = fl.species;
      if (Math.hypot(fl.x - eyeX, fl.z - eyeZ) > BIRDING.spotMax + 20) continue;
      const reach = Math.min(BIRDING.spotMax, (BIRDING.spotBase + s.size * BIRDING.spotPerSize) * zoom);
      for (const m of fl.members) {
        const dx = m.x - eyeX;
        const dy = m.y - eyeY;
        const dz = m.z - eyeZ;
        if (dx * dx + dy * dy + dz * dz > reach * reach) continue;
        const angle = angleToView(yaw, pitch, eyeX, eyeY, eyeZ, m.x, m.y, m.z);
        if (angle < halfFov * BIRDING.viewCone && angle < bestAngle) {
          bestAngle = angle;
          best = s;
        }
      }
    }

    if (best) {
      const s: BirdSpecies = best;
      if (dwellId === s.id) {
        dwellT += f.dt;
      } else {
        dwellId = s.id;
        dwellT = 0;
        counted = false;
      }
      if (dwellT >= BIRDING.spotSeconds && !counted) {
        counted = true;
        recordSighting(s);
      }
      const seen = store.hasSeen(s.id);
      scopeUi.setTarget({
        label: seen ? s.name : '???',
        progress: seen ? 1 : Math.min(1, dwellT / BIRDING.spotSeconds),
        centred: bestAngle < halfFov * BIRDING.photoCone,
      });
    } else {
      scopeUi.setTarget(null);
      dwellId = null;
    }

    if (scope.takeSnap()) {
      play2d(BIRD_SFX.shutter);
      scopeUi.flash();
      if (best && bestAngle < halfFov * BIRDING.photoCone) {
        const s: BirdSpecies = best;
        if (!store.hasSeen(s.id)) recordSighting(s);
        if (store.markPhoto(s.id)) {
          deps.economy.earn(BIRDING.photoAcorns, 'Bird photo');
          deps.increment(BIRD_ACHIEVEMENTS.photographer);
          deps.hud.toast(`Photo: ${s.name}.`, 3000);
        } else {
          deps.hud.toast('Photo taken.', 2500);
        }
      } else {
        deps.hud.toast('Photo taken. Nothing in the middle of the frame.', 3000);
      }
    }
  }

  // Save Trainer (docs/roadmaps/gta-save-trainer.md, Extension points): spawn any bird, mark species seen.
  for (const b of BIRDS) {
    registerTrainerSpawnable('Birds', b.id, b.name, (at) => (spawnAt(b.id, at.x, at.z) ? `${b.name} spawned` : `${b.name}: no spot`));
  }
  registerTrainerSection({
    id: 'birding', label: 'Birds', order: 45,
    build(el) {
      const st = status();
      el.append(
        st.el,
        heading('Bird book'),
        note('Spawn > Birds puts a bird near the crosshair. Marking seen fills the life list (and pays no Acorns).'),
        grid(button('Mark every bird seen', () => { markTrainerModified('birding'); for (const b of BIRDS) recordSighting(b); st.set('Every species marked seen'); })),
      );
    },
  });

  return {
    boxes: hide.boxes,
    blips: [hide.blip],
    species: BIRDS,

    viewing: () => scope.viewing(),

    prompt(player) {
      if (player.vehicle || player.airborne) return null;
      if (hide.nearCounter(player.x, player.z)) return `Talk to ${HIDE.keeper} (${HIDE.name})`;
      return null;
    },

    interact(player) {
      if (player.vehicle || player.airborne) return false;
      if (hide.nearCounter(player.x, player.z)) {
        journal.open('hide', true);
        return true;
      }
      return false;
    },

    isOpen: () => journal.isOpen(),
    close: () => journal.close(),

    update(f) {
      px = f.playerX;
      py = f.playerY;
      pz = f.playerZ;
      const shot = lastAmmo >= 0 && f.ammo < lastAmmo;
      lastAmmo = f.ammo;

      // Scope first: the viewing state decides the rest of the frame.
      scope.update({
        dt: f.dt,
        canView: f.onFoot && !f.paused && !journal.isOpen(),
        lookYaw: f.lookYaw,
        lookPitch: f.lookPitch,
        camYaw: f.camYaw,
        camPitch: f.camPitch,
        zooms: (OPTICS[store.optics()] ?? OPTICS[0]).zooms,
      });
      const viewing = scope.viewing();
      scopeUi.setViewing(viewing);
      scopeUi.setZoom(scope.zoomLabel());

      // Fast vehicles nearby flush birds.
      threats.length = 0;
      for (const v of f.vehicles) {
        const speed = Math.abs(v.speed);
        if (speed <= BIRDING.flushVehicleSpeed) continue;
        if (Math.hypot(v.x - px, v.z - pz) > 150) continue;
        let slot = threatPool[threats.length];
        if (!slot) {
          slot = { x: 0, z: 0, speed: 0 };
          threatPool[threats.length] = slot;
        }
        slot.x = v.x;
        slot.z = v.z;
        slot.speed = speed;
        threats.push(slot);
      }

      spawnT -= f.dt;
      if (spawnT <= 0) {
        spawnT = BIRDING.spawnEvery;
        trySpawn(f);
      }

      frameNo++;
      frame.time = f.time;
      frame.playerX = px;
      frame.playerZ = pz;
      frame.onFoot = f.onFoot;
      frame.footSpeed = f.footSpeed;
      frame.shot = shot;
      frame.viewing = viewing;
      for (let i = 0; i < flocks.length; ) {
        const fl = flocks[i];
        const s = fl.species;
        const d = Math.hypot(fl.x - px, fl.z - pz);
        if (d > BIRDING.despawnRadius) {
          flocks[i] = flocks[flocks.length - 1];
          flocks.pop();
          continue;
        }

        fl.acc += f.dt;
        if (d <= BIRDING.nearRadius || (frameNo + fl.id) % BIRDING.farEvery === 0) {
          frame.dt = fl.acc;
          const flushed = stepFlock(fl, frame, env);
          fl.acc = 0;
          if (flushed && d < FLUSH_SOUND_RANGE) {
            playAt(BIRD_SFX.flush, fl, { param: Math.min(1, fl.members.length / 10) });
          }
        }

        fl.callT -= f.dt;
        if (fl.callT <= 0) {
          fl.callT = s.callEvery[0] + rnd() * (s.callEvery[1] - s.callEvery[0]);
          if (d < BIRDING.callRadius) {
            playAt(birdSoundId(s.id), fl, {
              bus: 'ambience', maxDist: BIRDING.callRadius, param: fl.sinceFlush < 5 ? 1 : 0.5,
            });
          }
          if (d < BIRDING.hearRange) {
            if (store.markHeard(s.id)) journal.refresh();
            scopeUi.showCall(bearingTo(viewing ? scope.yaw() : f.camYaw, px, pz, fl.x, fl.z), store.hasSeen(s.id));
          }
        }
        i++;
      }

      view.update(flocks);

      if (viewing) {
        spot(f);
      } else {
        scope.takeSnap();
        scopeUi.setTarget(null);
        dwellId = null;
        dwellT = 0;
        counted = false;
      }

      hide.update(f.dt, px, pz);
      const nearHide = Math.hypot(px - HIDE.x, pz - HIDE.z) <= HIDE_HINT_RANGE;
      scopeUi.setHud({
        visible: f.onFoot && !f.paused && !viewing,
        seen: store.seenCount(),
        total: BIRDS.length,
        claimable: store.claimable(BIRDS.length).length > 0,
        wind: wildName(windAt(f.time)),
        hint: nearHide ? `${HIDE.name}: talk to ${HIDE.keeper}` : null,
      });
      scopeUi.setHidden(f.paused);
      scopeUi.update(f.dt);

      // Debug: ?bird=<id> puts a flock in front of the player, once.
      if (!debugDone) {
        debugDone = true;
        const id = debugParam('bird');
        if (id) {
          const x = f.playerX + Math.sin(f.camYaw) * DEBUG_BIRD_DIST;
          const z = f.playerZ + Math.cos(f.camYaw) * DEBUG_BIRD_DIST;
          if (!spawnAt(id, x, z)) deps.hud.toast(`?bird: no species "${id}"`, 4000);
        }
      }
    },

    applyCamera(dt) {
      if (!scope.viewing()) return null;
      scope.applyCamera(px, py + BIRDING.eyeHeight, pz, dt);
      return { yaw: scope.yaw(), pitch: clamp(scope.pitch(), -0.5, 1.2) };
    },

    spawn: (id, x, z) => spawnAt(id, x, z),

    markSeen(id) {
      const s = birdById(id);
      if (!s) return false;
      return recordSighting(s);
    },

    region: () => regionAt(px, pz),

    stats: () => ({ flocks: flocks.length, birds: totalBirds() }),
  };
}
