// Dev tool, skipped unless MAPDUMP is set: writes a top-down PNG of the whole world (hill-shaded height, water, roads,
// region borders, flat sites, building colliders) for planning terrain and landscaping.
//   MAPDUMP=out.png [MAPDUMP_MPP=3] [MAPDUMP_BOXES=1] npx vitest run src/terrainMap.probe.test.ts   (from games/gnome-theft-auto)
// North (-z) is up, west (-x) is left. One pixel is MAPDUMP_MPP metres (default 3). Height bands every 5 m are darker.
import { it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';

const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
// Node modules loaded untyped: the game's tsconfig has no node types (the browser build never sees this file).
type Buf = Uint8Array & { writeUInt32BE(v: number, o: number): void; write(s: string, o: number, enc: string): void; subarray(a: number, b?: number): Buf; copy(t: Uint8Array, o: number): void };
type BufCtor = { alloc(n: number): Buf; from(a: ArrayLike<number>): Buf; concat(l: Uint8Array[]): Buf };
const NODE = { zlib: 'node:zlib', fs: 'node:fs', buffer: 'node:buffer' };

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function png(Buffer: BufCtor, deflateSync: (b: Uint8Array) => Uint8Array, w: number, h: number, rgb: Uint8Array): Buf {
  const chunk = (type: string, data: Uint8Array): Buf => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    Buffer.from(data).copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    Buffer.from(rgb.subarray(y * w * 3, (y + 1) * w * 3)).copy(raw, y * (w * 3 + 1) + 1);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())]);
}

it.skipIf(!env.MAPDUMP)('map dump', async () => {
  installFakeDom();
  const { heightAt, waterAt } = await import('./terrain');
  const { highways, REGIONS, REGION_IDS, markersOf, markerNum } = await import('./levels');
  const { WORLD_HALF, CITY_HALF } = await import('./config');
  const mpp = Number(env.MAPDUMP_MPP ?? 3);
  const W = Math.round((2 * WORLD_HALF) / mpp);
  const rgb = new Uint8Array(W * W * 3);
  const put = (px: number, py: number, r: number, g: number, b: number): void => {
    if (px < 0 || py < 0 || px >= W || py >= W) return;
    const o = (py * W + px) * 3;
    rgb[o] = r; rgb[o + 1] = g; rgb[o + 2] = b;
  };
  const toPx = (x: number, z: number): [number, number] => [Math.round((x + WORLD_HALF) / mpp), Math.round((z + WORLD_HALF) / mpp)];
  let lo = Infinity, hi = -Infinity;
  for (let py = 0; py < W; py++) {
    for (let px = 0; px < W; px++) {
      const x = -WORLD_HALF + (px + 0.5) * mpp, z = -WORLD_HALF + (py + 0.5) * mpp;
      const h = heightAt(x, z);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
      const w = waterAt(x, z);
      if (w) { const d = Math.min(1, w.depth / 4); put(px, py, 40, 90 + 60 * (1 - d), 200 - 60 * d); continue; }
      const sx = heightAt(x + mpp, z) - heightAt(x - mpp, z), sz = heightAt(x, z + mpp) - heightAt(x, z - mpp);
      const shade = Math.max(0.35, Math.min(1.3, 0.85 - (sx + sz) * 0.6 / mpp));
      const t = Math.max(0, Math.min(1, (h + 6) / 40));
      let r = 90 + 150 * t, g = 150 + 60 * t - 120 * t * t, b = 70 + 120 * t * t;
      if (Math.floor(h / 5) !== Math.floor(heightAt(x + mpp, z) / 5) || Math.floor(h / 5) !== Math.floor(heightAt(x, z + mpp) / 5)) { r *= 0.6; g *= 0.6; b *= 0.6; }
      put(px, py, Math.min(255, r * shade), Math.min(255, g * shade), Math.min(255, b * shade));
    }
  }
  const line = (ax: number, az: number, bx: number, bz: number, c: [number, number, number]): void => {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (mpp / 2));
    for (let k = 0; k <= n; k++) { const [px, py] = toPx(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n); put(px, py, ...c); }
  };
  for (const id of REGION_IDS) {
    const b = REGIONS[id].border;
    for (let k = 0; k < b.length; k++) line(b[k][0], b[k][1], b[(k + 1) % b.length][0], b[(k + 1) % b.length][1], [255, 255, 255]);
  }
  for (const hw of highways()) for (let k = 0; k + 1 < hw.points.length; k++) line(hw.points[k][0], hw.points[k][1], hw.points[k + 1][0], hw.points[k + 1][1], [20, 20, 20]);
  const rect = (x0: number, z0: number, x1: number, z1: number, c: [number, number, number]): void => {
    line(x0, z0, x1, z0, c); line(x1, z0, x1, z1, c); line(x1, z1, x0, z1, c); line(x0, z1, x0, z0, c);
  };
  rect(-CITY_HALF, -CITY_HALF, CITY_HALF, CITY_HALF, [120, 120, 120]);
  for (const m of markersOf('reserve')) rect(m.x - markerNum(m, 'hw'), m.z - markerNum(m, 'hd'), m.x + markerNum(m, 'hw'), m.z + markerNum(m, 'hd'), [220, 30, 30]);
  if (env.MAPDUMP_BOXES) {
    const { buildWorld } = await import('./world');
    const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
    for (const b of world.boxes) rect(b.minX, b.minZ, b.maxX, b.maxZ, [255, 0, 255]);
  }
  const { deflateSync } = (await import(/* @vite-ignore */ NODE.zlib)) as { deflateSync(b: Uint8Array): Uint8Array };
  const { writeFileSync } = (await import(/* @vite-ignore */ NODE.fs)) as { writeFileSync(p: string, d: Uint8Array): void };
  const { Buffer } = (await import(/* @vite-ignore */ NODE.buffer)) as { Buffer: BufCtor };
  writeFileSync(env.MAPDUMP!, png(Buffer, deflateSync, W, W, rgb));
  console.log(`map ${W}x${W} px, ${mpp} m/px, height ${lo.toFixed(1)}..${hi.toFixed(1)} m`);
});
