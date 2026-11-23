// Base view: three.js meshes for the base. STUB (roadmap 9 step 0): no-op; issue 2.2 replaces it.
import type * as THREE from 'three';
import type { Aim, BaseState, PieceKind, PlotDef } from './types';

export interface BaseView {
  sync(base: BaseState | null): void;
  setLit(pieceId: string, lit: boolean): void;
  showGhost(kind: PieceKind | null, plot: PlotDef | null, aim: Aim | null, ok: boolean): void;
  showPlot(plot: PlotDef | null): void;
  update(dt: number): void;
}

export function createBaseView(scene: THREE.Scene): BaseView {
  void scene;
  return {
    sync: () => {},
    setLit: () => {},
    showGhost: () => {},
    showPlot: () => {},
    update: () => {},
  };
}
