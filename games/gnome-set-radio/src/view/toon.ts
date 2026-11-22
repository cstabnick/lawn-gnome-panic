import * as THREE from 'three';

let cachedToonMap: THREE.DataTexture | null = null;
const groundTexCache = new Map<string, THREE.CanvasTexture>();
const facadeTexCache = new Map<string, THREE.CanvasTexture>();

export function getToonGradientMap(): THREE.DataTexture {
  if (cachedToonMap) return cachedToonMap;
  const data = new Uint8Array([68, 138, 205, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  cachedToonMap = tex;
  return tex;
}

export function getGroundTexture(baseColor: string, accentColor: string): THREE.CanvasTexture {
  const key = `${baseColor}:${accentColor}`;
  const existing = groundTexCache.get(key);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;

  g.fillStyle = baseColor;
  g.fillRect(0, 0, 512, 512);

  // Subtle concrete/halftone tile variation
  g.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; x += 64) {
      if (((x + y) / 64) % 2 === 0) {
        g.fillRect(x + 2, y + 2, 60, 60);
      }
    }
  }

  // Urban plaza grid seams
  g.strokeStyle = 'rgba(10, 4, 22, 0.28)';
  g.lineWidth = 3;
  for (let p = 0; p <= 512; p += 64) {
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, p);
    g.lineTo(512, p);
    g.stroke();
  }

  // Faint accent seam lines every 256px
  g.strokeStyle = accentColor;
  g.globalAlpha = 0.22;
  g.lineWidth = 2;
  g.strokeRect(1, 1, 510, 510);
  g.beginPath();
  g.moveTo(256, 0);
  g.lineTo(256, 512);
  g.moveTo(0, 256);
  g.lineTo(512, 256);
  g.stroke();
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  groundTexCache.set(key, tex);
  return tex;
}

export function getFacadeTexture(baseColor: string, accentColor: string): THREE.CanvasTexture {
  const key = `${baseColor}:${accentColor}`;
  const existing = facadeTexCache.get(key);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;

  g.fillStyle = baseColor;
  g.fillRect(0, 0, 256, 256);

  // Architectural panel seams
  g.strokeStyle = 'rgba(12, 6, 28, 0.45)';
  g.lineWidth = 4;
  for (let y = 0; y <= 256; y += 64) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(256, y);
    g.stroke();
  }
  for (let x = 0; x <= 256; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 256);
    g.stroke();
  }

  // Lit neon window strips
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const lit = (row + col) % 2 === 0;
      g.fillStyle = lit ? accentColor : 'rgba(14, 8, 28, 0.55)';
      g.globalAlpha = lit ? 0.65 : 1;
      g.fillRect(col * 64 + 14, row * 64 + 18, 36, 24);
    }
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  facadeTexCache.set(key, tex);
  return tex;
}
