import type { GsrLevelId } from '../levels/loader';

export type CompetitionKind = 'score-attack' | 'ring-sprint' | 'grind-time' | 'trick-blitz' | 'tag-rush';

export type CompetitionMedal = 'bronze' | 'silver' | 'gold';

export interface CompetitionDef {
  id: string;
  areaId: GsrLevelId;
  title: string;
  hostName: string;
  hostLine: string;
  durationS: number;
  kind: CompetitionKind;
  bronzeTarget: number;
  silverTarget: number;
  goldTarget: number;
  boothPos: [number, number, number];
  ringPositions?: [number, number, number][];
}

export const COMPETITIONS: Record<GsrLevelId, CompetitionDef> = {
  'velvet-keys': {
    id: 'encore-velvet-keys',
    areaId: 'velvet-keys',
    title: 'Conservatory Flow-Off',
    hostName: 'Pippi Pitchpipe',
    hostLine: 'The Syndicate is sleeping—string your cleanest plaza lines for 45 seconds and set a brass-bell record!',
    durationS: 45,
    kind: 'score-attack',
    bronzeTarget: 2000,
    silverTarget: 3800,
    goldTarget: 5500,
    boothPos: [14, 0, 32],
  },
  'bongo-basin': {
    id: 'encore-bongo-basin',
    areaId: 'bongo-basin',
    title: 'S-Curve Ring Sprint',
    hostName: 'Bam-Bam Bramble',
    hostLine: 'Eight sky-rings strung down the viaduct S-curve! Hit the kickers and thread them before the beat drops!',
    durationS: 45,
    kind: 'ring-sprint',
    bronzeTarget: 4,
    silverTarget: 6,
    goldTarget: 8,
    boothPos: [14, 0, 42],
    ringPositions: [
      [0, 2.2, 34],
      [-12, 3.0, 22],
      [-12, 5.4, 8],
      [20, 5.4, 10],
      [38, 5.0, 18],
      [36, 7.0, -2],
      [-32, 4.5, 26],
      [-42, 7.6, -18],
    ],
  },
  'chrome-kiln': {
    id: 'encore-chrome-kiln',
    areaId: 'chrome-kiln',
    title: 'Crucible Grind Marathon',
    hostName: 'Sooty Slagcap',
    hostLine: 'Stay off the floor! Rack up pure rail-grind and air seconds across the foundry gantries.',
    durationS: 45,
    kind: 'grind-time',
    bronzeTarget: 6,
    silverTarget: 11,
    goldTarget: 16,
    boothPos: [14, 0, 42],
  },
  'neon-birdbath': {
    id: 'encore-neon-birdbath',
    areaId: 'neon-birdbath',
    title: 'Spire Sky-Vault',
    hostName: 'Drizzle Dewdrop',
    hostLine: 'Eight mist-rings spiral from the lagoon pier up to the Spire Basin. Catch the updrafts and fly!',
    durationS: 45,
    kind: 'ring-sprint',
    bronzeTarget: 4,
    silverTarget: 6,
    goldTarget: 8,
    boothPos: [14, 0, 44],
    ringPositions: [
      [0, 4.6, 22],
      [-26, 4.8, 22],
      [0, 6.0, 20],
      [30, 7.0, 16],
      [33, 8.6, -1],
      [36, 10.0, -18],
      [-32, 12.4, -22],
      [0, 14.0, -40],
    ],
  },
  'mulch-alley': {
    id: 'encore-mulch-alley',
    areaId: 'mulch-alley',
    title: 'Quarter-Slot High-Score Blitz',
    hostName: 'Pixel Pip',
    hostLine: 'One credit, 45 seconds! Pop as many tricks and rail-transfers as you can before the cabinet eats your quarter.',
    durationS: 45,
    kind: 'trick-blitz',
    bronzeTarget: 6,
    silverTarget: 10,
    goldTarget: 14,
    boothPos: [12, 0, 46],
  },
  'tupperware-mall': {
    id: 'encore-tupperware-mall',
    areaId: 'tupperware-mall',
    title: 'Clearance Aisle Tag Rush',
    hostName: 'Coupon Cora',
    hostLine: 'Fresh markdowns! Spray as many billboards and crew tags as you can before closing chimes.',
    durationS: 45,
    kind: 'tag-rush',
    bronzeTarget: 3,
    silverTarget: 5,
    goldTarget: 7,
    boothPos: [12, 0, 46],
  },
  'hoa-citadel': {
    id: 'encore-hoa-citadel',
    areaId: 'hoa-citadel',
    title: 'Defiance Grind Circuit',
    hostName: 'Clipboard Clive',
    hostLine: 'The bylaws are shredded—run a 45-second victory lap and rack up pure style points across the citadel!',
    durationS: 45,
    kind: 'score-attack',
    bronzeTarget: 2500,
    silverTarget: 4500,
    goldTarget: 6500,
    boothPos: [14, 0, 44],
  },
  'subsoil-relay': {
    id: 'encore-subsoil-relay',
    areaId: 'subsoil-relay',
    title: '108.0 Frequency Relay',
    hostName: 'Sub-Bass Sable',
    hostLine: 'Eight frequency rings link the Bunker to the Tuning-Fork Base. Ride the vents and lock the signal!',
    durationS: 45,
    kind: 'ring-sprint',
    bronzeTarget: 4,
    silverTarget: 6,
    goldTarget: 8,
    boothPos: [14, 0, 44],
    ringPositions: [
      [0, 3.0, 40],
      [-28, 6.0, 22],
      [0, 7.2, 22],
      [28, 8.0, 22],
      [-14, 10.5, -10],
      [14, 11.5, -10],
      [0, 12.0, -18],
      [0, 13.8, -42],
    ],
  },
  'zero-hz-zenith': {
    id: 'encore-zero-hz-zenith',
    areaId: 'zero-hz-zenith',
    title: 'Grand Encore Freestyle',
    hostName: 'DJ Broadcast',
    hostLine: 'Sixty seconds on the open dial above the clouds! Give Turfton the loudest encore broadcast ever skated!',
    durationS: 60,
    kind: 'score-attack',
    bronzeTarget: 3500,
    silverTarget: 6000,
    goldTarget: 9000,
    boothPos: [14, 0, 44],
  },
};
