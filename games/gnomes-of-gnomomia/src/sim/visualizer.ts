// Browser 3D scenario visualizer for the Gnomes of Gnomomia balance simulator.
// Activated via ?sim=<scenarioId> (e.g. ?sim=boss-mole-king&policy=tactical&class=warden&seed=1).
import * as THREE from 'three';
import { ZONES } from '../content';
import { initCombat } from '../combat';
import { allEntities, setEntityScene, syncEntityVisuals } from '../entities';
import { bus } from '../events';
import { createPlayer, player } from '../player';
import { mulberry32 } from '../rules';
import { maxHp, maxMp, state } from '../state';
import { POLICIES } from './agents';
import { createArena, type SimArena } from './arena';
import { formatLoadoutLabel } from './loadout';
import { SCENARIOS, SCENARIO_LIST } from './scenarios';
import {
  SIM_STEP_S,
  type AgentPolicy,
  type GearTier,
  type LoadoutSpec,
  type ScenarioSpec,
  type SimObservation,
  type SimTelegraph,
} from './types';
import type { ClassId, OutdoorZoneId } from '../config';

export interface SimVisualizerOpts {
  canvas: HTMLCanvasElement;
  ui: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  params: URLSearchParams;
}

const ZONE_LEVEL: Record<OutdoorZoneId, number> = {
  mossbottom: 3,
  thatchford: 8,
  keep: 11,
  deeps: 11,
  cloverfield: 14,
  hedgewood: 18,
  rockery: 23,
  verge: 28,
};

const VALID_CLASSES: readonly string[] = ['warden', 'slinger', 'mage', 'classless'];
const VALID_TIERS: readonly GearTier[] = ['naked', 'undergeared', 'zone-plain', 'zone-sprouted', 'zone-bis'];

function defaultLevelForScenario(sc: ScenarioSpec): number {
  const m = /\(L(\d+)/.exec(sc.name);
  if (m) return Math.min(30, Number(m[1]));
  return ZONE_LEVEL[sc.zone ?? 'mossbottom'] ?? 10;
}

function defaultLoadoutForScenario(sc: ScenarioSpec, classParam: string | null, tierParam: string | null, levelParam: string | null): LoadoutSpec {
  const lvl = levelParam && Number.isFinite(Number(levelParam)) ? Math.max(1, Math.min(30, Number(levelParam))) : defaultLevelForScenario(sc);
  const tier: GearTier = VALID_TIERS.includes(tierParam as GearTier)
    ? (tierParam as GearTier)
    : (sc.id.startsWith('boss-mower-') ? 'zone-bis' : 'zone-plain');

  if (classParam === 'classless' || (!classParam && lvl < 5)) {
    return { level: lvl, classId: null, gearTier: tier };
  }
  const classId: ClassId = classParam && ['warden', 'slinger', 'mage'].includes(classParam)
    ? (classParam as ClassId)
    : 'warden';
  const build = classId === 'warden' ? 'shieldwall' : classId === 'slinger' ? 'deadeye' : 'sunburst';
  return { level: lvl, classId, build, gearTier: tier };
}

interface TelegraphMesh {
  group: THREE.Group;
  fill: THREE.Mesh;
}

function buildTelegraphGroup(t: SimTelegraph): TelegraphMesh {
  const group = new THREE.Group();
  const isPool = t.kind === 'pool';
  const color = isPool ? 0x9b2cff : 0xff3030;
  const baseMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: isPool ? 0.28 : 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fillMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: isPool ? 0.35 : 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  let baseGeo: THREE.BufferGeometry;
  let fillGeo: THREE.BufferGeometry;

  if (t.kind === 'cone') {
    baseGeo = new THREE.CircleGeometry(t.radius, 24, -Math.PI / 6, Math.PI / 3);
    fillGeo = new THREE.CircleGeometry(t.radius, 24, -Math.PI / 6, Math.PI / 3);
    group.rotation.y = t.dir - Math.PI / 2;
  } else if (t.kind === 'lane') {
    baseGeo = new THREE.PlaneGeometry(t.width, t.length);
    baseGeo.translate(0, 0, t.length / 2);
    fillGeo = new THREE.PlaneGeometry(t.width, t.length);
    fillGeo.translate(0, 0, t.length / 2);
    group.rotation.y = t.dir;
  } else {
    baseGeo = new THREE.CircleGeometry(t.radius, 36);
    fillGeo = new THREE.CircleGeometry(t.radius, 36);
  }

  const base = new THREE.Mesh(baseGeo, baseMat);
  if (t.kind !== 'lane') base.rotation.x = -Math.PI / 2;
  else base.rotation.x = 0; // PlaneGeometry translated on Z is already horizontal if rotated -PI/2 before translate; fix below
  if (t.kind === 'lane') {
    baseGeo.dispose();
    fillGeo.dispose();
    const bGeo = new THREE.PlaneGeometry(t.width, t.length);
    bGeo.rotateX(-Math.PI / 2);
    bGeo.translate(0, 0, t.length / 2);
    const fGeo = new THREE.PlaneGeometry(t.width, t.length);
    fGeo.rotateX(-Math.PI / 2);
    fGeo.translate(0, 0, t.length / 2);
    base.geometry = bGeo;
    base.rotation.x = 0;
    const fill = new THREE.Mesh(fGeo, fillMat);
    fill.position.y = 0.01;
    group.add(base, fill);
    group.position.set(t.cx, 0.03, t.cz);
    return { group, fill };
  }

  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.01;
  group.add(base, fill);
  group.position.set(t.cx, 0.03, t.cz);
  return { group, fill };
}

interface FloatingText {
  el: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  age: number;
  duration: number;
}

export function runSimVisualizer(opts: SimVisualizerOpts): void {
  const { canvas, ui, renderer, scene, camera, params } = opts;

  const rawSim = params.get('sim');
  let scenarioId = rawSim && SCENARIOS[rawSim] ? rawSim : 'boss-mole-king';
  let policyId = params.get('policy') && POLICIES[params.get('policy')!] ? params.get('policy')! : 'tactical';
  let classParam = params.get('class') && VALID_CLASSES.includes(params.get('class')!) ? params.get('class') : null;
  let tierParam = params.get('tier');
  let levelParam = params.get('level');
  let seed = Math.max(1, Number(params.get('seed') ?? 1) || 1);
  let speed = Math.max(0.25, Math.min(8, Number(params.get('speed') ?? 1) || 1));

  const noHud = params.has('nohud');
  const hideControls = noHud || params.get('controls') === '0' || params.get('controls') === 'false';

  // Camera orbit state
  const camPreset = params.get('cam');
  let camYaw = camPreset === 'side' ? Math.PI / 2 : camPreset === 'front' ? Math.PI : 0.45;
  let camPitch = camPreset === 'top' ? 1.15 : camPreset === 'side' ? 0.42 : 0.58;
  let camDist = camPreset === 'close' ? 10 : camPreset === 'top' ? 22 : 16;
  const camFocus = new THREE.Vector3();

  // Camera drag & wheel controls
  let dragging = false;
  let dragX = 0;
  let dragY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    camYaw -= (e.clientX - dragX) * 0.008;
    camPitch = Math.max(0.2, Math.min(1.35, camPitch + (e.clientY - dragY) * 0.006));
    dragX = e.clientX;
    dragY = e.clientY;
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camDist = Math.max(6, Math.min(38, camDist + e.deltaY * 0.015));
  }, { passive: false });

  const heldKeys = new Set<string>();
  window.addEventListener('keydown', (e) => {
    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement) return;
    heldKeys.add(e.code);
    if (e.code === 'Space') {
      e.preventDefault();
      paused = !paused;
      updateControlLabels();
    } else if (e.code === 'KeyR') {
      restart();
    } else if (e.code === 'Period' || e.code === 'KeyN') {
      if (paused && arena && !arena.isDone()) {
        stepSimOnce();
      }
    }
  });
  window.addEventListener('keyup', (e) => heldKeys.delete(e.code));

  // Scene lighting & static arena props
  const hemi = new THREE.HemisphereLight(0xdff2ff, 0x4b5c34, 0.9);
  const sun = new THREE.DirectionalLight(0xfff4d6, 1.35);
  sun.position.set(16, 28, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 80;
  const sBound = 28;
  sun.shadow.camera.left = -sBound;
  sun.shadow.camera.right = sBound;
  sun.shadow.camera.top = sBound;
  sun.shadow.camera.bottom = -sBound;
  scene.add(hemi, sun);

  const arenaGroup = new THREE.Group();
  scene.add(arenaGroup);

  const groundGeo = new THREE.CircleGeometry(30, 64);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x5c8a3d });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = true;
  arenaGroup.add(groundMesh);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, side: THREE.DoubleSide });
  for (const r of [10, 20]) {
    const rg = new THREE.RingGeometry(r - 0.06, r + 0.06, 64);
    rg.rotateX(-Math.PI / 2);
    const rm = new THREE.Mesh(rg, ringMat);
    rm.position.y = 0.015;
    arenaGroup.add(rm);
  }

  const defendRingGeo = new THREE.RingGeometry(0.96, 1.0, 64);
  defendRingGeo.rotateX(-Math.PI / 2);
  const defendRingMat = new THREE.MeshBasicMaterial({ color: 0x4cc9ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const defendRing = new THREE.Mesh(defendRingGeo, defendRingMat);
  defendRing.position.y = 0.02;
  defendRing.visible = false;
  arenaGroup.add(defendRing);

  // Subtle perimeter stones for spatial reference
  const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x6b7075, flatShading: true });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dist = 24 + (i % 3) * 1.4;
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(Math.cos(a) * dist, 0.35, Math.sin(a) * dist);
    rock.scale.set(1 + (i % 2) * 0.4, 0.7 + (i % 3) * 0.25, 1);
    rock.rotation.y = a;
    rock.castShadow = true;
    rock.receiveShadow = true;
    arenaGroup.add(rock);
  }

  setEntityScene(scene);
  createPlayer(scene);
  initCombat(scene);

  // Telegraph & UI containers
  const telegraphMeshes = new Map<number, TelegraphMesh>();
  const rootUi = document.createElement('div');
  rootUi.style.cssText = 'position:fixed;inset:0;pointer-events:none;font-family:"Trebuchet MS",Georgia,serif;color:#ffde9e;';
  ui.appendChild(rootUi);

  const worldOverlay = document.createElement('div');
  worldOverlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;';
  rootUi.appendChild(worldOverlay);

  const hudCard = document.createElement('div');
  hudCard.style.cssText = [
    'position:fixed;top:12px;left:12px;min-width:270px;max-width:340px;',
    'background:rgba(20,16,12,0.82);border:1px solid rgba(255,222,158,0.35);border-radius:8px;',
    'padding:10px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.45);backdrop-filter:blur(3px);',
  ].join('');
  if (noHud) hudCard.style.display = 'none';
  rootUi.appendChild(hudCard);

  const bannerEl = document.createElement('div');
  bannerEl.style.cssText = [
    'position:fixed;top:16px;left:50%;transform:translateX(-50%);',
    'padding:8px 18px;border-radius:8px;font-size:18px;font-weight:bold;letter-spacing:0.5px;',
    'background:rgba(20,16,12,0.9);border:2px solid #ffde9e;display:none;',
    'box-shadow:0 6px 20px rgba(0,0,0,0.5);',
  ].join('');
  if (noHud) bannerEl.style.display = 'none';
  rootUi.appendChild(bannerEl);

  const bossBannerEl = document.createElement('div');
  bossBannerEl.style.cssText = [
    'position:fixed;top:64px;left:50%;transform:translateX(-50%);',
    'padding:4px 12px;border-radius:6px;font-size:13px;font-weight:bold;',
    'background:rgba(120,20,20,0.85);border:1px solid rgba(255,140,120,0.6);color:#ffe4dc;display:none;',
  ].join('');
  if (noHud) bossBannerEl.style.display = 'none';
  rootUi.appendChild(bossBannerEl);

  const controlsBar = document.createElement('div');
  controlsBar.style.cssText = [
    'position:fixed;bottom:12px;left:12px;right:12px;pointer-events:auto;',
    'display:flex;flex-wrap:wrap;gap:8px;align-items:center;',
    'background:rgba(20,16,12,0.88);border:1px solid rgba(255,222,158,0.35);border-radius:8px;',
    'padding:8px 12px;font-size:13px;',
  ].join('');
  if (hideControls) controlsBar.style.display = 'none';
  rootUi.appendChild(controlsBar);

  const selectStyle = 'background:#231b13;color:#ffde9e;border:1px solid rgba(255,222,158,0.35);border-radius:4px;padding:3px 6px;font-family:inherit;font-size:12px;';
  const btnStyle = 'background:#3a2b1a;color:#ffde9e;border:1px solid rgba(255,222,158,0.45);border-radius:4px;padding:4px 10px;cursor:pointer;font-family:inherit;font-size:12px;';

  const scenarioSel = document.createElement('select');
  scenarioSel.style.cssText = selectStyle + 'max-width:230px;';
  for (const sc of SCENARIO_LIST) {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.name;
    scenarioSel.appendChild(opt);
  }
  scenarioSel.value = scenarioId;

  const policySel = document.createElement('select');
  policySel.style.cssText = selectStyle;
  for (const p of Object.values(POLICIES)) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    policySel.appendChild(opt);
  }
  policySel.value = policyId;

  const classSel = document.createElement('select');
  classSel.style.cssText = selectStyle;
  for (const [val, label] of [['auto', 'Auto Class'], ['warden', 'Warden'], ['slinger', 'Slinger'], ['mage', 'Mage'], ['classless', 'Classless']]) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    classSel.appendChild(opt);
  }
  classSel.value = classParam ?? 'auto';

  const speedSel = document.createElement('select');
  speedSel.style.cssText = selectStyle;
  for (const sp of [0.5, 1, 2, 4]) {
    const opt = document.createElement('option');
    opt.value = String(sp);
    opt.textContent = `${sp}x`;
    speedSel.appendChild(opt);
  }
  speedSel.value = String(speed);

  const seedInput = document.createElement('input');
  seedInput.type = 'number';
  seedInput.min = '1';
  seedInput.value = String(seed);
  seedInput.style.cssText = selectStyle + 'width:54px;';

  const playBtn = document.createElement('button');
  playBtn.style.cssText = btnStyle;
  const stepBtn = document.createElement('button');
  stepBtn.style.cssText = btnStyle;
  stepBtn.textContent = 'Step';
  const restartBtn = document.createElement('button');
  restartBtn.style.cssText = btnStyle;
  restartBtn.textContent = 'Restart (R)';

  controlsBar.append(
    labelWrap('Scenario', scenarioSel),
    labelWrap('Policy', policySel),
    labelWrap('Class', classSel),
    labelWrap('Seed', seedInput),
    labelWrap('Speed', speedSel),
    playBtn,
    stepBtn,
    restartBtn,
  );

  function labelWrap(label: string, el: HTMLElement): HTMLElement {
    const span = document.createElement('label');
    span.style.cssText = 'display:inline-flex;align-items:center;gap:4px;color:#d6b882;';
    span.textContent = label + ':';
    span.appendChild(el);
    return span;
  }

  // Sim state
  let arena: SimArena | null = null;
  let policy: AgentPolicy = POLICIES[policyId];
  let policyRng = mulberry32(seed ^ 0x9e3779b9);
  let loadoutLabel = '';
  let paused = false;
  let simAcc = 0;
  let prevPlayerPos = new THREE.Vector3();
  const playerVel = new THREE.Vector3();
  const flatPlayerPos = new THREE.Vector3();

  // Floating combat numbers & enemy HP bar elements
  const enemyBars = new Map<number, { wrap: HTMLDivElement; fill: HTMLDivElement; label: HTMLDivElement }>();
  const floatingTexts: FloatingText[] = [];
  let bossBannerTimer = 0;

  bus.on('hit', (ev) => {
    if (noHud) return;
    const isPlayerTarget = ev.target === 0;
    spawnFloatingText(
      `${ev.damage}${ev.crit ? '!' : ''}`,
      ev.at.x,
      1.3,
      ev.at.z,
      isPlayerTarget ? '#ff6b6b' : (ev.crit ? '#ffe066' : '#ffffff'),
    );
  });

  bus.on('miss', (ev) => {
    if (noHud) return;
    const isPlayerTarget = ev.target === 0;
    const targetEnt = isPlayerTarget ? null : allEntities().find((e) => e.id === ev.target);
    const wx = isPlayerTarget ? player.position.x : (targetEnt?.position.x ?? 0);
    const wz = isPlayerTarget ? player.position.z : (targetEnt?.position.z ?? 0);
    spawnFloatingText('MISS', wx, 1.3, wz, '#a8b5c2');
  });

  bus.on('boss-phase', (ev) => {
    if (noHud) return;
    bossBannerEl.textContent = `${ev.boss}: ${ev.text}`;
    bossBannerEl.style.display = 'block';
    bossBannerTimer = 2.4;
  });

  function spawnFloatingText(text: string, x: number, y: number, z: number, color: string): void {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:absolute;font-weight:bold;font-size:15px;color:${color};text-shadow:0 1px 3px #000;transform:translate(-50%,-50%);white-space:nowrap;`;
    worldOverlay.appendChild(el);
    floatingTexts.push({ el, x, y, z, age: 0, duration: 0.9 });
  }

  function updateControlLabels(): void {
    playBtn.textContent = paused ? 'Play (Space)' : 'Pause (Space)';
  }

  function clearTelegraphs(): void {
    for (const tm of telegraphMeshes.values()) {
      scene.remove(tm.group);
    }
    telegraphMeshes.clear();
  }

  function clearEnemyBars(): void {
    for (const b of enemyBars.values()) b.wrap.remove();
    enemyBars.clear();
  }

  function applyZoneTheme(zone?: OutdoorZoneId): void {
    const theme = ZONES[zone ?? 'mossbottom'].theme;
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.fog, 28, 70);
    groundMat.color.setHex(theme.ground);
  }

  function restart(): void {
    arena?.dispose();
    clearTelegraphs();
    clearEnemyBars();
    for (const ft of floatingTexts) ft.el.remove();
    floatingTexts.length = 0;

    const sc = SCENARIOS[scenarioId] ?? SCENARIO_LIST[0];
    policy = POLICIES[policyId] ?? POLICIES.tactical;
    const loadout = defaultLoadoutForScenario(sc, classParam, tierParam, levelParam);
    loadoutLabel = formatLoadoutLabel(loadout);
    policyRng = mulberry32(seed ^ 0x9e3779b9);

    applyZoneTheme(sc.zone);
    defendRing.visible = sc.defendRadius !== undefined;
    if (sc.defendRadius !== undefined) {
      defendRing.scale.set(sc.defendRadius, 1, sc.defendRadius);
    }

    arena = createArena(sc, loadout, seed);
    prevPlayerPos.copy(player.position);
    simAcc = 0;
    bannerEl.style.display = 'none';
    bossBannerEl.style.display = 'none';
    bossBannerTimer = 0;
    updateControlLabels();
    renderHud(arena.observe());
  }

  function stepSimOnce(): void {
    if (!arena || arena.isDone()) return;
    const obs = arena.observe();
    const action = policy.decide(obs, policyRng);
    arena.step(action, SIM_STEP_S);
  }

  function syncTelegraphs(obs: SimObservation): void {
    const activeIds = new Set<number>();
    for (const t of obs.telegraphs) {
      activeIds.add(t.id);
      let tm = telegraphMeshes.get(t.id);
      if (!tm) {
        tm = buildTelegraphGroup(t);
        scene.add(tm.group);
        telegraphMeshes.set(t.id, tm);
      }
      const prog = t.duration > 0 ? Math.min(1, Math.max(0.08, t.age / t.duration)) : 1;
      if (t.kind === 'lane') {
        tm.fill.scale.set(1, 1, prog);
      } else {
        tm.fill.scale.set(prog, prog, 1);
      }
    }
    for (const [id, tm] of telegraphMeshes) {
      if (!activeIds.has(id)) {
        scene.remove(tm.group);
        telegraphMeshes.delete(id);
      }
    }
  }

  const projVec = new THREE.Vector3();

  function syncEnemyBarsAndFloating(dt: number): void {
    if (noHud) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const liveIds = new Set<number>();

    for (const e of allEntities()) {
      if (e.kind !== 'enemy' || e.dead) continue;
      liveIds.add(e.id);
      let bar = enemyBars.get(e.id);
      if (!bar) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:2px;';
        const label = document.createElement('div');
        label.style.cssText = 'font-size:11px;color:#fff3d6;text-shadow:0 1px 2px #000;white-space:nowrap;';
        const track = document.createElement('div');
        track.style.cssText = 'width:58px;height:6px;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.25);border-radius:3px;overflow:hidden;';
        const fill = document.createElement('div');
        fill.style.cssText = 'height:100%;background:#e0483e;width:100%;';
        track.appendChild(fill);
        wrap.append(label, track);
        worldOverlay.appendChild(wrap);
        bar = { wrap, fill, label };
        enemyBars.set(e.id, bar);
      }
      projVec.set(e.position.x, 1.8, e.position.z).project(camera);
      if (projVec.z > 1) {
        bar.wrap.style.display = 'none';
      } else {
        bar.wrap.style.display = 'flex';
        bar.wrap.style.left = `${(projVec.x * 0.5 + 0.5) * w}px`;
        bar.wrap.style.top = `${(-projVec.y * 0.5 + 0.5) * h}px`;
        bar.label.textContent = `${e.name} (${Math.max(0, Math.ceil(e.hp))}/${e.maxHp})`;
        bar.fill.style.width = `${Math.max(0, Math.min(100, (e.hp / Math.max(1, e.maxHp)) * 100))}%`;
      }
    }

    for (const [id, bar] of enemyBars) {
      if (!liveIds.has(id)) {
        bar.wrap.remove();
        enemyBars.delete(id);
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.age += dt;
      if (ft.age >= ft.duration) {
        ft.el.remove();
        floatingTexts.splice(i, 1);
        continue;
      }
      projVec.set(ft.x, ft.y + ft.age * 1.1, ft.z).project(camera);
      ft.el.style.left = `${(projVec.x * 0.5 + 0.5) * w}px`;
      ft.el.style.top = `${(-projVec.y * 0.5 + 0.5) * h}px`;
      ft.el.style.opacity = String(1 - ft.age / ft.duration);
    }
  }

  function renderHud(obs: SimObservation): void {
    if (noHud || !arena) return;
    const resPct = obs.resource.max > 0 ? Math.round((obs.resource.value / obs.resource.max) * 100) : 0;
    const hpPct = obs.maxHp > 0 ? Math.round((Math.max(0, obs.hp) / obs.maxHp) * 100) : 0;
    const mpPct = obs.maxMp > 0 ? Math.round((Math.max(0, obs.mp) / obs.maxMp) * 100) : 0;
    const r = arena.result(seed);

    hudCard.innerHTML = `
      <div style="font-weight:bold;font-size:14px;color:#ffe6b3;margin-bottom:4px;">${arena.scenario.name}</div>
      <div style="font-size:11px;color:#c9ae7a;margin-bottom:8px;">${loadoutLabel} · ${policy.name} · Seed ${seed} · t=${obs.time.toFixed(1)}s</div>
      <div style="margin-bottom:4px;font-size:12px;">HP ${Math.max(0, Math.ceil(obs.hp))}/${obs.maxHp} (${hpPct}%)</div>
      <div style="height:8px;background:#2a1b18;border-radius:4px;overflow:hidden;margin-bottom:6px;">
        <div style="height:100%;width:${hpPct}%;background:#46c45a;"></div>
      </div>
      <div style="margin-bottom:4px;font-size:12px;">MP ${Math.max(0, Math.ceil(obs.mp))}/${obs.maxMp} · ${obs.resource.kind} ${Math.round(obs.resource.value)}/${obs.resource.max}</div>
      <div style="height:6px;background:#1a2233;border-radius:4px;overflow:hidden;margin-bottom:6px;">
        <div style="height:100%;width:${obs.resource.kind === 'mana' ? mpPct : resPct}%;background:#4b9bff;"></div>
      </div>
      <div style="font-size:11px;color:#c9ae7a;">
        Hits: ${r.playerHitsLanded} (${r.playerCrits} crit) · Dodged: ${r.telegraphsDodged}/${r.telegraphsSpawned} · Pots: ${r.potionsUsed}
      </div>
    `;

    if (arena.isDone()) {
      bannerEl.style.display = 'block';
      if (r.won) {
        bannerEl.style.borderColor = '#5ae06c';
        bannerEl.style.color = '#b8ffbf';
        bannerEl.textContent = `VICTORY in ${r.durationSeconds.toFixed(1)}s (${Math.round(r.hpRemainingPct * 100)}% HP)`;
      } else {
        bannerEl.style.borderColor = '#ff6b6b';
        bannerEl.style.color = '#ffc2c2';
        bannerEl.textContent = `DEFEAT (${r.deathCause}) at ${r.durationSeconds.toFixed(1)}s`;
      }
    }
  }

  // Control event wiring
  scenarioSel.addEventListener('change', () => { scenarioId = scenarioSel.value; restart(); });
  policySel.addEventListener('change', () => { policyId = policySel.value; restart(); });
  classSel.addEventListener('change', () => { classParam = classSel.value === 'auto' ? null : classSel.value; restart(); });
  seedInput.addEventListener('change', () => { seed = Math.max(1, Number(seedInput.value) || 1); restart(); });
  speedSel.addEventListener('change', () => { speed = Number(speedSel.value) || 1; });
  playBtn.addEventListener('click', () => { paused = !paused; updateControlLabels(); });
  stepBtn.addEventListener('click', () => { paused = true; updateControlLabels(); stepSimOnce(); });
  restartBtn.addEventListener('click', () => restart());

  restart();

  let last = performance.now();
  function frame(now: number): void {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (heldKeys.has('ArrowLeft')) camYaw += dt * 1.6;
    if (heldKeys.has('ArrowRight')) camYaw -= dt * 1.6;
    if (heldKeys.has('ArrowUp')) camPitch = Math.min(1.35, camPitch + dt * 1.1);
    if (heldKeys.has('ArrowDown')) camPitch = Math.max(0.2, camPitch - dt * 1.1);

    if (!paused && arena && !arena.isDone()) {
      simAcc += dt * speed;
      while (simAcc >= SIM_STEP_S && !arena.isDone()) {
        stepSimOnce();
        simAcc -= SIM_STEP_S;
      }
    }

    if (bossBannerTimer > 0) {
      bossBannerTimer -= dt;
      if (bossBannerTimer <= 0) bossBannerEl.style.display = 'none';
    }

    // Animate player & enemies
    if (dt > 0) {
      playerVel.set(
        (player.position.x - prevPlayerPos.x) / dt,
        0,
        (player.position.z - prevPlayerPos.z) / dt,
      );
      prevPlayerPos.copy(player.position);
    }
    flatPlayerPos.set(player.position.x, 0, player.position.z);
    player.model?.update({
      position: flatPlayerPos,
      velocity: playerVel,
      facing: player.facing,
      grounded: true,
      jumpsUsed: 0,
    }, dt);
    if (player.swing > 0 && player.model) {
      player.swing -= dt;
      player.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, player.swing) / 0.35));
    }

    syncEntityVisuals(dt, true);

    if (arena) {
      const obs = arena.observe();
      syncTelegraphs(obs);
      renderHud(obs);
    }

    // Follow player smoothly
    camFocus.lerp(new THREE.Vector3(player.position.x, 0.9, player.position.z), Math.min(1, dt * 8));
    const horiz = Math.cos(camPitch) * camDist;
    camera.position.set(
      camFocus.x + Math.sin(camYaw) * horiz,
      camFocus.y + Math.sin(camPitch) * camDist,
      camFocus.z + Math.cos(camYaw) * horiz,
    );
    camera.lookAt(camFocus);

    syncEnemyBarsAndFloating(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
