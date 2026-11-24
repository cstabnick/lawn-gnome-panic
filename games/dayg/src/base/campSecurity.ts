// Pure player camp, security score, defense catalog, and NPC hiring model.
import type { RegionId } from '../sim/types';

export type DefenseKind = 'slingshot-turret' | 'nail-turret' | 'alarm-bell' | 'watchtower' | 'reinforced-gate' | 'spike-pit';

export interface DefenseCatalogEntry {
  kind: DefenseKind;
  name: string;
  costAcorns: number;
  securityValue: number;
  maxHp: number;
  range: number;
  damage: number;
  cooldown: number;
  desc: string;
}

export const DEFENSE_CATALOG: readonly DefenseCatalogEntry[] = [
  { kind: 'slingshot-turret', name: 'Acorn Slingshot Turret', costAcorns: 25, securityValue: 20, maxHp: 100, range: 14, damage: 1.5, cooldown: 1.4, desc: 'Auto-fires acorns at Hatless within 14 gm.' },
  { kind: 'nail-turret', name: 'Nail-Launcher Turret', costAcorns: 45, securityValue: 30, maxHp: 140, range: 18, damage: 2.5, cooldown: 0.9, desc: 'Heavy repeating launcher with 18 gm range.' },
  { kind: 'alarm-bell', name: 'Alarm Tripwire Bell', costAcorns: 15, securityValue: 10, maxHp: 60, range: 12, damage: 0, cooldown: 15, desc: 'Rings an alert whenever Hatless approach within 12 gm.' },
  { kind: 'watchtower', name: 'Lookout Watchtower', costAcorns: 30, securityValue: 15, maxHp: 160, range: 0, damage: 0, cooldown: 0, desc: 'Lit timber tower that boosts camp security and morale.' },
  { kind: 'reinforced-gate', name: 'Reinforced Gate', costAcorns: 20, securityValue: 18, maxHp: 220, range: 0, damage: 0, cooldown: 0, desc: 'Heavy bolted gate section for perimeter protection.' },
  { kind: 'spike-pit', name: 'Spike Trench', costAcorns: 15, securityValue: 12, maxHp: 90, range: 2.2, damage: 1.0, cooldown: 1.2, desc: 'Damages any Hatless stepping within 2.2 gm.' },
];

export interface CampDefense {
  id: string;
  kind: DefenseKind;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
}

export type CampRole = 'guard' | 'scavenger' | 'cook' | 'mechanic';

export interface HiredNpc {
  survivorId: string;
  name: string;
  role: CampRole;
  minSecurity: number;
  morale: number;
}

export interface CampState {
  established: boolean;
  name: string;
  center: { x: number; y: number; z: number } | null;
  region: RegionId | null;
  defenses: CampDefense[];
  hired: HiredNpc[];
}

const STORAGE_KEY = 'dayg_camp_v1';

export function createEmptyCamp(): CampState {
  return { established: false, name: 'Mossgrave Outpost', center: null, region: null, defenses: [], hired: [] };
}

export function loadCampState(): CampState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyCamp();
    const parsed = JSON.parse(raw) as Partial<CampState>;
    return {
      ...createEmptyCamp(),
      ...parsed,
      defenses: Array.isArray(parsed.defenses) ? parsed.defenses : [],
      hired: Array.isArray(parsed.hired) ? parsed.hired : [],
    };
  } catch {
    return createEmptyCamp();
  }
}

export function saveCampState(c: CampState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function computeSecurityScore(camp: CampState, basePieces = 0): number {
  let score = camp.established ? 5 : 0;
  score += Math.min(20, basePieces * 2);
  for (const d of camp.defenses) {
    if (d.hp <= 0) continue;
    const def = DEFENSE_CATALOG.find((x) => x.kind === d.kind);
    if (def) score += def.securityValue;
  }
  for (const h of camp.hired) {
    if (h.role === 'guard') score += 10;
  }
  return score;
}

export function establishCamp(camp: CampState, name: string, center: { x: number; y: number; z: number }, region: RegionId | null): void {
  camp.established = true;
  camp.name = name.trim() || 'Mossgrave Outpost';
  camp.center = { ...center };
  camp.region = region;
}

export function addCampDefense(camp: CampState, kind: DefenseKind, pos: { x: number; y: number; z: number }): CampDefense {
  const def = DEFENSE_CATALOG.find((x) => x.kind === kind)!;
  const item: CampDefense = {
    id: `def-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    hp: def.maxHp,
    maxHp: def.maxHp,
  };
  camp.defenses.push(item);
  return item;
}

export function hireCampNpc(camp: CampState, survivorId: string, name: string, role: CampRole): { ok: boolean; error?: string } {
  if (!camp.established) return { ok: false, error: 'Establish a camp first.' };
  if (camp.hired.some((h) => h.survivorId === survivorId)) return { ok: false, error: `${name} is already hired.` };
  const minSecurity = role === 'guard' ? 15 : 25;
  const sec = computeSecurityScore(camp);
  if (sec < minSecurity) {
    return { ok: false, error: `${name} requires Camp Security ≥ ${minSecurity} (current: ${sec}). Build turrets or defenses!` };
  }
  camp.hired.push({ survivorId, name, role, minSecurity, morale: 85 });
  return { ok: true };
}

export function evaluateDemands(camp: CampState, basePieces = 0): { security: number; warnings: string[] } {
  const security = computeSecurityScore(camp, basePieces);
  const warnings: string[] = [];
  for (const h of camp.hired) {
    if (security < h.minSecurity) warnings.push(`${h.name} (${h.role}) wants Security ≥ ${h.minSecurity}.`);
  }
  return { security, warnings };
}
