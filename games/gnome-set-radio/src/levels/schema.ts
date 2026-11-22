import type { LevelDoc } from '@lawn/level';
import type { GsrTrackId } from '@lawn/music';

export type GsrBuildingArch =
  | 'conservatory-hall'
  | 'rotunda-dome'
  | 'cafe-terrace'
  | 'vinyl-tower'
  | 'overpass-deck'
  | 'drum-silo'
  | 'diner-stop'
  | 'smelter-furnace'
  | 'kiln-chimney'
  | 'foundry-hall'
  | 'fountain-basin'
  | 'glass-pavilion'
  | 'lighthouse-spire'
  | 'resort-terrace';

export interface GsrBuilding {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  yBase: number;
  h: number;
  color: string;
  roofColor: string;
  accentColor?: string;
  trimColor?: string;
  label?: string;
  arch?: GsrBuildingArch;
  prefab?: string;
}

export interface GsrRamp {
  id: string;
  x: number;
  z: number;
  w: number;
  length: number;
  yBottom: number;
  yTop: number;
  /** Yaw in radians: +Z is forward (ramp rises from -length/2 to +length/2 in local Z). */
  yaw: number;
  color: string;
}

export interface GsrRail {
  id: string;
  points: [number, number, number][];
  color: string;
  glowColor: string;
  speedBoost?: number;
}

export interface GsrBillboard {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  w: number;
  h: number;
  gangName: string;
  eventId?: string;
  color: string;
}

export type GsrInteractiveKind =
  | 'bongo-pad'
  | 'hydrant'
  | 'boombox'
  | 'turntable'
  | 'spray-pickup'
  | 'cone-cluster'
  | 'relay-dish'
  | 'tempo-acorn'
  | 'speaker-stack'
  | 'aerial-ring'
  | 'updraft-vent';

export interface GsrInteractive {
  id: string;
  kind: GsrInteractiveKind;
  x: number;
  y: number;
  z: number;
  power?: number;
  prefab?: string;
  label?: string;
  eventId?: string;
}

export type GsrObjectiveType =
  | 'tag'
  | 'chase'
  | 'dish'
  | 'bongo-chain'
  | 'sentries'
  | 'collect'
  | 'rail-combo'
  | 'speakers'
  | 'rings'
  | 'boss-upright'
  | 'boss-kora'
  | 'boss-vera'
  | 'boss-finn';

export interface GsrEventDef {
  id: string;
  kind: 'story' | 'boss' | 'side';
  title: string;
  character: string;
  characterPrefab: string;
  introLine: string;
  completeLine: string;
  objectiveType: GsrObjectiveType;
  targetIds?: string[];
  targetCount: number;
  x: number;
  y: number;
  z: number;
}

export interface GsrAmbientNpc {
  id: string;
  name: string;
  kind: 'gnome' | 'woken';
  prefab?: string;
  hatColor?: string;
  shirtColor?: string;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  line: string;
}

export interface GsrWorldDetail {
  kind:
    | 'eq-strip'
    | 'neon-arch'
    | 'turntable-disc'
    | 'cable-span'
    | 'fountain-plaza'
    | 'banner-arch'
    | 'piano-walkway'
    | 'highway-chevron'
    | 'molten-channel'
    | 'mist-pool'
    | 'placed-prop';
  x: number;
  y: number;
  z: number;
  x2?: number;
  y2?: number;
  z2?: number;
  w?: number;
  d?: number;
  yaw?: number;
  scale?: number;
  prefab?: string;
  color: string;
  accentColor?: string;
}

export interface GsrLevelData {
  areaNumber: number;
  subtitle: string;
  gangName: string;
  gangLeader: string;
  trackId: GsrTrackId;
  skyTheme?: 'velvet' | 'bongo' | 'kiln' | 'birdbath';
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  groundColor: string;
  accentColor: string;
  buildings: GsrBuilding[];
  ramps: GsrRamp[];
  rails: GsrRail[];
  billboards: GsrBillboard[];
  interactives: GsrInteractive[];
  events: GsrEventDef[];
  ambientNpcs?: GsrAmbientNpc[];
  details?: GsrWorldDetail[];
}

export type GsrLevelDoc = LevelDoc<GsrLevelData>;
