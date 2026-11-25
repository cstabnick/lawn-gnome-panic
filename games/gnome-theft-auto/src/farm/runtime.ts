// The living croft (E16 D3): buying it (E08 property + loan), the beds' plants, prompts, the stall, the oak, saving.
// Static buildings are built by country/croft.ts. The simulation is farm/state.ts; this file is the game side of it.
import * as THREE from 'three';
import { getPrefab, buildPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { JobsDeps } from '../jobs/types';
import type { CountryPart } from '../country/types';
import type { Blip } from '../types';
import { heightAt } from '../terrain';
import { playAt } from '../sound/bus';
import { textPlate } from '../homes/pieces';
import { activeInventory, addItem, count, registerItem } from '../inventory';
import { buyProperty, onPropertyChange, ownsProperty, registerProperty } from '../ownership';
import { emitHarvest } from './events';
import { applyOffline, bedSecondsLeft, bedStatus, harvest, oakReady, oakSecondsLeft, parseFarm, plantCrop, plantOak, serializeFarm,
  shakeOak, stepFarm, waterBed } from './state';
import { BED, BED_CROPS, BEDS, CROFT, CROPS, FARM, cropDef, type CropId, type FarmEvent, type FarmState } from './types';

/** What the Farm app (farmApp.ts) and other modules use. */
export interface FarmRuntime extends CountryPart {
  update(dt: number): void;
  blips(): Blip[];
  prompt(x: number, z: number): string | null;
  interact(x: number, z: number): boolean;
  /** The live state (read-only for callers). */
  state(): FarmState;
  owned(): boolean;
  /** Pick the seed the next planting uses (a BED_CROPS id). */
  selectSeed(crop: CropId): void;
  /** Sell everything in the bag and the crate (as the stall does); returns Acorns earned. Works anywhere when owned. */
  sellAll(): number;
}

let current: FarmRuntime | null = null;

/** The farm's state, or null before installFarm ran (E18 chef ingredients, tests). */
export function farmState(): FarmState | null { return current ? current.state() : null; }

const SINGULAR: Partial<Record<CropId, string>> = { radish: 'Radish', carrot: 'Carrot', cabbage: 'Cabbage', pumpkin: 'Pumpkin' };
const SAVE_EVERY_S = 15;
const THIRSTY_EVERY_S = 60;
const THIRSTY_NEAR_M = 150;
const SEE_NEAR_M = 220;
const BOARD_NEAR_M = 60;
const BED_TOAST_NEAR_M = 150;
const ACORN_RING = 6;

const money = (n: number) => n.toLocaleString('en-US');

/** m:ss for a number of seconds (rounded up). */
function clock(sec: number): string {
  const t = Math.ceil(Math.max(0, sec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** A prefab stood at (x, ground + lift, z), or null when the id is not in the catalogue. */
function prefabAt(id: string, x: number, z: number, lift: number): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id, { lights: false });
  o.position.set(x, heightAt(x, z) + lift, z);
  return o;
}

function dist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

interface Action {
  label: string;
  run(): boolean;
}

export function installFarm(deps: JobsDeps): FarmRuntime {
  // ---- registration (the Ledger lists the property; the produce is food the bag can hold) ----
  registerProperty({
    id: FARM.propertyId, name: FARM.name, price: FARM.price, down: FARM.down, interest: FARM.interest, blurb: FARM.blurb,
    buyHint: FARM.buyHint,
  });
  for (const c of CROPS) {
    if (!c.item) continue;
    registerItem({ id: c.item, name: SINGULAR[c.id] ?? c.name, prefab: c.produce, kind: 'snack', heal: c.heal, blurb: c.blurb });
  }

  // ---- state ----
  const now = Date.now();
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(FARM.saveKey) ?? null;
  } catch {
    raw = null;
  }
  let s: FarmState = parseFarm(raw, now);
  applyOffline(s, now);

  const owned = () => ownsProperty(FARM.propertyId);

  function save(): void {
    try {
      storage()?.setItem(FARM.saveKey, serializeFarm(s, Date.now()));
    } catch {
      // Storage can be blocked; the farm still plays.
    }
  }

  // ---- visuals ----
  const scene = deps.scene;
  const bedRoots: THREE.Group[] = [];
  const plantGroups: (THREE.Group | null)[] = [];
  const wetPlanes: THREE.Mesh[] = [];
  const oakRoot = new THREE.Group();
  let oakGroup: THREE.Group | null = null;
  let plate: THREE.Object3D | null = null;

  BEDS.forEach((bed, i) => {
    const root = new THREE.Group();
    const wet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 7.8),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.95 }), LAYER.decal),
    );
    wet.rotation.x = -Math.PI / 2;
    wet.position.set(bed.x, heightAt(bed.x, bed.z) + 0.235, bed.z);
    wet.visible = false;
    root.add(wet);
    scene.add(root);
    bedRoots.push(root);
    wetPlanes.push(wet);
    plantGroups.push(null);
    drawBed(i);
  });
  scene.add(oakRoot);
  drawOak();

  function drawBed(i: number): void {
    const bed = BEDS[i];
    const b = s.beds[i];
    const root = bedRoots[i];
    const old = plantGroups[i];
    if (old) root.remove(old);
    plantGroups[i] = null;
    wetPlanes[i].visible = !!b.crop && b.wet;
    if (!b.crop) return;
    const id = cropDef(b.crop).prefabStages[b.stage];
    const group = new THREE.Group();
    for (let k = 0; k < BED.plants; k++) {
      const x = bed.x + (k % 2 === 0 ? -0.75 : 0.75);
      const z = bed.z + [-3, -1, 1, 3][Math.floor(k / 2)];
      const o = prefabAt(id, x, z, 0.22);
      if (o) group.add(o);
    }
    root.add(group);
    plantGroups[i] = group;
  }

  function drawOak(): void {
    if (oakGroup) oakRoot.remove(oakGroup);
    oakGroup = new THREE.Group();
    if (s.oak.planted) {
      const tree = prefabAt(cropDef('oak').prefabStages[s.oak.stage], CROFT.oak.x, CROFT.oak.z, 0);
      if (tree) oakGroup.add(tree);
      if (oakReady(s)) {
        for (let k = 0; k < ACORN_RING; k++) {
          const a = (k / ACORN_RING) * Math.PI * 2;
          const r = 2.5 + (k % 3) * 0.75;
          const acorn = prefabAt('acorn', CROFT.oak.x + Math.cos(a) * r, CROFT.oak.z + Math.sin(a) * r, 0.05);
          if (acorn) oakGroup.add(acorn);
        }
      }
    }
    oakRoot.add(oakGroup);
  }

  function drawBoard(): void {
    if (plate) scene.remove(plate);
    const text = owned()
      ? 'SOLD\nTO A GNOME WHO SHOULD KNOW BETTER'
      : `FOR SALE\nWINDFALL CROFT\n${money(FARM.price)} ACORNS\n${FARM.down} DOWN, THE BANK DOES THE REST`;
    plate = textPlate(text, CROFT.forSale.x - 0.09, heightAt(CROFT.forSale.x, CROFT.forSale.z) + 1.7, CROFT.forSale.z,
      -Math.PI / 2, { w: 1.5, h: 0.9 });
    scene.add(plate);
  }
  drawBoard();

  onPropertyChange((id) => {
    if (id === FARM.propertyId) drawBoard();
  });

  // ---- selling ----
  function heldProduce(): { n: number; acorns: number } {
    let n = 0;
    let acorns = 0;
    for (const c of CROPS) {
      if (!c.item) continue;
      const k = count(c.item) + (s.crate[c.id] ?? 0);
      n += k;
      acorns += k * c.sell;
    }
    return { n, acorns };
  }

  function sellAll(): number {
    if (!owned()) return 0;
    let n = 0;
    let acorns = 0;
    for (const c of CROPS) {
      if (!c.item) continue;
      const inBag = activeInventory()?.remove(c.item, count(c.item)) ?? 0;
      const k = inBag + (s.crate[c.id] ?? 0);
      n += k;
      acorns += k * c.sell;
    }
    s.crate = {};
    s.stats.sold += n;
    s.stats.earned += acorns;
    deps.economy.earn(acorns, 'Windfall Croft stall');
    playAt('farm-sell', CROFT.stall);
    save();
    return acorns;
  }

  // ---- prompts and actions ----
  function bedAction(i: number): Action | null {
    const b = s.beds[i];
    const status = bedStatus(s, i);
    const name = cropDef(b.crop ?? s.seed).name;
    if (status === 'empty') {
      const seed = cropDef(s.seed);
      return {
        label: `Plant ${seed.name} (${seed.seedCost})`,
        run: () => {
          if (!deps.economy.spend(seed.seedCost, 'Seeds')) {
            deps.hud.toast('Not enough Acorns for seed.');
            return true;
          }
          plantCrop(s, i, s.seed);
          playAt('farm-plant', BEDS[i]);
          deps.hud.toast('Planted. Now water them.');
          drawBed(i);
          save();
          return true;
        },
      };
    }
    if (status === 'dry') {
      return {
        label: `Water the ${name}`,
        run: () => {
          waterBed(s, i);
          playAt('farm-water', BEDS[i]);
          drawBed(i);
          save();
          return true;
        },
      };
    }
    if (status === 'growing') {
      return {
        label: `Check the ${name}`,
        run: () => {
          deps.hud.toast(`${name}: growing, about ${clock(bedSecondsLeft(s, i))} to go.`);
          return true;
        },
      };
    }
    // ripe
    return {
      label: `Harvest the ${name}`,
      run: () => {
        const r = harvest(s, i);
        if (!r.ok) return true;
        const item = cropDef(r.crop).item;
        const fitted = item ? addItem(item, r.n) : 0;
        const rest = r.n - fitted;
        if (rest > 0) s.crate[r.crop] = (s.crate[r.crop] ?? 0) + rest;
        playAt('farm-harvest', BEDS[i]);
        emitHarvest({ crop: r.crop, n: r.n, bed: i });
        deps.hud.toast(`+${r.n} ${cropDef(r.crop).name} (${rest} in the crate)`);
        drawBed(i);
        save();
        return true;
      },
    };
  }

  function oakAction(): Action | null {
    if (!s.oak.planted) {
      const cost = cropDef('oak').seedCost;
      return {
        label: `Plant an oak (${cost})`,
        run: () => {
          if (!deps.economy.spend(cost, 'Seeds')) {
            deps.hud.toast('Not enough Acorns for seed.');
            return true;
          }
          plantOak(s);
          playAt('farm-plant', CROFT.oak);
          deps.hud.toast('An acorn in the ground. Come back in forty minutes. Or forty years.');
          drawOak();
          save();
          return true;
        },
      };
    }
    if (oakReady(s)) {
      return {
        label: 'Shake the oak',
        run: () => {
          const n = shakeOak(s);
          deps.economy.earn(n, 'Oak');
          playAt('farm-oak-shake', CROFT.oak);
          emitHarvest({ crop: 'oak', n, bed: null });
          deps.hud.toast(`+${n} Acorns from your oak.`);
          drawOak();
          save();
          return true;
        },
      };
    }
    if (s.oak.stage < 2) {
      return {
        label: 'Check the oak',
        run: () => {
          deps.hud.toast(`The oak: about ${clock(oakSecondsLeft(s))} to the next stage.`);
          return true;
        },
      };
    }
    return {
      label: 'Check the oak',
      run: () => {
        deps.hud.toast(`No acorns yet: ${clock(oakSecondsLeft(s))}.`);
        return true;
      },
    };
  }

  function action(x: number, z: number): Action | null {
    // The For Sale board: works whether or not the croft is owned.
    const bx = CROFT.forSale.x - 1.5;
    if (dist(x, z, bx, CROFT.forSale.z) <= 2.2) {
      if (!owned()) {
        return {
          label: `Buy Windfall Croft (${FARM.down} down)`,
          run: () => {
            const r = buyProperty(FARM.propertyId);
            if (r.ok) {
              deps.hud.toast('Windfall Croft is yours. So is the loan. And the weeds.');
              drawBoard();
            } else {
              deps.hud.toast(r.error);
            }
            return true;
          },
        };
      }
      return {
        label: 'Read the board',
        run: () => {
          deps.hud.toast('SOLD. The bank holds the rest, at ten per cent.');
          return true;
        },
      };
    }
    if (!owned()) return null;

    for (let i = 0; i < BEDS.length; i++) {
      const bed = BEDS[i];
      if (Math.abs(x - bed.x) <= bed.w / 2 + BED.reach && Math.abs(z - bed.z) <= bed.d / 2 + BED.reach) {
        return bedAction(i);
      }
    }

    const rack = { x: CROFT.seedRack.x - 1.5, z: CROFT.seedRack.z };
    if (dist(x, z, rack.x, rack.z) <= 2) {
      return {
        label: `Pick seeds: ${cropDef(s.seed).name}`,
        run: () => {
          const i = BED_CROPS.indexOf(s.seed);
          s.seed = BED_CROPS[(i + 1) % BED_CROPS.length];
          const c = cropDef(s.seed);
          deps.hud.toast(`Seeds: ${c.name}. ${c.seedCost} Acorns a bed, about ${Math.round(c.growS / 60)} min to grow.`);
          save();
          return true;
        },
      };
    }

    const stall = { x: CROFT.stall.x - 1.5, z: CROFT.stall.z };
    if (dist(x, z, stall.x, stall.z) <= 2) {
      const held = heldProduce();
      if (held.n > 0) {
        return {
          label: `Sell produce (${held.n} for ${held.acorns})`,
          run: () => {
            const acorns = sellAll();
            deps.hud.toast(`Sold ${held.n} produce for ${acorns} Acorns.`);
            return true;
          },
        };
      }
      return {
        label: 'Check the stall',
        run: () => {
          deps.hud.toast('Nothing to sell. Grow something.');
          return true;
        },
      };
    }

    if (dist(x, z, CROFT.oak.x, CROFT.oak.z) <= 4) return oakAction();
    return null;
  }

  // ---- per-frame ----
  let playS = 0;
  let sinceSaveS = 0;
  let lastThirstyS = -Infinity;
  let seenBoard = false;

  function visibleTo(px: number, pz: number): void {
    const near = dist(px, pz, CROFT.oak.x, CROFT.oak.z) <= SEE_NEAR_M;
    for (const root of bedRoots) root.visible = near;
    oakRoot.visible = near;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save();
    });
  }

  const farm: FarmRuntime = {
    state: () => s,
    owned,
    selectSeed(crop) {
      if (!BED_CROPS.includes(crop)) return;
      s.seed = crop;
      save();
    },
    sellAll,

    update(dt: number) {
      playS += dt;
      const p = deps.player;
      visibleTo(p.x, p.z);
      if (!seenBoard && dist(p.x, p.z, CROFT.forSale.x, CROFT.forSale.z) <= BOARD_NEAR_M) seenBoard = true;

      if (owned()) {
        const events: FarmEvent[] = stepFarm(s, dt);
        for (const e of events) onFarmEvent(e);
      }
      sinceSaveS += dt;
      if (sinceSaveS >= SAVE_EVERY_S) {
        sinceSaveS = 0;
        save();
      }
    },

    blips(): Blip[] {
      if (owned()) return [{ x: 100, z: 535, color: FARM.blip, label: 'Windfall Croft', kind: 'home' }];
      if (!seenBoard) return [];
      return [{ x: CROFT.forSale.x, z: CROFT.forSale.z, color: '#c9a227', label: 'Croft for sale' }];
    },

    prompt(x, z) {
      return action(x, z)?.label ?? null;
    },

    interact(x, z) {
      const a = action(x, z);
      return a ? a.run() : false;
    },
  };

  function onFarmEvent(e: FarmEvent): void {
    if (e.kind === 'stage') {
      drawBed(e.bed);
    } else if (e.kind === 'thirsty') {
      const bed = BEDS[e.bed];
      const p = deps.player;
      if (playS - lastThirstyS >= THIRSTY_EVERY_S && dist(p.x, p.z, bed.x, bed.z) <= THIRSTY_NEAR_M) {
        lastThirstyS = playS;
        deps.hud.toast(`Windfall Croft: the ${cropDef(e.crop).name.toLowerCase()} want water.`);
      }
    } else if (e.kind === 'oak-stage') {
      drawOak();
    } else if (e.kind === 'oak-ready') {
      drawOak();
      deps.hud.toast('Windfall Croft: the oak is heavy with acorns.');
    }
  }

  current = farm;
  return farm;
}
