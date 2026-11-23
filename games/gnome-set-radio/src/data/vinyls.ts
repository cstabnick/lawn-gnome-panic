import type { GsrLevelId } from '../levels/loader';

export interface GoldenVinylDef {
  id: string;
  levelId: GsrLevelId;
  label: string;
  x: number;
  y: number;
  z: number;
}

export const GOLDEN_VINYLS: readonly GoldenVinylDef[] = [
  // Area 1: Velvet Keys
  { id: 'gv-vk-1', levelId: 'velvet-keys', label: 'Dorian Bootleg 45', x: -34, y: 6.2, z: -20 },
  { id: 'gv-vk-2', levelId: 'velvet-keys', label: 'Amphitheater Brass LP', x: 36, y: 5.8, z: -22 },
  { id: 'gv-vk-3', levelId: 'velvet-keys', label: 'Maestro Penthouse Gold', x: 0, y: 8.0, z: -12 },
  // Area 2: Bongo Basin
  { id: 'gv-bb-1', levelId: 'bongo-basin', label: 'Big Acorn Chili Press', x: 32, y: 4.5, z: 10 },
  { id: 'gv-bb-2', levelId: 'bongo-basin', label: 'Conga Silo Dubplate', x: 34, y: 8.5, z: -18 },
  { id: 'gv-bb-3', levelId: 'bongo-basin', label: 'Cloverleaf Crown 12"', x: -8, y: 13.0, z: -42 },
  // Area 3: Chrome Kiln
  { id: 'gv-ck-1', levelId: 'chrome-kiln', label: 'Blast-Smelter Acid LP', x: -30, y: 6.0, z: 8 },
  { id: 'gv-ck-2', levelId: 'chrome-kiln', label: 'Kiln Chimney Master', x: -30, y: 10.0, z: -24 },
  { id: 'gv-ck-3', levelId: 'chrome-kiln', label: 'Crucible Crown Pressing', x: 0, y: 14.0, z: -44 },
  // Area 4: Neon Birdbath
  { id: 'gv-nb-1', levelId: 'neon-birdbath', label: 'Mist-Spa Liquid 45', x: 36, y: 9.5, z: -18 },
  { id: 'gv-nb-2', levelId: 'neon-birdbath', label: 'Observatory Midnight LP', x: -32, y: 12.0, z: -22 },
  { id: 'gv-nb-3', levelId: 'neon-birdbath', label: 'Birdbath Apex Gold', x: 0, y: 17.5, z: -40 },
  // Area 5: Mulch Alley
  { id: 'gv-ma-1', levelId: 'mulch-alley', label: 'Token Shark Chiptune 45', x: 26, y: 7.0, z: 22 },
  { id: 'gv-ma-2', levelId: 'mulch-alley', label: 'Don Compost Vault LP', x: -28, y: 9.0, z: -16 },
  { id: 'gv-ma-3', levelId: 'mulch-alley', label: 'Marquee High-Score Gold', x: 0, y: 15.0, z: -42 },
  // Area 6: Tupperware Sky-Mall
  { id: 'gv-tm-1', levelId: 'tupperware-mall', label: 'Food-Court Vapor 45', x: -28, y: 5.0, z: 22 },
  { id: 'gv-tm-2', levelId: 'tupperware-mall', label: 'Clearance Mezzanine LP', x: -30, y: 9.5, z: -18 },
  { id: 'gv-tm-3', levelId: 'tupperware-mall', label: 'Checkout Spire Gold', x: 0, y: 14.0, z: -42 },
  // Area 7: HOA Citadel
  { id: 'gv-hc-1', levelId: 'hoa-citadel', label: 'Section 12-B Bootleg', x: 28, y: 6.5, z: 22 },
  { id: 'gv-hc-2', levelId: 'hoa-citadel', label: 'Gazebo Tribunal LP', x: 28, y: 10.5, z: -18 },
  { id: 'gv-hc-3', levelId: 'hoa-citadel', label: 'Vance Megaphone Gold', x: 0, y: 15.5, z: -42 },
  // Area 8: Subsoil Relay
  { id: 'gv-sr-1', levelId: 'subsoil-relay', label: 'Cassette Archive 108.0', x: 28, y: 7.5, z: 22 },
  { id: 'gv-sr-2', levelId: 'subsoil-relay', label: 'Scaffolding Ring Dub', x: 28, y: 12.0, z: -18 },
  { id: 'gv-sr-3', levelId: 'subsoil-relay', label: 'Tuning-Fork Apex Gold', x: 0, y: 17.0, z: -42 },
  // Area 9: Zero-Hz Zenith
  { id: 'gv-zh-1', levelId: 'zero-hz-zenith', label: 'Dead-Wax Pressing', x: -28, y: 5.8, z: 22 },
  { id: 'gv-zh-2', levelId: 'zero-hz-zenith', label: 'Four-Track Master LP', x: 28, y: 13.5, z: -18 },
  { id: 'gv-zh-3', levelId: 'zero-hz-zenith', label: 'Original Needle Encore', x: 0, y: 19.0, z: -42 },
];

export function getVinylsForLevel(levelId: GsrLevelId): GoldenVinylDef[] {
  return GOLDEN_VINYLS.filter((v) => v.levelId === levelId);
}
