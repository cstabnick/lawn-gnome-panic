// 26 unique Mossgrave landmark buildings/structures built from @lawn/prefabs with interactive survival roles.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { STAMINA } from '../config';
import type { BodySystem, InventorySystem, NeedsSystem, PlayerState } from '../game/types';
import type { Interact } from '../game/interact';
import type { RegionDef, RegionId, WorldState } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';
import type { Collider } from '../world/collide';
import { getDiscoveredNotes, LORE_NOTES } from '../sim/loreNotes';

export type LandmarkRole = 'shelter' | 'water' | 'workshop' | 'apothecary' | 'radio' | 'ration' | 'monument';

export interface LandmarkDef {
  id: string;
  prefabId: string;
  name: string;
  region: RegionId;
  offset: [number, number];
  rotY: number;
  role: LandmarkRole;
  blurb: string;
}

export const WORLD_LANDMARKS: readonly LandmarkDef[] = [
  { id: 'lm-greenhouse-ruin', prefabId: 'dayg-greenhouse-ruin', name: 'Shattered Glasshouse', region: 'forecourt', offset: [-26, -18], rotY: 0.2, role: 'apothecary', blurb: 'Medicinal sage & feverfew still sprout under broken panes.' },
  { id: 'lm-watch-bunker', prefabId: 'dayg-watch-bunker', name: 'Sandbagged Watch Bunker', region: 'forecourt', offset: [24, -14], rotY: -0.4, role: 'shelter', blurb: 'Thick limestone cellar cap guarding the Forecourt lane.' },
  { id: 'lm-tinker-garage', prefabId: 'dayg-tinker-garage', name: "Tinker's Axle Bay", region: 'forecourt', offset: [-22, 20], rotY: 0.1, role: 'workshop', blurb: 'Jack-blocks, oil tins, and spare belts for franken-builds.' },

  { id: 'lm-quarantine-booth', prefabId: 'dayg-quarantine-booth', name: 'Chalk-Marked Sentry Booth', region: 'verge-path', offset: [-24, 2], rotY: 0.0, role: 'apothecary', blurb: 'Verge-entry inspection box stocked with coarse salt.' },
  { id: 'lm-gate-archway', prefabId: 'dayg-gate-archway', name: 'Iron Lychgate Arch', region: 'verge-path', offset: [22, -4], rotY: 0.0, role: 'monument', blurb: 'Twin piers marked with Verge trader chalk-sigils.' },

  { id: 'lm-radio-shack', prefabId: 'dayg-radio-shack', name: 'Root-Wire Radio Shack', region: 'gate-roof', offset: [16, -2], rotY: -0.2, role: 'radio', blurb: 'Copper coils spliced into the perimeter railings.' },

  { id: 'lm-tool-shack', prefabId: 'dayg-tool-shack', name: 'Timber Tool Shack', region: 'bin-corner', offset: [-16, -18], rotY: 0.35, role: 'workshop', blurb: 'Shelf Wright outpost with a bolted sharpening vice.' },
  { id: 'lm-compost-silo', prefabId: 'dayg-compost-silo', name: 'Slatted Compost Silo', region: 'bin-corner', offset: [18, 16], rotY: -0.3, role: 'workshop', blurb: 'Warm grass-clipping bin yielding salvaged nails & slats.' },

  { id: 'lm-survivor-lean-to', prefabId: 'dayg-survivor-lean-to', name: 'Salvage Lean-To', region: 'ivy-rows', offset: [-18, -14], rotY: 0.5, role: 'shelter', blurb: 'Corrugated-tin shelter built during the Scatter.' },
  { id: 'lm-rain-cistern', prefabId: 'dayg-rain-cistern', name: 'Copper-Hoop Rain Cistern', region: 'ivy-rows', offset: [16, 18], rotY: -0.2, role: 'water', blurb: 'Charcoal-filtered catchment vat for mid-patrol refills.' },

  { id: 'lm-columbarium-alcove', prefabId: 'dayg-columbarium-alcove', name: 'Urn-Wall Alcove', region: 'leaning-rows', offset: [-22, 16], rotY: 0.0, role: 'shelter', blurb: 'Cedar sleeping shelf wedged above Hatless reach.' },
  { id: 'lm-funeral-pavilion', prefabId: 'dayg-funeral-pavilion', name: 'Slate Canopy Pavilion', region: 'leaning-rows', offset: [20, -18], rotY: 0.15, role: 'shelter', blurb: 'Waxed canvas windbreaks keep a fire dry in storms.' },

  { id: 'lm-water-tower', prefabId: 'dayg-water-tower', name: 'Stilted Cistern Tower', region: 'the-sinks', offset: [-16, -16], rotY: 0.2, role: 'water', blurb: 'Elevated oak water tank clear of sinkhole silt.' },
  { id: 'lm-covered-bridge', prefabId: 'dayg-covered-bridge', name: 'Plank Footbridge', region: 'the-sinks', offset: [14, 14], rotY: 0.78, role: 'shelter', blurb: 'High-planked cedar span blocking damp Sinks fog.' },
  { id: 'lm-bone-ossuary', prefabId: 'dayg-bone-ossuary', name: 'Chalk-Stone Ossuary', region: 'the-sinks', offset: [-18, 16], rotY: 0.0, role: 'monument', blurb: 'Vaulted memorial where fallen hats rest in roll call.' },

  { id: 'lm-bell-belfry', prefabId: 'dayg-bell-belfry', name: 'Little Bell Belfry', region: 'angel-square', offset: [-16, 14], rotY: 0.0, role: 'monument', blurb: 'Lashed silent after Bell Night; used as a scout cairn.' },
  { id: 'lm-garden-gazebo', prefabId: 'dayg-garden-gazebo', name: 'Octagon Garden Gazebo', region: 'angel-square', offset: [16, -14], rotY: 0.4, role: 'monument', blurb: 'Neutral parley ring where rival factions trade acorns.' },
  { id: 'lm-barricaded-chapel', prefabId: 'dayg-barricaded-chapel', name: 'Boarded Side-Chapel', region: 'angel-square', offset: [0, 18], rotY: 3.14, role: 'ration', blurb: 'Side-oratory holding an emergency tin biscuit locker.' },

  { id: 'lm-caretaker-cottage', prefabId: 'dayg-caretaker-cottage', name: "Caretaker's Tool Cottage", region: 'masons-corner', offset: [-12, -12], rotY: 0.25, role: 'shelter', blurb: 'Dry hearth bricks and barred cedar shutters.' },
  { id: 'lm-kiln-oven', prefabId: 'dayg-kiln-oven', name: 'Clay-Patch Kiln', region: 'masons-corner', offset: [12, 12], rotY: -0.35, role: 'workshop', blurb: 'Brick firing dome for mending chipped tools & glaze.' },

  { id: 'lm-mausoleum-crypt', prefabId: 'dayg-mausoleum-crypt', name: 'Moss-Capped Crypt', region: 'child-graves', offset: [-18, 12], rotY: 0.1, role: 'monument', blurb: 'Granite vault where Visitation petals appear at dawn.' },
  { id: 'lm-clock-obelisk', prefabId: 'dayg-clock-obelisk', name: 'Sundial Clock Obelisk', region: 'child-graves', offset: [18, -12], rotY: 0.0, role: 'monument', blurb: 'Limestone gnomon etched with survivors’ birthdays.' },

  { id: 'lm-signal-pylon', prefabId: 'dayg-signal-pylon', name: 'Lantern Signal Pylon', region: 'yew-edge', offset: [-16, -10], rotY: 0.0, role: 'radio', blurb: 'Brass-mirrored beacon scanning districts for signals.' },
  { id: 'lm-apothecary-stall', prefabId: 'dayg-apothecary-stall', name: 'Moss-Herb Apothecary Stall', region: 'yew-edge', offset: [18, 12], rotY: -0.25, role: 'apothecary', blurb: 'Dried yarrow, salt pouches, and boiled glaze-salve.' },

  { id: 'lm-stone-wellhouse', prefabId: 'dayg-stone-wellhouse', name: 'Roofed Stone Wellhouse', region: 'the-tap', offset: [-18, -28], rotY: 0.0, role: 'water', blurb: 'Deep limestone well guarded under the Truce of the Tap.' },
  { id: 'lm-soup-kitchen-tent', prefabId: 'dayg-soup-kitchen-tent', name: 'Hearth-Canvas Broth Tent', region: 'the-tap', offset: [18, 28], rotY: -0.3, role: 'ration', blurb: 'Simmering nettle-and-acorn broth over an iron brazier.' },
];

const STORAGE_KEY = 'dayg_landmarks_v1';

export function getVisitedLandmarks(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markVisited(id: string): boolean {
  const list = getVisitedLandmarks();
  if (list.includes(id)) return false;
  list.push(id);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
  return true;
}

function roleActionLabel(role: LandmarkRole): string {
  switch (role) {
    case 'shelter': return 'Rest & warm up';
    case 'water': return 'Draw clean water';
    case 'workshop': return 'Repair held gear & salvage';
    case 'apothecary': return 'Gather moss remedy';
    case 'radio': return 'Scan long-range signals';
    case 'ration': return 'Scavenge field ration';
    case 'monument': return 'Inspect landmark';
  }
}

function roleColor(role: LandmarkRole): string {
  switch (role) {
    case 'shelter': return '#e8c35a';
    case 'water': return '#64c8f0';
    case 'workshop': return '#d99a5b';
    case 'apothecary': return '#7bd389';
    case 'radio': return '#c28fff';
    case 'ration': return '#f08a6c';
    case 'monument': return '#d5dccb';
  }
}

export interface WorldLandmarks {
  getMarkers(): { x: number; z: number; label: string; color: string }[];
  visitedCount(): number;
  totalCount(): number;
}

export function createWorldLandmarks(deps: {
  scene: THREE.Scene;
  regions: readonly RegionDef[];
  collider: Collider;
  interact: Interact;
  inv: InventorySystem;
  needs: NeedsSystem;
  body: BodySystem;
  world: WorldState;
  getPlayer: () => PlayerState;
  onToast: (t: string) => void;
}): WorldLandmarks {
  const { scene, regions, collider, interact, inv, needs, body, world, getPlayer, onToast } = deps;
  const root = new THREE.Group();
  root.name = 'dayg-landmarks';
  scene.add(root);

  const placed: { def: LandmarkDef; x: number; z: number }[] = [];
  const dailyUsed = new Set<string>();

  for (const lm of WORLD_LANDMARKS) {
    const reg = regions.find((r) => r.id === lm.region);
    if (!reg) continue;
    const rawX = (reg.rect.x0 + reg.rect.x1) / 2 + lm.offset[0];
    const rawZ = (reg.rect.z0 + reg.rect.z1) / 2 + lm.offset[1];
    const x = Math.min(reg.rect.x1 - 5, Math.max(reg.rect.x0 + 5, rawX));
    const z = Math.min(reg.rect.z1 - 5, Math.max(reg.rect.z0 + 5, rawZ));
    if (!collider.inBounds(x, z)) continue;
    const y = collider.groundAt(x, z, 6);
    if (y > 22) continue;

    let obj: THREE.Object3D;
    try {
      obj = buildPrefab(lm.prefabId);
    } catch {
      continue;
    }
    obj.position.set(x, y, z);
    obj.rotation.y = lm.rotY;
    root.add(obj);

    if (lm.role === 'shelter' || lm.role === 'radio' || lm.role === 'ration') {
      const lamp = new THREE.PointLight(0xffb86c, 0.75, 11, 2);
      lamp.position.set(x, y + 2.2, z);
      root.add(lamp);
    }

    placed.push({ def: lm, x, z });

    const ix = x + Math.sin(lm.rotY) * 2.6;
    const iz = z + Math.cos(lm.rotY) * 2.6;
    const iy = collider.groundAt(ix, iz, 6);

    interact.add({
      id: `landmark:${lm.id}`,
      x: ix,
      y: iy,
      z: iz,
      radius: 3.0,
      label: () => `${lm.name}: ${roleActionLabel(lm.role)}`,
      act: () => {
        const firstVisit = markVisited(lm.id);
        const rec = world.players[LOCAL_PLAYER];
        if (firstVisit && rec) {
          rec.acorns += 10;
          onToast(`🏛️ Discovered ${lm.name}! (+10 acorns)`);
        }

        const p = getPlayer();
        const dayKey = `${lm.id}:${Math.floor(world.tick / Math.max(1, world.tuning.clock.ticksPerDay))}`;

        switch (lm.role) {
          case 'shelter':
            needs.state.warmth = Math.min(100, needs.state.warmth + 22);
            needs.state.calm = Math.min(100, needs.state.calm + 18);
            p.stamina = Math.min(STAMINA.max, p.stamina + 60);
            onToast(`🏠 ${lm.name}: Warmed up & steadied nerves (+warmth, +calm).`);
            break;
          case 'water':
            needs.state.water = Math.min(100, needs.state.water + 40);
            needs.state.calm = Math.min(100, needs.state.calm + 10);
            onToast(`💧 ${lm.name}: Drank cool clean water (+40 water).`);
            break;
          case 'workshop': {
            const held = inv.held();
            if (held && held.condition < 1) {
              held.condition = 1;
              onToast(`🔧 ${lm.name}: Tuned your held gear back to 100%!`);
            } else if (!dailyUsed.has(dayKey)) {
              dailyUsed.add(dayKey);
              inv.add({ def: 'nails', count: 3, condition: 1 });
              inv.add({ def: 'plank', count: 1, condition: 1 });
              onToast(`🪵 ${lm.name}: Salvaged 1 plank & 3 nails.`);
            } else {
              onToast(`🔧 ${lm.name}: ${lm.blurb}`);
            }
            break;
          }
          case 'apothecary':
            if (body.state.infection && body.state.infection.stage > 0) {
              body.state.infection.stage = Math.max(0, body.state.infection.stage - 1) as 0 | 1 | 2 | 3;
              onToast(`🌿 ${lm.name}: Applied yarrow poultice — moss infection eased!`);
            } else if (!dailyUsed.has(dayKey)) {
              dailyUsed.add(dayKey);
              inv.add({ def: 'salt-pinch', count: 1, condition: 1 });
              onToast(`🌿 ${lm.name}: Packed a fresh salt poultice.`);
            } else {
              onToast(`🌿 ${lm.name}: ${lm.blurb}`);
            }
            break;
          case 'radio': {
            const found = new Set(getDiscoveredNotes());
            const missing = LORE_NOTES.filter((n) => !found.has(n.id));
            needs.state.calm = Math.min(100, needs.state.calm + 10);
            if (missing.length > 0) {
              const target = missing[0];
              const targetReg = regions.find((r) => r.id === target.region);
              onToast(`📻 Signal Sweep: Unread note "${target.title}" near ${targetReg?.name ?? target.region}.`);
            } else {
              onToast(`📻 ${lm.name}: All Mossgrave lore signals accounted for!`);
            }
            break;
          }
          case 'ration':
            if (!dailyUsed.has(dayKey)) {
              dailyUsed.add(dayKey);
              needs.state.food = Math.min(100, needs.state.food + 25);
              if (rec) rec.acorns += 8;
              onToast(`🍲 ${lm.name}: Hot ration & +8 acorns!`);
            } else {
              onToast(`🍲 ${lm.name}: Next ration batch simmers tomorrow.`);
            }
            break;
          case 'monument':
            needs.state.calm = Math.min(100, needs.state.calm + 12);
            if (!firstVisit) onToast(`🪨 ${lm.name}: ${lm.blurb}`);
            break;
        }
      },
    });
  }

  return {
    getMarkers() {
      return placed.map((m) => ({
        x: m.x,
        z: m.z,
        label: m.def.name,
        color: roleColor(m.def.role),
      }));
    },
    visitedCount: () => getVisitedLandmarks().length,
    totalCount: () => WORLD_LANDMARKS.length,
  };
}
