// WebGPU MLS-MPM water: buffers, pipelines, per-frame encode. One compute pass per frame runs
// `speed` substeps of clear -> p2g density -> p2g momentum -> grid update -> g2p.
import { DX, MAX_PARTICLES, MAX_SUBSTEPS, NODE_COUNT, Params, REST_DENSITY, SceneId, SUB_DT, UNIFORM_STRIDE } from './config';
import { OrbitCamera, invert, lookAt, multiply, perspective } from './camera';
import { RENDER_WGSL, SIM_WGSL } from './shaders';
import { CupPose, seedScene } from './seed';

export interface Targets {
  tilt: number; // degrees
  cupX: number;
  cupY: number;
  gate: number; // 0..1
}

export interface Stats {
  count: number;
  capacity: number;
  nan: number;
  inWall: number;
  kinetic: number; // mean J per unit mass
  maxSpeed: number; // m/s
}

const PARTICLE_BYTES = 80;
const SLOT_FLOATS = UNIFORM_STRIDE / 4;
const SMOOTH_RATE = 6; // 1/s, how fast the cup and gate follow their sliders
const GATE_RATE = 2.5; // the gate opens more gently than the cup moves
const GATE_TRAVEL = 0.85; // metres

interface Rig {
  x: number;
  y: number;
  tilt: number; // radians
  gate: number; // raise in metres
}

export async function createSim(canvas: HTMLCanvasElement): Promise<WaterSim> {
  if (!navigator.gpu) throw new Error('WebGPU is not available in this browser.');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('No WebGPU adapter found.');
  const device = await adapter.requestDevice();
  return new WaterSim(canvas, device);
}

export class WaterSim {
  scene: SceneId = 0;
  count = 0;
  capacity = 0;
  stats: Stats = { count: 0, capacity: 0, nan: 0, inWall: 0, kinetic: 0, maxSpeed: 0 };
  paused = false;
  stepsPerFrame = 10;
  lastStepMs = 0;

  private ctx: GPUCanvasContext;
  private format: GPUTextureFormat;
  private particleBuf: GPUBuffer;
  private simUni: GPUBuffer;
  private renderSimUni: GPUBuffer;
  private camUni: GPUBuffer;
  private statsBuf: GPUBuffer;
  private readBuf: GPUBuffer;
  private simGroup: GPUBindGroup;
  private renderGroup: GPUBindGroup;
  private pClear: GPUComputePipeline;
  private pDensity: GPUComputePipeline;
  private pMomentum: GPUComputePipeline;
  private pGrid: GPUComputePipeline;
  private pG2p: GPUComputePipeline;
  private pStats: GPUComputePipeline;
  private rParticles: GPURenderPipeline;
  private rBack: GPURenderPipeline;
  private rFront: GPURenderPipeline;
  private depth: GPUTexture | null = null;
  private depthSize = [0, 0];
  private rig: Rig = { x: 0.52, y: 0.85, tilt: 0, gate: 0 };
  private prev: Rig = { x: 0.52, y: 0.85, tilt: 0, gate: 0 };
  private frameNo = 0;
  private readPending = false;
  private simStore = new ArrayBuffer(UNIFORM_STRIDE * MAX_SUBSTEPS);
  private simF = new Float32Array(this.simStore);
  private simU = new Uint32Array(this.simStore);
  private camData = new Float32Array(52);
  readonly camera: OrbitCamera;

  constructor(
    private canvas: HTMLCanvasElement,
    private device: GPUDevice,
  ) {
    device.addEventListener('uncapturederror', (e) => console.error('WebGPU error:', (e as GPUUncapturedErrorEvent).error.message));
    void device.lost.then((info) => console.error('WebGPU device lost:', info.message));
    this.camera = new OrbitCamera(canvas);
    this.ctx = canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.ctx.configure({ device, format: this.format, alphaMode: 'opaque' });

    const U = GPUBufferUsage;
    const mk = (size: number, usage: number) => device.createBuffer({ size, usage });
    this.particleBuf = mk(MAX_PARTICLES * PARTICLE_BYTES, U.STORAGE | U.COPY_DST | U.COPY_SRC);
    const gridA = mk(NODE_COUNT * 16, U.STORAGE);
    const gridV = mk(NODE_COUNT * 16, U.STORAGE);
    this.statsBuf = mk(16, U.STORAGE | U.COPY_SRC | U.COPY_DST);
    this.readBuf = mk(16, U.MAP_READ | U.COPY_DST);
    this.simUni = mk(UNIFORM_STRIDE * MAX_SUBSTEPS, U.UNIFORM | U.COPY_DST);
    this.renderSimUni = mk(UNIFORM_STRIDE, U.UNIFORM | U.COPY_DST);
    this.camUni = mk(UNIFORM_STRIDE, U.UNIFORM | U.COPY_DST);

    // ---- compute
    const simLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: 80 } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });
    const simModule = this.module(SIM_WGSL, 'sim');
    const simPL = device.createPipelineLayout({ bindGroupLayouts: [simLayout] });
    const cp = (entryPoint: string) => device.createComputePipeline({ layout: simPL, compute: { module: simModule, entryPoint } });
    this.pClear = cp('clear_grid');
    this.pDensity = cp('p2g_density');
    this.pMomentum = cp('p2g_momentum');
    this.pGrid = cp('grid_update');
    this.pG2p = cp('g2p');
    this.pStats = cp('stats_pass');
    this.simGroup = device.createBindGroup({
      layout: simLayout,
      entries: [
        { binding: 0, resource: { buffer: this.simUni, size: 96 } },
        { binding: 1, resource: { buffer: this.particleBuf } },
        { binding: 2, resource: { buffer: gridA } },
        { binding: 3, resource: { buffer: gridV } },
        { binding: 4, resource: { buffer: this.statsBuf } },
      ],
    });

    // ---- render
    const rLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
      ],
    });
    const rModule = this.module(RENDER_WGSL, 'render');
    const rPL = device.createPipelineLayout({ bindGroupLayouts: [rLayout] });
    this.rParticles = device.createRenderPipeline({
      layout: rPL,
      vertex: { module: rModule, entryPoint: 'pvs' },
      fragment: { module: rModule, entryPoint: 'pfs', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
    });
    const scenePipeline = (layer: number, blend: boolean) =>
      device.createRenderPipeline({
        layout: rPL,
        vertex: { module: rModule, entryPoint: 'fvs' },
        fragment: {
          module: rModule,
          entryPoint: 'ffs',
          constants: { LAYER: layer },
          targets: [
            {
              format: this.format,
              blend: blend
                ? {
                    color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                  }
                : undefined,
            },
          ],
        },
        primitive: { topology: 'triangle-list' },
        depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
      });
    this.rBack = scenePipeline(0, false);
    this.rFront = scenePipeline(1, true);
    this.renderGroup = device.createBindGroup({
      layout: rLayout,
      entries: [
        { binding: 0, resource: { buffer: this.renderSimUni, size: 96 } },
        { binding: 1, resource: { buffer: this.camUni, size: 208 } },
        { binding: 2, resource: { buffer: this.particleBuf } },
      ],
    });
  }

  private module(code: string, label: string): GPUShaderModule {
    const m = this.device.createShaderModule({ code, label });
    void m.getCompilationInfo().then((info) => {
      for (const msg of info.messages) {
        const line = `[${label}] ${msg.type} ${msg.lineNum}:${msg.linePos} ${msg.message}`;
        if (msg.type === 'error') console.error(line);
        else console.warn(line);
      }
    });
    return m;
  }

  /** Seed the scene with up to `wanted` particles and snap the cup/gate to the slider positions. */
  reset(scene: SceneId, wanted: number, t: Targets): void {
    this.scene = scene;
    this.snap(t);
    const cup: CupPose = { x: this.rig.x, y: this.rig.y, z: 0.8, tilt: this.rig.tilt };
    const seeded = seedScene(scene, wanted, cup);
    this.count = seeded.count;
    this.capacity = seeded.capacity;
    this.device.queue.writeBuffer(this.particleBuf, 0, seeded.data.buffer, 0, seeded.data.byteLength);
    this.stats = { count: this.count, capacity: this.capacity, nan: 0, inWall: 0, kinetic: 0, maxSpeed: 0 };
  }

  private snap(t: Targets): void {
    this.rig = { x: t.cupX, y: t.cupY, tilt: (t.tilt * Math.PI) / 180, gate: t.gate * GATE_TRAVEL };
    this.prev = { ...this.rig };
  }

  private writeSlot(f: Float32Array, u: Uint32Array, b: number, p: Params, pose: Rig, vel: Rig, dt: number): void {
    f[b] = dt;
    f[b + 1] = p.gravity;
    f[b + 2] = (((p.sound / DX) ** 2) * REST_DENSITY) / 3;
    f[b + 3] = p.viscosity;
    u[b + 4] = this.count;
    u[b + 5] = this.scene;
    f[b + 6] = p.friction;
    f[b + 8] = pose.x;
    f[b + 9] = pose.y;
    f[b + 10] = 0.8;
    f[b + 11] = pose.tilt;
    f[b + 12] = vel.x;
    f[b + 13] = vel.y;
    f[b + 14] = 0;
    f[b + 15] = -vel.tilt; // tilt is clockwise-positive, shader omega is about +z
    f[b + 16] = pose.gate;
    f[b + 17] = vel.gate;
  }

  /** Debug: copy every particle (80 bytes each, grid units) back to the CPU. */
  async readParticles(): Promise<Float32Array> {
    const bytes = this.count * PARTICLE_BYTES;
    const buf = this.device.createBuffer({ size: bytes, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    const enc = this.device.createCommandEncoder();
    enc.copyBufferToBuffer(this.particleBuf, 0, buf, 0, bytes);
    this.device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const out = new Float32Array(buf.getMappedRange().slice(0));
    buf.destroy();
    return out;
  }

  frame(p: Params, t: Targets): void {
    const dev = this.device;
    const t0 = performance.now();
    const steps = this.paused ? 0 : Math.min(MAX_SUBSTEPS, Math.max(1, Math.round(p.speed)));
    this.stepsPerFrame = steps;

    // ease the rig toward its targets; velocity is per sim second so moving walls push water correctly
    const simDt = Math.max(steps, 1) * SUB_DT;
    this.prev = { ...this.rig };
    if (steps > 0) {
      const k = 1 - Math.exp(-SMOOTH_RATE * simDt);
      const goal: Rig = { x: t.cupX, y: t.cupY, tilt: (t.tilt * Math.PI) / 180, gate: t.gate * GATE_TRAVEL };
      this.rig = {
        x: this.rig.x + (goal.x - this.rig.x) * k,
        y: this.rig.y + (goal.y - this.rig.y) * k,
        tilt: this.rig.tilt + (goal.tilt - this.rig.tilt) * k,
        gate: this.rig.gate + (goal.gate - this.rig.gate) * (1 - Math.exp(-GATE_RATE * simDt)),
      };
    }
    const vel: Rig = {
      x: (this.rig.x - this.prev.x) / simDt,
      y: (this.rig.y - this.prev.y) / simDt,
      tilt: (this.rig.tilt - this.prev.tilt) / simDt,
      gate: (this.rig.gate - this.prev.gate) / simDt,
    };
    for (let s = 0; s < Math.max(steps, 1); s++) {
      const a = (s + 1) / Math.max(steps, 1);
      const pose: Rig = {
        x: this.prev.x + (this.rig.x - this.prev.x) * a,
        y: this.prev.y + (this.rig.y - this.prev.y) * a,
        tilt: this.prev.tilt + (this.rig.tilt - this.prev.tilt) * a,
        gate: this.prev.gate + (this.rig.gate - this.prev.gate) * a,
      };
      this.writeSlot(this.simF, this.simU, s * SLOT_FLOATS, p, pose, vel, SUB_DT);
    }
    dev.queue.writeBuffer(this.simUni, 0, this.simStore, 0, UNIFORM_STRIDE * Math.max(steps, 1));
    // render sees the final pose
    dev.queue.writeBuffer(this.renderSimUni, 0, this.simStore, (Math.max(steps, 1) - 1) * UNIFORM_STRIDE, 96);
    dev.queue.writeBuffer(this.statsBuf, 0, new Uint32Array(4));

    const enc = dev.createCommandEncoder();
    const groups = Math.ceil(this.count / 64);
    const nodeGroups = NODE_COUNT / 64;
    const cpass = enc.beginComputePass();
    for (let s = 0; s < steps; s++) {
      cpass.setBindGroup(0, this.simGroup, [s * UNIFORM_STRIDE]);
      cpass.setPipeline(this.pClear);
      cpass.dispatchWorkgroups(nodeGroups);
      cpass.setPipeline(this.pDensity);
      cpass.dispatchWorkgroups(groups);
      cpass.setPipeline(this.pMomentum);
      cpass.dispatchWorkgroups(groups);
      cpass.setPipeline(this.pGrid);
      cpass.dispatchWorkgroups(nodeGroups);
      cpass.setPipeline(this.pG2p);
      cpass.dispatchWorkgroups(groups);
    }
    cpass.setBindGroup(0, this.simGroup, [0]);
    cpass.setPipeline(this.pStats);
    cpass.dispatchWorkgroups(groups);
    cpass.end();

    // camera
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5)));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 1.5)));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (!this.depth || this.depthSize[0] !== w || this.depthSize[1] !== h) {
      this.depth?.destroy();
      this.depth = dev.createTexture({ size: [w, h], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT });
      this.depthSize = [w, h];
    }
    const b = this.camera.basis();
    const vp = multiply(perspective(0.8, w / h, 0.05, 20), lookAt(b.eye, this.camera.target, [0, 1, 0]));
    const cd = this.camData;
    cd.set(vp, 0);
    cd.set(invert(vp), 16);
    cd.set([...b.eye, 1], 32);
    cd.set([...b.right, 0], 36);
    cd.set([...b.up, 0], 40);
    cd.set([...b.fwd, 0], 44);
    cd.set([p.radius, p.vessel, 0, 0], 48);
    dev.queue.writeBuffer(this.camUni, 0, cd);

    const rpass = enc.beginRenderPass({
      colorAttachments: [{ view: this.ctx.getCurrentTexture().createView(), clearValue: { r: 0.063, g: 0.1, b: 0.15, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
      depthStencilAttachment: { view: this.depth.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' },
    });
    rpass.setBindGroup(0, this.renderGroup);
    rpass.setPipeline(this.rBack);
    rpass.draw(3);
    rpass.setPipeline(this.rParticles);
    rpass.draw(6, this.count);
    rpass.setPipeline(this.rFront);
    rpass.draw(3);
    rpass.end();

    const wantRead = !this.readPending && this.frameNo % 15 === 0;
    if (wantRead) enc.copyBufferToBuffer(this.statsBuf, 0, this.readBuf, 0, 16);
    dev.queue.submit([enc.finish()]);
    this.frameNo++;
    this.lastStepMs = performance.now() - t0;

    if (wantRead) {
      this.readPending = true;
      this.readBuf
        .mapAsync(GPUMapMode.READ)
        .then(() => {
          const v = new Uint32Array(this.readBuf.getMappedRange().slice(0));
          this.readBuf.unmap();
          this.stats = {
            count: this.count,
            capacity: this.capacity,
            nan: v[0],
            inWall: v[1],
            kinetic: v[2] / 100 / Math.max(this.count, 1),
            maxSpeed: v[3] / 1000,
          };
        })
        .catch(() => undefined)
        .finally(() => (this.readPending = false));
    }
  }
}
