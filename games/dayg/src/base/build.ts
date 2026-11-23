// Build-mode controller. STUB (roadmap 9 step 0): shows the sample states for ?buildui=1 and ?buildui=claim; issue 3.1 replaces the rest.
import type { Bus } from '../game/bus';
import type { InventorySystem, PlayerState } from '../game/types';
import type { Collider } from '../world/collide';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
import { createBuildUi, type BuildUiHandlers, type BuildUiState } from './buildUi';
import { PIECES } from './config';
import { PIECE_KINDS } from './types';

export interface BuildDeps { base: BaseSystem; view: BaseView; ui: HTMLElement; inv: InventorySystem; collider: Collider; bus: Bus; getPlayer: () => PlayerState; getAim: () => number }
export interface BuildController { active(): boolean; open(): void; update(dt: number): void }

const noop = (): void => {};
const HANDLERS: BuildUiHandlers = { toggle: noop, select: noop, place: noop, repair: noop, dismantle: noop, targetAction: noop, claim: noop, abandon: noop, exit: noop };

const SAMPLE_BUILD: BuildUiState = {
  mode: 'build', canBuild: true, claim: null,
  pieces: PIECE_KINDS.map((kind, i) => {
    const p = PIECES[kind];
    return { kind, name: p.name, prefab: p.prefab, cost: p.cost.map((c) => `${c.tag} ${c.count}`).join(', '), affordable: i < 4 };
  }),
  selected: 'plank-wall',
  target: { name: 'Plank wall', hp: 70, maxHp: 120, repair: 'PLANK 1, NAIL 2', canRepair: true, canDismantle: true, action: { label: 'Reinforce', enabled: false } },
  status: 'Plank wall: 45 s',
  baseHp: { hp: 430, maxHp: 600 },
};
const SAMPLE_CLAIM: BuildUiState = {
  mode: 'claim', canBuild: true, claim: { ok: false, why: 'The ground is not flat here.' },
  pieces: [], selected: null, target: null, status: null, baseHp: null,
};

export function createBuildController(deps: BuildDeps): BuildController {
  const ui = createBuildUi(deps.ui, HANDLERS);
  const sample = new URLSearchParams(location.search).get('buildui');
  if (sample === '1') { ui.update(SAMPLE_BUILD); ui.setVisible(true); }
  else if (sample === 'claim') { ui.update(SAMPLE_CLAIM); ui.setVisible(true); }
  return { active: () => false, open: noop, update: noop };
}
