import type { GsrLevelId } from '../levels/loader';

export type ArchipelagoTransitType =
  | 'ley-line-rail'
  | 'pink-gondola'
  | 'updraft-chute'
  | 'subsoil-lift'
  | 'zenith-beam';

export type ArchipelagoSilhouette =
  | 'vinyl'
  | 'bongo'
  | 'kiln'
  | 'birdbath'
  | 'arcade'
  | 'mall'
  | 'citadel'
  | 'subsoil'
  | 'zenith';

export interface ArchipelagoLink {
  id: string;
  targetId: GsrLevelId;
  label: string;
  transitType: ArchipelagoTransitType;
  direction: 'north' | 'south' | 'east' | 'west';
  gatePos: [number, number, number];
  gateYaw: number;
  vistaBearing: number;
  vistaElevationOffset: number;
  color: string;
}

export interface ArchipelagoNode {
  id: GsrLevelId;
  areaNumber: number;
  name: string;
  frequency: string;
  elevationM: number;
  mapX: number;
  mapY: number;
  color: string;
  silhouette: ArchipelagoSilhouette;
  links: readonly ArchipelagoLink[];
}

export const ARCHIPELAGO_NODES: Record<GsrLevelId, ArchipelagoNode> = {
  'velvet-keys': {
    id: 'velvet-keys',
    areaNumber: 1,
    name: 'Velvet Keys Plaza',
    frequency: '88.5 FM',
    elevationM: 120,
    mapX: 50,
    mapY: 90,
    color: '#ff4ecd',
    silhouette: 'vinyl',
    links: [
      {
        id: 'vk-to-bb',
        targetId: 'bongo-basin',
        label: 'Area 2: Bongo Basin (91.3 FM)',
        transitType: 'ley-line-rail',
        direction: 'north',
        gatePos: [-24, 0, -60],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.55,
        vistaElevationOffset: 10,
        color: '#ff9100',
      },
      {
        id: 'vk-to-nb-express',
        targetId: 'neon-birdbath',
        label: 'Pink Gondola Express → Area 4: Neon Birdbath',
        transitType: 'pink-gondola',
        direction: 'west',
        gatePos: [-58, 0, 14],
        gateYaw: Math.PI * 0.5,
        vistaBearing: Math.PI,
        vistaElevationOffset: 24,
        color: '#00e5ff',
      },
    ],
  },
  'bongo-basin': {
    id: 'bongo-basin',
    areaNumber: 2,
    name: 'Bongo Basin Overpass',
    frequency: '91.3 FM',
    elevationM: 165,
    mapX: 34,
    mapY: 79,
    color: '#ff9100',
    silhouette: 'bongo',
    links: [
      {
        id: 'bb-to-vk',
        targetId: 'velvet-keys',
        label: 'Area 1: Velvet Keys (88.5 FM)',
        transitType: 'ley-line-rail',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -10,
        color: '#ff4ecd',
      },
      {
        id: 'bb-to-ck',
        targetId: 'chrome-kiln',
        label: 'Area 3: Chrome Kiln (94.7 FM)',
        transitType: 'ley-line-rail',
        direction: 'north',
        gatePos: [-24, 0, -62],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 12,
        color: '#76ff03',
      },
      {
        id: 'bb-to-sr-express',
        targetId: 'subsoil-relay',
        label: '108.0 Subsoil Lift → Area 8: Subsoil Relay',
        transitType: 'subsoil-lift',
        direction: 'east',
        gatePos: [58, 0, 14],
        gateYaw: -Math.PI * 0.5,
        vistaBearing: 0,
        vistaElevationOffset: 30,
        color: '#7c4dff',
      },
    ],
  },
  'chrome-kiln': {
    id: 'chrome-kiln',
    areaNumber: 3,
    name: 'Chrome Kiln Foundry',
    frequency: '94.7 FM',
    elevationM: 215,
    mapX: 66,
    mapY: 68,
    color: '#76ff03',
    silhouette: 'kiln',
    links: [
      {
        id: 'ck-to-bb',
        targetId: 'bongo-basin',
        label: 'Area 2: Bongo Basin (91.3 FM)',
        transitType: 'ley-line-rail',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -10,
        color: '#ff9100',
      },
      {
        id: 'ck-to-nb',
        targetId: 'neon-birdbath',
        label: 'Area 4: Neon Birdbath (98.9 FM)',
        transitType: 'updraft-chute',
        direction: 'north',
        gatePos: [-24, 0, -62],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 12,
        color: '#00e5ff',
      },
    ],
  },
  'neon-birdbath': {
    id: 'neon-birdbath',
    areaNumber: 4,
    name: 'Neon Birdbath Spire',
    frequency: '98.9 FM',
    elevationM: 270,
    mapX: 34,
    mapY: 57,
    color: '#00e5ff',
    silhouette: 'birdbath',
    links: [
      {
        id: 'nb-to-ck',
        targetId: 'chrome-kiln',
        label: 'Area 3: Chrome Kiln (94.7 FM)',
        transitType: 'updraft-chute',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -10,
        color: '#76ff03',
      },
      {
        id: 'nb-to-ma',
        targetId: 'mulch-alley',
        label: 'Area 5: Mulch Alley (101.5 FM)',
        transitType: 'ley-line-rail',
        direction: 'north',
        gatePos: [-24, 0, -64],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 14,
        color: '#ff5252',
      },
      {
        id: 'nb-to-vk-express',
        targetId: 'velvet-keys',
        label: 'Pink Gondola Express → Area 1: Velvet Keys',
        transitType: 'pink-gondola',
        direction: 'east',
        gatePos: [60, 0, 14],
        gateYaw: -Math.PI * 0.5,
        vistaBearing: 0,
        vistaElevationOffset: -16,
        color: '#ff4ecd',
      },
    ],
  },
  'mulch-alley': {
    id: 'mulch-alley',
    areaNumber: 5,
    name: 'Mulch Alley Arcade',
    frequency: '101.5 FM',
    elevationM: 330,
    mapX: 66,
    mapY: 46,
    color: '#ff5252',
    silhouette: 'arcade',
    links: [
      {
        id: 'ma-to-nb',
        targetId: 'neon-birdbath',
        label: 'Area 4: Neon Birdbath (98.9 FM)',
        transitType: 'ley-line-rail',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -12,
        color: '#00e5ff',
      },
      {
        id: 'ma-to-tm',
        targetId: 'tupperware-mall',
        label: 'Area 6: Tupperware Sky-Mall (103.9 FM)',
        transitType: 'ley-line-rail',
        direction: 'north',
        gatePos: [-24, 0, -64],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 14,
        color: '#4dd0e1',
      },
    ],
  },
  'tupperware-mall': {
    id: 'tupperware-mall',
    areaNumber: 6,
    name: 'Tupperware Sky-Mall',
    frequency: '103.9 FM',
    elevationM: 395,
    mapX: 34,
    mapY: 35,
    color: '#4dd0e1',
    silhouette: 'mall',
    links: [
      {
        id: 'tm-to-ma',
        targetId: 'mulch-alley',
        label: 'Area 5: Mulch Alley (101.5 FM)',
        transitType: 'ley-line-rail',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -12,
        color: '#ff5252',
      },
      {
        id: 'tm-to-hc',
        targetId: 'hoa-citadel',
        label: 'Area 7: HOA Citadel (105.7 FM)',
        transitType: 'updraft-chute',
        direction: 'north',
        gatePos: [-24, 0, -64],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 14,
        color: '#ffd740',
      },
    ],
  },
  'hoa-citadel': {
    id: 'hoa-citadel',
    areaNumber: 7,
    name: 'HOA Citadel Terrace',
    frequency: '105.7 FM',
    elevationM: 460,
    mapX: 66,
    mapY: 24,
    color: '#ffd740',
    silhouette: 'citadel',
    links: [
      {
        id: 'hc-to-tm',
        targetId: 'tupperware-mall',
        label: 'Area 6: Tupperware Sky-Mall (103.9 FM)',
        transitType: 'updraft-chute',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -12,
        color: '#4dd0e1',
      },
      {
        id: 'hc-to-sr',
        targetId: 'subsoil-relay',
        label: 'Area 8: Subsoil Relay Tower (108.0 FM)',
        transitType: 'subsoil-lift',
        direction: 'north',
        gatePos: [-24, 0, -64],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 16,
        color: '#7c4dff',
      },
    ],
  },
  'subsoil-relay': {
    id: 'subsoil-relay',
    areaNumber: 8,
    name: 'Subsoil Relay Tower',
    frequency: '108.0 FM',
    elevationM: 530,
    mapX: 50,
    mapY: 14,
    color: '#7c4dff',
    silhouette: 'subsoil',
    links: [
      {
        id: 'sr-to-hc',
        targetId: 'hoa-citadel',
        label: 'Area 7: HOA Citadel (105.7 FM)',
        transitType: 'subsoil-lift',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -14,
        color: '#ffd740',
      },
      {
        id: 'sr-to-zh',
        targetId: 'zero-hz-zenith',
        label: 'Area 9: Zero-Hz Zenith (0.0 Hz)',
        transitType: 'zenith-beam',
        direction: 'north',
        gatePos: [-24, 0, -64],
        gateYaw: 0,
        vistaBearing: -Math.PI * 0.5,
        vistaElevationOffset: 24,
        color: '#ffffff',
      },
      {
        id: 'sr-to-bb-express',
        targetId: 'bongo-basin',
        label: '108.0 Subsoil Lift → Area 2: Bongo Basin',
        transitType: 'subsoil-lift',
        direction: 'west',
        gatePos: [-60, 0, 14],
        gateYaw: Math.PI * 0.5,
        vistaBearing: Math.PI,
        vistaElevationOffset: -22,
        color: '#ff9100',
      },
    ],
  },
  'zero-hz-zenith': {
    id: 'zero-hz-zenith',
    areaNumber: 9,
    name: 'Zero-Hz Zenith',
    frequency: '0.0 Hz',
    elevationM: 650,
    mapX: 50,
    mapY: 4,
    color: '#ffffff',
    silhouette: 'zenith',
    links: [
      {
        id: 'zh-to-sr',
        targetId: 'subsoil-relay',
        label: 'Area 8: Subsoil Relay Tower (108.0 FM)',
        transitType: 'zenith-beam',
        direction: 'south',
        gatePos: [24, 0, 56],
        gateYaw: Math.PI,
        vistaBearing: Math.PI * 0.5,
        vistaElevationOffset: -20,
        color: '#7c4dff',
      },
    ],
  },
};

export function getArchipelagoNode(id: GsrLevelId): ArchipelagoNode {
  return ARCHIPELAGO_NODES[id];
}

export function getConnectedNeighbors(id: GsrLevelId): ArchipelagoNode[] {
  return ARCHIPELAGO_NODES[id].links.map((l) => ARCHIPELAGO_NODES[l.targetId]);
}
