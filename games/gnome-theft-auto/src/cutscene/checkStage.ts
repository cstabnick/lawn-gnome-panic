// `?cutscenecheck`: run the line-of-sight and collision check on every scene in the live game (colliders, terrain,
// and a raycast against the real meshes) and show the report.
import * as THREE from 'three';
import type { Box } from '../types';
import { checkScript, envFor, formatIssues } from './check';
import type { LosIssue } from './los';
import { introScript } from './intro';
import { SCENES } from './scenes';
import type { SceneScript } from './script';
import { lineTiming } from './textSpeed';
import { compile, sampleFrame, targetPoint } from './timeline';

export interface CheckStageOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  boxes: readonly Box[];
  ui: HTMLElement;
  /** Where the player starts (the intro ends behind it). */
  spawn: { x: number; z: number; yaw: number };
}

/** Raycast sample spacing, seconds. */
const MESH_DT = 0.25;
/** A hit this close to the target does not hide it. */
const TARGET_SLACK = 0.6;

/** Whether a mesh hit can block a shot: visible, not a sprite or point cloud, not see-through. */
function blocksView(obj: THREE.Object3D, mat: THREE.Material | THREE.Material[] | null): boolean {
  if (obj instanceof THREE.Sprite || obj instanceof THREE.Points) return false;
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (!o.visible) return false;
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (m && m.transparent && m.opacity < 0.5) return false;
  return true;
}

/** Raycast every frame of a world-stage script against the real scene meshes. */
function meshIssues(script: SceneScript, opts: CheckStageOptions): LosIssue[] {
  const tl = compile(script, lineTiming('normal'));
  const env = envFor(script);
  const ray = new THREE.Raycaster();
  ray.camera = opts.camera;
  ray.near = 0;
  const out: LosIssue[] = [];
  let prev = new Set<string>();
  const end = Math.max(tl.duration, MESH_DT);
  for (let t = 0; t <= end + 1e-6; t += MESH_DT) {
    const frame = sampleFrame(tl, t, env);
    const cam = frame.camera;
    const aim = (cam.target !== null ? targetPoint(frame, cam.target) : null) ?? cam.look;
    const from = new THREE.Vector3(...cam.pos);
    const dir = new THREE.Vector3(...aim).sub(from);
    const dist = dir.length();
    const now = new Set<string>();
    if (dist > TARGET_SLACK) {
      ray.set(from, dir.normalize());
      ray.far = dist - TARGET_SLACK;
      const hits = ray.intersectObjects(opts.scene.children, true);
      const hit = hits.find((h) => blocksView(h.object, h.object instanceof THREE.Mesh || h.object instanceof THREE.Line ? h.object.material : null));
      if (hit) {
        const who = cam.target ?? undefined;
        const key = `target-hidden|${who ?? ''}|${cam.step}`;
        now.add(key);
        if (!prev.has(key)) {
          out.push({
            kind: 'target-hidden', t, step: cam.step, who,
            at: [hit.point.x, hit.point.y, hit.point.z],
            detail: `hidden by mesh "${hit.object.name || hit.object.type}"`,
          });
        }
      }
    }
    prev = now;
  }
  return out;
}

/** Check every scene, show the report in #ui, log it, and expose the counts on window.__cutsceneCheck. */
export function runCutsceneCheck(opts: CheckStageOptions): void {
  const scripts: SceneScript[] = [introScript(opts.spawn), ...Object.values(SCENES)];
  const byScene: Record<string, LosIssue[]> = {};
  const texts: string[] = [];
  let total = 0;
  for (const script of scripts) {
    const issues = checkScript(script, opts.boxes);
    if (script.stage.kind === 'world') issues.push(...meshIssues(script, opts));
    byScene[script.id] = issues;
    total += issues.length;
    texts.push(formatIssues(script.id, issues));
  }
  const report = texts.join('\n\n');
  console.log(`cutscene check: ${total} problem(s)\n${report}`);
  (window as unknown as { __cutsceneCheck: { total: number; byScene: Record<string, LosIssue[]> } }).__cutsceneCheck = { total, byScene };

  const doc = opts.ui.ownerDocument;
  const panel = doc.createElement('div');
  panel.id = 'cutscene-check';
  panel.dataset.issues = String(total);
  Object.assign(panel.style, {
    position: 'fixed', top: '10px', left: '10px', maxHeight: '80vh', maxWidth: 'calc(100vw - 20px)', overflow: 'auto',
    font: '12px monospace', color: '#e8f0e0', background: 'rgba(12, 14, 12, 0.94)', padding: '10px',
    borderRadius: '6px', zIndex: '10000', boxSizing: 'border-box',
  });
  const close = doc.createElement('button');
  close.textContent = 'Close';
  close.type = 'button';
  Object.assign(close.style, { minWidth: '44px', minHeight: '44px', marginBottom: '6px', font: '12px monospace' });
  close.addEventListener('click', () => panel.remove());
  const pre = doc.createElement('pre');
  pre.textContent = report;
  Object.assign(pre.style, { margin: '0', whiteSpace: 'pre-wrap' });
  panel.append(close, pre);
  opts.ui.appendChild(panel);
}
