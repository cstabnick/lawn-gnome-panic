// Tuning, scene list and slider definitions. Edit numbers here, not in the sim code.

export const GX = 64;
export const GY = 48;
export const GZ = 64;
export const DX = 0.025; // metres per grid cell (domain 1.6 x 1.2 x 1.6 m)
export const NODE_COUNT = GX * GY * GZ;
export const MAX_PARTICLES = 65536;
export const PARTICLE_SPACING = DX / 2; // 2x2x2 particles per rest cell
export const REST_DENSITY = 8; // particle mass 1, so 8 mass per cell at rest
export const SUB_DT = 1 / 600; // seconds per substep
export const MAX_SUBSTEPS = 16; // uniform slots per frame
export const FLOOR_Y = 3 * DX; // grid boundary margin is 3 cells
export const UNIFORM_STRIDE = 256;

export type SceneId = 0 | 1 | 2 | 3;

export interface SceneInfo {
  id: SceneId;
  name: string;
  blurb: string;
  /** which per-scene controls to show */
  controls: ('cup' | 'gate')[];
}

export const SCENES: SceneInfo[] = [
  { id: 0, name: 'Cup to basin', blurb: 'Tilt the cup (or tick Auto pour) and fill the basin. Shake it to test the walls.', controls: ['cup'] },
  { id: 1, name: 'Stepped weir', blurb: 'Raise the gate and the reservoir spills down three steps.', controls: ['gate'] },
  { id: 2, name: 'Funnel and split', blurb: 'Water drains through a funnel and splits on a ridge into two troughs.', controls: [] },
  { id: 3, name: 'Dam break', blurb: 'Classic test: lift the gate, watch the column hit the post and the low wall.', controls: ['gate'] },
];

export interface SliderDef {
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** shown only for these scene controls; omit for always */
  needs?: 'cup' | 'gate';
  /** change needs a reset to take effect */
  reset?: boolean;
  note?: string;
}

export interface Params {
  particles: number;
  gravity: number; // m/s^2
  sound: number; // numerical speed of sound, m/s (stiffness)
  viscosity: number; // kinematic, m^2/s
  friction: number; // wall Coulomb friction
  speed: number; // substeps per frame (1..16); 10 = real time at 60 fps
  radius: number; // render radius in metres
  vessel: number; // vessel opacity 0..1
  tilt: number; // degrees
  cupX: number;
  cupY: number;
  gate: number; // 0 closed .. 1 open
}

export const DEFAULTS: Params = {
  particles: 24576,
  gravity: 9.81,
  sound: 5,
  viscosity: 0.0005,
  friction: 0.08,
  speed: 10,
  radius: 0.0105,
  vessel: 0.35,
  tilt: 0,
  cupX: 0.52,
  cupY: 0.85,
  gate: 0,
};

export const SLIDERS: SliderDef[] = [
  { key: 'particles', label: 'Particles', min: 4096, max: 65536, step: 2048, unit: '', reset: true, note: 'applies on Reset; capped by how much water the scene holds' },
  { key: 'gravity', label: 'Gravity', min: 0, max: 30, step: 0.1, unit: ' m/s²' },
  { key: 'sound', label: 'Stiffness (speed of sound)', min: 1, max: 9, step: 0.1, unit: ' m/s', note: 'higher = less squish, unstable above ~8' },
  { key: 'viscosity', label: 'Viscosity', min: 0, max: 0.03, step: 0.0001, unit: ' m²/s', note: 'water ~0, honey ~0.02' },
  { key: 'friction', label: 'Wall friction', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'speed', label: 'Sim speed (substeps/frame)', min: 1, max: 16, step: 1, unit: '', note: '10 is real time at 60 fps' },
  { key: 'radius', label: 'Droplet size', min: 0.004, max: 0.02, step: 0.0005, unit: ' m' },
  { key: 'vessel', label: 'Vessel opacity', min: 0.05, max: 1, step: 0.01, unit: '' },
  { key: 'tilt', label: 'Cup tilt', min: -20, max: 130, step: 1, unit: '°', needs: 'cup' },
  { key: 'cupX', label: 'Cup x', min: 0.35, max: 0.85, step: 0.01, unit: ' m', needs: 'cup' },
  { key: 'cupY', label: 'Cup height', min: 0.55, max: 1.0, step: 0.01, unit: ' m', needs: 'cup' },
  { key: 'gate', label: 'Gate open', min: 0, max: 1, step: 0.01, unit: '', needs: 'gate' },
];

export interface FluidPreset {
  name: string;
  values: Partial<Params>;
}

export const FLUID_PRESETS: FluidPreset[] = [
  { name: 'Water', values: { gravity: 9.81, viscosity: 0.0005, sound: 5, friction: 0.08 } },
  { name: 'Moon water', values: { gravity: 1.62, viscosity: 0.0005, sound: 5, friction: 0.08 } },
  { name: 'Jupiter', values: { gravity: 24.8, viscosity: 0.0005, sound: 7, friction: 0.08 } },
  { name: 'Oil', values: { gravity: 9.81, viscosity: 0.004, sound: 5, friction: 0.05 } },
  { name: 'Honey', values: { gravity: 9.81, viscosity: 0.02, sound: 5, friction: 0.5 } },
];
