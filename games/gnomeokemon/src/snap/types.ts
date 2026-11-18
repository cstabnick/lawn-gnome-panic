import type { GnomeokemonElement } from '../prefabs/types';

export type CreatureAction = 'idle' | 'eating' | 'startled' | 'dancing';

export type PhotoGrade = 'Divine' | 'Gold' | 'Silver' | 'Bronze';

export interface PhotoScoreBreakdown {
  size: number;
  framing: number;
  pose: number;
  special: number;
  total: number;
  specialLabels: string[];
  grade: PhotoGrade;
}

export interface CreatureSnapshot {
  speciesId: string;
  pos: [number, number, number];
  rotY: number;
  action: CreatureAction;
  animTime: number;
}

export interface SceneSnapshot {
  dogT: number;
  cameraPos: [number, number, number];
  cameraQuat: [number, number, number, number];
  fov: number;
  creatures: CreatureSnapshot[];
}

export interface PhotoRecord {
  id: string;
  speciesId: string;
  dex: string;
  name: string;
  element: GnomeokemonElement;
  capturedAt: number;
  dataUrl: string;
  score: PhotoScoreBreakdown;
  snapshot: SceneSnapshot;
}
