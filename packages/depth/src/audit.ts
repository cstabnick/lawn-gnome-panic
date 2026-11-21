// Finds z-fighting: pairs of visible faces that lie in (nearly) the same plane, overlap, face the same way and
// are not kept apart by polygon offset, then works out from the camera's near/far planes how far away the
// flicker starts. Used by tools/zfight.mjs (headless, any three.js game) and callable from a game or a test.
//
// IMPORTANT: auditCoplanar must stay self-contained (no imports, no helpers outside its body, duck-typed
// three.js objects): tools/zfight.mjs sends its source text into the page with puppeteer.

export interface AuditOptions {
  /** Camera near / far planes (m). Default 0.1 / 1000. */
  near?: number;
  far?: number;
  /** Where things stop being visible, if nearer than `far` (fog end, m). Flicker beyond it is not reported. */
  visibleTo?: number;
  /** Vertical field of view (degrees) and viewport height (px), to judge whether a flicker is big enough to see. */
  fovDeg?: number;
  viewportHeight?: number;
  /** Depth buffer bits. Default 24 (WebGL's usual). */
  depthBits?: number;
  /** Report only flicker at least this many pixels across where it starts. Default 4. */
  minPixels?: number;
  /** Faces further apart than this (m) are not compared. Default 0.05. */
  maxGap?: number;
  /** Report pairs whose two materials have the same colour and texture (they look the same either way). Default false. */
  includeSameLook?: boolean;
}

export interface CoplanarFinding {
  /** Path of names to each mesh (`name < parent < ...`), plus its colour as hex. */
  a: string;
  b: string;
  /** A point on each overlapping triangle (world space, m). */
  atA: [number, number, number];
  atB: [number, number, number];
  /** Face normal (world space). */
  normal: [number, number, number];
  /** Distance between the two planes (m). */
  gap: number;
  /** Polygon-offset separation in depth steps; positive helps the face in front, negative fights it. */
  offsetSteps: number;
  /** Distance from the camera (m) beyond which the two flicker. 0: at every distance. */
  fightsBeyond: number;
  /** 'flicker': the two swap per pixel. 'buried': past fightsBeyond the face behind wins outright (an offset
   * pushes it through the one in front). */
  kind: 'flicker' | 'buried';
  /** Size of the overlap (m, the smaller triangle's extent) and its size on screen where flicker starts (px). */
  size: number;
  pixels: number;
  /** Overlapping triangle pairs found for these two meshes. */
  triangles: number;
}

export interface AuditResult {
  triangles: number;
  findings: CoplanarFinding[];
}

/**
 * Scans every visible mesh under `root` for coplanar overlaps that will z-fight within the camera's far plane.
 * Meshes with `userData.zfightOk = true` are skipped (for overlaps that are hidden on purpose).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function auditCoplanar(root: any, options: AuditOptions = {}): AuditResult {
  const near = options.near ?? 0.1;
  const far = options.far ?? 1000;
  const bits = options.depthBits ?? 24;
  const fov = ((options.fovDeg ?? 60) * Math.PI) / 180;
  const focalPx = (options.viewportHeight ?? 800) / 2 / Math.tan(fov / 2);
  const minPixels = options.minPixels ?? 4;
  const maxGap = options.maxGap ?? 0.05;
  const includeSameLook = options.includeSameLook ?? false;
  const CELL = 6;
  const MIN_AREA = 1e-4;
  const DIR_Q = 40;
  const visibleTo = Math.min(far, options.visibleTo ?? far);
  // One depth step at distance z is z^2 * stepK (m).
  const stepK = (far - near) / (far * near * 2 ** bits);

  type V3 = [number, number, number];
  interface Tri { owner: number; mesh: any; look: string; label: string; n: V3; d: number; p: V3[]; ext: number; off: number; seeThrough: boolean; q?: [number, number][] }

  const lookOf = (m: any): string => (m.color ? m.color.getHexString() : '') + '|' + (m.map ? m.map.uuid : '');
  const labelOf = (o: any, m: any): string => {
    const parts: string[] = [];
    for (let c = o; c && parts.length < 4; c = c.parent) parts.push(c.name || c.type);
    return parts.join(' < ') + (m.color ? ' #' + m.color.getHexString() : '');
  };
  const apply = (e: ArrayLike<number>, x: number, y: number, z: number): V3 => [
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14],
  ];
  const mul = (a: ArrayLike<number>, b: ArrayLike<number>): number[] => {
    const o = new Array<number>(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  };

  // ---- collect triangles -----------------------------------------------------------------------------------------
  const tris: Tri[] = [];
  let owner = 0;
  root.updateMatrixWorld(true);
  root.traverse((o: any) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    for (let c = o; c; c = c.parent) if (c.visible === false || c.userData?.zfightOk) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!mat || mat.visible === false || mat.depthTest === false || mat.colorWrite === false) return;
    const pos = o.geometry.attributes.position;
    const idx = o.geometry.index;
    const count = idx ? idx.count : pos.count;
    const copies = o.isInstancedMesh ? o.count : 1;
    const off = mat.polygonOffset ? mat.polygonOffsetUnits || 0 : 0;
    const doubleSide = mat.side === 2;
    const look = lookOf(mat);
    const label = labelOf(o, mat);
    const seeThrough = !!mat.transparent && mat.depthWrite === false;
    for (let k = 0; k < copies; k++) {
      const m = o.isInstancedMesh ? mul(o.matrixWorld.elements, o.instanceMatrix.array.slice(k * 16, k * 16 + 16)) : o.matrixWorld.elements;
      const id = owner++;
      for (let t = 0; t + 2 < count; t += 3) {
        const p: V3[] = [];
        for (let v = 0; v < 3; v++) {
          const i = idx ? idx.getX(t + v) : t + v;
          p.push(apply(m, pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
        const w = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
        let n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        const len = Math.hypot(n[0], n[1], n[2]);
        if (len / 2 < MIN_AREA) continue;
        n = [n[0] / len, n[1] / len, n[2] / len];
        if (doubleSide && (n[1] < -0.5 || (Math.abs(n[1]) <= 0.5 && (n[0] < 0 || (n[0] === 0 && n[2] < 0))))) n = [-n[0], -n[1], -n[2]];
        else if (n[1] < -0.7) continue; // undersides: not seen from above
        let ext = 0;
        for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) ext = Math.max(ext, Math.hypot(p[a][0] - p[b][0], p[a][1] - p[b][1], p[a][2] - p[b][2]));
        tris.push({ owner: id, mesh: o, look, label, n, d: n[0] * p[0][0] + n[1] * p[0][1] + n[2] * p[0][2], p, ext, off, seeThrough });
      }
    }
  });

  // ---- bucket by plane, then by 2D cell inside the plane -----------------------------------------------------------
  const buckets = new Map<string, Tri[]>();
  for (const t of tris) {
    const key = t.n.map((c) => Math.round(c * DIR_Q)).join(',') + '|' + Math.round(t.d / maxGap);
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(t);
  }
  const overlap2d = (A: [number, number][], B: [number, number][]): boolean => {
    for (const P of [A, B]) for (let i = 0; i < 3; i++) {
      const a = P[i], b = P[(i + 1) % 3];
      const ax = a[1] - b[1], ay = b[0] - a[0];
      const tol = 1e-4 * Math.hypot(ax, ay);
      let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      for (const q of A) { const s = q[0] * ax + q[1] * ay; amin = Math.min(amin, s); amax = Math.max(amax, s); }
      for (const q of B) { const s = q[0] * ax + q[1] * ay; bmin = Math.min(bmin, s); bmax = Math.max(bmax, s); }
      if (amax <= bmin + tol || bmax <= amin + tol) return false;
    }
    return true;
  };

  const found = new Map<string, CoplanarFinding & { ownerA: number }>();
  for (const [key, own] of buckets) {
    const [dirKey, dKey] = key.split('|');
    const group = own.concat(buckets.get(dirKey + '|' + (Number(dKey) + 1)) ?? []);
    if (group.length < 2) continue;
    const n0 = group[0].n;
    const helper: V3 = Math.abs(n0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1: V3 = [helper[1] * n0[2] - helper[2] * n0[1], helper[2] * n0[0] - helper[0] * n0[2], helper[0] * n0[1] - helper[1] * n0[0]];
    const l1 = Math.hypot(e1[0], e1[1], e1[2]);
    e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
    const e2: V3 = [n0[1] * e1[2] - n0[2] * e1[1], n0[2] * e1[0] - n0[0] * e1[2], n0[0] * e1[1] - n0[1] * e1[0]];
    const grid = new Map<string, number[]>();
    group.forEach((t, gi) => {
      t.q = t.p.map((p) => [p[0] * e1[0] + p[1] * e1[1] + p[2] * e1[2], p[0] * e2[0] + p[1] * e2[1] + p[2] * e2[2]] as [number, number]);
      const xs = t.q.map((q) => q[0]), ys = t.q.map((q) => q[1]);
      for (let cx = Math.floor(Math.min(...xs) / CELL); cx <= Math.floor(Math.max(...xs) / CELL); cx++)
        for (let cy = Math.floor(Math.min(...ys) / CELL); cy <= Math.floor(Math.max(...ys) / CELL); cy++) {
          const k = cx + ',' + cy;
          let list = grid.get(k);
          if (!list) grid.set(k, (list = []));
          list.push(gi);
        }
    });
    const seen = new Set<number>();
    for (const list of grid.values()) {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const gi = Math.min(list[i], list[j]), gj = Math.max(list[i], list[j]);
        if (gi >= own.length) continue; // both from the neighbouring bucket: compared there
        const pairKey = gi * group.length + gj;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        const s = group[gi], t = group[gj];
        if (s.owner === t.owner) continue;
        if (s.mesh.material === t.mesh.material && s.mesh === t.mesh) continue;
        if (!includeSameLook && s.look === t.look) continue;
        if (s.seeThrough && t.seeThrough) continue;
        // Parallel within ~0.5 degrees, and close: each triangle's centre to the other's plane. (Plane constants
        // alone mislead: a slightly tilted plane far from the origin can share one with a level plane metres away.)
        if (s.n[0] * t.n[0] + s.n[1] * t.n[1] + s.n[2] * t.n[2] < 0.99996) continue;
        const cs = [0, 1, 2].map((k) => (s.p[0][k] + s.p[1][k] + s.p[2][k]) / 3);
        const ct = [0, 1, 2].map((k) => (t.p[0][k] + t.p[1][k] + t.p[2][k]) / 3);
        const tOverS = s.n[0] * ct[0] + s.n[1] * ct[1] + s.n[2] * ct[2] - s.d; // t's centre above s's plane
        const sOverT = t.n[0] * cs[0] + t.n[1] * cs[1] + t.n[2] * cs[2] - t.d;
        const gap = Math.max(Math.abs(tOverS), Math.abs(sOverT));
        if (gap > maxGap) continue;
        if (!overlap2d(s.q!, t.q!)) continue;
        // In front = further along the normal. Positive steps keep it in front; negative push the other one through.
        // Exactly coplanar: the front is whichever one the offset favours.
        const sFront = gap < 1e-6 ? s.off <= t.off : tOverS - sOverT < 0;
        const [front, back] = sFront ? [s, t] : [t, s];
        const offsetSteps = back.off - front.off;
        const need = 1 - offsetSteps; // depth steps of geometric gap still needed to resolve the pair
        if (need <= 0) continue;
        const fightsBeyond = gap === 0 ? 0 : Math.sqrt(gap / need / stepK);
        if (fightsBeyond >= visibleTo) continue;
        const size = Math.min(s.ext, t.ext);
        const pixels = (size * focalPx) / Math.max(fightsBeyond, near * 10);
        if (pixels < minPixels) continue;
        const [x, y] = s.owner < t.owner ? [s, t] : [t, s];
        const fk = x.owner + '/' + y.owner;
        const prev = found.get(fk);
        if (prev) {
          prev.triangles++;
          prev.fightsBeyond = Math.min(prev.fightsBeyond, fightsBeyond);
          prev.size = Math.max(prev.size, size);
          prev.pixels = Math.max(prev.pixels, pixels);
          continue;
        }
        const r3 = (v: V3): V3 => [Math.round(v[0] * 100) / 100, Math.round(v[1] * 100) / 100, Math.round(v[2] * 100) / 100];
        found.set(fk, {
          ownerA: x.owner, a: x.label, b: y.label, atA: r3(x.p[0]), atB: r3(y.p[0]), normal: r3(s.n),
          gap: Math.round(gap * 10000) / 10000, offsetSteps, fightsBeyond, kind: offsetSteps <= -1 ? 'buried' : 'flicker',
          size, pixels, triangles: 1,
        });
      }
    }
  }
  const findings = [...found.values()]
    .map(({ ownerA: _ownerA, ...f }) => ({ ...f, fightsBeyond: Math.round(f.fightsBeyond), size: Math.round(f.size * 100) / 100, pixels: Math.round(f.pixels) }))
    .sort((p, q) => p.fightsBeyond - q.fightsBeyond || q.pixels - p.pixels);
  return { triangles: tris.length, findings };
}
