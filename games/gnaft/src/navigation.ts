// Islands, crates, telescope and charting.
import * as THREE from 'three';
import { COLORS, ISLANDS, ISLAND_ORDER, KEYS, RAFT_TOP, SEA, TELESCOPE, TUNING } from './config';
import type { Ctx, IslandId, System } from './config';
import { castOff, chartCourse, islandRelPos, lootCrate, notify, spotIsland } from './rules';
import { createMowerModel } from './mowerModels';
import { sfx } from './audio';

const DEG = Math.PI / 180;
const CRATE_WOOD = 0x9c6b3c;
const CRATE_OPENED = 0x5a3a1e;
const CRATE_SIZE = 0.8;
const CRATE_REACH = 1.8;
const EYE_HEIGHT = 1.3;
const PITCH_LIMIT = 0.6;

interface CrateVisual { body: THREE.Mesh; bodyMat: THREE.MeshStandardMaterial; lid: THREE.Mesh }
interface IslandVisual { group: THREE.Group; crates: CrateVisual[]; beacon: THREE.Mesh }

function std(color: number, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function solid(geo: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

function at<T extends THREE.Object3D>(obj: T, x: number, y: number, z: number): T {
  obj.position.set(x, y, z);
  return obj;
}

function polar(angle: number, dist: number): { x: number; z: number } {
  return { x: Math.sin(angle) * dist, z: Math.cos(angle) * dist };
}

function crateOffset(id: IslandId, k: number): { x: number; z: number } {
  const n = ISLANDS[id].crates.length;
  return polar((k * 2 * Math.PI) / n, ISLANDS[id].radius * 0.55);
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function makePalm(): THREE.Group {
  const palm = new THREE.Group();
  const trunkMat = std(0x8b5a2b, 0.9);
  const trunk: [number, number, number, number][] = [
    [0.6, 0, 0.24, 1.2],
    [1.8, -0.08, 0.2, 1.2],
    [2.9, 0.06, 0.18, 1.0],
  ];
  for (const [y, dx, r, h] of trunk) {
    palm.add(at(solid(new THREE.CylinderGeometry(r * 0.85, r, h, 8), trunkMat), dx, y, 0));
  }
  const crown = at(new THREE.Group(), 0, 3.5, 0);
  palm.add(crown);
  const leafMat = std(COLORS.grassTall, 0.7);
  for (let i = 0; i < 5; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 5) * Math.PI * 2;
    crown.add(pivot);
    const leaf = at(solid(new THREE.BoxGeometry(0.5, 0.12, 2.2), leafMat), 0, -0.25, 1.0);
    leaf.rotation.x = 0.35;
    pivot.add(leaf);
  }
  return palm;
}

function buildIsland(id: IslandId): IslandVisual {
  const def = ISLANDS[id];
  const r = def.radius;
  const group = new THREE.Group();

  // Sand mound, top at RAFT_TOP, with a grass patch on top.
  group.add(at(solid(new THREE.CylinderGeometry(r, r + 4, 1.2, 40), std(COLORS.sand, 0.95)), 0, RAFT_TOP - 0.6, 0));
  group.add(at(solid(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.1, 24), std(COLORS.grass, 0.9)), 0, RAFT_TOP + 0.05, 0));

  // Palm trees near the edge.
  for (const a of [0.5, 2.6, 4.5]) {
    const p = polar(a, r * 0.75);
    group.add(at(makePalm(), p.x, RAFT_TOP, p.z));
  }

  // Theme props.
  if (id === 'scrapyard') {
    [1.5, 3.4, 5.4].forEach((a, i) => {
      const p = polar(a, r * 0.35);
      const heap = solid(new THREE.DodecahedronGeometry(1.4 + i * 0.2, 0), std(COLORS.reelMetal, 0.5, 0.6));
      heap.scale.set(1, 0.7, 1);
      group.add(at(heap, p.x, RAFT_TOP + 0.6, p.z));
    });
    const s = polar(3.9, r * 0.4);
    const shed = new THREE.Group();
    shed.add(at(solid(new THREE.BoxGeometry(3, 2.4, 2.6), std(0x8b4a2b, 0.9)), 0, 1.2, 0));
    shed.add(at(solid(new THREE.BoxGeometry(3.3, 0.2, 2.9), std(0x5a5a5a, 0.6, 0.4)), 0, 2.5, 0));
    shed.position.set(s.x, RAFT_TOP, s.z);
    shed.rotation.y = 3.9;
    group.add(shed);
  } else if (id === 'fuelDepot') {
    const drumMat = std(COLORS.mowerRed, 0.6);
    const offsets = [[0, 0], [1.4, 0], [0.7, 1.2], [2.1, 1.2], [0.7, -1.2]];
    for (const a of [1.2, 4.0]) {
      const c = polar(a, r * 0.4);
      for (const [dx, dz] of offsets) {
        group.add(at(solid(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 16), drumMat), c.x + dx, RAFT_TOP + 0.7, c.z + dz));
      }
    }
    const pumpPos = polar(5.6, r * 0.45);
    const pump = new THREE.Group();
    pump.add(at(solid(new THREE.BoxGeometry(0.8, 1.6, 0.6), std(COLORS.mowerYellow, 0.6)), 0, 0.8, 0));
    pump.add(at(solid(new THREE.BoxGeometry(0.1, 0.1, 0.9), std(COLORS.mowerDark, 0.7)), 0.45, 0.6, 0.45));
    pump.position.set(pumpPos.x, RAFT_TOP, pumpPos.z);
    pump.rotation.y = 5.6;
    group.add(pump);
  } else {
    // mowerGraveyard: four red riding mowers half-sunk in the sand.
    [0.3, 1.9, 3.5, 5.1].forEach((a, i) => {
      const p = polar(a, r * 0.45);
      const mower = createMowerModel('red');
      mower.setNight(0);
      mower.group.scale.setScalar(1.3);
      mower.group.rotation.set(0.12, a, 0.2 + i * 0.03, 'YXZ');
      mower.group.position.set(p.x, RAFT_TOP - 0.4, p.z);
      group.add(mower.group);
    });
  }

  // Crates on the top.
  const crates: CrateVisual[] = [];
  for (let k = 0; k < def.crates.length; k++) {
    const o = crateOffset(id, k);
    const bodyMat = std(CRATE_WOOD, 0.9);
    const body = at(solid(new THREE.BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE), bodyMat), o.x, RAFT_TOP + CRATE_SIZE / 2, o.z);
    const lid = at(solid(new THREE.BoxGeometry(CRATE_SIZE * 1.05, 0.1, CRATE_SIZE * 1.05), bodyMat), o.x, RAFT_TOP + CRATE_SIZE + 0.05, o.z);
    group.add(body, lid);
    crates.push({ body, bodyMat, lid });
  }

  // Beacon, shown once spotted.
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 80, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.55, fog: false }),
  );
  beacon.position.y = 40;
  beacon.visible = false;
  group.add(beacon);

  return { group, crates, beacon };
}

function div(id: string, css: string, text = ''): HTMLDivElement {
  const el = document.createElement('div');
  if (id) el.id = id;
  el.style.cssText = css;
  el.textContent = text;
  return el;
}

const LABEL_SHADOW = 'text-shadow:0 1px 3px #000;';

export function createNavigation(ctx: Ctx): System {
  const visuals = {} as Record<IslandId, IslandVisual>;
  for (const id of ISLAND_ORDER) {
    visuals[id] = buildIsland(id);
    ctx.scene.add(visuals[id].group);
  }

  // ---- DOM
  const prompt = div(
    'rg-prompt',
    'position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);display:none;pointer-events:none;' +
      'padding:6px 14px;background:rgba(0,0,0,0.6);color:#fff;font:600 16px sans-serif;border-radius:6px;white-space:nowrap;',
    'E: open crate',
  );

  const scopeEl = div(
    'rg-scope',
    'position:absolute;inset:0;display:none;pointer-events:none;' +
      'background:radial-gradient(circle, transparent 38%, rgba(0,0,0,0.92) 40%);',
  );
  const hline = div('', 'position:absolute;left:50%;top:50%;width:40px;height:1px;transform:translate(-50%,-50%);background:rgba(255,255,255,0.85);');
  const vline = div('', 'position:absolute;left:50%;top:50%;width:1px;height:40px;transform:translate(-50%,-50%);background:rgba(255,255,255,0.85);');
  const labelTop = div('', `position:absolute;left:50%;top:calc(50% + 48px);transform:translateX(-50%);color:#fff;font:600 18px sans-serif;white-space:nowrap;${LABEL_SHADOW}`);
  const labelBottom = div('', `position:absolute;left:50%;top:calc(50% + 74px);transform:translateX(-50%);color:#ffe066;font:500 15px sans-serif;white-space:nowrap;${LABEL_SHADOW}`);
  const hint = div('', `position:absolute;left:50%;bottom:24px;transform:translateX(-50%);color:#fff;font:14px sans-serif;white-space:nowrap;${LABEL_SHADOW}`, 'T: put the telescope away');
  scopeEl.append(hline, vline, labelTop, labelBottom, hint);

  const compass = div(
    'rg-compass',
    'position:absolute;left:50%;top:12px;transform:translateX(-50%);display:none;pointer-events:none;' +
      'padding:6px 14px;background:rgba(0,0,0,0.45);color:#fff;font:500 15px sans-serif;border-radius:6px;white-space:nowrap;',
  );
  ctx.ui.append(scopeEl, prompt, compass);

  // ---- telescope state
  let scoped = false;
  let yaw = 0;
  let pitch = 0;
  let spotTarget: IslandId | null = null;
  let spotTimer = 0;
  let compassText = '';

  function enterScope(): void {
    scoped = true;
    ctx.camera.fov = TELESCOPE.fov;
    ctx.camera.updateProjectionMatrix();
    const fog = ctx.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = SEA.fogFar;
      fog.far = TELESCOPE.range;
    }
    yaw = ctx.state.player.facing;
    pitch = 0;
    spotTarget = null;
    spotTimer = 0;
    scopeEl.style.display = 'block';
  }

  function leaveScope(): void {
    scoped = false;
    ctx.camera.fov = TELESCOPE.normalFov;
    ctx.camera.updateProjectionMatrix();
    const fog = ctx.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = SEA.fogNear;
      fog.far = SEA.fogFar;
    }
    spotTarget = null;
    spotTimer = 0;
    scopeEl.style.display = 'none';
  }

  function nearestCrate(id: IslandId): number {
    const rel = islandRelPos(ctx.state, id);
    const p = ctx.state.player.position;
    let best = -1;
    let bestD = Infinity;
    for (let k = 0; k < ISLANDS[id].crates.length; k++) {
      if (ctx.state.islands[id].looted[k]) continue;
      const o = crateOffset(id, k);
      const d = Math.hypot(p.x - (rel.x + o.x), p.z - (rel.z + o.z));
      if (d <= CRATE_REACH && d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }

  function updateScope(dt: number): void {
    const state = ctx.state;
    const camera = ctx.camera;

    // Look around.
    const look = ctx.input.look();
    const factor = TELESCOPE.fov / TELESCOPE.normalFov;
    yaw -= look.dx * TUNING.mouseSensitivity * factor;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + look.dy * TUNING.mouseSensitivity * factor));

    // Camera pose.
    const p = state.player.position;
    const eyeX = p.x;
    const eyeY = p.y + EYE_HEIGHT;
    const eyeZ = p.z;
    const cp = Math.cos(pitch);
    const dx = Math.sin(yaw) * cp;
    const dy = Math.sin(pitch);
    const dz = Math.cos(yaw) * cp;
    camera.position.set(eyeX, eyeY, eyeZ);
    camera.lookAt(eyeX + dx, eyeY + dy, eyeZ + dz);

    // Aim: the island whose bearing is closest to the view direction, within tolerance.
    const tol = TELESCOPE.aimToleranceDeg * DEG;
    let aimed: IslandId | null = null;
    let aimedDist = 0;
    let best = Infinity;
    for (const id of ISLAND_ORDER) {
      const rel = islandRelPos(state, id);
      const dist = Math.hypot(rel.x, rel.z);
      if (dist > TELESCOPE.range) continue;
      const bearing = Math.atan2(rel.x, rel.z);
      const diff = Math.abs(wrapAngle(bearing - yaw));
      if (diff <= tol && diff < best) {
        best = diff;
        aimed = id;
        aimedDist = dist;
      }
    }

    // Spotting: hold aim for spotSeconds.
    let progress = 0;
    if (aimed && !state.islands[aimed].spotted) {
      if (aimed !== spotTarget) {
        spotTarget = aimed;
        spotTimer = 0;
      }
      spotTimer += dt;
      progress = Math.min(1, spotTimer / TELESCOPE.spotSeconds);
      if (spotTimer >= TELESCOPE.spotSeconds) {
        spotIsland(state, aimed);
        notify(state, `Spotted ${ISLANDS[aimed].name}! Press C to chart a course.`);
        sfx('spot');
        spotTarget = null;
        spotTimer = 0;
      }
    } else {
      spotTarget = null;
      spotTimer = 0;
    }

    if (aimed && state.islands[aimed].spotted && ctx.input.pressed(KEYS.chart)) {
      chartCourse(state, aimed);
      sfx('click');
    }

    // Overlay label.
    if (aimed) {
      labelTop.textContent = `${ISLANDS[aimed].name} · ${Math.round(aimedDist)} m`;
      labelBottom.textContent = state.islands[aimed].spotted
        ? 'C: chart course'
        : `Spotting ${Math.floor(progress * 100)}%`;
    } else {
      labelTop.textContent = 'Scanning the horizon...';
      labelBottom.textContent = '';
    }
  }

  return {
    update(dt: number) {
      const state = ctx.state;
      const input = ctx.input;

      // 1. Mode switches in and out of the telescope.
      if (input.pressed(KEYS.telescope)) {
        if (state.mode === 'play') {
          if (state.hasTelescope) state.mode = 'telescope';
          else notify(state, 'Craft a telescope first (Tab)');
        } else if (state.mode === 'telescope') {
          state.mode = 'play';
        }
      }
      if (state.mode === 'telescope' && !scoped) enterScope();
      else if (state.mode !== 'telescope' && scoped) leaveScope();

      // 2. Telescope aim, or docked actions in play.
      if (scoped) {
        updateScope(dt);
      } else if (state.mode === 'play' && state.sea.docked) {
        const id = state.sea.docked;
        if (input.pressed(KEYS.chart)) {
          castOff(state);
          sfx('click');
        } else {
          const k = nearestCrate(id);
          if (k >= 0 && input.pressed(KEYS.interact) && lootCrate(state, id, k)) sfx('loot');
        }
      }

      // 3. Crate prompt.
      const promptCrate = state.mode === 'play' && state.sea.docked ? nearestCrate(state.sea.docked) : -1;
      prompt.style.display = promptCrate >= 0 ? 'block' : 'none';

      // 4. Islands: position, beacon, crate state.
      for (const id of ISLAND_ORDER) {
        const v = visuals[id];
        const rel = islandRelPos(state, id);
        v.group.position.set(rel.x, 0, rel.z);
        const isl = state.islands[id];
        v.beacon.visible = isl.spotted && state.sea.docked !== id;
        for (let k = 0; k < v.crates.length; k++) {
          const c = v.crates[k];
          const opened = isl.looted[k];
          c.lid.visible = !opened;
          c.bodyMat.color.setHex(opened ? CRATE_OPENED : CRATE_WOOD);
        }
      }

      // 5. Compass.
      compass.style.display = state.mode !== 'title' ? 'block' : 'none';
      let text: string;
      if (state.sea.course) {
        const rel = islandRelPos(state, state.sea.course);
        text = `Sailing to ${ISLANDS[state.sea.course].name} — ${Math.round(Math.hypot(rel.x, rel.z))} m`;
      } else if (state.sea.docked) {
        text = `Docked at ${ISLANDS[state.sea.docked].name} — C to cast off`;
      } else {
        text = 'Drifting...';
      }
      if (text !== compassText) {
        compassText = text;
        compass.textContent = text;
      }
    },
  };
}
