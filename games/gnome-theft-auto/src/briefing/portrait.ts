// Talking-head portraits for the mission comms panel: a head-and-shoulders render of a gnome (the same model the
// game builds, from @lawn/gnome), drawn once into a PNG data URL and cached per speaker. One offscreen WebGL renderer
// is shared by every portrait. Where WebGL is unavailable (or a render throws) a flat 2D drawing of the same gnome is
// used instead, so the panel always has a face.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook } from '@lawn/gnome';

const SIZE = 128;
const FOV = 30;
/** Camera aims at this fraction of the gnome's height (the head, not the boots). */
const AIM = 0.7;
/** Visible height as a fraction of the gnome's height: the head and shoulders. */
const FRAME = 0.62;
/** Yaw of the camera around the gnome, radians (a three-quarter view). */
const YAW = 0.45;

const cache = new Map<string, string>();
let renderer: THREE.WebGLRenderer | null = null;
let webglBroken = false;

function cssColor(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}

function cacheKey(key: string, look: GnomeLook): string {
  return `${key}|${JSON.stringify(look)}`;
}

function getRenderer(): THREE.WebGLRenderer | null {
  if (webglBroken) return null;
  if (renderer) return renderer;
  try {
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(SIZE, SIZE, false);
    renderer = r;
    return r;
  } catch {
    webglBroken = true;
    return null;
  }
}

/** Renders the gnome's head and shoulders with the shared renderer. Throws if WebGL cannot draw. */
function render3d(look: GnomeLook): string {
  const r = getRenderer();
  if (!r) throw new Error('no WebGL');
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 4);
  scene.add(key);

  const model = createGnomeModel(look);
  scene.add(model.object);
  try {
    const box = new THREE.Box3().setFromObject(model.object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const h = Math.max(0.01, size.y);
    const target = new THREE.Vector3(center.x, box.min.y + AIM * h, center.z);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, Math.max(20, h * 20));
    const dist = (FRAME * h) / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(
      target.x + Math.sin(YAW) * dist,
      target.y + 0.12 * h,
      target.z + Math.cos(YAW) * dist,
    );
    camera.lookAt(target);

    r.setClearColor(0x000000, 0);
    r.render(scene, camera);
    return r.domElement.toDataURL('image/png');
  } finally {
    scene.remove(model.object);
    model.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
  }
}

/** A flat 2D stand-in: a round face, a pointed hat with a brim, and a half-disc beard. */
function draw2d(look: GnomeLook): string {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  if (look.beard !== null) {
    ctx.fillStyle = cssColor(look.beard);
    ctx.beginPath();
    ctx.arc(64, 80, 30, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = cssColor(look.skin);
  ctx.beginPath();
  ctx.arc(64, 74, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cssColor(look.hat);
  ctx.beginPath();
  ctx.moveTo(26, 50);
  ctx.lineTo(102, 50);
  ctx.lineTo(64, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(20, 46, 88, 8);
  return canvas.toDataURL('image/png');
}

/** The portrait as a PNG data URL (cached per key + look). Falls back to a 2D drawing when WebGL is unavailable. */
export function portraitUrl(key: string, look: GnomeLook): string {
  const ck = cacheKey(key, look);
  const hit = cache.get(ck);
  if (hit) return hit;
  let url: string;
  try {
    url = render3d(look);
  } catch {
    url = draw2d(look);
  }
  cache.set(ck, url);
  return url;
}

/** An <img> showing the portrait, ready to drop into the comms card. */
export function portraitElement(key: string, look: GnomeLook): HTMLImageElement {
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  img.src = portraitUrl(key, look);
  return img;
}
