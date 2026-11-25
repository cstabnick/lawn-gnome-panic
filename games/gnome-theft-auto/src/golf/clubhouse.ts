// Hedgeworth's buildings (STUB: issue A7 fills it in): the clubhouse, Basil's cottage, Thrift's shed and the cart
// shelter outside, the clubhouse interior (E05 defineInterior), and the three homes (E10 registerHome).
import type * as THREE from 'three';
import type { Box } from '../types';
import type { GolfStore } from './types';

export interface ClubhouseDeps {
  store(): GolfStore;
  /** Start a round on hole `hole` (default 0): null = started, else why not. */
  startRound(hole?: number): string | null;
  toast(text: string): void;
}

export function buildHedgeworthBuildings(_scene: THREE.Scene): { boxes: Box[] } {
  return { boxes: [] };
}
export function defineClubhouseInterior(_deps: ClubhouseDeps): void {}
export function registerHedgeworthHomes(): void {}
