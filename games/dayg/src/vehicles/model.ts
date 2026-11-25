// Pure modular vehicle & Franken-Build modding model: 5 vehicles, 6 mod slots (24 parts), mismatch penalties & 9 synergy boosts.
export type VehicleKind = 'scrap-bike' | 'mower-kart' | 'barrow-trike' | 'utility-tractor' | 'hearse-buggy';
export type PartSlot = 'engine' | 'belt' | 'oil' | 'wheels' | 'exhaust' | 'bumper';
export type PartSize = 'small' | 'medium' | 'large';

export interface PartDef {
  id: string;
  slot: PartSlot;
  name: string;
  size: PartSize;
  speedMul: number;
  accelMul: number;
  handlingMul: number;
  noiseMul: number;
  ramBonus: number;
  color: number;
  desc: string;
}

export interface VehicleDef {
  kind: VehicleKind;
  name: string;
  size: PartSize;
  baseSpeed: number;
  baseAccel: number;
  baseHandling: number;
  baseColor: number;
  desc: string;
}

export interface VehicleInstance {
  id: string;
  kind: VehicleKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  parts: Partial<Record<PartSlot, string>>;
  hp?: number;
  maxHp?: number;
  fuel?: number;
}

export interface VehicleStats {
  runnable: boolean;
  missing: PartSlot[];
  topSpeed: number;
  accel: number;
  handling: number;
  noise: number;
  wobble: number;
  ramDamage: number;
  synergies: string[];
  penalties: string[];
}

export const VEHICLE_DEFS: Record<VehicleKind, VehicleDef> = {
  'scrap-bike': { kind: 'scrap-bike', name: 'Scrap Bicycle', size: 'small', baseSpeed: 10, baseAccel: 14, baseHandling: 3.2, baseColor: 0x6f7d66, desc: 'Nimble two-wheeler cobbled from gatehouse tubing.' },
  'mower-kart': { kind: 'mower-kart', name: 'Push-Mower Kart', size: 'small', baseSpeed: 12, baseAccel: 16, baseHandling: 2.8, baseColor: 0xc23b22, desc: 'Low-slung lawnmower chassis with questionable brakes.' },
  'barrow-trike': { kind: 'barrow-trike', name: 'Wheelbarrow Trike', size: 'medium', baseSpeed: 11, baseAccel: 13, baseHandling: 2.4, baseColor: 0x4b6a7a, desc: 'Three-wheeled hauler built from a tin barrow tub.' },
  'utility-tractor': { kind: 'utility-tractor', name: 'Utility Tractor', size: 'large', baseSpeed: 13, baseAccel: 12, baseHandling: 2.0, baseColor: 0x9a7b3c, desc: 'Heavy groundskeeper tractor made for ramming hordes.' },
  'hearse-buggy': { kind: 'hearse-buggy', name: 'Mossgrave Hearse-Buggy', size: 'large', baseSpeed: 14, baseAccel: 13, baseHandling: 2.2, baseColor: 0x262932, desc: 'Armored gothic hearse converted for cemetery runs.' },
};

export const PART_CATALOG: readonly PartDef[] = [
  // Engines
  { id: 'eng-pedal-crank', slot: 'engine', name: 'Pedal Crankset', size: 'small', speedMul: 0.9, accelMul: 1.0, handlingMul: 1.15, noiseMul: 0.25, ramBonus: 0, color: 0x9aa0a6, desc: 'Human-powered chain drive. Whisper quiet.' },
  { id: 'eng-mower-2t', slot: 'engine', name: '2-Stroke Mower Engine', size: 'small', speedMul: 1.1, accelMul: 1.15, handlingMul: 1.0, noiseMul: 1.0, ramBonus: 0.5, color: 0x8a3b2e, desc: 'Loud, reliable pull-cord lawn engine.' },
  { id: 'eng-v6-blower', slot: 'engine', name: 'Twin-Blower V6', size: 'medium', speedMul: 1.35, accelMul: 1.3, handlingMul: 0.95, noiseMul: 1.4, ramBonus: 1.2, color: 0x5c6870, desc: 'Salvaged leaf-blower twin bank.' },
  { id: 'eng-v8-tractor', slot: 'engine', name: 'Cast-Iron V8', size: 'large', speedMul: 1.55, accelMul: 1.45, handlingMul: 0.82, noiseMul: 1.85, ramBonus: 2.0, color: 0x2b2d30, desc: 'Ridiculously heavy cast-iron V8 with twin stacks.' },
  // Belts
  { id: 'belt-hemp', slot: 'belt', name: 'Braided Hemp Belt', size: 'small', speedMul: 0.92, accelMul: 0.9, handlingMul: 1.0, noiseMul: 0.8, ramBonus: 0, color: 0x8a7558, desc: 'Stretchy garden twine belt.' },
  { id: 'belt-rubber', slot: 'belt', name: 'Standard V-Belt', size: 'medium', speedMul: 1.05, accelMul: 1.05, handlingMul: 1.05, noiseMul: 1.0, ramBonus: 0, color: 0x222222, desc: 'Solid black rubber drive belt.' },
  { id: 'belt-chain', slot: 'belt', name: 'Iron Drive Chain', size: 'large', speedMul: 1.12, accelMul: 1.2, handlingMul: 0.95, noiseMul: 1.2, ramBonus: 0.5, color: 0x6d7378, desc: 'Zero-slip iron chain.' },
  { id: 'belt-turbo', slot: 'belt', name: 'Overdrive Cog Belt', size: 'medium', speedMul: 1.25, accelMul: 1.25, handlingMul: 0.9, noiseMul: 1.25, ramBonus: 0.3, color: 0xd9a441, desc: 'Geared for absurd top-end speed.' },
  // Oils
  { id: 'oil-clean', slot: 'oil', name: 'Clean Machine Oil', size: 'small', speedMul: 1.0, accelMul: 1.05, handlingMul: 1.05, noiseMul: 0.9, ramBonus: 0, color: 0xd4b050, desc: 'Smooth, reliable lubrication.' },
  { id: 'oil-compost', slot: 'oil', name: 'Compost Sludge Oil', size: 'medium', speedMul: 0.92, accelMul: 0.95, handlingMul: 0.85, noiseMul: 1.1, ramBonus: 0, color: 0x5a4a3a, desc: 'Smells awful and wobbles, unless paired with overdrive.' },
  { id: 'oil-clover', slot: 'oil', name: 'Pressed Clover Oil', size: 'small', speedMul: 0.98, accelMul: 1.0, handlingMul: 1.1, noiseMul: 0.65, ramBonus: 0, color: 0x5f7d45, desc: 'Silky botanical oil that dampens rattle.' },
  { id: 'oil-nitro', slot: 'oil', name: 'Nitro-Tonic Blend', size: 'large', speedMul: 1.22, accelMul: 1.35, handlingMul: 0.88, noiseMul: 1.35, ramBonus: 0.5, color: 0x52b788, desc: 'Volatile green brew that kicks engines into overdrive.' },
  // Wheels
  { id: 'whl-bike', slot: 'wheels', name: 'Thin Spoke Wheels', size: 'small', speedMul: 1.1, accelMul: 1.05, handlingMul: 1.2, noiseMul: 0.7, ramBonus: 0, color: 0x9aa0a6, desc: 'Fast & nimble, weak against heavy frames.' },
  { id: 'whl-mower', slot: 'wheels', name: 'Mower Treads', size: 'small', speedMul: 1.0, accelMul: 1.1, handlingMul: 1.05, noiseMul: 1.0, ramBonus: 0.5, color: 0x2b2b2b, desc: 'Grippy turf tyres.' },
  { id: 'whl-barrow', slot: 'wheels', name: 'Pneumatic Barrow Tyres', size: 'medium', speedMul: 1.05, accelMul: 1.0, handlingMul: 1.1, noiseMul: 0.95, ramBonus: 0.8, color: 0x3b3b3b, desc: 'Cushioned tyres for rough cemetery kerbs.' },
  { id: 'whl-monster', slot: 'wheels', name: 'Monster Turf Rollers', size: 'large', speedMul: 1.15, accelMul: 0.95, handlingMul: 0.85, noiseMul: 1.3, ramBonus: 2.5, color: 0x1a1a1a, desc: 'Oversized tractor lugs that crush Hatless.' },
  // Exhausts (optional mod slot)
  { id: 'exh-tin-pipe', slot: 'exhaust', name: 'Tin Downspout Pipe', size: 'small', speedMul: 1.02, accelMul: 1.0, handlingMul: 1.0, noiseMul: 1.15, ramBonus: 0, color: 0x8d959b, desc: 'Rattling gutter pipe welded to the manifold.' },
  { id: 'exh-twin-stacks', slot: 'exhaust', name: 'Chrome Twin Stacks', size: 'large', speedMul: 1.08, accelMul: 1.1, handlingMul: 0.96, noiseMul: 1.35, ramBonus: 0.4, color: 0xd9e0e6, desc: 'Towering vertical pipes that roar across Mossgrave.' },
  { id: 'exh-flamethrower', slot: 'exhaust', name: 'Afterburner Flamethrower', size: 'large', speedMul: 1.15, accelMul: 1.25, handlingMul: 0.92, noiseMul: 1.5, ramBonus: 0.8, color: 0xd96b27, desc: 'Spits orange sparks for absurd acceleration.' },
  { id: 'exh-silencer', slot: 'exhaust', name: 'Moss-Packed Silencer', size: 'medium', speedMul: 0.96, accelMul: 0.98, handlingMul: 1.04, noiseMul: 0.45, ramBonus: 0, color: 0x4f6145, desc: 'Muffles engine roar so Hatless stay unaware.' },
  // Bumpers (optional mod slot)
  { id: 'bmp-plank-guard', slot: 'bumper', name: 'Timber Plank Guard', size: 'small', speedMul: 0.99, accelMul: 1.0, handlingMul: 1.0, noiseMul: 1.0, ramBonus: 1.2, color: 0x6b4a2e, desc: 'Bolted oak planks to absorb minor collisions.' },
  { id: 'bmp-spiked-plow', slot: 'bumper', name: 'Spiked Cemetery Plow', size: 'large', speedMul: 0.97, accelMul: 0.95, handlingMul: 0.9, noiseMul: 1.08, ramBonus: 4.0, color: 0x3b4046, desc: 'Wedge-shaped iron plow studded with fence spikes.' },
  { id: 'bmp-cowcatcher', slot: 'bumper', name: 'Iron Cowcatcher', size: 'medium', speedMul: 1.02, accelMul: 1.0, handlingMul: 0.95, noiseMul: 1.02, ramBonus: 2.8, color: 0x565c63, desc: 'Sweeps Hatless cleanly aside at speed.' },
  { id: 'bmp-lantern-bar', slot: 'bumper', name: 'Lantern Bullbar', size: 'small', speedMul: 1.0, accelMul: 1.02, handlingMul: 1.02, noiseMul: 0.98, ramBonus: 1.0, color: 0xe8c35a, desc: 'Bright twin-lantern rack for night driving.' },
];

/** Required 4 slots for a vehicle to run. */
export const ALL_SLOTS: readonly PartSlot[] = ['engine', 'belt', 'oil', 'wheels'];
/** All 6 modular slots (4 required + 2 optional). */
export const MOD_SLOTS: readonly PartSlot[] = ['engine', 'belt', 'oil', 'wheels', 'exhaust', 'bumper'];

export function getPart(id: string | undefined): PartDef | null {
  if (!id) return null;
  return PART_CATALOG.find((p) => p.id === id) ?? null;
}

export function evaluateVehicle(v: VehicleInstance): VehicleStats {
  const def = VEHICLE_DEFS[v.kind];
  const missing: PartSlot[] = [];
  for (const s of ALL_SLOTS) if (!v.parts[s]) missing.push(s);
  const runnable = missing.length === 0;

  let topSpeed = def.baseSpeed;
  let accel = def.baseAccel;
  let handling = def.baseHandling;
  let noise = 12;
  let wobble = 0;
  let ramDamage = def.size === 'large' ? 3 : def.size === 'medium' ? 2 : 1.2;
  const synergies: string[] = [];
  const penalties: string[] = [];

  const eng = getPart(v.parts.engine);
  const belt = getPart(v.parts.belt);
  const oil = getPart(v.parts.oil);
  const whl = getPart(v.parts.wheels);
  const exh = getPart(v.parts.exhaust);
  const bmp = getPart(v.parts.bumper);

  for (const p of [eng, belt, oil, whl, exh, bmp]) {
    if (!p) continue;
    topSpeed *= p.speedMul;
    accel *= p.accelMul;
    handling *= p.handlingMul;
    noise *= p.noiseMul;
    ramDamage += p.ramBonus;
  }

  // Slight mismatch penalties
  if (eng && eng.size === 'small' && def.size === 'large') {
    topSpeed *= 0.75;
    accel *= 0.75;
    penalties.push('Underpowered Frame (-25% speed)');
  }
  if (whl && whl.size === 'small' && def.size === 'large') {
    handling *= 0.8;
    wobble += 0.15;
    penalties.push('Skittering Tyres (-20% handling)');
  }
  if (oil?.id === 'oil-compost' && belt?.id !== 'belt-turbo') {
    wobble += 0.25;
    penalties.push('Compost Gum-Up (+wobble)');
  }

  // 9 Goofy Franken-Build Synergies!
  if (eng?.id === 'eng-v8-tractor' && def.size === 'small') {
    topSpeed *= 1.45;
    accel *= 1.35;
    wobble += 0.12;
    synergies.push('🚀 Rocket Bike! (+45% speed, +35% accel)');
  }
  if (whl?.id === 'whl-monster' && def.size === 'small') {
    topSpeed *= 1.2;
    ramDamage += 2.5;
    synergies.push('🦖 Lawn Monster! (+20% speed, +2.5 ram)');
  }
  if (oil?.id === 'oil-compost' && belt?.id === 'belt-turbo') {
    accel *= 1.25;
    synergies.push('🧪 Sludge Turbo! (+25% accel)');
  }
  if (oil?.id === 'oil-nitro' && (eng?.id === 'eng-v6-blower' || eng?.id === 'eng-v8-tractor')) {
    topSpeed *= 1.25;
    accel *= 1.4;
    synergies.push('🔥 Moonshine Express! (+25% speed, +40% accel)');
  }
  if (eng?.id === 'eng-pedal-crank' && oil?.id === 'oil-clover' && whl?.id === 'whl-bike') {
    noise *= 0.4;
    synergies.push('🥷 Silent Phantom! (-60% noise)');
  }
  if (bmp?.id === 'bmp-spiked-plow' && eng?.id === 'eng-v8-tractor') {
    ramDamage += 4.0;
    synergies.push('⚔️ Zombie Harvester! (+4.0 ram damage)');
  }
  if (v.kind === 'hearse-buggy' && belt?.id === 'belt-turbo' && oil?.id === 'oil-nitro') {
    topSpeed *= 1.22;
    accel *= 1.3;
    synergies.push('⚰️ Dragster Hearse! (+22% speed, +30% accel)');
  }
  if (oil?.id === 'oil-compost' && eng?.id === 'eng-v8-tractor') {
    wobble += 0.22;
    topSpeed *= 1.15;
    synergies.push('💥 Wobble Rocket! (+15% speed, +chaotic wobble)');
  }
  if (exh?.id === 'exh-silencer' && oil?.id === 'oil-clover') {
    noise *= 0.55;
    synergies.push('🦉 Stealth Cruiser! (-45% noise)');
  }

  return {
    runnable,
    missing,
    topSpeed: Number(topSpeed.toFixed(1)),
    accel: Number(accel.toFixed(1)),
    handling: Number(handling.toFixed(2)),
    noise: Number(noise.toFixed(1)),
    wobble,
    ramDamage: Number(ramDamage.toFixed(1)),
    synergies,
    penalties,
  };
}

export function repairVehicle(v: VehicleInstance): void {
  const max = v.maxHp ?? 100;
  v.maxHp = max;
  v.hp = max;
}

export function refuelVehicle(v: VehicleInstance): void {
  v.fuel = 100;
}

export interface VehicleStore {
  vehicles: VehicleInstance[];
  stash: string[];
}

const STORAGE_KEY = 'dayg_vehicles_v1';

export function createDefaultVehicleStore(): VehicleStore {
  return {
    vehicles: [
      {
        id: 'veh-bike-1', kind: 'scrap-bike', x: 312, y: 0, z: 452, yaw: 0.4, hp: 100, maxHp: 100, fuel: 100,
        parts: { engine: 'eng-pedal-crank', belt: 'belt-hemp', oil: 'oil-clover', wheels: 'whl-bike' },
      },
      {
        id: 'veh-kart-1', kind: 'mower-kart', x: 342, y: 0, z: 444, yaw: -0.6, hp: 90, maxHp: 100, fuel: 85,
        parts: { engine: 'eng-mower-2t', belt: 'belt-rubber', wheels: 'whl-mower' },
      },
      {
        id: 'veh-trike-1', kind: 'barrow-trike', x: 265, y: 0, z: 390, yaw: 1.1, hp: 95, maxHp: 100, fuel: 80,
        parts: { belt: 'belt-chain', oil: 'oil-clean', wheels: 'whl-barrow', bumper: 'bmp-plank-guard' },
      },
      {
        id: 'veh-tractor-1', kind: 'utility-tractor', x: 380, y: 0, z: 120, yaw: -1.2, hp: 120, maxHp: 120, fuel: 70,
        parts: { engine: 'eng-v8-tractor', belt: 'belt-turbo', oil: 'oil-nitro', exhaust: 'exh-twin-stacks' },
      },
      {
        id: 'veh-hearse-1', kind: 'hearse-buggy', x: 295, y: 0, z: 240, yaw: 0.2, hp: 130, maxHp: 130, fuel: 65,
        parts: { engine: 'eng-v6-blower', belt: 'belt-rubber', wheels: 'whl-barrow', bumper: 'bmp-lantern-bar' },
      },
    ],
    stash: ['eng-v8-tractor', 'whl-monster', 'oil-nitro', 'belt-turbo', 'exh-flamethrower', 'bmp-spiked-plow'],
  };
}

export function loadVehicleStore(): VehicleStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultVehicleStore();
    const parsed = JSON.parse(raw) as Partial<VehicleStore>;
    const def = createDefaultVehicleStore();
    return {
      vehicles: Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0 ? parsed.vehicles : def.vehicles,
      stash: Array.isArray(parsed.stash) ? parsed.stash : def.stash,
    };
  } catch {
    return createDefaultVehicleStore();
  }
}

export function saveVehicleStore(s: VehicleStore): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
