// Build-mode panel, a child of #ui. STUB (roadmap 9 step 0): hidden div #dayg-build; issue 2.3 replaces it.
import type { PieceKind } from './types';
import { BASE_DOM } from './config';

export interface BuildUiState {
  mode: 'off' | 'claim' | 'build';
  canBuild: boolean;
  claim: { ok: boolean; why: string | null } | null;
  pieces: { kind: PieceKind; name: string; prefab: string; cost: string; affordable: boolean }[];
  selected: PieceKind | null;
  target: { name: string; hp: number; maxHp: number; repair: string | null; canRepair: boolean; canDismantle: boolean; action: { label: string; enabled: boolean } | null } | null;
  status: string | null;
  baseHp: { hp: number; maxHp: number } | null;
}
export interface BuildUiHandlers { toggle(): void; select(kind: PieceKind): void; place(): void; repair(): void; dismantle(): void; targetAction(): void; claim(): void; abandon(): void; exit(): void }
export interface BuildUi { root: HTMLElement; update(s: BuildUiState): void; setVisible(on: boolean): void }

export function createBuildUi(ui: HTMLElement, h: BuildUiHandlers): BuildUi {
  void h;
  const root = document.createElement('div');
  root.id = BASE_DOM.build;
  root.hidden = true;
  root.style.display = 'none';
  ui.appendChild(root);
  return {
    root,
    update: () => {},
    setVisible(on: boolean) { root.hidden = !on; root.style.display = on ? '' : 'none'; },
  };
}
