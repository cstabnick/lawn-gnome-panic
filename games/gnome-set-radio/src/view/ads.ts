import * as THREE from 'three';
import type { GsrLevelDoc } from '../levels/schema';

export interface GsrBrandAd {
  id: string;
  name: string;
  tagline: string;
  finePrint: string;
  bg: string;
  accent: string;
  ink: string;
  emblem: 'can' | 'flower' | 'spray' | 'flame' | 'cart' | 'blade' | 'radio' | 'skate' | 'shield' | 'crown';
}

// Pulls iconic Turfton brands from Gnome Theft Auto alongside Broadcast Archipelago originals.
export const GSR_BRAND_ADS: readonly GsrBrandAd[] = [
  {
    id: 'acorn-cola',
    name: 'ACORN-COLA',
    tagline: 'CRACK A SMILE (NOT YOUR HAT)',
    finePrint: 'Official sponsor of Hat Watch & Velvet Keys Plaza.',
    bg: '#b71c1c',
    accent: '#ffd740',
    ink: '#ffffff',
    emblem: 'can',
  },
  {
    id: 'dandelion-fizz',
    name: 'DANDELION FIZZ',
    tagline: '110% POLLEN & BAD DECISIONS',
    finePrint: 'Official fuel of Midnight Aether-Ramp Jumps!',
    bg: '#f7e61c',
    accent: '#245c1b',
    ink: '#120624',
    emblem: 'flower',
  },
  {
    id: 'pay-n-glaze',
    name: "PAY 'N' GLAZE",
    tagline: 'NEW COAT. WHO DIS?',
    finePrint: 'Fresh neon glaze in 5s. Skates & boards welcome.',
    bg: '#ff3b9a',
    accent: '#00e5ff',
    ink: '#120624',
    emblem: 'spray',
  },
  {
    id: 'black-dew',
    name: 'BLACK DEW 87',
    tagline: '100% UNLICENSED OCTANE',
    finePrint: 'Keep away from Chrome Kiln sparks & open flames.',
    bg: '#1c1824',
    accent: '#ff9100',
    ink: '#ffffff',
    emblem: 'flame',
  },
  {
    id: 'clay-mart',
    name: 'CLAY-MART',
    tagline: 'GIANT UPSIDE-DOWN TUPPERWARE',
    finePrint: 'Discount garden hats, flamingos & inline wheels!',
    bg: '#1565c0',
    accent: '#fdd835',
    ink: '#ffffff',
    emblem: 'cart',
  },
  {
    id: 'razor-back',
    name: 'RAZOR-BACK',
    tagline: 'ZERO TURNING RADIUS. ZERO REGRETS.',
    finePrint: 'Still turning since Tuesday. Faster than Buck-Iron.',
    bg: '#f05a24',
    accent: '#1e1e22',
    ink: '#ffffff',
    emblem: 'blade',
  },
  {
    id: 'kiln-shield',
    name: 'KILN-SHIELD',
    tagline: 'CHIPS, CRACKS & ACTS OF MOWER',
    finePrint: 'Excludes porcelain & anything involving Pip Potsworth.',
    bg: '#00695c',
    accent: '#69f0ae',
    ink: '#ffffff',
    emblem: 'shield',
  },
  {
    id: 'turfton-fm',
    name: 'TURFTON FM 108.0',
    tagline: 'PIRATE SIGNAL FROM THE SUBSOIL',
    finePrint: 'Hosted by DJ Broadcast & DJ Moleman — 24/7.',
    bg: '#260b47',
    accent: '#00e5ff',
    ink: '#ffffff',
    emblem: 'radio',
  },
  {
    id: 'ley-line-skates',
    name: 'LEY-LINE BLADES',
    tagline: 'CARVE FASTER THAN GRAVITY',
    finePrint: 'Ceramic bearings rated for 4-deck overpass drops.',
    bg: '#0e1d4a',
    accent: '#ff4ecd',
    ink: '#ffffff',
    emblem: 'skate',
  },
  {
    id: 'chirp-crumb',
    name: 'CHIRP & CRUMB',
    tagline: 'BAKED AT 4AM. HARD AS BRICK.',
    finePrint: '100% birdseed crust. Great for patching kiln walls.',
    bg: '#4a1b33',
    accent: '#fff3e0',
    ink: '#ffffff',
    emblem: 'crown',
  },
  // District-specific signature brands (Areas 1–9)
  {
    id: 'velvet-espresso',
    name: 'ESPRESSO-DEW',
    tagline: 'DORIAN ROAST · OPEN TIL 3AM',
    finePrint: 'Velvet Keys Plaza Conservatory Courtyard — Skaters Drink Half-Off.',
    bg: '#2b124d',
    accent: '#ff4ecd',
    ink: '#ffffff',
    emblem: 'crown',
  },
  {
    id: 'big-acorn-chili',
    name: 'BIG ACORN DINER',
    tagline: 'HOTTEST CHILI ON THE S-CURVE',
    finePrint: 'Bongo Basin Overpass Exit 2 — No Wet Clay in Booths.',
    bg: '#5c1f08',
    accent: '#ff9100',
    ink: '#ffffff',
    emblem: 'flame',
  },
  {
    id: 'union-404-glaze',
    name: 'LOCAL 404 GLAZE',
    tagline: '900° NEON BOOT FINISH',
    finePrint: 'Chrome Kiln Foundry Union — Days Since Spill: 0.',
    bg: '#162418',
    accent: '#76ff03',
    ink: '#ffffff',
    emblem: 'spray',
  },
  {
    id: 'birdbath-gondolas',
    name: 'SKY-GONDOLA CO.',
    tagline: 'HONEYMOONS ABOVE THE CLOUDS',
    finePrint: 'Neon Birdbath Spire — Ask About Midnight Mist Tours.',
    bg: '#0c234d',
    accent: '#00e5ff',
    ink: '#ffffff',
    emblem: 'skate',
  },
  {
    id: 'mulch-club-vip',
    name: 'MULCH CLUB',
    tagline: '2 TOKENS PER GRIND',
    finePrint: 'Mulch Alley Arcade — Bootleg Cassettes & Chiptune Sets.',
    bg: '#240b18',
    accent: '#ff5252',
    ink: '#ffffff',
    emblem: 'radio',
  },
  {
    id: 'clay-mart-clearance',
    name: '40% OFF ATRIUM',
    tagline: 'EVERYTHING UNDER THE LID',
    finePrint: 'Tupperware Sky-Mall — No Hanger-Grinding in Aisle 4.',
    bg: '#142847',
    accent: '#4dd0e1',
    ink: '#ffffff',
    emblem: 'cart',
  },
  {
    id: 'hoa-bylaw-12b',
    name: 'BYLAW SEC. 12-B',
    tagline: 'EGGSHELL SWATCH #04 ONLY',
    finePrint: 'HOA Citadel Terrace — Neon Skate Wax Strictly Prohibited.',
    bg: '#1b3b24',
    accent: '#ffd740',
    ink: '#ffffff',
    emblem: 'shield',
  },
  {
    id: 'moleman-108',
    name: 'SUBSOIL 108.0',
    tagline: 'DEEPEST DUB IN TURFTON',
    finePrint: 'Subsoil Relay Tower — Streaming 3 Yards Below the Turf.',
    bg: '#160b2e',
    accent: '#7c4dff',
    ink: '#ffffff',
    emblem: 'radio',
  },
  {
    id: 'zero-hz-pressing',
    name: 'UNFIRED PRESS',
    tagline: 'ALL 8 BANDS IN ONE GROOVE',
    finePrint: 'Zero-Hz Zenith — Bring Color Back to the Dead Wax.',
    bg: '#181822',
    accent: '#ffd740',
    ink: '#ffffff',
    emblem: 'crown',
  },
];

const DISTRICT_BRAND_BY_AREA: Record<number, string> = {
  1: 'velvet-espresso',
  2: 'big-acorn-chili',
  3: 'union-404-glaze',
  4: 'birdbath-gondolas',
  5: 'mulch-club-vip',
  6: 'clay-mart-clearance',
  7: 'hoa-bylaw-12b',
  8: 'moleman-108',
  9: 'zero-hz-pressing',
};

const adTexCache = new Map<string, THREE.CanvasTexture>();

function drawAdEmblem(g: CanvasRenderingContext2D, emblem: GsrBrandAd['emblem'], accent: string, ink: string): void {
  g.save();
  g.translate(82, 128);
  g.fillStyle = accent;
  g.strokeStyle = ink;
  g.lineWidth = 4;

  switch (emblem) {
    case 'can':
    case 'spray':
      g.beginPath();
      g.roundRect(-24, -42, 48, 84, 10);
      g.fill();
      g.stroke();
      g.fillStyle = ink;
      g.fillRect(-10, -54, 20, 12);
      break;
    case 'flower':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.beginPath();
        g.arc(Math.cos(a) * 28, Math.sin(a) * 28, 14, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(0, 0, 16, 0, Math.PI * 2);
      g.fillStyle = ink;
      g.fill();
      break;
    case 'flame':
      g.beginPath();
      g.moveTo(0, -52);
      g.quadraticCurveTo(44, -6, 24, 42);
      g.lineTo(-24, 42);
      g.quadraticCurveTo(-44, -6, 0, -52);
      g.fill();
      g.stroke();
      break;
    case 'radio':
      g.beginPath();
      g.arc(0, 8, 12, 0, Math.PI * 2);
      g.fill();
      for (const r of [24, 38, 52]) {
        g.beginPath();
        g.arc(0, 8, r, -Math.PI * 0.8, -Math.PI * 0.2);
        g.stroke();
      }
      break;
    case 'skate':
      g.beginPath();
      g.roundRect(-34, -20, 68, 28, 8);
      g.fill();
      g.stroke();
      for (const wx of [-22, -7, 8, 23]) {
        g.beginPath();
        g.arc(wx, 22, 9, 0, Math.PI * 2);
        g.fillStyle = ink;
        g.fill();
      }
      break;
    default:
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = i % 2 === 0 ? 44 : 22;
        if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      g.stroke();
      break;
  }
  g.restore();
}

export function getBrandAdTexture(brandId?: string, fallbackIdx = 0): THREE.CanvasTexture {
  const brand =
    GSR_BRAND_ADS.find((b) => b.id === brandId) ??
    GSR_BRAND_ADS[Math.abs(fallbackIdx) % GSR_BRAND_ADS.length]!;
  const existing = adTexCache.get(brand.id);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;

  g.fillStyle = brand.bg;
  g.fillRect(0, 0, 512, 256);

  // Diagonal pop-art speed stripes
  g.save();
  g.fillStyle = brand.accent;
  g.globalAlpha = 0.22;
  for (let x = -80; x < 560; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 28, 0);
    g.lineTo(x - 24, 256);
    g.lineTo(x - 52, 256);
    g.closePath();
    g.fill();
  }
  g.restore();

  // Cel-shaded outer frame
  g.strokeStyle = brand.accent;
  g.lineWidth = 10;
  g.strokeRect(8, 8, 496, 240);

  drawAdEmblem(g, brand.emblem, brand.accent, brand.ink);

  // Brand headline
  g.textAlign = 'left';
  g.font = '900 40px "Arial Black", Impact, sans-serif';
  g.fillStyle = '#120624';
  g.fillText(brand.name, 152, 86);
  g.fillStyle = brand.accent;
  g.fillText(brand.name, 148, 82);

  // Slogan banner
  g.fillStyle = brand.ink;
  g.font = '800 21px "Arial Black", Impact, sans-serif';
  g.fillText(brand.tagline, 150, 134, 340);

  // Fine print pill
  g.fillStyle = 'rgba(18, 6, 36, 0.72)';
  g.beginPath();
  g.roundRect(148, 164, 340, 48, 10);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = '700 15px system-ui, sans-serif';
  g.fillText(brand.finePrint, 162, 193, 314);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  adTexCache.set(brand.id, tex);
  return tex;
}

export interface PerimeterAdSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  w: number;
  h: number;
}

export function getPerimeterAdSpecs(doc: GsrLevelDoc): PerimeterAdSpec[] {
  const halfW = doc.bounds.w * 0.5 - 5.5;
  const halfD = doc.bounds.d * 0.5 - 5.5;
  const placements: { x: number; z: number; yaw: number }[] = [
    { x: -halfW * 0.55, z: -halfD, yaw: 0 },
    { x: halfW * 0.55, z: -halfD, yaw: 0 },
    { x: -halfW * 0.55, z: halfD, yaw: Math.PI },
    { x: halfW * 0.55, z: halfD, yaw: Math.PI },
    { x: -halfW, z: -halfD * 0.45, yaw: Math.PI / 2 },
    { x: -halfW, z: halfD * 0.45, yaw: Math.PI / 2 },
    { x: halfW, z: -halfD * 0.45, yaw: -Math.PI / 2 },
    { x: halfW, z: halfD * 0.45, yaw: -Math.PI / 2 },
  ];
  return placements.map((p, idx) => ({
    id: `perim-ad-${idx}`,
    x: p.x,
    y: 3.1,
    z: p.z,
    yaw: p.yaw,
    w: 7.4,
    h: 3.8,
  }));
}

export function buildPerimeterAds(
  doc: GsrLevelDoc,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(x: T) => T,
): void {
  const areaOffset = doc.data.areaNumber * 3;
  const spots = getPerimeterAdSpecs(doc);

  const frameMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', roughness: 0.5 }));
  const grindBarMat = track(
    new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 0.9,
      roughness: 0.25,
    }),
  );
  const postGeo = track(new THREE.CylinderGeometry(0.14, 0.16, 2.2, 8));
  const frameGeo = track(new THREE.BoxGeometry(7.4, 3.8, 0.24));
  const panelGeo = track(new THREE.BoxGeometry(7.0, 3.4, 0.34));
  const grindBarGeo = track(new THREE.BoxGeometry(7.6, 0.14, 0.2));

  const districtBrand = DISTRICT_BRAND_BY_AREA[doc.data.areaNumber];
  spots.forEach((sp, idx) => {
    const tex = getBrandAdTexture(idx % 3 === 0 ? districtBrand : undefined, areaOffset + idx);
    const panelMat = track(
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.28,
        roughness: 0.4,
      }),
    );
    const holder = new THREE.Group();
    holder.position.set(sp.x, sp.y, sp.z);
    holder.rotation.y = sp.yaw;

    const frame = new THREE.Mesh(frameGeo, frameMat);
    holder.add(frame);

    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.userData.sprayable = true;
    holder.add(panel);

    const grindBar = new THREE.Mesh(grindBarGeo, grindBarMat);
    grindBar.position.set(0, 2.06, 0);
    holder.add(grindBar);

    for (const lx of [-2.4, 2.4]) {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(lx, -2.1, 0);
      holder.add(post);
    }
    group.add(holder);
  });
}
