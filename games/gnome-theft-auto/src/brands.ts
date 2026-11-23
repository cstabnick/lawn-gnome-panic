// Fictional Turfton brands, corporate rivalries, procedural 2D billboard textures, and roadside/rooftop placements.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';
import type { Box, VehicleKind } from './types';

export type BrandId =
  | 'buck-iron'
  | 'razor-back'
  | 'husky-blade'
  | 'black-dew'
  | 'stink-gro'
  | 'pure-loam'
  | 'acorn-cola'
  | 'dandelion-fizz'
  | 'chirp-and-crumb'
  | 'clay-mart'
  | 'thorne-lawn'
  | 'pay-n-glaze'
  | 'kiln-shield'
  | 'snail-mail'
  | 'pigeon-drop'
  | 'ammu-gnation';

export interface BrandDef {
  id: BrandId;
  name: string;
  primary: number;
  secondary: number;
  slogan: string;
  finePrint?: string;
  rival?: BrandId;
  vehicleKinds?: VehicleKind[];
}

export const BRANDS: Record<BrandId, BrandDef> = {
  'buck-iron': {
    id: 'buck-iron',
    name: 'Buck-Iron',
    primary: 0x2e7d32,
    secondary: 0xd4af37,
    slogan: 'Nothing Runs Like A Buck (Until You Take The Keys).',
    finePrint: 'Unlike Razor-Back: not an over-caffeinated blender on caster wheels.',
    rival: 'razor-back',
    vehicleKinds: ['ride-on', 'combine'],
  },
  'razor-back': {
    id: 'razor-back',
    name: 'Razor-Back',
    primary: 0xf05a24,
    secondary: 0x1e1e22,
    slogan: 'Zero Turning Radius. Zero Regrets.',
    finePrint: 'Still Turning Since Tuesday. (Buck-Iron Combine still stuck in neutral.)',
    rival: 'buck-iron',
    vehicleKinds: ['zero-turn'],
  },
  'husky-blade': {
    id: 'husky-blade',
    name: 'Husky-Blade',
    primary: 0x1f6feb,
    secondary: 0xc8d0d8,
    slogan: 'Loud Enough To Wake The Tall Ones.',
    finePrint: 'Illegal two-stroke exhaust kits sold separately at Side-Valve Salvage.',
    vehicleKinds: ['push-bike'],
  },
  'black-dew': {
    id: 'black-dew',
    name: 'Black Dew™',
    primary: 0xd98218,
    secondary: 0xdce2e8,
    slogan: '87 Octane. 100% Unlicensed.',
    finePrint: 'Refined from Compost Heap & Cloverfield Dew-Wells. Keep away from sparks.',
  },
  'stink-gro': {
    id: 'stink-gro',
    name: 'Stink-Gro',
    primary: 0x76e01c,
    secondary: 0x7b1fa2,
    slogan: "Grow Twice As Tall By Thursday. Don't Ask How.",
    finePrint: 'Why buy Pure-Loam? Expensive Mud For Gnomes With Beards.',
    rival: 'pure-loam',
  },
  'pure-loam': {
    id: 'pure-loam',
    name: 'Pure-Loam Co-op',
    primary: 0x6d4c2f,
    secondary: 0xc8b48a,
    slogan: 'No Chemicals. No Engines. Just Dirt.',
    finePrint: '100% Mossy Wood organic compost. Zero Stink-Gro runoff.',
    rival: 'stink-gro',
  },
  'acorn-cola': {
    id: 'acorn-cola',
    name: 'Acorn-Cola',
    primary: 0xc62828,
    secondary: 0xfafafa,
    slogan: 'Open A Cold One. Crack A Smile (Not Your Hat).',
    finePrint: 'Official sponsor of the Hat Watch softball team. Zero pollen.',
    rival: 'dandelion-fizz',
  },
  'dandelion-fizz': {
    id: 'dandelion-fizz',
    name: 'Dandelion Fizz',
    primary: 0xf7e61c,
    secondary: 0x245c1b,
    slogan: '110% Daily Value Of Pollen & Bad Decisions.',
    finePrint: 'Official fuel of Midnight Zero-Turn Races & Aether-Ramp Jumps.',
    rival: 'acorn-cola',
  },
  'chirp-and-crumb': {
    id: 'chirp-and-crumb',
    name: 'Chirp & Crumb',
    primary: 0xf48fb1,
    secondary: 0xfff3e0,
    slogan: 'Freshly Baked Since 4:00 AM. Hard Enough To Patch A Wall.',
    finePrint: '100% birdseed crust. No unauthorized food trucks.',
  },
  'clay-mart': {
    id: 'clay-mart',
    name: 'Clay-Mart',
    primary: 0x1565c0,
    secondary: 0xfdd835,
    slogan: 'Everything Under One Giant Upside-Down Tupperware.',
    finePrint: 'Discount garden hats, plastic flamingos & budget umbrellas.',
  },
  'thorne-lawn': {
    id: 'thorne-lawn',
    name: 'Thorne Lawn & Order LLC',
    primary: 0x18181c,
    secondary: 0xd4af37,
    slogan: 'Uniformity Is Peace. Peace Is Mandatory.',
    finePrint: 'Code Enforcement & HOA Compliance. Overgrown lawns fined on sight.',
  },
  'pay-n-glaze': {
    id: 'pay-n-glaze',
    name: "Pay 'n' Glaze",
    primary: 0xff3b9a,
    secondary: 0xe0e6ed,
    slogan: 'New Coat. Who Dis?',
    finePrint: 'Fresh glaze in 5 seconds. VINs filed off while you wait.',
  },
  'kiln-shield': {
    id: 'kiln-shield',
    name: 'Kiln-Shield Insurance',
    primary: 0x00897b,
    secondary: 0xf5fafa,
    slogan: "We Cover Chips, Cracks, And 'Acts Of Mower.'",
    finePrint: 'Excludes porcelain, Fort Sandpit, Crop Dusters & anything involving Pip Potsworth.',
  },
  'snail-mail': {
    id: 'snail-mail',
    name: 'Snail-Mail Express',
    primary: 0x2c5e7a,
    secondary: 0xf2e4c6,
    slogan: 'Eventually Is Still On Time.',
    finePrint: 'Unionized & proud. Unlike Pigeon-Drop, your mailbox survives.',
    rival: 'pigeon-drop',
  },
  'pigeon-drop': {
    id: 'pigeon-drop',
    name: 'Pigeon-Drop Couriers',
    primary: 0x607d8b,
    secondary: 0xff7043,
    slogan: 'Dropped From Altitude, Good Luck.',
    finePrint: 'Faster than Snail-Mail! Not liable for flattened Cloverfield mailboxes.',
    rival: 'snail-mail',
  },
  'ammu-gnation': {
    id: 'ammu-gnation',
    name: 'Ammu-Gnation',
    primary: 0x4b5d2a,
    secondary: 0xff7a1a,
    slogan: 'The Gun Is Free. The Shiny Bits Are Not.',
    finePrint: 'Fort Sandpit surplus, bolt-ons by the acorn. Not liable for kazoo-related embarrassment.',
  },
};

export interface BillboardSpot {
  id: string;
  brand: BrandId;
  x: number;
  z: number;
  y: number;
  yaw: number;
  scale: number;
  rooftop?: boolean;
}

const yawToward = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

/**
 * 16 placements across Turfton's four highways, the outer ring road, and downtown rooftops.
 * Buck-Iron vs. Razor-Back (south) and Stink-Gro vs. Pure-Loam (west) are placed in roadside pairs.
 */
export const BILLBOARD_SPOTS: readonly BillboardSpot[] = [
  // South highway pair: Buck-Iron vs. Razor-Back facing outbound & inbound Cloverfield traffic.
  { id: 'south-buck-iron', brand: 'buck-iron', x: 16, z: 235, y: 0, yaw: yawToward(16, 235, 0, 210), scale: 1 },
  { id: 'south-razor-back', brand: 'razor-back', x: -16, z: 255, y: 0, yaw: yawToward(-16, 255, 0, 230), scale: 1 },
  { id: 'south-kiln-shield', brand: 'kiln-shield', x: 52, z: 412, y: 0, yaw: yawToward(52, 412, 10, 390), scale: 1 },

  // West highway pair: Stink-Gro vs. Pure-Loam facing Mossy Wood traffic.
  { id: 'west-stink-gro', brand: 'stink-gro', x: -235, z: -36, y: 0, yaw: yawToward(-235, -36, -195, -5), scale: 1 },
  { id: 'west-pure-loam', brand: 'pure-loam', x: -260, z: 12, y: 0, yaw: yawToward(-260, 12, -220, -10), scale: 1 },
  { id: 'west-husky-blade', brand: 'husky-blade', x: -435, z: -35, y: 0, yaw: yawToward(-435, -35, -400, 0), scale: 1 },

  // East highway (Dust Flats).
  { id: 'east-black-dew', brand: 'black-dew', x: 232, z: 18, y: 0, yaw: yawToward(232, 18, 195, 0), scale: 1 },
  { id: 'east-pigeon-drop', brand: 'pigeon-drop', x: 485, z: 72, y: 0, yaw: yawToward(485, 72, 450, 70), scale: 1 },

  // North highway (Frostbite Fells).
  { id: 'north-dandelion-fizz', brand: 'dandelion-fizz', x: -18, z: -238, y: 0, yaw: yawToward(-18, -238, 0, -200), scale: 1 },
  { id: 'north-razor-back', brand: 'razor-back', x: 42, z: -372, y: 0, yaw: yawToward(42, -372, 20, -365), scale: 1 },

  // Ring road quadrants.
  { id: 'ring-ne-snail-mail', brand: 'snail-mail', x: 272, z: -165, y: 0, yaw: yawToward(272, -165, 315, -125), scale: 1 },
  { id: 'ring-nw-acorn-cola', brand: 'acorn-cola', x: -195, z: -372, y: 0, yaw: yawToward(-195, -372, -150, -380), scale: 1 },
  { id: 'ring-sw-chirp-and-crumb', brand: 'chirp-and-crumb', x: -268, z: 228, y: 0, yaw: yawToward(-268, 228, -280, 180), scale: 1 },
  { id: 'ring-se-clay-mart', brand: 'clay-mart', x: 242, z: 315, y: 0, yaw: yawToward(242, 315, 225, 365), scale: 1 },

  // Downtown rooftops.
  { id: 'downtown-thorne-lawn', brand: 'thorne-lawn', x: -90, z: -30, y: 48, yaw: yawToward(-90, -30, 0, 0), scale: 1.1, rooftop: true },
  { id: 'downtown-pay-n-glaze', brand: 'pay-n-glaze', x: 90, z: 90, y: 44, yaw: yawToward(90, 90, 0, 0), scale: 1.1, rooftop: true },
];

const hexCss = (n: number): string => `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;

function isLightColor(n: number): boolean {
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 155;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

function drawEmblem(ctx: CanvasRenderingContext2D, brand: BrandDef, cx: number, cy: number, r: number): void {
  const accent = hexCss(brand.secondary);
  const ink = isLightColor(brand.secondary) ? '#151518' : '#ffffff';
  ctx.save();
  ctx.translate(cx, cy);

  // Outer medallion backing.
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ink;
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  switch (brand.id) {
    case 'buck-iron': {
      // Antler / tractor gear silhouette.
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 0.65 : r * 0.4;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'razor-back':
    case 'husky-blade': {
      // Twin lightning / rotary slash chevrons.
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 0.35);
      ctx.lineTo(0, -r * 0.55);
      ctx.lineTo(r * 0.45, r * 0.35);
      ctx.lineTo(0, r * 0.05);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'black-dew': {
      // Fuel droplet.
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.62);
      ctx.quadraticCurveTo(r * 0.52, r * 0.05, 0, r * 0.58);
      ctx.quadraticCurveTo(-r * 0.52, r * 0.05, 0, -r * 0.62);
      ctx.fill();
      break;
    }
    case 'stink-gro':
    case 'pure-loam': {
      // Sprout leaf diamond.
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.58);
      ctx.lineTo(r * 0.46, 0);
      ctx.lineTo(0, r * 0.58);
      ctx.lineTo(-r * 0.46, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'acorn-cola':
    case 'dandelion-fizz': {
      // Fizzing triad of circles.
      ctx.beginPath();
      ctx.arc(-r * 0.2, r * 0.16, r * 0.24, 0, Math.PI * 2);
      ctx.arc(r * 0.24, r * 0.18, r * 0.18, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.26, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kiln-shield':
    case 'thorne-lawn': {
      // Shield crest.
      ctx.beginPath();
      ctx.moveTo(-r * 0.44, -r * 0.45);
      ctx.lineTo(r * 0.44, -r * 0.45);
      ctx.lineTo(r * 0.44, r * 0.06);
      ctx.lineTo(0, r * 0.58);
      ctx.lineTo(-r * 0.44, r * 0.06);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      // Bold storefront star / parcel emblem.
      ctx.fillRect(-r * 0.36, -r * 0.36, r * 0.72, r * 0.72);
      break;
    }
  }
  ctx.restore();
}

const textureCache = new Map<BrandId, THREE.CanvasTexture>();

/**
 * Generates (and caches per BrandId) a 512x256 procedural CanvasTexture for a highway billboard.
 * Guards Node/SSR environments where `document` is undefined.
 */
export function billboardTexture(brandId: BrandId): THREE.CanvasTexture {
  const cached = textureCache.get(brandId);
  if (cached) return cached;

  const brand = BRANDS[brandId];
  if (typeof document === 'undefined') {
    const stub = new THREE.CanvasTexture({ width: 512, height: 256 } as unknown as HTMLCanvasElement);
    textureCache.set(brandId, stub);
    return stub;
  }

  const W = 512;
  const H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  if (ctx) {
    const lightBg = isLightColor(brand.primary);
    const fg = lightBg ? '#151518' : '#ffffff';
    const subFg = lightBg ? '#27272e' : '#f1f3f5';

    // Brand field + diagonal secondary stripe.
    ctx.fillStyle = hexCss(brand.primary);
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = hexCss(brand.secondary);
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(W * 0.68, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(W * 0.52, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Outer billboard trim border.
    ctx.strokeStyle = hexCss(brand.secondary);
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);

    // Geometric emblem on the left.
    drawEmblem(ctx, brand, 74, 108, 46);

    // Bold header + accent bar.
    ctx.fillStyle = fg;
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(brand.name.toUpperCase(), 138, 28, W - 158);

    ctx.fillStyle = hexCss(brand.secondary);
    ctx.fillRect(138, 68, W - 162, 5);

    // Slogan.
    ctx.fillStyle = subFg;
    ctx.font = '700 20px system-ui, -apple-system, sans-serif';
    wrapText(ctx, `"${brand.slogan}"`, 138, 84, W - 160, 25, 3);

    // Bottom fine print / rivalry clap-back strip.
    const bottomText = brand.finePrint ?? (brand.rival ? `Better than ${BRANDS[brand.rival].name}.` : '');
    if (bottomText) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(10, H - 46, W - 20, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      wrapText(ctx, bottomText, 22, H - 41, W - 44, 15, 2);
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(brandId, tex);
  return tex;
}

function buildFallbackFrame(primary: number, sc: number): { frame: THREE.Group; panelW: number; panelH: number; panelY: number; panelZ: number; height: number } {
  const frame = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7, metalness: 0.4 });
  const backingMat = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.6 });

  const postGeo = new THREE.CylinderGeometry(0.24 * sc, 0.28 * sc, 5.2 * sc, 8);
  for (const px of [-3.2 * sc, 3.2 * sc]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(px, 2.6 * sc, -0.18 * sc);
    frame.add(post);
  }

  const panelW = 10 * sc;
  const panelH = 5 * sc;
  const panelY = 6.6 * sc;
  const backing = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.5 * sc, panelH + 0.5 * sc, 0.35 * sc), backingMat);
  backing.position.set(0, panelY, -0.12 * sc);
  frame.add(backing);

  return { frame, panelW, panelH, panelY, panelZ: 0.08 * sc, height: 9.35 * sc };
}

/**
 * Places all 16 billboards into the scene using `gta-billboard` when registered (or a clean double-post frame fallback)
 * plus a textured front plane, and appends static collider boxes for ground-level billboards.
 */
export function placeBillboards(scene: THREE.Scene, boxes: Box[]): void {
  const hasPrefab = Boolean(getPrefab('gta-billboard'));

  for (const spot of BILLBOARD_SPOTS) {
    const brand = BRANDS[spot.brand];
    const sc = spot.scale;
    const root = new THREE.Group();

    let panelW = 10 * sc;
    let panelH = 5 * sc;
    let panelY = 6.6 * sc;
    let panelZ = 0.08 * sc;
    let totalH = 9.35 * sc;

    if (hasPrefab) {
      const prefab = buildPrefab('gta-billboard', { lights: false, tint: brand.primary });
      const bb = new THREE.Box3().setFromObject(prefab);
      const rawW = Math.max(0.5, bb.max.x - bb.min.x);
      const rawH = Math.max(0.5, bb.max.y - bb.min.y);
      const s = (10 * sc) / rawW;
      prefab.scale.setScalar(s);
      prefab.position.y = -bb.min.y * s;
      root.add(prefab);

      panelW = 9.2 * sc;
      panelH = panelW * 0.5;
      totalH = rawH * s;
      panelY = Math.max(panelH * 0.55, totalH - panelH * 0.58);
      panelZ = bb.max.z * s + 0.04;
    } else {
      const built = buildFallbackFrame(brand.primary, sc);
      root.add(built.frame);
      panelW = built.panelW;
      panelH = built.panelH;
      panelY = built.panelY;
      panelZ = built.panelZ;
      totalH = built.height;
    }

    const faceMat = new THREE.MeshStandardMaterial({
      map: billboardTexture(spot.brand),
      roughness: 0.55,
      metalness: 0.05,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), faceMat);
    face.position.set(0, panelY, panelZ);
    root.add(face);

    // Roadside: spot.y is a lift above the ground. Rooftop: spot.y is already absolute (Turfton is flat).
    let y = spot.rooftop ? spot.y : heightAt(spot.x, spot.z) + spot.y;
    if (spot.rooftop) {
      for (const b of boxes) {
        if (spot.x >= b.minX - 1 && spot.x <= b.maxX + 1 && spot.z >= b.minZ - 1 && spot.z <= b.maxZ + 1) {
          y = Math.max(y, b.h + 1);
        }
      }
    }

    root.position.set(spot.x, y, spot.z);
    root.rotation.y = spot.yaw;
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(root);

    if (!spot.rooftop) {
      const hw = (panelW * 0.5) + 0.25;
      const hd = 0.65 * sc;
      const c = Math.abs(Math.cos(spot.yaw));
      const sn = Math.abs(Math.sin(spot.yaw));
      const ex = hw * c + hd * sn;
      const ez = hw * sn + hd * c;
      boxes.push({
        minX: spot.x - ex,
        maxX: spot.x + ex,
        minZ: spot.z - ez,
        maxZ: spot.z + ez,
        h: heightAt(spot.x, spot.z) + totalH,
      });
    }
  }
}

/** Maps a vehicle kind (and livery tint) to its canonical Turfton manufacturer brand. */
export function brandForVehicle(kind: VehicleKind, _tint: number): BrandDef {
  switch (kind) {
    case 'ride-on':
    case 'combine':
    case 'lowrider':
    case 'mulch-spreader':
      return BRANDS['buck-iron'];
    case 'zero-turn':
      return BRANDS['razor-back'];
    case 'push-bike':
      return BRANDS['husky-blade'];
    case 'snail-coach':
      return BRANDS['dandelion-fizz'];
    default:
      return BRANDS['thorne-lawn'];
  }
}

/** Returns a dry rivalry surcharge or honk line when two brands are sworn corporate rivals, else null. */
export function rivalryLine(a: BrandId, b: BrandId): string | null {
  const brandA = BRANDS[a];
  if (brandA.rival !== b) return null;
  if ((a === 'buck-iron' && b === 'razor-back') || (a === 'razor-back' && b === 'buck-iron')) {
    return `${brandA.name} mechanic: "20% Emotional Damage Surcharge for bringing ${BRANDS[b].name} in here."`;
  }
  return `${brandA.name} vs. ${BRANDS[b].name}: "No service without a loyalty waiver."`;
}
