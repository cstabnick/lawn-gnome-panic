import { DX, FLOOR_Y, GX, GY, GZ, NODE_COUNT, REST_DENSITY } from './config';

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// Shared by compute and render modules: constants, the Sim uniform and the analytic scene SDF.
export const COMMON = /* wgsl */ `
const DX: f32 = ${f(DX)};
const GX: u32 = ${GX}u;
const GY: u32 = ${GY}u;
const GZ: u32 = ${GZ}u;
const NODES: u32 = ${NODE_COUNT}u;
const FLOOR_Y: f32 = ${f(FLOOR_Y)};
const REST: f32 = ${f(REST_DENSITY)};
const SCALE: f32 = 65536.0;

struct Sim {
  dt: f32, gravity: f32, stiff: f32, visc: f32,
  count: u32, scene: u32, friction: f32, pad0: f32,
  cupPos: vec4f,   // xyz centre, w tilt (rad, positive pours toward +x)
  cupVel: vec4f,   // xyz velocity m/s, w angular velocity about z (rad/s)
  gate: vec4f,     // x raise (m), y raise speed (m/s)
}
@group(0) @binding(0) var<uniform> sim: Sim;

fn sdBox(p: vec3f, b: vec3f) -> f32 {
  let q = abs(p) - b;
  return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}
fn sdBoxAt(p: vec3f, c: vec3f, b: vec3f) -> f32 { return sdBox(p - c, b); }
// vertical capped cylinder, (radius, halfHeight) order
fn sdCyl(p: vec3f, r: f32, h: f32) -> f32 {
  let q = abs(vec2f(length(p.xz), p.y)) - vec2f(r, h);
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2f(0.0)));
}
// open-top cup: outer cylinder minus an inner one lifted by the floor thickness
fn hollowCyl(p: vec3f, r: f32, h: f32, t: f32) -> f32 {
  return max(sdCyl(p, r, h), -sdCyl(p - vec3f(0.0, t, 0.0), r - t, h));
}
fn hollowBox(p: vec3f, b: vec3f, t: f32) -> f32 {
  return max(sdBox(p, b), -sdBox(p - vec3f(0.0, t, 0.0), vec3f(b.x - t, b.y, b.z - t)));
}

fn cupLocal(p: vec3f) -> vec3f {
  let d = p - sim.cupPos.xyz;
  let c = cos(sim.cupPos.w);
  let s = sin(sim.cupPos.w);
  return vec3f(c * d.x - s * d.y, s * d.x + c * d.y, d.z);
}

fn channelWalls(p: vec3f) -> f32 {
  let a = sdBoxAt(p, vec3f(0.8, 0.5875, 0.45), vec3f(0.725, 0.5125, 0.05));
  let b = sdBoxAt(p, vec3f(0.8, 0.5875, 1.15), vec3f(0.725, 0.5125, 0.05));
  return min(a, b);
}

// x = signed distance to the nearest solid, y = 1.0 if that solid moves (cup / gate)
fn scene(p: vec3f) -> vec2f {
  var st = 1.0e5;
  var mv = 1.0e5;
  switch (sim.scene) {
    case 0u: {
      st = hollowCyl(p - vec3f(1.05, FLOOR_Y + 0.12, 0.8), 0.32, 0.12, 0.04);
      mv = hollowCyl(cupLocal(p), 0.22, 0.2, 0.04);
    }
    case 1u: {
      st = channelWalls(p);
      st = min(st, sdBoxAt(p, vec3f(0.125, 0.5875, 0.8), vec3f(0.05, 0.5125, 0.3)));
      st = min(st, sdBoxAt(p, vec3f(1.475, 0.5875, 0.8), vec3f(0.05, 0.5125, 0.3)));
      st = min(st, sdBoxAt(p, vec3f(0.3125, 0.2625, 0.8), vec3f(0.2375, 0.1875, 0.4)));
      st = min(st, sdBoxAt(p, vec3f(0.675, 0.2025, 0.8), vec3f(0.125, 0.1275, 0.4)));
      st = min(st, sdBoxAt(p, vec3f(0.925, 0.1425, 0.8), vec3f(0.125, 0.0675, 0.4)));
      mv = sdBoxAt(p, vec3f(0.525, 0.7 + sim.gate.x, 0.8), vec3f(0.0375, 0.25, 0.4));
    }
    case 2u: {
      let rr = length(p.xz - vec2f(0.8, 0.8));
      let ri = mix(0.06, 0.3, clamp((p.y - 0.62) / 0.38, 0.0, 1.0));
      let shell = (abs(rr - (ri + 0.02)) - 0.02) * 0.846;
      st = max(shell, abs(p.y - 0.75) - 0.25);
      let q = p - vec3f(0.8, 0.3, 0.8);
      st = min(st, max((abs(q.x) + abs(q.y)) * 0.7071 - 0.14, abs(q.z) - 0.3));
      st = min(st, hollowBox(p - vec3f(0.4, FLOOR_Y + 0.1, 0.8), vec3f(0.25, 0.1, 0.35), 0.04));
      st = min(st, hollowBox(p - vec3f(1.2, FLOOR_Y + 0.1, 0.8), vec3f(0.25, 0.1, 0.35), 0.04));
    }
    default: {
      st = channelWalls(p);
      st = min(st, sdBoxAt(p, vec3f(0.125, 0.5875, 0.8), vec3f(0.05, 0.5125, 0.3)));
      st = min(st, sdBoxAt(p, vec3f(1.475, 0.5875, 0.8), vec3f(0.05, 0.5125, 0.3)));
      st = min(st, sdCyl(p - vec3f(1.0, 0.2375, 0.8), 0.1, 0.1625));
      st = min(st, sdBoxAt(p, vec3f(1.3, 0.15, 0.8), vec3f(0.04, 0.075, 0.4)));
      mv = sdBoxAt(p, vec3f(0.5375, 0.475 + sim.gate.x, 0.8), vec3f(0.0375, 0.4, 0.4));
    }
  }
  if (mv < st) { return vec2f(mv, 1.0); }
  return vec2f(st, 0.0);
}

fn sceneD(p: vec3f) -> f32 { return scene(p).x; }

fn sceneGrad(p: vec3f) -> vec3f {
  let e = 0.004;
  let k1 = vec3f(1.0, -1.0, -1.0);
  let k2 = vec3f(-1.0, -1.0, 1.0);
  let k3 = vec3f(-1.0, 1.0, -1.0);
  let k4 = vec3f(1.0, 1.0, 1.0);
  return normalize(k1 * sceneD(p + k1 * e) + k2 * sceneD(p + k2 * e) + k3 * sceneD(p + k3 * e) + k4 * sceneD(p + k4 * e));
}

// velocity (m/s) of the moving solid at world point p
fn wallVel(p: vec3f) -> vec3f {
  if (sim.scene == 0u) {
    let d = p - sim.cupPos.xyz;
    let w = sim.cupVel.w;
    return sim.cupVel.xyz + vec3f(-w * d.y, w * d.x, 0.0);
  }
  if (sim.scene == 1u || sim.scene == 3u) { return vec3f(0.0, sim.gate.y, 0.0); }
  return vec3f(0.0);
}
`;

export const SIM_WGSL = /* wgsl */ `
${COMMON}

struct Particle { pos: vec4f, vel: vec4f, c0: vec4f, c1: vec4f, c2: vec4f }

@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(2) var<storage, read_write> gridA: array<atomic<i32>>; // px,py,pz,mass per node
@group(0) @binding(3) var<storage, read_write> gridV: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> stats: array<atomic<u32>>; // nan, inWall, keFixed, maxSpeedFixed

fn weights(fx: vec3f) -> array<vec3f, 3> {
  return array<vec3f, 3>(
    0.5 * (1.5 - fx) * (1.5 - fx),
    0.75 - (fx - 1.0) * (fx - 1.0),
    0.5 * (fx - 0.5) * (fx - 0.5)
  );
}

fn nodeIndex(n: vec3i) -> u32 { return (u32(n.x) * GY + u32(n.y)) * GZ + u32(n.z); }

@compute @workgroup_size(64)
fn clear_grid(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= NODES) { return; }
  let i = id.x * 4u;
  atomicStore(&gridA[i], 0); atomicStore(&gridA[i + 1u], 0);
  atomicStore(&gridA[i + 2u], 0); atomicStore(&gridA[i + 3u], 0);
}

@compute @workgroup_size(64)
fn p2g_density(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  let pos = particles[id.x].pos.xyz;
  let base = vec3i(floor(pos - 0.5));
  let fx = pos - vec3f(base);
  var w = weights(fx);
  for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { for (var k = 0; k < 3; k++) {
    let wt = w[i].x * w[j].y * w[k].z;
    let n = nodeIndex(base + vec3i(i, j, k));
    atomicAdd(&gridA[n * 4u + 3u], i32(round(wt * SCALE)));
  }}}
}

@compute @workgroup_size(64)
fn p2g_momentum(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  let p = particles[id.x];
  let pos = p.pos.xyz;
  let base = vec3i(floor(pos - 0.5));
  let fx = pos - vec3f(base);
  var w = weights(fx);

  var density = 0.0;
  for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { for (var k = 0; k < 3; k++) {
    let wt = w[i].x * w[j].y * w[k].z;
    let n = nodeIndex(base + vec3i(i, j, k));
    density += wt * f32(atomicLoad(&gridA[n * 4u + 3u])) / SCALE;
  }}}
  density = max(density, 0.05);
  let vol = 1.0 / max(density, 1.0);       // particle mass is 1
  let ratio = density / REST;
  var pressure = sim.stiff * (ratio * ratio * ratio - 1.0);
  pressure = max(pressure, 0.0);           // compression only: stray droplets must not pull themselves apart

  let cmat = mat3x3f(p.c0.xyz, p.c1.xyz, p.c2.xyz);
  let strain = cmat + transpose(cmat);     // 2 * rate of strain
  let mu = sim.visc / (DX * DX) * REST;
  let stress = mat3x3f(vec3f(-pressure, 0.0, 0.0), vec3f(0.0, -pressure, 0.0), vec3f(0.0, 0.0, -pressure)) + mu * strain;
  let term = (-vol * 4.0 * sim.dt) * stress;
  let affine = term + cmat;                // mass is 1

  for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { for (var k = 0; k < 3; k++) {
    let wt = w[i].x * w[j].y * w[k].z;
    let dist = vec3f(f32(i), f32(j), f32(k)) - fx;
    let mom = clamp(wt * (p.vel.xyz + affine * dist), vec3f(-1000.0), vec3f(1000.0));
    let n = nodeIndex(base + vec3i(i, j, k));
    let q = vec3i(round(mom * SCALE));
    atomicAdd(&gridA[n * 4u], q.x);
    atomicAdd(&gridA[n * 4u + 1u], q.y);
    atomicAdd(&gridA[n * 4u + 2u], q.z);
  }}}
}

@compute @workgroup_size(64)
fn grid_update(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= NODES) { return; }
  let idx = id.x;
  let m = f32(atomicLoad(&gridA[idx * 4u + 3u])) / SCALE;
  if (m <= 1e-4) { gridV[idx] = vec4f(0.0); return; }
  let mom = vec3f(f32(atomicLoad(&gridA[idx * 4u])), f32(atomicLoad(&gridA[idx * 4u + 1u])), f32(atomicLoad(&gridA[idx * 4u + 2u]))) / SCALE;
  var v = mom / m;
  v.y -= sim.gravity / DX * sim.dt;
  v *= 1.0 - 0.2 * sim.dt;

  let gz = idx % GZ;
  let gy = (idx / GZ) % GY;
  let gx = idx / (GZ * GY);

  // vessels: strip the inward relative velocity, keep Coulomb friction on the tangent
  let pw = vec3f(f32(gx), f32(gy), f32(gz)) * DX;
  let s = scene(pw);
  if (s.x < 0.5 * DX) {
    let n = sceneGrad(pw);
    var vw = vec3f(0.0);
    if (s.y > 0.5) { vw = wallVel(pw); }
    var vr = v * DX - vw;
    if (s.x < -DX) {
      vr = vec3f(0.0);
    } else {
      let vn = dot(vr, n);
      if (vn < 0.0) {
        var vt = vr - vn * n;
        let vtl = length(vt);
        if (vtl > 1e-6) { vt *= max(vtl + sim.friction * vn, 0.0) / vtl; }
        vr = vt;
      }
    }
    v = (vr + vw) / DX;
  }

  // domain box: wall planes sit on nodes 3 and G-4, so every node on or past them stops inward flow
  if (gx < 4u && v.x < 0.0) { v.x = 0.0; }
  if (gx > GX - 5u && v.x > 0.0) { v.x = 0.0; }
  if (gy < 4u && v.y < 0.0) { v.y = 0.0; v.x *= 1.0 - sim.friction; v.z *= 1.0 - sim.friction; }
  if (gy > GY - 5u && v.y > 0.0) { v.y = 0.0; }
  if (gz < 4u && v.z < 0.0) { v.z = 0.0; }
  if (gz > GZ - 5u && v.z > 0.0) { v.z = 0.0; }

  gridV[idx] = vec4f(v, m);
}

fn pushOut(pos: ptr<function, vec3f>, vel: ptr<function, vec3f>) {
  let pw = (*pos) * DX;
  let s = scene(pw);
  if (s.x < 0.0) {
    let n = sceneGrad(pw);
    var vw = vec3f(0.0);
    if (s.y > 0.5) { vw = wallVel(pw); }
    var vr = (*vel) * DX - vw;
    let vn = dot(vr, n);
    if (vn < 0.0) { vr -= vn * n; }
    *vel = (vr + vw) / DX;
    *pos = (pw + n * (-s.x + 0.0015)) / DX;
  }
}

@compute @workgroup_size(64)
fn g2p(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  var p = particles[id.x];
  var pos = p.pos.xyz;
  let base = vec3i(floor(pos - 0.5));
  let fx = pos - vec3f(base);
  var w = weights(fx);

  var v = vec3f(0.0);
  var c0 = vec3f(0.0); var c1 = vec3f(0.0); var c2 = vec3f(0.0);
  for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { for (var k = 0; k < 3; k++) {
    let wt = w[i].x * w[j].y * w[k].z;
    let dist = vec3f(f32(i), f32(j), f32(k)) - fx;
    let gv = gridV[nodeIndex(base + vec3i(i, j, k))].xyz * wt;
    v += gv;
    c0 += 4.0 * gv.x * dist; c1 += 4.0 * gv.y * dist; c2 += 4.0 * gv.z * dist;
  }}}
  // c0..c2 hold the rows of C; store columns so that C * dist = sum(v * dist^T) * dist
  let cm = transpose(mat3x3f(c0, c1, c2));

  let maxV = 14.0 / DX;
  let sp = length(v);
  if (sp > maxV) { v *= maxV / sp; }

  // swept advection: two half steps, each pushed out of the vessels
  pos += v * sim.dt * 0.5;
  pushOut(&pos, &v);
  pos += v * sim.dt * 0.5;
  pushOut(&pos, &v);
  pos = clamp(pos, vec3f(3.0), vec3f(f32(GX) - 4.0, f32(GY) - 4.0, f32(GZ) - 4.0));

  p.pos = vec4f(pos, 0.0);
  p.vel = vec4f(v, 0.0);
  p.c0 = vec4f(cm[0], 0.0); p.c1 = vec4f(cm[1], 0.0); p.c2 = vec4f(cm[2], 0.0);
  particles[id.x] = p;
}

@compute @workgroup_size(64)
fn stats_pass(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  let p = particles[id.x];
  if (p.pos.x != p.pos.x || p.vel.x != p.vel.x || p.pos.y != p.pos.y || p.pos.z != p.pos.z) {
    atomicAdd(&stats[0], 1u);
    return;
  }
  if (sceneD(p.pos.xyz * DX) < -0.02) { atomicAdd(&stats[1], 1u); }
  let sp = length(p.vel.xyz) * DX;
  atomicAdd(&stats[2], u32(min(0.5 * sp * sp * 100.0, 4000.0)));
  atomicMax(&stats[3], u32(min(sp * 1000.0, 4.0e6)));
}
`;

export const RENDER_WGSL = /* wgsl */ `
${COMMON}

struct Cam {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  eye: vec4f,
  right: vec4f,
  up: vec4f,
  fwd: vec4f,
  params: vec4f, // radius, vesselAlpha, 0, 0
}
struct Particle { pos: vec4f, vel: vec4f, c0: vec4f, c1: vec4f, c2: vec4f }

@group(0) @binding(1) var<uniform> cam: Cam;
@group(0) @binding(2) var<storage, read> particles: array<Particle>;

const LIGHT: vec3f = vec3f(0.42, 0.8, 0.43);

struct PVOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) speed: f32,
}

@vertex
fn pvs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> PVOut {
  var corners = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0));
  let c = corners[vi];
  let p = particles[ii];
  let world = p.pos.xyz * DX + (cam.right.xyz * c.x + cam.up.xyz * c.y) * cam.params.x;
  var o: PVOut;
  o.pos = cam.viewProj * vec4f(world, 1.0);
  o.uv = c;
  o.speed = length(p.vel.xyz) * DX;
  return o;
}

@fragment
fn pfs(in: PVOut) -> @location(0) vec4f {
  let r2 = dot(in.uv, in.uv);
  if (r2 > 1.0) { discard; }
  let nz = sqrt(1.0 - r2);
  let n = normalize(cam.right.xyz * in.uv.x + cam.up.xyz * in.uv.y - cam.fwd.xyz * nz);
  let t = clamp(in.speed / 4.0, 0.0, 1.0);
  var col = mix(vec3f(0.008, 0.52, 0.78), vec3f(0.22, 0.74, 0.97), t);
  let diff = 0.45 + 0.55 * max(dot(n, normalize(LIGHT)), 0.0);
  let rim = pow(1.0 - nz, 3.0);
  col = col * diff + vec3f(0.5, 0.8, 1.0) * rim * 0.35;
  col = mix(col, vec3f(1.0), clamp((in.speed - 3.0) / 3.0, 0.0, 0.8));
  return vec4f(col, 1.0);
}

struct FVOut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f }

@vertex
fn fvs(@builtin(vertex_index) vi: u32) -> FVOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: FVOut;
  o.pos = vec4f(p[vi], 0.0, 1.0);
  o.ndc = p[vi];
  return o;
}

override LAYER: f32 = 0.0;

struct SOut { @location(0) color: vec4f, @builtin(frag_depth) depth: f32 }

fn groundColor(p: vec3f) -> vec3f {
  let g = abs(fract(p.xz * 10.0 + 0.5) - 0.5);
  let line = 1.0 - smoothstep(0.0, 0.03, min(g.x, g.y));
  var col = mix(vec3f(0.16, 0.21, 0.27), vec3f(0.22, 0.29, 0.36), line * 0.6);
  let inside = p.x > FLOOR_Y && p.x < 1.6 - 4.0 * DX && p.z > FLOOR_Y && p.z < 1.6 - 4.0 * DX;
  if (inside) { col += vec3f(0.05, 0.07, 0.09); }
  let e = min(min(abs(p.x - FLOOR_Y), abs(p.x - (1.6 - 4.0 * DX))), min(abs(p.z - FLOOR_Y), abs(p.z - (1.6 - 4.0 * DX))));
  if (e < 0.006 && p.x > FLOOR_Y - 0.01 && p.x < 1.61 - 4.0 * DX && p.z > FLOOR_Y - 0.01 && p.z < 1.61 - 4.0 * DX) { col = vec3f(0.45, 0.6, 0.72); }
  return col;
}

@fragment
fn ffs(in: FVOut) -> SOut {
  let a = cam.invViewProj * vec4f(in.ndc, 0.0, 1.0);
  let b = cam.invViewProj * vec4f(in.ndc, 1.0, 1.0);
  let ro = cam.eye.xyz;
  let rd = normalize(b.xyz / b.w - a.xyz / a.w);

  // clip to the domain box
  let bmin = vec3f(0.0, 0.0, 0.0);
  let bmax = vec3f(1.6, 1.2, 1.6);
  let inv = 1.0 / rd;
  let t0 = (bmin - ro) * inv;
  let t1 = (bmax - ro) * inv;
  let tmn = min(t0, t1);
  let tmx = max(t0, t1);
  let tNear = max(max(tmn.x, tmn.y), max(tmn.z, 0.0));
  let tFar = min(min(tmx.x, tmx.y), tmx.z);

  var tGround = 1.0e9;
  if (rd.y < -1e-4) { tGround = (FLOOR_Y - ro.y) / rd.y; }
  let gp = ro + rd * tGround;
  let groundHit = tGround > 0.0 && gp.x > -0.3 && gp.x < 1.9 && gp.z > -0.3 && gp.z < 1.9;

  let tEnd = min(tFar, select(1.0e9, tGround, groundHit));
  var t = tNear;
  var hit = false;
  if (tNear < tFar) {
    for (var i = 0; i < 128; i++) {
      if (t > tEnd) { break; }
      let d = sceneD(ro + rd * t);
      if (d < 0.0015) { hit = true; break; }
      t += max(d, 0.002);
    }
  }

  var out: SOut;
  if (LAYER > 0.5) {
    // front layer: the nearest vessel surface, translucent, drawn over the water
    if (!hit) { discard; }
    let p = ro + rd * t;
    let n = sceneGrad(p);
    let diff = 0.4 + 0.6 * max(dot(n, normalize(LIGHT)), 0.0);
    let h = normalize(normalize(LIGHT) - rd);
    let spec = pow(max(dot(n, h), 0.0), 40.0) * 0.5;
    let a = cam.params.y;
    out.color = vec4f((vec3f(0.78, 0.84, 0.88) * diff + vec3f(spec)) * a, a);
    let clip = cam.viewProj * vec4f(p, 1.0);
    out.depth = clip.z / clip.w;
    return out;
  }

  // back layer (opaque): whatever lies behind the first vessel surface, else the ground
  var back = false;
  if (hit) {
    // walk out of the solid, then keep marching for the next surface
    for (var i = 0; i < 64; i++) {
      let d = sceneD(ro + rd * t);
      if (d > 0.0015) { break; }
      t += max(-d, 0.006);
    }
    t += 0.004;
    for (var i = 0; i < 96; i++) {
      if (t > tEnd) { break; }
      let d = sceneD(ro + rd * t);
      if (d < 0.0015) { back = true; break; }
      t += max(d, 0.002);
    }
  }
  if (back) {
    let p = ro + rd * t;
    let n = sceneGrad(p);
    let diff = 0.35 + 0.5 * max(dot(n, normalize(LIGHT)), 0.0);
    out.color = vec4f(vec3f(0.55, 0.62, 0.68) * diff, 1.0);
    let clip = cam.viewProj * vec4f(p, 1.0);
    out.depth = clip.z / clip.w;
    return out;
  }
  if (groundHit) {
    out.color = vec4f(groundColor(gp), 1.0);
    let clip = cam.viewProj * vec4f(gp, 1.0);
    out.depth = clip.z / clip.w;
    return out;
  }
  discard;
  return out;
}
`;
